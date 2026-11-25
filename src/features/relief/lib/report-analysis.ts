import type { FloodReport, ReportStatus } from "@/features/reports/api/reports";
import { normalizeVietnamDivision } from "@/features/location/lib/vietnam-address";
import { reportCreatedTime } from "./report-filters";

export type LocationGroup = {
  key: string;
  label: string;
  precision: "address" | "gps";
  reports: FloodReport[];
  open: number;
};
export type DuplicateCandidate = {
  key: string;
  reportIds: number[];
  locationLabel: string;
  reason: string;
};
export type ReportAnalysis = {
  total: number;
  open: number;
  statuses: Record<ReportStatus | "unknown", number>;
  locations: LocationGroup[];
  unknownLocationReports: number;
  provinces: { key: string; label: string; total: number }[];
  days: { date: string; total: number }[];
  undated: number;
  duplicateCandidates: DuplicateCandidate[];
};
export type DeduplicatedReports = {
  reports: FloodReport[];
  duplicateRows: number;
  conflictingIds: number;
};

function validId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

// Compare the full payload, independent of object property insertion order.
function equalPayload(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const left = Object.keys(a).sort();
  const right = Object.keys(b).sort();
  return left.length === right.length && left.every((key, index) =>
    key === right[index] && equalPayload(
      (a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key],
    ));
}

/** First occurrence wins. The API has no updated timestamp: this is NOT a freshness claim. */
export function deduplicateReports(input: FloodReport[]): DeduplicatedReports {
  const canonical = new Map<number, FloodReport>();
  const conflicts = new Set<number>();
  const reports: FloodReport[] = [];
  let duplicateRows = 0;
  for (const report of input) {
    if (!validId(report.id)) {
      reports.push(report);
      continue;
    }
    const first = canonical.get(report.id);
    if (first) {
      duplicateRows++;
      if (!equalPayload(first, report)) conflicts.add(report.id);
    } else {
      canonical.set(report.id, report);
      reports.push(report);
    }
  }
  return { reports, duplicateRows, conflictingIds: conflicts.size };
}

function fold(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
}

export function reportStatus(report: FloodReport): ReportStatus | "unknown" {
  // Match the legacy list/filter default for an absent status, without treating
  // an explicit empty or unrecognized status as confirmed pending work.
  const status = fold(report.status ?? "pending");
  return status === "pending" || status === "verified" || status === "resolved" || status === "rejected"
    ? status : "unknown";
}
function open(report: FloodReport): boolean {
  const status = reportStatus(report);
  return status === "pending" || status === "verified";
}
function coordinate(value: unknown, limit: number): number | null {
  // Number() alone accepts blank strings and hex; parseFloat accepts trailing text.
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}
function location(report: FloodReport): Pick<LocationGroup, "key" | "label" | "precision"> | null {
  const province = normalizeVietnamDivision(report.province ?? "");
  const ward = normalizeVietnamDivision(report.ward ?? "");
  const street = report.addressLine ?? report.address_line ?? "";
  if (province && ward && fold(street)) {
    return {
      key: JSON.stringify(["address", province, ward, fold(street)]),
      label: [street, report.ward, report.province].join(", "),
      precision: "address",
    };
  }
  const lat = coordinate(report.lat ?? report.latitude, 90);
  const lng = coordinate(report.lng ?? report.longitude, 180);
  return lat === null || lng === null ? null : {
    key: JSON.stringify(["gps", lat, lng]), label: `${lat}, ${lng}`, precision: "gps",
  };
}
function reporter(report: FloodReport): string | null {
  const id = report.userId ?? report.user_id ?? report.user?.id;
  if (validId(id)) return JSON.stringify(["id", id]);
  const username = report.user?.username?.normalize("NFC").trim();
  return username ? JSON.stringify(["username", username]) : null;
}
function categorySet(report: FloodReport): string[] {
  const values = Array.isArray(report.category) ? report.category : report.category ? [report.category] : [];
  return [...new Set(values.map(value => value.normalize("NFC").trim()).filter(Boolean))].sort();
}
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function candidates(locations: LocationGroup[]): DuplicateCandidate[] {
  const result: DuplicateCandidate[] = [];
  for (const group of locations) {
    const buckets = new Map<string, { id: number; time: number }[]>();
    for (const report of group.reports) {
      const description = fold(report.description ?? "");
      const user = reporter(report);
      const time = reportCreatedTime(report);
      if (!validId(report.id) || !user || time === null || description.length < 12) continue;
      const key = JSON.stringify([group.key, description, user, categorySet(report)]);
      const bucket = buckets.get(key) ?? [];
      bucket.push({ id: report.id, time });
      buckets.set(key, bucket);
    }
    for (const [key, bucket] of [...buckets].sort(([a], [b]) => compare(a, b))) {
      bucket.sort((a, b) => a.time - b.time || a.id - b.id);
      // Anchored windows avoid chaining 00:00 -> 00:50 -> 01:40 into one cluster.
      let index = 0;
      while (index < bucket.length) {
        const anchor = bucket[index];
        const ids = new Set<number>();
        let end = index;
        while (end < bucket.length && bucket[end].time - anchor.time <= 3_600_000) {
          ids.add(bucket[end].id);
          end++;
        }
        if (ids.size >= 2) result.push({
          key: JSON.stringify([key, anchor.time, anchor.id]), reportIds: [...ids],
          locationLabel: group.label,
          reason: "Cùng địa điểm, nội dung, người gửi và nhóm phân loại trong 1 giờ; chỉ gợi ý kiểm tra, không tự gộp.",
        });
        index = end;
      }
    }
  }
  return result.sort((a, b) => compare(a.key, b.key));
}

