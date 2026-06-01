import { describe, expect, it } from "vitest";

import {
  APP_ROLES,
  canManageReports,
  canManageUsers,
  getUserRoleLabel,
  normalizeRole,
} from "./roles";

describe("web role model", () => {
  it("only exposes the backend roles", () => {
    expect(APP_ROLES).toEqual(["citizen", "relief", "admin"]);
  });

  it("normalizes only valid backend roles", () => {
    expect(normalizeRole("citizen")).toBe("citizen");
    expect(normalizeRole("RELIEF")).toBe("relief");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole("legacy-role")).toBeNull();
  });

  it("keeps operational privileges on relief and admin", () => {
    expect(canManageReports("citizen")).toBe(false);
    expect(canManageReports("relief")).toBe(true);
    expect(canManageReports("admin")).toBe(true);
    expect(canManageUsers("relief")).toBe(true);
    expect(canManageUsers("admin")).toBe(true);
  });

  it("returns Vietnamese labels for app roles", () => {
    expect(getUserRoleLabel("citizen")).toBe("Người dân");
    expect(getUserRoleLabel("relief")).toBe("Đội cứu trợ");
    expect(getUserRoleLabel("admin")).toBe("Quản trị viên");
    expect(getUserRoleLabel(null)).toBe("-");
  });
});
