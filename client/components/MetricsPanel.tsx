import { useState } from "react";
import { ChevronDown, Plus, Trash2, ChevronUp } from "lucide-react";

interface Metric {
  title: string;
  description: string;
}

interface ScoringMetric {
  id: string;
  call_type: string;
  rating_type: number;
  metrics: Metric[];
}

interface MetricsPanelProps {
  metrics: ScoringMetric[];
  onMetricsChange: (metrics: ScoringMetric[]) => void;
}

export default function MetricsPanel({
  metrics,
  onMetricsChange,
}: MetricsPanelProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<{
    [key: string]: boolean;
  }>({});

  const addMetric = () => {
    const newMetric: ScoringMetric = {
      id: `metric-${Date.now()}`,
      call_type: "other",
      rating_type: 1,
      metrics: [],
    };
    onMetricsChange([...metrics, newMetric]);
    setExpandedMetrics((prev) => ({ ...prev, [newMetric.id]: true }));
  };

  const removeMetric = (id: string) => {
    onMetricsChange(metrics.filter((m) => m.id !== id));
    setExpandedMetrics((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const updateMetric = (id: string, updates: Partial<ScoringMetric>) => {
    onMetricsChange(
      metrics.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  const addMetricItem = (metricId: string) => {
    const metric = metrics.find((m) => m.id === metricId);
    if (metric) {
      updateMetric(metricId, {
        metrics: [...metric.metrics, { title: "", description: "" }],
      });
    }
  };

  const updateMetricItem = (
    metricId: string,
    itemIndex: number,
    field: "title" | "description",
    value: string,
  ) => {
    const metric = metrics.find((m) => m.id === metricId);
    if (metric) {
      const updatedMetrics = [...metric.metrics];
      updatedMetrics[itemIndex] = {
        ...updatedMetrics[itemIndex],
        [field]: value,
      };
      updateMetric(metricId, { metrics: updatedMetrics });
    }
  };

  const removeMetricItem = (metricId: string, itemIndex: number) => {
    const metric = metrics.find((m) => m.id === metricId);
    if (metric) {
      updateMetric(metricId, {
        metrics: metric.metrics.filter((_, i) => i !== itemIndex),
      });
    }
  };

  const toggleMetric = (id: string) => {
    setExpandedMetrics((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="card-base p-6 border-l-4 border-l-primary">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Scoring Metrics
        </h3>
        <button
          onClick={addMetric}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          type="button"
        >
          <Plus size={16} />
          Add Metric Group
        </button>
      </div>

      {metrics.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No scoring metrics configured yet
          </p>
          <button
            onClick={addMetric}
            className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border hover:border-primary rounded-lg transition-colors text-muted-foreground hover:text-primary"
            type="button"
          >
            <Plus size={16} />
            Create First Metric Group
          </button>
        </div>
      )}

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleMetric(metric.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary hover:bg-opacity-20 transition-colors"
              type="button"
            >
              <div className="text-left">
                <h4 className="font-semibold text-foreground">
                  {metric.call_type || "Untitled Metric Group"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.metrics.length} metrics
                </p>
              </div>
              {expandedMetrics[metric.id] ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {expandedMetrics[metric.id] && (
              <div className="border-t border-border p-4 bg-card space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      Call Type
                    </label>
                    <input
                      type="text"
                      value={metric.call_type}
                      onChange={(e) =>
                        updateMetric(metric.id, { call_type: e.target.value })
                      }
                      placeholder="e.g., other, Car Inspection Enquiry Call"
                      className="input-field w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      Rating Type
                    </label>
                    <input
                      type="number"
                      value={metric.rating_type}
                      onChange={(e) =>
                        updateMetric(metric.id, {
                          rating_type: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      className="input-field w-full text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">
                      Metrics ({metric.metrics.length})
                    </h5>
                    <button
                      onClick={() => addMetricItem(metric.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-dashed border-border hover:border-primary rounded transition-colors text-muted-foreground hover:text-primary"
                      type="button"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {metric.metrics.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="p-3 bg-secondary bg-opacity-20 rounded-lg space-y-2"
                      >
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateMetricItem(
                              metric.id,
                              itemIndex,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder="Metric title (e.g., Call Opening)"
                          className="input-field w-full text-sm"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            updateMetricItem(
                              metric.id,
                              itemIndex,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Metric description..."
                          rows={2}
                          className="input-field w-full text-sm resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              removeMetricItem(metric.id, itemIndex)
                            }
                            className="p-1.5 hover:bg-destructive hover:bg-opacity-10 rounded transition-colors text-muted-foreground hover:text-destructive"
                            type="button"
                            title="Remove metric"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={() => removeMetric(metric.id)}
                    className="px-4 py-2 text-sm text-destructive hover:bg-destructive hover:bg-opacity-10 rounded-lg transition-colors font-medium"
                    type="button"
                  >
                    Remove Group
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
