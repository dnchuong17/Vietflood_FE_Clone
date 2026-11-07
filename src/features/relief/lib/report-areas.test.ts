import { describe, expect, it } from "vitest";
import type { FloodReport } from "@/features/reports/api/reports";
import { groupReportAreas } from "./report-areas";

const report = (id: number, extra: Partial<FloodReport> = {}): FloodReport => ({
  id, province: "Hồ Chí Minh", ward: "Tăng Nhơn Phú", status: "pending", ...extra,
});

describe("report area rankings", () => {
  it("ranks by volume first, collapses repeated IDs and preserves original records", () => {
    const first = report(1);
    const rows = [first, report(2), { ...first }, report(3, { province: "Đà Nẵng", isUrgent: true })];
    const result = groupReportAreas(rows);
    expect(result.provinces.map(area => [area.total, area.urgent, area.open])).toEqual([[2, 0, 2], [1, 1, 1]]);
    expect(result.provinces[0].reports[0]).toBe(first);
    expect(result.provinces[0].total + result.provinces[1].total).toBe(3);
    expect(rows).toHaveLength(4);
  });
  it("groups aliases but retains original labels and separates equal ward names by province", () => {
    const result = groupReportAreas([report(1), report(2, { province: "TP. HCM", ward: "Phường Tăng Nhơn Phú" }),
      report(3, { province: "Đà Nẵng" })]);
    expect(result.provinces).toHaveLength(2);
    expect(result.wards).toHaveLength(2);
    expect(result.provinces[0].label).toBe("Hồ Chí Minh");
    expect(result.wards[0].label).toBe("Tăng Nhơn Phú, Hồ Chí Minh");
    expect(result.wards.map(area => area.total)).toEqual([2, 1]);
  });
  it("keeps incomplete addresses out of named regions without losing their counts", () => {
    const result = groupReportAreas([report(1), report(2, { ward: "" }), report(3, { province: "" }),
      report(4, { province: "", ward: "", lat: 0, lng: 0 })]);
    expect(result.provinces.reduce((sum, area) => sum + area.total, 0) + result.unknownProvince).toBe(4);
    expect(result.wards.reduce((sum, area) => sum + area.total, 0) + result.unknownWard).toBe(4);
    expect(result.unknownProvince).toBe(2);
    expect(result.unknownWard).toBe(3);
    expect(result.wards).toHaveLength(1);
  });
  it("uses urgency and open work as stable volume tie-breaks", () => {
    const rows = [report(1, { province: "Quảng Trị", is_urgent: true }), report(2, { province: "Hà Nội", status: "resolved" }),
      report(3, { province: "Đà Nẵng", status: "verified" })];
    expect(groupReportAreas(rows).provinces.map(area => area.label)).toEqual(["Quảng Trị", "Đà Nẵng", "Hà Nội"]);
    expect(groupReportAreas([...rows].reverse()).provinces.map(area => area.key)).toEqual(groupReportAreas(rows).provinces.map(area => area.key));
  });
  it("preserves different IDs at the same address and records without valid IDs", () => {
    expect(groupReportAreas([report(1), report(2), report(0), { province: "Hồ Chí Minh" }]).provinces[0].total).toBe(4);
  });
  it("does not mutate frozen payloads and handles an empty applied scope", () => {
    const row = Object.freeze(report(1));
    expect(groupReportAreas(Object.freeze([row]) as unknown as FloodReport[]).provinces[0].total).toBe(1);
    expect(groupReportAreas([])).toEqual({ provinces: [], wards: [], unknownProvince: 0, unknownWard: 0 });
  });
});
