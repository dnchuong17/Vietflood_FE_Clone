"use client";

import Link from "next/link";
import { ChartBarIcon, DocumentDuplicateIcon, DocumentTextIcon, CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReportStatus } from "@/features/reports/api/reports";
import { getReportStatusLabel } from "@/features/reports/lib/status";
import type { ReportAnalysis } from "../lib/report-analysis";
import type { ReportAreas } from "../lib/report-areas";
import { ReportAreaChart } from "./report-area-chart";
import { ReportTrendChart } from "./report-trend-chart";

const number = new Intl.NumberFormat("vi-VN");
const statusOrder = ["pending", "verified", "resolved", "rejected"] as const;

type Props = {
  analysis: ReportAnalysis;
  areas: ReportAreas;
  selectedArea: string | null;
  onSelectArea: (key: string | null) => void;
  totalLoaded: number;
  isFiltered: boolean;
  selectedLocation: string | null;
  selectedStatus: ReportStatus | "all";
  onSelectLocation: (key: string) => void;
  onSelectStatus: (status: ReportStatus) => void;
};

/** Read-only projections of the same report collection as the original list. */
export function ReportAnalysisPanel({ analysis, areas, selectedArea, onSelectArea, totalLoaded, isFiltered, selectedLocation, selectedStatus, onSelectLocation, onSelectStatus }: Props) {
  const days = analysis.days.slice(-7);
  const priorityLocations = [...analysis.locations].sort((a, b) => b.reports.length - a.reports.length || b.open - a.open || a.key.localeCompare(b.key, "vi"));
  const metrics = [
    { id: "total", label: "Báo cáo không lặp ID", value: analysis.total, hint: isFiltered ? `Trong ${number.format(totalLoaded)} báo cáo đã tải` : "Toàn bộ dữ liệu đã tải", icon: DocumentTextIcon, tone: "text-primary" },
    { id: "open", label: "Chưa hoàn tất", value: analysis.open, hint: "Chờ xử lý + đã xác minh", icon: ChartBarIcon, tone: "text-primary" },
    { id: "resolved", label: "Đã xử lý", value: analysis.statuses.resolved, hint: "Báo cáo có trạng thái đã xử lý", icon: CheckCircleIcon, tone: "text-success" },
    { id: "locations", label: "Điểm được định danh", value: analysis.locations.length, hint: `${number.format(analysis.unknownLocationReports)} báo cáo thiếu vị trí cụ thể`, icon: MapPinIcon, tone: "text-primary" },
  ];

  return <section data-testid="report-analysis-panel" aria-labelledby="report-analysis-title" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 id="report-analysis-title" className="text-base font-semibold">Phân tích nhanh</h3>
        <p className="mt-1 text-sm text-muted-foreground">{isFiltered ? "Theo bộ lọc đã áp dụng" : "Tất cả báo cáo đã tải"} · Không phụ thuộc phân trang danh sách</p>
      </div>
      <Badge variant="outline">Quản trị · Chỉ đọc</Badge>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map(({ id, label, value, hint, icon: Icon, tone }) => <div key={id} className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className={`size-5 shrink-0 ${tone}`} aria-hidden="true" />
        </div>
        <p data-testid={`analysis-${id}`} className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-card-foreground">{number.format(value)}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>)}
    </div>

    <ReportAreaChart areas={areas} total={analysis.total} selectedArea={selectedArea} onSelectArea={onSelectArea} />

    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-labelledby="report-status-heading" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        <h4 id="report-status-heading" className="font-semibold">Trạng thái báo cáo</h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Chọn một trạng thái để áp dụng nhanh vào bộ lọc và danh sách.</p>
        <div className="mt-4 space-y-2">
          {statusOrder.map(status => <button key={status} type="button" aria-label={`Lọc trạng thái ${getReportStatusLabel(status)}`} aria-pressed={selectedStatus === status}
            onClick={() => onSelectStatus(status)} className="group w-full rounded-lg border border-transparent p-2.5 text-left transition-colors hover:border-border hover:bg-accent aria-pressed:border-primary aria-pressed:bg-primary/5">
            <span className="flex items-center justify-between gap-3 text-sm"><span>{getReportStatusLabel(status)}</span><span className="font-semibold tabular-nums">{number.format(analysis.statuses[status])}</span></span>
            <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${status === "rejected" ? "bg-muted-foreground" : status === "resolved" ? "bg-success" : "bg-primary"}`} style={{ width: `${analysis.total ? analysis.statuses[status] / analysis.total * 100 : 0}%` }} /></span>
          </button>)}
        </div>
        {analysis.statuses.unknown > 0 ? <p className="mt-3 text-xs text-muted-foreground">Chưa rõ trạng thái: {number.format(analysis.statuses.unknown)} báo cáo (vẫn tính trong tổng).</p> : null}
      </section>
      <section aria-labelledby="report-trend-heading" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        <h4 id="report-trend-heading" className="font-semibold">Nhịp gửi báo cáo</h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">7 ngày có báo cáo gần nhất trong phạm vi đang xem · UTC+7</p>
        {days.length ? <ReportTrendChart days={days} /> : <p className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">Chưa có ngày gửi hợp lệ để vẽ biểu đồ.</p>}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{number.format(analysis.undated)} báo cáo thiếu ngày hợp lệ vẫn có trong tổng. Các ngày không có báo cáo không được vẽ.</p>
      </section>
    </div>

    <div className="grid gap-4">
      <section aria-labelledby="report-location-heading" className="min-w-0 overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-4 sm:p-5">
          <h4 id="report-location-heading" className="font-semibold">Địa điểm cần đối chiếu</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Xếp theo tổng báo cáo, rồi số chưa hoàn tất. Mỗi địa điểm một dòng; các mã báo cáo khác nhau vẫn được giữ riêng.</p>
        </div>
        {analysis.locations.length ? <ul className="max-h-96 divide-y overflow-y-auto overscroll-contain p-2" aria-label="Các địa điểm không lặp">
          {priorityLocations.map(location => <li key={location.key}>
            <button type="button" aria-label={`Xem báo cáo tại ${location.label}`} aria-pressed={selectedLocation === location.key} onClick={() => onSelectLocation(location.key)}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent aria-pressed:bg-primary/10">
              <MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{location.label}</span>
                <span className="block text-xs leading-5 text-muted-foreground">{location.precision === "address" ? "Địa chỉ đầy đủ" : "Tọa độ GPS chính xác"} · {location.open} chưa hoàn tất</span>
              </span>
              <span className="shrink-0 rounded-lg border bg-background px-2.5 py-1 text-sm font-bold tabular-nums" aria-label={`${location.reports.length} báo cáo`}>{number.format(location.reports.length)}</span>
            </button>
          </li>)}
        </ul> : <p className="p-5 text-sm text-muted-foreground">Chưa đủ địa chỉ hoặc GPS hợp lệ để xác định địa điểm.</p>}
        <p className="border-t bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">{number.format(analysis.unknownLocationReports)} báo cáo chưa đủ vị trí được giữ riêng trong danh sách; không gom cả phường/xã thành một điểm.</p>
      </section>

    </div>

    <section data-testid="duplicate-candidates" aria-labelledby="report-duplicates-heading" className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-start gap-3 border-b p-4 sm:p-5">
        <DocumentDuplicateIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0"><h4 id="report-duplicates-heading" className="font-semibold">Báo cáo có thể trùng · {number.format(analysis.duplicateCandidates.length)} nhóm</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Chỉ là dấu hiệu đối chiếu, không phải kết luận. Các mã báo cáo khác nhau vẫn có trong tổng và danh sách gốc.</p></div>
      </div>
      {analysis.duplicateCandidates.length ? <ul className="max-h-72 divide-y overflow-y-auto" aria-label="Nhóm báo cáo cần đối chiếu">
        {analysis.duplicateCandidates.map(candidate => <li key={candidate.key} className="space-y-2 p-4 sm:px-5">
          <p className="text-sm font-medium [overflow-wrap:anywhere]">{candidate.locationLabel}</p>
          <p className="text-xs leading-5 text-muted-foreground">{candidate.reason}</p>
          <div className="flex flex-wrap gap-2">{candidate.reportIds.map(id => <Button key={id} asChild variant="outline"><Link href={`/bao-cao/${id}`}>Đối chiếu #{id}</Link></Button>)}</div>
        </li>)}
      </ul> : <p className="p-4 text-sm text-muted-foreground sm:p-5">Không phát hiện nhóm trùng theo tiêu chí hiện tại. Điều này không đảm bảo không có báo cáo trùng ngoài thực tế.</p>}
    </section>
    <details className="rounded-xl border bg-muted/20 p-4 text-sm">
      <summary className="min-h-6 cursor-pointer font-medium">Cách đếm và giới hạn chống trùng</summary>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-6 text-muted-foreground">
        <li>Mỗi mã báo cáo hợp lệ chỉ được đếm một lần. Nếu API trả nhiều phiên bản cùng mã, giữ bản đầu tiên; không suy đoán bản mới nhất. Báo cáo thiếu mã được giữ riêng, không tự xóa.</li>
        <li>Địa điểm trùng khi đủ tỉnh/thành, phường/xã và địa chỉ đường/nhà tương đương, hoặc có cặp GPS hợp lệ giống hệt khi thiếu địa chỉ đầy đủ. Không làm tròn tọa độ, không ghép theo khoảng cách.</li>
        <li>Gợi ý trùng yêu cầu cùng người gửi, địa điểm, nội dung và loại báo cáo trong tối đa một giờ tính từ bản đầu nhóm. Không tự gộp hoặc xóa báo cáo, không ghi dữ liệu vào hệ thống.</li>
        <li>Địa chỉ thiếu, khác cách viết hoặc GPS sai lệch có thể chưa được nhận diện. Số điểm là nhóm dữ liệu định danh, không phải số sự cố hay ranh giới ngập đã xác minh.</li>
      </ul>
    </details>
  </section>;
}
