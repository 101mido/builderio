/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Metric item in scoring metrics
 */
export interface MetricItem {
  title: string;
  description: string;
}

/**
 * Scoring metric group
 */
export interface ScoringMetricGroup {
  call_type: string;
  rating_type: number;
  metrics: MetricItem[];
}

/**
 * Audio file entry in upload list
 */
export interface AudioEntry {
  file: string;
  webhook: string;
  is_other_standard_for_all: string;
  identified_call_type: string;
  scoring_metrics: ScoringMetricGroup[];
}

/**
 * Main upload payload
 */
export interface UploadPayload {
  source: string;
  destination: string;
  audios_list: AudioEntry[];
}

/**
 * Upload response
 */
export interface UploadResponse {
  success: boolean;
  message: string;
  processedFiles?: number;
  failedFiles?: number;
}
