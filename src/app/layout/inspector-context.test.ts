import { describe, expect, it } from "vitest";

import { deriveInspectorContext } from "@app/layout/inspector-context";

describe("deriveInspectorContext", () => {
  it("returns shell context for known route", () => {
    expect(deriveInspectorContext("/timeline")).toEqual({
      route: "/timeline",
      selectedObservationId: null,
      selectedQuery: null,
    });
  });

  it("normalizes unknown routes to not-found contract", () => {
    expect(deriveInspectorContext("/does-not-exist")).toEqual({
      route: "/not-found",
      selectedObservationId: null,
      selectedQuery: null,
    });
  });
});
