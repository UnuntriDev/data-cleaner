import type {
  CleaningJob,
  DataPreview,
  Dataset,
  DatasetStats,
  ExportResult,
  InsightsResponse,
  OperationStep,
  Report,
} from "../types";

function defaultBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8000";
  const hostname =
    window.location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  return `${window.location.protocol}//${hostname}:8000`;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl();

/** Resolves when the tab is visible (or immediately if it already is). */
function waitUntilVisible(): Promise<void> {
  if (typeof document === "undefined" || !document.hidden) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onVisible = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", onVisible);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Nie można połączyć się z backendem (${BASE_URL}). Sprawdź, czy API działa i czy CORS dopuszcza aktualny adres aplikacji. Szczegóły: ${detail}`,
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export const api = {
  uploadDataset(file: File): Promise<Dataset> {
    const form = new FormData();
    form.append("file", file);
    return request<Dataset>("/datasets/upload", { method: "POST", body: form });
  },

  previewDataset(id: number): Promise<DataPreview> {
    return request<DataPreview>(`/datasets/${id}/preview`);
  },

  statsDataset(id: number): Promise<DatasetStats> {
    return request<DatasetStats>(`/datasets/${id}/stats`);
  },

  analyzeDataset(id: number): Promise<InsightsResponse> {
    return request<InsightsResponse>(`/datasets/${id}/insights`);
  },

  createJob(datasetId: number, operations: OperationStep[]): Promise<CleaningJob> {
    return request<CleaningJob>("/cleaning/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, operations }),
    });
  },

  getJob(id: number): Promise<CleaningJob> {
    return request<CleaningJob>(`/cleaning/jobs/${id}`);
  },

  /**
   * Poll until the job reaches a terminal status. Backs off exponentially
   * and pauses while the tab is hidden. `shouldStop` lets callers bail
   * when the poll is no longer relevant.
   */
  async waitForJob(
    id: number,
    {
      intervalMs = 600,
      maxIntervalMs = 3_000,
      timeoutMs = 300_000,
      shouldStop,
    }: {
      intervalMs?: number;
      maxIntervalMs?: number;
      timeoutMs?: number;
      shouldStop?: () => boolean;
    } = {},
  ): Promise<CleaningJob> {
    let interval = intervalMs;
    let budget = timeoutMs;
    for (;;) {
      await waitUntilVisible();
      const job = await this.getJob(id);
      if (job.status === "completed" || job.status === "failed") return job;
      if (shouldStop?.()) return job;
      if (budget <= 0) {
        throw new Error(
          "Czyszczenie trwa dłużej niż zwykle. Spróbuj ponownie za chwilę.",
        );
      }
      const delay = Math.min(interval, budget);
      await new Promise((resolve) => setTimeout(resolve, delay));
      budget -= delay;
      interval = Math.min(Math.round(interval * 1.5), maxIntervalMs);
    }
  },

  previewJob(id: number): Promise<DataPreview> {
    return request<DataPreview>(`/cleaning/jobs/${id}/preview`);
  },

  getReport(jobId: number): Promise<Report> {
    return request<Report>(`/reports/by-job/${jobId}`);
  },

  exportJob(jobId: number, format: string): Promise<ExportResult> {
    return request<ExportResult>(`/exports/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
  },

  downloadUrl(jobId: number, format: string): string {
    return `${BASE_URL}/exports/${jobId}/download?format=${encodeURIComponent(format)}`;
  },
};
