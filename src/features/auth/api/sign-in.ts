import type { SignInPayload, SignInResponse } from "@/features/auth/types/auth";

const DEFAULT_AUTH_API_BASE_URL = "http://localhost:8081";

const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? DEFAULT_AUTH_API_BASE_URL;

function extractErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin tài khoản.";
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/sign_in`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  if (typeof data !== "object" || data === null || !("accessToken" in data)) {
    throw new Error("Phản hồi đăng nhập không hợp lệ từ máy chủ.");
  }

  return data as SignInResponse;
}
