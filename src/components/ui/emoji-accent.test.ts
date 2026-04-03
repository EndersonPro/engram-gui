import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmojiAccent } from "@/components/ui/emoji-accent";

describe("EmojiAccent", () => {
  it("renders decorative emoji by default with aria-hidden semantics", () => {
    const html = renderToString(createElement(EmojiAccent, { symbol: "✨" }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("✨");
  });

  it("renders deterministic fallback glyph when symbol is blank", () => {
    const html = renderToString(createElement(EmojiAccent, { symbol: "" }));

    expect(html).toContain("•");
  });

  it("supports semantic label mode with sr-only text while emoji remains decorative", () => {
    const html = renderToString(createElement(EmojiAccent, { symbol: "⚠️", label: "Warning", decorative: false }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("Warning");
    expect(html).toContain("sr-only");
  });
});
