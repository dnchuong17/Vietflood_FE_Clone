import { describe, expect, it } from "vitest";

import {
  buildUserProfileUpdatePayload,
  buildUserRoleAssignmentPayload,
} from "./rbac";

describe("user RBAC helpers", () => {
  it("omits role from profile edits", () => {
    expect(
      buildUserProfileUpdatePayload({
        first_name: "An",
        phone: "0900000000",
        role: "admin",
      }),
    ).toEqual({
      first_name: "An",
      phone: "0900000000",
    });
  });

  it("allows admins to assign exactly one backend role to another user", () => {
    expect(
      buildUserRoleAssignmentPayload({
        actorRole: "admin",
        currentUserId: 1,
        targetUserId: 2,
        nextRole: "relief",
      }),
    ).toEqual({ role: "relief" });
  });

  it("blocks non-admin role assignment and own-role lockout", () => {
    expect(
      buildUserRoleAssignmentPayload({
        actorRole: "relief",
        currentUserId: 1,
        targetUserId: 2,
        nextRole: "admin",
      }),
    ).toBeNull();

    expect(
      buildUserRoleAssignmentPayload({
        actorRole: "admin",
        currentUserId: 1,
        targetUserId: 1,
        nextRole: "citizen",
      }),
    ).toBeNull();
  });
});
