import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ContextPage from "@pages/context";
import DashboardPage from "@pages/dashboard";
import MemoriesPage from "@pages/memories";
import SearchPage from "@pages/search";
import TimelinePage from "@pages/timeline";

vi.mock("@features/memories/api/use-memories", () => ({
  createMemoriesQueryOptions: () => ({ queryKey: ["engram", "observations", "recent"] }),
  useMemories: vi.fn(() => ({
    data: {
      kind: "retryable_failure",
      error: { code: "HTTP_503", message: "memories unavailable", retryable: true },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("@features/search/model/search-ui-store", () => ({
  useSearchUiStore: vi.fn((selector: (state: any) => unknown) =>
    selector({
      draftQuery: "vector",
      limit: 10,
      setDraftQuery: vi.fn(),
      setLimit: vi.fn(),
      trimmedQuery: () => "vector",
    }),
  ),
}));

vi.mock("@features/search/api/use-search", () => ({
  getLastValidSearchParamsForRetry: () => ({ q: "vector", limit: 10 }),
  useSearch: vi.fn(() => ({
    data: {
      kind: "retryable_failure",
      error: { code: "HTTP_503", message: "search unavailable", retryable: true },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("@features/timeline/model/timeline-ui-store", () => ({
  resolveTimelineObservationSelection: vi.fn(() => null),
  useTimelineUiStore: vi.fn((selector: (state: any) => unknown) =>
    selector({
      selectedObservationId: null,
      limit: 20,
      setSelectedObservationId: vi.fn(),
      setLimit: vi.fn(),
    }),
  ),
}));

vi.mock("@features/timeline/api/use-timeline", () => ({
  getLastValidTimelineParamsForRetry: () => null,
  useTimeline: vi.fn(() => ({
    data: null,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("@features/context/api/use-context", () => ({
  createContextQueryOptions: () => ({ queryKey: ["engram", "context", "get"] }),
  useContextData: vi.fn(() => ({
    data: { kind: "empty", data: null },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("@features/settings/api/use-settings", () => ({
  createSettingsQueryOptions: () => ({ queryKey: ["engram", "settings", "overview"] }),
  useSettings: vi.fn(() => ({
    data: {
      kind: "success",
      data: {
        sync: null,
        stats: null,
        config: null,
        issues: [{ source: "stats", message: "stats unavailable", retryable: true }],
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("@features/engram-status/api/use-health-status", () => ({
  useHealthStatus: vi.fn(() => ({
    data: null,
    isLoading: false,
    isFetching: false,
  })),
}));

describe("route state matrix", () => {
  it("keeps memories error state and retry action", () => {
    const html = renderToString(createElement(MemoriesPage));

    expect(html).toContain("memories unavailable");
    expect(html).toContain("Retry memories");
    expect(html).toContain('data-page-heading="true"');
  });

  it("keeps search retry affordance from last valid params", () => {
    const html = renderToString(createElement(SearchPage));

    expect(html).toContain('Retry "vector"');
    expect(html).toContain("vector");
  });

  it("shows timeline guidance when no observation target is resolved", () => {
    const html = renderToString(createElement(TimelinePage));

    expect(html).toContain("timeline-observation-select");
    expect(html).toContain("Select an observation");
    expect(html).toContain('data-tahoe-separator="soft"');
  });

  it("shows context empty branch", () => {
    const html = renderToString(createElement(ContextPage));

    expect(html).toContain("No project context available yet");
  });

  it("shows dashboard degraded sources branch", () => {
    const html = renderToString(createElement(DashboardPage));

    expect(html).toContain("Some settings sources are currently unavailable");
    expect(html).toContain("stats unavailable");
  });
});
