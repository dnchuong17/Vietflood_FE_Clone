import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./report-detail.tsx", import.meta.url), "utf8");
const panelSource = readFileSync(
  new URL("./report-detail-panel.tsx", import.meta.url),
  "utf8",
);

describe("report detail UI", () => {
  it("uses the report detail timeout on the active detail route component", () => {
    expect(source).toContain("withReportDetailTimeout");
    expect(source).toContain("withReportDetailTimeout(getReportDetail(role, numericReportId))");
  });

  it("uses BarLoader feedback while detail views load", () => {
    for (const detailSource of [source, panelSource]) {
      expect(detailSource).toContain("@/components/feedback/loading-bar");
      expect(detailSource).toContain("<LoadingBar");
      expect(detailSource).toContain('title="Đang tải chi tiết báo cáo..."');
    }
  });
});
