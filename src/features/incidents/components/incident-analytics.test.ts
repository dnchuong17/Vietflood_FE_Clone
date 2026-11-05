import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AggregateBars, IncidentAnalytics } from "./incident-analytics";
import { NormalizedSource, PriorityEvidence } from "./incident-common";
vi.mock("next/dynamic", () => ({default: () => () => null}));

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
 it("explains Critical as an estimate with source references, never official severity", () => {
  const html=renderToStaticMarkup(h(PriorityEvidence,{priority:{value:"CRITICAL",provenance:"estimate",requiresHumanDecision:true,reasonCodes:["LIFE_THREAT"],factIds:["7:2:incidents-v2:0"],sourceReportIds:[7],evidenceVersion:2},onSource:()=>{}}));
  for(const text of ["không thay mức độ chính thức", "đe dọa tính mạng", "không suy từ độ sâu", "LIFE_THREAT", "#7", "7:2:incidents-v2:0"]) expect(html).toContain(text);
 });
});
