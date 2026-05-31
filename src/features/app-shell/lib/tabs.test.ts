import { describe, expect, it } from "vitest";

import { getDefaultRouteForRole, getTabsForRole } from "./tabs";

describe("role-aware app tabs", () => {
  it("shows citizen tabs for citizen users", () => {
    expect(getDefaultRouteForRole("citizen")).toBe("/trang-chu");
    expect(getTabsForRole("citizen").map((tab) => tab.href)).toEqual([
      "/trang-chu",
      "/bao-cao",
      "/theo-doi",
      "/ho-so",
    ]);
  });

  it("shows operational tabs for relief users", () => {
    expect(getDefaultRouteForRole("relief")).toBe("/cuu-tro");
    expect(getTabsForRole("relief").map((tab) => tab.href)).toEqual([
      "/cuu-tro",
      "/bao-cao",
      "/theo-doi",
      "/nguoi-dung",
      "/ho-so",
    ]);
  });

  it("uses the same operational tabs for admin users", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/cuu-tro");
    expect(getTabsForRole("admin").map((tab) => tab.href)).toEqual(
      getTabsForRole("relief").map((tab) => tab.href),
    );
  });
});
