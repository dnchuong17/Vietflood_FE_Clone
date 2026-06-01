import { create } from "zustand";

import type { UserRole } from "../lib/roles";

export type StoreAuthIdentity = {
  username: string;
  displayName: string;
  initials: string;
  role?: UserRole;
};

export type AuthIdentityReader = () => StoreAuthIdentity | null;

type AuthStoreState = {
  identity: StoreAuthIdentity | null;
  hasRestoredIdentity: boolean;
};

type AuthStore = AuthStoreState & {
  setIdentity: (identity: StoreAuthIdentity | null) => void;
  refreshIdentity: (readIdentity: AuthIdentityReader) => StoreAuthIdentity | null;
};

export function createInitialAuthState(): AuthStoreState {
  return {
    identity: null,
    hasRestoredIdentity: false,
  };
}

const initialState = createInitialAuthState();

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  setIdentity: (identity) => set({ identity }),
  refreshIdentity: (readIdentity) => {
    const identity = readIdentity();
    set({ identity, hasRestoredIdentity: true });
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
  useAuthStore.setState(createInitialAuthState());
}
