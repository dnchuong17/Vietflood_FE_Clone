import { describe, expect, it } from "vitest";

import { buildAddressSuggestions } from "./address-suggestions";

describe("buildAddressSuggestions", () => {
  it("suggests known report addresses by typed query, province, and ward", () => {
    expect(
      buildAddressSuggestions({
        query: "bach",
        province: "Thành phố Đà Nẵng",
        ward: "Phường Hải Châu",
        reports: [
          {
            addressLine: "12 Bạch Đằng",
            province: "Thành phố Đà Nẵng",
            ward: "Phường Hải Châu",
          },
          {
            addressLine: "99 Trần Phú",
            province: "Thành phố Đà Nẵng",
            ward: "Phường Hải Châu",
          },
          {
            addressLine: "12 Bạch Đằng",
            province: "Thành phố Huế",
            ward: "Phường Thuận Hóa",
          },
        ],
      }),
    ).toEqual(["12 Bạch Đằng"]);
  });

  it("does not suggest until the user types at least two normalized characters", () => {
    expect(
      buildAddressSuggestions({
        query: "b",
        province: "Thành phố Đà Nẵng",
        ward: "Phường Hải Châu",
        reports: [{ addressLine: "12 Bạch Đằng", province: "Thành phố Đà Nẵng" }],
      }),
    ).toEqual([]);
  });

  it("matches Vietnamese đ/d and administrative prefixes without changing saved street text", () => {
    const reports = [
      {addressLine:"87/12 Đường 104",province:"Hồ Chí Minh",ward:"Tăng Nhơn Phú"},
      {addressLine:"9 Đường 104",province:"Thành phố Đà Nẵng",ward:"Tăng Nhơn Phú"},
      {addressLine:"1 Đường 104",province:"Thành phố Hồ Chí Minh",ward:"Phường khác"},
    ];
    const before=JSON.stringify(reports);
    expect(buildAddressSuggestions({query:"duong 104",province:"Thành phố Hồ Chí Minh",ward:"Phường Tăng Nhơn Phú",reports})).toEqual(["87/12 Đường 104"]);
    expect(JSON.stringify(reports)).toBe(before);
  });
});
