import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FloodReport } from "@/features/reports/api/reports";
import { analyzeReports } from "../lib/report-analysis";
import { groupReportAreas } from "../lib/report-areas";
import { ReportAnalysisPanel } from "./report-analysis-panel";

// Chart sizing belongs to browser acceptance; exercise the actual panel here.
vi.mock("./report-area-chart", () => ({ ReportAreaChart: () => null }));
vi.mock("./report-trend-chart", () => ({ ReportTrendChart: () => null }));

const source = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
const rows: FloodReport[] = [
  ...[1, 2, 3].map(id => ({ id, addressLine: "Volume", status: "resolved" })),
  ...[4, 5].map(id => ({ id, addressLine: "Open", status: "pending" })),
  ...[6, 7].map(id => ({ id, addressLine: "Closed", status: "resolved" })),
  { id: 8, addressLine: "Small", status: "pending", isUrgent: true },
  { id: 9, addressLine: "Alpha", status: "pending" },
].map(report => ({ province: "Quảng Trị", ward: "Đông Hà", createdAt: "2026-11-01T00:00:00Z", ...report }));

function render(records: FloodReport[]) {
  return renderToStaticMarkup(h(ReportAnalysisPanel, {
    analysis: analyzeReports(records), areas: groupReportAreas(records), selectedArea: null,
    onSelectArea: () => {}, totalLoaded: records.length, isFiltered: false,
    selectedLocation: null, selectedStatus: "all", onSelectLocation: () => {}, onSelectStatus: () => {},
  }));
}

function locationOrder(html: string) {
  const list = html.slice(html.indexOf('aria-label="Các địa điểm không lặp"'));
  return [...list.matchAll(/>(Volume|Open|Closed|Small|Alpha),/g)].map(match => match[1]);
}

describe("report analysis without urgency projections", () => {
  it("renders the replacement metrics and ranks locations by volume, open count, then stable key", () => {
    const html = render(rows);
    for (const label of ["Báo cáo không lặp ID", "Chưa hoàn tất", "Đã xử lý", "Điểm được định danh"]) expect(html).toContain(label);
    expect(locationOrder(html)).toEqual(["Volume", "Open", "Closed", "Alpha", "Small"]);
    expect(locationOrder(render([...rows].reverse()))).toEqual(locationOrder(html));
    expect(html).not.toMatch(/khẩn cấp|Khẩn cấp|urgent/);
  });

  it("renders identical counts, controls, and location ordering when only legacy flags change", () => {
    const clear = rows.map(report => ({ ...report, isUrgent: false, is_urgent: false }));
    const flagged = rows.map(report => ({ ...report, isUrgent: true, is_urgent: true }));
    expect(render(flagged)).toBe(render(clear));
  });

  it("keeps only total report trends and total/open/share area displays", () => {
    const trend = source("report-trend-chart.tsx");
    const areas = source("report-area-chart.tsx");
    for (const chart of [trend, areas]) expect(chart).not.toMatch(/urgent|isUrgent|is_urgent|khẩn cấp|Khẩn cấp/);
    expect([...trend.matchAll(/<Area\s[^>]*dataKey="([^"]+)"/g)].map(match => match[1])).toEqual(["total"]);
    expect(trend).toContain("day.total");
    expect(areas).toContain("area.open");
    expect(areas).toContain("area.total / total");
  });
});
