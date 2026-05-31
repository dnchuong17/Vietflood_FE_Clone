"use client";

import { useEffect } from "react";

import {
  getAuthIdentity,
  type AuthIdentity,
} from "@/features/auth/lib/auth-storage";
import { subscribeToAuthStoreChanges, useAuthStore } from "@/features/auth/store/auth-store";

export function useAuthIdentity(): AuthIdentity | null {
  const identity = useAuthStore((state) => state.identity);

  useEffect(() => {
    return subscribeToAuthStoreChanges(getAuthIdentity);
  }, []);

  return identity;
}
