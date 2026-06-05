const VIETNAM_DIVISIONS_API_URL = "https://provinces.open-api.vn/api/v2";
const CACHE_SCHEMA_VERSION = 2;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PROVINCES_CACHE_KEY = "vietflood.divisions.v2.provinces";
const WARDS_CACHE_KEY = "vietflood.divisions.v2.wards";

type UnknownRecord = Record<string, unknown>;

type CacheEntry = {
  schemaVersion: typeof CACHE_SCHEMA_VERSION;
  fetchedAt: number;
  data: DivisionOption[];
};

export type DivisionOption = {
  code: number;
  name: string;
  provinceCode?: number;
};

let provincesMemoryCache: CacheEntry | null | undefined;
let wardsMemoryCache: CacheEntry | null | undefined;
let provincesInFlight: Promise<DivisionOption[]> | null = null;
let wardsInFlight: Promise<DivisionOption[]> | null = null;

function toDivisionOption(item: unknown): DivisionOption | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as UnknownRecord;
  if (typeof record.code !== "number" || typeof record.name !== "string") {
    return null;
  }

  const provinceCode =
    typeof record.provinceCode === "number"
      ? record.provinceCode
      : typeof record.province_code === "number"
        ? record.province_code
        : undefined;

  return {
    code: record.code,
    name: record.name,
    ...(provinceCode === undefined ? {} : { provinceCode }),
  };
}

function normalizeDivisionList(data: unknown): DivisionOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(toDivisionOption)
    .filter((item): item is DivisionOption => Boolean(item));
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCache(key: string): CacheEntry | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const serialized = storage.getItem(key);
    if (!serialized) {
      return null;
    }

    const parsed = JSON.parse(serialized) as UnknownRecord;
    if (
      parsed.schemaVersion !== CACHE_SCHEMA_VERSION ||
      typeof parsed.fetchedAt !== "number" ||
      !Number.isFinite(parsed.fetchedAt) ||
      !Array.isArray(parsed.data)
    ) {
      return null;
    }

    const data = normalizeDivisionList(parsed.data);
    if (data.length !== parsed.data.length) {
      return null;
    }

    return {
      schemaVersion: CACHE_SCHEMA_VERSION,
      fetchedAt: parsed.fetchedAt,
      data,
    };
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CacheEntry): void {
  try {
    getStorage()?.setItem(key, JSON.stringify(entry));
  } catch {
    // Memory cache still keeps the current session fast when storage is unavailable.
  }
}

function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

function getProvincesCache(): CacheEntry | null {
  if (provincesMemoryCache === undefined) {
    provincesMemoryCache = readCache(PROVINCES_CACHE_KEY);
  }

  return provincesMemoryCache;
}

function getWardsCache(): CacheEntry | null {
  if (wardsMemoryCache === undefined) {
    wardsMemoryCache = readCache(WARDS_CACHE_KEY);
  }

  return wardsMemoryCache;
}

async function fetchDivisions(path: string): Promise<DivisionOption[]> {
  const response = await fetch(`${VIETNAM_DIVISIONS_API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải dữ liệu địa giới hành chính.");
  }

  return normalizeDivisionList(await response.json());
}

function refreshProvinces(): Promise<DivisionOption[]> {
  if (provincesInFlight) {
    return provincesInFlight;
  }

  const request = fetchDivisions("/p/")
    .then((data) => {
      const entry: CacheEntry = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        fetchedAt: Date.now(),
        data,
      };
      provincesMemoryCache = entry;
      writeCache(PROVINCES_CACHE_KEY, entry);
      return data;
    })
    .finally(() => {
      if (provincesInFlight === request) {
        provincesInFlight = null;
      }
    });

  provincesInFlight = request;
  return request;
}

function refreshWards(): Promise<DivisionOption[]> {
  if (wardsInFlight) {
    return wardsInFlight;
  }

  const request = fetchDivisions("/w/")
    .then((data) => {
      const entry: CacheEntry = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        fetchedAt: Date.now(),
        data,
      };
      wardsMemoryCache = entry;
      writeCache(WARDS_CACHE_KEY, entry);
      return data;
    })
    .finally(() => {
      if (wardsInFlight === request) {
        wardsInFlight = null;
      }
    });

  wardsInFlight = request;
  return request;
}

function loadProvinces(): Promise<DivisionOption[]> {
  const cached = getProvincesCache();
  if (!cached) {
    return refreshProvinces();
  }

  if (!isFresh(cached)) {
    void refreshProvinces().catch(() => undefined);
  }

  return Promise.resolve(cached.data);
}

function loadWards(): Promise<DivisionOption[]> {
  const cached = getWardsCache();
  if (!cached) {
    return refreshWards();
  }

  if (!isFresh(cached)) {
    void refreshWards().catch(() => undefined);
  }

  return Promise.resolve(cached.data);
}

function startDivisionLoads() {
  return {
    provinces: loadProvinces(),
    wards: loadWards(),
  };
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function filterByName(options: DivisionOption[], search: string): DivisionOption[] {
  const normalizedSearch = normalizeSearch(search);
  if (!normalizedSearch) {
    return options;
  }

  return options.filter((option) => normalizeSearch(option.name).includes(normalizedSearch));
}

export async function prefetchVietnamDivisions(): Promise<void> {
  const loads = startDivisionLoads();
  await Promise.all([loads.provinces, loads.wards]);
}

export async function searchProvinces(search = ""): Promise<DivisionOption[]> {
  const { provinces, wards } = startDivisionLoads();
  void wards.catch(() => undefined);
  return filterByName(await provinces, search);
}

export async function searchWards(
  provinceCode: number,
  search = "",
): Promise<DivisionOption[]> {
  const { provinces, wards } = startDivisionLoads();
  void provinces.catch(() => undefined);
  const provinceWards = (await wards).filter(
    (ward) => ward.provinceCode === provinceCode,
  );

  return filterByName(provinceWards, search);
}
