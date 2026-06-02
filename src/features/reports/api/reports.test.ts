import { describe, expect, it } from "vitest";

import { normalizeReport } from "./reports";

describe("reports API normalization", () => {
  it("accepts mobile/backend latitude and longitude fields as web lat/lng", () => {
    expect(
      normalizeReport({
        id: 12,
        latitude: "16.0544",
        longitude: 108.2022,
      }),
    ).toMatchObject({
      id: 12,
      lat: 16.0544,
      lng: 108.2022,
      latitude: 16.0544,
      longitude: 108.2022,
    });
  });
});
