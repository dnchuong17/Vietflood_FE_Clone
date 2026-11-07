import type { FloodReport, ReportStatus } from "@/features/reports/api/reports";
import { normalizeVietnamDivision } from "@/features/location/lib/vietnam-address";

export type ReportFilters = {
  province: string;
  ward: string;
  query: string;
  from: string;
  to: string;
  status: ReportStatus | "all";
};

export function emptyReportFilters(): ReportFilters {
  return { province: "", ward: "", query: "", from: "", to: "", status: "all" };
}

function fold(value: string): string {
  return value.toLocaleLowerCase("vi-VN").normalize("NFD")
    .replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d")
    .replace(/\s+/g, " ").trim();
}

/** Calendar controls represent Vietnam dates, not the browser's timezone. */
function startOfVietnamDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Ngày không hợp lệ.");
  const calendar = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(+calendar) || calendar.toISOString().slice(0, 10) !== value) {
    throw new Error("Ngày không hợp lệ.");
  }
  return Date.parse(`${value}T00:00:00+07:00`);
}

export function reportDateRange(filters: Pick<ReportFilters, "from" | "to">) {
  const from = filters.from ? startOfVietnamDay(filters.from) : null;
  const to = filters.to ? startOfVietnamDay(filters.to) + 24 * 60 * 60 * 1000 : null;
  if (from !== null && to !== null && from >= to) {
    throw new Error("Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.");
  }
  return { from, to };
}

export function reportCreatedTime(report: FloodReport): number | null {
  const value = report.createdAt ?? report.created_at;
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function filterUserReports(reports: FloodReport[], filters: ReportFilters): FloodReport[] {
  const { from, to } = reportDateRange(filters);
  const province = normalizeVietnamDivision(filters.province);
  const ward = normalizeVietnamDivision(filters.ward);
  const query = fold(filters.query);
  return reports.filter(report => {
    if (province && normalizeVietnamDivision(report.province ?? "") !== province) return false;
    if (ward && normalizeVietnamDivision(report.ward ?? "") !== ward) return false;
    if (filters.status !== "all" && String(report.status ?? "pending").toLowerCase() !== filters.status) return false;
    if (from !== null || to !== null) {
      const time = reportCreatedTime(report);
      if (time === null || (from !== null && time < from) || (to !== null && time >= to)) return false;
    }
    if (query) {
      const text = [report.id, report.description, report.province, report.ward,
        report.addressLine ?? report.address_line, report.userId ?? report.user_id,
        report.user?.username, report.user?.name, report.user?.phone, report.user?.email,
        ...(Array.isArray(report.category) ? report.category : [report.category])]
        .filter(value => value !== undefined && value !== null).join(" ");
      if (!fold(text).includes(query)) return false;
    }
    return true;
  }).sort((a, b) => (reportCreatedTime(b) ?? -Infinity) - (reportCreatedTime(a) ?? -Infinity));
}
