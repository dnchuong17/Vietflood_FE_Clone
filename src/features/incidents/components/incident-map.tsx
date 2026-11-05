"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Analytics, SEVERITY_LABELS } from "../api/incidents";
import { validGps } from "../lib/report-period";
import { IncidentLink } from "./incident-common";

export function IncidentMap({data}: {data: Analytics}) {
 const container = useRef<HTMLDivElement>(null), map = useRef<LeafletMap | null>(null);
 const markers = useRef(new Map<string, CircleMarker>());
 const [error, setError] = useState("");
 const [density, setDensity] = useState(true);
 useEffect(() => {
  let disposed = false;
  import("leaflet").then(L => {
   if (disposed || !container.current) return;
   const current = L.map(container.current, {scrollWheelZoom: false}).setView([16,106],5); map.current = current;
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on("tileerror", () => {if (!disposed) setError("Không tải được nền bản đồ. Các điểm và danh sách vẫn sử dụng được.");}).addTo(current);
   const bounds: [number,number][] = [];
   for (const item of data.map.incidents) {
    if (!validGps(item.lat,item.lng)) continue;
    const text = document.createElement("p"); text.textContent = `${item.title} · Chính thức: ${SEVERITY_LABELS[item.severity]} · ${item.reportCount} báo cáo`;
    const marker = L.circleMarker([item.lat,item.lng], {radius:9,color:item.isUrgent ? "#dc2626" : "#2563eb",fillOpacity:0.8}).addTo(current).bindPopup(text);
    markers.current.set(item.id, marker); bounds.push([item.lat,item.lng]);
   }
   if (density) for (const point of data.map.density) {
    if (!validGps(point.lat, point.lng)) continue;
    const label = document.createElement("span"); label.textContent = `${point.count} báo cáo tại điểm này (không phải ranh giới ngập)`;
    L.circleMarker([point.lat,point.lng], {radius:Math.min(36,8+Math.sqrt(point.count)*3),color:"#d97706",fillOpacity:0.2,weight:1}).addTo(current).bindTooltip(label); bounds.push([point.lat,point.lng]);
   }
   if (bounds.length) current.fitBounds(bounds,{padding:[30,30],maxZoom:14});
  }).catch(() => {if (!disposed) setError("Không khởi tạo được bản đồ. Sử dụng danh sách bên dưới.");});
  const savedMarkers = markers.current;
  return () => {disposed = true; map.current?.remove(); map.current = null; savedMarkers.clear();};
 }, [data, density]);
 return <section aria-label="Bản đồ nhiều sự cố" className="space-y-3 rounded-xl border bg-card p-4 min-w-0">
  <h3 className="font-bold">Bản đồ sự cố & mật độ báo cáo</h3>
  <p className="text-xs text-muted-foreground">Hiển thị {data.map.incidentReturned}/{data.map.incidentTotal} sự cố · {data.map.densityReportTotal} báo cáo có GPS trong lớp mật độ · giới hạn {data.map.limit} điểm. {data.map.truncated ? "Đã giới hạn điểm; số liệu tổng hợp vẫn đầy đủ." : "Không cắt bớt điểm."} Thiếu GPS: {data.missingGpsReports} báo cáo. Không suy ra ranh giới ngập đã xác minh.</p>
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={density} onChange={e=>setDensity(e.target.checked)}/>Hiện mật độ ghi nhận (màu cam)</label>
  {error && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{error}</p>}
  <div ref={container} aria-label="Bản đồ tương tác Leaflet" className="relative z-0 h-80 w-full rounded-lg bg-muted text-black"/>
  <p className="text-xs">Điểm xanh/đỏ: sự cố; vùng tròn cam: mật độ ghi nhận, không phải mức nước. Danh sách bàn phím tương đương:</p>
  <ul className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-auto">
   {data.map.incidents.filter(i=>validGps(i.lat,i.lng)).map(item=><li key={item.id} className="rounded border p-2 text-sm break-words"><button type="button" className="underline text-primary text-left" onClick={()=>{map.current?.setView([item.lat,item.lng],14); markers.current.get(item.id)?.openPopup();}}>Định vị {item.title}</button><p>{item.lat}, {item.lng} · {item.reportCount} báo cáo</p><IncidentLink id={item.id}>Chi tiết sự cố</IncidentLink></li>)}
  </ul>
  {!data.map.incidents.length && <p>Không có sự cố có GPS trong phạm vi này. Báo cáo thiếu GPS vẫn nằm trong tổng số.</p>}
 </section>;
}
