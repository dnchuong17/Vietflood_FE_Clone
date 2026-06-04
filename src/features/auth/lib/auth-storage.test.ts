import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetAuthStore, useAuthStore } from "../store/auth-store";
import {
  clearAuthTokens,
  getRefreshToken,
  persistAuthTokens,
} from "./auth-storage";

function createJwt(payload: Record<string, unknown>): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload))
    .toString("base64url");

  return `header.${encodedPayload}.signature`;
}

function installBrowserStorage() {
  const storage = new Map<string, string>();
  const cookies = new Map<string, string>();

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return Array.from(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join("; ");
      },
      set cookie(value: string) {
        const [pair, ...attributes] = value.split(";");
        const [name, cookieValue] = pair.split("=");
        const maxAge = attributes
          .map((attribute) => attribute.trim().toLowerCase())
          .find((attribute) => attribute.startsWith("max-age="));

        if (maxAge === "max-age=0") {
          cookies.delete(name);
          return;
        }

        cookies.set(name, cookieValue);
      },
    },
  });

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent: vi.fn(),
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });

  return { cookies, storage };
}

describe("auth token storage", () => {
  beforeEach(() => {
    installBrowserStorage();
  });

  afterEach(() => {
    clearAuthTokens();
    resetAuthStore();
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "window");
  });

  it("stores refresh tokens in cookies instead of localStorage", () => {
    const { storage } = installBrowserStorage();

    persistAuthTokens({
      accessToken: createJwt({ username: "citizen01", role: "citizen" }),
      refresh_token: "refresh-cookie-value",
    });

    expect(getRefreshToken()).toBe("refresh-cookie-value");
    expect(storage.get("vietflood_refresh_token")).toBeUndefined();
    expect(document.cookie).toContain("vietflood_refresh_token=refresh-cookie-value");
  });

  it("refreshes the auth store immediately after a successful login persist", () => {
    persistAuthTokens({
      accessToken: createJwt({
        username: "relief01",
        first_name: "Relief",
        last_name: "One",
        role: "relief",
      }),
      refresh_token: "refresh-cookie-value",
    });

    expect(useAuthStore.getState().identity).toEqual({
      username: "relief01",
      displayName: "Relief One",
      initials: "RO",
      role: "relief",
    });
    expect(useAuthStore.getState().hasRestoredIdentity).toBe(true);
  });
});
