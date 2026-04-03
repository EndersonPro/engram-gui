import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AppProviders } from "@app/providers/app-providers";
import { queryClient } from "@app/query/client";
import { appRoutes } from "@app/router/routes";
import { createSearchQueryOptions, resetLastValidSearchParamsForRetry } from "@features/search/api/use-search";
import { resetSearchUiStore, useSearchUiStore } from "@features/search/model/search-ui-store";
import { createTimelineQueryOptions, resetLastValidTimelineParamsForRetry } from "@features/timeline/api/use-timeline";
import { resetTimelineUiStore, useTimelineUiStore } from "@features/timeline/model/timeline-ui-store";
import {
  allowlistHasPreconditionCoverage,
  canGraduateRoute,
  canGraduateRouteWithPreconditions,
  isRouteTransportAllowlisted,
  transportPolicy,
} from "@app/router/transport-policy";
import { queryKeys } from "@shared/constants/query-keys";

afterEach(() => {
  queryClient.clear();
  resetSearchUiStore();
  resetTimelineUiStore();
  resetLastValidSearchParamsForRetry();
  resetLastValidTimelineParamsForRetry();
});

const renderRoute = (path: string) => {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });

  return renderToString(
    createElement(
      AppProviders,
      null,
      createElement(RouterProvider, {
        router,
      }),
    ),
  );
};

