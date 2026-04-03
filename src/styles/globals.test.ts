import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const globalsPath = join(process.cwd(), "src/styles/globals.css");

describe("Liquid Glass global tokens", () => {
  it("defines semantic surface and typography tokens", () => {
    const css = readFileSync(globalsPath, "utf-8");

    expect(css).toContain("--surface-canvas");
    expect(css).toContain("--surface-panel");
    expect(css).toContain("--surface-overlay");
    expect(css).toContain("--chrome-gradient-top");
    expect(css).toContain("--chrome-edge-highlight");
    expect(css).toContain("--panel-inner-shadow");
    expect(css).toContain("--type-display");
    expect(css).toContain("--type-title");
    expect(css).toContain("--type-label");
    expect(css).toContain("--focus-ring");
  });

  it("uses an apple-first Tahoe font stack with stable fallbacks", () => {
    const css = readFileSync(globalsPath, "utf-8");

    expect(css).toContain("font-family: -apple-system");
    expect(css).toContain("\"SF Pro Text\"");
    expect(css).toContain("Inter");
  });

  it("contains stronger Tahoe blur tiers", () => {
    const css = readFileSync(globalsPath, "utf-8");

    expect(css).toContain("--glass-blur-xl");
    expect(css).toContain("--glass-blur-strong");
  });

  it("contains reduced-motion fallback for transitions and blur", () => {
    const css = readFileSync(globalsPath, "utf-8");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("--motion-duration-fast: 0ms");
    expect(css).toContain("--glass-blur: 0px");
  });

  it("contains reduced-transparency fallback for stronger readability", () => {
    const css = readFileSync(globalsPath, "utf-8");

    expect(css).toContain("@media (prefers-contrast: more)");
    expect(css).toContain("--surface-panel: oklch(0.995 0.006 250 / 0.92)");
    expect(css).toContain("--glass-blur-xl: 0px");
  });
});
