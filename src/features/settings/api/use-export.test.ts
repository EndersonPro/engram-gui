import { describe, expect, it, vi } from "vitest";

import { createExportQueryOptions } from "@features/settings/api/use-export";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createExportQueryOptions", () => {
  it("uses export adapter endpoint and preserves GET-only result envelope", async () => {
    const getExportSpy = vi.spyOn(engramApiAdapter, "getExport").mockResolvedValue({
      kind: "success",
      data: {
        version: "0.1.0",
        exportedAt: "2026-04-02T00:00:00Z",
        sessions: [
          {
            id: "sess-1",
            project: "engram-gui",
            directory: "/tmp/engram-gui",
            startedAt: "2026-04-02T00:00:00Z",
            summary: "Session A",
          },
        ],
        observations: [
          {
            id: 2,
            syncId: "obs-sync-2",
            sessionId: "sess-1",
            type: "observation",
            title: "observation",
            project: "engram-gui",
            scope: "project",
            content: "observation",
            revisionCount: 1,
            duplicateCount: 0,
            createdAt: "2026-04-02T00:00:00Z",
            updatedAt: "2026-04-02T00:00:00Z",
          },
        ],
        prompts: [
          {
            id: 3,
            syncId: "prompt-sync-3",
            sessionId: "sess-1",
            project: "engram-gui",
            content: "prompt",
            createdAt: "2026-04-02T00:00:00Z",
          },
        ],
      },
    });

    const options = createExportQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.export.get);
    expect(getExportSpy).toHaveBeenCalledWith({});
    expect(result).toEqual({
      kind: "success",
      data: {
        version: "0.1.0",
        exportedAt: "2026-04-02T00:00:00Z",
        sessions: [
          {
            id: "sess-1",
            project: "engram-gui",
            directory: "/tmp/engram-gui",
            startedAt: "2026-04-02T00:00:00Z",
            summary: "Session A",
          },
        ],
        observations: [
          {
            id: 2,
            syncId: "obs-sync-2",
            sessionId: "sess-1",
            type: "observation",
            title: "observation",
            project: "engram-gui",
            scope: "project",
            content: "observation",
            revisionCount: 1,
            duplicateCount: 0,
            createdAt: "2026-04-02T00:00:00Z",
            updatedAt: "2026-04-02T00:00:00Z",
          },
        ],
        prompts: [
          {
            id: 3,
            syncId: "prompt-sync-3",
            sessionId: "sess-1",
            project: "engram-gui",
            content: "prompt",
            createdAt: "2026-04-02T00:00:00Z",
          },
        ],
      },
    });
  });

  it("locks /export cache policy to staleTime=0 and low gcTime", () => {
    const options = createExportQueryOptions();

    expect(options.staleTime).toBe(0);
    expect(options.gcTime).toBe(15_000);
  });
});
