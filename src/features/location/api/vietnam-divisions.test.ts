import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchProvinces, searchWards } from "./vietnam-divisions";

describe("Vietnam divisions API client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches v2 provinces with the search query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ code: 48, name: "Thành phố Đà Nẵng" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchProvinces("da nang")).resolves.toEqual([
      { code: 48, name: "Thành phố Đà Nẵng" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://provinces.open-api.vn/api/v2/p/?search=da+nang",
      expect.objectContaining({ cache: "force-cache" }),
    );
  });

  it("searches v2 wards by province", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ code: 20194, name: "Phường Hải Châu", province_code: 48 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchWards(48, "hai chau")).resolves.toEqual([
      { code: 20194, name: "Phường Hải Châu", provinceCode: 48 },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://provinces.open-api.vn/api/v2/w/?province=48&search=hai+chau",
      expect.objectContaining({ cache: "force-cache" }),
    );
  });
});
