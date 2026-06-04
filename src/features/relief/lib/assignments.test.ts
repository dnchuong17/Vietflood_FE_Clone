import { describe, expect, it } from "vitest";

import {
  filterOperationalAssignments,
  mapReportToAssignment,
  summarizeAssignments,
} from "./assignments";

describe("operational assignment helpers", () => {
  it("maps pending urgent reports into assigned urgent work", () => {
    const assignment = mapReportToAssignment({
      id: 42,
      status: "pending",
      isUrgent: true,
      description: "Need clean water",
      province: "TP.HCM",
      ward: "Ward 1",
      user: { username: "citizen-a", phone: "0900000000" },
    });

    expect(assignment).toMatchObject({
      id: "42",
      priority: "urgent",
      status: "assigned",
      progress: 10,
      title: "Need clean water",
      reporter: "citizen-a",
      contact: "0900000000",
      location: "Ward 1, TP.HCM",
      nextStatus: "verified",
      reassignStatus: "pending",
    });
  });

  it("maps verified severe reports into in-progress high-priority work", () => {
    const assignment = mapReportToAssignment({
      id: 9,
      status: "verified",
      severity: 4,
      createdAt: "2026-04-18T00:00:00.000Z",
      category: ["flood"],
      userId: 7,
    });

    expect(assignment.status).toBe("in_progress");
    expect(assignment.priority).toBe("high");
    expect(assignment.progress).toBe(50);
    expect(assignment.reporter).toBe("User #7");
    expect(assignment.nextStatus).toBe("resolved");
    expect(assignment.deadlineLabel).toBe("Hạn: 19/04/2026");
    expect(assignment.reassignStatus).toBe("pending");
    expect(assignment.reassignActionLabel).toBe("Phân công lại");
  });

  it("does not offer reassignment for completed assignments", () => {
    const assignment = mapReportToAssignment({
      id: 11,
      status: "resolved",
    });

    expect(assignment.status).toBe("completed");
    expect(assignment.reassignStatus).toBeNull();
    expect(assignment.reassignActionLabel).toBeNull();
  });

  it("summarizes and filters active operational assignments", () => {
    const assignments = [
      mapReportToAssignment({ id: 1, status: "pending", isUrgent: true }),
      mapReportToAssignment({ id: 2, status: "verified" }),
      mapReportToAssignment({ id: 3, status: "resolved" }),
    ];

    expect(summarizeAssignments(assignments)).toEqual({
      total: 3,
      assigned: 1,
      inProgress: 1,
      completed: 1,
      urgent: 1,
    });
    expect(filterOperationalAssignments(assignments).map((item) => item.id)).toEqual([
      "1",
      "2",
    ]);
  });
});
