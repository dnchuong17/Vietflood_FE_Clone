import { afterEach, describe, expect, it } from "vitest";

import { resetProfileStore, useProfileStore } from "./profile-store";

describe("profile Zustand store", () => {
  afterEach(() => {
    resetProfileStore();
  });

  it("loads the backend profile into editable form state", () => {
    useProfileStore.getState().setProfile({
      id: 12,
      username: "citizen-a",
      first_name: "An",
      middle_name: null,
      last_name: "Nguyen",
      email: "an@example.com",
      phone: "0900000000",
      province: "Da Nang",
      ward: "Hai Chau",
      address_line: "Bach Dang",
    });

    expect(useProfileStore.getState().profile?.username).toBe("citizen-a");
    expect(useProfileStore.getState().form).toEqual({
      first_name: "An",
      middle_name: "",
      last_name: "Nguyen",
      email: "an@example.com",
      phone: "0900000000",
      province: "Da Nang",
      ward: "Hai Chau",
      address_line: "Bach Dang",
    });
  });

  it("keeps profile form, password form, and lookup state in one store", () => {
    useProfileStore.getState().setFormField("phone", "0911111111");
    useProfileStore.getState().handleProvinceInput("Quang Nam");
    useProfileStore.getState().setSelectedProvinceCode(510);
    useProfileStore.getState().setPasswordField("currentPassword", "oldpass");
    useProfileStore.getState().togglePasswordVisibility("currentPassword");
    useProfileStore.getState().setLoadingWards(true);

    expect(useProfileStore.getState().form.phone).toBe("0911111111");
    expect(useProfileStore.getState().form.province).toBe("Quang Nam");
    expect(useProfileStore.getState().form.ward).toBe("");
    expect(useProfileStore.getState().selectedProvinceCode).toBe(510);
    expect(useProfileStore.getState().passwordForm.currentPassword).toBe("oldpass");
    expect(useProfileStore.getState().visiblePasswords.currentPassword).toBe(true);
    expect(useProfileStore.getState().isLoadingWards).toBe(true);
  });

  it("resets state while preserving store actions", () => {
    useProfileStore.getState().setSaving(true);
    resetProfileStore();

    expect(useProfileStore.getState().isSaving).toBe(false);
    useProfileStore.getState().setFormField("email", "next@example.com");
    expect(useProfileStore.getState().form.email).toBe("next@example.com");
  });
});
