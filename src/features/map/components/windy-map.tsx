"use client";

import Script from "next/script";
import { useRef } from "react";

type WindyMapProps = {
    apiKey: string;
    lat?: number;
    lon?: number;
    zoom?: number;
};

export function WindyMap({ apiKey, lat = 16.0, lon = 106.5, zoom = 6 }: WindyMapProps) {
    const initialized = useRef(false);

    function handleScriptLoad() {
        if (initialized.current) return;
        initialized.current = true;

        windyInit({ key: apiKey, lat, lon, zoom }, (windyAPI) => {
            const { map } = windyAPI;
            map.zoomControl.remove();
            L.control.zoom({ position: "bottomright" }).addTo(map);
        });
    }

    return (
        <>
            <Script
                src="https://api.windy.com/assets/map-forecast/libBoot.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            <div id="windy" className="h-full w-full" />
        </>
    );
}
