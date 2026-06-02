import { normalizeRole, type UserRole } from "../../auth/lib/roles";
import type { ManagedUser } from "../api/users";

export type UsersOverviewSummary = {
  total: number;
  filtered: number;
  citizen: number;
  relief: number;
  admin: number;
};

export function toOverviewUserRole(value: unknown): UserRole {
  const normalized = normalizeRole(value);
  return normalized ?? "citizen";
}

export function buildUsersOverviewSummary(
  users: ManagedUser[],
  filteredCount = users.length,
): UsersOverviewSummary {
  const summary: UsersOverviewSummary = {
    total: users.length,
    filtered: filteredCount,
    citizen: 0,
    relief: 0,
    admin: 0,
  };

  for (const user of users) {
    summary[toOverviewUserRole(user.role)] += 1;
  }

  return summary;
}

export function formatUsersLastSyncedAt(
  value?: string | null,
  fallback = "Chua dong bo",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
