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
import { register } from "@/features/auth/api/sign-in";
import { useAuthFormStore } from "@/features/auth/store/auth-form-store";
import { VietnamAddressPicker } from "@/features/location/components/vietnam-address-picker";
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

export function RegisterForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const form = useAuthFormStore((state) => state.register);
  const isSubmitting = useAuthFormStore((state) => state.isRegisterSubmitting);
  const updateField = useAuthFormStore((state) => state.setRegisterField);
  const setIsSubmitting = useAuthFormStore((state) => state.setRegisterSubmitting);
  const resetRegisterForm = useAuthFormStore((state) => state.resetRegisterForm);
  const [showPassword, setShowPassword] = useState(false);

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

      resetRegisterForm();
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <FieldGroup className={styles.fields}>
        <fieldset className="grid min-w-0 gap-4">
        <legend className="mb-4 text-base font-semibold">Thông tin tài khoản</legend>
        <div className={styles.fieldGrid}>
          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-first-name">Tên</FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-first-name" name="given-name" autoComplete="given-name" placeholder="Tên của bạn" value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} required /></div>
          </Field>

          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-last-name">Họ</FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-last-name" name="family-name" autoComplete="family-name" placeholder="Họ của bạn" value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} required /></div>
          </Field>
        </div>

        <Field>
          <FieldLabel className={styles.fieldLabel} htmlFor="register-username">Tên đăng nhập</FieldLabel>
          <div className={styles.inputShell}><Input className={styles.input} id="register-username" name="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} autoComplete="username" placeholder="Tên dùng để đăng nhập" required /></div>
        </Field>

        <Field>
          <FieldLabel className={styles.fieldLabel} htmlFor="register-password">Mật khẩu</FieldLabel>
          <div className={styles.inputShell}>
            <Input className={styles.input} id="register-password" name="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" minLength={6} required />
            <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>
              {showPassword ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
            </button>
          </div>
        </Field>

        </fieldset>
        <fieldset className="grid min-w-0 gap-4 border-t border-border pt-4">
        <legend className="pr-2 text-base font-semibold">Liên hệ & khu vực</legend>
        <div className={styles.fieldGrid}>
          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-email">Email</FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-email" name="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} type="email" autoComplete="email" placeholder="ban@example.com" required /></div>
          </Field>

          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-phone">Số điện thoại</FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-phone" name="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} type="tel" autoComplete="tel" placeholder="Số điện thoại liên hệ" required /></div>
          </Field>
        </div>

        <Field>
          <FieldLabel className={styles.fieldLabel} htmlFor="register-address">Địa chỉ <span>(không bắt buộc)</span></FieldLabel>
          <div className={styles.inputShell}><Input className={styles.input} id="register-address" name="street-address" value={form.address_line} onChange={(event) => updateField("address_line", event.target.value)} autoComplete="street-address" placeholder="Số nhà, tên đường" /></div>
        </Field>

        <VietnamAddressPicker
          idPrefix="register"
          value={{ province: form.province, ward: form.ward }}
          onChange={(next) =>
            useAuthFormStore.setState((state) => ({
              register: { ...state.register, ...next },
            }))
          }
          disabled={isSubmitting}
          className={styles.fieldGrid}
          inputClassName={styles.input}
          provinceName="address-level1"
          wardName="address-level3"
        />

        </fieldset>

        <Button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          <span>{isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản người dân"}</span>
          <span className={styles.buttonIcon}><ArrowRightIcon aria-hidden="true" /></span>
        </Button>

        {isSubmitting ? (
          <LoadingBar
            title="Đang tạo tài khoản..."
            description="Đang gửi hồ sơ đăng ký và chuẩn bị trang đăng nhập."
          />
        ) : null}

        <p className={styles.switchRow}>
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className={styles.switchLink}>Đăng nhập</Link>
        </p>
      </FieldGroup>
    </form>
  );
}
