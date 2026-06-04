"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ArrowPathIcon as RefreshCw,
  CursorArrowRaysIcon as LocateFixed,
  MapIcon as Map,
  PaperAirplaneIcon as Navigation,
  RadioIcon as RadioTower,
  StopIcon as Square,
} from "@heroicons/react/24/solid";
import { io, type Socket } from "socket.io-client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingBar } from "@/components/feedback/loading-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
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
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "-";
}

function formatLocationAge(location: TrackedLocation): string {
  const timestamp = location.updatedAt
    ? new Date(location.updatedAt).getTime()
    : location.timestamp;
  if (!timestamp || Number.isNaN(timestamp)) {
    return "vừa xong";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} giây trước`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  return `${Math.floor(diffMinutes / 60)} giờ trước`;
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
  const snapshotTimeoutRef = useRef<number | null>(null);
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

  const finishSnapshotRequest = useCallback(() => {
    if (snapshotTimeoutRef.current !== null) {
      window.clearTimeout(snapshotTimeoutRef.current);
      snapshotTimeoutRef.current = null;
    }
    setSnapshotLoading(false);
  }, [setSnapshotLoading]);

  const handleTrackingSnapshot = useCallback(
    (payload: unknown) => {
      const hasSnapshot = applyTrackingSnapshot(payload);
      finishSnapshotRequest();
      setSnapshotHint(
        hasSnapshot
          ? null
          : "Chưa có vị trí đang chia sẻ. Đang chờ cập nhật từ kết nối trực tiếp.",
      );
    },
    [applyTrackingSnapshot, finishSnapshotRequest, setSnapshotHint],
  );

  const refreshTrackingSnapshot = useCallback(
    (showFeedback = false) => {
      if (!canMonitor) {
        return;
      }

      setSnapshotLoading(true);
      socketRef.current?.emit("request-locations");
      setSnapshotHint("Đã gửi yêu cầu đồng bộ qua kết nối trực tiếp. Đang chờ cập nhật.");

      if (snapshotTimeoutRef.current !== null) {
        window.clearTimeout(snapshotTimeoutRef.current);
      }
      snapshotTimeoutRef.current = window.setTimeout(() => {
        finishSnapshotRequest();
      }, 1200);

      if (showFeedback) {
        showAlert({
          title: "Đã yêu cầu làm mới",
          description: "Đang chờ máy chủ gửi ảnh chụp theo dõi nếu có.",
          variant: "info",
        });
      }
    },
    [canMonitor, finishSnapshotRequest, setSnapshotHint, setSnapshotLoading, showAlert],
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
      refreshTrackingSnapshot(false);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      setSocketHint(error.message || "Kết nối theo dõi trực tiếp thất bại.");
    });
    socket.on("receive-location", (payload: unknown) => {
      const [location] = normalizeTrackingLocations(payload);
      if (location) {
        upsertLocation(location);
      }
    });
    socket.on("tracking-snapshot", handleTrackingSnapshot);
    socket.on("tracking-locations", handleTrackingSnapshot);
    socket.on("locations", handleTrackingSnapshot);
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
        title: "Lỗi theo dõi",
        description:
          typeof payload === "string"
            ? payload
            : payload.message ?? "Cập nhật vị trí đã bị từ chối.",
        variant: "error",
      });
    });

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      finishSnapshotRequest();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    finishSnapshotRequest,
    handleTrackingSnapshot,
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
        title: "Không có vị trí",
        description: "Trình duyệt này không hỗ trợ định vị.",
        variant: "error",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      emitPosition,
      () => {
        showAlert({
          title: "Vị trí bị chặn",
          description: "Hãy cho phép trình duyệt truy cập vị trí để chia sẻ theo dõi trực tiếp.",
          variant: "error",
        });
      },
      GEOLOCATION_OPTIONS,
    );

    const watchId = navigator.geolocation.watchPosition(
      emitPosition,
      () => {
        showAlert({
          title: "Vị trí bị chặn",
          description: "Hãy cho phép trình duyệt truy cập vị trí để chia sẻ theo dõi trực tiếp.",
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
        title: "Chỉ dùng điểm đến",
        description: "Trình duyệt này không thể cung cấp vị trí hiện tại làm điểm xuất phát.",
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
          title: "Chỉ dùng điểm đến",
          description: "Hãy cho phép truy cập vị trí để dẫn đường từ vị trí hiện tại của bạn.",
          variant: "info",
        });
        setRoutingLocationId(null);
      },
      GEOLOCATION_OPTIONS,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <RadioTower className="text-primary size-8" aria-hidden="true" />
              <CardTitle>Chia sẻ vị trí</CardTitle>
            </div>
            <Badge variant={isConnected ? "success" : "critical"}>
              {isConnected ? "Đang kết nối" : "Mất kết nối"}
            </Badge>
          </div>
          <CardDescription>
            Gửi cập nhật GPS của trình duyệt qua kênh theo dõi VietFlood.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Kết nối</dt>
              <dd className="font-semibold text-foreground">
                {isConnected ? "đã kết nối" : "mất kết nối"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Chia sẻ</dt>
              <dd>{isSharing ? "đang bật" : "đã tắt"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Kênh truyền</dt>
              <dd>Tự động</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>GPS gần nhất</dt>
              <dd>
                {lastShared
                  ? `${formatCoordinate(getLat(lastShared), 5)}, ${formatCoordinate(getLng(lastShared), 5)}`
                  : "-"}
              </dd>
            </div>
          </dl>
          {socketHint ? (
            <Alert className="mt-3 border-warning/25 bg-warning/15 text-warning-foreground">
              <AlertDescription>{socketHint}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex gap-2 mt-4">
            {!isSharing ? (
              <Button type="button" onClick={startSharing}>
                <LocateFixed data-icon="inline-start" aria-hidden="true" />
                Bắt đầu
              </Button>
            ) : (
              <Button type="button" onClick={stopSharing} variant="outline">
                <Square data-icon="inline-start" aria-hidden="true" />
                Dừng
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Map className="text-primary size-8" aria-hidden="true"/>
                <CardTitle>
                  {canMonitor ? "Theo dõi trực tiếp" : "Vị trí trực tiếp của tôi"}
                </CardTitle>
              </div>
              <CardDescription>
                {canMonitor
                  ? "Các vị trí gửi đến từ những máy khách đang hoạt động."
                  : "Người dân có thể chia sẻ vị trí với đội cứu trợ và quản trị viên."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canMonitor ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshTrackingSnapshot(true)}
                  disabled={isSnapshotLoading}
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={isSnapshotLoading ? "animate-spin" : undefined}
                    aria-hidden="true"
                  />
                  Làm mới
                </Button>
              ) : null}
              <Badge variant="secondary" className="gap-1.5">
                <RadioTower className="size-3.5" aria-hidden="true" />
                {locations.length} đang hoạt động
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!canMonitor ? (
            <Alert>
              <AlertDescription>
                Đội cứu trợ và quản trị viên có thể theo dõi vị trí máy khách
                đang hoạt động. Vai trò của bạn có thể chia sẻ vị trí khi cần
                hỗ trợ.
              </AlertDescription>
            </Alert>
          ) : null}

          {canMonitor && snapshotHint ? (
            <Alert className="border-warning/25 bg-warning/15 text-warning-foreground">
              <AlertDescription>{snapshotHint}</AlertDescription>
            </Alert>
          ) : null}

          {canMonitor && isSnapshotLoading ? (
            <LoadingBar
              title="Đang tải vị trí trực tiếp..."
              description="Đang đồng bộ ảnh chụp theo dõi và chờ cập nhật trực tiếp mới."
              className="mt-3"
            />
          ) : null}

          {canMonitor ? (
            <div className="grid gap-2 mt-4">
              {locations.length === 0 ? (
                <div className="grid gap-3 p-5 text-sm text-center border rounded-lg place-items-center bg-muted/40 text-muted-foreground">
                  <Map className="size-9 text-primary" aria-hidden="true" />
                  <span>
                    Chưa có vị trí đang chia sẻ. Hãy giữ trang này mở để nhận cập nhật
                    mới từ người dùng đang chia sẻ.
                  </span>
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
                  className="grid gap-3 rounded-lg border bg-background/60 p-3 text-sm md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {getDisplayName(location, `Vị trí ${index + 1}`)}
                    </p>
                    <p className="text-muted-foreground">
                      {formatCoordinate(lat)}, {formatCoordinate(lng)}
                      {location.accuracy ? ` | +/- ${Math.round(location.accuracy)}m` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mã {id} | cập nhật {formatLocationAge(location)}
                    </p>
                  </div>
                  {hasValidCoordinate(location) ? (
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        type="button"
                        onClick={() => openPoint(location)}
                        variant="outline"
                      >
                        <Map data-icon="inline-start" aria-hidden="true" />
                        Bản đồ
                      </Button>
                      <Button
                        type="button"
                        onClick={() => routeToLocation(location)}
                        disabled={isRouting}
                      >
                        <Navigation data-icon="inline-start" aria-hidden="true" />
                        {isRouting ? "Đang dẫn đường..." : "Dẫn đường"}
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
