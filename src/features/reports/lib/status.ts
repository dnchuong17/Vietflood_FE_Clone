import type { ReportStatus } from "../api/reports";

export const REPORT_STATUS_OPTIONS = [
  "pending",
  "verified",
  "resolved",
  "rejected",
] as const satisfies readonly ReportStatus[];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Chờ xử lý",
  verified: "Đã xác minh",
  resolved: "Đã xử lý",
  rejected: "Từ chối",
};

export function getReportStatusLabel(status: ReportStatus): string {
  return REPORT_STATUS_LABELS[status];
}

export function buildReportStatusPatchPayload(status: ReportStatus): {
  status: ReportStatus;
} {
  return { status };
}
