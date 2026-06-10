export type SourceType = "csv" | "excel" | "json" | "sql";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Dataset {
  id: number;
  name: string;
  original_filename: string | null;
  source_type: SourceType;
  row_count: number;
  column_count: number;
  created_at: string;
}

export interface DataPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  returned_rows: number;
}

export interface DatasetStats {
  rows: number;
  columns: number;
  missing_cells: number;
  missing_pct: number;
  columns_with_missing: number;
  duplicate_rows: number;
}

export interface OperationStep {
  operation: string;
  params: Record<string, unknown>;
}

export type IssueSeverity = "high" | "medium" | "low";

export interface Insight {
  code: string;
  title: string;
  detail: string;
  severity: IssueSeverity;
  count: number;
  recommended: boolean;
  column: string | null;
  steps: OperationStep[];
}

export interface InsightsResponse {
  issues: Insight[];
}

export interface CleaningJob {
  id: number;
  dataset_id: number;
  status: JobStatus;
  operations: OperationStep[];
  result_path: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface Report {
  id: number;
  job_id: number;
  payload: ReportPayload;
  created_at: string;
}

export interface ReportPayload {
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
  missing_values_before?: number;
  missing_values_after?: number;
  duplicates_before?: number;
  duplicates_after?: number;
  operations: { operation: string; params: Record<string, unknown>; metadata: Record<string, unknown> }[];
  summary: Record<string, number>;
}

export interface ExportResult {
  format: string;
  location: string;
  rows_exported: number;
}
