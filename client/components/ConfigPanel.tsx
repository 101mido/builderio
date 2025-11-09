import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

interface ConfigPanelProps {
  source: string;
  destination: string;
  apiEndpoint: string;
  webhooks: Array<{ index: number; url: string }>;
  onSourceChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onApiEndpointChange: (value: string) => void;
  onWebhookAdd: () => void;
  onWebhookChange: (index: number, value: string) => void;
  onWebhookRemove: (index: number) => void;
}

export default function ConfigPanel({
  source,
  destination,
  apiEndpoint,
  webhooks,
  onSourceChange,
  onDestinationChange,
  onApiEndpointChange,
  onWebhookAdd,
  onWebhookChange,
  onWebhookRemove,
}: ConfigPanelProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    paths: true,
    webhooks: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Paths Configuration */}
      <div className="card-base p-6 border-l-4 border-l-primary">
        <button
          onClick={() => toggleSection("paths")}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          type="button"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Paths Configuration
          </h3>
          <ChevronDown
            size={20}
            className={`transition-transform ${
              expandedSections.paths ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.paths && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source Directory
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => onSourceChange(e.target.value)}
                placeholder="/cc1_recordings"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Source directory path for audio files
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Destination Directory
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                placeholder="/cc1_transcriptions"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Destination directory path for processed files
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Processing Endpoint
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => onApiEndpointChange(e.target.value)}
                placeholder="https://api.example.com/process"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                API endpoint URL that will receive the audio processing payload
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Webhooks Configuration */}
      <div className="card-base p-6 border-l-4 border-l-accent">
        <button
          onClick={() => toggleSection("webhooks")}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          type="button"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Webhooks ({webhooks.length})
          </h3>
          <ChevronDown
            size={20}
            className={`transition-transform ${
              expandedSections.webhooks ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.webhooks && (
          <div className="mt-6 space-y-4">
            {webhooks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No webhooks configured yet
              </p>
            )}

            {webhooks.map((webhook, index) => (
              <div
                key={webhook.index}
                className="flex items-end gap-3 p-4 bg-secondary bg-opacity-30 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-foreground mb-2">
                    Webhook URL {index + 1}
                  </label>
                  <input
                    type="url"
                    value={webhook.url}
                    onChange={(e) =>
                      onWebhookChange(webhook.index, e.target.value)
                    }
                    placeholder="https://example.com/webhook"
                    className="input-field w-full text-sm"
                  />
                </div>
                <button
                  onClick={() => onWebhookRemove(webhook.index)}
                  className="flex-shrink-0 p-2 hover:bg-destructive hover:bg-opacity-10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  type="button"
                  title="Remove webhook"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              onClick={onWebhookAdd}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border hover:border-primary hover:bg-primary hover:bg-opacity-5 rounded-lg transition-colors text-muted-foreground hover:text-primary"
              type="button"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add Webhook</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
