import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REPORT_DETAIL_TIMEOUT_MESSAGE,
  withReportDetailTimeout,
} from "./report-detail-timeout";

describe("withReportDetailTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects with a useful message when report detail loading hangs", async () => {
    vi.useFakeTimers();

    const result = withReportDetailTimeout(
      new Promise(() => undefined),
      100,
    );
    const assertion = expect(result).rejects.toThrow(
      REPORT_DETAIL_TIMEOUT_MESSAGE,
    );

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
});
