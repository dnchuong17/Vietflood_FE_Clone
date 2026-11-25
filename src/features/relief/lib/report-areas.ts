import type { FloodReport } from "@/features/reports/api/reports";
import { normalizeVietnamDivision } from "@/features/location/lib/vietnam-address";
import { deduplicateReports, reportStatus } from "./report-analysis";

export type ReportArea = {
  key: string;
  label: string;
  province: string;
  ward?: string;
  total: number;
  open: number;
  reports: FloodReport[];
};
export type ReportAreas = {
  provinces: ReportArea[];
  wards: ReportArea[];
  unknownProvince: number;
  unknownWard: number;
};

/** Administrative rollups, NOT physical locations or duplicate incidents. */
export function groupReportAreas(input: FloodReport[]): ReportAreas {
  const provinces = new Map<string, ReportArea>();
  const wards = new Map<string, ReportArea>();
  let unknownProvince = 0;
  let unknownWard = 0;
  for (const report of deduplicateReports(input).reports) {
    const province = normalizeVietnamDivision(report.province ?? "");
    const ward = normalizeVietnamDivision(report.ward ?? "");
    if (!province) unknownProvince++;
    if (!province || !ward) unknownWard++;
    if (!province) continue;
    const groups: [Map<string, ReportArea>, string, string, string | undefined][] = [
      [provinces, JSON.stringify(["province", province]), report.province!.trim(), undefined],
    ];
    if (ward) groups.push([wards, JSON.stringify(["ward", province, ward]),
      `${report.ward!.trim()}, ${report.province!.trim()}`, report.ward!.trim()]);
    for (const [map, key, label, storedWard] of groups) {
      const group = map.get(key) ?? { key, label, province: report.province!.trim(), ward: storedWard,
        total: 0, open: 0, reports: [] };
      group.total++;
      const status = reportStatus(report);
      group.open += Number(status === "pending" || status === "verified");
      group.reports.push(report);
      map.set(key, group);
    }
  }
  const ranked = (map: Map<string, ReportArea>) => [...map.values()].sort((a, b) =>
    b.total - a.total || b.open - a.open || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return { provinces: ranked(provinces), wards: ranked(wards), unknownProvince, unknownWard };
}
