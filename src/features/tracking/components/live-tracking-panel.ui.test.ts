import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./live-tracking-panel.tsx", import.meta.url), "utf8");

describe("live tracking panel UI", () => {
  it("uses shared shadcn UI primitives for tracking controls", () => {
    expect(source).toContain("@/components/ui/button");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/alert");
    expect(source).toContain("@/components/feedback/loading-bar");
  });

  it("keeps the tracking workflow localized for operators", () => {
    expect(source).toContain("Bắt đầu");
    expect(source).toContain("Dừng");
    expect(source).toContain("Đang kết nối");
    expect(source).toContain("đang hoạt động");
  });

  it("shows BarLoader feedback while refreshing tracking snapshots", () => {
    expect(source).toContain("<LoadingBar");
    expect(source).toContain('title="Đang tải vị trí trực tiếp..."');
    expect(source).toContain("isSnapshotLoading");
  });

  it("uses the mobile-compatible socket tracking contract instead of REST snapshots", () => {
    expect(source).toContain('socketRef.current?.emit("request-locations")');
    expect(source).not.toContain('/tracking/locations');
    expect(source).toContain('socket.on("receive-location"');
    expect(source).toContain('socket.on("user-disconnected"');
  });
});
