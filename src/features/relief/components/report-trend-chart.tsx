"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReportAnalysis } from "../lib/report-analysis";

export function ReportTrendChart({ days }: { days: ReportAnalysis["days"] }) {
  return <>
    <div role="group" aria-label="Biểu đồ số báo cáo theo ngày Việt Nam" className="mt-5 h-52 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 208 }}>
        <AreaChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: -24 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={date => `${String(date).slice(8, 10)}/${String(date).slice(5, 7)}`} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, background: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} labelFormatter={value => `Ngày ${String(value)} · UTC+7`} />
          <Area type="linear" dataKey="total" name="Tổng báo cáo" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2.5} isAnimationActive={false} dot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-primary" />Tổng báo cáo</span></div>
    <ol aria-label="Số báo cáo theo ngày Việt Nam" className="sr-only">{days.map(day => <li key={day.date}>{day.date}: {day.total} báo cáo</li>)}</ol>
  </>;
}
