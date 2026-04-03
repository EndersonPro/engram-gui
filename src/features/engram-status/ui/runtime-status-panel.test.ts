import { describe, expect, it, vi } from "vitest";

import type { RuntimeStatusPayload } from "@features/engram-status/state/runtime-store";
import { refreshRuntimeStatus } from "@features/engram-status/ui/runtime-status-panel";

describe("refreshRuntimeStatus", () => {
  it("supports repeated manual refresh and applies latest runtime snapshot", async () => {
    const applyRuntimeStatus = vi.fn();
    const first: RuntimeStatusPayload = {
      binaryAvailable: true,
      processState: "starting",
      health: null,
      failureReason: null,
    };
    const second: RuntimeStatusPayload = {
      binaryAvailable: true,
      processState: "running",
      health: {
        status: "ok",
        checkedAt: "2026-04-02T00:00:00Z",
      },
      failureReason: null,
    };
    const checkRuntimeStatus = vi
      .fn<() => Promise<RuntimeStatusPayload>>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    await refreshRuntimeStatus(checkRuntimeStatus, applyRuntimeStatus);
    await refreshRuntimeStatus(checkRuntimeStatus, applyRuntimeStatus);

    expect(checkRuntimeStatus).toHaveBeenCalledTimes(2);
    expect(applyRuntimeStatus).toHaveBeenNthCalledWith(1, first);
    expect(applyRuntimeStatus).toHaveBeenNthCalledWith(2, second);
  });

  it("applies explicit runtime error payload when manual refresh request fails", async () => {
    const applyRuntimeStatus = vi.fn();
    const checkRuntimeStatus = vi
      .fn<() => Promise<RuntimeStatusPayload>>()
      .mockRejectedValueOnce(new Error("status timeout"));

    await refreshRuntimeStatus(checkRuntimeStatus, applyRuntimeStatus);

    expect(checkRuntimeStatus).toHaveBeenCalledTimes(1);
    expect(applyRuntimeStatus).toHaveBeenCalledWith({
      binaryAvailable: false,
      processState: "error",
      health: null,
      failureReason: "Could not read desktop runtime status.",
    });
  });
});
