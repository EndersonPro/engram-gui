import { describe, expect, it, vi } from "vitest";

import { createMemoriesQueryOptions, createObservationDetailQueryOptions } from "@features/memories/api/use-memories";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createMemoriesQueryOptions", () => {
  it("returns observations query key and keeps observation domain payload", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listRecentObservations").mockResolvedValue({
      kind: "success",
      data: [
        {
          id: 1,
          syncId: "obs-sync-1",
          sessionId: "sess-1",
          type: "memory",
          title: "Memory snapshot",
          project: "engram",
          scope: "project",
          content: "Memory snapshot",
          revisionCount: 1,
          duplicateCount: 0,
          createdAt: "2026-04-02T00:00:00Z",
          updatedAt: "2026-04-02T00:00:00Z",
        },
      ],
    });

    const options = createMemoriesQueryOptions({ project: "engram", scope: "project", limit: 5 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(
      queryKeys.engram.observations.recent({ project: "engram", scope: "project", limit: 5 }),
    );
    expect(result.kind).toBe("success");
    expect(result.kind === "success" ? result.data : null).toEqual([
      {
        id: 1,
        syncId: "obs-sync-1",
        sessionId: "sess-1",
        type: "memory",
        title: "Memory snapshot",
        project: "engram",
        scope: "project",
        content: "Memory snapshot",
        revisionCount: 1,
        duplicateCount: 0,
        createdAt: "2026-04-02T00:00:00Z",
        updatedAt: "2026-04-02T00:00:00Z",
      },
    ]);
    expect(spy).toHaveBeenCalledWith({ project: "engram", scope: "project", limit: 5 });
  });

  it("returns empty when observations payload is unavailable", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listRecentObservations").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createMemoriesQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(
      queryKeys.engram.observations.recent({ project: undefined, scope: undefined, limit: 20 }),
    );
    expect(result).toEqual({
      kind: "empty",
      data: null,
    });
    expect(spy).toHaveBeenCalledWith({ project: undefined, scope: undefined, limit: 20 });
  });

  it("propagates adapter validation failures for observation detail", async () => {
    const spy = vi.spyOn(engramApiAdapter, "getObservationById").mockResolvedValue({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Observation detail requires a positive integer id",
        retryable: true,
      },
    });

    const options = createObservationDetailQueryOptions({ id: 7 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.observations.detail({ id: 7 }));
    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Observation detail requires a positive integer id",
        retryable: true,
      },
    });
    expect(spy).toHaveBeenCalledWith({ id: 7 });
  });

  it("short-circuits with validation failure when observation detail id is invalid", async () => {
    const spy = vi.spyOn(engramApiAdapter, "getObservationById").mockResolvedValue({
      kind: "success",
      data: {
        id: 1,
        syncId: "obs-sync-1",
        sessionId: "sess-1",
        type: "memory",
        title: "obs",
        project: "engram",
        scope: "project",
        content: "obs",
        revisionCount: 1,
        duplicateCount: 0,
        createdAt: "2026-04-02T00:00:00Z",
        updatedAt: "2026-04-02T00:00:00Z",
      },
    });

    const options = createObservationDetailQueryOptions({ id: 0 });
    const result = await options.queryFn();

    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Observation detail requires a positive integer id",
        retryable: true,
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
