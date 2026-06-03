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
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("<Button");
    expect(source).toContain("bg-card");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });

  it("wires mobile-like relief queue search and filters", () => {
    expect(source).toContain("@/features/relief/lib/queue");
    expect(source).toContain("@/features/relief/store/relief-store");
    expect(source).toContain("queueFilter");
    expect(source).toContain("setQueueFilter");
    expect(source).toContain("filterReliefQueueReports");
    expect(source).toContain("buildReliefQueueStats");
    expect(source).toContain("Tìm ca cứu trợ");
    expect(source).toContain("Hàng chờ trực tiếp");
    expect(source).toContain("Sẵn tuyến đường");
  });

  it("offers relief staff a direct Windy map entry point like mobile", () => {
    expect(source).toContain('<Link href="/trang-chu">');
  });
});
