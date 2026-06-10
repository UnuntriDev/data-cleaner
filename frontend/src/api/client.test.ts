import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import type { CleaningJob, JobStatus } from "../types";

function job(status: JobStatus): CleaningJob {
  return {
    id: 7,
    dataset_id: 1,
    status,
    operations: [],
    result_path: null,
    error: status === "failed" ? "boom" : null,
    created_at: "2026-01-01T00:00:00Z",
    finished_at: null,
  };
}

/** Queue fetch responses; the last one repeats for any further polls. */
function stubFetchSequence(statuses: JobStatus[]) {
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const status = statuses[Math.min(call, statuses.length - 1)];
    call += 1;
    return {
      ok: true,
      json: async () => job(status),
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api.waitForJob", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves as soon as the job is completed", async () => {
    const fetchMock = stubFetchSequence(["completed"]);
    const result = await api.waitForJob(7, { intervalMs: 1 });
    expect(result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("polls until the job reaches a terminal status", async () => {
    const fetchMock = stubFetchSequence(["pending", "running", "completed"]);
    const result = await api.waitForJob(7, { intervalMs: 1, maxIntervalMs: 2 });
    expect(result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns a failed job instead of polling forever", async () => {
    stubFetchSequence(["pending", "failed"]);
    const result = await api.waitForJob(7, { intervalMs: 1 });
    expect(result.status).toBe("failed");
    expect(result.error).toBe("boom");
  });

  it("stops early when shouldStop reports the poll is stale", async () => {
    const fetchMock = stubFetchSequence(["pending"]);
    const result = await api.waitForJob(7, {
      intervalMs: 1,
      shouldStop: () => true,
    });
    // The last seen (non-terminal) job is handed back to the caller's guard.
    expect(result.status).toBe("pending");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a friendly timeout error when the job never finishes", async () => {
    stubFetchSequence(["running"]);
    await expect(
      api.waitForJob(7, { intervalMs: 2, maxIntervalMs: 4, timeoutMs: 10 }),
    ).rejects.toThrow(/trwa dłużej niż zwykle/);
  });

  it("surfaces backend error details on non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        statusText: "Not Found",
        json: async () => ({ detail: "Cleaning job 7 not found" }),
      })) as unknown as typeof fetch,
    );
    await expect(api.waitForJob(7, { intervalMs: 1 })).rejects.toThrow(
      "Cleaning job 7 not found",
    );
  });
});
