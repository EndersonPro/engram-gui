import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "@/app/providers/app-providers";
import { appRoutes } from "@/app/router/routes";

const renderPath = (path: string) => {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return renderToString(createElement(AppProviders, null, createElement(RouterProvider, { router })));
};

describe("Tahoe accessibility guards", () => {
  it("keeps focus-ring metadata and decorative emoji semantics in shell and dashboard", () => {
    const shellHtml = renderPath("/");

    expect(shellHtml).toContain('data-focus-ring="visible"');
    expect(shellHtml).toContain('data-emoji-accent="decorative"');
  });

  it("keeps strong contrast metadata on interactive controls", () => {
    const settingsHtml = renderPath("/settings");

    expect(settingsHtml).toContain('data-tahoe-contrast="strong"');
  });
});
