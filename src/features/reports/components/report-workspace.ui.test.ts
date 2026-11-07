import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-workspace.tsx", import.meta.url), "utf8");

describe("report workspace UI", () => {
  it("prioritizes report location before narrative and preserves a readable narrow layout", () => {
    const cards = source.slice(source.indexOf("filteredReports.map"));
    expect(cards.indexOf("addressText(report)")).toBeLessThan(cards.indexOf('report.description || "Chưa có mô tả."'));
    expect(cards).toContain("min-w-0 break-words");
    expect(cards).toContain("formatReportDateTime(report.createdAt ?? report.created_at)");
    expect(cards).toContain('report.isUrgent ? <Badge variant="critical">Khẩn cấp</Badge>');
    expect(source).toContain('<fieldset className="min-w-0">');
    expect(source).toMatch(/<legend[^>]*>[\s\S]*?Loại báo cáo[\s\S]*?<\/legend>/);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate-");
  });

  it("uses shared shadcn primitives for filters, forms, and actions", () => {
    expect(source).toContain("@/components/ui/button");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/select");
    expect(source).toContain("@/components/ui/field");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("@/components/ui/card");
  });

  it("links report cards to the mobile-like detail screen", () => {
    expect(source).toContain("next/link");
    expect(source).toContain("href={`/bao-cao/${report.id}`}");
    expect(source).toContain("Chi tiết");
  });

  it("wires v2 province and ward suggestions into the report form", () => {
    expect(source).toContain("@/features/location/components/vietnam-address-picker");
    expect(source).toContain("<VietnamAddressPicker");
    expect(source).toContain("requiredProvince");
    expect(source).toContain("@/features/reports/lib/address-suggestions");
    expect(source).not.toContain('formData.append("district"');
  });

  it("shows selected province and ward state in the location picker", () => {
    expect(source).toContain('idPrefix="report"');
    expect(source).toContain("value={{ province: values.province, ward: values.ward }}");
    expect(source).toContain("onChange={updateAddress}");
    expect(source).not.toContain("visibleProvinceOptions");
    expect(source).not.toContain("visibleWardOptions");
    expect(source).toContain('data-location-summary="selected"');
    expect(source).toContain("selectedLocationParts");
    expect(source).toContain('key={`edit-report-${editingReport.id}`}');
  });

  it("tracks manual location edits while keeping GPS coordinates internal", () => {
    expect(source).toContain("isLocationManuallyEdited: true");
    expect(source).toContain("isLocationManuallyEdited: false");
    expect(source).toContain("setManualLocationField(\"addressLine\"");
    expect(source).toContain("lat: String(position.coords.latitude)");
    expect(source).toContain("lng: String(position.coords.longitude)");
  });

  it("uses backend geocoding for GPS prefill and edited-address submit fallback", () => {
    expect(source).toContain("@/features/location/api/geocoding");
    expect(source).toContain("reverseGeocodeLocation");
    expect(source).toContain("geocodeReportLocation");
    expect(source).toContain("@/components/feedback/confirm-dialog");
    expect(source).toContain("ConfirmDialog");
    expect(source).toContain("pendingCoordinatesFallback");
    expect(source).toContain("resolveReportLocationBeforeSubmit");
    expect(source).toContain("OpenStreetMap");
  });

  it("does not expose severity, urgency, latitude, or longitude as user inputs", () => {
    expect(source).not.toContain('id="report-severity"');
    expect(source).not.toContain("Báo cáo khẩn cấp");
    expect(source).not.toContain("Vĩ độ");
    expect(source).not.toContain("Kinh độ");
    expect(source).not.toContain("setField(\"isUrgent\"");
    expect(source).not.toContain("setCoordinateField");
  });

  it("shows mobile-like report overview counts and sync state", () => {
    expect(source).toContain("@/features/reports/lib/overview");
    expect(source).toContain("buildReportsOverviewSummary");
    expect(source).toContain("formatReportsLastSyncedAt");
    expect(source).toContain("lastSyncedAt");
    expect(source).toContain("setLastSyncedAt");
    expect(source).toContain("Tổng báo cáo");
    expect(source).toContain("Đang hiển thị");
    expect(source).toContain("Khẩn cấp");
    expect(source).toContain("Đồng bộ");
  });
});
