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
import styles from "./auth-experience.module.css";

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
        <p className={styles.sectionLabel}>Thông tin tài khoản</p>
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

        <div className={styles.sectionDivider} aria-hidden="true" />
        <p className={styles.sectionLabel}>Liên hệ & khu vực</p>
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

        <div className={styles.fieldGrid}>
          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-province">Tỉnh/Thành phố <span>(không bắt buộc)</span></FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-province" name="address-level1" value={form.province} onChange={(event) => updateField("province", event.target.value)} autoComplete="address-level1" placeholder="Tỉnh, thành phố" /></div>
          </Field>

          <Field>
            <FieldLabel className={styles.fieldLabel} htmlFor="register-ward">Phường/Xã <span>(không bắt buộc)</span></FieldLabel>
            <div className={styles.inputShell}><Input className={styles.input} id="register-ward" name="address-level3" value={form.ward} onChange={(event) => updateField("ward", event.target.value)} placeholder="Phường, xã" /></div>
          </Field>
        </div>

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
