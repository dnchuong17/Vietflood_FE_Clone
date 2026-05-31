"use client";

import { useEffect, useMemo } from "react";
import { RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { APP_ROLES, canDeleteUsers, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import {
  deleteUser,
  listUsers,
  updateUser,
  type ManagedUser,
  type UserUpdateValues,
} from "@/features/users/api/users";
import {
  buildUserProfileUpdatePayload,
  buildUserRoleAssignmentPayload,
} from "@/features/users/lib/rbac";
import { useUsersStore } from "@/features/users/store/users-store";

function displayName(user: ManagedUser): string {
  const name = [user.first_name, user.middle_name, user.last_name]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return name || user.username || `User #${user.id ?? "-"}`;
}

function isSameUser(user: ManagedUser, username?: string): boolean {
  return Boolean(user.username && username && user.username === username);
}

export function UserManagement() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const canDelete = canDeleteUsers(role);
  const users = useUsersStore((state) => state.users);
  const query = useUsersStore((state) => state.query);
  const roleFilter = useUsersStore((state) => state.roleFilter);
  const selectedUser = useUsersStore((state) => state.selectedUser);
  const form = useUsersStore((state) => state.form);
  const isLoading = useUsersStore((state) => state.isLoading);
  const isSaving = useUsersStore((state) => state.isSaving);
  const isSavingRole = useUsersStore((state) => state.isSavingRole);
  const setUsers = useUsersStore((state) => state.setUsers);
  const setQuery = useUsersStore((state) => state.setQuery);
  const setRoleFilter = useUsersStore((state) => state.setRoleFilter);
  const selectUser = useUsersStore((state) => state.selectUser);
  const setField = useUsersStore((state) => state.setField);
  const setLoading = useUsersStore((state) => state.setLoading);
  const setSaving = useUsersStore((state) => state.setSaving);
  const setSavingRole = useUsersStore((state) => state.setSavingRole);

  async function loadUsers() {
    try {
      setLoading(true);
      setUsers(await listUsers());
    } catch (error) {
      showAlert({
        title: "Users unavailable",
        description:
          error instanceof Error ? error.message : "Could not load users.",
        variant: "error",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((user) => {
      const userRole = normalizeRole(user.role) ?? "citizen";
      if (roleFilter !== "all" && userRole !== roleFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [
        user.id,
        user.username,
        user.email,
        user.phone,
        displayName(user),
        userRole,
        user.province,
        user.ward,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [query, roleFilter, users]);

  function updateField<T extends keyof UserUpdateValues>(
    field: T,
    value: UserUpdateValues[T],
  ) {
    setField(field, value);
  }

  async function handleSave() {
    if (!selectedUser?.id) {
      return;
    }

    try {
      setSaving(true);
      const payload = buildUserProfileUpdatePayload(form);
      await updateUser(selectedUser.id, payload);
      showAlert({
        title: "User updated",
        description: "User profile changes were saved.",
        variant: "success",
      });
      selectUser(null);
      await loadUsers();
    } catch (error) {
      showAlert({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Could not update user.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRole() {
    if (!selectedUser?.id) {
      return;
    }

    const payload = buildUserRoleAssignmentPayload({
      actorRole: role,
      currentUserId: isSameUser(selectedUser, identity?.username)
        ? selectedUser.id
        : undefined,
      targetUserId: selectedUser.id,
      nextRole: form.role,
    });

    if (!payload) {
      showAlert({
        title: "Role unchanged",
        description: "Only admins can assign another user's role.",
        variant: "info",
      });
      return;
    }

    try {
      setSavingRole(true);
      await updateUser(selectedUser.id, payload);
      showAlert({
        title: "Role assigned",
        description: `User role was updated to ${payload.role}.`,
        variant: "success",
      });
      await loadUsers();
      selectUser({ ...selectedUser, role: payload.role });
    } catch (error) {
      showAlert({
        title: "Role update failed",
        description:
          error instanceof Error ? error.message : "Could not update user role.",
        variant: "error",
      });
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (!user.id || !window.confirm(`Delete ${displayName(user)}?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      showAlert({
        title: "User deleted",
        description: "The account was removed.",
        variant: "success",
      });
      selectUser(null);
      await loadUsers();
    } catch (error) {
      showAlert({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Could not delete user.",
        variant: "error",
      });
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-3">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Search users
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Name, username, email, phone"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Role
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="all">All roles</option>
              {APP_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[4rem_1fr_8rem] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 md:grid-cols-[4rem_1fr_1fr_8rem]">
            <span>ID</span>
            <span>User</span>
            <span className="hidden md:block">Contact</span>
            <span>Role</span>
          </div>
          {isLoading ? (
            <div className="p-5 text-sm text-slate-600">Loading users...</div>
          ) : null}
          {!isLoading &&
            filteredUsers.map((user) => {
              const userRole = normalizeRole(user.role) ?? "citizen";
              return (
                <button
                  key={user.id ?? user.username}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={`grid w-full grid-cols-[4rem_1fr_8rem] gap-2 border-b border-slate-100 px-3 py-3 text-left text-sm transition last:border-b-0 hover:bg-sky-50 md:grid-cols-[4rem_1fr_1fr_8rem] ${
                    selectedUser?.id === user.id ? "bg-sky-50" : ""
                  }`}
                >
                  <span className="font-semibold text-slate-500">
                    {user.id ?? "-"}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950">
                      {displayName(user)}
                    </span>
                    <span className="text-slate-500">@{user.username}</span>
                  </span>
                  <span className="hidden text-slate-600 md:block">
                    {user.email ?? "-"}
                    <br />
                    {user.phone ?? "-"}
                  </span>
                  <span className="font-semibold text-sky-700">{userRole}</span>
                </button>
              );
            })}
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {selectedUser ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Edit user
              </p>
              <h2 className="text-lg font-bold text-slate-950">
                {displayName(selectedUser)}
              </h2>
            </div>

            {[
              ["first_name", "First name"],
              ["middle_name", "Middle name"],
              ["last_name", "Last name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["province", "Province"],
              ["ward", "Ward"],
              ["address_line", "Address"],
            ].map(([field, label]) => (
              <label
                key={field}
                className="grid gap-1 text-sm font-semibold text-slate-700"
              >
                {label}
                <input
                  value={String(form[field as keyof UserUpdateValues] ?? "")}
                  onChange={(event) =>
                    updateField(
                      field as keyof UserUpdateValues,
                      event.target.value as never,
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>
            ))}

            {role === "admin" ? (
              <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-slate-950">RBAC</p>
                    <p className="text-xs text-slate-600">
                      Assign one backend role: citizen, relief, or admin.
                    </p>
                  </div>
                </div>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Assigned role
                  <select
                    value={form.role ?? "citizen"}
                    disabled={isSameUser(selectedUser, identity?.username) || isSavingRole}
                    onChange={(event) =>
                      updateField("role", normalizeRole(event.target.value) ?? "citizen")
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {APP_ROLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                {isSameUser(selectedUser, identity?.username) ? (
                  <p className="mt-2 text-xs text-amber-700">
                    You cannot change your own admin role from this screen.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleAssignRole()}
                  disabled={isSameUser(selectedUser, identity?.username) || isSavingRole}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {isSavingRole ? "Assigning..." : "Assign role"}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Current role:{" "}
                <span className="font-bold text-slate-900">
                  {normalizeRole(selectedUser.role) ?? "citizen"}
                </span>
                . Role assignment is available to admin users only.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save
              </button>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(selectedUser)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">
            Select a user to view or edit details.
          </div>
        )}
      </aside>
    </div>
  );
}
