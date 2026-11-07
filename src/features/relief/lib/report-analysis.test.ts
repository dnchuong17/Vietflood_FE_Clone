import { describe, expect, it } from "vitest";
import type { FloodReport } from "@/features/reports/api/reports";
import { analyzeReports, deduplicateReports, reportStatus } from "./report-analysis";

const make = (id: number, extra: Partial<FloodReport> = {}): FloodReport => ({
  id, province: "Tỉnh Quảng Trị", ward: "Phường Đông Hà", addressLine: "12/3 Lê Lợi",
  description: "Cần hỗ trợ lương thực ngay.", category: ["food", "water"], userId: 7,
  status: "pending", createdAt: "2026-11-01T00:00:00Z", ...extra,
});
const ids = (reports: FloodReport[]) => reports.map(report => report.id);
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe("deduplicateReports", () => {
  it("keeps the first row, counts duplicate rows and distinct conflicting IDs", () => {
    const first = make(1);
    const other = make(2);
    const result = deduplicateReports([
      first, { ...first }, { ...first, status: "resolved" }, { ...first, description: "changed" },
      other, { ...other, user: { username: "changed" } },
    ]);
    expect(result).toEqual({ reports: [first, other], duplicateRows: 4, conflictingIds: 2 });
    expect(result.reports[0]).toBe(first);
    expect(first.status).toBe("pending");
  });
  it("compares nested payloads without depending on object key order", () => {
    const a = make(1, { user: { id: 7, username: "a" } });
    expect(deduplicateReports([a, { ...a, user: { username: "a", id: 7 } }]).conflictingIds).toBe(0);
    expect(deduplicateReports([a, { ...a, category: ["water", "food"] }]).conflictingIds).toBe(1);
  });
  it("preserves every anonymous, nonnumeric, nonfinite, zero, negative and fractional ID", () => {
    const invalid = [undefined, 0, -1, 1.5, NaN, Infinity, -Infinity, "1", null];
    const rows = invalid.flatMap(id => [{ id }, { id }]) as FloodReport[];
    expect(deduplicateReports(rows)).toEqual({ reports: rows, duplicateRows: 0, conflictingIds: 0 });
  });
  it("does not conflate distinct IDs or mutate frozen input", () => {
    const rows = freeze([make(1), make(2), make(1)]);
    expect(ids(deduplicateReports(rows).reports)).toEqual([1, 2]);
    expect(rows).toHaveLength(3);
  });
  it("handles empty input", () => {
    expect(deduplicateReports([])).toEqual({ reports: [], duplicateRows: 0, conflictingIds: 0 });
  });
});

