import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-workspace.tsx", import.meta.url), "utf8");

describe("report workspace UI", () => {
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
    expect(source).toContain("@/features/location/api/vietnam-divisions");
    expect(source).toContain("searchProvinces(values.province)");
    expect(source).toContain("searchWards(selectedProvinceCode, values.ward)");
    expect(source).toContain("@/features/reports/lib/address-suggestions");
    expect(source).not.toContain('formData.append("district"');
  });

  it("shows selected province and ward state in the location picker", () => {
    expect(source).toContain('data-location-step="province"');
    expect(source).toContain('data-location-step="ward"');
    expect(source).toContain("Chọn tỉnh/thành phố trước");
    expect(source).toContain("visibleProvinceOptions");
    expect(source).toContain("visibleWardOptions");
    expect(source).toContain('data-location-summary="selected"');
    expect(source).toContain("selectedLocationParts");
    expect(source).toContain("Tỉnh/Thành phố đã chọn");
    expect(source).toContain("Phường/Xã đã chọn");
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
