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
import { analyzeReports, deduplicateReports } from "../lib/report-analysis";
import { groupReportAreas } from "../lib/report-areas";
import { ReportAnalysisPanel } from "./report-analysis-panel";

const REPORTS_PER_PAGE = 12;

function statusLabel(report: FloodReport): string {
  const value = String(report.status ?? "pending").trim().toLowerCase();
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
  const [locationKey, setLocationKey] = useState<string | null>(null);
  const [areaKey, setAreaKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!role || !canManageReports(role)) return;
    let current = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const reports = await listReports(role!);
        if (current) {
          setLoaded({ role: role!, reports });
          setPage(1);
        }
      } catch (cause) {
        if (current) setError(cause instanceof Error ? cause.message : "Không thể tải báo cáo.");
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [role, revision]);

  const rawReports = useMemo(() => loaded?.role === role ? loaded.reports : [], [loaded, role]);
  const deduplicated = useMemo(() => deduplicateReports(rawReports), [rawReports]);
  const reports = deduplicated.reports;
  const visible = useMemo(() => filterUserReports(reports, applied), [reports, applied]);
  const analysis = useMemo(() => analyzeReports(visible), [visible]);
  const areas = useMemo(() => groupReportAreas(visible), [visible]);
  const selectedArea = isAdmin ? [...areas.provinces, ...areas.wards].find(area => area.key === areaKey) : undefined;
  const areaReports = selectedArea ? new Set(selectedArea.reports) : null;
  const selectedLocation = isAdmin ? analysis.locations.find(location => location.key === locationKey) : undefined;
  const selectedReports = selectedLocation ? new Set(selectedLocation.reports) : null;
  const scoped = visible.filter(report => (!selectedReports || selectedReports.has(report)) &&
    (!areaReports || areaReports.has(report)));
  const pages = Math.max(1, Math.ceil(scoped.length / REPORTS_PER_PAGE));
  const currentPage = Math.min(page, pages);
  const paginated = scoped.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE);
  const isFiltered = Object.entries(applied).some(([key, value]) => key === "status" ? value !== "all" : Boolean(value));
  const hasData = loaded?.role === role;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      reportDateRange(draft);
      setApplied({ ...draft });
      setLocationKey(null);
      setAreaKey(null);
      setPage(1);
      setFilterError(null);
    } catch (cause) {
      setFilterError(cause instanceof Error ? cause.message : "Bộ lọc không hợp lệ.");
    }
  }

  function reset() {
    setDraft(emptyReportFilters());
    setApplied(emptyReportFilters());
    setFilterError(null);
    setLocationKey(null);
    setAreaKey(null);
    setPage(1);
  }

  function quickStatus(status: ReportStatus) {
    const next = { ...applied, status };
    setApplied(next);
    setDraft(next);
    setFilterError(null);
    setLocationKey(null);
    setAreaKey(null);
    setPage(1);
  }

  function selectLocation(key: string) {
    setLocationKey(key);
    setAreaKey(null);
    setPage(1);
    requestAnimationFrame(() => document.getElementById("relief-report-results")?.focus());
  }

  return (
    <div className="workspace-stack" data-testid="report-relief-workspace">
      <header className="workspace-header flex flex-wrap items-start justify-between gap-4">
        <div>
          {isAdmin ? <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Tổng quan điều phối</p> : null}
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
      {hasData && deduplicated.duplicateRows > 0 ? <Alert data-testid="report-dedup-notice"><AlertDescription>
        Đã loại {deduplicated.duplicateRows} dòng lặp mã khỏi phép đếm và danh sách. Mỗi mã chỉ xuất hiện một lần; không xóa báo cáo gốc.
        {deduplicated.conflictingIds > 0 ? ` Có ${deduplicated.conflictingIds} mã có dữ liệu không nhất quán; đang giữ bản đầu tiên API trả về, chưa xác nhận bản mới nhất. Hãy làm mới và đối chiếu chi tiết.` : ""}
      </AlertDescription></Alert> : null}
      {hasData && isAdmin ? <div aria-busy={isLoading}><ReportAnalysisPanel analysis={analysis} areas={areas} selectedArea={selectedArea?.key ?? null}
        onSelectArea={key => { setAreaKey(key); setLocationKey(null); setPage(1); if (key) requestAnimationFrame(() => document.getElementById("relief-report-results")?.focus()); }}
        totalLoaded={reports.length} isFiltered={isFiltered}
        selectedLocation={selectedLocation?.key ?? null} selectedStatus={applied.status}

        onSelectLocation={selectLocation} onSelectStatus={quickStatus} /></div> : null}
      {hasData ? <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <div><h3 id="relief-report-results" tabIndex={-1} className="text-base font-semibold">Danh sách báo cáo gốc</h3>
          <p role="status" className="mt-1 text-sm text-muted-foreground">{scoped.length} / {reports.length} báo cáo</p></div>
        {scoped.length > REPORTS_PER_PAGE ? <p className="text-xs text-muted-foreground">Trang {currentPage}/{pages} · {REPORTS_PER_PAGE} báo cáo mỗi trang</p> : null}
      </div> : null}
      {selectedArea ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="min-w-0 text-sm [overflow-wrap:anywhere]">Đang xem khu vực: <strong>{selectedArea.label}</strong>. Biểu đồ vẫn theo toàn bộ bộ lọc đã áp dụng.</p>
        <Button type="button" variant="outline" onClick={() => { setAreaKey(null); setPage(1); }}>Bỏ chọn khu vực</Button>
      </div> : null}
      {selectedLocation ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="min-w-0 text-sm [overflow-wrap:anywhere]">Đang xem địa điểm: <strong>{selectedLocation.label}</strong></p>
        <Button type="button" variant="outline" onClick={() => { setLocationKey(null); setPage(1); }}>Bỏ chọn địa điểm</Button>
      </div> : null}
      {!isLoading && hasData && visible.length > 0 && scoped.length === 0 ? <Card><CardContent className="space-y-3 p-6 text-sm">
        <p>Không có báo cáo trong phạm vi khu vực hoặc địa điểm đang chọn.</p>
        <Button type="button" variant="outline" onClick={() => { setLocationKey(null); setAreaKey(null); setPage(1); }}>Bỏ chọn phạm vi nhanh</Button>
      </CardContent></Card> : null}
      {!isLoading && !error && hasData && reports.length === 0 ? <Card><CardContent className="p-6 text-sm">Chưa có báo cáo người dân.</CardContent></Card> : null}
      {!isLoading && !error && reports.length > 0 && visible.length === 0 ? <Card><CardContent className="space-y-3 p-6 text-sm"><p>Không có báo cáo phù hợp với bộ lọc.</p><Button type="button" variant="outline" onClick={reset}>Xóa bộ lọc</Button></CardContent></Card> : null}
      <div className="workspace-stack">
        {paginated.map((report, index) => <article key={`report-${report.id ?? "missing"}-${index}`} data-report-id={report.id} className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">#{report.id ?? "—"}</Badge>
              <Badge variant={report.status === "resolved" ? "success" : "secondary"}>{statusLabel(report)}</Badge>
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
      {hasData && pages > 1 ? <nav aria-label="Phân trang báo cáo" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p role="status" className="text-sm text-muted-foreground">Hiển thị {(currentPage - 1) * REPORTS_PER_PAGE + 1}–{Math.min(currentPage * REPORTS_PER_PAGE, scoped.length)} / {scoped.length}</p>
        <div className="flex items-center gap-2"><Button type="button" variant="outline" aria-label="Trang báo cáo trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</Button>
          <span className="text-sm tabular-nums">{currentPage}/{pages}</span>
          <Button type="button" variant="outline" aria-label="Trang báo cáo sau" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Sau</Button></div>
      </nav> : null}
    </div>
  );
}
