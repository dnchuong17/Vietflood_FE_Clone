const VIETNAM_DIVISIONS_API_URL = "https://provinces.open-api.vn/api/v2";

type UnknownRecord = Record<string, unknown>;

type DivisionResponse = {
  code?: number;
  name?: string;
  province_code?: number;
};

export type DivisionOption = {
  code: number;
  name: string;
  provinceCode?: number;
};

function toDivisionOption(item: DivisionResponse): DivisionOption | null {
  if (typeof item.code !== "number" || typeof item.name !== "string") {
    return null;
  }

  return {
    code: item.code,
    name: item.name,
    provinceCode: typeof item.province_code === "number" ? item.province_code : undefined,
  };
}

function normalizeDivisionList(data: unknown): DivisionOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => toDivisionOption(item as UnknownRecord))
    .filter((item): item is DivisionOption => Boolean(item));
}

async function fetchDivisions(path: string, params: URLSearchParams): Promise<DivisionOption[]> {
  const query = params.toString();
  const response = await fetch(
    `${VIETNAM_DIVISIONS_API_URL}${path}${query ? `?${query}` : ""}`,
    { cache: "force-cache" },
  );

  if (!response.ok) {
    throw new Error("Không thể tải dữ liệu địa giới hành chính.");
  }

  return normalizeDivisionList(await response.json());
}

export function searchProvinces(search = ""): Promise<DivisionOption[]> {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  return fetchDivisions("/p/", params);
}

export function searchWards(provinceCode: number, search = ""): Promise<DivisionOption[]> {
  const params = new URLSearchParams({ province: String(provinceCode) });
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  return fetchDivisions("/w/", params);
}
