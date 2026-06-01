"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";
import { signIn } from "@/features/auth/api/sign-in";
import {
  getAuthIdentity,
  persistAuthTokens,
} from "@/features/auth/lib/auth-storage";
import { normalizeRole } from "@/features/auth/lib/roles";

export function LoginForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const [loginName, setLoginName] = useState("");
  const [secret, setSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loginName.trim() || !secret.trim()) {
      showAlert({
        title: "Thiếu thông tin",
        description: "Nhập đầy đủ tên đăng nhập và mật khẩu.",
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await signIn({
        username: loginName.trim(),
        password: secret,
      });

      persistAuthTokens(tokens);
      const role = normalizeRole(getAuthIdentity()?.role) ?? "citizen";

      showAlert({
        title: "Đã đăng nhập",
        description: "Chào mừng bạn quay lại VietFlood.",
        variant: "success",
      });
      router.replace(getDefaultRouteForRole(role));
      router.refresh();
    } catch (error) {
      showAlert({
        title: "Đăng nhập thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Không thể đăng nhập. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-5" onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="login-username">Tên đăng nhập</FieldLabel>
          <Input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">Mật khẩu</FieldLabel>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            required
          />
        </Field>

        <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Cần tài khoản người dân?{" "}
          <Link href="/dang-ky" className="font-semibold text-primary">
            Đăng ký
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
