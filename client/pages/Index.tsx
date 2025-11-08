import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, FileAudio } from "lucide-react";
import FileUploadZone from "@/components/FileUploadZone";
import ConfigPanel from "@/components/ConfigPanel";
import MetricsPanel from "@/components/MetricsPanel";

interface ScoringMetric {
  id: string;
  call_type: string;
  rating_type: number;
  metrics: Array<{
    title: string;
    description: string;
  }>;
}

interface Webhook {
  index: number;
  url: string;
}

interface UploadPayload {
  source: string;
  destination: string;
  audios_list: Array<{
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
  }>;
}

export default function Index() {
  const [files, setFiles] = useState<File[]>([]);
  const [source, setSource] = useState("/cc1_recordings");
  const [destination, setDestination] = useState("/cc1_transcriptions");
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { index: 0, url: "" },
  ]);
  const [metrics, setMetrics] = useState<ScoringMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    | { type: "idle" | "success" | "error"; message: string }
    | null
  >(null);
  const [nextWebhookIndex, setNextWebhookIndex] = useState(1);

  const handleAddWebhook = () => {
    setWebhooks([...webhooks, { index: nextWebhookIndex, url: "" }]);
    setNextWebhookIndex(nextWebhookIndex + 1);
  };

  const handleWebhookChange = (index: number, value: string) => {
    setWebhooks(webhooks.map((w) => (w.index === index ? { ...w, url: value } : w)));
  };

  const handleWebhookRemove = (index: number) => {
    setWebhooks(webhooks.filter((w) => w.index !== index));
  };

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setUploadStatus({
        type: "error",
        message: "Please select at least one audio file",
      });
      return;
    }

    if (!source.trim() || !destination.trim()) {
      setUploadStatus({
        type: "error",
        message: "Please fill in source and destination paths",
      });
      return;
    }

    const validWebhooks = webhooks.filter((w) => w.url.trim());
    if (validWebhooks.length === 0) {
      setUploadStatus({
        type: "error",
        message: "Please add at least one webhook URL",
      });
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();

      const payload: UploadPayload = {
        source,
        destination,
        audios_list: files.map((file, fileIndex) => ({
          file: `${source}/${file.name}`,
          webhook: validWebhooks[fileIndex % validWebhooks.length].url,
          is_other_standard_for_all: "true",
          identified_call_type: "unidentified",
          scoring_metrics: metrics.map((m) => ({
            call_type: m.call_type,
            rating_type: m.rating_type,
            metrics: m.metrics,
          })),
        })),
      };

      formData.append("payload", JSON.stringify(payload));

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setUploadStatus({
        type: "success",
        message: `Successfully uploaded ${files.length} file(s)`,
      });

      setFiles([]);
    } catch (error) {
      setUploadStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "An error occurred during upload",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary bg-opacity-10 rounded-xl">
              <FileAudio className="text-primary" size={28} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Audio Processor
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Upload and process audio files with custom scoring metrics. Configure your
            paths, webhooks, and evaluation criteria.
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div
            className={`mb-8 p-4 rounded-lg border flex items-start gap-3 animate-fade-in ${
              uploadStatus.type === "success"
                ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-900 dark:text-green-200"
                : uploadStatus.type === "error"
                  ? "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-900 dark:text-red-200"
                  : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {uploadStatus.type === "success" && <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />}
            {uploadStatus.type === "error" && <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-medium">{uploadStatus.message}</p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Upload Audio Files
            </h2>
            <FileUploadZone
              files={files}
              onFilesSelected={handleFilesSelected}
              onFilesRemoved={handleFileRemove}
            />
          </div>

          {/* Configuration Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Configuration
            </h2>
            <ConfigPanel
              source={source}
              destination={destination}
              webhooks={webhooks}
              onSourceChange={setSource}
              onDestinationChange={setDestination}
              onWebhookAdd={handleAddWebhook}
              onWebhookChange={handleWebhookChange}
              onWebhookRemove={handleWebhookRemove}
            />
          </div>

          {/* Metrics Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Scoring Metrics
            </h2>
            <MetricsPanel metrics={metrics} onMetricsChange={setMetrics} />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 sticky bottom-0 sm:relative bg-background sm:bg-transparent p-4 sm:p-0 -mx-4 sm:mx-0 sm:mt-8 border-t sm:border-t-0 border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Uploading..." : "Submit Files for Processing"}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            This application sends your configuration and files to the local API for processing.
            <br />
            All data will be handled according to your API's configured settings.
          </p>
        </div>
      </div>
    </div>
  );
}
