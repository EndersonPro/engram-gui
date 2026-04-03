import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins only truthy classes", () => {
    expect(cn("base", false && "nope", undefined, "accent")).toBe("base accent");
  });

  it("returns empty string when no class is provided", () => {
    expect(cn(undefined, false && "x", "")).toBe("");
  });
});
