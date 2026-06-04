import { describe, expect, it } from "vitest";

import {
  validateLoginForm,
  validateRegisterForm,
} from "./form-validation";

describe("auth form validation", () => {
  it("matches the mobile login username and password rules", () => {
    expect(
      validateLoginForm({ loginName: "ab", secret: "secret1" }),
    ).toEqual({
      fieldErrors: {
        loginName: "Tên đăng nhập phải có ít nhất 3 ký tự.",
      },
      message: "Tên đăng nhập phải có ít nhất 3 ký tự.",
    });

    expect(
      validateLoginForm({ loginName: "citizen!", secret: "secret1" }),
    ).toEqual({
      fieldErrors: {
        loginName: "Tên đăng nhập chỉ gồm chữ, số, gạch dưới hoặc gạch nối.",
      },
      message: "Tên đăng nhập chỉ gồm chữ, số, gạch dưới hoặc gạch nối.",
    });

    expect(
      validateLoginForm({ loginName: "citizen-a", secret: "12345" }),
    ).toEqual({
      fieldErrors: {
        secret: "Mật khẩu phải có ít nhất 6 ký tự.",
      },
      message: "Mật khẩu phải có ít nhất 6 ký tự.",
    });
  });

  it("matches the mobile registration email, name, password, and confirmation rules", () => {
    expect(
      validateRegisterForm({
        email: "not-an-email",
        first_name: "A",
        last_name: "",
        password: "weakpass",
        confirmPassword: "different",
      }),
    ).toEqual({
      fieldErrors: {
        email: "Email không hợp lệ.",
        first_name: "Họ tên phải có ít nhất 2 ký tự.",
        last_name: "Vui lòng nhập họ.",
        password: "Mật khẩu phải có ít nhất một chữ hoa.",
        confirmPassword: "Mật khẩu xác nhận không khớp.",
      },
      message: "Email không hợp lệ.",
    });

    expect(
      validateRegisterForm({
        email: "new@example.com",
        first_name: "Nguyen",
        last_name: "Duy",
        password: "StrongPass",
        confirmPassword: "StrongPass",
      }),
    ).toEqual({
      fieldErrors: {
        password: "Mật khẩu phải có ít nhất một chữ số.",
      },
      message: "Mật khẩu phải có ít nhất một chữ số.",
    });
  });
});
