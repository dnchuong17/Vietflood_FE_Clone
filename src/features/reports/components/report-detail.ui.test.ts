import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-detail.tsx", import.meta.url), "utf8");

describe("report detail UI", () => {
  it("uses the report detail timeout on the active detail route component", () => {
    expect(source).toContain("withReportDetailTimeout");
    expect(source).toContain("withReportDetailTimeout(getReportDetail(role, numericReportId))");
  });
});
