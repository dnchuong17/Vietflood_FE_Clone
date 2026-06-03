import { describe, expect, it } from "vitest";

import { getProfileHomeActions } from "./profile-actions";

describe("profile home actions", () => {
  it("returns citizen quick actions for reports and live tracking", () => {
    expect(getProfileHomeActions("citizen")).toEqual([
      {
        href: "/bao-cao",
        label: "Mở báo cáo",
        description: "Tạo báo cáo mới hoặc kiểm tra báo cáo của bạn.",
      },
      {
        href: "/theo-doi",
        label: "Chia sẻ vị trí",
        description: "Bật theo dõi trực tiếp khi cần đội cứu trợ hỗ trợ.",
      },
    ]);
  });

  it("returns operational quick actions for relief and admin roles only", () => {
    expect(getProfileHomeActions("relief").map((action) => action.href)).toEqual([
      "/bao-cao",
      "/cuu-tro",
      "/theo-doi",
      "/nguoi-dung",
    ]);
    expect(getProfileHomeActions("admin").map((action) => action.href)).toEqual([
      "/bao-cao",
      "/cuu-tro",
      "/theo-doi",
      "/nguoi-dung",
    ]);
  });
});
