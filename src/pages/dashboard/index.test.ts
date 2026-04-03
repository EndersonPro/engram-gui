import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "@/app/providers/app-providers";
import DashboardPage from "@/pages/dashboard";

describe("Dashboard Tahoe composition", () => {
  it("renders hero, status, and action surfaces while preserving runtime panel", () => {
    const html = renderToString(createElement(AppProviders, null, createElement(DashboardPage)));

    expect(html).toContain("Runtime command center");
    expect(html).toContain("Status overview");
    expect(html).toContain("Runtime controls");
    expect(html).toContain("Engram Runtime Status");
  });

  it("marks dashboard sections as reduced-motion safe containers", () => {
    const html = renderToString(createElement(AppProviders, null, createElement(DashboardPage)));

    expect(html).toContain('data-dashboard-motion="reduce-safe"');
  });
});
