"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";

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

function displayName(user: ManagedUser): string {
  const name = [user.first_name, user.middle_name, user.last_name]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return name || user.username || `User #${user.id ?? "-"}`;
}

export function UserManagement() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const canDelete = canDeleteUsers(role);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | string>("all");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserUpdateValues>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadUsers() {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setForm({});
      return;
    }

    setForm({
      first_name: selectedUser.first_name ?? "",
      middle_name: selectedUser.middle_name ?? "",
      last_name: selectedUser.last_name ?? "",
      email: selectedUser.email ?? "",
      phone: selectedUser.phone ?? "",
      province: selectedUser.province ?? "",
      ward: selectedUser.ward ?? "",
      address_line: selectedUser.address_line ?? "",
      role: normalizeRole(selectedUser.role) ?? "citizen",
    });
  }, [selectedUser]);

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
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!selectedUser?.id) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = { ...form };
      if (role !== "admin") {
        delete payload.role;
      }
      await updateUser(selectedUser.id, payload);
      showAlert({
        title: "User updated",
        description: "User profile changes were saved.",
        variant: "success",
      });
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      showAlert({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Could not update user.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
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
      setSelectedUser(null);
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
                  onClick={() => setSelectedUser(user)}
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
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Role
                <select
                  value={form.role ?? "citizen"}
                  onChange={(event) =>
                    updateField("role", normalizeRole(event.target.value) ?? "citizen")
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                >
                  {APP_ROLES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

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
