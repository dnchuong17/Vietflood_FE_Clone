import { API_BASE_URL } from "../../../lib/api-config";

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type TrackedLocation = {
  id?: string;
  socketId?: string;
  clientId?: string;
  userId?: number | string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  updatedAt?: string;
  displayName?: string;
  username?: string;
};

type UnknownRecord = Record<string, unknown>;

export const TRACKING_SOCKET_URL =
  process.env.NEXT_PUBLIC_TRACKING_SOCKET_URL ?? API_BASE_URL;

export const TRACKING_SOCKET_PATH =
  process.env.NEXT_PUBLIC_TRACKING_SOCKET_PATH ?? "/socket.io";

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toOptionalTimestamp(value: unknown): number | undefined {
  const directNumber = toOptionalNumber(value);
  if (directNumber !== undefined) {
    return directNumber;
  }

  const dateText = toOptionalString(value);
  if (!dateText) {
    return undefined;
  }

  const parsedDate = new Date(dateText).getTime();
  return Number.isNaN(parsedDate) ? undefined : parsedDate;
}

function extractSocketId(record: UnknownRecord, fallback?: string): string | undefined {
  return (
    toOptionalString(record.socketId) ??
    toOptionalString(record.id) ??
    toOptionalString(record.clientId) ??
    fallback
  );
}

function extractDisplayName(record: UnknownRecord): string | undefined {
  const user = asRecord(record.user) ?? asRecord(record.profile);
  const firstName = toOptionalString(record.first_name ?? record.firstName ?? user?.first_name);
  const lastName = toOptionalString(record.last_name ?? record.lastName ?? user?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    toOptionalString(record.displayName) ??
    toOptionalString(record.display_name) ??
    toOptionalString(record.fullName) ??
    toOptionalString(record.name) ??
    toOptionalString(user?.displayName) ??
    toOptionalString(user?.display_name) ??
    toOptionalString(user?.fullName) ??
    toOptionalString(user?.name) ??
    (fullName.length > 0 ? fullName : undefined)
  );
}

function extractUsername(record: UnknownRecord): string | undefined {
  const user = asRecord(record.user) ?? asRecord(record.profile);
  return (
    toOptionalString(record.username) ??
    toOptionalString(record.userName) ??
    toOptionalString(record.user_name) ??
    toOptionalString(user?.username) ??
    toOptionalString(user?.userName) ??
    toOptionalString(user?.user_name)
  );
}

export function getLat(location: TrackedLocation): number | undefined {
  return toOptionalNumber(location.latitude ?? location.lat);
}

export function getLng(location: TrackedLocation): number | undefined {
  return toOptionalNumber(location.longitude ?? location.lng);
}

export function hasValidCoordinate(location: TrackedLocation): boolean {
  const latitude = getLat(location);
  const longitude = getLng(location);

  return (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function getTrackingLocationId(location: TrackedLocation): string | undefined {
  return (
    toOptionalString(location.id) ??
    toOptionalString(location.socketId) ??
    toOptionalString(location.clientId) ??
    toOptionalString(location.userId)
  );
}

export function normalizeTrackingLocation(
  value: unknown,
  fallbackSocketId?: string,
): TrackedLocation | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const latitude = toOptionalNumber(record.latitude ?? record.lat);
  const longitude = toOptionalNumber(record.longitude ?? record.lng);
  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const socketId = extractSocketId(record, fallbackSocketId);
  if (!socketId) {
    return null;
  }

  const timestamp = toOptionalTimestamp(record.timestamp);
  const updatedAtTimestamp = toOptionalTimestamp(record.updatedAt ?? record.updated_at);
  const updatedAt =
    typeof record.updatedAt === "string"
      ? record.updatedAt
      : typeof record.updated_at === "string"
        ? record.updated_at
        : new Date(updatedAtTimestamp ?? timestamp ?? Date.now()).toISOString();

  return {
    id: toOptionalString(record.id),
    socketId,
    userId: toOptionalString(record.userId ?? record.user_id),
    latitude,
    longitude,
    accuracy: toOptionalNumber(record.accuracy),
    heading: toOptionalNumber(record.heading),
    speed: toOptionalNumber(record.speed),
    timestamp,
    updatedAt,
    displayName: extractDisplayName(record),
    username: extractUsername(record),
  };
}

export function normalizeTrackingLocations(payload: unknown): TrackedLocation[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeTrackingLocation(item))
      .filter((item): item is TrackedLocation => Boolean(item));
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  if (Array.isArray(record.locations)) {
    return normalizeTrackingLocations(record.locations);
  }

  if (Array.isArray(record.data)) {
    return normalizeTrackingLocations(record.data);
  }

  const mapRecord = asRecord(record.locations) ?? asRecord(record.data) ?? record;
  return Object.entries(mapRecord)
    .map(([socketId, item]) => normalizeTrackingLocation(item, socketId))
    .filter((item): item is TrackedLocation => Boolean(item));
}

export function buildGoogleMapsDirectionsUrl(
  destination: MapCoordinate,
  origin?: MapCoordinate | null,
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: "driving",
  });

  if (origin) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildGoogleMapsPointUrl(location: MapCoordinate): string {
  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
}