describe("exact locations and province rollups", () => {
  it("canonicalizes division aliases and NFC/case/whitespace street variants", () => {
    const first = make(1, { province: "TP. HCM", ward: "Phường Bến Nghé" });
    const second = make(2, { province: "Thành phố Hồ Chí Minh", ward: "BEN NGHE", addressLine: "  12/3   LÊ LỢI ".normalize("NFD") });
    const result = analyzeReports([first, second]);
    expect(result.total).toBe(2);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ precision: "address", reports: [first, second], open: 2 });
    expect(result.locations[0].label).toBe("12/3 Lê Lợi, Phường Bến Nghé, TP. HCM");
    expect(result.provinces).toEqual([{ key: "ho chi minh", label: "TP. HCM", total: 2, urgent: 0 }]);
  });
  it("preserves house numbers, slash, hyphen, punctuation and street accents", () => {
    const streets = ["12/3 Lê Lợi", "123 Lê Lợi", "12-3 Lê Lợi", "12/3 Le Loi", "12/3 Lê Lợi.", "13/3 Lê Lợi"];
    expect(analyzeReports(streets.map((addressLine, i) => make(i + 1, { addressLine }))).locations).toHaveLength(streets.length);
  });
  it("keeps same street in different provinces/wards separate", () => {
    const rows = [make(1), make(2, { ward: "Phường khác" }), make(3, { province: "Tỉnh khác" })];
    expect(analyzeReports(rows).locations).toHaveLength(3);
  });
  it("prefers a complete address over matching GPS", () => {
    const result = analyzeReports([make(1, { lat: 0, lng: 0 }), make(2, { addressLine: "", lat: 0, lng: 0 })]);
    expect(result.locations.map(group => group.precision).sort()).toEqual(["address", "gps"]);
  });
  it("supports snake-case address and coordinate aliases and valid zero/boundary GPS", () => {
    const rows = [
      make(1, { addressLine: undefined, address_line: "" , latitude: " 0 ", longitude: "-0" }),
      make(2, { province: "", lat: 0, lng: 0 }),
      make(3, { ward: "", lat: "90", lng: "-180" }),
      make(4, { ward: "", lat: -90, lng: 180 }),
    ];
    const result = analyzeReports(rows);
    expect(result.locations).toHaveLength(3);
    expect(result.locations.find(group => group.label === "0, 0")?.reports).toHaveLength(2);
    expect(result.unknownLocationReports).toBe(0);
    expect(analyzeReports([make(5, { addressLine: undefined, address_line: "10 Main" })]).locations[0].precision).toBe("address");
  });
  it.each(["", " ", "10abc", "0x10", "Infinity", "NaN", "1,2", 90.0001, -90.0001, Infinity, NaN])("rejects invalid latitude %s rather than partial parsing", lat => {
    expect(analyzeReports([make(1, { addressLine: "", lat, lng: 0 })]).unknownLocationReports).toBe(1);
  });
  it("rejects invalid longitude, missing pairs and never rounds GPS jitter", () => {
    const bad = [make(1, { addressLine: "", lat: 0, lng: 180.1 }), make(2, { addressLine: "", lat: 0 }), make(3, { addressLine: "", lat: 0, lng: "0 trailing" })];
    expect(analyzeReports(bad).unknownLocationReports).toBe(3);
    const exact = analyzeReports([make(4, { addressLine: "", lat: 10, lng: 20 }), make(5, { addressLine: "", lat: 10.000001, lng: 20 })]);
    expect(exact.locations).toHaveLength(2);
  });
  it("does not invent locations from only province, ward or street", () => {
    const rows: FloodReport[] = [{ province: "Hà Nội" }, { ward: "Đông Hà" }, { addressLine: "10 Main" }, {}];
    const result = analyzeReports(rows);
    expect(result.locations).toEqual([]);
    expect(result.unknownLocationReports).toBe(4);
    expect(result.provinces.find(province => province.key === "")).toEqual({ key: "", label: "Chưa rõ tỉnh/thành", total: 3, urgent: 0 });
  });
});

describe("analysis counters and dates", () => {
  it("counts every status and only boolean true urgency with nullish alias precedence", () => {
    const rows = [
      make(1, { status: " pending ", isUrgent: true }), make(2, { status: "VERIFIED", is_urgent: true }),
      make(3, { status: "resolved", isUrgent: false, is_urgent: true }), make(4, { status: "rejected" }),
      make(5, { status: undefined }), make(6, { status: "future", isUrgent: "true" as unknown as boolean }),
    ];
    const result = analyzeReports(rows);
    expect(result).toMatchObject({ total: 6, urgent: 2, open: 3, statuses: { pending: 2, verified: 1, resolved: 1, rejected: 1, unknown: 1 } });
    expect(result.locations[0]).toMatchObject({ urgent: 2, open: 3 });
    expect(result.provinces[0]).toMatchObject({ total: 6, urgent: 2 });
    expect(reportStatus({ status: "" })).toBe("unknown");
    expect(reportStatus({})).toBe("pending");
  });
  it("uses Vietnam UTC+7 midnight boundaries, aliases, ascending days and no gap fill", () => {
    const result = analyzeReports([
      make(1, { createdAt: "2026-11-03T17:00:00Z", isUrgent: true }),
      make(2, { createdAt: "2026-11-01T16:59:59.999Z" }),
      make(3, { createdAt: undefined, created_at: "2026-11-01T17:00:00Z", is_urgent: true }),
      make(4, { createdAt: "2026-11-02T00:00:00+07:00" }),
      make(5, { createdAt: "invalid" }), make(6, { createdAt: undefined }), make(7, { createdAt: "" }),
    ]);
    expect(result.days).toEqual([
      { date: "2026-11-01", total: 1, urgent: 0 }, { date: "2026-11-02", total: 2, urgent: 1 },
      { date: "2026-11-04", total: 1, urgent: 1 },
    ]);
    expect(result.undated).toBe(3);
  });
  it("returns empty, fully numeric counters", () => {
    expect(analyzeReports([])).toEqual({ total: 0, urgent: 0, open: 0, statuses: { pending: 0, verified: 0, resolved: 0, rejected: 0, unknown: 0 }, locations: [], unknownLocationReports: 0, provinces: [], days: [], undated: 0, duplicateCandidates: [] });
  });
});

