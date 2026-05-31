"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { LocateFixed, RadioTower, Square } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { API_BASE_URL } from "@/lib/api-config";

type TrackedLocation = {
  id?: string;
  socketId?: string;
  userId?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  accuracy?: number;
  timestamp?: number;
  updatedAt?: number;
};

function getLat(location: TrackedLocation): number | undefined {
  return location.latitude ?? location.lat;
}

function getLng(location: TrackedLocation): number | undefined {
  return location.longitude ?? location.lng;
}

export function LiveTrackingPanel() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "citizen";
  const canMonitor = role === "relief" || role === "admin";
  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lastShared, setLastShared] = useState<TrackedLocation | null>(null);
  const [locations, setLocations] = useState<TrackedLocation[]>([]);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: getAccessToken(),
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("request-locations");
    });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("receive-location", (payload: TrackedLocation) => {
      setLocations((prev) => {
        const id = payload.id ?? payload.socketId ?? String(payload.userId ?? "");
        if (!id) {
          return [payload, ...prev].slice(0, 50);
        }
        const next = prev.filter(
          (item) => (item.id ?? item.socketId ?? String(item.userId ?? "")) !== id,
        );
        return [payload, ...next].slice(0, 50);
      });
    });
    socket.on(
      "tracking-snapshot",
      (payload: { locations?: TrackedLocation[] } | TrackedLocation[]) => {
        const nextLocations = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.locations)
            ? payload.locations
            : [];
        setLocations(nextLocations);
      },
    );
    socket.on("user-disconnected", (socketId: string) => {
      setLocations((prev) =>
        prev.filter((location) => location.socketId !== socketId && location.id !== socketId),
      );
    });
    socket.on("location-error", (payload: { message?: string }) => {
      showAlert({
        title: "Tracking error",
        description: payload.message ?? "Location update was rejected.",
        variant: "error",
      });
    });

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showAlert]);

  function emitPosition(position: GeolocationPosition) {
    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
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

    const watchId = navigator.geolocation.watchPosition(
      emitPosition,
      () => {
        showAlert({
          title: "Location blocked",
          description: "Allow browser location permission to share live tracking.",
          variant: "error",
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    );
    watchRef.current = watchId;
    setIsSharing(true);
  }

  function stopSharing() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setIsSharing(false);
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
            <dt>Last GPS</dt>
            <dd>
              {lastShared
                ? `${getLat(lastShared)?.toFixed(5)}, ${getLng(lastShared)?.toFixed(5)}`
                : "-"}
            </dd>
          </div>
        </dl>
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
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {locations.length} active
          </span>
        </div>

        {!canMonitor ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Relief and admin users can monitor active client locations. Your role can share
            location when you need help.
          </div>
        ) : null}

        {canMonitor ? (
          <div className="mt-4 grid gap-2">
            {locations.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
                No active locations yet.
              </div>
            ) : null}
            {locations.map((location, index) => {
              const lat = getLat(location);
              const lng = getLng(location);
              const id =
                location.id ?? location.socketId ?? location.userId ?? `location-${index}`;
              return (
                <article
                  key={String(id)}
                  className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold text-slate-950">{String(id)}</p>
                    <p className="text-slate-600">
                      {lat?.toFixed(6) ?? "-"}, {lng?.toFixed(6) ?? "-"}
                      {location.accuracy ? ` | +/- ${Math.round(location.accuracy)}m` : ""}
                    </p>
                  </div>
                  {lat !== undefined && lng !== undefined ? (
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-sky-200 px-3 py-2 text-center font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      Map
                    </a>
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
