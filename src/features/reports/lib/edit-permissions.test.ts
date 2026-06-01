import { describe, expect, it } from "vitest";

import {
  canEditReport,
  getReportEditRestrictionReason,
} from "./edit-permissions";
import type { FloodReport } from "../api/reports";
import type { AuthIdentity } from "../../auth/lib/auth-storage";

const now = new Date("2026-06-01T12:00:00.000Z");
const currentUser: AuthIdentity = {
  username: "citizen01",
  displayName: "Citizen One",
  initials: "CO",
  role: "citizen",
};

function report(overrides: Partial<FloodReport> = {}): FloodReport {
  return {
    id: 12,
    user: { username: "citizen01" },
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("report edit permissions", () => {
  it("allows the owner to edit during the first 24 hours", () => {
    expect(canEditReport(report(), currentUser, { now })).toBe(true);
    expect(
      getReportEditRestrictionReason(report(), currentUser, { now }),
    ).toBeNull();
  });

  it("blocks editing reports from another user", () => {
    const otherUserReport = report({ user: { username: "other-user" } });

    expect(canEditReport(otherUserReport, currentUser, { now })).toBe(false);
    expect(
      getReportEditRestrictionReason(otherUserReport, currentUser, { now }),
    ).toContain("tài khoản của mình");
  });

  it("blocks editing when the report is older than 24 hours", () => {
    const expiredReport = report({ createdAt: "2026-05-31T11:59:59.999Z" });

    expect(canEditReport(expiredReport, currentUser, { now })).toBe(false);
    expect(
      getReportEditRestrictionReason(expiredReport, currentUser, { now }),
    ).toContain("24 giờ");
  });

  it("blocks editing when the report is resolved", () => {
    const resolvedReport = report({ status: "resolved" });

    expect(canEditReport(resolvedReport, currentUser, { now })).toBe(false);
    expect(
      getReportEditRestrictionReason(resolvedReport, currentUser, { now }),
    ).toContain("Đã xử lý");
  });

  it("allows editing at the exact 24-hour boundary", () => {
    const boundaryReport = report({ createdAt: "2026-05-31T12:00:00.000Z" });

    expect(canEditReport(boundaryReport, currentUser, { now })).toBe(true);
  });

  it("allows current-user report lists when backend omits owner username", () => {
    const currentUserReport = report({ user: undefined, userId: 42 });

    expect(
      canEditReport(currentUserReport, currentUser, {
        assumeCurrentUserReport: true,
        now,
      }),
    ).toBe(true);
    expect(
      getReportEditRestrictionReason(currentUserReport, currentUser, {
        assumeCurrentUserReport: true,
        now,
      }),
    ).toBeNull();
  });

  it("does not let current-user report fallback override an explicit owner", () => {
    const otherUserReport = report({ user: { username: "other-user" } });

    expect(
      canEditReport(otherUserReport, currentUser, {
        assumeCurrentUserReport: true,
        now,
      }),
    ).toBe(false);
  });

  it("blocks editing when ownership or creation time cannot be verified", () => {
    expect(canEditReport(report({ user: undefined }), currentUser, { now })).toBe(
      false,
    );
    expect(
      canEditReport(report({ createdAt: "not-a-date" }), currentUser, { now }),
    ).toBe(false);
  });
});
