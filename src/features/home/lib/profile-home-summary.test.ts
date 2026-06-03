import { describe, expect, it } from "vitest";

import { buildProfileHomeSummary } from "./profile-home-summary";

describe("profile home summary", () => {
  it("matches the mobile profile-home counts from identity and reports", () => {
    expect(
      buildProfileHomeSummary({
        identity: {
          username: "an",
          displayName: "An Nguyen",
          initials: "AN",
          role: "citizen",
        },
        reports: [
          { id: 1, status: "pending" },
          { id: 2, status: "verified" },
          { id: 3, status: "in-progress" },
          { id: 4, status: "resolved" },
          { id: 5, status: "rejected" },
        ],
      }),
    ).toEqual({
      greeting: "Chào mừng trở lại, An Nguyen",
      openTasks: 3,
      unreadAlerts: 1,
    });
  });
});
