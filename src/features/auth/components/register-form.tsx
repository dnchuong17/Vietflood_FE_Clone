"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { register } from "@/features/auth/api/sign-in";

const INITIAL_FORM = {
  username: "",
  password: "",
  email: "",
  phone: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  province: "",
  ward: "",
  address_line: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await register({
        ...form,
        role: "citizen",
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name: form.last_name.trim(),
        province: form.province.trim(),
        ward: form.ward.trim(),
        address_line: form.address_line.trim(),
      });

      showAlert({
        title: "Đã tạo tài khoản",
        description: "Bạn có thể đăng nhập bằng tài khoản người dân.",
        variant: "success",
      });
      router.replace("/dang-nhap");
    } catch (error) {
      showAlert({
        title: "Đăng ký thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Không thể tạo tài khoản. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-5" onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="register-first-name">Tên</FieldLabel>
            <Input
              id="register-first-name"
              value={form.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-last-name">Họ</FieldLabel>
            <Input
              id="register-last-name"
              value={form.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="register-username">Tên đăng nhập</FieldLabel>
          <Input
            id="register-username"
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            autoComplete="username"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="register-password">Mật khẩu</FieldLabel>
          <Input
            id="register-password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="register-email">Địa chỉ thư điện tử</FieldLabel>
            <Input
              id="register-email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-phone">Số điện thoại</FieldLabel>
            <Input
              id="register-phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              autoComplete="tel"
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="register-address">Địa chỉ</FieldLabel>
          <Input
            id="register-address"
            value={form.address_line}
            onChange={(event) => updateField("address_line", event.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="register-province">Tỉnh/Thành phố</FieldLabel>
            <Input
              id="register-province"
              value={form.province}
              onChange={(event) => updateField("province", event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-ward">Phường/Xã</FieldLabel>
            <Input
              id="register-ward"
              value={form.ward}
              onChange={(event) => updateField("ward", event.target.value)}
            />
          </Field>
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản người dân"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-semibold text-primary">
            Đăng nhập
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
