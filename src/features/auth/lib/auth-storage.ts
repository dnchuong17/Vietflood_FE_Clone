import type { SignInResponse } from "@/features/auth/types/auth";

const ACCESS_TOKEN_KEY = "vietflood_access_token";
const REFRESH_TOKEN_KEY = "vietflood_refresh_token";

type TokenPayload = {
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type AuthIdentity = {
  username: string;
  displayName: string;
  initials: string;
};

let cachedIdentityToken: string | null = null;
let cachedIdentity: AuthIdentity | null = null;

export function persistAuthTokens(tokens: SignInResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function decodeTokenPayload(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalizedBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = normalizedBase64.padEnd(
      Math.ceil(normalizedBase64.length / 4) * 4,
      "=",
    );
    const decoded = atob(paddedBase64);
    const payload = JSON.parse(decoded) as TokenPayload;

    return payload;
  } catch {
    return null;
  }
}

function createInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

  return `${first}${second}`.toUpperCase();
}

export function getAuthIdentity(): AuthIdentity | null {
  const token = getAccessToken();
  if (!token) {
    cachedIdentityToken = null;
    cachedIdentity = null;
    return null;
  }

  if (cachedIdentityToken === token) {
    return cachedIdentity;
  }

  const payload = decodeTokenPayload(token);
  if (!payload?.username) {
    cachedIdentityToken = token;
    cachedIdentity = null;
    return null;
  }

  const fullName =
    `${payload.first_name ?? ""} ${payload.last_name ?? ""}`.trim();
  const displayName = fullName.length > 0 ? fullName : payload.username;

  cachedIdentityToken = token;
  cachedIdentity = {
    username: payload.username,
    displayName,
    initials: createInitials(displayName),
  };

  return cachedIdentity;
}
