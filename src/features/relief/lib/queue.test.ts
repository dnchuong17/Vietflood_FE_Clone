import { describe, expect, it } from "vitest";

import type { FloodReport } from "@/features/reports/api/reports";
import {
  buildReliefQueueStats,
  filterReliefQueueReports,
  isReliefRouteReady,
} from "./queue";

describe("relief queue helpers", () => {
  const reports: FloodReport[] = [
    {
      id: 1,
      status: "pending",
      description: "Ngập sâu trước trường học",
      province: "Đà Nẵng",
      ward: "Hải Châu",
      lat: 16.06,
      lng: 108.22,
      user: { username: "citizen-a" },
    },
    {
      id: 2,
      status: "verified",
      description: "Cần thuyền cứu hộ",
      addressLine: "Đường Bạch Đằng",
      province: "Đà Nẵng",
      user: { name: "Đội trưởng khu phố" },
    },
    {
      id: 3,
      status: "resolved",
      description: "Đã hỗ trợ xong",
      lat: "16.07",
      lng: "108.20",
    },
    {
      id: 4,
      status: "rejected",
      description: "Báo cáo trùng",
    },
  ];

  it("counts mobile-style relief filters including route-ready reports", () => {
    expect(buildReliefQueueStats(reports)).toEqual({
      total: 4,
      awaiting: 1,
      active: 1,
      resolved: 1,
      routeReady: 2,
    });
  });

  it("filters by status, route readiness, and search text", () => {
    expect(filterReliefQueueReports(reports, "awaiting", "")).toHaveLength(1);
    expect(filterReliefQueueReports(reports, "active", "")).toHaveLength(1);
    expect(filterReliefQueueReports(reports, "resolved", "")).toHaveLength(1);
    expect(filterReliefQueueReports(reports, "route-ready", "")).toEqual([
      reports[0],
      reports[2],
    ]);
    expect(filterReliefQueueReports(reports, "all", "bạch đằng")).toEqual([
      reports[1],
    ]);
  });

  it("accepts numeric and parseable string coordinates as route-ready", () => {
    expect(isReliefRouteReady({ lat: 16.06, lng: 108.22 })).toBe(true);
    expect(isReliefRouteReady({ lat: "16.06", lng: "108.22" })).toBe(true);
    expect(
      isReliefRouteReady({ latitude: "16.06", longitude: 108.22 }),
    ).toBe(true);
    expect(isReliefRouteReady({ lat: "x", lng: "108.22" })).toBe(false);
  });
});
