"use client";

import { WindyMap } from "../../map/components/windy-map";
import { HomeDisplayProvider, useHomeDisplayState } from "../state/home-display-state";
import { Tools } from "./tools";

function HomeMapContent() {
    const { state } = useHomeDisplayState();

    return (
        <div className="relative h-full">
            <WindyMap mapOnlyMode={!state.isWeatherStatsVisible} />
            <Tools />
        </div>
    );
}

export function HomeMapView() {
    return (
        <HomeDisplayProvider>
            <HomeMapContent />
        </HomeDisplayProvider>
    );
}
