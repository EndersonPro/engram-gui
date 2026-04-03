import { describe, expect, it } from "vitest";

import { isElementOverflowing } from "@/components/ui/scroll-area";

describe("ScrollArea overflow detection", () => {
  it("returns false when content fits within container", () => {
    const element = {
      scrollHeight: 300,
      clientHeight: 300,
      scrollWidth: 420,
      clientWidth: 420,
    };

    expect(isElementOverflowing(element)).toBe(false);
  });

  it("returns true when vertical content exceeds the container", () => {
    const element = {
      scrollHeight: 301,
      clientHeight: 300,
      scrollWidth: 420,
      clientWidth: 420,
    };

    expect(isElementOverflowing(element)).toBe(true);
  });

  it("returns true when horizontal content exceeds the container", () => {
    const element = {
      scrollHeight: 300,
      clientHeight: 300,
      scrollWidth: 421,
      clientWidth: 420,
    };

    expect(isElementOverflowing(element)).toBe(true);
  });
});
