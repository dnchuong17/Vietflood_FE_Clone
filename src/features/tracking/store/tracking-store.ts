import { create } from "zustand";

import {
  getTrackingLocationId,
  normalizeTrackingLocations,
  type TrackedLocation,
} from "../lib/tracking";

type TrackingStore = {
  isConnected: boolean;
  isSharing: boolean;
  lastShared: TrackedLocation | null;
  locations: TrackedLocation[];
  isSnapshotLoading: boolean;
  snapshotHint: string | null;
  socketHint: string | null;
  routingLocationId: string | null;
  setConnected: (isConnected: boolean) => void;
  setSharing: (isSharing: boolean) => void;
  setLastShared: (location: TrackedLocation | null) => void;
  setSnapshotLoading: (isSnapshotLoading: boolean) => void;
  setSnapshotHint: (snapshotHint: string | null) => void;
  setSocketHint: (socketHint: string | null) => void;
  setRoutingLocationId: (routingLocationId: string | null) => void;
  upsertLocation: (location: TrackedLocation) => void;
  applyTrackingSnapshot: (payload: unknown) => boolean;
  removeLocation: (locationId: string) => void;
};

const initialState = {
  isConnected: false,
  isSharing: false,
  lastShared: null,
  locations: [] as TrackedLocation[],
  isSnapshotLoading: false,
  snapshotHint: null,
  socketHint: null,
  routingLocationId: null,
};

export const useTrackingStore = create<TrackingStore>()((set) => ({
  ...initialState,
  setConnected: (isConnected) => set({ isConnected }),
  setSharing: (isSharing) => set({ isSharing }),
  setLastShared: (lastShared) => set({ lastShared }),
  setSnapshotLoading: (isSnapshotLoading) => set({ isSnapshotLoading }),
  setSnapshotHint: (snapshotHint) => set({ snapshotHint }),
  setSocketHint: (socketHint) => set({ socketHint }),
  setRoutingLocationId: (routingLocationId) => set({ routingLocationId }),
  upsertLocation: (location) =>
    set((state) => {
      const id = getTrackingLocationId(location);
      if (!id) {
        return { locations: [location, ...state.locations].slice(0, 50) };
      }

      const next = state.locations.filter(
        (item) => getTrackingLocationId(item) !== id,
      );
      return { locations: [location, ...next].slice(0, 50) };
    }),
  applyTrackingSnapshot: (payload) => {
    const nextLocations = normalizeTrackingLocations(payload);
    if (nextLocations.length === 0) {
      return false;
    }

    set({ locations: nextLocations, snapshotHint: null });
    return true;
  },
  removeLocation: (locationId) =>
    set((state) => ({
      locations: state.locations.filter(
        (location) => getTrackingLocationId(location) !== locationId,
      ),
    })),
}));

export function resetTrackingStore() {
  useTrackingStore.setState(initialState);
}
