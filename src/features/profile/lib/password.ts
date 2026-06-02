export type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export function validateChangePasswordForm(
  form: ChangePasswordForm,
): string | null {
  if (!form.currentPassword.trim()) {
    return "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!form.newPassword.trim()) {
    return "Vui lòng nhập mật khẩu mới.";
  }

  if (form.newPassword.length < 6) {
    return "Mật khẩu mới phải có ít nhất 6 ký tự.";
  }

  if (!form.confirmPassword.trim()) {
    return "Vui lòng xác nhận mật khẩu mới.";
  }

  if (form.newPassword !== form.confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }

  if (form.currentPassword === form.newPassword) {
    return "Mật khẩu mới phải khác mật khẩu hiện tại.";
  }

  return null;
}

export function buildChangePasswordPayload(
  form: ChangePasswordForm,
): ChangePasswordPayload {
  return {
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
  };
}
