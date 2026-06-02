import type { FloodReport, ReportStatus } from "../api/reports";
import { REPORT_STATUS_OPTIONS } from "./status";

export type ReportsOverviewSummary = {
  total: number;
  filtered: number;
  pending: number;
  verified: number;
  resolved: number;
  rejected: number;
  urgent: number;
};

function toReportStatus(status: FloodReport["status"]): ReportStatus {
  const normalized = String(status ?? "pending").toLowerCase();
  return REPORT_STATUS_OPTIONS.includes(normalized as ReportStatus)
    ? (normalized as ReportStatus)
    : "pending";
}

function isUrgentReport(report: FloodReport): boolean {
  return Boolean(report.isUrgent ?? report.is_urgent);
}

export function buildReportsOverviewSummary(
  reports: FloodReport[],
  filtered = reports.length,
): ReportsOverviewSummary {
  return reports.reduce<ReportsOverviewSummary>(
    (summary, report) => {
      const status = toReportStatus(report.status);
      summary[status] += 1;
      if (isUrgentReport(report)) {
        summary.urgent += 1;
      }
      return summary;
    },
    {
      total: reports.length,
      filtered,
      pending: 0,
      verified: 0,
      resolved: 0,
      rejected: 0,
      urgent: 0,
    },
  );
}

export function formatReportsLastSyncedAt(
  value: string | null,
  fallback = "Chưa đồng bộ",
): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
