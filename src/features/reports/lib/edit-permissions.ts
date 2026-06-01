import type { AuthIdentity } from "@/features/auth/lib/auth-storage";
import type { FloodReport } from "@/features/reports/api/reports";

const REPORT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const NOT_OWNER_MESSAGE =
  "Bạn chỉ có thể sửa báo cáo do tài khoản của mình tạo.";
const EXPIRED_MESSAGE = "Báo cáo chỉ được sửa trong 24 giờ sau khi tạo.";
const RESOLVED_MESSAGE = "Đã xử lý nên không thể sửa báo cáo.";

type ReportEditPermissionOptions = {
  assumeCurrentUserReport?: boolean;
  now?: Date;
};

function normalizeUsername(username: string | undefined): string | null {
  const normalized = username?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function getReportCreatedTime(report: FloodReport): number | null {
  const createdAt = report.createdAt ?? report.created_at;
  if (!createdAt) {
    return null;
  }

  const createdTime = new Date(createdAt).getTime();
  return Number.isFinite(createdTime) ? createdTime : null;
}

export function isReportResolved(report: FloodReport): boolean {
  return String(report.status ?? "").trim().toLowerCase() === "resolved";
}

export function isReportOwner(
  report: FloodReport,
  identity: AuthIdentity | null,
  options: Pick<ReportEditPermissionOptions, "assumeCurrentUserReport"> = {},
): boolean {
  const reportUsername = normalizeUsername(report.user?.username);
  const currentUsername = normalizeUsername(identity?.username);

  if (reportUsername && currentUsername) {
    return reportUsername === currentUsername;
  }

  return Boolean(options.assumeCurrentUserReport && currentUsername);
}

export function isReportWithinEditWindow(
  report: FloodReport,
  now = new Date(),
): boolean {
  const createdTime = getReportCreatedTime(report);
  if (createdTime === null) {
    return false;
  }

  const age = now.getTime() - createdTime;
  return age >= 0 && age <= REPORT_EDIT_WINDOW_MS;
}

export function canEditReport(
  report: FloodReport,
  identity: AuthIdentity | null,
  options: ReportEditPermissionOptions = {},
): boolean {
  return (
    isReportOwner(report, identity, options) &&
    !isReportResolved(report) &&
    isReportWithinEditWindow(report, options.now)
  );
}

export function getReportEditRestrictionReason(
  report: FloodReport,
  identity: AuthIdentity | null,
  options: ReportEditPermissionOptions = {},
): string | null {
  if (!isReportOwner(report, identity, options)) {
    return NOT_OWNER_MESSAGE;
  }

  if (isReportResolved(report)) {
    return RESOLVED_MESSAGE;
  }

  if (!isReportWithinEditWindow(report, options.now)) {
    return EXPIRED_MESSAGE;
  }

  return null;
}
