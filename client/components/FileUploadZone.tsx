import { useState, useRef } from "react";
import { Upload, X, FileAudio } from "lucide-react";

interface AudioFile {
  file: string;
  webhook: string;
  is_other_standard_for_all: string;
  identified_call_type: string;
  scoring_metrics: Array<{
    call_type: string;
    rating_type: number;
    metrics: Array<{
      title: string;
      description: string;
    }>;
  }>;
}

interface FileUploadZoneProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onFilesRemoved: (index: number) => void;
}

export default function FileUploadZone({
  files,
  onFilesSelected,
  onFilesRemoved,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("audio/")
    );

    if (droppedFiles.length > 0) {
      onFilesSelected([...files, ...droppedFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected([...files, ...selectedFiles]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary bg-opacity-5"
            : "border-border bg-secondary bg-opacity-30 hover:bg-opacity-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div
            className={`mb-4 p-4 rounded-xl transition-colors ${
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-primary bg-opacity-10 text-primary"
            }`}
          >
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drop audio files here
          </h3>
          <p className="text-muted-foreground text-center">
            or click to browse from your computer
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports WAV, MP3, and other audio formats
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-secondary hover:bg-opacity-30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileAudio size={20} className="text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFilesRemoved(index)}
                  className="flex-shrink-0 p-2 hover:bg-destructive hover:bg-opacity-10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
