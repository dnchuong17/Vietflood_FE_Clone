"use client";

import { useEffect, useMemo } from "react";
import {
  Clock,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APP_ROLES,
  canDeleteUsers,
  getUserRoleLabel,
  normalizeRole,
} from "@/features/auth/lib/roles";
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
import {
  buildUsersOverviewSummary,
  formatUsersLastSyncedAt,
  toOverviewUserRole,
} from "@/features/users/lib/overview";
import { useUsersStore } from "@/features/users/store/users-store";
import { cn } from "@/lib/utils";

function displayName(user: ManagedUser): string {
  const name = [user.first_name, user.middle_name, user.last_name]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return name || user.username || `Người dùng #${user.id ?? "-"}`;
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
  const lastSyncedAt = useUsersStore((state) => state.lastSyncedAt);
  const isLoading = useUsersStore((state) => state.isLoading);
  const isSaving = useUsersStore((state) => state.isSaving);
  const isSavingRole = useUsersStore((state) => state.isSavingRole);
  const setUsers = useUsersStore((state) => state.setUsers);
  const setQuery = useUsersStore((state) => state.setQuery);
  const setRoleFilter = useUsersStore((state) => state.setRoleFilter);
  const selectUser = useUsersStore((state) => state.selectUser);
  const setLastSyncedAt = useUsersStore((state) => state.setLastSyncedAt);
  const setField = useUsersStore((state) => state.setField);
  const setLoading = useUsersStore((state) => state.setLoading);
  const setSaving = useUsersStore((state) => state.setSaving);
  const setSavingRole = useUsersStore((state) => state.setSavingRole);

  async function loadUsers() {
    try {
      setLoading(true);
      const loadedUsers = await listUsers();
      setUsers(loadedUsers);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      showAlert({
        title: "Không thể tải người dùng",
        description:
          error instanceof Error ? error.message : "Không thể tải danh sách người dùng.",
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
      const userRole = toOverviewUserRole(user.role);
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

  const overviewSummary = useMemo(
    () => buildUsersOverviewSummary(users, filteredUsers.length),
    [filteredUsers.length, users],
  );

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
        title: "Đã cập nhật người dùng",
        description: "Các thay đổi hồ sơ người dùng đã được lưu.",
        variant: "success",
      });
      selectUser(null);
      await loadUsers();
    } catch (error) {
      showAlert({
        title: "Cập nhật thất bại",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật người dùng.",
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
        title: "Vai trò chưa đổi",
        description: "Chỉ quản trị viên mới có thể gán vai trò cho người dùng khác.",
        variant: "info",
      });
      return;
    }

    try {
      setSavingRole(true);
      await updateUser(selectedUser.id, payload);
      showAlert({
        title: "Đã gán vai trò",
        description: `Vai trò người dùng đã được cập nhật thành ${getUserRoleLabel(payload.role)}.`,
        variant: "success",
      });
      await loadUsers();
      selectUser({ ...selectedUser, role: payload.role });
    } catch (error) {
      showAlert({
        title: "Cập nhật vai trò thất bại",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật vai trò người dùng.",
        variant: "error",
      });
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (!user.id || !window.confirm(`Xoá ${displayName(user)}?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      showAlert({
        title: "Đã xoá người dùng",
        description: "Tài khoản đã được xoá.",
        variant: "success",
      });
      selectUser(null);
      await loadUsers();
    } catch (error) {
      showAlert({
        title: "Xoá thất bại",
        description:
          error instanceof Error ? error.message : "Không thể xoá người dùng.",
        variant: "error",
      });
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-3">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Danh bạ điều hành
                </p>
                <h2 className="text-lg font-bold text-card-foreground">
                  Tổng quan người dùng
                </h2>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <Clock aria-hidden="true" />
                Đồng bộ {formatUsersLastSyncedAt(lastSyncedAt, "chưa đồng bộ")}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Tổng người dùng",
                  value: overviewSummary.total,
                  icon: Users,
                },
                {
                  label: "Đang hiển thị",
                  value: overviewSummary.filtered,
                  icon: UserCheck,
                },
                {
                  label: getUserRoleLabel("citizen"),
                  value: overviewSummary.citizen,
                  icon: UserRound,
                },
                {
                  label: getUserRoleLabel("relief"),
                  value: overviewSummary.relief,
                  icon: ShieldCheck,
                },
                {
                  label: getUserRoleLabel("admin"),
                  value: overviewSummary.admin,
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-md border bg-muted/40 p-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-card-foreground">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <Field>
              <FieldLabel>Tìm người dùng</FieldLabel>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tên, tên đăng nhập, thư điện tử, số điện thoại"
              />
            </Field>
            <Field>
              <FieldLabel>Vai trò</FieldLabel>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    {APP_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {getUserRoleLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadUsers()}
            >
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Làm mới
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[4rem_1fr_8rem] border-b border-border bg-muted px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground md:grid-cols-[4rem_1fr_1fr_8rem]">
            <span>Mã</span>
            <span>Người dùng</span>
            <span className="hidden md:block">Liên hệ</span>
            <span>Vai trò</span>
          </div>
          {isLoading ? (
            <LoadingBar
              title="Đang tải người dùng..."
              description="Cập nhật danh sách tài khoản và vai trò mới nhất."
              className="m-3"
            />
          ) : null}
          {!isLoading &&
            filteredUsers.map((user) => {
              const userRole = toOverviewUserRole(user.role);
              return (
                <button
                  key={user.id ?? user.username}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={cn(
                    "grid w-full grid-cols-[4rem_1fr_8rem] gap-2 border-b border-border px-3 py-3 text-left text-sm transition last:border-b-0 hover:bg-accent md:grid-cols-[4rem_1fr_1fr_8rem]",
                    selectedUser?.id === user.id && "bg-accent",
                  )}
                >
                  <span className="font-semibold text-muted-foreground">
                    {user.id ?? "-"}
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">
                      {displayName(user)}
                    </span>
                    <span className="text-muted-foreground">@{user.username}</span>
                  </span>
                  <span className="hidden text-muted-foreground md:block">
                    {user.email ?? "-"}
                    <br />
                    {user.phone ?? "-"}
                  </span>
                  <span>
                    <Badge variant="secondary">
                    {getUserRoleLabel(userRole)}
                    </Badge>
                  </span>
                </button>
              );
            })}
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
        {selectedUser ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Chỉnh sửa người dùng
              </p>
              <h2 className="text-lg font-bold text-card-foreground">
                {displayName(selectedUser)}
              </h2>
            </div>

            <FieldGroup className="gap-3">
              {[
                ["first_name", "Tên"],
                ["middle_name", "Tên đệm"],
                ["last_name", "Họ"],
                ["email", "Địa chỉ thư điện tử"],
                ["phone", "Số điện thoại"],
                ["province", "Tỉnh/Thành phố"],
                ["ward", "Phường/Xã"],
                ["address_line", "Địa chỉ"],
              ].map(([field, label]) => (
                <Field key={field}>
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    value={String(form[field as keyof UserUpdateValues] ?? "")}
                    onChange={(event) =>
                      updateField(
                        field as keyof UserUpdateValues,
                        event.target.value as never,
                      )
                    }
                  />
                </Field>
              ))}
            </FieldGroup>

            {role === "admin" ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Phân quyền</p>
                    <p className="text-xs text-muted-foreground">
                      Gán một vai trò từ máy chủ: người dân, đội cứu trợ hoặc quản trị viên.
                    </p>
                  </div>
                </div>

                <Field>
                  <FieldLabel>Vai trò được gán</FieldLabel>
                  <Select
                    value={form.role ?? "citizen"}
                    disabled={isSameUser(selectedUser, identity?.username) || isSavingRole}
                    onValueChange={(value) =>
                      updateField("role", normalizeRole(value) ?? "citizen")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {APP_ROLES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {getUserRoleLabel(item)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                {isSameUser(selectedUser, identity?.username) ? (
                  <p className="mt-2 text-xs text-warning">
                    Bạn không thể đổi vai trò quản trị của chính mình từ màn hình này.
                  </p>
                ) : null}

                <Button
                  type="button"
                  onClick={() => void handleAssignRole()}
                  disabled={isSameUser(selectedUser, identity?.username) || isSavingRole}
                  className="mt-3"
                >
                  <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                  {isSavingRole ? "Đang gán..." : "Gán vai trò"}
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                Vai trò hiện tại:{" "}
                <span className="font-bold text-foreground">
                  {getUserRoleLabel(normalizeRole(selectedUser.role) ?? "citizen")}
                </span>
                . Chỉ quản trị viên mới có thể gán vai trò.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                <Save data-icon="inline-start" aria-hidden="true" />
                Lưu
              </Button>
              {canDelete ? (
                <Button
                  type="button"
                  onClick={() => void handleDelete(selectedUser)}
                  variant="destructive"
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xoá
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">
            Chọn một người dùng để xem hoặc chỉnh sửa chi tiết.
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
