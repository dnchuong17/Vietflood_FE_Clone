import { describe, expect, it } from "vitest";
import type { FloodReport } from "@/features/reports/api/reports";
import { emptyReportFilters, filterUserReports, reportDateRange } from "./report-filters";

const reports: FloodReport[] = [
  { id: 1, status: "pending", province: "Hồ Chí Minh", ward: "Tăng Nhơn Phú", description: "Đường ngập cần đối chiếu", createdAt: "2026-10-15T17:00:00Z", user: { username: "nguoidan" } },
  { id: 2, status: "verified", province: "Thành phố Hồ Chí Minh", ward: "Phường Tăng Nhơn Phú", createdAt: "2026-11-01T16:59:59.999Z" },
  { id: 3, status: "resolved", province: "TP. HCM", ward: "Tăng Nhơn Phú", createdAt: "2026-11-01T17:00:00Z" },
  { id: 4, status: "rejected", province: "Đà Nẵng", ward: "Hải Châu", createdAt: "2026-10-15T16:59:59.999Z" },
  { id: 5, description: "Không có ngày gửi" },
  { id: 6, created_at: "invalid" },
];
const ids = (rows: FloodReport[]) => rows.map(r => r.id);

describe("direct user report filters", () => {
  it("includes pending, verified, resolved, rejected and missing-date reports by default", () => {
    expect(new Set(ids(filterUserReports(reports, emptyReportFilters())))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });
  it("matches canonical and legacy HCM/ward names without changing original records", () => {
    const before = JSON.stringify(reports);
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), province: "Thành phố Hồ Chí Minh", ward: "Phường Tăng Nhơn Phú" }))).toEqual([3, 2, 1]);
    expect(JSON.stringify(reports)).toBe(before);
  });
  it("supports accentless/d-d comparison, aliases, and constrains wards to their province", () => {
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), province: "hcm", ward: "tang nhon phu" }))).toEqual([3, 2, 1]);
    expect(filterUserReports(reports, { ...emptyReportFilters(), province: "Đà Nẵng", ward: "Tăng Nhơn Phú" })).toEqual([]);
  });
  it("uses whole Vietnam calendar days for the screenshot's October 16–November 1 interval", () => {
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), from: "2026-10-16", to: "2026-11-01" }))).toEqual([2, 1]);
  });
  it("supports either open date boundary and includes same-day ranges", () => {
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), from: "2026-11-02" }))).toEqual([3]);
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), to: "2026-10-15" }))).toEqual([4]);
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), from: "2026-10-16", to: "2026-10-16" }))).toEqual([1]);
  });
  it("rejects reversed and nonexistent dates without imposing an intelligence 31-day limit", () => {
    expect(() => reportDateRange({ from: "2026-11-02", to: "2026-11-01" })).toThrow("Ngày bắt đầu");
    expect(() => reportDateRange({ from: "2026-02-30", to: "" })).toThrow("Ngày không hợp lệ");
    expect(() => reportDateRange({ from: "2026-01-01", to: "2026-12-31" })).not.toThrow();
  });
  it.each(["pending", "verified", "resolved", "rejected"] as const)("filters the original %s status, not an incident status", status => {
    expect(filterUserReports(reports, { ...emptyReportFilters(), status })).toEqual(reports.filter(r => (r.status ?? "pending") === status).sort((a,b) => (Date.parse(b.createdAt ?? "") || -Infinity) - (Date.parse(a.createdAt ?? "") || -Infinity)));
  });
  it("finds Vietnamese description and reporter text without accents", () => {
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), query: "duong ngap can doi chieu" }))).toEqual([1]);
    expect(ids(filterUserReports(reports, { ...emptyReportFilters(), query: "nguoidan" }))).toEqual([1]);
  });
  it("combines location, date, status and text with AND semantics", () => {
    expect(ids(filterUserReports(reports, { province: "TP HCM", ward: "Phường Tăng Nhơn Phú", from: "2026-10-16", to: "2026-11-01", status: "pending", query: "duong ngap" }))).toEqual([1]);
  });
  it("uses created_at fallback and does not hide missing timestamps unless dates are applied", () => {
    const old: FloodReport = { id: 7, created_at: "2026-10-16T04:00:00Z" };
    expect(ids(filterUserReports([old], { ...emptyReportFilters(), from: "2026-10-16", to: "2026-10-16" }))).toEqual([7]);
    expect(ids(filterUserReports([reports[5]], emptyReportFilters()))).toEqual([6]);
    expect(filterUserReports([reports[5]], { ...emptyReportFilters(), from: "2026-10-16" })).toEqual([]);
  });
});
