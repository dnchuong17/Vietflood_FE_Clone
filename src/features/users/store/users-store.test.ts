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

  it("tracks the last successful sync time and clears it on reset", () => {
    const syncedAt = "2026-06-02T15:00:00.000Z";

    useUsersStore.getState().setUsers([{ id: 1, username: "citizen-a" }]);
    useUsersStore.getState().setLastSyncedAt(syncedAt);

    expect(useUsersStore.getState().lastSyncedAt).toBe(syncedAt);

    resetUsersStore();

    expect(useUsersStore.getState().lastSyncedAt).toBeNull();
  });

  it("keeps selected-user report state scoped to the selected user", () => {
    useUsersStore.getState().selectUser({ id: 7, username: "citizen-a" });
    useUsersStore.getState().setSelectedUserReports([
      { id: 11, userId: 7, description: "needs support" },
    ]);
    useUsersStore.getState().setSelectedUserReportsError("load failed");
    useUsersStore.getState().setLoadingSelectedUserReports(true);

    expect(useUsersStore.getState().selectedUserReports).toHaveLength(1);
    expect(useUsersStore.getState().selectedUserReportsError).toBe("load failed");
    expect(useUsersStore.getState().isLoadingSelectedUserReports).toBe(true);

    useUsersStore.getState().selectUser({ id: 8, username: "citizen-b" });

    expect(useUsersStore.getState().selectedUserReports).toEqual([]);
    expect(useUsersStore.getState().selectedUserReportsError).toBeNull();
    expect(useUsersStore.getState().isLoadingSelectedUserReports).toBe(false);
  });
});
