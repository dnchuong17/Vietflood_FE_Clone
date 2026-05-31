"use client";

import { useSyncExternalStore } from "react";

import {
  getAuthIdentity,
  type AuthIdentity,
} from "@/features/auth/lib/auth-storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("vietflood-auth-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("vietflood-auth-change", callback);
  };
}

export function useAuthIdentity(): AuthIdentity | null {
  return useSyncExternalStore<AuthIdentity | null>(
    subscribe,
    getAuthIdentity,
    () => null,
  );
}
