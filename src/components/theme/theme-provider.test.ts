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
    const light = globalsSource.split(":root {")[1].split("}")[0];
    const dark = globalsSource.split(".dark {")[1].split("}")[0];
    expect(light).toContain("--primary: #1266A8");
    expect(light).toContain("--background: #F5F7FA");
    expect(globalsSource).toContain("--success: oklch(0.47 0.1 180)");
    expect(globalsSource).toContain("--warning: oklch(0.74 0.15 75)");
    expect(dark).toContain("--primary: #7DC7F4");
    expect(dark).toContain("--background: #101923");
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
