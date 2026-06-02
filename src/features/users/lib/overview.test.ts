import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { ManagedUser } from "@/features/users/api/users";
import { buildUsersOverviewSummary, formatUsersLastSyncedAt } from "./overview";

const source = readFileSync(new URL("./overview.ts", import.meta.url), "utf8");

describe("users overview summary", () => {
  it("summarizes only citizen, relief, and admin roles", () => {
    const users: ManagedUser[] = [
      { id: 1, role: "citizen" },
      { id: 2, role: "relief" },
      { id: 3, role: "admin" },
      { id: 4, role: "legacy-role" },
      { id: 5 },
    ];

    expect(buildUsersOverviewSummary(users, 3)).toEqual({
      total: 5,
      filtered: 3,
      citizen: 3,
      relief: 1,
      admin: 1,
    });
  });

  it("does not keep mobile-only role names in web role handling", () => {
    const forbiddenRoleNames = [
      "volun" + "teer",
      "coord" + "inator",
      "resi" + "dent",
    ];

    for (const roleName of forbiddenRoleNames) {
      expect(source).not.toContain(roleName);
    }
  });

  it("formats the last synced timestamp with a stable fallback", () => {
    expect(formatUsersLastSyncedAt(undefined)).toBe("Chua dong bo");
    expect(formatUsersLastSyncedAt("not-a-date")).toBe("Chua dong bo");
    expect(formatUsersLastSyncedAt("2026-06-02T15:00:00.000Z")).toContain(
      "02/06/2026",
    );
  });
});
