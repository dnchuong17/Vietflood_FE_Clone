import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./live-tracking-panel.tsx", import.meta.url), "utf8");

describe("live tracking panel UI", () => {
  it("uses shared shadcn UI primitives for tracking controls", () => {
    expect(source).toContain("@/components/ui/button");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/alert");
  });

  it("keeps the tracking workflow localized for operators", () => {
    expect(source).toContain("Bắt đầu");
    expect(source).toContain("Dừng");
    expect(source).toContain("Đang kết nối");
    expect(source).toContain("đang hoạt động");
  });
});
