import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./profile-settings.tsx", import.meta.url),
  "utf8",
);

describe("profile settings UI", () => {
  it("uses shadcn form controls and semantic surfaces", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/field");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/textarea");
    expect(source).toContain("<Button");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });
});
