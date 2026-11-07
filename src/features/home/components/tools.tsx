"use client";

import { CloudIcon, SignalIcon, SunIcon, SparklesIcon, ArrowTrendingUpIcon, BeakerIcon } from "@heroicons/react/24/solid";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type MapOverlay, useHomeDisplayState } from "../state/home-display-state";

const OVERLAYS = [
  { value: "rain", label: "Mưa", icon: BeakerIcon },
  { value: "wind", label: "Gió", icon: SignalIcon },
  { value: "temp", label: "Nhiệt độ", icon: SunIcon },
  { value: "rh", label: "Độ ẩm", icon: SparklesIcon },
  { value: "clouds", label: "Mây", icon: CloudIcon },
  { value: "pressure", label: "Áp suất", icon: ArrowTrendingUpIcon },
] as const satisfies ReadonlyArray<{ value: MapOverlay; label: string; icon: typeof CloudIcon }>;

export function Tools() {
  const { state, dispatch } = useHomeDisplayState();
  return (
    <div className="workspace-stack">
      <fieldset className="min-w-0">
        <legend className="mb-3 text-sm font-semibold">Lớp dữ liệu bản đồ</legend>
        <div className="grid grid-cols-2 gap-2">
          {OVERLAYS.map(({ value, label, icon: Icon }) => (
            <label key={value} className="relative cursor-pointer">
              <input className="peer sr-only" type="radio" name="map-overlay" value={value} checked={state.overlay === value} onChange={() => dispatch({ type: "setOverlay", payload: value })} />
              <span className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                <Icon className="size-4" aria-hidden="true" />{label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <Label htmlFor="weather-statistics" className="text-xs">Bảng số liệu thời tiết</Label>
        <Switch id="weather-statistics" checked={state.isWeatherStatsVisible} onCheckedChange={(payload) => dispatch({ type: "setWeatherStatsVisibility", payload })} />
      </div>
    </div>
  );
}
