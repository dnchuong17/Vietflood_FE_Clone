import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const motionSourceUrl = new URL(
  "../components/motion/landing-motion.tsx",
  import.meta.url,
);

describe("landing page UI", () => {
  it("uses the shared theme toggle and semantic background tokens", () => {
    expect(source).toContain("ThemeToggle");
    expect(source).toContain("bg-background");
    expect(source).toContain("text-foreground");
  });

  it("uses shared Framer Motion primitives for the landing animation pass", () => {
    expect(source).toContain("@/components/motion/landing-motion");
    expect(source).toContain("LandingHeroMotion");
    expect(source).toContain("LandingReveal");
    expect(source).toContain("LandingStagger");
    expect(source).toContain("LandingMotionItem");
    expect(source).toContain("LandingPulseMarker");
    expect(source).toContain("LandingProgressBar");
  });

  it("keeps landing animations compatible with reduced motion", () => {
    expect(existsSync(motionSourceUrl)).toBe(true);

    const motionSource = readFileSync(motionSourceUrl, "utf8");

    expect(motionSource).toContain("useReducedMotion");
    expect(motionSource).toContain("prefers-reduced-motion");
    expect(motionSource).toContain("motion.");
  });
});
