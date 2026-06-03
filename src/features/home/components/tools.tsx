import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import {
    ArrowTrendingUpIcon,
    Bars3Icon,
    BeakerIcon,
    CloudIcon,
    SignalIcon,
    SparklesIcon,
    Square3Stack3DIcon,
    SunIcon,
} from "@heroicons/react/24/solid";

import { type MapOverlay, useHomeDisplayState } from "../state/home-display-state";

const OVERLAY_LABELS: Record<string, string> = {
    rain: "Mưa",
    wind: "Gió",
    temp: "Nhiệt độ",
    rh: "Độ ẩm",
    clouds: "Mây",
    pressure: "Áp suất",
};

const OVERLAY_OPTIONS: MapOverlay[] = ["rain", "wind", "temp", "rh", "clouds", "pressure"];
const OVERLAY_ICONS: Record<MapOverlay, ComponentType<SVGProps<SVGSVGElement>>> = {
    rain: BeakerIcon,
    wind: SignalIcon,
    temp: SunIcon,
    rh: SparklesIcon,
    clouds: CloudIcon,
    pressure: ArrowTrendingUpIcon,
};

function OverlayOptionIcon({ overlay }: { overlay: MapOverlay }) {
    const Icon = OVERLAY_ICONS[overlay] ?? Square3Stack3DIcon;
    return <Icon className="size-3.5" aria-hidden="true" />;
}

export function Tools() {
    const { state, dispatch } = useHomeDisplayState();
    const [isOverlayMenuOpen, setIsOverlayMenuOpen] = useState(false);
    const overlayToolRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleDocumentClick(event: MouseEvent) {
            if (!overlayToolRef.current) {
                return;
            }

            if (!overlayToolRef.current.contains(event.target as Node)) {
                setIsOverlayMenuOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOverlayMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleDocumentClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const weatherStatsToolLabel = state.isWeatherStatsVisible
        ? "Ẩn bảng số liệu thời tiết"
        : "Hiển thị bảng số liệu thời tiết";

    const overlayLabel = OVERLAY_LABELS[state.overlay] ?? state.overlay;
    const overlayToolLabel = `Chọn lớp dữ liệu. Lớp hiện tại: ${overlayLabel}`;

    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
            <div className="mx-4 mt-10 flex flex-col items-start gap-2 z-20">
                <button
                    type="button"
                    onClick={() => dispatch({ type: "toggleWeatherStatsVisibility" })}
                    className={`pointer-events-auto z-20 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition ${state.isWeatherStatsVisible
                        ? "border-cyan-300 bg-cyan-100/95 text-cyan-900 hover:bg-cyan-200/95"
                        : "border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white"
                        }`}
                    aria-label={weatherStatsToolLabel}
                    aria-pressed={state.isWeatherStatsVisible}
                    title={weatherStatsToolLabel}
                >
                    <Bars3Icon className="size-4" aria-hidden="true" />
                </button>

                <div ref={overlayToolRef} className="relative pointer-events-auto z-20">
                    <button
                        type="button"
                        onClick={() => setIsOverlayMenuOpen((prev) => !prev)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition ${isOverlayMenuOpen
                            ? "border-emerald-300 bg-emerald-100/95 text-emerald-900 hover:bg-emerald-200/95"
                            : "border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white"
                            }`}
                        aria-label={overlayToolLabel}
                        aria-expanded={isOverlayMenuOpen}
                        aria-haspopup="menu"
                        title={overlayToolLabel}
                    >
                        <Square3Stack3DIcon className="size-4" aria-hidden="true" />
                    </button>

                    {isOverlayMenuOpen ? (
                        <div
                            className="absolute left-full top-0 ml-2 min-w-40 rounded-xl border border-slate-200/90 bg-white/96 p-1.5 shadow-lg backdrop-blur"
                            role="menu"
                            aria-label="Chọn lớp dữ liệu bản đồ"
                        >
                            {OVERLAY_OPTIONS.map((option) => {
                                const isActive = state.overlay === option;

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={isActive}
                                        onClick={() => {
                                            dispatch({ type: "setOverlay", payload: option });
                                            setIsOverlayMenuOpen(false);
                                        }}
                                        className={`mb-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition last:mb-0 ${isActive
                                            ? "bg-emerald-100 text-emerald-900"
                                            : "text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            <OverlayOptionIcon overlay={option} />
                                            <span>{OVERLAY_LABELS[option]}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
