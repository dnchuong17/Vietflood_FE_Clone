import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-workspace.tsx", import.meta.url), "utf8");

describe("report workspace UI", () => {
  it("uses shared shadcn primitives for filters, forms, and actions", () => {
    expect(source).toContain("@/components/ui/button");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/select");
    expect(source).toContain("@/components/ui/field");
    expect(source).toContain("@/components/ui/badge");
  });

  it("links report cards to the mobile-like detail screen", () => {
    expect(source).toContain("next/link");
    expect(source).toContain("href={`/bao-cao/${report.id}`}");
    expect(source).toContain("Chi tiết");
  });
});
