"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowPathIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { canManageReports, normalizeRole } from "@/features/auth/lib/roles";
import { VietnamAddressPicker } from "@/features/location/components/vietnam-address-picker";
import { listReports, type FloodReport, type ReportStatus } from "@/features/reports/api/reports";
import { getReportStatusLabel, REPORT_STATUS_OPTIONS } from "@/features/reports/lib/status";
import { emptyReportFilters, filterUserReports, reportCreatedTime, reportDateRange, type ReportFilters } from "../lib/report-filters";

function statusLabel(report: FloodReport): string {
  const value = String(report.status ?? "pending").toLowerCase();
  return REPORT_STATUS_OPTIONS.includes(value as ReportStatus)
    ? getReportStatusLabel(value as ReportStatus) : "Chưa rõ trạng thái";
}

function createdLabel(report: FloodReport): string {
  const time = reportCreatedTime(report);
  return time === null ? "Chưa có ngày gửi" : new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
  }).format(time);
}

export function ReportReliefDashboard() {
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const [loaded, setLoaded] = useState<{ role: string; reports: FloodReport[] } | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<ReportFilters>(emptyReportFilters);
  const [applied, setApplied] = useState<ReportFilters>(emptyReportFilters);
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    if (!role || !canManageReports(role)) return;
    let current = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const reports = await listReports(role!);
        if (current) setLoaded({ role: role!, reports });
      } catch (cause) {
        if (current) setError(cause instanceof Error ? cause.message : "Không thể tải báo cáo.");
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [role, revision]);

  const reports = useMemo(() => loaded?.role === role ? loaded.reports : [], [loaded, role]);
  const visible = useMemo(() => filterUserReports(reports, applied), [reports, applied]);
  const hasData = loaded?.role === role;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      reportDateRange(draft);
      setApplied({ ...draft });
      setFilterError(null);
    } catch (cause) {
      setFilterError(cause instanceof Error ? cause.message : "Bộ lọc không hợp lệ.");
    }
  }

  function reset() {
    setDraft(emptyReportFilters());
    setApplied(emptyReportFilters());
    setFilterError(null);
  }

  return (
    <div className="workspace-stack" data-testid="report-relief-workspace">
      <header className="workspace-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="workspace-title">Báo cáo người dân</h2>
          <p className="workspace-description mt-1">Xem trực tiếp báo cáo đã gửi. Không cần chờ AI phân tích hoặc chuyển sang đã xử lý.</p>
        </div>
        <Button type="button" variant="outline" disabled={isLoading} onClick={() => setRevision(value => value + 1)}>
          <ArrowPathIcon className="size-4" aria-hidden="true" />Làm mới
        </Button>
      </header>

      <form onSubmit={apply} onReset={reset} className="workspace-toolbar grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <VietnamAddressPicker idPrefix="relief-filter" value={{ province: draft.province, ward: draft.ward }}
          onChange={address => setDraft(value => ({ ...value, ...address }))} className="sm:col-span-2" />
        <label className="grid gap-1.5 text-sm font-semibold" htmlFor="relief-filter-from">Từ ngày
          <Input id="relief-filter-from" name="from" type="date" value={draft.from} onChange={event => setDraft(value => ({ ...value, from: event.target.value }))} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold" htmlFor="relief-filter-to">Đến ngày
          <Input id="relief-filter-to" name="to" type="date" value={draft.to} onChange={event => setDraft(value => ({ ...value, to: event.target.value }))} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2" htmlFor="relief-filter-search">Tìm báo cáo
          <Input id="relief-filter-search" name="query" value={draft.query} placeholder="Nội dung, địa chỉ hoặc người báo"
            onChange={event => setDraft(value => ({ ...value, query: event.target.value }))} />
        </label>
        <div className="grid gap-1.5">
          <label htmlFor="relief-filter-status" className="text-sm font-semibold">Trạng thái báo cáo</label>
          <Select name="status" value={draft.status} onValueChange={status => setDraft(value => ({ ...value, status: status as ReportFilters["status"] }))}>
            <SelectTrigger id="relief-filter-status" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {REPORT_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{getReportStatusLabel(status)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Áp dụng bộ lọc</Button>
          <Button type="reset" variant="ghost">Xóa bộ lọc</Button>
        </div>
      </form>
      {filterError ? <p role="alert" className="text-sm text-destructive">{filterError}</p> : null}

      {error ? <Alert variant="destructive"><AlertDescription className="space-y-3">
        <p>Không thể tải báo cáo. {error}</p>
        {hasData ? <p>Dữ liệu hiển thị là từ lần tải trước, chưa xác nhận cập nhật mới nhất.</p> : null}
        <Button type="button" variant="outline" disabled={isLoading} onClick={() => setRevision(value => value + 1)}>Thử lại</Button>
      </AlertDescription></Alert> : null}
      {isLoading ? <div role="status" className="space-y-3"><p className="text-sm">Đang tải báo cáo…</p><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : null}
      {hasData ? <p role="status" className="text-sm text-muted-foreground">{visible.length} / {reports.length} báo cáo</p> : null}
      {!isLoading && !error && hasData && reports.length === 0 ? <Card><CardContent className="p-6 text-sm">Chưa có báo cáo người dân.</CardContent></Card> : null}
      {!isLoading && !error && reports.length > 0 && visible.length === 0 ? <Card><CardContent className="space-y-3 p-6 text-sm"><p>Không có báo cáo phù hợp với bộ lọc.</p><Button type="button" variant="outline" onClick={reset}>Xóa bộ lọc</Button></CardContent></Card> : null}
      <div className="workspace-stack">
        {visible.map((report, index) => <article key={report.id ?? index} data-report-id={report.id} className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">#{report.id ?? "—"}</Badge>
              <Badge variant={report.status === "resolved" ? "success" : "secondary"}>{statusLabel(report)}</Badge>
              {report.isUrgent ? <Badge variant="critical">Khẩn cấp</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground">{createdLabel(report)}</p>
          </div>
          <h3 className="mt-3 break-words text-base font-semibold">{report.description || "Chưa có mô tả"}</h3>
          <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-muted-foreground"><MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="break-words">{[report.addressLine ?? report.address_line, report.ward, report.province].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</span></p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="break-words text-sm text-muted-foreground">Người báo: {report.user?.name || report.user?.username || report.userId || report.user_id || "Chưa có thông tin"}</p>
            {report.id ? <Button asChild variant="outline"><Link href={`/bao-cao/${report.id}`}>Chi tiết báo cáo</Link></Button> : null}
          </div>
        </article>)}
      </div>
    </div>
  );
}
