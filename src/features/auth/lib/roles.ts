export const APP_ROLES = ["citizen", "relief", "admin"] as const;

export type UserRole = (typeof APP_ROLES)[number];

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return APP_ROLES.includes(normalized as UserRole)
    ? (normalized as UserRole)
    : null;
}

export function canManageReports(role: UserRole | null | undefined): boolean {
  return role === "relief" || role === "admin";
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return role === "relief" || role === "admin";
}

export function canDeleteUsers(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
