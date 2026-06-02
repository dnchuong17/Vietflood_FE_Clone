import type { FloodReport } from "@/features/reports/api/reports";

export type ReliefQueueFilter =
  | "all"
  | "awaiting"
  | "active"
  | "resolved"
  | "route-ready";

export type ReliefQueueStats = {
  total: number;
  awaiting: number;
  active: number;
  resolved: number;
  routeReady: number;
};

function statusOf(report: FloodReport): string {
  return String(report.status ?? "pending").toLowerCase();
}

function toFiniteNumber(value: FloodReport["lat"]): number | null {
  const numberValue =
    typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue)
    ? numberValue
    : null;
}

export function isReliefRouteReady(report: FloodReport): boolean {
  const latitude = report.lat ?? report.latitude;
  const longitude = report.lng ?? report.longitude;
  return toFiniteNumber(latitude) !== null && toFiniteNumber(longitude) !== null;
}

function isAwaiting(report: FloodReport): boolean {
  return statusOf(report) === "pending";
}

function isActive(report: FloodReport): boolean {
  const status = statusOf(report);
  return status === "verified" || status === "in-progress";
}

function isResolved(report: FloodReport): boolean {
  const status = statusOf(report);
  return status === "resolved" || status === "completed";
}

function categoriesOf(report: FloodReport): string {
  const categories = Array.isArray(report.category)
    ? report.category
    : report.category
      ? [report.category]
      : [];
  return categories.join(" ");
}

function matchesSearch(report: FloodReport, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  if (!normalizedQuery) {
    return true;
  }

  return [
    report.id,
    report.description,
    report.addressLine,
    report.address_line,
    report.province,
    report.ward,
    categoriesOf(report),
    report.user?.name,
    report.user?.username,
    report.user?.phone,
    report.user?.email,
    report.userId,
    report.user_id,
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(" ")
    .toLocaleLowerCase("vi-VN")
    .includes(normalizedQuery);
}

function matchesFilter(report: FloodReport, filter: ReliefQueueFilter): boolean {
  if (filter === "awaiting") {
    return isAwaiting(report);
  }
  if (filter === "active") {
    return isActive(report);
  }
  if (filter === "resolved") {
    return isResolved(report);
  }
  if (filter === "route-ready") {
    return isReliefRouteReady(report);
  }
  return true;
}

export function buildReliefQueueStats(reports: FloodReport[]): ReliefQueueStats {
  return {
    total: reports.length,
    awaiting: reports.filter(isAwaiting).length,
    active: reports.filter(isActive).length,
    resolved: reports.filter(isResolved).length,
    routeReady: reports.filter(isReliefRouteReady).length,
  };
}

export function filterReliefQueueReports(
  reports: FloodReport[],
  filter: ReliefQueueFilter,
  query: string,
): FloodReport[] {
  return reports.filter(
    (report) => matchesFilter(report, filter) && matchesSearch(report, query),
  );
}
