import { afterEach, describe, expect, it } from "vitest";

import {
  resetAuthStore,
  useAuthStore,
  type AuthIdentityReader,
} from "./auth-store";

describe("auth Zustand store", () => {
  afterEach(() => {
    resetAuthStore();
  });

  it("refreshes identity from the provided reader", () => {
    const readIdentity: AuthIdentityReader = () => ({
      username: "relief01",
      displayName: "Relief One",
      initials: "RO",
      role: "relief",
    });

    expect(useAuthStore.getState().refreshIdentity(readIdentity)).toEqual({
      username: "relief01",
      displayName: "Relief One",
      initials: "RO",
      role: "relief",
    });
    expect(useAuthStore.getState().identity?.role).toBe("relief");
  });
});
