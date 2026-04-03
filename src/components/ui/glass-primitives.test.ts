import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
});
