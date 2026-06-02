import { describe, expect, it } from "vitest";

import type { FloodReport } from "../api/reports";
import {
  buildReportsOverviewSummary,
  formatReportsLastSyncedAt,
} from "./overview";

describe("reports overview summary", () => {
  it("counts visible reports, backend statuses, and urgent reports", () => {
    const reports: FloodReport[] = [
      { id: 1, description: "A", status: "pending", isUrgent: true },
      { id: 2, description: "B", status: "verified" },
      { id: 3, description: "C", status: "resolved", is_urgent: true },
      { id: 4, description: "D", status: "rejected" },
      { id: 5, description: "E", status: "unexpected" },
    ];

    expect(buildReportsOverviewSummary(reports, 2)).toEqual({
      total: 5,
      filtered: 2,
      pending: 2,
      verified: 1,
      resolved: 1,
      rejected: 1,
      urgent: 2,
    });
  });

  it("formats the last synced timestamp and keeps an explicit fallback", () => {
    expect(formatReportsLastSyncedAt(null)).toBe("Chưa đồng bộ");
    expect(formatReportsLastSyncedAt("not-a-date")).toBe("Chưa đồng bộ");
    expect(formatReportsLastSyncedAt("2026-06-02T03:04:05.000Z")).toMatch(
      /03:04|10:04/,
    );
  });
});
