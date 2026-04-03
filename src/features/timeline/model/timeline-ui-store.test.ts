import { afterEach, describe, expect, it } from "vitest";

import {
  pickDeterministicObservationId,
  resetTimelineUiStore,
  resolveTimelineObservationSelection,
  useTimelineUiStore,
} from "@features/timeline/model/timeline-ui-store";

describe("timeline ui store", () => {
  afterEach(() => {
    resetTimelineUiStore();
  });

  it("stores manual selection and limit", () => {
    useTimelineUiStore.getState().setSelectedObservationId(42);
    useTimelineUiStore.getState().setLimit(12);

    expect(useTimelineUiStore.getState().selectedObservationId).toBe(42);
    expect(useTimelineUiStore.getState().limit).toBe(12);
  });

  it("chooses deterministic fallback when no manual selection exists", () => {
    const fallback = pickDeterministicObservationId([
      { id: 4, createdAt: "2026-04-02T12:00:00Z" },
      { id: 8, createdAt: "2026-04-02T13:00:00Z" },
      { id: 2, createdAt: "2026-04-02T13:00:00Z" },
    ]);

    expect(fallback).toBe(2);
  });

  it("preserves manual selection over fallback", () => {
    const selected = resolveTimelineObservationSelection(15, [
      { id: 7, createdAt: "2026-04-02T13:00:00Z" },
      { id: 2, createdAt: "2026-04-02T12:00:00Z" },
    ]);

    expect(selected).toBe(15);
  });
});
