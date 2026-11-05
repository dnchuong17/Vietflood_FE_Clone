import { dateBoundary, type Filters } from "../api/incidents";
const DAY = 86400000;
export function vietnamToday(now = new Date()) {
 return new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit"}).format(now);
}
function day(value: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Ngày không hợp lệ.");
 const date = new Date(value + "T00:00:00Z");
 if (!Number.isFinite(+date) || date.toISOString().slice(0,10) !== value) throw new Error("Ngày không hợp lệ.");
 return date;
}
export function calendarRange(from: string, to: string): Filters {
 const start = day(from), end = day(to);
 if (+end < +start || +end - +start >= 31 * DAY) throw new Error("Chọn khoảng ngày có thứ tự, tối đa 31 ngày.");
 return {from: dateBoundary(from), to: dateBoundary(to, true)};
}
export function reportPeriod(mode: string, value: string, end = value): Filters {
 if (!["day", "week", "area"].includes(mode)) throw new Error("Kỳ báo cáo không hợp lệ.");
 if (mode === "week") {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) throw new Error("Tuần ISO không hợp lệ.");
  const year = Number(match[1]), week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year,0,4));
  const monday = new Date(+jan4 - ((jan4.getUTCDay()+6)%7)*DAY + (week-1)*7*DAY);
  const thursday = new Date(+monday+3*DAY);
  if (week < 1 || week > 53 || thursday.getUTCFullYear() !== year) throw new Error("Tuần ISO không tồn tại.");
  return calendarRange(monday.toISOString().slice(0,10), new Date(+monday+6*DAY).toISOString().slice(0,10));
 }
 return calendarRange(value, mode === "day" ? value : end);
}
export function validGps(lat: unknown, lng: unknown): boolean {
 return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// A report covers the full scope, never a list cursor/page size.
export function reportQuery(filters: Filters, mode: string, value: string, end = value): Filters {
 const {province, ward, severity, status, assignedToMe} = filters;
 return {province, ward, severity, status, assignedToMe, ...reportPeriod(mode, value, end)};
}
