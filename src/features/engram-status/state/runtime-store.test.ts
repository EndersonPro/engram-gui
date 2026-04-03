import { afterEach, describe, expect, it } from "vitest";

import { resetRuntimeStore, useRuntimeStore } from "@features/engram-status/state/runtime-store";

describe("runtime store", () => {
  afterEach(() => {
    resetRuntimeStore();
  });

  it("applies runtime command status into local state", () => {
    useRuntimeStore.getState().applyRuntimeStatus({
      binaryAvailable: true,
      processState: "running",
      health: {
        status: "ok",
        checkedAt: "2026-04-02T00:00:00Z",
      },
      failureReason: null,
    });

    const next = useRuntimeStore.getState();

    expect(next.binaryAvailable).toBe(true);
    expect(next.processState).toBe("running");
    expect(next.health?.status).toBe("ok");
    expect(next.failureReason).toBeNull();
  });

  it("stores failure reason when health adapter returns retryable_failure", () => {
    useRuntimeStore.getState().applyHealthResult({
      kind: "retryable_failure",
      error: {
        code: "HTTP_503",
        message: "Service unavailable",
        retryable: true,
      },
    });

    const next = useRuntimeStore.getState();

    expect(next.failureReason).toBe("Service unavailable");
  });
});
