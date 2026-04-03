import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

import { HttpError, createTauriProxyHttpClient } from "@shared/api/http";

describe("createTauriProxyHttpClient", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  type RouteCase = {
    path: string;
    route: string;
    query?: Record<string, string | number | boolean>;
    pathParams?: { id: number };
  };

  const routeCases: RouteCase[] = [
    { path: "/health", route: "health" },
    { path: "/sessions/recent", route: "sessions.recent", query: { project: "engram", limit: 5 } },
    { path: "/observations/recent", route: "observations.recent", query: { scope: "project", limit: 20 } },
    { path: "/search", route: "search.query", query: { q: "parity", project: "engram", limit: 10 } },
    { path: "/timeline", route: "timeline.list", query: { observation_id: 42, before: 2, after: 3 } },
    { path: "/observations/42", route: "observations.getById", pathParams: { id: 42 } },
    { path: "/prompts/recent", route: "prompts.recent", query: { project: "engram", limit: 20 } },
    { path: "/prompts/search", route: "prompts.search", query: { q: "migration", limit: 10 } },
    { path: "/context", route: "context.get", query: { project: "engram", scope: "project" } },
    { path: "/export", route: "export.get" },
    { path: "/stats", route: "stats.get" },
    { path: "/sync/status", route: "sync.status" },
  ];

  for (const routeCase of routeCases) {
    it(`maps ${routeCase.path} to ${routeCase.route}`, async () => {
      invokeMock.mockResolvedValue({ status: 200, body: { ok: true } });
      const client = createTauriProxyHttpClient();

      await client.request(routeCase.path, {
        method: "GET",
        query: routeCase.query,
      });

      expect(invokeMock).toHaveBeenCalledWith("proxy_engram_get", {
        request: {
          route: routeCase.route,
          query: routeCase.query,
          ...(routeCase.pathParams ? { pathParams: routeCase.pathParams } : {}),
        },
      });
    });
  }

  it("rejects synthetic /memories route", async () => {
    const client = createTauriProxyHttpClient();

    await expect(client.request("/memories", { method: "GET" })).rejects.toBeInstanceOf(HttpError);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("rejects synthetic /settings route", async () => {
    const client = createTauriProxyHttpClient();

    await expect(client.request("/settings", { method: "GET" })).rejects.toBeInstanceOf(HttpError);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("rejects /observations/{id} when id is missing", async () => {
    const client = createTauriProxyHttpClient();

    await expect(client.request("/observations/", { method: "GET" })).rejects.toBeInstanceOf(HttpError);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("keeps non-GET endpoints out of scope (no POST route passthrough)", async () => {
    const client = createTauriProxyHttpClient();

    await expect(client.request("/sessions", { method: "POST" as "GET" })).rejects.toBeInstanceOf(HttpError);
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
