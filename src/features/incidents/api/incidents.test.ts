import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  incidentGet,
  incidentChange,
  dateBoundary,
  queryString,
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
