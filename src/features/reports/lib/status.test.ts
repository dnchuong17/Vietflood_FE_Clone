import { describe, expect, it } from "vitest";

import {
  REPORT_STATUS_OPTIONS,
  buildReportStatusPatchPayload,
  getReportStatusLabel,
} from "./status";

describe("report status helpers", () => {
  it("keeps the backend status set in order", () => {
    expect(REPORT_STATUS_OPTIONS).toEqual([
      "pending",
      "verified",
      "resolved",
      "rejected",
    ]);
  });

  it("builds the report status PATCH payload", () => {
    expect(buildReportStatusPatchPayload("verified")).toEqual({
      status: "verified",
    });
  });

  it("labels status actions for relief users", () => {
    expect(getReportStatusLabel("pending")).toBe("Chờ xử lý");
    expect(getReportStatusLabel("resolved")).toBe("Đã xử lý");
  });
});
