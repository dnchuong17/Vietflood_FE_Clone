import { describe, expect, it } from "vitest";

import {
  buildGoogleMapsDirectionsUrl,
  getTrackingLocationId,
  normalizeTrackingLocations,
} from "./tracking";

describe("tracking helpers", () => {
  it("builds Google Maps directions with origin and destination", () => {
    expect(
      buildGoogleMapsDirectionsUrl(
        { latitude: 10.7769, longitude: 106.7009 },
        { latitude: 10.7626, longitude: 106.6602 },
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=10.7769%2C106.7009&travelmode=driving&origin=10.7626%2C106.6602",
    );
  });

  it("builds destination-only directions when origin is unavailable", () => {
    expect(
      buildGoogleMapsDirectionsUrl({ latitude: 16.0544, longitude: 108.2022 }),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=16.0544%2C108.2022&travelmode=driving",
    );
  });

  it("normalizes snapshot arrays, envelopes, and maps", () => {
    expect(
      normalizeTrackingLocations({
        locations: [
          {
            socketId: "socket-a",
            latitude: "10.1",
            longitude: "106.1",
            timestamp: 1710000000000,
          },
        ],
      }),
    ).toEqual([
      {
        socketId: "socket-a",
        latitude: 10.1,
        longitude: 106.1,
        timestamp: 1710000000000,
        updatedAt: "2024-03-09T16:00:00.000Z",
      },
    ]);

    expect(
      normalizeTrackingLocations({
        "socket-b": { lat: 11.2, lng: 107.2, accuracy: "14" },
      }),
    ).toEqual([
      expect.objectContaining({
        socketId: "socket-b",
        latitude: 11.2,
        longitude: 107.2,
        accuracy: 14,
      }),
    ]);
  });

  it("normalizes mobile-compatible realtime events and snapshot maps", () => {
    expect(
      normalizeTrackingLocations({
        id: "socket-a",
        latitude: 16.05,
        longitude: 108.2,
        timestamp: 1746547265000,
        displayName: "Responder Lan",
        username: "lan.tran",
      }),
    ).toEqual([
      {
        id: "socket-a",
        socketId: "socket-a",
        latitude: 16.05,
        longitude: 108.2,
        accuracy: undefined,
        heading: undefined,
        speed: undefined,
        timestamp: 1746547265000,
        updatedAt: "2025-05-06T16:01:05.000Z",
        displayName: "Responder Lan",
        username: "lan.tran",
        userId: undefined,
      },
    ]);

    expect(
      normalizeTrackingLocations({
        locations: {
          "socket-b": {
            latitude: "16.0544",
            longitude: "108.2022",
            displayName: "Relief One",
          },
        },
      }),
    ).toEqual([
      expect.objectContaining({
        socketId: "socket-b",
        latitude: 16.0544,
        longitude: 108.2022,
        displayName: "Relief One",
      }),
    ]);
  });

  it("derives a stable tracking location id", () => {
    expect(getTrackingLocationId({ id: "id-1" })).toBe("id-1");
    expect(getTrackingLocationId({ socketId: "socket-1" })).toBe("socket-1");
    expect(getTrackingLocationId({ userId: 42 })).toBe("42");
  });
});
