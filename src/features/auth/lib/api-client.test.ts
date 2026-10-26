import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, parseJsonResponse } from "./api-client";
import { ApiResponseError } from "./response-error";

const session = vi.hoisted(() => ({ access: "old-access" as string | null, refresh: "old-refresh" as string | null, revision: 0, expiring: true }));
vi.mock("./auth-storage", () => ({
  getAccessToken: () => session.access,
  getRefreshToken: () => session.refresh,
  getAuthSessionRevision: () => session.revision,
  isAccessTokenExpiringSoon: () => session.expiring,
  updateAccessToken: vi.fn((token: string) => { session.access = token; }),
  updateRefreshToken: vi.fn((token: string) => { session.refresh = token; }),
  clearAuthTokens: vi.fn(() => { session.access = null; session.refresh = null; session.revision++; }),
}));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  Object.assign(session, { access: "old-access", refresh: "old-refresh", revision: 0, expiring: true });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("refresh session safety", () => {
  it.each(["network", 429, 500, 503])("keeps the session after temporary refresh failure %s", async (failure) => {
    const fetcher = vi.fn().mockImplementationOnce(() => failure === "network" ? Promise.reject(new TypeError("offline")) : Promise.resolve(json({ message: "Réessayez" }, failure as number))).mockResolvedValueOnce(json([]));
    vi.stubGlobal("fetch", fetcher);
    await apiRequest("https://fixture.test/reports");
    expect(session.access).toBe("old-access");
    expect(session.refresh).toBe("old-refresh");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new Headers(fetcher.mock.calls[1][1].headers).get("Authorization")).toBe("Bearer old-access");
  });
  it.each([401, 403])("clears the current session only on explicit refresh rejection %s", async (status) => {
    const fetcher = vi.fn().mockResolvedValue(json({ message: "Phiên không hợp lệ" }, status));
    vi.stubGlobal("fetch", fetcher);
    await expect(apiRequest("https://fixture.test/reports")).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(session.access).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not resurrect tokens after logout while refresh is pending", async () => {
    let finish!: (value: Response) => void;
    const fetcher = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetcher);
    const request = apiRequest("https://fixture.test/reports");
    session.revision++; session.access = null; session.refresh = null;
    finish(json({ accessToken: "late-access", refresh_token: "late-refresh" }));
    await expect(request).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(session.access).toBeNull(); expect(session.refresh).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not erase a newly signed-in session when old refresh is rejected", async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const request = apiRequest("https://fixture.test/reports");
    session.revision++; session.access = "new-user-access"; session.refresh = "new-user-refresh";
    finish(json({ message: "old session rejected" }, 401));
    await expect(request).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(session.access).toBe("new-user-access"); expect(session.refresh).toBe("new-user-refresh");
  });
  it("deduplicates concurrent refresh and retries with the renewed token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => url.includes("refresh_token") ? json({ accessToken: "renewed", refresh_token: "rotated" }) : json([])));
    await Promise.all([apiRequest("https://fixture.test/a"), apiRequest("https://fixture.test/b")]);
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("refresh_token"))).toHaveLength(1);
    expect(session.access).toBe("renewed"); expect(session.refresh).toBe("rotated");
  });
});

describe("JSON and RPC failures", () => {
  it.each([{ statusCode: 503, message: "Dịch vụ tạm ngừng" }, { success: false, message: "Dịch vụ tạm ngừng" }, { error: { statusCode: 500, message: "Dịch vụ tạm ngừng" } }])("rejects HTTP 200 error envelope %j", async (body) => {
    await expect(parseJsonResponse(json(body), "Lỗi")).rejects.toThrow("Dịch vụ tạm ngừng");
  });
  it("retains status for HTTP errors", async () => {
    await expect(parseJsonResponse(json({ message: ["Không hợp lệ", "Thử lại"] }, 403), "Lỗi")).rejects.toEqual(new ApiResponseError("Không hợp lệ, Thử lại", 403));
  });
  it("rejects invalid JSON instead of reporting success", async () => {
    await expect(parseJsonResponse(new Response("<html>gateway</html>"), "Không thể tải")).rejects.toThrow("Không thể tải");
  });
  it("accepts successful arrays and empty 204 mutation responses", async () => {
    await expect(parseJsonResponse(json([]), "Lỗi")).resolves.toEqual([]);
    await expect(parseJsonResponse(new Response(null, { status: 204 }), "Lỗi")).resolves.toBeNull();
  });
});
