import { beforeEach, describe, expect, it, vi } from "vitest";
import { listReports, getReportDetail } from "./reports";
import { apiGet } from "../../auth/lib/api-client";
vi.mock("../../auth/lib/api-client", async (importOriginal) => ({ ...await importOriginal<typeof import("../../auth/lib/api-client")>(), apiGet: vi.fn() }));
const reply = (value: unknown) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
beforeEach(() => vi.mocked(apiGet).mockReset());

describe("report payload regressions", () => {
  it("preserves a flat report with a nested reporter instead of discarding its fields", async () => {
    const report = { id: 14, description: "Cần hỗ trợ", user: { id: 9, username: "resident" }, latitude: "16.047", longitude: "108.206" };
    vi.mocked(apiGet).mockResolvedValue(reply([report]));
    const reports = await listReports("citizen");
    expect(reports[0]).toMatchObject({ id: 14, description: "Cần hỗ trợ", userId: 9, lat: 16.047, lng: 108.206 });
    vi.mocked(apiGet).mockResolvedValue(reply(report));
    await expect(getReportDetail("citizen", 14)).resolves.toMatchObject({ id: 14, description: "Cần hỗ trợ" });
  });
  it.each(["data", "result"])("unwraps a successful %s envelope", async (key) => {
    vi.mocked(apiGet).mockResolvedValue(reply({ [key]: [{ report: { id: 2 }, user: { id: 8 } }] }));
    await expect(listReports("admin")).resolves.toMatchObject([{ id: 2, userId: 8 }]);
  });
  it("does not present an RPC outage as an empty operational queue", async () => {
    vi.mocked(apiGet).mockResolvedValue(reply({ statusCode: 503, message: "Dịch vụ báo cáo tạm ngừng" }));
    await expect(listReports("relief")).rejects.toThrow("Dịch vụ báo cáo tạm ngừng");
  });
  it.each([{}, null, [null], ["invalid"]])("rejects malformed successful payload %j", async (payload) => {
    vi.mocked(apiGet).mockResolvedValue(reply(payload));
    await expect(listReports("admin")).rejects.toThrow();
  });
});
