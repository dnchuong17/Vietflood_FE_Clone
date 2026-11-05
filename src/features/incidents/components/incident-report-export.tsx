"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { incidentGet, incidentPdf, incidentDate, type Filters, type IncidentReport, SEVERITY_LABELS, STATUS_LABELS } from "../api/incidents";
import { reportQuery, vietnamToday } from "../lib/report-period";
import { IncidentLink } from "./incident-common";

export function ReportSnapshot({ report }: { report: IncidentReport }) {
  return <div role="status" className="space-y-3 break-words">
    <p>Chốt dữ liệu {incidentDate(report.generatedAt)} · {report.coverage.incidentCount} sự cố · {report.coverage.complete ? "Phạm vi đầy đủ" : "Phạm vi không đầy đủ"} · {report.analytics.totalReports} báo cáo</p>
    {!report.incidents.length && <p>Không có sự cố trong kỳ báo cáo.</p>}
    <ul className="space-y-3">{report.incidents.map(i => <li className="rounded border p-3 text-sm space-y-1" key={i.id}>
      <IncidentLink id={i.id}>{i.title}</IncidentLink>
      <p>Chính thức: {SEVERITY_LABELS[i.severity]} · {STATUS_LABELS[i.status]} · Cứu trợ {i.assignee_id ? `#${i.assignee_id}` : "chưa phân công"}</p>
      <p>Ước tính ưu tiên: {SEVERITY_LABELS[i.priority.value]} — cần con người quyết định</p>
      <p>{i.needsVerification ? "Chưa xác minh / cần xác minh" : "Đã xác minh theo phiên bản bằng chứng"}</p>
      <p>Nguồn: {i.sourceReportIds.map(id => `#${id}`).join(", ") || "Chưa có"}</p>
      <p>AI: {i.summary ? i.summary.title : "Chưa có tóm tắt"}{i.summaryStale ? " · Cũ / chờ phân tích lại" : ""}</p>
      {i.editorialSummary && <><p className="whitespace-pre-wrap">Admin: {i.editorialSummary.title} — {i.editorialSummary.body}{i.editorialSummary.stale ? " · Bản biên tập cũ" : ""}</p><p>Admin #{i.editorialSummary.actorId ?? "không xác định"} · {incidentDate(i.editorialSummary.createdAt)} · {i.editorialSummary.pipeline} · Bằng chứng v{i.editorialSummary.evidenceVersion}</p></>}
    </li>)}</ul>
  </div>;
}

export function IncidentReportExport({ filters }: { filters: Filters }) {
  return <ReportExportForm key={JSON.stringify(filters)} filters={filters} />;
}
function ReportExportForm({ filters }: { filters: Filters }) {
  const [mode, setMode] = useState("day"), [date, setDate] = useState(vietnamToday), [week, setWeek] = useState(""), [end, setEnd] = useState(vietnamToday);
  const [report, setReport] = useState<IncidentReport | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function changed() {
    controller.current?.abort(); setBusy(false); setReport(null); setError("");
  }
  async function generate(pdf = false) {
    controller.current?.abort(); const next = new AbortController(); controller.current = next;
    setBusy(true); setError(""); setReport(null);
    try {
      const query = reportQuery(filters, mode, mode === "week" ? week : date, end);
      if (pdf) {
        const blob = await incidentPdf(query, next.signal); if (next.signal.aborted) return;
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        try { link.href = url; link.download = `vietflood-${mode === "week" ? week : date}.pdf`; document.body.append(link); link.click(); }
        finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      } else {
        const result = await incidentGet<IncidentReport>("/incidents/report", query, next.signal);
        if (!next.signal.aborted) setReport(result);
      }
    } catch (e) { if (!next.signal.aborted) setError(e instanceof Error ? e.message : "Không tạo được báo cáo."); }
    finally { if (!next.signal.aborted) setBusy(false); }
  }
  return <section aria-label="Báo cáo theo yêu cầu" className="space-y-3 rounded-xl border bg-card p-4 min-w-0">
    <h3 className="font-bold">Báo cáo theo yêu cầu</h3>
    <p className="text-xs text-muted-foreground">Ngày/tuần ISO theo Việt Nam (UTC+7). Dùng khu vực, mức độ, trạng thái và phân công đang lọc; khoảng ngày báo cáo chọn bên dưới. Tối đa 31 ngày, 1.000 sự cố; máy chủ từ chối nếu quá lớn. Không có lịch tự động.</p>
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm min-w-0">Kỳ báo cáo<select aria-label="Kỳ báo cáo" className="rounded border bg-background p-2" value={mode} onChange={e => { changed(); setMode(e.target.value); }}><option value="day">Ngày</option><option value="week">Tuần ISO</option><option value="area">Khu vực / khoảng ngày</option></select></label>
      {mode === "week" ? <label className="grid gap-1 text-sm min-w-0">Tuần ISO<Input type="week" value={week} onChange={e => { changed(); setWeek(e.target.value); }} /></label> : <label className="grid gap-1 text-sm min-w-0">Ngày báo cáo<Input type="date" value={date} onChange={e => { changed(); setDate(e.target.value); }} /></label>}
      {mode === "area" && <label className="grid gap-1 text-sm min-w-0">Ngày kết thúc báo cáo<Input type="date" value={end} min={date} onChange={e => { changed(); setEnd(e.target.value); }} /></label>}
      <Button disabled={busy} onClick={() => void generate()}>Tổng hợp báo cáo</Button><Button variant="outline" disabled={busy} onClick={() => void generate(true)}>Tải PDF có xác thực</Button>
    </div>
    {busy && <p role="status">Đang tạo báo cáo…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {report && <ReportSnapshot report={report} />}
  </section>;
}
