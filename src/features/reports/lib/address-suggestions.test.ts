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
});
