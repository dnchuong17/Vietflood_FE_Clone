import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  incidentGet,
  incidentChange,
  dateBoundary,
  queryString,
  incidentPdf,
} from "./incidents";
import { apiRequest } from "@/features/auth/lib/api-client";

vi.mock("@/features/auth/lib/api-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/auth/lib/api-client")>();
  return { ...original, apiRequest: vi.fn() };
});
beforeEach(() => {
  vi.mocked(apiRequest).mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});
describe("incident client behavior", () => {
  it("reads analytics/report and editorial history without dropping contract fields", async () => {
    const payload = { totalReports: 900, ungroupedReports: 12, missingGpsReports: 4, map: { truncated: true, incidentTotal: 800, incidentReturned: 1 }, priority: { value: "HIGH", reasonCodes: ["STRANDED_PEOPLE"], sourceReportIds: [7] }, analysis: { pipeline: "incidents-v2", normalizedText: "Đường ngập", matchingText: "duong ngap" }, candidates: [{ relation: "possible_duplicate", timeDifferenceMinutes: 12, score: 0.92 }], editorialSummary: { pipeline: "incidents-v1", stale: true } };
    for (const path of ["/incidents/analytics", "/incidents/report", "/incidents/fixture/summary-edits"]) {
      vi.mocked(apiRequest).mockResolvedValueOnce(Response.json(payload));
      expect(await incidentGet(path, {province: "Đà Nẵng", assignedToMe: "true"})).toEqual(payload);
      expect(apiRequest).toHaveBeenLastCalledWith(expect.stringContaining("assignedToMe=true"), expect.objectContaining({method: "GET", cache: "no-store"}));
    }
  });
  it("sends editor concurrency, reason and explicit retry key without mutating AI", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(Response.json({id: 3}));
    const body = {expectedVersion: 7, title: "Đã đối chiếu", body: "Bản biên tập", reason: "Kiểm tra mới"};
    await incidentChange("/incidents/fixture/summary-edits", body, "POST", "retry-key");
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining("/summary-edits"), expect.objectContaining({body: JSON.stringify(body), method: "POST", headers: {"Content-Type": "application/json", "Idempotency-Key": "retry-key"}}));
  });
  it("uses authenticated API transport, accepts PDF signature and forwards scope/cancellation", async () => {
    const controller = new AbortController();
    vi.mocked(apiRequest).mockResolvedValueOnce(new Response("%PDF-1.7\nfixture", {headers: {"content-type": "application/pdf"}}));
    expect(await (await incidentPdf({province: "Huế", assignedToMe: "true"}, controller.signal)).text()).toBe("%PDF-1.7\nfixture");
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining("/incidents/report.pdf?"), expect.objectContaining({method: "GET", cache: "no-store", signal: controller.signal, headers: {Accept: "application/pdf"}}));
  });
  it.each([
    [200, "text/html", "<html>login</html>", "không trả về PDF"],
    [200, "application/pdf", "not pdf", "PDF không hợp lệ"],
    [413, "application/json", JSON.stringify({message: "Report too large"}), "Report too large"],
    [403, "application/json", JSON.stringify({message: "Forbidden"}), "Forbidden"],
  ])("rejects invalid PDF and HTTP errors: %s %s", async (status, mime, body, message) => {
    vi.mocked(apiRequest).mockResolvedValueOnce(new Response(body, {status, headers: {"content-type": mime}}));
    await expect(incidentPdf({})).rejects.toThrow(message);
  });
  it("encodes area filters and uses Vietnam calendar-day boundaries", () => {
    expect(
      new URLSearchParams(
        queryString({ province: "Đà Nẵng & Hội An", status: "" }),
      ).get("province"),
    ).toBe("Đà Nẵng & Hội An");
    expect(dateBoundary("2026-11-02")).toBe("2026-11-01T17:00:00.000Z");
    expect(dateBoundary("2026-11-02", true)).toBe("2026-11-02T16:59:59.999Z");
  });
  it("preserves an explicit mutation key and surfaces version conflicts", async () => {
    vi.mocked(apiRequest).mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          code: "version_conflict",
          message: "Refresh before retrying",
        }),
        { status: 409 },
      ),
    );
    await expect(
      incidentChange(
        "/incidents/fixture/verify",
        { expectedVersion: 1, reason: "checked", factIds: [] },
        "POST",
        "stable-request-key",
      ),
    ).rejects.toThrow("Refresh before retrying");
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/incidents/fixture/verify"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "stable-request-key",
        }),
      }),
    );
  });
  it("bounds stalled reads so the emergency feed can recover", async () => {
    vi.useFakeTimers();
    vi.mocked(apiRequest).mockImplementation(
      (_url, options) =>
        new Promise((_, reject) =>
          options?.signal?.addEventListener(
            "abort",
            () => reject(options.signal?.reason),
            { once: true },
          ),
        ),
    );
    const rejected = expect(
      incidentGet("/incidents/emergencies"),
    ).rejects.toThrow("Hết thời gian");
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
  });
  it("cancels stale reads when the caller leaves the view", async () => {
    const controller = new AbortController();
    vi.mocked(apiRequest).mockImplementation(
      (_url, options) =>
        new Promise((_, reject) =>
          options?.signal?.addEventListener(
            "abort",
            () => reject(options.signal?.reason),
            { once: true },
          ),
        ),
    );
    const rejected = expect(
      incidentGet("/incidents", {}, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await rejected;
  });
});
