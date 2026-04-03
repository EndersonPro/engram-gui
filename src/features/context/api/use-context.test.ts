import { describe, expect, it, vi } from "vitest";

import { createContextQueryOptions } from "@features/context/api/use-context";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createContextQueryOptions", () => {
  it("returns context query key and delegates to adapter", async () => {
    const spy = vi.spyOn(engramApiAdapter, "getContext").mockResolvedValue({
      kind: "success",
      data: {
        context: "Context snapshot from local Engram",
      },
    });

    const options = createContextQueryOptions({ scope: "project" });
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.context.get({ project: undefined, scope: "project" }));
    expect(result.kind).toBe("success");
    expect(spy).toHaveBeenCalledWith({ scope: "project" });
  });

  it("keeps default query key stable when scope is omitted", async () => {
    const spy = vi.spyOn(engramApiAdapter, "getContext").mockResolvedValue({
      kind: "empty",
      data: null,
    });

    const options = createContextQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.context.get({ project: undefined, scope: undefined }));
    expect(result).toEqual({
      kind: "empty",
      data: null,
    });
    expect(spy).toHaveBeenCalledWith({ scope: undefined });
  });
});
