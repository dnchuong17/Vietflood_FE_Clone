import { describe, expect, it } from "vitest";

import {
  buildChangePasswordPayload,
  validateChangePasswordForm,
} from "./password";

describe("profile password helpers", () => {
  it("requires the current, new, and confirmation passwords", () => {
    expect(
      validateChangePasswordForm({
        currentPassword: "",
        newPassword: "secret1",
        confirmPassword: "secret1",
      }),
    ).toBe("Vui lòng nhập mật khẩu hiện tại.");

    expect(
      validateChangePasswordForm({
        currentPassword: "oldpass",
        newPassword: "",
        confirmPassword: "",
      }),
    ).toBe("Vui lòng nhập mật khẩu mới.");

    expect(
      validateChangePasswordForm({
        currentPassword: "oldpass",
        newPassword: "secret1",
        confirmPassword: "",
      }),
    ).toBe("Vui lòng xác nhận mật khẩu mới.");
  });

  it("rejects weak, mismatched, or unchanged new passwords", () => {
    expect(
      validateChangePasswordForm({
        currentPassword: "oldpass",
        newPassword: "12345",
        confirmPassword: "12345",
      }),
    ).toBe("Mật khẩu mới phải có ít nhất 6 ký tự.");

    expect(
      validateChangePasswordForm({
        currentPassword: "oldpass",
        newPassword: "newpass",
        confirmPassword: "otherpass",
      }),
    ).toBe("Mật khẩu xác nhận không khớp.");

    expect(
      validateChangePasswordForm({
        currentPassword: "samepass",
        newPassword: "samepass",
        confirmPassword: "samepass",
      }),
    ).toBe("Mật khẩu mới phải khác mật khẩu hiện tại.");
  });

  it("keeps confirmation client-side when building the backend payload", () => {
    expect(
      validateChangePasswordForm({
        currentPassword: "oldpass",
        newPassword: "newpass",
        confirmPassword: "newpass",
      }),
    ).toBeNull();

    expect(
      buildChangePasswordPayload({
        currentPassword: "oldpass",
        newPassword: "newpass",
        confirmPassword: "newpass",
      }),
    ).toEqual({
      currentPassword: "oldpass",
      newPassword: "newpass",
    });
  });
});
