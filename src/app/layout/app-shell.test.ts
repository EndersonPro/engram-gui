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
    expect(html).not.toContain("Tahoe Liquid Glass");
    expect(html).not.toContain("Engram Desktop");
    expect(html).not.toContain(">Shell<");
  });

  it("keeps keyboard focus ring hooks and grouped section actions in shell", () => {
    const html = renderPath("/");

    expect(html).toContain("<nav aria-label=\"Primary\"");
    expect(html).toContain("flex w-full min-w-[720px] flex-row items-center gap-3");
    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("href=\"/settings\"");
    expect(html).toContain('data-focus-ring="visible"');
    expect(html).toContain('aria-label="Inspector actions"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("📊");
    expect(html).not.toContain("🧠");
    expect(html).not.toContain("🔎");
    expect(html).not.toContain("🕒");
    expect(html).not.toContain("📎");
    expect(html).not.toContain("⚙️");
  });
});
