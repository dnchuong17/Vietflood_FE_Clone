import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
const globalsSource = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const themeProviderPath = new URL("./theme-provider.tsx", import.meta.url);
const themeTogglePath = new URL("./theme-toggle.tsx", import.meta.url);

describe("dark-mode theme shell", () => {
  it("wraps the app with theme and tooltip providers", () => {
    expect(layoutSource).toContain("ThemeProvider");
    expect(layoutSource).toContain("TooltipProvider");
    expect(layoutSource).toContain("defaultTheme=\"system\"");
    expect(layoutSource).toContain("suppressHydrationWarning");
  });

  it("defines VietFlood semantic tokens for both light and dark mode", () => {
    expect(globalsSource).toContain("--primary: oklch(0.62 0.16 235)");
    expect(globalsSource).toContain("--success: oklch(0.61 0.14 165)");
    expect(globalsSource).toContain("--warning: oklch(0.74 0.15 75)");
    expect(globalsSource).toContain(".dark {");
    expect(globalsSource).toContain("--background: oklch(0.16 0.02 240)");
  });

  it("bridges legacy Tailwind slate utilities into dark mode", () => {
    expect(globalsSource).toContain(".dark :where(.bg-white)");
    expect(globalsSource).toContain(".dark :where(.text-slate-950)");
    expect(globalsSource).toContain(".dark :where(.border-slate-200)");
  });

  it("exposes a shadcn-compatible theme toggle", () => {
    expect(existsSync(themeProviderPath)).toBe(true);
    expect(existsSync(themeTogglePath)).toBe(true);

    const toggleSource = readFileSync(themeTogglePath, "utf8");
    expect(toggleSource).toContain("useTheme");
    expect(toggleSource).toContain("DropdownMenu");
    expect(toggleSource).toContain("aria-label=\"Đổi giao diện\"");
  });
});
