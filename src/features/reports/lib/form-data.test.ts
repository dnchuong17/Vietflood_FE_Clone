import { describe, expect, it } from "vitest";

import { buildReportFormData } from "./form-data";

function entriesOf(formData: FormData) {
  return Array.from(formData.entries()).map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
}

describe("report FormData builder", () => {
  it("submits both web and mobile coordinate aliases", () => {
    const formData = buildReportFormData({
      categories: ["flood"],
      description: "Flooded street",
      province: "Da Nang",
      ward: "Hai Chau",
      addressLine: "12 Bach Dang",
      lat: "16.0544",
      lng: "108.2022",
      severity: "4",
      isUrgent: true,
      files: null,
    });

    expect(entriesOf(formData)).toEqual(
      expect.arrayContaining([
        ["lat", "16.0544"],
        ["lng", "108.2022"],
        ["latitude", "16.0544"],
        ["longitude", "108.2022"],
      ]),
    );
  });

  it("omits stale GPS coordinates after manual location edits", () => {
    const formData = buildReportFormData({
      categories: ["flood"],
      description: "Flooded street",
      province: "Da Nang",
      ward: "Hai Chau",
      addressLine: "99 Tran Phu",
      lat: "16.0544",
      lng: "108.2022",
      severity: "4",
      isUrgent: true,
      isLocationManuallyEdited: true,
      files: null,
    });

    const keys = entriesOf(formData).map(([key]) => key);

    expect(keys).not.toContain("lat");
    expect(keys).not.toContain("lng");
    expect(keys).not.toContain("latitude");
    expect(keys).not.toContain("longitude");
  });
});
