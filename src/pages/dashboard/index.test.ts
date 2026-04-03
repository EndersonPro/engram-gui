import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "@/app/providers/app-providers";
import DashboardPage from "@/pages/dashboard";

describe("Dashboard Tahoe composition", () => {
  it("renders hero and compact status surface while preserving runtime panel", () => {
    const html = renderToString(createElement(AppProviders, null, createElement(DashboardPage)));

    expect(html).toContain("Engine Controls");
    expect(html).toContain("System Intelligence");
    expect(html).toContain("Engram Runtime");
    expect(html).toContain("Health");
    expect(html).toContain('data-page-heading="true"');
  });

  it("marks dashboard section as reduced-motion safe and keeps lifecycle actions", () => {
    const html = renderToString(createElement(AppProviders, null, createElement(DashboardPage)));

    expect(html).toContain('data-dashboard-motion="reduce-safe"');
    expect(html).toContain("Start");
    expect(html).toContain("Stop");
    expect(html).toContain("Restart");
    expect(html).toContain("Refresh status");
    expect(html).not.toContain("🚀");
    expect(html).not.toContain("🛠️");
  });
});
