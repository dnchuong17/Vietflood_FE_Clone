import { describe, expect, it } from "vitest";

import { buildReportFormData, type ReportFormValues } from "./form-data";

function entriesOf(formData: FormData) {
  return Array.from(formData.entries()).map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
}

describe("report FormData builder", () => {
  it("submits backend coordinates without user-controlled severity or urgency", () => {
    const formData = buildReportFormData({
      categories: ["flood"],
      description: "Flooded street",
      province: "Da Nang",
      ward: "Hai Chau",
      addressLine: "12 Bach Dang",
      lat: "16.0544",
      lng: "108.2022",
      files: null,
    } as ReportFormValues);
    const entries = entriesOf(formData);
    const keys = entries.map(([key]) => key);

    expect(entries).toEqual(
      expect.arrayContaining([
        ["lat", "16.0544"],
        ["lng", "108.2022"],
      ]),
    );
    expect(keys).not.toContain("latitude");
    expect(keys).not.toContain("longitude");
    expect(keys).not.toContain("severity");
    expect(keys).not.toContain("isUrgent");
  });

  it("keeps internal GPS coordinates after manual location edits", () => {
    const formData = buildReportFormData({
      categories: ["flood"],
      description: "Flooded street",
      province: "Da Nang",
      ward: "Hai Chau",
      addressLine: "99 Tran Phu",
      lat: "16.0544",
      lng: "108.2022",
      isLocationManuallyEdited: true,
      files: null,
    } as ReportFormValues);

    const entries = entriesOf(formData);
    const keys = entries.map(([key]) => key);

    expect(entries).toEqual(
      expect.arrayContaining([
        ["lat", "16.0544"],
        ["lng", "108.2022"],
      ]),
    );
    expect(keys).not.toContain("latitude");
    expect(keys).not.toContain("longitude");
  });
});
