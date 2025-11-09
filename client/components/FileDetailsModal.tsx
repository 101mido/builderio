import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface FileDetailsModalProps {
  baseName: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  tenantName: string;
}

interface AnalysisData {
  [key: string]: unknown;
}

export default function FileDetailsModal({
  baseName,
  fileName,
  isOpen,
  onClose,
  tenantName,
}: FileDetailsModalProps) {
  const [vttContent, setVttContent] = useState<string>("");
  const [jsonData, setJsonData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "audio" | "transcription" | "analysis"
  >("audio");

  useEffect(() => {
    if (isOpen) {
      loadFileData();
    }
  }, [isOpen, baseName, tenantName]);

  const loadFileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load VTT file
      try {
        const vttResponse = await fetch(
          `/api/files/${baseName}/vtt?tenant_name=${tenantName}`,
        );
        if (vttResponse.ok) {
          const vttText = await vttResponse.text();
          setVttContent(vttText);
        }
      } catch {
        console.log("VTT file not found or error loading");
      }

      // Load JSON analysis
      try {
        const jsonResponse = await fetch(
          `/api/files/${baseName}/json?tenant_name=${tenantName}`,
        );
        if (jsonResponse.ok) {
          const jsonContent = await jsonResponse.json();
          setJsonData(jsonContent);
        }
      } catch {
        console.log("JSON file not found or error loading");
      }
    } catch (err) {
      setError("Failed to load file details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{fileName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Base: {baseName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-secondary bg-opacity-30">
          <button
            onClick={() => setActiveTab("audio")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "audio"
                ? "text-primary border-b-primary"
                : "text-muted-foreground border-b-transparent hover:text-foreground"
            }`}
            type="button"
          >
            Audio
          </button>
          <button
            onClick={() => setActiveTab("transcription")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "transcription"
                ? "text-primary border-b-primary"
                : "text-muted-foreground border-b-transparent hover:text-foreground"
            }`}
            type="button"
            disabled={!vttContent}
          >
            Transcription
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "analysis"
                ? "text-primary border-b-primary"
                : "text-muted-foreground border-b-transparent hover:text-foreground"
            }`}
            type="button"
            disabled={!jsonData}
          >
            Analysis
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 dark:bg-red-950 dark:border-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Audio Tab */}
          {activeTab === "audio" && !isLoading && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Audio Player
                </h3>
                <audio
                  controls
                  className="w-full"
                  src={`/api/files/${baseName}/audio?tenant_name=${tenantName}`}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>

              {jsonData && (
                <div className="bg-secondary bg-opacity-30 p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Overview</h4>
                  <div className="space-y-2 text-sm">
                    {typeof jsonData.total_score === "number" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Score:
                        </span>
                        <span className="font-semibold text-foreground">
                          {jsonData.total_score}
                        </span>
                      </div>
                    )}
                    {typeof jsonData.total_score_percentage === "number" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Score Percentage:
                        </span>
                        <span className="font-semibold text-foreground">
                          {jsonData.total_score_percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transcription Tab */}
          {activeTab === "transcription" && !isLoading && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Transcription (WebVTT)
              </h3>
              {vttContent ? (
                <pre className="bg-secondary bg-opacity-30 p-4 rounded-lg overflow-x-auto text-sm text-foreground whitespace-pre-wrap break-words">
                  {vttContent}
                </pre>
              ) : (
                <p className="text-muted-foreground italic">
                  No transcription available yet
                </p>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === "analysis" && !isLoading && (
            <div className="space-y-6">
              {jsonData ? (
                <>
                  {/* Render dynamic analysis sections */}
                  {Object.entries(jsonData).map(([key, value]) => (
                    <AnalysisSection key={key} title={key} data={value} />
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground italic">
                  No analysis available yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({ title, data }: { title: string; data: unknown }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data === null || data === undefined) return null;

  // Skip score-related fields as they're shown in the overview
  if (["total_score", "total_score_percentage"].includes(title)) {
    return null;
  }

  const formatTitle = (str: string) =>
    str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  if (typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between bg-secondary bg-opacity-30 hover:bg-opacity-50 transition-colors"
          type="button"
        >
          <h4 className="font-semibold text-foreground">
            {formatTitle(title)}
          </h4>
          <span
            className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {isExpanded && (
          <div className="p-4 space-y-3 bg-card">
            {Object.entries(obj).map(([key, value]) => (
              <div key={key}>
                <div className="text-sm font-medium text-foreground mb-1">
                  {formatTitle(key)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {typeof value === "string"
                    ? value
                    : JSON.stringify(value, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between bg-secondary bg-opacity-30 hover:bg-opacity-50 transition-colors"
          type="button"
        >
          <h4 className="font-semibold text-foreground">
            {formatTitle(title)} ({data.length})
          </h4>
          <span
            className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {isExpanded && (
          <div className="p-4 space-y-4 bg-card">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-secondary bg-opacity-20 rounded border border-border"
              >
                {typeof item === "object" ? (
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-foreground">{String(item)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-secondary bg-opacity-30 rounded-lg border border-border">
      <h4 className="font-semibold text-foreground mb-2">
        {formatTitle(title)}
      </h4>
      <p className="text-sm text-muted-foreground">{String(data)}</p>
    </div>
  );
}
