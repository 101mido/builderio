import "dotenv/config";
import express, { RequestHandler } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { promises as fsPromises } from "fs";
import { handleDemo } from "./routes/demo";
import { handleUpload } from "./routes/upload";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

// Data storage paths
const DATA_DIR = path.join(process.cwd(), "data");
const TENANTS_FILE = path.join(DATA_DIR, "tenants.json");
const CONFIGS_FILE = path.join(DATA_DIR, "configs.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Helper functions for tenant data
async function loadTenants(): Promise<Record<string, unknown>> {
  try {
    const data = await fs.readFile(TENANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveTenants(tenants: Record<string, unknown>) {
  await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
}

async function loadConfigs(): Promise<Record<string, unknown>> {
  try {
    const data = await fs.readFile(CONFIGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfigs(configs: Record<string, unknown>) {
  await fs.writeFile(CONFIGS_FILE, JSON.stringify(configs, null, 2));
}

export function createServer() {
  const app = express();

  // Initialize data directory
  ensureDataDir().catch(console.error);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Tenant endpoints
  app.get("/api/tenants", (async (_req, res) => {
    try {
      const tenants = await loadTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error loading tenants:", error);
      res.status(500).json({ error: "Failed to load tenants" });
    }
  }) as RequestHandler);

  app.post("/api/tenants", (async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: "Tenant name is required" });
        return;
      }

      const tenants = await loadTenants();
      if (tenants[name]) {
        res.status(400).json({ error: "Tenant already exists" });
        return;
      }

      tenants[name] = {
        name,
        created_at: new Date().toISOString(),
      };

      await saveTenants(tenants);
      res.json(tenants[name]);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ error: "Failed to create tenant" });
    }
  }) as RequestHandler);

  // Tenant config endpoints
  app.get("/api/tenants/:tenantName/config", (async (req, res) => {
    try {
      const { tenantName } = req.params;
      const configs = await loadConfigs();

      const defaultConfig = {
        source: "/cc1_recordings",
        destination: "/cc1_transcriptions",
        api_endpoint: "",
        webhooks: [{ index: 0, url: "" }],
        metrics: [],
      };

      res.json(configs[tenantName] || defaultConfig);
    } catch (error) {
      console.error("Error loading config:", error);
      res.status(500).json({ error: "Failed to load config" });
    }
  }) as RequestHandler);

  app.post("/api/tenants/:tenantName/config", (async (req, res) => {
    try {
      const { tenantName } = req.params;
      const config = req.body;

      const configs = await loadConfigs();
      configs[tenantName] = config;
      await saveConfigs(configs);

      res.json(config);
    } catch (error) {
      console.error("Error saving config:", error);
      res.status(500).json({ error: "Failed to save config" });
    }
  }) as RequestHandler);

  // File listing endpoint
  app.get("/api/files", (async (req, res) => {
    try {
      const tenantName = (req.query.tenant_name as string) || "default";
      const configs = await loadConfigs();
      const tenantConfig = (configs[tenantName] as Record<string, unknown>) || {
        destination: "/cc1_transcriptions",
        source: "/cc1_recordings",
      };

      const destination = (tenantConfig.destination ||
        "/cc1_transcriptions") as string;
      const source = (tenantConfig.source || "/cc1_recordings") as string;

      const filesInfo = [];

      try {
        const files = await fs.readdir(source);
        const audioExtensions = [".wav", ".mp3", ".m4a", ".flac"];

        for (const file of files) {
          const filePath = path.join(source, file);
          const stat = await fs.stat(filePath);

          if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (audioExtensions.includes(ext)) {
              const baseName = path.basename(file, ext);
              const vttFile = path.join(destination, `${baseName}.vtt`);
              const jsonFile = path.join(destination, `${baseName}.json`);

              try {
                const vttExists = await fs
                  .access(vttFile)
                  .then(() => true)
                  .catch(() => false);
                const jsonExists = await fs
                  .access(jsonFile)
                  .then(() => true)
                  .catch(() => false);

                filesInfo.push({
                  name: file,
                  base_name: baseName,
                  has_vtt: vttExists,
                  has_json: jsonExists,
                  uploaded_at: new Date(stat.mtime).toISOString(),
                });
              } catch {
                // Skip files that can't be checked
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Source directory not found or not readable: ${source}`);
      }

      res.json({
        success: true,
        files: filesInfo.sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime(),
        ),
        total: filesInfo.length,
      });
    } catch (error) {
      console.error("File listing error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list files",
      });
    }
  }) as RequestHandler);

  // File content endpoints
  app.get("/api/files/:baseName/vtt", (async (req, res) => {
    try {
      const { baseName } = req.params;
      const tenantName = (req.query.tenant_name as string) || "default";
      const configs = await loadConfigs();
      const tenantConfig = (configs[tenantName] as Record<string, unknown>) || {
        destination: "/cc1_transcriptions",
      };

      const destination = (tenantConfig.destination ||
        "/cc1_transcriptions") as string;
      const vttFile = path.join(destination, `${baseName}.vtt`);

      res.sendFile(vttFile);
    } catch (error) {
      console.error("VTT file error:", error);
      res.status(404).json({ error: "VTT file not found" });
    }
  }) as RequestHandler);

  app.get("/api/files/:baseName/json", (async (req, res) => {
    try {
      const { baseName } = req.params;
      const tenantName = (req.query.tenant_name as string) || "default";
      const configs = await loadConfigs();
      const tenantConfig = (configs[tenantName] as Record<string, unknown>) || {
        destination: "/cc1_transcriptions",
      };

      const destination = (tenantConfig.destination ||
        "/cc1_transcriptions") as string;
      const jsonFile = path.join(destination, `${baseName}.json`);

      const data = await fs.readFile(jsonFile, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("JSON file error:", error);
      res.status(404).json({ error: "JSON file not found" });
    }
  }) as RequestHandler);

  app.get("/api/files/:baseName/audio", (async (req, res) => {
    try {
      const { baseName } = req.params;
      const tenantName = (req.query.tenant_name as string) || "default";
      const configs = await loadConfigs();
      const tenantConfig = (configs[tenantName] as Record<string, unknown>) || {
        source: "/cc1_recordings",
      };

      const source = (tenantConfig.source || "/cc1_recordings") as string;
      const audioExtensions = [".wav", ".mp3", ".m4a", ".flac"];

      for (const ext of audioExtensions) {
        const audioFile = path.join(source, `${baseName}${ext}`);
        try {
          await fs.access(audioFile);
          res.sendFile(audioFile);
          return;
        } catch {
          // Try next extension
        }
      }

      res.status(404).json({ error: "Audio file not found" });
    } catch (error) {
      console.error("Audio file error:", error);
      res.status(500).json({ error: "Failed to get audio file" });
    }
  }) as RequestHandler);

  // Upload endpoint
  app.post("/api/upload", upload.any(), handleUpload);

  return app;
}
