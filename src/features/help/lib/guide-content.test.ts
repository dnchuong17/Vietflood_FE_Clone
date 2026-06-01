import { describe, expect, it } from "vitest";

import { GUIDE_SECTIONS, ROLE_GUIDES, getGuideSectionTitles } from "./guide-content";

describe("web user guide content", () => {
  it("covers the mobile help guide sections in Vietnamese", () => {
    expect(getGuideSectionTitles()).toEqual([
      "Bản đồ thời tiết và ngập lụt",
      "Quản lý báo cáo",
      "Chi tiết báo cáo",
      "Điều hướng",
      "Hồ sơ và cài đặt",
      "Khuyến nghị phản hồi",
    ]);
  });

  it("keeps every guide section actionable", () => {
    expect(GUIDE_SECTIONS).toHaveLength(6);

    for (const section of GUIDE_SECTIONS) {
      expect(section.description.length).toBeGreaterThan(20);
      expect(section.points.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("documents only the supported web roles", () => {
    expect(ROLE_GUIDES.map((guide) => guide.role)).toEqual([
      "citizen",
      "relief",
      "admin",
    ]);
  });
});
