"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  BellIcon as Bell,
  BookOpenIcon as BookOpen,
  CalendarDaysIcon as CalendarDays,
  CheckIcon as Save,
  EnvelopeIcon as Mail,
  EyeIcon as Eye,
  EyeSlashIcon as EyeOff,
  KeyIcon as KeyRound,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  QuestionMarkCircleIcon as HelpCircle,
  UserCircleIcon as UserCircle,
} from "@heroicons/react/24/solid";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  apiPath,
  apiPut,
  apiRequest,
  parseJsonResponse,
} from "@/features/auth/lib/api-client";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { getUserRoleLabel, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import type { AuthProfile } from "@/features/auth/types/auth";
import { buildProfileHomeSummary } from "@/features/home/lib/profile-home-summary";
import { VietnamAddressPicker } from "@/features/location/components/vietnam-address-picker";
import {
  buildChangePasswordPayload,
  validateChangePasswordForm,
} from "@/features/profile/lib/password";
import { getProfileHomeActions } from "@/features/profile/lib/profile-actions";
import {
  buildProfileAvatarUrl,
  buildProfileDisplayName,
  buildProfileLocation,
  formatProfileDate,
} from "@/features/profile/lib/profile-summary";
import { buildAddressSuggestions } from "@/features/reports/lib/address-suggestions";
import { listReports, type FloodReport } from "@/features/reports/api/reports";
import { useReportsStore } from "@/features/reports/store/reports-store";
import {
  useProfileStore,
  type ProfileForm,
} from "@/features/profile/store/profile-store";

function ProfileInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Icon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const identityRole = normalizeRole(identity?.role);
  const reports = useReportsStore((state) => state.reports);
  const [summaryReports, setSummaryReports] = useState<FloodReport[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const profile = useProfileStore((state) => state.profile);
  const form = useProfileStore((state) => state.form);
  const passwordForm = useProfileStore((state) => state.passwordForm);
  const visiblePasswords = useProfileStore((state) => state.visiblePasswords);
  const isLoading = useProfileStore((state) => state.isLoading);
  const isSaving = useProfileStore((state) => state.isSaving);
  const isChangingPassword = useProfileStore(
    (state) => state.isChangingPassword,
  );
  const setProfile = useProfileStore((state) => state.setProfile);
  const setForm = useProfileStore((state) => state.setForm);
  const setFormField = useProfileStore((state) => state.setFormField);
  const setPasswordField = useProfileStore((state) => state.setPasswordField);
  const resetPasswordForm = useProfileStore((state) => state.resetPasswordForm);
  const togglePasswordVisibility = useProfileStore(
    (state) => state.togglePasswordVisibility,
  );
  const setLoading = useProfileStore((state) => state.setLoading);
  const setSaving = useProfileStore((state) => state.setSaving);
  const setChangingPassword = useProfileStore(
    (state) => state.setChangingPassword,
  );

  async function loadProfile() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(apiPath("/auth/profile"), {
        method: "GET",
        credentials: "include",
      });
      const data = await parseJsonResponse<AuthProfile>(
        response,
        "Không thể tải hồ sơ.",
      );
      setProfile(data);
    } catch (error) {
      showAlert({
        title: "Không thể tải hồ sơ",
        description:
          error instanceof Error ? error.message : "Không thể tải hồ sơ.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadSummaryReports() {
      if (!identityRole) {
        setSummaryReports([]);
        return;
      }

      try {
        setIsLoadingSummary(true);
        const loadedReports = await listReports(identityRole);
        if (isCurrent) {
          setSummaryReports(loadedReports);
        }
      } catch {
        if (isCurrent) {
          setSummaryReports([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummaryReports();

    return () => {
      isCurrent = false;
    };
  }, [identityRole]);

  const addressSuggestions = useMemo(
    () =>
      buildAddressSuggestions({
        query: form.address_line,
        province: form.province,
        ward: form.ward,
        reports,
      }),
    [form.address_line, form.province, form.ward, reports],
  );
  const summary = useMemo(
    () => buildProfileHomeSummary({ identity, reports: summaryReports }),
    [identity, summaryReports],
  );
  const profileHomeRole = identityRole ?? normalizeRole(profile?.role) ?? "citizen";
  const profileHomeActions = useMemo(
    () => getProfileHomeActions(profileHomeRole),
    [profileHomeRole],
  );

  function updateField<T extends keyof ProfileForm>(field: T, value: ProfileForm[T]) {
    setFormField(field, value);
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await apiPut(apiPath("/auth/update"), form, {
        credentials: "include",
      });
      await parseJsonResponse<unknown>(response, "Không thể cập nhật hồ sơ.");
      showAlert({
        title: "Đã lưu hồ sơ",
        description: "Thông tin tài khoản của bạn đã được cập nhật.",
        variant: "success",
      });
      await loadProfile();
    } catch (error) {
      showAlert({
        title: "Cập nhật thất bại",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateChangePasswordForm(passwordForm);
    if (validationError) {
      showAlert({
        title: "Chưa đổi mật khẩu",
        description: validationError,
        variant: "error",
      });
      return;
    }

    try {
      setChangingPassword(true);
      const response = await apiPut(
        apiPath("/auth/change-password"),
        buildChangePasswordPayload(passwordForm),
        {
          credentials: "include",
        },
      );
      if (response.status === 404) {
        throw new Error(
          "Chức năng đổi mật khẩu chưa khả dụng cho đến khi máy chủ bật chức năng này.",
        );
      }
      await parseJsonResponse<unknown>(response, "Không thể đổi mật khẩu.");
      resetPasswordForm();
      showAlert({
        title: "Đã đổi mật khẩu",
        description: "Hãy dùng mật khẩu mới trong lần đăng nhập tiếp theo.",
        variant: "success",
      });
    } catch (error) {
      showAlert({
        title: "Chưa đổi mật khẩu",
        description:
          error instanceof Error
            ? error.message
            : "Không thể đổi mật khẩu.",
        variant: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingBar
        title="Đang tải hồ sơ..."
        description="Đang lấy thông tin tài khoản và địa chỉ đã lưu."
      />
    );
  }

  const displayName = buildProfileDisplayName(profile, "Chưa có dữ liệu");
  const profileRole = getUserRoleLabel(normalizeRole(profile?.role));
  const profileLocation = buildProfileLocation(profile, "Chưa cập nhật");
  const avatarUrl = buildProfileAvatarUrl(profile);
  const missingValue = "Chưa cập nhật";

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="workspace-stack min-w-0">
        <Card>
          <CardHeader>
            <div className="workspace-header flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Tổng quan cá nhân</CardTitle>
                <CardDescription>{summary.greeting}</CardDescription>
              </div>
              <Badge variant="secondary">
                {isLoadingSummary ? "Đang đồng bộ" : "Đã đồng bộ"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                  Công việc đang mở
                </div>
                <p className="mt-2 text-2xl font-bold text-card-foreground">
                  {summary.openTasks}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Bell className="size-4 text-primary" aria-hidden="true" />
                  Cảnh báo chưa đọc
                </div>
                <p className="mt-2 text-2xl font-bold text-card-foreground">
                  {summary.unreadAlerts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                aria-label={`Ảnh đại diện của ${displayName}`}
                className="size-16 shrink-0 rounded-full border bg-muted bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
              <div className="min-w-0">
                <CardTitle className="break-words">{displayName}</CardTitle>
                <CardDescription>{profile?.username ?? missingValue}</CardDescription>
                <Badge variant="secondary" className="mt-2 gap-1.5">
                  <UserCircle className="size-3.5" aria-hidden="true" />
                  {profileRole}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileInfoItem
                icon={Mail}
                label="Email"
                value={profile?.email ?? missingValue}
              />
              <ProfileInfoItem
                icon={Phone}
                label="Số điện thoại"
                value={profile?.phone ?? missingValue}
              />
              <ProfileInfoItem
                icon={MapPin}
                label="Địa chỉ"
                value={profileLocation}
              />
              <ProfileInfoItem
                icon={UserCircle}
                label="Ngày sinh"
                value={formatProfileDate(profile?.date_of_birth, missingValue)}
              />
              <ProfileInfoItem
                icon={CalendarDays}
                label="Ngày tạo"
                value={formatProfileDate(profile?.created_at, missingValue)}
              />
              <ProfileInfoItem
                icon={CalendarDays}
                label="Cập nhật"
                value={formatProfileDate(profile?.updated_at, missingValue)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Hồ sơ</CardTitle>
            </div>
            <CardDescription>
              Chỉnh sửa thông tin liên hệ và địa chỉ của tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="workspace-stack min-w-0">
              <FieldGroup className="gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["first_name", "Tên"],
                    ["middle_name", "Tên đệm"],
                    ["last_name", "Họ"],
                  ].map(([field, label]) => (
                    <Field key={field}>
                      <FieldLabel>{label}</FieldLabel>
                      <Input
                        value={form[field as keyof ProfileForm]}
                        onChange={(event) =>
                          updateField(field as keyof ProfileForm, event.target.value)
                        }
                      />
                    </Field>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["email", "Địa chỉ thư điện tử"],
                    ["phone", "Số điện thoại"],
                  ].map(([field, label]) => (
                    <Field key={field}>
                      <FieldLabel>{label}</FieldLabel>
                      <Input
                        value={form[field as keyof ProfileForm]}
                        onChange={(event) =>
                          updateField(field as keyof ProfileForm, event.target.value)
                        }
                      />
                    </Field>
                  ))}
                </div>

                <VietnamAddressPicker
                  key={profile?.id ?? profile?.username ?? "profile"}
                  idPrefix="profile"
                  value={{ province: form.province, ward: form.ward }}
                  onChange={(next) =>
                    setForm({ ...useProfileStore.getState().form, ...next })
                  }
                  disabled={isSaving}
                  className="grid gap-3 sm:grid-cols-2"
                />

                <Field>
                  <FieldLabel>Địa chỉ</FieldLabel>
                  <Textarea
                    value={form.address_line}
                    onChange={(event) => updateField("address_line", event.target.value)}
                    rows={3}
                  />
                  {addressSuggestions.length > 0 ? (
                    <div className="rounded-md border bg-popover shadow-sm">
                      {addressSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => updateField("address_line", suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Field>
              </FieldGroup>

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={isSaving}>
                  <Save data-icon="inline-start" aria-hidden="true" />
                  {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="workspace-stack min-w-0">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Hành động nhanh</CardTitle>
            </div>
            <CardDescription>
              Mở nhanh các luồng chính tương tự trang hồ sơ trên di động.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {profileHomeActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md border p-3 text-sm transition hover:bg-accent hover:text-accent-foreground"
              >
                <span className="font-semibold text-foreground">
                  {action.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Mật khẩu</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="workspace-stack min-w-0">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="profile-current-password">Mật khẩu hiện tại</FieldLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      id="profile-current-password"
                      autoComplete="current-password"
                      className="min-w-0"
                      type={visiblePasswords.currentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordField("currentPassword", event.target.value)
                      }
                      required
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={
                        visiblePasswords.currentPassword
                          ? "Ẩn mật khẩu hiện tại"
                          : "Hiện mật khẩu hiện tại"
                      }
                      onClick={() =>
                        togglePasswordVisibility("currentPassword")
                      }
                      disabled={isChangingPassword}
                    >
                      {visiblePasswords.currentPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-new-password">Mật khẩu mới</FieldLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      id="profile-new-password"
                      autoComplete="new-password"
                      className="min-w-0"
                      type={visiblePasswords.newPassword ? "text" : "password"}
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordField("newPassword", event.target.value)
                      }
                      required
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={
                        visiblePasswords.newPassword
                          ? "Ẩn mật khẩu mới"
                          : "Hiện mật khẩu mới"
                      }
                      onClick={() =>
                        togglePasswordVisibility("newPassword")
                      }
                      disabled={isChangingPassword}
                    >
                      {visiblePasswords.newPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-confirm-password">Xác nhận mật khẩu mới</FieldLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      id="profile-confirm-password"
                      autoComplete="new-password"
                      className="min-w-0"
                      type={visiblePasswords.confirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordField("confirmPassword", event.target.value)
                      }
                      required
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={
                        visiblePasswords.confirmPassword
                          ? "Ẩn mật khẩu xác nhận"
                          : "Hiện mật khẩu xác nhận"
                      }
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                      disabled={isChangingPassword}
                    >
                      {visiblePasswords.confirmPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
              <Button type="submit" variant="outline" disabled={isChangingPassword}>
                <KeyRound data-icon="inline-start" aria-hidden="true" />
                {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Trợ giúp</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Người dân tạo báo cáo và chia sẻ vị trí trực tiếp khi cần hỗ trợ.</li>
            <li>Đội cứu trợ phân loại báo cáo, cập nhật trạng thái, theo dõi vị trí và rà soát người dùng.</li>
            <li>Quản trị viên có cùng quyền vận hành, thêm quyền đổi vai trò và xoá tài khoản người dùng.</li>
          </ul>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/huong-dan">
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Mở hướng dẫn đầy đủ
            </Link>
          </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
