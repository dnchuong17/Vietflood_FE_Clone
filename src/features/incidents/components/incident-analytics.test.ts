import { existsSync, readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AggregateBars, IncidentAnalytics } from "./incident-analytics";
import { IncidentBadges, NormalizedSource } from "./incident-common";
import { SEVERITY_LABELS, type Analytics, type Incident } from "../api/incidents";
import { IncidentMap } from "./incident-map";
vi.mock("next/dynamic", () => ({default: () => () => null}));

const source = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("incident intelligence presentation", () => {
 it("renders accessible textual chart counts with zero-safe decorative bars", () => {
  const html = renderToStaticMarkup(h(AggregateBars, {title: "Mức độ", rows: [{key:"Cao", count:12},{key:"Thấp", count:0}]}));
  expect(html).toContain("<ul"); expect(html).toContain("Cao"); expect(html).toContain("<strong>12</strong>");
  expect(html).toContain('aria-hidden="true"'); expect(html).not.toMatch(/NaN|Infinity/);
 });
 it("supports empty chart data and escapes labels", () => {
  expect(renderToStaticMarkup(h(AggregateBars, {title:"Test",rows:[]}))).toContain("Không có dữ liệu.");
  expect(renderToStaticMarkup(h(AggregateBars, {title:"<script>",rows:[{key:"<img>",count:0}]}))).toContain("&lt;img&gt;");
 });
 it("starts with an announced loading state and full-scope disclaimer", () => {
  const html=renderToStaticMarkup(h(IncidentAnalytics,{filters:{}}));
  expect(html).toContain('role="status"'); expect(html).toContain("không chỉ trang danh sách");
  expect(html).toContain("Báo cáo theo yêu cầu");
 });
 it("keeps normalized text separate from originals and marks old pipeline", () => {
  const html=renderToStaticMarkup(h(NormalizedSource,{analysis:{pipeline:"incidents-v1",normalizedText:"<script>ngập</script>",matchingText:"ngap"}}));
  expect(html).toContain("không thay nguyên văn"); expect(html).toContain("Phân tích cũ");
  expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
  expect(renderToStaticMarkup(h(NormalizedSource,{}))).toContain("giữ nguyên lời người dân");
 });
 it("does not mount or request an emergency feed in incident and assignment views", () => {
  for (const file of ["incident-dashboard.tsx", "incident-detail.tsx", "../../relief/components/relief-dashboard.tsx"]) {
   expect(source(file)).not.toMatch(/EmergencyStrip|emergency-strip|\/incidents\/emergencies|overview\.highPriority/);
  }
  expect(existsSync(new URL("./emergency-strip.tsx", import.meta.url))).toBe(false);
 });
 it("removes estimated priority evidence while preserving original source and decision flows", () => {
  const detail = source("incident-detail.tsx");
  expect(source("incident-common.tsx") + detail).not.toMatch(/PriorityEvidence|Ước tính ưu tiên|incident\.priority/);
  for (const text of ["report.description", "source.analysis", "revealSource", "Ghi nhận xác minh", "Lưu phân công", "IncidentSummaryEditor", "SEVERITY_LABELS", "STATUS_LABELS"]) expect(detail).toContain(text);
 });
 it.each(Object.entries(SEVERITY_LABELS))("keeps official %s badges unchanged by the urgency flag", (severity, label) => {
  const incident = { severity, status: "RESOLVED", needsVerification: true, isUrgent: false } as Incident;
  const html = renderToStaticMarkup(h(IncidentBadges, { incident }));
  expect(renderToStaticMarkup(h(IncidentBadges, { incident: { ...incident, isUrgent: true } }))).toBe(html);
  for (const text of [label, "Đã giải quyết", "Cần xác minh"]) expect(html).toContain(text);
  expect(html).not.toMatch(/khẩn cấp|Ước tính ưu tiên/);
 });
 it("uses one incident marker color without losing official severity popups or density", () => {
  const map = source("incident-map.tsx");
  expect(map).not.toContain("isUrgent");
  expect(map).toContain('color:"#2563eb"');
  expect(map).toContain("Chính thức: ${SEVERITY_LABELS[item.severity]}");
  expect(map).toContain('color:"#d97706"');
  const data = { map: { incidents: [], density: [], incidentReturned: 0, incidentTotal: 0, densityReportTotal: 0, limit: 100, truncated: false }, missingGpsReports: 0 } as unknown as Analytics;
  const html = renderToStaticMarkup(h(IncidentMap, { data }));
  expect(html).toContain("Điểm xanh: sự cố");
  expect(html).not.toContain("Điểm xanh/đỏ");
 });
});
