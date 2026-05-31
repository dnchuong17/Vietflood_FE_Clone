import { normalizeRole, type UserRole } from "../../auth/lib/roles";
import type { UserUpdateValues } from "../api/users";

export function buildUserProfileUpdatePayload(
  values: UserUpdateValues,
): Omit<UserUpdateValues, "role"> {
  const profileValues = { ...values };
  delete profileValues.role;
  return profileValues;
}

export function buildUserRoleAssignmentPayload({
  actorRole,
  currentUserId,
  targetUserId,
  nextRole,
}: {
  actorRole: UserRole | null | undefined;
  currentUserId?: number;
  targetUserId?: number;
  nextRole: unknown;
}): Pick<UserUpdateValues, "role"> | null {
  const role = normalizeRole(nextRole);
  if (actorRole !== "admin" || !role || !targetUserId) {
    return null;
  }

  if (currentUserId !== undefined && currentUserId === targetUserId) {
    return null;
  }

  return { role };
}
