import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MemoriesPage from "@pages/memories";
import TimelinePage from "@pages/timeline";

vi.mock("@features/memories/api/use-memories", () => ({
  createMemoriesQueryOptions: () => ({ queryKey: ["engram", "observations", "recent"] }),
  useMemories: vi.fn((params?: { limit?: number }) => {
    const observations = [
      {
        id: 101,
        project: "engram-gui",
        scope: "project",
        createdAt: "2026-04-02T10:00:00Z",
        content: "Memory one",
        title: "Observation one",
      },
      {
        id: 102,
        project: "engram-gui",
        scope: "project",
        createdAt: "2026-04-02T10:01:00Z",
        content: "Memory two",
        title: "Observation two",
      },
    ];

    if (params?.limit === 50) {
      return {
        data: { kind: "success", data: observations },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    }

    return {
      data: { kind: "success", data: observations },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  }),
}));

vi.mock("@features/timeline/model/timeline-ui-store", () => ({
  resolveTimelineObservationSelection: vi.fn(() => 101),
  useTimelineUiStore: vi.fn((selector: (state: any) => unknown) =>
    selector({
      selectedObservationId: 101,
      limit: 20,
      setSelectedObservationId: vi.fn(),
      setLimit: vi.fn(),
    }),
  ),
}));

vi.mock("@features/timeline/api/use-timeline", () => ({
  getLastValidTimelineParamsForRetry: vi.fn(() => ({ observation_id: 101, before: 20, after: 20 })),
  useTimeline: vi.fn(() => ({
    data: {
      kind: "success",
      data: {
        entries: [
          { id: "t-1", label: "Timeline one", happenedAt: "2026-04-02T10:00:00Z" },
          { id: "t-2", label: "Timeline two", happenedAt: "2026-04-02T10:01:00Z" },
        ],
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

describe("dense list visual separation", () => {
  it("uses spacing and tonal surfaces (without dividers) for memories items", () => {
    const html = renderToString(createElement(MemoriesPage));

    expect(html).toContain('data-separation="spacing-tonal"');
    expect(html).toContain('data-divider="none"');
    expect(html).toContain("Memory one");
    expect(html).toContain("Memory two");
    expect(html).toContain('data-tahoe-density="compact"');
    expect(html).not.toContain("<hr");
    expect(html).not.toContain("divide-y");
    expect(html).not.toContain("border-b");
  });

  it("uses spacing and tonal surfaces (without dividers) for timeline entries", () => {
    const html = renderToString(createElement(TimelinePage));

    expect(html).toContain('data-separation="spacing-tonal"');
    expect(html).toContain('data-divider="none"');
    expect(html).toContain("Timeline one");
    expect(html).toContain("Timeline two");
    expect(html).toContain('data-page-heading="true"');
    expect(html).not.toContain("<hr");
    expect(html).not.toContain("divide-y");
    expect(html).not.toContain("border-b");
  });
});
