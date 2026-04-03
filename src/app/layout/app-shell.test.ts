import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "@app/providers/app-providers";
import { appRoutes } from "@app/router/routes";

const renderPath = (path: string) => {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });

  return renderToString(
    createElement(AppProviders, null, createElement(RouterProvider, { router })),
  );
};

describe("AppShell", () => {
  it("renders desktop inspector rail alongside route content", () => {
    const html = renderPath("/search");

    expect(html).toContain("Inspector");
    expect(html).toContain("search");
    expect(html).toContain("Search memories");
    expect(html).toContain("data-shell-layer=\"chrome\"");
  });

  it("keeps keyboard focus ring hooks present in shell nav", () => {
    const html = renderPath("/");

    expect(html).toContain("<nav aria-label=\"Primary\"");
    expect(html).toContain("href=\"/settings\"");
    expect(html).toContain("Tahoe");
  });
});
