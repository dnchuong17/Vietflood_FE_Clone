import type { FloodReport } from "@/features/reports/api/reports";

function normalizeSuggestionText(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function reportAddressLine(report: Pick<FloodReport, "addressLine" | "address_line">): string {
  return (report.addressLine ?? report.address_line ?? "").trim();
}

function matchesSelectedLocation(
  report: Pick<FloodReport, "province" | "ward">,
  selected: { province: string; ward: string },
): boolean {
  const selectedProvince = normalizeSuggestionText(selected.province);
  const selectedWard = normalizeSuggestionText(selected.ward);

  return Boolean(
    (!selectedProvince || normalizeSuggestionText(report.province) === selectedProvince) &&
      (!selectedWard || normalizeSuggestionText(report.ward) === selectedWard),
  );
}

export function buildAddressSuggestions({
  query,
  province,
  ward,
  reports,
  limit = 4,
}: {
  query: string;
  province: string;
  ward: string;
  reports: Array<Pick<FloodReport, "addressLine" | "address_line" | "province" | "ward">>;
  limit?: number;
}): string[] {
  const normalizedQuery = normalizeSuggestionText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();

  for (const report of reports) {
    const address = reportAddressLine(report);
    if (!address || !matchesSelectedLocation(report, { province, ward })) {
      continue;
    }
    if (!normalizeSuggestionText(address).includes(normalizedQuery)) {
      continue;
    }
    suggestions.add(address);
  }

  return Array.from(suggestions).slice(0, limit);
}
