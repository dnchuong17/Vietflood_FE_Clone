import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const appShellSource = readFileSync(new URL("./app-shell.tsx", import.meta.url), "utf8");
const siteHeaderSource = readFileSync(
  new URL("../../../components/navigation/site-header.tsx", import.meta.url),
  "utf8",
);

describe("app navigation chrome", () => {
  it("renders mobile bottom tabs for role-aware navigation", () => {
    expect(siteHeaderSource).toContain('aria-label="Thanh tab di động"');
    expect(siteHeaderSource).toContain("fixed inset-x-0 bottom-0");
    expect(siteHeaderSource).toContain("lg:hidden");
  });

  it("reserves space for the fixed mobile bottom tabs", () => {
    expect(appShellSource).toContain("pb-24");
    expect(appShellSource).toContain("lg:pb-8");
  });

  it("keeps primary navigation in the desktop header", () => {
    expect(siteHeaderSource).toContain('aria-label="Điều hướng chính"');
    expect(siteHeaderSource).toContain("lg:flex");
    expect(siteHeaderSource).toContain("overflow-x-auto");
  });

  it("includes the dark-mode toggle and motion entry shell", () => {
    expect(siteHeaderSource).toContain("ThemeToggle");
    expect(appShellSource).toContain("motion");
    expect(appShellSource).toContain("prefers-reduced-motion");
  });
});
