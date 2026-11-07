"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
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
import { useAuthFormStore } from "@/features/auth/store/auth-form-store";
const styles = {
  "form": "workspace-stack",
  "fields": "gap-4",
  "fieldGrid": "grid min-w-0 gap-4 sm:grid-cols-2",
  "fieldLabel": "text-sm font-medium text-foreground [&>span]:font-normal [&>span]:text-muted-foreground",
  "inputShell": "flex min-w-0 items-center gap-1 rounded-xl border border-input bg-background pr-1 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
  "input": "min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0",
  "eyeButton": "grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&>svg]:size-5",
  "primaryButton": "mt-2 min-h-11 w-full justify-between",
  "buttonIcon": "[&>svg]:size-4",
  "switchRow": "text-center text-sm text-muted-foreground",
  "switchLink": "ml-1 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring",
  "sectionLabel": "text-base font-semibold text-foreground",
  "sectionDivider": "h-px bg-border",
  "hint": "text-xs text-muted-foreground"
};

export function LoginForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const login = useAuthFormStore((state) => state.login);
  const isSubmitting = useAuthFormStore((state) => state.isLoginSubmitting);
  const setLoginField = useAuthFormStore((state) => state.setLoginField);
  const setIsSubmitting = useAuthFormStore((state) => state.setLoginSubmitting);
  const resetLoginForm = useAuthFormStore((state) => state.resetLoginForm);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!login.loginName.trim() || !login.secret.trim()) {
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
        username: login.loginName.trim(),
        password: login.secret,
      });

      persistAuthTokens(tokens);
      resetLoginForm();
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <FieldGroup className={styles.fields}>
        <Field>
          <FieldLabel className={styles.fieldLabel} htmlFor="login-username">Tên đăng nhập</FieldLabel>
          <div className={styles.inputShell}>
            <Input
              className={styles.input}
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
              value={login.loginName}
              onChange={(event) => setLoginField("loginName", event.target.value)}
              required
            />
          </div>
        </Field>

        <Field>
          <FieldLabel className={styles.fieldLabel} htmlFor="login-password">Mật khẩu</FieldLabel>
          <div className={styles.inputShell}>
            <Input
              className={styles.input}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={login.secret}
              onChange={(event) => setLoginField("secret", event.target.value)}
              required
            />
            <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>
              {showPassword ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
            </button>
          </div>
        </Field>

        <Button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
          <span className={styles.buttonIcon}><ArrowRightIcon aria-hidden="true" /></span>
        </Button>

        {isSubmitting ? (
          <LoadingBar
            title="Đang đăng nhập..."
            description="Đang xác thực tài khoản và mở không gian làm việc."
          />
        ) : null}

        <p className={styles.switchRow}>
          Cần tài khoản người dân?{" "}
          <Link href="/dang-ky" className={styles.switchLink}>Tạo tài khoản</Link>
        </p>
      </FieldGroup>
    </form>
  );
}
