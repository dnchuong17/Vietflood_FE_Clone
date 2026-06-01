"use client";

import { useEffect } from "react";

import {
  getAuthIdentity,
  type AuthIdentity,
} from "@/features/auth/lib/auth-storage";
import { subscribeToAuthStoreChanges, useAuthStore } from "@/features/auth/store/auth-store";

export function useAuthIdentityState(): {
  identity: AuthIdentity | null;
  hasRestoredIdentity: boolean;
} {
  const identity = useAuthStore((state) => state.identity);
  const hasRestoredIdentity = useAuthStore((state) => state.hasRestoredIdentity);

  useEffect(() => {
    return subscribeToAuthStoreChanges(getAuthIdentity);
  }, []);

  return { identity, hasRestoredIdentity };
}

export function useAuthIdentity(): AuthIdentity | null {
  return useAuthIdentityState().identity;
}
