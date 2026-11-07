import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-relief-dashboard.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../../../app/(public)/cuu-tro/page.tsx", import.meta.url), "utf8");

describe("direct report relief page wiring", () => {
  it("mounts the report workspace behind the existing role guard, not the incident dashboard", () => {
    expect(route).toContain("<ReportReliefDashboard");
    expect(route).toContain("allowedRoles");
    expect(route).not.toContain("IncidentDashboard");
  });
  it("uses the existing role-scoped reports API without incident dependencies or writes", () => {
    expect(source).toContain("listReports(role!");
    expect(source).not.toMatch(/incidentGet|\/incidents|updateReportStatus|incidentChange/);
    expect(source).toContain("canManageReports(role)");
  });
  it("separates draft and applied filters and validates calendar bounds before applying", () => {
    expect(source).toContain("filterUserReports(reports, applied)");
    expect(source).toContain("reportDateRange(draft)");
    expect(source).toContain("setApplied({ ...draft })");
    expect(source).toContain("onReset={reset}");
    expect(source).toContain('idPrefix="relief-filter"');
    expect(source).toContain("REPORT_STATUS_OPTIONS.map");
  });
  it("shows original report details without fabricating assignments or AI scoring", () => {
    expect(source).toContain('data-report-id={report.id}');
    expect(source).toContain("/bao-cao/${report.id}");
    expect(source).toContain("report.isUrgent");
    expect(source).not.toMatch(/mapReportToAssignment|priorityWeight|processingEnabled|suggestedSeverity/);
  });
  it("distinguishes loading, API errors, no reports and no filter matches", () => {
    for (const text of ["Đang tải báo cáo", "Không thể tải báo cáo", "Chưa có báo cáo người dân", "Không có báo cáo phù hợp với bộ lọc", "Thử lại"]) expect(source).toContain(text);
    expect(source).toContain("current = false");
    expect(source).toContain("loaded?.role === role");
  });
});
