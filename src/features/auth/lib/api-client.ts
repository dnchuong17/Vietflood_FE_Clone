/**
 * API Client with automatic token refresh
 * Handles 401 errors by attempting to refresh the access token
 */

import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  updateRefreshToken,
  clearAuthTokens,
  isAccessTokenExpiringSoon,
  getAuthSessionRevision,
} from "./auth-storage";
import { refreshAccessToken } from "../api/sign-in";
import { apiUrl } from "@/lib/api-config";
import { ApiResponseError, getResponseErrorStatus, responseError } from "./response-error";

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<void> | null = null;
let refreshRevision = -1;

/**
 * Refresh access token and update storage
 */
async function doRefreshToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  const revision = getAuthSessionRevision();
  const accessToken = getAccessToken();
  const isCurrentSession = () => getAuthSessionRevision() === revision && getRefreshToken() === refreshToken && getAccessToken() === accessToken;

  if (!refreshToken) {
    throw new Error("Không có refresh token. Vui lòng đăng nhập lại.");
  }

  try {
    const response = await refreshAccessToken(refreshToken);
    if (!isCurrentSession()) throw new Error("Phiên đăng nhập đã thay đổi.");
    updateAccessToken(response.accessToken);

    if (response.refresh_token) {
      updateRefreshToken(response.refresh_token);
    }
  } catch (error) {
    if (isCurrentSession() && error instanceof ApiResponseError && (error.status === 401 || error.status === 403)) {
      clearAuthTokens();
    }
    throw error;
  }
}

async function ensureFreshAccessToken(
  forceRefresh: boolean = false,
): Promise<void> {
  if (refreshPromise && refreshRevision === getAuthSessionRevision()) {
    await refreshPromise;
    return;
  }

  const accessToken = getAccessToken();
  if (!accessToken && !forceRefresh) {
    return;
  }

  if (!forceRefresh && !isAccessTokenExpiringSoon()) {
    return;
  }

  refreshRevision = getAuthSessionRevision();
  const pending = doRefreshToken();
  refreshPromise = pending;

  try {
    await pending;
  } finally {
    if (refreshPromise === pending) refreshPromise = null;
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 * @param url The API endpoint URL
 * @param options Fetch options
 * @returns The response object
 */
export async function apiRequest(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { skipAuthRefresh = false, ...fetchOptions } = options;
  const requestRevision = getAuthSessionRevision();

  if (!skipAuthRefresh) {
    try {
      await ensureFreshAccessToken(false);
    } catch (error) {
      console.warn("Token refresh failed", error);
    }
  }

  // Add authorization header if token exists
  if (getAuthSessionRevision() !== requestRevision) throw new Error("Phiên đăng nhập đã thay đổi.");
  const currentAccessToken = getAccessToken();
  const headers = new Headers(fetchOptions.headers || {});

  if (currentAccessToken) {
    headers.set("Authorization", `Bearer ${currentAccessToken}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipAuthRefresh) {
    try {
      if (getAuthSessionRevision() !== requestRevision) return response;
      await ensureFreshAccessToken(true);
      if (getAuthSessionRevision() !== requestRevision) return response;

      // Retry the original request with new token
      const newAccessToken = getAccessToken();
      const retryHeaders = new Headers(fetchOptions.headers || {});

      if (newAccessToken) {
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      }

      return fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
      });
    } catch (error) {
      console.error("Token refresh failed", error);
      // Return original 401 response
      return response;
    }
  }

  return response;
}

export function apiPath(path: string): string {
  return apiUrl(path);
}

/**
 * Convenience function for GET requests with auth
 */
export async function apiGet(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "GET",
  });
}

export async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  const errorStatus = getResponseErrorStatus(data);
  if (!response.ok || errorStatus) {
    throw responseError(data, errorStatus ?? response.status, fallbackMessage);
  }
  if (data === null && response.status !== 204) throw new Error(fallbackMessage);

  return data as T;
}

export async function apiPatch(
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for POST requests with auth
 */
export async function apiPost(
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for PUT requests with auth
 */
export async function apiPut(
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for DELETE requests with auth
 */
export async function apiDelete(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "DELETE",
  });
}
