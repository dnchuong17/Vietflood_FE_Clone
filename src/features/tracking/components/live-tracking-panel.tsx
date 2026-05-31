"use client";

import { useCallback, useEffect, useRef } from "react";
import { LocateFixed, Map, Navigation, RadioTower, RefreshCw, Square } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { apiGet, apiPath, parseJsonResponse } from "@/features/auth/lib/api-client";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPointUrl,
  getLat,
  getLng,
  getTrackingLocationId,
  hasValidCoordinate,
  normalizeTrackingLocations,
  TRACKING_SOCKET_PATH,
  TRACKING_SOCKET_URL,
  type MapCoordinate,
  type TrackedLocation,
} from "@/features/tracking/lib/tracking";
import { useTrackingStore } from "@/features/tracking/store/tracking-store";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 12000,
};

function formatCoordinate(value: number | undefined, digits = 6): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "-";
}

function formatLocationAge(location: TrackedLocation): string {
  const timestamp = location.updatedAt
    ? new Date(location.updatedAt).getTime()
    : location.timestamp;
  if (!timestamp || Number.isNaN(timestamp)) {
    return "just now";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  return `${Math.floor(diffMinutes / 60)}h ago`;
}

function getDisplayName(location: TrackedLocation, fallback: string): string {
  return location.displayName ?? location.username ?? getTrackingLocationId(location) ?? fallback;
}

function getIdentityDisplayName(identity: ReturnType<typeof useAuthIdentity>): string | undefined {
  return identity?.displayName;
}

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LiveTrackingPanel() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "citizen";
  const canMonitor = role === "relief" || role === "admin";
  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<number | null>(null);
  const isConnected = useTrackingStore((state) => state.isConnected);
  const isSharing = useTrackingStore((state) => state.isSharing);
  const lastShared = useTrackingStore((state) => state.lastShared);
  const locations = useTrackingStore((state) => state.locations);
  const isSnapshotLoading = useTrackingStore((state) => state.isSnapshotLoading);
  const snapshotHint = useTrackingStore((state) => state.snapshotHint);
  const socketHint = useTrackingStore((state) => state.socketHint);
  const routingLocationId = useTrackingStore((state) => state.routingLocationId);
  const setConnected = useTrackingStore((state) => state.setConnected);
  const setSharing = useTrackingStore((state) => state.setSharing);
  const setLastShared = useTrackingStore((state) => state.setLastShared);
  const setSnapshotLoading = useTrackingStore((state) => state.setSnapshotLoading);
  const setSnapshotHint = useTrackingStore((state) => state.setSnapshotHint);
  const setSocketHint = useTrackingStore((state) => state.setSocketHint);
  const setRoutingLocationId = useTrackingStore(
    (state) => state.setRoutingLocationId,
  );
  const upsertLocation = useTrackingStore((state) => state.upsertLocation);
  const applyTrackingSnapshot = useTrackingStore(
    (state) => state.applyTrackingSnapshot,
  );
  const removeLocation = useTrackingStore((state) => state.removeLocation);

  const refreshTrackingSnapshot = useCallback(
    async (showFeedback = false) => {
      if (!canMonitor) {
        return;
      }

      setSnapshotLoading(true);
      socketRef.current?.emit("request-locations");

      try {
        const response = await apiGet(apiPath("/tracking/locations"), {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await parseJsonResponse<unknown>(
          response,
          "Tracking snapshot endpoint is unavailable.",
        );
        const hasSnapshot = applyTrackingSnapshot(payload);
        setSnapshotHint(
          hasSnapshot
            ? null
            : "Snapshot returned no active shared locations. Waiting for live updates.",
        );

        if (showFeedback) {
          showAlert({
            title: "Tracking refreshed",
            description: hasSnapshot
              ? "Latest shared locations were loaded."
              : "No active shared locations were returned.",
            variant: "info",
          });
        }
      } catch (error) {
        setSnapshotHint(
          "Snapshot API is unavailable in this backend runtime. This view will still show future live socket updates.",
        );

        if (showFeedback) {
          showAlert({
            title: "Snapshot unavailable",
            description:
              error instanceof Error
                ? error.message
                : "Waiting for live socket location events.",
            variant: "info",
          });
        }
      } finally {
        setSnapshotLoading(false);
      }
    },
    [applyTrackingSnapshot, canMonitor, setSnapshotHint, setSnapshotLoading, showAlert],
  );

  useEffect(() => {
    const token = getAccessToken();
    const socket = io(TRACKING_SOCKET_URL, {
      autoConnect: true,
      path: TRACKING_SOCKET_PATH,
      transports: ["polling", "websocket"],
      tryAllTransports: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
      timeout: 10000,
      extraHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      auth: token
        ? {
            token,
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setSocketHint(null);
      socket.emit("request-locations");
      void refreshTrackingSnapshot(false);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      setSocketHint(error.message || "Tracking socket connection failed.");
    });
    socket.on("receive-location", (payload: unknown) => {
      const [location] = normalizeTrackingLocations(payload);
      if (location) {
        upsertLocation(location);
      }
    });
    socket.on("tracking-snapshot", applyTrackingSnapshot);
    socket.on("tracking-locations", applyTrackingSnapshot);
    socket.on("locations", applyTrackingSnapshot);
    socket.on("user-disconnected", (payload: unknown) => {
      const [disconnected] = normalizeTrackingLocations([payload]);
      const socketId =
        typeof payload === "string"
          ? payload
          : disconnected
            ? getTrackingLocationId(disconnected)
            : undefined;

      if (!socketId) {
        return;
      }

      removeLocation(socketId);
    });
    socket.on("location-error", (payload: { message?: string } | string) => {
      showAlert({
        title: "Tracking error",
        description:
          typeof payload === "string"
            ? payload
            : payload.message ?? "Location update was rejected.",
        variant: "error",
      });
    });

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    applyTrackingSnapshot,
    refreshTrackingSnapshot,
    removeLocation,
    setConnected,
    setSocketHint,
    showAlert,
    upsertLocation,
  ]);

  function emitPosition(position: GeolocationPosition) {
    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      displayName: getIdentityDisplayName(identity),
      username: identity?.username,
    };
    socketRef.current?.emit("send-location", payload);
    setLastShared(payload);
  }

  function startSharing() {
    if (!navigator.geolocation) {
      showAlert({
        title: "Location unavailable",
        description: "This browser does not support geolocation.",
        variant: "error",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      emitPosition,
      () => {
        showAlert({
          title: "Location blocked",
          description: "Allow browser location permission to share live tracking.",
          variant: "error",
        });
      },
      GEOLOCATION_OPTIONS,
    );

    const watchId = navigator.geolocation.watchPosition(
      emitPosition,
      () => {
        showAlert({
          title: "Location blocked",
          description: "Allow browser location permission to share live tracking.",
          variant: "error",
        });
      },
      GEOLOCATION_OPTIONS,
    );
    watchRef.current = watchId;
    setSharing(true);
  }

  function stopSharing() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
  }

  function openPoint(location: TrackedLocation) {
    const lat = getLat(location);
    const lng = getLng(location);
    if (lat === undefined || lng === undefined) {
      return;
    }

    openExternalUrl(buildGoogleMapsPointUrl({ latitude: lat, longitude: lng }));
  }

  function openDirectionsWithFallback(destination: MapCoordinate, origin?: MapCoordinate | null) {
    openExternalUrl(buildGoogleMapsDirectionsUrl(destination, origin));
  }

  function routeToLocation(location: TrackedLocation) {
    const id = getTrackingLocationId(location);
    const lat = getLat(location);
    const lng = getLng(location);
    if (lat === undefined || lng === undefined) {
      return;
    }

    const destination = { latitude: lat, longitude: lng };
    setRoutingLocationId(id ?? null);

    if (!navigator.geolocation) {
      openDirectionsWithFallback(destination);
      showAlert({
        title: "Using destination only",
        description: "This browser cannot provide your current location for route origin.",
        variant: "info",
      });
      setRoutingLocationId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        openDirectionsWithFallback(destination, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setRoutingLocationId(null);
      },
      () => {
        openDirectionsWithFallback(destination);
        showAlert({
          title: "Using destination only",
          description: "Allow browser location permission to route from your current position.",
          variant: "info",
        });
        setRoutingLocationId(null);
      },
      GEOLOCATION_OPTIONS,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <RadioTower className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-950">Share location</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Send browser GPS updates through the VietFlood tracking socket.
        </p>
        <dl className="mt-4 grid gap-2 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <dt>Socket</dt>
            <dd className={isConnected ? "text-emerald-700" : "text-rose-700"}>
              {isConnected ? "connected" : "disconnected"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Sharing</dt>
            <dd>{isSharing ? "active" : "off"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Transport</dt>
            <dd>polling + websocket</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Last GPS</dt>
            <dd>
              {lastShared
                ? `${formatCoordinate(getLat(lastShared), 5)}, ${formatCoordinate(getLng(lastShared), 5)}`
                : "-"}
            </dd>
          </div>
        </dl>
        {socketHint ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {socketHint}
          </div>
        ) : null}
        <div className="mt-4 flex gap-2">
          {!isSharing ? (
            <button
              type="button"
              onClick={startSharing}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={stopSharing}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop
            </button>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {canMonitor ? "Live monitor" : "My live location"}
            </h2>
            <p className="text-sm text-slate-600">
              {canMonitor
                ? "Incoming locations from active clients."
                : "Citizens can share location with relief/admin teams."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canMonitor ? (
              <button
                type="button"
                onClick={() => void refreshTrackingSnapshot(true)}
                disabled={isSnapshotLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSnapshotLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            ) : null}
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              {locations.length} active
            </span>
          </div>
        </div>

        {!canMonitor ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Relief and admin users can monitor active client locations. Your role can share
            location when you need help.
          </div>
        ) : null}

        {canMonitor && snapshotHint ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {snapshotHint}
          </div>
        ) : null}

        {canMonitor ? (
          <div className="mt-4 grid gap-2">
            {locations.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
                No active locations yet. Keep this page open to receive future socket
                updates from sharing users.
              </div>
            ) : null}
            {locations.map((location, index) => {
              const lat = getLat(location);
              const lng = getLng(location);
              const id = getTrackingLocationId(location) ?? `location-${index}`;
              const isRouting = routingLocationId === id;
              return (
                <article
                  key={id}
                  className="grid gap-3 rounded-lg border border-slate-200 p-3 text-sm md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      {getDisplayName(location, `Location ${index + 1}`)}
                    </p>
                    <p className="text-slate-600">
                      {formatCoordinate(lat)}, {formatCoordinate(lng)}
                      {location.accuracy ? ` | +/- ${Math.round(location.accuracy)}m` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      ID {id} | updated {formatLocationAge(location)}
                    </p>
                  </div>
                  {hasValidCoordinate(location) ? (
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => openPoint(location)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 px-3 py-2 font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        <Map className="h-4 w-4" aria-hidden="true" />
                        Map
                      </button>
                      <button
                        type="button"
                        onClick={() => routeToLocation(location)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 font-bold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70"
                        disabled={isRouting}
                      >
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        {isRouting ? "Routing..." : "Dẫn đường"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
