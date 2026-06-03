import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./user-management.tsx", import.meta.url),
  "utf8",
);

describe("user management UI", () => {
  it("uses shadcn controls, badges, and semantic surfaces", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/select");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("<Button");
    expect(source).toContain("buildUsersOverviewSummary");
    expect(source).toContain("formatUsersLastSyncedAt");
    expect(source).toContain("lastSyncedAt");
    expect(source).toContain("Tổng người dùng");
    expect(source).toContain("Đang hiển thị");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });

  it("shows mobile-like selected-user report history for relief and admin", () => {
    expect(source).toContain("listReports");
    expect(source).toContain("filterReportsByUserId");
    expect(source).toContain("selectedUserReports");
    expect(source).toContain("Báo cáo của người dùng");
    expect(source).toContain('href={`/bao-cao/${report.id}`}');
  });
});
