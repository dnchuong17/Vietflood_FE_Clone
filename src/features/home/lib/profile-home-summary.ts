import type { AuthIdentity } from "@/features/auth/lib/auth-storage";
import type { FloodReport } from "@/features/reports/api/reports";

export type ProfileHomeSummary = {
  greeting: string;
  openTasks: number;
  unreadAlerts: number;
};

const OPEN_REPORT_STATUSES = new Set(["pending", "verified", "in-progress"]);

function isOpenReport(report: FloodReport): boolean {
  return OPEN_REPORT_STATUSES.has(
    String(report.status ?? "").trim().toLowerCase(),
  );
}

export function buildProfileHomeSummary({
  identity,
  reports,
}: {
  identity: AuthIdentity | null;
  reports: FloodReport[];
}): ProfileHomeSummary {
  const displayName =
    identity?.displayName?.trim() || identity?.username?.trim() || "";

  return {
    greeting: displayName
      ? `Chào mừng trở lại, ${displayName}`
      : "Chào mừng trở lại",
    openTasks: reports.filter(isOpenReport).length,
    unreadAlerts: reports.filter(
      (report) => String(report.status ?? "").trim().toLowerCase() === "pending",
    ).length,
  };
}
