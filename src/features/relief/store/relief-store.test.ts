import { afterEach, describe, expect, it } from "vitest";

import { resetReliefStore, useReliefStore } from "./relief-store";

describe("relief Zustand store", () => {
  afterEach(() => {
    resetReliefStore();
  });

  it("tracks queue filters and search text for relief operations", () => {
    useReliefStore.getState().setQueueFilter("route-ready");
    useReliefStore.getState().setSearchQuery("bach dang");

    expect(useReliefStore.getState().queueFilter).toBe("route-ready");
    expect(useReliefStore.getState().searchQuery).toBe("bach dang");

    resetReliefStore();

    expect(useReliefStore.getState().queueFilter).toBe("all");
    expect(useReliefStore.getState().searchQuery).toBe("");
  });
});
