import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const parseJsonResponse = vi.fn(async (response: { payload: unknown }) => response.payload);

vi.mock("../../auth/lib/api-client", () => ({
  apiGet,
  apiPost,
  apiPath: (path: string) => `https://api.test${path}`,
  parseJsonResponse,
}));

describe("location geocoding API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reverse geocodes device coordinates through the backend", async () => {
    const payload = {
      coordinates: { lat: 16.0544, lng: 108.2022 },
      province: { code: 48, name: "Da Nang" },
      ward: { code: 20194, name: "Hai Chau", provinceCode: 48 },
      addressLine: "12 Bach Dang",
      displayName: "12 Bach Dang, Da Nang",
      matchLevel: "ward",
      attribution: {
        provider: "OpenStreetMap Nominatim",
        license: "OpenStreetMap contributors",
        url: "https://www.openstreetmap.org/copyright",
      },
    };
    apiGet.mockResolvedValue({ payload });

    const { reverseGeocodeLocation } = await import("./geocoding");

    await expect(
      reverseGeocodeLocation({ lat: 16.0544, lng: 108.2022 }),
    ).resolves.toEqual(payload);
    expect(apiGet).toHaveBeenCalledWith(
      "https://api.test/locations/reverse?lat=16.0544&lng=108.2022",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
    expect(parseJsonResponse).toHaveBeenCalledWith(
      { payload },
      expect.stringContaining("vi tri"),
    );
  });

  it("forward geocodes the edited report address through the backend", async () => {
    const payload = {
      coordinates: { lat: 16.0544, lng: 108.2022 },
      province: { code: 48, name: "Da Nang" },
      ward: { code: 20194, name: "Hai Chau", provinceCode: 48 },
      addressLine: "12 Bach Dang",
      displayName: "12 Bach Dang, Da Nang",
      matchLevel: "ward",
      attribution: {
        provider: "OpenStreetMap Nominatim",
        license: "OpenStreetMap contributors",
        url: "https://www.openstreetmap.org/copyright",
      },
    };
    apiPost.mockResolvedValue({ payload });

    const { geocodeReportLocation } = await import("./geocoding");

    await expect(
      geocodeReportLocation({
        province: "Da Nang",
        ward: "Hai Chau",
        addressLine: "12 Bach Dang",
      }),
    ).resolves.toEqual(payload);
    expect(apiPost).toHaveBeenCalledWith(
      "https://api.test/locations/geocode",
      { province: "Da Nang", ward: "Hai Chau", addressLine: "12 Bach Dang" },
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
    expect(parseJsonResponse).toHaveBeenCalledWith(
      { payload },
      expect.stringContaining("toa do"),
    );
  });
});
