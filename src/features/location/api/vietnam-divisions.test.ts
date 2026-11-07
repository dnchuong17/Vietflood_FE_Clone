import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PROVINCES_CACHE_KEY = "vietflood.divisions.v2.provinces";
const WARDS_CACHE_KEY = "vietflood.divisions.v2.wards";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const provinces = [
  { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 79, name: "Thành phố Hồ Chí Minh" },
];

const wards = [
  { code: 20194, name: "Phường Hải Châu", province_code: 48 },
  { code: 26734, name: "Phường Bà Rịa", province_code: 79 },
];

function createLocalStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    },
  };
}

function createFetchMock() {
  return vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.endsWith("/p/") ? provinces : wards),
  }));
}

async function loadClient() {
  return import("./vietnam-divisions");
}

describe("Vietnam divisions cache", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.stubGlobal("window", { localStorage: createLocalStorage() });
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
  });

  it("prefetches the complete province and ward datasets once", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const { prefetchVietnamDivisions, searchProvinces, searchWards } = await loadClient();

    await Promise.all([prefetchVietnamDivisions(), prefetchVietnamDivisions()]);

    await expect(searchProvinces("da nang")).resolves.toEqual([
      { code: 48, name: "Thành phố Đà Nẵng" },
    ]);
    await expect(searchWards(48, "hai chau")).resolves.toEqual([
      { code: 20194, name: "Phường Hải Châu", provinceCode: 48 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provinces.open-api.vn/api/v2/p/",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provinces.open-api.vn/api/v2/w/",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("reuses fresh persistent cache without making network requests", async () => {
    const localStorage = window.localStorage;
    const fetchedAt = Date.now();
    localStorage.setItem(
      PROVINCES_CACHE_KEY,
      JSON.stringify({ schemaVersion: 2, fetchedAt, data: provinces }),
    );
    localStorage.setItem(
      WARDS_CACHE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        fetchedAt,
        data: wards.map(({ province_code, ...ward }) => ({
          ...ward,
          provinceCode: province_code,
        })),
      }),
    );
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const { searchProvinces, searchWards } = await loadClient();

    await expect(searchProvinces("ho chi minh")).resolves.toEqual([
      { code: 79, name: "Thành phố Hồ Chí Minh" },
    ]);
    await expect(searchWards(79, "ba ria")).resolves.toEqual([
      { code: 26734, name: "Phường Bà Rịa", provinceCode: 79 },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns stale cache immediately and refreshes it in the background", async () => {
    const staleFetchedAt = Date.now() - THIRTY_DAYS_MS - 1;
    window.localStorage.setItem(
      PROVINCES_CACHE_KEY,
      JSON.stringify({ schemaVersion: 2, fetchedAt: staleFetchedAt, data: provinces }),
    );
    window.localStorage.setItem(
      WARDS_CACHE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        fetchedAt: staleFetchedAt,
        data: wards.map(({ province_code, ...ward }) => ({
          ...ward,
          provinceCode: province_code,
        })),
      }),
    );
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const { searchProvinces } = await loadClient();

    await expect(searchProvinces("da nang")).resolves.toEqual([
      { code: 48, name: "Thành phố Đà Nẵng" },
    ]);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("keeps stale data when a background refresh fails", async () => {
    const staleFetchedAt = Date.now() - THIRTY_DAYS_MS - 1;
    window.localStorage.setItem(
      PROVINCES_CACHE_KEY,
      JSON.stringify({ schemaVersion: 2, fetchedAt: staleFetchedAt, data: provinces }),
    );
    window.localStorage.setItem(
      WARDS_CACHE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        fetchedAt: staleFetchedAt,
        data: wards.map(({ province_code, ...ward }) => ({
          ...ward,
          provinceCode: province_code,
        })),
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { searchWards } = await loadClient();

    await expect(searchWards(48, "hai chau")).resolves.toEqual([
      { code: 20194, name: "Phường Hải Châu", provinceCode: 48 },
    ]);
  });

  it("returns the requested dataset when the companion prefetch fails", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/w/")) {
        throw new Error("wards unavailable");
      }

      return {
        ok: true,
        json: async () => provinces,
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const { searchProvinces } = await loadClient();

    await expect(searchProvinces("da nang")).resolves.toEqual([
      { code: 48, name: "Thành phố Đà Nẵng" },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("ignores malformed persistent cache and replaces it from the API", async () => {
    window.localStorage.setItem(
      PROVINCES_CACHE_KEY,
      JSON.stringify({ schemaVersion: 1, fetchedAt: Date.now(), data: "invalid" }),
    );
    window.localStorage.setItem(WARDS_CACHE_KEY, "{not-json");
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const { prefetchVietnamDivisions } = await loadClient();

    await prefetchVietnamDivisions();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(window.localStorage.getItem(PROVINCES_CACHE_KEY) ?? "{}")).toEqual(
      expect.objectContaining({ schemaVersion: 2, data: provinces }),
    );
  });

  it.each([[], {}, [{ code: 1, name: " " }], [{ code: -1, name: "Bad" }], [{ code: 1.5, name: "Bad" }], [{ code: 1, name: "Good" }, { code: 1, name: "Duplicate" }], [{ code: 1, name: "Good" }, null]].map((payload) => [payload]))("rejects invalid/empty provider data %j without caching it", async (payload) => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => payload })));
    const client = await loadClient();
    await expect(client.retryVietnamDivisions("provinces")).rejects.toThrow("không hợp lệ");
    expect(window.localStorage.getItem(PROVINCES_CACHE_KEY)).toBeNull();
  });

  it("requires valid ward parents and never replaces a good cache on failure", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();
    await client.prefetchVietnamDivisions();
    const before = window.localStorage.getItem(WARDS_CACHE_KEY);
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => [{ code: 5, name: "Phường lạ" }] }));
    await expect(client.retryVietnamDivisions("wards")).rejects.toThrow("không hợp lệ");
    expect(window.localStorage.getItem(WARDS_CACHE_KEY)).toBe(before);
    await expect(client.searchWards(48)).resolves.toHaveLength(1);
  });

  it("rejects fresh but empty/malformed caches, then permits a retry after outage", async () => {
    window.localStorage.setItem(PROVINCES_CACHE_KEY, JSON.stringify({ schemaVersion: 2, fetchedAt: Date.now(), data: [] }));
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();
    await expect(client.retryVietnamDivisions("provinces")).rejects.toThrow("offline");
    fetchMock.mockImplementation(createFetchMock());
    await expect(client.searchProvinces("TP.HCM")).resolves.toEqual([provinces[1]]);
  });

  it("explicit retry bypasses a fresh cache and deduplicates concurrent retries", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    const client = await loadClient();
    await client.prefetchVietnamDivisions();
    const updated = [{ code: 1, name: "Thành phố Hà Nội" }];
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => updated }));
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([client.retryVietnamDivisions("provinces"), client.retryVietnamDivisions("provinces")]);
    await expect(client.searchProvinces("HN")).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds an unresponsive transport, aborts it, then permits fresh retry", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() => new Promise<never>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();
    const request = client.retryVietnamDivisions("provinces");
    const rejection = expect(request).rejects.toThrow("Hết thời gian");
    await vi.advanceTimersByTimeAsync(client.DIVISIONS_REQUEST_TIMEOUT_MS);
    await rejection;
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[1].signal?.aborted).toBe(true);
    vi.stubGlobal("fetch", createFetchMock());
    await expect(client.retryVietnamDivisions("provinces")).resolves.toEqual(provinces);
  });
});
