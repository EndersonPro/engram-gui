import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeading } from "@/components/ui/page-heading";
import { SectionMenu } from "@/components/ui/section-menu";
import { SearchIcon } from "@/components/ui/icons";

describe("PageHeading and SectionMenu", () => {
  it("renders title/subtitle/badge with SVG icon", () => {
    const html = renderToString(
      createElement(PageHeading, {
        title: "Search memories",
        subtitle: "Live search states",
        badge: "Search",
        icon: SearchIcon,
      }),
    );

    expect(html).toContain("Search memories");
    expect(html).toContain("Live search states");
    expect(html).toContain("Search");
    expect(html).toContain("<svg");
  });

  it("falls back to emoji accent when accentSymbol is used (backward compat)", () => {
    const html = renderToString(
      createElement(PageHeading, {
        title: "Dashboard",
        accentSymbol: "🔎",
      }),
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("🔎");
  });

  it("renders a menu row with consistent action semantics", () => {
    const html = renderToString(
      createElement(SectionMenu, {
        items: [
          { key: "refresh", label: "Refresh", variant: "secondary" },
          { key: "retry", label: "Retry", variant: "destructive" },
        ],
        ariaLabel: "Section actions",
      }),
    );

    expect(html).toContain('aria-label="Section actions"');
    expect(html).toContain("Refresh");
    expect(html).toContain("Retry");
  });
});
