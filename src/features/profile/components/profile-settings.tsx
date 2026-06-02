"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

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
import type { AuthProfile } from "@/features/auth/types/auth";
import {
  searchProvinces,
  searchWards,
  type DivisionOption,
} from "@/features/location/api/vietnam-divisions";
import {
  buildChangePasswordPayload,
  validateChangePasswordForm,
  type ChangePasswordForm,
} from "@/features/profile/lib/password";
import {
  buildProfileAvatarUrl,
  buildProfileDisplayName,
  buildProfileLocation,
  formatProfileDate,
} from "@/features/profile/lib/profile-summary";
import { buildAddressSuggestions } from "@/features/reports/lib/address-suggestions";
import { useReportsStore } from "@/features/reports/store/reports-store";

type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string;
  ward: string;
  address_line: string;
};

type PasswordFieldName = keyof ChangePasswordForm;

const EMPTY_PROFILE: ProfileForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  province: "",
  ward: "",
  address_line: "",
};

function ProfileInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
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
  const reports = useReportsStore((state) => state.reports);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<PasswordFieldName, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<DivisionOption[]>([]);
  const [wardOptions, setWardOptions] = useState<DivisionOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  async function loadProfile() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest(apiPath("/auth/profile"), {
        method: "GET",
        credentials: "include",
      });
      const data = await parseJsonResponse<AuthProfile>(
        response,
        "Không thể tải hồ sơ.",
      );
      setProfile(data);
      setForm({
        first_name: data.first_name ?? "",
        middle_name: data.middle_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        province: data.province ?? "",
        ward: data.ward ?? "",
        address_line: data.address_line ?? "",
      });
    } catch (error) {
      showAlert({
        title: "Không thể tải hồ sơ",
        description:
          error instanceof Error ? error.message : "Không thể tải hồ sơ.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingProvinces(true);
        const options = await searchProvinces(form.province);
        if (isCurrent) {
          setProvinceOptions(options);
        }
      } catch {
        if (isCurrent) {
          setProvinceOptions([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingProvinces(false);
        }
      }
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.province]);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWardOptions([]);
      return;
    }

    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingWards(true);
        const options = await searchWards(selectedProvinceCode, form.ward);
        if (isCurrent) {
          setWardOptions(options);
        }
      } catch {
        if (isCurrent) {
          setWardOptions([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingWards(false);
        }
      }
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.ward, selectedProvinceCode]);

  const normalizedProvinceValue = form.province.trim().toLocaleLowerCase("vi-VN");
  const normalizedWardValue = form.ward.trim().toLocaleLowerCase("vi-VN");
  const visibleProvinceOptions = useMemo(
    () =>
      provinceOptions.filter(
        (option) => option.name.trim().toLocaleLowerCase("vi-VN") !== normalizedProvinceValue,
      ),
    [normalizedProvinceValue, provinceOptions],
  );
  const visibleWardOptions = useMemo(
    () =>
      wardOptions.filter(
        (option) => option.name.trim().toLocaleLowerCase("vi-VN") !== normalizedWardValue,
      ),
    [normalizedWardValue, wardOptions],
  );
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

  useEffect(() => {
    if (selectedProvinceCode || !normalizedProvinceValue) {
      return;
    }

    const exactProvince = provinceOptions.find(
      (option) => option.name.trim().toLocaleLowerCase("vi-VN") === normalizedProvinceValue,
    );
    if (exactProvince) {
      setSelectedProvinceCode(exactProvince.code);
    }
  }, [normalizedProvinceValue, provinceOptions, selectedProvinceCode]);

  function updateField<T extends keyof ProfileForm>(field: T, value: ProfileForm[T]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleProvinceInput(value: string) {
    setSelectedProvinceCode(null);
    setWardOptions([]);
    setForm((prev) => ({ ...prev, province: value, ward: "" }));
  }

  function selectProvince(option: DivisionOption) {
    setSelectedProvinceCode(option.code);
    setWardOptions([]);
    setForm((prev) => ({ ...prev, province: option.name, ward: "" }));
  }

  function selectWard(option: DivisionOption) {
    setForm((prev) => ({ ...prev, ward: option.name }));
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
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
      setIsSaving(false);
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
      setIsChangingPassword(true);
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
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
      setIsChangingPassword(false);
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
  const canEditWard = Boolean(selectedProvinceCode || form.province.trim());

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-4">
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
                <CardTitle className="truncate">{displayName}</CardTitle>
                <CardDescription>{profile?.username ?? missingValue}</CardDescription>
                <Badge variant="secondary" className="mt-2">
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
            <CardTitle>Hồ sơ</CardTitle>
            <CardDescription>
              Chỉnh sửa thông tin liên hệ và địa chỉ của tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <FieldGroup>
                <div className="grid gap-3 sm:grid-cols-3">
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Tỉnh/Thành phố</FieldLabel>
                    <Input
                      value={form.province}
                      onChange={(event) => handleProvinceInput(event.target.value)}
                      placeholder="Nhập tỉnh hoặc thành phố"
                    />
                    {visibleProvinceOptions.length > 0 ? (
                      <div className="rounded-md border bg-popover shadow-sm">
                        {visibleProvinceOptions.slice(0, 6).map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => selectProvince(option)}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    ) : isLoadingProvinces ? (
                      <p className="text-xs text-muted-foreground">
                        Đang tìm tỉnh/thành phố...
                      </p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>Phường/Xã</FieldLabel>
                    <Input
                      value={form.ward}
                      onChange={(event) => updateField("ward", event.target.value)}
                      placeholder="Chọn hoặc nhập phường/xã"
                      disabled={!canEditWard}
                    />
                    {visibleWardOptions.length > 0 ? (
                      <div className="rounded-md border bg-popover shadow-sm">
                        {visibleWardOptions.slice(0, 6).map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => selectWard(option)}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    ) : isLoadingWards ? (
                      <p className="text-xs text-muted-foreground">Đang tìm phường/xã...</p>
                    ) : null}
                  </Field>
                </div>

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

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  <Save data-icon="inline-start" aria-hidden="true" />
                  {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Mật khẩu</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Mật khẩu hiện tại</FieldLabel>
                  <Input
                    type={visiblePasswords.currentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                    required
                    disabled={isChangingPassword}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={
                      visiblePasswords.currentPassword
                        ? "Ẩn mật khẩu hiện tại"
                        : "Hiện mật khẩu hiện tại"
                    }
                    onClick={() =>
                      setVisiblePasswords((prev) => ({
                        ...prev,
                        currentPassword: !prev.currentPassword,
                      }))
                    }
                    disabled={isChangingPassword}
                  >
                    {visiblePasswords.currentPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </Field>
                <Field>
                  <FieldLabel>Mật khẩu mới</FieldLabel>
                  <Input
                    type={visiblePasswords.newPassword ? "text" : "password"}
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                    required
                    disabled={isChangingPassword}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={
                      visiblePasswords.newPassword
                        ? "Ẩn mật khẩu mới"
                        : "Hiện mật khẩu mới"
                    }
                    onClick={() =>
                      setVisiblePasswords((prev) => ({
                        ...prev,
                        newPassword: !prev.newPassword,
                      }))
                    }
                    disabled={isChangingPassword}
                  >
                    {visiblePasswords.newPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </Field>
                <Field>
                  <FieldLabel>Xác nhận mật khẩu mới</FieldLabel>
                  <Input
                    type={visiblePasswords.confirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    required
                    disabled={isChangingPassword}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={
                      visiblePasswords.confirmPassword
                        ? "Ẩn mật khẩu xác nhận"
                        : "Hiện mật khẩu xác nhận"
                    }
                    onClick={() =>
                      setVisiblePasswords((prev) => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword,
                      }))
                    }
                    disabled={isChangingPassword}
                  >
                    {visiblePasswords.confirmPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </Field>
              </FieldGroup>
              <Button type="submit" variant="outline" disabled={isChangingPassword}>
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
