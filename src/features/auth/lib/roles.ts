export const APP_ROLES = ["citizen", "relief", "admin"] as const;

export type UserRole = (typeof APP_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Người dân",
  relief: "Đội cứu trợ",
  admin: "Quản trị viên",
};

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

export function getUserRoleLabel(role: UserRole | null | undefined): string {
  return role ? USER_ROLE_LABELS[role] : "-";
}
