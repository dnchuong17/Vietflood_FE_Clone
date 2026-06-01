import {
  apiGet,
  apiPatch,
  apiPath,
  apiRequest,
  parseJsonResponse,
} from "@/features/auth/lib/api-client";
import type { UserRole } from "@/features/auth/lib/roles";
import { canManageReports } from "@/features/auth/lib/roles";
import { buildReportStatusPatchPayload } from "@/features/reports/lib/status";

export type ReportStatus = "pending" | "verified" | "resolved" | "rejected";

export type ReportUser = {
  id?: number;
  username?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export type ReportEvidence = {
  url?: string;
};

export type FloodReport = {
  id?: number;
  userId?: number;
  user_id?: number;
  user?: ReportUser | null;
  category?: string[] | string;
  description?: string;
  province?: string;
  ward?: string;
  addressLine?: string;
  address_line?: string;
  lat?: number | string;
  lng?: number | string;
  status?: ReportStatus | string;
  isUrgent?: boolean;
  is_urgent?: boolean;
  severity?: number | string;
  createdAt?: string;
  created_at?: string;
  evidences?: ReportEvidence[];
  images?: string[];
};

export type ReportFormValues = {
  categories: string[];
  description: string;
  province: string;
  ward: string;
  addressLine: string;
  lat: string;
  lng: string;
  severity: string;
  isUrgent: boolean;
  files?: FileList | null;
};

type BackendReportEnvelope = {
  report?: FloodReport;
  user?: ReportUser;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function normalizeCategory(category: FloodReport["category"]): string[] {
  const values = Array.isArray(category) ? category : category ? [category] : [];
  return Array.from(
    new Set(values.map((item) => String(item).trim()).filter(Boolean)),
  );
}

export function normalizeReport(report: FloodReport): FloodReport {
  return {
    ...report,
    category: normalizeCategory(report.category),
    addressLine: report.addressLine ?? report.address_line,
    userId: report.userId ?? report.user_id ?? report.user?.id,
    isUrgent: report.isUrgent ?? report.is_urgent ?? false,
    createdAt: report.createdAt ?? report.created_at,
    lat:
      typeof report.lat === "string" ? Number.parseFloat(report.lat) : report.lat,
    lng:
      typeof report.lng === "string" ? Number.parseFloat(report.lng) : report.lng,
    severity:
      typeof report.severity === "string"
        ? Number.parseInt(report.severity, 10)
        : report.severity,
  };
}

function normalizeReportList(data: unknown): FloodReport[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      ("report" in item || "user" in item)
    ) {
      const envelope = item as BackendReportEnvelope;
      return normalizeReport({
        ...(envelope.report ?? {}),
        user: envelope.user ?? envelope.report?.user,
      });
    }

    return normalizeReport(item as FloodReport);
  });
}

function normalizeReportDetail(data: unknown): FloodReport | null {
  if (Array.isArray(data)) {
    return normalizeReportList(data)[0] ?? null;
  }

  const record = asRecord(data);
  if (!record) {
    return null;
  }

  if ("data" in record) {
    return normalizeReportDetail(record.data);
  }

  if ("result" in record) {
    return normalizeReportDetail(record.result);
  }

  if ("report" in record || "user" in record) {
    const envelope = record as BackendReportEnvelope;
    return normalizeReport({
      ...(envelope.report ?? {}),
      user: envelope.user ?? envelope.report?.user,
    });
  }

  return normalizeReport(record as FloodReport);
}

function appendReportForm(formData: FormData, values: ReportFormValues) {
  const categories = values.categories.length > 0 ? values.categories : ["flood"];
  for (const category of categories) {
    formData.append("category", category);
  }
  if (categories.length === 1) {
    formData.append("category", categories[0]);
  }

  formData.append("description", values.description);
  formData.append("province", values.province);
  formData.append("ward", values.ward);
  formData.append("addressLine", values.addressLine);
  formData.append("lat", values.lat);
  formData.append("lng", values.lng);
  formData.append("severity", values.severity);
  formData.append("isUrgent", String(values.isUrgent));

  Array.from(values.files ?? []).forEach((file) => {
    formData.append("files", file);
  });
}

export async function listReports(role: UserRole): Promise<FloodReport[]> {
  const endpoint = canManageReports(role) ? "/reports" : "/reports/user";
  const response = await apiGet(apiPath(endpoint), {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJsonResponse<unknown>(
    response,
    "Không thể tải báo cáo.",
  );
  return normalizeReportList(data);
}

export async function getReportDetail(
  role: UserRole,
  reportId: number,
): Promise<FloodReport> {
  try {
    const response = await apiGet(apiPath(`/reports/${reportId}`), {
      credentials: "include",
      cache: "no-store",
    });
    const data = await parseJsonResponse<unknown>(
      response,
      "Không thể tải chi tiết báo cáo.",
    );
    const report = normalizeReportDetail(data);
    if (report?.id === reportId) {
      return report;
    }
  } catch {
    // Some backend deployments only expose list endpoints for role-scoped access.
  }

  const reports = await listReports(role);
  const report = reports.find((item) => item.id === reportId);
  if (!report) {
    throw new Error("Không tìm thấy báo cáo.");
  }

  return report;
}

export async function createReport(values: ReportFormValues): Promise<void> {
  const formData = new FormData();
  appendReportForm(formData, values);

  const response = await apiRequest(apiPath("/reports/create"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  await parseJsonResponse<unknown>(response, "Không thể tạo báo cáo.");
}

export async function updateReport(
  role: UserRole,
  report: FloodReport,
  values: ReportFormValues,
): Promise<void> {
  if (!report.id) {
    throw new Error("Thiếu mã báo cáo.");
  }

  const formData = new FormData();
  appendReportForm(formData, values);
  const ownerUserId = report.userId ?? report.user?.id;
  const endpoint =
    canManageReports(role) && ownerUserId
      ? `/reports/relief/${report.id}/user/${ownerUserId}`
      : `/reports/update/${report.id}`;

  const response = await apiRequest(apiPath(endpoint), {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  await parseJsonResponse<unknown>(response, "Không thể cập nhật báo cáo.");
}

export async function updateReportStatus(
  reportId: number,
  status: ReportStatus,
): Promise<void> {
  const response = await apiPatch(apiPath(`/reports/${reportId}/status`), {
    ...buildReportStatusPatchPayload(status),
  });
  await parseJsonResponse<unknown>(response, "Không thể cập nhật trạng thái báo cáo.");
}
