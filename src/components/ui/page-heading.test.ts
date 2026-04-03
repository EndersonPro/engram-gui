import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeading } from "@/components/ui/page-heading";
import { SectionMenu } from "@/components/ui/section-menu";

describe("PageHeading and SectionMenu", () => {
  it("renders title/subtitle/badge with optional decorative emoji accent", () => {
    const html = renderToString(
      createElement(PageHeading, {
        title: "Search memories",
        subtitle: "Live search states",
        badge: "Search",
        accentSymbol: "🔎",
      }),
    );

    expect(html).toContain("Search memories");
    expect(html).toContain("Live search states");
    expect(html).toContain("Search");
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
