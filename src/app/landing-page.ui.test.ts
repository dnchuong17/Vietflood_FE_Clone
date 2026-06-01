import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("landing page UI", () => {
  it("uses the shared theme toggle and semantic background tokens", () => {
    expect(source).toContain("ThemeToggle");
    expect(source).toContain("bg-background");
    expect(source).toContain("text-foreground");
  });
});
