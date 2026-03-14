declare global {
  function windyInit(
    options: {
      key: string;
      lat?: number;
      lon?: number;
      zoom?: number;
    },
    callback: (api: WindyAPI) => void,
  ): void;

  interface WindyAPI {
    map: WindyLeafletMap;
    store: {
      get(key: string): unknown;
      set(key: string, value: unknown): void;
    };
  }

  interface WindyLeafletMap {
    zoomControl: { remove(): void };
  }

  const L: {
    control: {
      zoom(options?: {
        position?: "topleft" | "topright" | "bottomleft" | "bottomright";
      }): { addTo(map: WindyLeafletMap): void };
    };
  };
}

export {};
