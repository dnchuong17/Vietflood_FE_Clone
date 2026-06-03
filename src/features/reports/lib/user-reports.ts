import type { FloodReport } from "../api/reports";

export function filterReportsByUserId(
  reports: FloodReport[],
  userId: number | null | undefined,
): FloodReport[] {
  if (!userId) {
    return [];
  }

  return reports.filter((report) => {
    const reportUserId = report.userId ?? report.user_id ?? report.user?.id;
    return reportUserId === userId;
  });
}
