import { afterEach, describe, expect, it } from "vitest";

import { resetReportsStore, useReportsStore } from "./reports-store";

describe("reports Zustand store", () => {
  afterEach(() => {
    resetReportsStore();
  });

  it("tracks filters and optimistic report status saves", () => {
    useReportsStore.getState().setReports([
      { id: 7, description: "Need help", status: "pending" },
    ]);
    useReportsStore.getState().setFilter("pending");
    useReportsStore.getState().setQuery("help");

    useReportsStore.getState().startReportStatusSave(7, "verified");

    expect(useReportsStore.getState().filter).toBe("pending");
    expect(useReportsStore.getState().query).toBe("help");
    expect(useReportsStore.getState().reports[0].status).toBe("verified");
    expect(useReportsStore.getState().savingStatusByReportId[7]).toBe("verified");

    useReportsStore.getState().rollbackReportStatus(7, "pending");
    useReportsStore.getState().finishReportStatusSave(7);

    expect(useReportsStore.getState().reports[0].status).toBe("pending");
    expect(useReportsStore.getState().savingStatusByReportId[7]).toBeUndefined();
  });
});
