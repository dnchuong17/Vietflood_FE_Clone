import { afterEach, describe, expect, it } from "vitest";

import { resetTrackingStore, useTrackingStore } from "./tracking-store";

describe("tracking Zustand store", () => {
  afterEach(() => {
    resetTrackingStore();
  });

  it("normalizes snapshots, upserts locations, and removes disconnected users", () => {
    const applied = useTrackingStore.getState().applyTrackingSnapshot({
      locations: [{ socketId: "socket-a", latitude: "10.1", longitude: "106.1" }],
    });

    expect(applied).toBe(true);
    expect(useTrackingStore.getState().locations).toEqual([
      expect.objectContaining({
        socketId: "socket-a",
        latitude: 10.1,
        longitude: 106.1,
      }),
    ]);

    useTrackingStore.getState().upsertLocation({
      socketId: "socket-a",
      latitude: 10.2,
      longitude: 106.2,
    });
    expect(useTrackingStore.getState().locations).toHaveLength(1);
    expect(useTrackingStore.getState().locations[0].latitude).toBe(10.2);

    useTrackingStore.getState().removeLocation("socket-a");
    expect(useTrackingStore.getState().locations).toEqual([]);
  });
});