/**
 * Input is already ID-deduplicated. Distinct IDs always remain in every total.
 * Conservative exact grouping cannot guarantee physical-world deduplication when
 * addresses/GPS are missing or inconsistent. Candidate matches are advisory only.
 */
export function analyzeReports(reports: FloodReport[]): ReportAnalysis {
  const analysis: ReportAnalysis = {
    total: reports.length, open: 0,
    statuses: { pending: 0, verified: 0, resolved: 0, rejected: 0, unknown: 0 },
    locations: [], unknownLocationReports: 0, provinces: [], days: [], undated: 0,
    duplicateCandidates: [],
  };
  const locations = new Map<string, LocationGroup>();
  const provinces = new Map<string, ReportAnalysis["provinces"][number]>();
  const days = new Map<string, ReportAnalysis["days"][number]>();
  for (const report of reports) {
    const isOpen = Number(open(report));
    analysis.open += isOpen;
    analysis.statuses[reportStatus(report)]++;
    const place = location(report);
    if (place) {
      const group = locations.get(place.key) ?? { ...place, reports: [], open: 0 };
      group.reports.push(report);
      group.open += isOpen;
      locations.set(place.key, group);
    } else analysis.unknownLocationReports++;
    const provinceKey = normalizeVietnamDivision(report.province ?? "");
    const province = provinces.get(provinceKey) ?? {
      key: provinceKey, label: provinceKey ? report.province! : "Chưa rõ tỉnh/thành", total: 0,
    };
    province.total++;
    provinces.set(provinceKey, province);
    const time = reportCreatedTime(report);
    const vietnamTime = time === null ? NaN : time + 7 * 60 * 60 * 1000;
    const dateValue = new Date(vietnamTime);
    if (Number.isFinite(dateValue.getTime())) {
      const date = dateValue.toISOString().slice(0, 10);
      const day = days.get(date) ?? { date, total: 0 };
      day.total++;
      days.set(date, day);
    } else analysis.undated++;
  }
  analysis.locations = [...locations.values()].sort((a, b) => compare(a.key, b.key));
  analysis.provinces = [...provinces.values()].sort((a, b) => compare(a.key, b.key));
  analysis.days = [...days.values()].sort((a, b) => compare(a.date, b.date));
  analysis.duplicateCandidates = candidates(analysis.locations);
  return analysis;
}