describe("advisory duplicate candidates", () => {
  it("matches normalized descriptions and identical category sets without removing distinct IDs", () => {
    const first = make(1);
    const second = make(2, { description: "  CẦN   HỖ TRỢ LƯƠNG THỰC NGAY. ".normalize("NFD"), category: ["water", "food", "food"], isUrgent: true });
    const result = analyzeReports([first, second]);
    expect(result.duplicateCandidates).toHaveLength(1);
    expect(result.duplicateCandidates[0]).toMatchObject({ reportIds: [1, 2], locationLabel: result.locations[0].label });
    expect(result.duplicateCandidates[0].reason).toContain("không tự gộp");
    expect(result.total).toBe(2);
    expect(result.open).toBe(2);
    expect(result.urgent).toBe(1);
    expect(result.locations[0].reports).toEqual([first, second]);
    expect(result.days[0].total).toBe(2);
    expect(result.provinces[0].total).toBe(2);
  });
  it("anchors inclusive one-hour windows and avoids transitive chains", () => {
    const rows = [0, 50, 60, 100, 160, 161].map((minute, i) => make(i + 1, { createdAt: new Date(Date.parse("2026-11-01T00:00:00Z") + minute * 60_000).toISOString() }));
    expect(analyzeReports(rows).duplicateCandidates.map(candidate => candidate.reportIds)).toEqual([[1, 2, 3], [4, 5]]);
  });
  it.each<Partial<FloodReport>>([
    { userId: 8 }, { category: ["food"] }, { description: "Cần hỗ trợ lương thực ngay!" },
    { description: "Can ho tro luong thuc ngay." }, { description: "short" },
    { userId: undefined }, { createdAt: undefined }, { createdAt: "bad" },
    { createdAt: "2026-11-01T01:00:00.001Z" }, { province: "Tỉnh khác" },
    { id: undefined }, { id: 0 },
  ])("does not suggest unsafe matches with %j", change => {
    expect(analyzeReports([make(1), make(2, change)]).duplicateCandidates).toEqual([]);
  });
  it("requires known locations even when everything else matches", () => {
    expect(analyzeReports([make(1, { ward: "" }), make(2, { ward: "" })]).duplicateCandidates).toEqual([]);
  });
  it("supports nested IDs, snake-case IDs and username fallback but never display-name identity", () => {
    const rows = [make(1, { userId: undefined, user_id: 7 }), make(2, { userId: undefined, user: { id: 7 } })];
    expect(analyzeReports(rows).duplicateCandidates[0].reportIds).toEqual([1, 2]);
    const usernames = [make(3, { userId: undefined, user: { username: " caller " } }), make(4, { userId: undefined, user: { username: "caller" } })];
    expect(analyzeReports(usernames).duplicateCandidates[0].reportIds).toEqual([3, 4]);
    expect(analyzeReports([usernames[0], make(5, { userId: undefined, user: { username: "other", name: "caller" } })]).duplicateCandidates).toEqual([]);
    expect(analyzeReports([make(6, { userId: undefined, user: { name: "caller" } }), make(7, { userId: undefined, user: { name: "caller" } })]).duplicateCandidates).toEqual([]);
  });
  it("never treats repeated ID as a distinct candidate, nor silently deduplicates analysis input", () => {
    const result = analyzeReports([make(1), make(1)]);
    expect(result.duplicateCandidates).toEqual([]);
    expect(result.total).toBe(2);
  });
  it("is immutable and sorts locations, provinces, days and candidate IDs deterministically", () => {
    const rows = freeze([make(3), make(2), make(1), make(4, { province: "Hà Nội", createdAt: "2026-10-31T00:00:00Z" })]);
    const before = JSON.stringify(rows);
    const result = analyzeReports(rows);
    expect(result.duplicateCandidates[0].reportIds).toEqual([1, 2, 3]);
    expect(result.locations.map(item => item.key)).toEqual(result.locations.map(item => item.key).sort());
    expect(result.provinces.map(item => item.key)).toEqual(result.provinces.map(item => item.key).sort());
    expect(result.days.map(item => item.date)).toEqual(["2026-10-31", "2026-11-01"]);
    expect(analyzeReports([...rows].reverse()).duplicateCandidates).toEqual(result.duplicateCandidates);
    expect(JSON.stringify(rows)).toBe(before);
  });
});
