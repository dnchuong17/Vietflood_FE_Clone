import type {
  AuthProfile,
  RegisterPayload,
  SignInPayload,
  SignInResponse,
} from "@/features/auth/types/auth";
import { normalizeRole } from "@/features/auth/lib/roles";
import { apiUrl } from "@/lib/api-config";

export function extractErrorMessage(
  data: unknown,
  fallback = "Yêu cầu thất bại. Vui lòng thử lại.",
): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    if (Array.isArray(message)) {
      const joined = message.filter(Boolean).join(", ");
      if (joined) {
        return joined;
      }
    }
  }

  if (typeof data === "object" && data !== null && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }

  return fallback;
}

function isSignInResponse(data: unknown): data is SignInResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const tokenByCamel = (data as { accessToken?: unknown }).accessToken;
  const tokenBySnake = (data as { access_token?: unknown }).access_token;

  return (
    (typeof tokenByCamel === "string" && tokenByCamel.trim().length > 0) ||
    (typeof tokenBySnake === "string" && tokenBySnake.trim().length > 0)
  );
}

function normalizeTokens(data: unknown): SignInResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("Phản hồi token từ máy chủ không hợp lệ.");
  }

  const raw = data as {
    accessToken?: unknown;
    access_token?: unknown;
    refreshToken?: unknown;
    refresh_token?: unknown;
  };

  const accessToken =
    typeof raw.accessToken === "string" && raw.accessToken.trim().length > 0
      ? raw.accessToken
      : typeof raw.access_token === "string" &&
          raw.access_token.trim().length > 0
        ? raw.access_token
        : "";

  const refreshToken =
    typeof raw.refresh_token === "string" && raw.refresh_token.trim().length > 0
      ? raw.refresh_token
      : typeof raw.refreshToken === "string" &&
          raw.refreshToken.trim().length > 0
        ? raw.refreshToken
        : undefined;

  if (!accessToken) {
    throw new Error("Máy chủ không trả về access token.");
  }

  return {
    accessToken,
    refresh_token: refreshToken,
  };
}

export async function getProfile(
  accessToken: string,
): Promise<AuthProfile | null> {
  const response = await fetch(apiUrl("/auth/profile"), {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Không thể tải hồ sơ."));
  }

  if (typeof data !== "object" || data === null) {
    return null;
  }

  return data as AuthProfile;
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const response = await fetch(apiUrl("/auth/sign_in"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Đăng nhập thất bại."));
  }

  if (!isSignInResponse(data)) {
    throw new Error("Phản hồi đăng nhập từ máy chủ không hợp lệ.");
  }

  const tokens = normalizeTokens(data);
  const profile = await getProfile(tokens.accessToken);
  const role = normalizeRole(profile?.role);

  if (!role) {
    throw new Error("Tài khoản này không dùng vai trò VietFlood được hỗ trợ.");
  }

  return tokens;
}

export async function register(payload: RegisterPayload): Promise<void> {
  const response = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, role: payload.role ?? "citizen" }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Đăng ký thất bại."));
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<SignInResponse> {
  const response = await fetch(apiUrl("/auth/refresh_token"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Không thể làm mới phiên đăng nhập."));
  }

  return normalizeTokens(data);
}
