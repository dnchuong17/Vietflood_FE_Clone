import type { ReportStatus } from "../api/reports";

export const REPORT_STATUS_OPTIONS = [
  "pending",
  "verified",
  "resolved",
  "rejected",
] as const satisfies readonly ReportStatus[];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  resolved: "Resolved",
  rejected: "Rejected",
};

export function getReportStatusLabel(status: ReportStatus): string {
  return REPORT_STATUS_LABELS[status];
}

export function buildReportStatusPatchPayload(status: ReportStatus): {
  status: ReportStatus;
} {
  return { status };
}
