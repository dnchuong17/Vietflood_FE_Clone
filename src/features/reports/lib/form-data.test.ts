import { describe, expect, it } from "vitest";

import { buildReportFormData, type ReportFormValues } from "./form-data";

function entriesOf(formData: FormData) {
  return Array.from(formData.entries()).map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
}

describe("report FormData builder", () => {
  it("round-trips GPS and photo bytes through real multipart serialization", async () => {
    const image = new File(["qa-evidence-payload"], "qa-evidence.png", { type: "image/png" });
    const body = buildReportFormData({
      categories: ["flood"], description: "QA attachment serialization only",
      province: "QA province", ward: "QA ward", addressLine: "QA address",
      lat: "0", lng: "106.7", files: [image] as unknown as FileList,
    });
    const request = new Request("http://localhost/reports/create", { method: "POST", body });
    expect(request.headers.get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
    const decoded = await request.formData();
    expect(decoded.get("lat")).toBe("0");
    expect(decoded.get("lng")).toBe("106.7");
    expect(decoded.getAll("files")).toHaveLength(1);
    const restored = decoded.get("files") as File;
    expect(restored.name).toBe("qa-evidence.png");
    expect(restored.type).toBe("image/png");
    expect(await restored.text()).toBe("qa-evidence-payload");
  });

  it("preserves a photo when no GPS is selected", () => {
    const image = new File(["qa-photo"], "qa.jpg", { type: "image/jpeg" });
    const body = buildReportFormData({
      categories: ["flood"], description: "QA", province: "QA", ward: "QA",
      addressLine: "QA", lat: "", lng: "", files: [image] as unknown as FileList,
    });
    expect(body.get("files")).toBe(image);
    expect(body.has("lat")).toBe(false);
    expect(body.has("lng")).toBe(false);
  });

  it("omits removed photos without dropping retained GPS", () => {
    const body = buildReportFormData({
      categories: ["flood"], description: "QA", province: "QA", ward: "QA",
      addressLine: "QA", lat: "10.5", lng: "0", files: null,
    });
    expect(body.getAll("files")).toEqual([]);
    expect(body.get("lat")).toBe("10.5");
    expect(body.get("lng")).toBe("0");
  });
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
