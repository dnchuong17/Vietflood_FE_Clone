import { beforeEach, describe, expect, it } from "vitest";

import { resetAuthFormStore, useAuthFormStore } from "./auth-form-store";

describe("auth form store", () => {
  beforeEach(() => {
    resetAuthFormStore();
  });

  it("tracks login credentials and submission state", () => {
    useAuthFormStore.getState().setLoginField("loginName", "citizen-a");
    useAuthFormStore.getState().setLoginField("secret", "secretpass");
    useAuthFormStore.getState().setLoginSubmitting(true);

    expect(useAuthFormStore.getState().login).toEqual({
      loginName: "citizen-a",
      secret: "secretpass",
    });
    expect(useAuthFormStore.getState().isLoginSubmitting).toBe(true);

    useAuthFormStore.getState().resetLoginForm();

    expect(useAuthFormStore.getState().login.loginName).toBe("");
    expect(useAuthFormStore.getState().login.secret).toBe("");
    expect(useAuthFormStore.getState().isLoginSubmitting).toBe(false);
  });

  it("tracks register fields without allowing role selection", () => {
    useAuthFormStore.getState().setRegisterField("username", "new-citizen");
    useAuthFormStore.getState().setRegisterField("email", "new@example.com");
    useAuthFormStore.getState().setRegisterSubmitting(true);

    expect(useAuthFormStore.getState().register.username).toBe("new-citizen");
    expect(useAuthFormStore.getState().register.email).toBe("new@example.com");
    expect(useAuthFormStore.getState().register).not.toHaveProperty("role");
    expect(useAuthFormStore.getState().isRegisterSubmitting).toBe(true);

    useAuthFormStore.getState().resetRegisterForm();

    expect(useAuthFormStore.getState().register.username).toBe("");
    expect(useAuthFormStore.getState().isRegisterSubmitting).toBe(false);
  });
});
