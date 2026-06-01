import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./overview-dashboard.tsx", import.meta.url),
  "utf8",
);

describe("overview dashboard UI", () => {
  it("uses shadcn tabs instead of a custom segmented control", () => {
    expect(source).toContain("Tabs");
    expect(source).toContain("TabsList");
    expect(source).toContain("TabsTrigger");
    expect(source).toContain("TabsContent");
    expect(source).not.toContain("className={`rounded-md px-3 py-2");
  });
});
