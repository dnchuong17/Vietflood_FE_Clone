import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./confirm-dialog.tsx", import.meta.url), "utf8");

describe("confirm dialog UI", () => {
  it("shows BarLoader feedback while confirming actions", () => {
    expect(source).toContain("@/components/feedback/loading-bar");
    expect(source).toContain("<LoadingBar");
    expect(source).toContain('title="Đang xử lý..."');
    expect(source).toContain("isConfirming ? (");
  });

  it("keeps the dialog mounted for its exit and returns keyboard focus", () => {
    expect(source).toContain("<MotionPresence");
    expect(source).toContain("data-motion-panel");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("previousFocus?.focus");
  });
});
