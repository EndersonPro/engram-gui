import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet } from "@/components/ui/sheet";

describe("Tahoe glass primitives", () => {
  it("renders card with Tahoe material metadata", () => {
    const html = renderToString(createElement(Card, null, "Card body"));

    expect(html).toContain("<section");
    expect(html).toContain('data-tahoe-surface="elevated"');
  });

  it("supports differentiated sheet depth for rail hierarchy", () => {
    const railHtml = renderToString(createElement(Sheet, { depth: "rail" }, "Rail"));
    const panelHtml = renderToString(createElement(Sheet, null, "Panel"));

    expect(railHtml).toContain('data-tahoe-depth="rail"');
    expect(panelHtml).toContain('data-tahoe-depth="panel"');
  });

  it("keeps button and badge API stable while exposing contrast metadata", () => {
    const buttonHtml = renderToString(createElement(Button, { variant: "secondary" }, "Open"));
    const badgeHtml = renderToString(createElement(Badge, { variant: "warning" }, "Starting"));

    expect(buttonHtml).toContain("Open");
    expect(buttonHtml).toContain('data-focus-ring="visible"');
    expect(buttonHtml).toContain('data-tahoe-contrast="strong"');

    expect(badgeHtml).toContain("Starting");
    expect(badgeHtml).toContain('data-tahoe-contrast="strong"');
  });

  it("supports optional Tahoe metadata variants for separator and card density", () => {
    const separatorHtml = renderToString(createElement(Separator, { tone: "strong" }));
    const cardHtml = renderToString(createElement(Card, { tone: "content", density: "compact" }, "Body"));

    expect(separatorHtml).toContain('data-tahoe-separator="strong"');
    expect(cardHtml).toContain('data-tahoe-tone="content"');
    expect(cardHtml).toContain('data-tahoe-density="compact"');
  });

  it("allows optional decorative accents and icon-leading control hints", () => {
    const buttonHtml = renderToString(createElement(Button, { iconLeading: true }, "Run"));
    const badgeHtml = renderToString(createElement(Badge, { accent: "✨" }, "Highlighted"));

    expect(buttonHtml).toContain('data-icon-leading="true"');
    expect(badgeHtml).toContain('data-badge-accent="true"');
  });
});
