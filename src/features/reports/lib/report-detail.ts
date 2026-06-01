import type {
  FloodReport,
  ReportStatus,
} from "@/features/reports/api/reports";

import { REPORT_STATUS_OPTIONS } from "./status";

export type ReportCoordinate = {
  latitude: number;
  longitude: number;
};

export type ReportReporter = {
  name: string;
  contact: string;
};

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function hasValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function normalizeReportStatus(status: FloodReport["status"]): ReportStatus {
  const value = String(status ?? "pending").toLowerCase();
  return REPORT_STATUS_OPTIONS.includes(value as ReportStatus)
    ? (value as ReportStatus)
    : "pending";
}

export function getReportCoordinates(
  report: FloodReport,
): ReportCoordinate | null {
  const latitude = toOptionalNumber(report.lat);
  const longitude = toOptionalNumber(report.lng);

  if (
    latitude === undefined ||
    longitude === undefined ||
    !hasValidCoordinate(latitude, longitude)
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function getReportImageUrls(report: FloodReport): string[] {
  const urls = [
    ...(report.images ?? []),
    ...(report.evidences ?? []).map((evidence) => evidence.url),
  ];

  return Array.from(
    new Set(
      urls
        .map((url) => url?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  );
}

export function buildReportAddress(report: FloodReport): string {
  return [report.addressLine ?? report.address_line, report.ward, report.province]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function getReportReporter(report: FloodReport): ReportReporter {
  const name =
    report.user?.name?.trim() ||
    report.user?.username?.trim() ||
    (report.userId || report.user_id ? `User #${report.userId ?? report.user_id}` : "-");

  const contact =
    report.user?.phone?.trim() || report.user?.email?.trim() || "-";

  return { name, contact };
}

export function getReportTitle(report: FloodReport): string {
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

export function formatReportDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
