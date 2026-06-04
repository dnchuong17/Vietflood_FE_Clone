import type {
  LoginFormState,
  RegisterFormState,
} from "@/features/auth/store/auth-form-store";

type ValidationResult = {
  fieldErrors: Record<string, string>;
  message: string | null;
};

export type RegisterValidationInput = Pick<
  RegisterFormState,
  "email" | "first_name" | "last_name" | "password"
> & {
  confirmPassword: string;
};

export function validateLoginForm(_form: LoginFormState): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const loginName = _form.loginName.trim();

  if (!loginName) {
    fieldErrors.loginName = "Vui lòng nhập tên đăng nhập.";
  } else if (loginName.length < 3) {
    fieldErrors.loginName = "Tên đăng nhập phải có ít nhất 3 ký tự.";
  } else if (!/^[a-zA-Z0-9_-]+$/.test(loginName)) {
    fieldErrors.loginName =
      "Tên đăng nhập chỉ gồm chữ, số, gạch dưới hoặc gạch nối.";
  }

  if (!_form.secret) {
    fieldErrors.secret = "Vui lòng nhập mật khẩu.";
  } else if (_form.secret.length < 6) {
    fieldErrors.secret = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  return buildValidationResult(fieldErrors);
}

export function validateRegisterForm(
  form: RegisterValidationInput,
): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const email = form.email.trim();
  const firstName = form.first_name.trim();
  const lastName = form.last_name.trim();

  if (!email) {
    fieldErrors.email = "Vui lòng nhập email.";
  } else if (email.length < 3) {
    fieldErrors.email = "Email phải có ít nhất 3 ký tự.";
  } else if (!email.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Email không hợp lệ.";
  }

  if (!firstName) {
    fieldErrors.first_name = "Vui lòng nhập tên.";
  } else if (firstName.length < 2) {
    fieldErrors.first_name = "Họ tên phải có ít nhất 2 ký tự.";
  } else if (firstName.length > 100) {
    fieldErrors.first_name = "Họ tên không được vượt quá 100 ký tự.";
  }

  if (!lastName) {
    fieldErrors.last_name = "Vui lòng nhập họ.";
  } else if (lastName.length < 2) {
    fieldErrors.last_name = "Họ tên phải có ít nhất 2 ký tự.";
  } else if (lastName.length > 100) {
    fieldErrors.last_name = "Họ tên không được vượt quá 100 ký tự.";
  }

  if (!form.password) {
    fieldErrors.password = "Vui lòng nhập mật khẩu.";
  } else if (form.password.length < 8) {
    fieldErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  } else if (!/[A-Z]/.test(form.password)) {
    fieldErrors.password = "Mật khẩu phải có ít nhất một chữ hoa.";
  } else if (!/[0-9]/.test(form.password)) {
    fieldErrors.password = "Mật khẩu phải có ít nhất một chữ số.";
  }

  if (!form.confirmPassword) {
    fieldErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (form.confirmPassword !== form.password) {
    fieldErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return buildValidationResult(fieldErrors);
}

function buildValidationResult(fieldErrors: Record<string, string>): ValidationResult {
  return {
    fieldErrors,
    message: Object.values(fieldErrors)[0] ?? null,
  };
}
