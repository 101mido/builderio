import { useEffect, useState } from "react";
import { FileAudio, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileInfo {
  name: string;
  base_name: string;
  has_vtt: boolean;
  has_json: boolean;
  uploaded_at: string;
}

interface FilesListProps {
  tenantName: string;
  onFileSelect: (baseName: string, fileName: string) => void;
}

export default function FilesList({
  tenantName,
  onFileSelect,
}: FilesListProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
    const interval = setInterval(loadFiles, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [tenantName]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/files?tenant_name=${tenantName}`);

      if (!response.ok) {
        setError(`Failed to load files: ${response.status}`);
        setFiles([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setError(null);
      } else {
        setError("Failed to load files");
      }
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 dark:bg-red-950 dark:border-red-900 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileAudio
          size={48}
          className="mx-auto text-muted-foreground mb-4 opacity-30"
        />
        <p className="text-muted-foreground mb-2">
          No audio files uploaded yet
        </p>
        <p className="text-sm text-muted-foreground">
          Upload files above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Uploaded Files ({files.length})
        </h3>
        <button
          onClick={loadFiles}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary transition-colors"
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.base_name}
            onClick={() => onFileSelect(file.base_name, file.name)}
            className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-secondary hover:bg-opacity-30 hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileAudio size={20} className="text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(file.uploaded_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <div className="flex gap-2">
                {file.has_vtt && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700 dark:bg-green-950 dark:border-green-900 dark:text-green-200"
                    title="Transcription available"
                  >
                    <CheckCircle2 size={14} />
                    <span className="hidden sm:inline">VTT</span>
                  </div>
                )}
                {file.has_json && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200"
                    title="Analysis available"
                  >
                    <CheckCircle2 size={14} />
                    <span className="hidden sm:inline">JSON</span>
                  </div>
                )}
                {!file.has_vtt && !file.has_json && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-200"
                    title="Processing"
                  >
                    <Clock size={14} />
                    <span className="hidden sm:inline">Processing</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
