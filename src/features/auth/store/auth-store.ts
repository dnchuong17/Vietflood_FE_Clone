import { create } from "zustand";

import type { UserRole } from "../lib/roles";

export type StoreAuthIdentity = {
  username: string;
  displayName: string;
  initials: string;
  role?: UserRole;
};

export type AuthIdentityReader = () => StoreAuthIdentity | null;

type AuthStore = {
  identity: StoreAuthIdentity | null;
  setIdentity: (identity: StoreAuthIdentity | null) => void;
  refreshIdentity: (readIdentity: AuthIdentityReader) => StoreAuthIdentity | null;
};

const initialState = {
  identity: null,
};

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  setIdentity: (identity) => set({ identity }),
  refreshIdentity: (readIdentity) => {
    const identity = readIdentity();
    set({ identity });
    return identity;
  },
}));

export function subscribeToAuthStoreChanges(
  readIdentity: AuthIdentityReader,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const refresh = () => {
    useAuthStore.getState().refreshIdentity(readIdentity);
  };

  refresh();
  window.addEventListener("storage", refresh);
  window.addEventListener("vietflood-auth-change", refresh);

  return () => {
    window.removeEventListener("storage", refresh);
    window.removeEventListener("vietflood-auth-change", refresh);
  };
}

export function resetAuthStore() {
  useAuthStore.setState(initialState);
}
