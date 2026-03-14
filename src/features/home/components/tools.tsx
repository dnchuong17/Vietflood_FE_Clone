import { useHomeDisplayState } from "../state/home-display-state";

function WeatherPanelIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="M4 4.5H20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4 10.5H20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4 16.5H20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 7.5H10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13 13.5H17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9 19.5H15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function Tools() {
    const { state, dispatch } = useHomeDisplayState();

    const weatherStatsToolLabel = state.isWeatherStatsVisible
        ? "Ẩn bảng số liệu thời tiết"
        : "Hiển thị bảng số liệu thời tiết";

    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
            <div className="mx-4 mt-10 flex items-center gap-2 z-20">
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
                    <WeatherPanelIcon />
                </button>
            </div>
        </div>
    );
}
