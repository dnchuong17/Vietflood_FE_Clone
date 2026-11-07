import { describe, expect, it } from "vitest";
import { changeVietnamProvince, filterVietnamDivisions, normalizeVietnamDivision, resolveVietnamDivision } from "./vietnam-address";
const provinces = [{ code: 1, name: "Thành phố Hà Nội" }, { code: 79, name: "Thành phố Hồ Chí Minh" }, { code: 48, name: "Thành phố Đà Nẵng" }];
describe("Vietnam address names", () => {
  it.each(["HCM", "TP.HCM", "TP HCM", "tphcm", "Hồ Chí Minh", "TP. Hồ Chí Minh"])("resolves %s without rewriting the saved value", (name) => {
    expect(resolveVietnamDivision(provinces, name)?.code).toBe(79);
  });
  it.each(["HN", "Hà Nội", "TP Ha Noi", "Thành phố Hà Nội"])("resolves %s", (name) => {
    expect(resolveVietnamDivision(provinces, name)?.code).toBe(1);
  });
  it("normalizes accents, đ, spacing and ward prefixes for searches", () => {
    expect(normalizeVietnamDivision(" Phường Đắk  Đoa ")).toBe("dak doa");
    expect(filterVietnamDivisions(provinces, "da nang")).toEqual([provinces[2]]);
    expect(filterVietnamDivisions(provinces, "")).toEqual(provinces);
  });
  it("does not resolve partial, unknown, blank or ambiguous saved names", () => {
    expect(resolveVietnamDivision(provinces, "Ho")).toBeUndefined();
    expect(resolveVietnamDivision(provinces, "Sài Gòn cũ")).toBeUndefined();
    expect(resolveVietnamDivision(provinces, "")).toBeUndefined();
    expect(resolveVietnamDivision([...provinces, { code: 2, name: "Tỉnh Hà Nội" }], "Ha Noi")).toBeUndefined();
  });
  it("preserves a legacy ward on same-parent reselect and clears it on actual change", () => {
    const value = { province: "TP HCM", ward: "Phường cũ" };
    expect(changeVietnamProvince(value, "TP HCM", provinces)).toBe(value);
    expect(changeVietnamProvince(value, provinces[1].name, provinces).ward).toBe(value.ward);
    expect(changeVietnamProvince(value, provinces[0].name, provinces)).toEqual({ province: provinces[0].name, ward: "" });
    expect(changeVietnamProvince(value, "", provinces)).toEqual({ province: "", ward: "" });
    expect(value).toEqual({ province: "TP HCM", ward: "Phường cũ" });
  });
});
