import { describe, expect, it, vi } from "vitest";

import {
  createTimelineQueryOptions,
  getLastValidTimelineParamsForRetry,
  resetLastValidTimelineParamsForRetry,
} from "@features/timeline/api/use-timeline";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createTimelineQueryOptions", () => {
  it("stores last valid timeline params for retry metadata", () => {
    resetLastValidTimelineParamsForRetry();

    createTimelineQueryOptions({ observation_id: 9, before: 4, after: 4 });

    expect(getLastValidTimelineParamsForRetry()).toEqual({ observation_id: 9, before: 4, after: 4 });
  });

  it("returns timeline query key and delegates to adapter", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listTimeline").mockResolvedValue({
      kind: "success",
      data: {
        focus: {
          id: 7,
          syncId: "obs-sync-7",
          sessionId: "sess-7",
          type: "architecture",
          title: "focus",
          content: "Contract ratified",
          scope: "project",
          revisionCount: 1,
          duplicateCount: 0,
          createdAt: "2026-04-02T00:00:00Z",
          updatedAt: "2026-04-02T00:00:00Z",
        },
        before: [],
        after: [],
        totalInRange: 1,
      },
    });

    const options = createTimelineQueryOptions({ observation_id: 7, before: 3, after: 5 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.timeline.list({ observation_id: 7, before: 3, after: 5 }));
    expect(result.kind).toBe("success");
    expect(spy).toHaveBeenCalledWith({ observation_id: 7, before: 3, after: 5 });
  });

  it("keeps default query key stable when params are omitted", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listTimeline").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createTimelineQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.timeline.list({ observation_id: 1, before: 5, after: 5 }));
    expect(result).toEqual({
      kind: "empty",
      data: null,
    });
    expect(spy).toHaveBeenCalledWith({ observation_id: 1, before: 5, after: 5 });
  });

  it("propagates adapter validation failures for timeline queries", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listTimeline").mockResolvedValue({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
        retryable: true,
      },
    });

    const options = createTimelineQueryOptions({ observation_id: 7, before: 1, after: 2 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.timeline.list({ observation_id: 7, before: 1, after: 2 }));
    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
        retryable: true,
      },
    });
    expect(spy).toHaveBeenCalledWith({ observation_id: 7, before: 1, after: 2 });
  });

  it("short-circuits with validation failure when observation_id is invalid", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listTimeline").mockResolvedValue({
      kind: "success",
      data: {
        focus: {
          id: 1,
          syncId: "obs-sync-1",
          sessionId: "sess-1",
          type: "architecture",
          title: "focus",
          content: "focus",
          scope: "project",
          revisionCount: 1,
          duplicateCount: 0,
          createdAt: "2026-04-02T00:00:00Z",
          updatedAt: "2026-04-02T00:00:00Z",
        },
        before: [],
        after: [],
        totalInRange: 1,
      },
    });

    const options = createTimelineQueryOptions({ observation_id: 0, before: 1, after: 2 });
    const result = await options.queryFn();

    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
        retryable: true,
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("maps invalid legacy observationId params to validation failure", async () => {
    const spy = vi.spyOn(engramApiAdapter, "listTimeline").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createTimelineQueryOptions({ observationId: "obs-1", limit: 20 });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.timeline.list({ observation_id: 0, before: 5, after: 20 }));
    expect(result).toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
        retryable: true,
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("honors explicit enabled=false to avoid execution until selection exists", () => {
    const options = createTimelineQueryOptions({ observation_id: 7, before: 3, after: 5 }, { enabled: false });

    expect(options.enabled).toBe(false);
  });
});
