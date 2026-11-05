import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportSnapshot, IncidentReportExport } from "./incident-report-export";
import { IncidentSummaryEditor } from "./incident-summary-editor";
import { reportQuery } from "../lib/report-period";
import type { IncidentReport, IncidentDetail } from "../api/incidents";
const edit={id:1,title:"Admin đã kiểm tra",body:"Nội dung <script>không chạy</script>",actorId:12,createdAt:"2026-11-05T18:00:00Z",evidenceVersion:1,pipeline:"incidents-v1",stale:true};
const incident={id:"fixture",title:"Ngập ghi nhận",severity:"UNKNOWN",status:"DETECTED",assignee_id:null,needsVerification:true,evidence_version:2,version:3,priority:{value:"HIGH",provenance:"estimate",requiresHumanDecision:true,reasonCodes:[],factIds:[],sourceReportIds:[7],evidenceVersion:2},sourceReportIds:[7],summary:null,summaryStale:true,editorialSummary:edit} as unknown as IncidentReport["incidents"][number];
const report={generatedAt:"2026-11-05T18:00:00Z",filters:{},analytics:{totalReports:8},incidents:[incident],coverage:{complete:true,incidentCount:1,maximumIncidents:1000}} as IncidentReport;
describe("on-demand incident reports",()=>{
 it("replaces dates without leaking list pagination, keeps geography/severity/status/assignment",()=>{
  const result=reportQuery({province:"Đà Nẵng",ward:"Hải Châu",severity:"HIGH",status:"DETECTED",assignedToMe:"true",cursor:"page2",limit:1,from:"old",to:"old"},"day","2026-11-06");
  expect(result).toEqual({province:"Đà Nẵng",ward:"Hải Châu",severity:"HIGH",status:"DETECTED",assignedToMe:"true",from:"2026-11-05T17:00:00.000Z",to:"2026-11-06T16:59:59.999Z"});
 });
 it("shows snapshot coverage, source and distinct AI/Admin/unverified/stale labels",()=>{
  const html=renderToStaticMarkup(h(ReportSnapshot,{report}));
  for(const text of ["Phạm vi đầy đủ","8 báo cáo","Nguồn: #7","Chưa có tóm tắt","Cũ / chờ phân tích lại","Admin #12","incidents-v1","Bằng chứng v1","Chưa xác minh","Chính thức: Chưa đánh giá","Ước tính ưu tiên: Cao"]) expect(html).toContain(text);
  expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
 });
 it("does not invent missing AI summaries and handles empty reports",()=>{
  const html=renderToStaticMarkup(h(ReportSnapshot,{report:{...report,incidents:[]}}));
  expect(html).toContain("Không có sự cố trong kỳ"); expect(html).not.toContain("AI:");
 });
 it("exposes labeled period controls and authenticated export without scheduling",()=>{
  const html=renderToStaticMarkup(h(IncidentReportExport,{filters:{}}));
  for(const text of ["Kỳ báo cáo","Tuần ISO","Ngày báo cáo","Không có lịch tự động","Tải PDF có xác thực","1.000 sự cố"]) expect(html).toContain(text);
 });
 it("shows read-only Rescue provenance and stale edit without admin editor",()=>{
  const html=renderToStaticMarkup(h(IncidentSummaryEditor,{incident:incident as unknown as IncidentDetail,admin:false,onSaved:async()=>{}}));
  expect(html).toContain("Admin #12"); expect(html).toContain("Bản biên tập cũ"); expect(html).toContain("Xem lịch sử biên tập"); expect(html).not.toContain("Lưu bản biên tập");
 });
 it("matches gateway editor lengths and hides writes for merged incidents",()=>{
  const props={incident:incident as unknown as IncidentDetail,admin:true,onSaved:async()=>{}};
  const html=renderToStaticMarkup(h(IncidentSummaryEditor,props));
  expect(html).toContain('maxLength="200"'); expect(html).toContain('maxLength="4000"'); expect(html).toContain("Lý do biên tập");
  expect(renderToStaticMarkup(h(IncidentSummaryEditor,{...props,incident:{...props.incident,merged_into:"target"}}))).not.toContain("Lưu bản biên tập");
 });
 it("rejects unsupported periods rather than treating them as area ranges",()=>expect(()=>reportQuery({},"invalid","2026-11-06")).toThrow());
});
