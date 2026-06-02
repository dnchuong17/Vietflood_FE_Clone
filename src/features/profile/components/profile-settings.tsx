"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Eye, EyeOff, HelpCircle, KeyRound, Save } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
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
  buildChangePasswordPayload,
  validateChangePasswordForm,
  type ChangePasswordForm,
} from "@/features/profile/lib/password";

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

export function ProfileSettings() {
  const { showAlert } = useGlobalAlert();
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

  function updateField<T extends keyof ProfileForm>(field: T, value: ProfileForm[T]) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
        Đang tải hồ sơ...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ</CardTitle>
          <CardDescription>
            Vai trò:{" "}
            <span className="font-semibold">
              {getUserRoleLabel(normalizeRole(profile?.role))}
            </span>
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
                  ["province", "Tỉnh/Thành phố"],
                  ["ward", "Phường/Xã"],
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

              <Field>
                <FieldLabel>Địa chỉ</FieldLabel>
                <Textarea
                  value={form.address_line}
                  onChange={(event) => updateField("address_line", event.target.value)}
                  rows={3}
                />
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
