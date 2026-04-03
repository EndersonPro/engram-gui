import { describe, expect, it, vi } from "vitest";

import { createSearchQueryOptions, getLastValidSearchParamsForRetry, resetLastValidSearchParamsForRetry } from "@features/search/api/use-search";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createSearchQueryOptions", () => {
  it("disables query execution when enabled is false", () => {
    const options = createSearchQueryOptions({ q: "engram", project: "engram", scope: "project", limit: 5 }, { enabled: false });

    expect(options.enabled).toBe(false);
  });

  it("returns search query key and delegates to adapter", async () => {
    const spy = vi.spyOn(engramApiAdapter, "searchQuery").mockResolvedValue({
      kind: "success",
      data: [
        {
          rank: 0.9,
          observation: {
            id: 1,
            syncId: "obs-sync-1",
            sessionId: "sess-1",
            type: "search",
            title: "result",
            project: "engram",
            scope: "project",
            content: "result snippet",
            revisionCount: 1,
            duplicateCount: 0,
            createdAt: "2026-04-02T00:00:00Z",
            updatedAt: "2026-04-02T00:00:00Z",
          },
        },
      ],
    });

    const options = createSearchQueryOptions({ q: "engram", project: "engram", scope: "project", limit: 5 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(
      queryKeys.engram.search.query({ q: "engram", project: "engram", scope: "project", limit: 5 }),
    );
    expect(result.kind).toBe("success");
    expect(spy).toHaveBeenCalledWith({ q: "engram", project: "engram", scope: "project", limit: 5 });
  });

  it("returns validation failure for empty default q without calling adapter", async () => {
    const spy = vi.spyOn(engramApiAdapter, "searchQuery").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createSearchQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.search.query({ q: "", project: undefined, scope: undefined, limit: 20 }));
    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Search requires a non-empty query parameter 'q'",
        retryable: true,
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("propagates adapter validation failures for non-empty q", async () => {
    const spy = vi.spyOn(engramApiAdapter, "searchQuery").mockResolvedValue({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Search requires a non-empty query parameter 'q'",
        retryable: true,
      },
    });

    const options = createSearchQueryOptions({ q: "engram", project: undefined, scope: undefined, limit: 20 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(
      queryKeys.engram.search.query({ q: "engram", project: undefined, scope: undefined, limit: 20 }),
    );
    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Search requires a non-empty query parameter 'q'",
        retryable: true,
      },
    });
    expect(spy).toHaveBeenCalledWith({ q: "engram", project: undefined, scope: undefined, limit: 20 });
  });

  it("short-circuits with validation failure when q is blank", async () => {
    const spy = vi.spyOn(engramApiAdapter, "searchQuery").mockResolvedValue({
      kind: "success",
      data: [],
    });

    const options = createSearchQueryOptions({ q: "   ", project: undefined, scope: undefined, limit: 20 });
    const result = await options.queryFn();

    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Search requires a non-empty query parameter 'q'",
        retryable: true,
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("preserves last valid params for retry metadata", async () => {
    resetLastValidSearchParamsForRetry();

    const spy = vi.spyOn(engramApiAdapter, "searchQuery").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createSearchQueryOptions({ q: "   vector db  ", project: undefined, scope: "project", limit: 15 });
    await options.queryFn();

    expect(spy).toHaveBeenCalledWith({ q: "vector db", project: undefined, scope: "project", limit: 15 });
    expect(getLastValidSearchParamsForRetry()).toEqual({
      q: "vector db",
      project: undefined,
      scope: "project",
      limit: 15,
    });
  });
});
