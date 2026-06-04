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
  return {
    fieldErrors: {},
    message: null,
  };
}

export function validateRegisterForm(
  _form: RegisterValidationInput,
): ValidationResult {
  return {
    fieldErrors: {},
    message: null,
  };
}
