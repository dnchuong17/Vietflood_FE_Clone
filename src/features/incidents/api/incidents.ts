import {
  apiPath,
  apiRequest,
  parseJsonResponse,
} from "@/features/auth/lib/api-client";
import type { FloodReport } from "@/features/reports/api/reports";

export const STATUS_LABELS = {
  DETECTED: "Mới phát hiện",
  UNDER_REVIEW: "Đang xem xét",
  VERIFIED: "Đã xác minh",
  RESCUE_DEPLOYED: "Đã triển khai cứu trợ",
  RESOLVED: "Đã giải quyết",
} as const;
export const SEVERITY_LABELS = {
  UNKNOWN: "Chưa đánh giá",
  LOW: "Thấp",
  MODERATE: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Nghiêm trọng",
} as const;
export type IncidentStatus = keyof typeof STATUS_LABELS;
export type IncidentSeverity = keyof typeof SEVERITY_LABELS;
export type Page<T> = { items: T[]; nextCursor: string | null };
export type Incident = {
  id: string;
  title: string;
  province: string;
  ward: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  version: number;
  evidence_version: number;
  assignee_id: number | null;
  reportCount: number;
  isUrgent: boolean;
  needsVerification: boolean;
  first_reported_at: string;
  latest_reported_at: string;
  updated_at: string;
  merged_into: string | null;
};
export type Fact = {
  id: string;
  reportId: number;
  revision: number;
  kind: string;
  text: string;
  reportedAt: string;
  provenance: "verified" | "citizen_reported";
  value?: number | null;
  unit?: string | null;
};
export type Summary = {
  title: string;
  conditions: Fact[];
  updates: Fact[];
  depths: Fact[];
  suggestedSeverity: { value: IncidentSeverity; provenance: "estimate" };
  recommendations: {
    code: string;
    text: string;
    requiresHumanDecision: boolean;
  }[];
  generatedAt: string;
};
export type IncidentDetail = Incident & {
  summary: Summary | null;
  summaryStale: boolean;
  summaryJob: { status: string; failure_code: string | null } | null;
  facts: Fact[];
  blockedRoadReports: number;
  strandedPeopleReports: number;
  strandedVehicleReports: number;
};
export type ReportRevision = {
  revision: number;
  snapshot: FloodReport;
  createdAt: string;
};
export type SourceReport = {
  id: number;
  manual: boolean;
  archived_at: string | null;
  snapshot: FloodReport;
  originalSnapshot: FloodReport;
  revisionCount: number;
};
export type Emergency = {
  report_id: number;
  revision: number;
  incident_id: string | null;
  snapshot: FloodReport;
};
export type Review = {
  report_id: number;
  revision: number;
  reason: string;
  snapshot: FloodReport;
  candidates: {
    incidentId: string;
    version: number;
    title: string;
    score: number;
    distanceMeters: number;
  }[];
};
export type Overview = {
  totalReports: number;
  totalIncidents: number;
  highPriority: number;
  awaitingVerification: number;
  recentlyUpdated: number;
  pendingReviews: number;
  failedJobs: number;
  queuedJobs: number;
  oldestJobSeconds: number | null;
  mode: string;
  processingEnabled: boolean;
};
export type Audit = {
  id: number;
  actor_id: number | null;
  action: string;
  reason: string;
  created_at: string;
};
export type ProcessingJob = {
  id: string;
  status: string;
  failure_code: string | null;
  children: { status: string; count: number }[];
};
export type Assignee = { id: number; username: string };
export type Filters = {
  province?: string;
  ward?: string;
  from?: string;
  to?: string;
  severity?: string;
  status?: string;
  assignedToMe?: string;
  cursor?: string;
  limit?: number;
};

export function queryString(filters: Filters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `?${query}` : "";
}
export async function incidentGet<T>(
  path: string,
  filters: Filters = {},
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(
    () => controller.abort(new Error("Hết thời gian chờ dữ liệu sự cố.")),
    15000,
  );
  try {
    return await parseJsonResponse<T>(
      await apiRequest(apiPath(path) + queryString(filters), {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }),
      "Không thể tải dữ liệu sự cố.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export async function incidentChange<T>(
  path: string,
  body: unknown,
  method: "POST" | "PATCH" = "POST",
  key: string = crypto.randomUUID(),
): Promise<T> {
  return parseJsonResponse<T>(
    await apiRequest(apiPath(path), {
      method,
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(body),
    }),
    "Không thể cập nhật sự cố.",
  );
}
export function incidentDate(value: string | undefined) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "Chưa xác định";
}
export function dateBoundary(value: string, end = false) {
  return value
    ? new Date(
        `${value}T${end ? "23:59:59.999" : "00:00:00"}+07:00`,
      ).toISOString()
    : undefined;
}
