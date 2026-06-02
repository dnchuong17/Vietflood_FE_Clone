import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const windyMapSource = readFileSync(new URL("./windy-map.tsx", import.meta.url), "utf8");
const homeStateSource = readFileSync(
  new URL("../../home/state/home-display-state.tsx", import.meta.url),
  "utf8",
);

describe("windy map UI", () => {
  it("defaults to the same Da Nang wind view used by the mobile app", () => {
    expect(windyMapSource).toContain("lat = 16.047");
    expect(windyMapSource).toContain("lon = 108.206");
    expect(windyMapSource).toContain('overlay = "wind"');
    expect(windyMapSource).toContain("metricRain=mm");
    expect(windyMapSource).toContain("metricWind=km/h");
    expect(homeStateSource).toContain('overlay: "wind"');
    expect(windyMapSource).not.toContain("lon = 106.5");
  });
});
