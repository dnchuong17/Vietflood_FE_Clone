"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from "recharts";
import { Button } from "@/components/ui/button";
import type { ReportArea, ReportAreas } from "../lib/report-areas";

const number = new Intl.NumberFormat("vi-VN");
const shortLabel = (label: string) => label.length > 22 ? `${label.slice(0, 21)}…` : label;

type Props = {
  areas: ReportAreas;
  total: number;
  selectedArea: string | null;
  onSelectArea: (key: string | null) => void;
};

export function ReportAreaChart({ areas, total, selectedArea, onSelectArea }: Props) {
  const [level, setLevel] = useState<"province" | "ward">("province");
  const ranked = level === "province" ? areas.provinces : areas.wards;
  const unknown = level === "province" ? areas.unknownProvince : areas.unknownWard;
  const top = ranked.slice(0, 8);
  const height = Math.max(190, top.length * 48 + 36);
  function select(key: string) { onSelectArea(selectedArea === key ? null : key); }

  return <section data-testid="report-area-chart" data-area-level={level} aria-labelledby="report-area-heading" className="min-w-0 overflow-hidden rounded-2xl border bg-card text-card-foreground">
    <div className="flex flex-col gap-4 border-b bg-primary/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Phân bố theo khu vực</p>
        <h4 id="report-area-heading" className="mt-1 text-lg font-semibold">Khu vực nhiều báo cáo</h4>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Xếp hạng theo tổng báo cáo không lặp ID. Chọn cột hoặc tên khu vực để xem báo cáo gốc; không gộp các báo cáo thành một sự cố.</p>
      </div>
      <div role="group" aria-label="Cấp khu vực" className="flex flex-wrap gap-1 rounded-xl border bg-background p-1">
        {([['province', 'Tỉnh/thành'], ['ward', 'Phường/xã']] as const).map(([value, label]) => <Button key={value} type="button" size="sm"
          variant={level === value ? "default" : "ghost"} className="min-h-10" aria-pressed={level === value}
          onClick={() => { setLevel(value); onSelectArea(null); }}>{label}</Button>)}
      </div>
    </div>
    {ranked.length ? <div className="grid min-w-0 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Top {top.length} / {number.format(ranked.length)} khu vực · Tổng báo cáo</span>
          <span>{number.format(total - unknown)} / {number.format(total)} có đủ khu vực</span>
        </div>
        <div data-testid="area-recharts" role="group" aria-label="Biểu đồ xếp hạng khu vực theo số báo cáo" className="min-w-0" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height }}>
            <BarChart data={top} layout="vertical" margin={{ top: 8, right: 36, bottom: 4, left: 0 }} accessibilityLayer>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis type="category" dataKey="label" width={120} interval={0} tickFormatter={shortLabel} tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={({ active, payload }) => {
                const area = payload?.[0]?.payload as ReportArea | undefined;
                return active && area ? <div className="max-w-64 rounded-xl border bg-popover p-3 text-sm text-popover-foreground shadow-xl [overflow-wrap:anywhere]">
                  <p className="font-semibold">{area.label}</p><p className="mt-2">{number.format(area.total)} báo cáo</p>
                  <p className="text-muted-foreground">{number.format(area.open)} chưa hoàn tất</p>
                </div> : null;
              }} />
              <Bar dataKey="total" name="Báo cáo" barSize={24} radius={[0, 6, 6, 0]} fill="var(--primary)" isAnimationActive={false}
                onClick={(_entry, index) => { const area = top[index]; if (area) select(area.key); }} cursor="pointer"
                shape={(props: BarShapeProps) => <Rectangle {...props} fill={top[props.index]?.key === selectedArea ? "var(--success)" : "var(--primary)"} />}>
                <LabelList dataKey="total" position="right" fill="var(--foreground)" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Biểu đồ hiển thị tối đa 8 khu vực. Danh sách bên cạnh có toàn bộ khu vực, tên đầy đủ và thao tác bàn phím.</p>
      </div>
      <div className="min-w-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bảng xếp hạng đầy đủ</p>
        <ol aria-label="Xếp hạng khu vực theo báo cáo" className="max-h-[440px] space-y-2 overflow-y-auto overscroll-contain p-1">
          {ranked.map((area, index) => <li key={area.key} data-testid="area-ranking-item" data-area-total={area.total}>
            <button type="button" aria-label={`Xem khu vực ${area.label}`} aria-pressed={selectedArea === area.key} onClick={() => select(area.key)}
              className="flex min-h-16 w-full items-start gap-3 rounded-xl border border-transparent bg-muted/30 p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent aria-pressed:border-primary aria-pressed:bg-primary/10">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-bold tabular-nums text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold [overflow-wrap:anywhere]">{area.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{number.format(area.open)} chưa hoàn tất</span></span>
              <span className="shrink-0 text-right"><span className="block text-lg font-bold tabular-nums">{number.format(area.total)}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{total ? number.format(Math.round(area.total / total * 100)) : 0}%</span></span>
            </button>
          </li>)}
        </ol>
      </div>
    </div> : <p className="p-6 text-sm text-muted-foreground">Chưa có báo cáo đủ thông tin cho cấp khu vực này.</p>}
    <p role="status" className="border-t bg-muted/20 px-4 py-3 text-xs leading-6 text-muted-foreground sm:px-6">
      {number.format(unknown)} báo cáo thiếu {level === "province" ? "tỉnh/thành" : "tỉnh/thành hoặc phường/xã"}, không xếp vào khu vực phỏng đoán; vẫn giữ trong tổng và danh sách gốc. Nhóm hành chính không phải một địa điểm GPS hay sự cố duy nhất.
    </p>
  </section>;
}
