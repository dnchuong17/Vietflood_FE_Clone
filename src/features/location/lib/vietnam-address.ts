import type { DivisionOption } from "../api/vietnam-divisions";

export type VietnamAddressValue = { province: string; ward: string };

/** Search aliases only: never use this output as a persisted address. */
export function normalizeVietnamDivision(value: string): string {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d").replace(/[.,]/g, " ").trim().replace(/\s+/g, " ")
    .replace(/^(?:thanh pho|tp|tinh|phuong|xa|dac khu)\s+/, "")
    .replace(/^(?:hcm|tphcm|tp hcm)$/, "ho chi minh")
    .replace(/^hn$/, "ha noi");
}

export function filterVietnamDivisions(options: DivisionOption[], query: string): DivisionOption[] {
  const search = normalizeVietnamDivision(query);
  return search ? options.filter((option) => normalizeVietnamDivision(option.name).includes(search)) : options;
}

/** Resolve full names/aliases exactly, never by substring or a first search hit. */
export function resolveVietnamDivision(options: DivisionOption[], value: string): DivisionOption | undefined {
  const normalized = normalizeVietnamDivision(value);
  if (!normalized) return undefined;
  const matches = options.filter((option) => normalizeVietnamDivision(option.name) === normalized);
  return matches.length === 1 ? matches[0] : undefined;
}

export function changeVietnamProvince(value: VietnamAddressValue, province: string, options: DivisionOption[] = []): VietnamAddressValue {
  // Even legacy spellings must survive reselecting the same committed province.
  if (province === value.province) return value;
  const previous = resolveVietnamDivision(options, value.province);
  const next = resolveVietnamDivision(options, province);
  return { province, ward: previous && next && previous.code === next.code ? value.ward : "" };
}
