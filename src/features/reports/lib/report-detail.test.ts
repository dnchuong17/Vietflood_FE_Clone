import { describe, expect, it } from "vitest";

import {
  buildReportAddress,
  getReportCoordinates,
  getReportImageUrls,
  getReportReporter,
} from "./report-detail";

describe("report detail helpers", () => {
  it("normalizes report coordinates from backend string and number fields", () => {
    expect(getReportCoordinates({ lat: "10.7769", lng: 106.7009 })).toEqual({
      latitude: 10.7769,
      longitude: 106.7009,
    });
  });

  it("rejects missing or out-of-range coordinates", () => {
    expect(getReportCoordinates({ lat: 91, lng: 106.7009 })).toBeNull();
    expect(getReportCoordinates({ lat: 10.7769 })).toBeNull();
  });

  it("combines image arrays and evidence URLs without duplicates", () => {
    expect(
      getReportImageUrls({
        images: ["https://cdn.test/a.jpg", "https://cdn.test/a.jpg", ""],
        evidences: [{ url: "https://cdn.test/b.jpg" }, { url: " " }],
      }),
    ).toEqual(["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"]);
  });

  it("builds mobile-style address and reporter text", () => {
    expect(
      buildReportAddress({
        addressLine: "12 Nguyen Hue",
        ward: "Ben Nghe",
        province: "TP.HCM",
      }),
    ).toBe("12 Nguyen Hue, Ben Nghe, TP.HCM");

    expect(
      getReportReporter({
        user: { name: "Tran An", phone: "0900000000" },
        userId: 42,
      }),
    ).toEqual({ name: "Tran An", contact: "0900000000" });
  });
});
