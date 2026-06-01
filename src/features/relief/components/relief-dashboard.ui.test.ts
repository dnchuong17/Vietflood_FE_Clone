import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./relief-dashboard.tsx", import.meta.url),
  "utf8",
);

describe("relief dashboard UI", () => {
  it("uses shadcn cards, badges, buttons, and semantic colors", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("<Button");
    expect(source).toContain("bg-card");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });
});
