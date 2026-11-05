"use client";
import {useEffect, useState} from "react";
import dynamic from "next/dynamic";
import {Button} from "@/components/ui/button";
import {incidentGet, incidentDate, SEVERITY_LABELS, STATUS_LABELS, type Analytics, type Filters} from "../api/incidents";
import {IncidentReportExport} from "./incident-report-export";
const IncidentMap=dynamic(()=>import("./incident-map").then(m=>m.IncidentMap),{ssr:false,loading:()=> <p role="status">Đang tải bản đồ…</p>});
export function AggregateBars({title, rows}: {title:string;rows:{key:string;count:number}[]}) {
 const max=Math.max(1,...rows.map(r=>r.count));
 return <section className="rounded-xl border bg-card p-4 min-w-0"><h3 className="mb-3 font-bold">{title}</h3>{!rows.length && <p className="text-sm">Không có dữ liệu.</p>}<ul className="space-y-2">{rows.map(r=><li key={r.key} className="text-xs"><div className="flex justify-between gap-2"><span>{r.key}</span><strong>{r.count}</strong></div><div aria-hidden="true" className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{width:`${Math.max(0,r.count)/max*100}%`}}/></div></li>)}</ul></section>;
}
export function IncidentAnalytics({filters}: {filters:Filters}) {
 return <AnalyticsView key={JSON.stringify(filters)} filters={filters}/>;
}
function AnalyticsView({filters}: {filters:Filters}) {
 const [data,setData]=useState<Analytics|null>(null),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{const abort=new AbortController();incidentGet<Analytics>("/incidents/analytics",filters,abort.signal).then(value=>{if(!abort.signal.aborted){setData(value);setError("");}}).catch(e=>{if(!abort.signal.aborted){setData(null);setError(e instanceof Error?e.message:"Không tải được phân tích.");}});return()=>abort.abort();},[filters,revision]);
 return <div className="space-y-4" aria-label="AI Flood Intelligence">
  <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold">AI Flood Intelligence</h2><Button variant="outline" onClick={()=>setRevision(r=>r+1)}>Tải lại phân tích</Button></div>
  <p className="text-xs text-muted-foreground">Tổng hợp toàn bộ dữ liệu theo bộ lọc, không chỉ trang danh sách đang mở. Báo cáo tính theo thời điểm gửi; sự cố theo khoảng diễn biến giao với kỳ. Báo cáo chưa nhóm chỉ được tính khi không lọc trạng thái, mức độ hoặc phân công. Mặc định 7 ngày lịch Việt Nam; tối đa 31 ngày.</p>
  {error ? <p role="alert" className="rounded border p-4 text-destructive">{error} Hãy thử lại hoặc thu hẹp khoảng ngày.</p>:!data ? <p role="status">Đang tải phân tích tổng hợp…</p>:<>
   <p className="text-xs">Chốt số liệu: {incidentDate(data.generatedAt)}</p>
   <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Sự cố",data.totalIncidents],["Tất cả báo cáo",data.totalReports],["Đã nhóm",data.linkedReports],["Chưa nhóm",data.ungroupedReports],["Thiếu GPS",data.missingGpsReports]].map(([label,count])=><div className="rounded-xl border bg-card p-4" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-2xl font-bold">{count}</dd></div>)}</dl>
   {!data.totalReports && <p>Không có dữ liệu trong phạm vi bộ lọc.</p>}
   <div className="grid gap-3 md:grid-cols-3"><AggregateBars title="Mức độ chính thức" rows={data.bySeverity.map(r=>({...r,key:SEVERITY_LABELS[r.key as keyof typeof SEVERITY_LABELS]??r.key}))}/><AggregateBars title="Tiến độ cứu hộ / trạng thái" rows={data.byStatus.map(r=>({...r,key:STATUS_LABELS[r.key as keyof typeof STATUS_LABELS]??r.key}))}/><AggregateBars title="Báo cáo theo ngày Việt Nam" rows={data.dailyReports.map(r=>({key:r.date,count:r.count}))}/></div>
   <section className="rounded-xl border bg-card p-4"><h3 className="font-bold">Khu vực nhiều báo cáo</h3><ul className="mt-2 text-sm space-y-1">{data.topAreas.map((r,i)=><li key={i}>{[r.ward,r.province].filter(Boolean).join(", ")||"Chưa xác định khu vực"}: {r.reportCount} báo cáo · {r.incidentCount} sự cố</li>)}</ul>{!data.topAreas.length && <p>Không có khu vực được ghi nhận.</p>}</section>
   <IncidentMap data={data}/>
  </>}
  <IncidentReportExport filters={filters}/>
 </div>;
}
