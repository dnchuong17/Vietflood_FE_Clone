import {
  apiGet,
  apiPath,
  apiPost,
  parseJsonResponse,
} from "../../auth/lib/api-client";

export type GeocodingCoordinates = {
  lat: number;
  lng: number;
};

export type GeocodingDivision = {
  code: number;
  name: string;
};

export type GeocodingWard = GeocodingDivision & {
  provinceCode: number;
};

export type GeocodingAttribution = {
  provider: string;
  license: string;
  url: string;
};

export type GeocodingResult = {
  coordinates: GeocodingCoordinates | null;
  province: GeocodingDivision | null;
  ward: GeocodingWard | null;
  addressLine: string | null;
  displayName: string | null;
  matchLevel: "ward" | "province" | "coordinates" | "unmatched";
  attribution: GeocodingAttribution;
};

export async function reverseGeocodeLocation(
  coordinates: GeocodingCoordinates,
): Promise<GeocodingResult> {
  const params = new URLSearchParams({
    lat: String(coordinates.lat),
    lng: String(coordinates.lng),
  });
  const response = await apiGet(apiPath(`/locations/reverse?${params.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<GeocodingResult>(
    response,
    "Khong the lay vi tri tu GPS.",
  );
}

export async function geocodeReportLocation(input: {
  province: string;
  ward: string;
  addressLine: string;
}): Promise<GeocodingResult> {
  const response = await apiPost(apiPath("/locations/geocode"), input, {
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<GeocodingResult>(
    response,
    "Khong the tim toa do cho dia chi nay.",
  );
}
