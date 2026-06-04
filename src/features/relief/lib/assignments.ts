import type {
  FloodReport,
  ReportStatus,
} from "@/features/reports/api/reports";

export type AssignmentPriority = "urgent" | "high" | "medium" | "low";
export type AssignmentStatus = "assigned" | "in_progress" | "completed";

export type OperationalAssignment = {
  id: string;
  report: FloodReport;
  title: string;
  reporter: string;
  contact: string;
  location: string;
  priority: AssignmentPriority;
  priorityLabel: string;
  status: AssignmentStatus;
  statusLabel: string;
  progress: number;
  deadlineLabel: string;
  reassignStatus: ReportStatus | null;
  reassignActionLabel: string | null;
  nextStatus: ReportStatus | null;
  nextActionLabel: string | null;
};

export type AssignmentSummary = {
  total: number;
  assigned: number;
  inProgress: number;
  completed: number;
  urgent: number;
};

function normalizeStatus(status: FloodReport["status"]): ReportStatus {
  const value = String(status ?? "pending").toLowerCase();
  if (
    value === "pending" ||
    value === "verified" ||
    value === "resolved" ||
    value === "rejected"
  ) {
    return value;
  }

  return "pending";
}

function normalizeSeverity(severity: FloodReport["severity"]): number {
  if (typeof severity === "number" && Number.isFinite(severity)) {
    return severity;
  }

  if (typeof severity === "string") {
    const parsed = Number.parseInt(severity, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getAssignmentStatus(status: ReportStatus): AssignmentStatus {
  if (status === "verified") {
    return "in_progress";
  }

  if (status === "resolved" || status === "rejected") {
    return "completed";
  }

  return "assigned";
}

function getAssignmentPriority(report: FloodReport): AssignmentPriority {
  if (report.isUrgent || report.is_urgent) {
    return "urgent";
  }

  const severity = normalizeSeverity(report.severity);
  if (severity >= 4) {
    return "high";
  }

  if (severity >= 2) {
    return "medium";
  }

  return "low";
}

function getPriorityLabel(priority: AssignmentPriority): string {
  if (priority === "urgent") {
    return "Khẩn cấp";
  }

  if (priority === "high") {
    return "Cao";
  }

  if (priority === "medium") {
    return "Trung bình";
  }

  return "Thấp";
}

function getStatusLabel(status: AssignmentStatus): string {
  if (status === "in_progress") {
    return "Đang thực hiện";
  }

  if (status === "completed") {
    return "Hoàn thành";
  }

  return "Đã phân công";
}

function getProgress(status: AssignmentStatus): number {
  if (status === "completed") {
    return 100;
  }

  if (status === "in_progress") {
    return 50;
  }

  return 10;
}

function getDeadlineOffsetDays(priority: AssignmentPriority): number {
  if (priority === "urgent") {
    return 0;
  }

  if (priority === "high") {
    return 1;
  }

  if (priority === "medium") {
    return 2;
  }

  return 3;
}

function parseReportDate(report: FloodReport): Date | null {
  const rawDate = report.createdAt ?? report.created_at;
  if (!rawDate) {
    return null;
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function getDeadlineLabel(report: FloodReport, priority: AssignmentPriority): string {
  const baseDate = parseReportDate(report);
  if (!baseDate) {
    return "Hạn: chưa xác định";
  }

  const deadline = new Date(baseDate);
  deadline.setUTCDate(deadline.getUTCDate() + getDeadlineOffsetDays(priority));
  return `Hạn: ${formatDate(deadline)}`;
}

function getNextStep(status: AssignmentStatus): {
  nextStatus: ReportStatus | null;
  nextActionLabel: string | null;
} {
  if (status === "assigned") {
    return { nextStatus: "verified", nextActionLabel: "Nhận việc" };
  }

  if (status === "in_progress") {
    return { nextStatus: "resolved", nextActionLabel: "Hoàn tất" };
  }

  return { nextStatus: null, nextActionLabel: null };
}

function getReassignStep(status: AssignmentStatus): {
  reassignStatus: ReportStatus | null;
  reassignActionLabel: string | null;
} {
  if (status === "completed") {
    return { reassignStatus: null, reassignActionLabel: null };
  }

  return { reassignStatus: "pending", reassignActionLabel: "Phân công lại" };
}

function getTitle(report: FloodReport): string {
  const categories = Array.isArray(report.category)
    ? report.category
    : report.category
      ? [report.category]
      : [];

  return (
    report.description?.trim() ||
    categories.map(String).find((category) => category.trim()) ||
    `Báo cáo #${report.id ?? "-"}`
  );
}

function getReporter(report: FloodReport): string {
  return (
    report.user?.name?.trim() ||
    report.user?.username?.trim() ||
    (report.userId || report.user_id ? `User #${report.userId ?? report.user_id}` : "Chưa rõ")
  );
}

function getLocation(report: FloodReport): string {
  return (
    [report.addressLine ?? report.address_line, report.ward, report.province]
      .filter(Boolean)
      .join(", ") || "Chưa có vị trí"
  );
}

export function mapReportToAssignment(report: FloodReport): OperationalAssignment {
  const reportStatus = normalizeStatus(report.status);
  const status = getAssignmentStatus(reportStatus);
  const priority = getAssignmentPriority(report);
  const nextStep = getNextStep(status);
  const reassignStep = getReassignStep(status);

  return {
    id: String(
      report.id ??
        report.description ??
        report.createdAt ??
        report.created_at ??
        report.userId ??
        report.user_id ??
        "report",
    ),
    report,
    title: getTitle(report),
    reporter: getReporter(report),
    contact: report.user?.phone?.trim() || report.user?.email?.trim() || "-",
    location: getLocation(report),
    priority,
    priorityLabel: getPriorityLabel(priority),
    status,
    statusLabel: getStatusLabel(status),
    progress: getProgress(status),
    deadlineLabel: getDeadlineLabel(report, priority),
    ...reassignStep,
    ...nextStep,
  };
}

export function summarizeAssignments(
  assignments: OperationalAssignment[],
): AssignmentSummary {
  return {
    total: assignments.length,
    assigned: assignments.filter((assignment) => assignment.status === "assigned")
      .length,
    inProgress: assignments.filter(
      (assignment) => assignment.status === "in_progress",
    ).length,
    completed: assignments.filter(
      (assignment) => assignment.status === "completed",
    ).length,
    urgent: assignments.filter((assignment) => assignment.priority === "urgent")
      .length,
  };
}

export function filterOperationalAssignments(
  assignments: OperationalAssignment[],
): OperationalAssignment[] {
  return assignments.filter((assignment) => assignment.status !== "completed");
}
