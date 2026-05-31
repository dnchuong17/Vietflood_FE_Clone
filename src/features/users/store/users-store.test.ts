import { afterEach, describe, expect, it } from "vitest";

import { resetUsersStore, useUsersStore } from "./users-store";

describe("users Zustand store", () => {
  afterEach(() => {
    resetUsersStore();
  });

  it("selects a user and prepares editable form state", () => {
    useUsersStore.getState().selectUser({
      id: 3,
      username: "admin-target",
      first_name: "Admin",
      last_name: "Target",
      phone: "0900000000",
      role: "admin",
    });
    useUsersStore.getState().setField("phone", "0911111111");
    useUsersStore.getState().setRoleFilter("admin");

    expect(useUsersStore.getState().selectedUser?.username).toBe("admin-target");
    expect(useUsersStore.getState().form).toEqual(
      expect.objectContaining({
        first_name: "Admin",
        last_name: "Target",
        phone: "0911111111",
        role: "admin",
      }),
    );
    expect(useUsersStore.getState().roleFilter).toBe("admin");
  });
});
