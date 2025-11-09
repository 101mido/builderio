import os
import json
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Processor API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AudioEntry(BaseModel):
    file: str
    webhook: str
    is_other_standard_for_all: str
    identified_call_type: str
    scoring_metrics: list


class UploadPayload(BaseModel):
    source: str
    destination: str
    audios_list: List[AudioEntry]


class UploadRequest(BaseModel):
    payload: dict
    api_endpoint: str


class TenantConfig(BaseModel):
    source: str
    destination: str
    api_endpoint: str
    webhooks: list
    metrics: list


class Tenant(BaseModel):
    name: str


class FileInfo(BaseModel):
    name: str
    has_vtt: bool
    has_json: bool
    uploaded_at: Optional[str] = None


# Storage for tenant data (in production, use a real database)
TENANTS_FILE = Path("data/tenants.json")
CONFIGS_FILE = Path("data/configs.json")
DATA_DIR = Path("data")

DATA_DIR.mkdir(exist_ok=True)
TENANTS_FILE.parent.mkdir(exist_ok=True)


def load_tenants() -> dict:
    if TENANTS_FILE.exists():
        with open(TENANTS_FILE, "r") as f:
            return json.load(f)
    return {}


def save_tenants(tenants: dict):
    with open(TENANTS_FILE, "w") as f:
        json.dump(tenants, f, indent=2)


def load_configs() -> dict:
    if CONFIGS_FILE.exists():
        with open(CONFIGS_FILE, "r") as f:
            return json.load(f)
    return {}


def save_configs(configs: dict):
    with open(CONFIGS_FILE, "w") as f:
        json.dump(configs, f, indent=2)


# Tenant endpoints
@app.get("/api/tenants")
async def get_tenants() -> dict:
    return load_tenants()


@app.post("/api/tenants")
async def create_tenant(tenant: Tenant) -> dict:
    tenants = load_tenants()
    if tenant.name in tenants:
        raise HTTPException(status_code=400, detail="Tenant already exists")
    
    tenants[tenant.name] = {
        "name": tenant.name,
        "created_at": datetime.now().isoformat(),
    }
    save_tenants(tenants)
    return tenants[tenant.name]


@app.get("/api/tenants/{tenant_name}/config")
async def get_tenant_config(tenant_name: str) -> dict:
    configs = load_configs()
    if tenant_name not in configs:
        return {
            "source": "/cc1_recordings",
            "destination": "/cc1_transcriptions",
            "api_endpoint": "",
            "webhooks": [{"index": 0, "url": ""}],
            "metrics": [],
        }
    return configs[tenant_name]


@app.post("/api/tenants/{tenant_name}/config")
async def save_tenant_config(tenant_name: str, config: TenantConfig) -> dict:
    configs = load_configs()
    configs[tenant_name] = config.dict()
    save_configs(configs)
    return configs[tenant_name]


# File upload endpoint
@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    payload: str = Form(...),
    tenant_name: str = Form(default="default"),
):
    try:
        payload_data = json.loads(payload)
        
        if not payload_data.get("source") or not payload_data.get("destination"):
            raise HTTPException(status_code=400, detail="Missing source or destination")
        
        source_dir = Path(payload_data["source"])
        dest_dir = Path(payload_data["destination"])
        
        source_dir.mkdir(parents=True, exist_ok=True)
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_files = []
        for file in files:
            file_path = source_dir / file.filename
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            uploaded_files.append(file.filename)
        
        logger.info(f"Tenant '{tenant_name}': Uploaded {len(uploaded_files)} file(s)")
        logger.info(f"Payload: {json.dumps(payload_data, indent=2)}")
        
        return {
            "success": True,
            "message": f"Successfully uploaded {len(uploaded_files)} file(s)",
            "processed_files": len(uploaded_files),
            "files": uploaded_files,
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# File listing endpoint
@app.get("/api/files")
async def list_files(tenant_name: str = "default") -> dict:
    try:
        configs = load_configs()
        tenant_config = configs.get(
            tenant_name,
            {
                "destination": "/cc1_transcriptions",
                "source": "/cc1_recordings",
            },
        )
        
        destination = Path(tenant_config.get("destination", "/cc1_transcriptions"))
        source = Path(tenant_config.get("source", "/cc1_recordings"))
        
        files_info = []
        
        if source.exists():
            for audio_file in source.glob("*"):
                if audio_file.is_file() and audio_file.suffix.lower() in [
                    ".wav",
                    ".mp3",
                    ".m4a",
                    ".flac",
                ]:
                    base_name = audio_file.stem
                    vtt_file = destination / f"{base_name}.vtt"
                    json_file = destination / f"{base_name}.json"
                    
                    file_info = {
                        "name": audio_file.name,
                        "base_name": base_name,
                        "has_vtt": vtt_file.exists(),
                        "has_json": json_file.exists(),
                        "uploaded_at": datetime.fromtimestamp(
                            audio_file.stat().st_mtime
                        ).isoformat(),
                    }
                    files_info.append(file_info)
        
        return {
            "success": True,
            "files": sorted(files_info, key=lambda x: x["uploaded_at"], reverse=True),
            "total": len(files_info),
        }
    except Exception as e:
        logger.error(f"File listing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


# File content endpoints
@app.get("/api/files/{base_name}/vtt")
async def get_vtt_file(base_name: str, tenant_name: str = "default"):
    try:
        configs = load_configs()
        tenant_config = configs.get(
            tenant_name,
            {"destination": "/cc1_transcriptions"},
        )
        
        destination = Path(tenant_config.get("destination", "/cc1_transcriptions"))
        vtt_file = destination / f"{base_name}.vtt"
        
        if not vtt_file.exists():
            raise HTTPException(status_code=404, detail="VTT file not found")
        
        return FileResponse(vtt_file, media_type="text/vtt")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VTT file error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get VTT file: {str(e)}")


@app.get("/api/files/{base_name}/json")
async def get_json_file(base_name: str, tenant_name: str = "default"):
    try:
        configs = load_configs()
        tenant_config = configs.get(
            tenant_name,
            {"destination": "/cc1_transcriptions"},
        )
        
        destination = Path(tenant_config.get("destination", "/cc1_transcriptions"))
        json_file = destination / f"{base_name}.json"
        
        if not json_file.exists():
            raise HTTPException(status_code=404, detail="JSON file not found")
        
        with open(json_file, "r") as f:
            data = json.load(f)
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON file error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get JSON file: {str(e)}")


@app.get("/api/files/{base_name}/audio")
async def get_audio_file(base_name: str, tenant_name: str = "default"):
    try:
        configs = load_configs()
        tenant_config = configs.get(
            tenant_name,
            {"source": "/cc1_recordings"},
        )
        
        source = Path(tenant_config.get("source", "/cc1_recordings"))
        
        # Find the audio file (could be any audio format)
        for ext in [".wav", ".mp3", ".m4a", ".flac"]:
            audio_file = source / f"{base_name}{ext}"
            if audio_file.exists():
                return FileResponse(audio_file)
        
        raise HTTPException(status_code=404, detail="Audio file not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio file error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get audio file: {str(e)}")


# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# Ping endpoint (matches Express implementation)
@app.get("/api/ping")
async def ping():
    ping_message = os.getenv("PING_MESSAGE", "ping")
    return {"message": ping_message}


# Demo endpoint (matches Express implementation)
@app.get("/api/demo")
async def demo():
    return {"message": "Hello from FastAPI server"}


# Serve React SPA
dist_dir = Path(__file__).parent.parent / "dist" / "spa"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="spa")
