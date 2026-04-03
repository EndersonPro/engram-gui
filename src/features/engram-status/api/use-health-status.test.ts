import { describe, expect, it, vi } from "vitest";

import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

import { createHealthStatusQueryOptions } from "@features/engram-status/api/use-health-status";

describe("createHealthStatusQueryOptions", () => {
  it("returns health query key and calls shared adapter health path", async () => {
    const spy = vi.spyOn(engramApiAdapter, "health").mockResolvedValue({
      kind: "success",
      data: {
        status: "ok",
        checkedAt: "2026-04-02T00:00:00Z",
      },
    });

    const options = createHealthStatusQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.health);
    expect(result.kind).toBe("success");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