describe("shell bootstrap and routing guardrails", () => {
  it("boots into shell chrome with dashboard route and inspector rail", () => {
    const html = renderRoute("/");

    expect(html).toContain("Engram Desktop");
    expect(html).toContain("Tahoe");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Runtime command center");
    expect(html).toContain("Inspector");
  });

  it("renders unknown-route fallback inside shell chrome", () => {
    const html = renderRoute("/unknown-route");

    expect(html).toContain("Engram Desktop");
    expect(html).toContain("Page not found");
    expect(html).toContain("Back to dashboard");
  });

  it("keeps memories and settings deferred until validated", () => {
    const allRouteKeys = ["observations", "search", "timeline", "context", "sync", "stats"] as const;
    const deferredRoutes = allRouteKeys.filter((route) => !isRouteTransportAllowlisted(route));

    expect(deferredRoutes).toEqual([]);
  });

  it("regresses if synthetic transport routes are reintroduced", () => {
    expect(transportPolicy.allowlistedRoutes).toEqual([
      "search",
      "timeline",
      "context",
      "observations",
      "sync",
      "stats",
    ]);
    expect(transportPolicy.allowlistedRoutes).not.toContain("memories" as never);
    expect(transportPolicy.allowlistedRoutes).not.toContain("settings" as never);
  });

  it("enforces transport allowlist and ordered graduation", () => {
    expect(isRouteTransportAllowlisted("observations")).toBe(true);
    expect(isRouteTransportAllowlisted("search")).toBe(true);
    expect(isRouteTransportAllowlisted("timeline")).toBe(true);
    expect(isRouteTransportAllowlisted("context")).toBe(true);
    expect(isRouteTransportAllowlisted("sync")).toBe(true);
    expect(isRouteTransportAllowlisted("stats")).toBe(true);
    expect(canGraduateRoute("search", [])).toBe(true);
    expect(canGraduateRoute("timeline", ["search"])).toBe(true);
    expect(canGraduateRoute("context", ["search", "timeline"])).toBe(true);
    expect(canGraduateRoute("observations", ["search", "timeline", "context"])).toBe(true);
    expect(canGraduateRoute("sync", ["search", "timeline", "context", "observations"])).toBe(true);
    expect(canGraduateRoute("stats", ["search", "timeline", "context", "observations", "sync"])).toBe(true);

    const searchHtml = renderRoute("/search");
    expect(searchHtml).toContain("Search memories");
    expect(searchHtml).toContain("search-query-input");

    const timelineHtml = renderRoute("/timeline");
    expect(timelineHtml).toContain("Observation timeline");
    expect(timelineHtml).toContain("timeline-observation-select");

    const contextHtml = renderRoute("/context");
    expect(contextHtml).toContain("Project context");
    expect(contextHtml).toContain("Query key:");

    const settingsHtml = renderRoute("/settings");
    expect(settingsHtml).toContain("Runtime settings overview");
    expect(settingsHtml).toContain("Query key:");

    const memoriesHtml = renderRoute("/memories");
    expect(memoriesHtml).toContain("Recent memories");
    expect(memoriesHtml).toContain("Query key:");
  });

  it("renders error and degraded data contracts from cached live results", () => {
    queryClient.setQueryData(queryKeys.engram.observations.recent({ project: undefined, scope: undefined, limit: 20 }), {
      kind: "retryable_failure",
      error: {
        code: "HTTP_503",
        message: "memories unavailable",
        retryable: true,
      },
    });
    queryClient.setQueryData(queryKeys.engram.context.get({ project: undefined, scope: "project" }), {
      kind: "empty",
      data: null,
    });
    queryClient.setQueryData(queryKeys.engram.settings.overview, {
      kind: "success",
      data: {
        sync: {
          enabled: true,
          phase: "healthy",
          consecutive_failures: 0,
        },
        stats: null,
        config: {
          binaryPath: "/tmp/engram",
          apiBaseUrl: "http://127.0.0.1:8000",
          healthUrl: "http://127.0.0.1:8000/health",
        },
        issues: [
          {
            source: "stats",
            message: "stats unavailable",
            retryable: true,
          },
        ],
      },
    });

    expect(renderRoute("/memories")).toContain("Unable to load memories");
    expect(renderRoute("/context")).toContain("No project context available yet");
    expect(renderRoute("/settings")).toContain("Some settings sources are currently unavailable");
  });

  it("preserves last valid search params in route retry affordance", () => {
    createSearchQueryOptions({ q: "vector db", project: undefined, scope: "project", limit: 15 });
    useSearchUiStore.setState({ draftQuery: "   ", limit: 20 });

    queryClient.setQueryData(
      queryKeys.engram.search.query({ q: "", project: undefined, scope: undefined, limit: 20 }),
      {
        kind: "retryable_failure",
        error: {
          code: "HTTP_503",
          message: "search unavailable",
          retryable: true,
        },
      },
    );

    const searchHtml = renderRoute("/search");
    expect(searchHtml).toContain("Retry last search");
    expect(searchHtml).toContain("vector db");
    expect(searchHtml).toContain("limit 15");
  });

  it("preserves selected timeline target and limit in route retry affordance", () => {
    createTimelineQueryOptions({ observation_id: 42, before: 9, after: 9 });
    useTimelineUiStore.setState({ selectedObservationId: null, limit: 20 });

    queryClient.setQueryData(queryKeys.engram.timeline.list({ observation_id: 0, before: 20, after: 20 }), {
      kind: "retryable_failure",
      error: {
        code: "HTTP_503",
        message: "timeline unavailable",
        retryable: true,
      },
    });

    const timelineHtml = renderRoute("/timeline");
    expect(timelineHtml).toContain("Retry timeline");
    expect(timelineHtml).toContain("#42");
    expect(timelineHtml).toContain("limit 9");
  });

  it("blocks out-of-order graduation when observations is requested before context", () => {
    expect(canGraduateRoute("observations", ["search", "timeline"])).toBe(false);
    expect(canGraduateRoute("observations", ["search", "timeline", "context"])).toBe(true);
  });

  it("blocks transport for non-allowlisted routes under a partial graduation policy", () => {
    const partialAllowlist = ["search", "timeline", "context"] as const;

    expect(isRouteTransportAllowlisted("observations", partialAllowlist)).toBe(false);
    expect(isRouteTransportAllowlisted("search", partialAllowlist)).toBe(true);
  });

  it("blocks graduation when contract preconditions are incomplete", () => {
    expect(
      canGraduateRouteWithPreconditions("search", {
        allowlistedRoutes: ["search"],
        checks: {
          contract: true,
          adapter: false,
          guardrail: true,
        },
      }),
    ).toBe(false);
  });

  it("allows graduation only when contract, adapter, and guardrail preconditions pass", () => {
    expect(
      canGraduateRouteWithPreconditions("search", {
        allowlistedRoutes: ["search"],
        checks: {
          contract: true,
          adapter: true,
          guardrail: true,
        },
      }),
    ).toBe(true);

    expect(
      canGraduateRouteWithPreconditions("context", {
        allowlistedRoutes: ["search", "timeline"],
        checks: {
          contract: true,
          adapter: true,
          guardrail: true,
        },
      }),
    ).toBe(true);

    expect(
      canGraduateRouteWithPreconditions("stats", {
        allowlistedRoutes: ["search", "timeline", "context", "observations", "sync"],
        checks: {
          contract: true,
          adapter: true,
          guardrail: true,
        },
      }),
    ).toBe(true);
  });

  it("requires precondition coverage for every allowlisted graduated route", () => {
    const completeCoverage = {
      search: { contract: true, adapter: true, guardrail: true },
      timeline: { contract: true, adapter: true, guardrail: true },
      context: { contract: true, adapter: true, guardrail: true },
      observations: { contract: true, adapter: true, guardrail: true },
      sync: { contract: true, adapter: true, guardrail: true },
      stats: { contract: false, adapter: false, guardrail: true },
    } as const;

    expect(
      allowlistHasPreconditionCoverage(
        ["search", "timeline", "context"],
        completeCoverage,
      ),
    ).toBe(true);

    expect(
      allowlistHasPreconditionCoverage(
        ["search", "timeline", "context", "observations", "sync"],
        completeCoverage,
      ),
    ).toBe(true);

    expect(
      allowlistHasPreconditionCoverage(
        ["search", "timeline", "context"],
        {
          ...completeCoverage,
          timeline: { contract: true, adapter: false, guardrail: true },
        },
      ),
    ).toBe(false);
  });
});
