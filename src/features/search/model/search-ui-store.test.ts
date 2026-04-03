import { afterEach, describe, expect, it } from "vitest";

import { resetSearchUiStore, useSearchUiStore } from "@features/search/model/search-ui-store";

describe("search ui store", () => {
  afterEach(() => {
    resetSearchUiStore();
  });

  it("stores draft query and returns trimmed query selector", () => {
    useSearchUiStore.getState().setDraftQuery("   vector db   ");

    expect(useSearchUiStore.getState().draftQuery).toBe("   vector db   ");
    expect(useSearchUiStore.getState().trimmedQuery()).toBe("vector db");
  });

  it("stores limit changes", () => {
    useSearchUiStore.getState().setLimit(50);

    expect(useSearchUiStore.getState().limit).toBe(50);
  });
});
