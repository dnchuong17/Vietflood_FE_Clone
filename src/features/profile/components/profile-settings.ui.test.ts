import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileSettings } from "./profile-settings";
import { useProfileStore, resetProfileStore } from "@/features/profile/store/profile-store";

const source = readFileSync(
  new URL("./profile-settings.tsx", import.meta.url),
  "utf8",
);

describe("profile settings UI", () => {
  it("uses shadcn form controls and semantic surfaces", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/field");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/textarea");
    expect(source).toContain("@/features/location/components/vietnam-address-picker");
    expect(source).toContain("@/features/reports/lib/address-suggestions");
    expect(source).toContain("@/features/reports/store/reports-store");
    expect(source).toContain("<Button");
    expect(source).toContain("validateChangePasswordForm");
    expect(source).toContain("confirmPassword");
    expect(source).toContain("Eye");
    expect(source).toContain("buildProfileDisplayName");
    expect(source).toContain("buildProfileLocation");
    expect(source).toContain("buildProfileAvatarUrl");
    expect(source).toContain("formatProfileDate");
    expect(source).toContain("created_at");
    expect(source).toContain("updated_at");
    expect(source).toContain("date_of_birth");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });

  it("delegates divisions to the shared picker and keeps authorized street suggestions", () => {
    expect(source).toContain('<VietnamAddressPicker');
    expect(source).toContain('idPrefix="profile"');
    expect(source).toContain('disabled={isSaving}');
    expect(source).toContain('setForm({ ...useProfileStore.getState().form, ...next })');
    expect(source).not.toContain('searchProvinces');
    expect(source).not.toContain('searchWards');
    expect(source).not.toContain('selectedProvinceCode');
    expect(source).toContain("buildAddressSuggestions");
    expect(source).toContain("addressSuggestions");
    expect(source).toContain('updateField("address_line", suggestion)');
  });

  it("shows the mobile profile-home report summary on the profile route", () => {
    expect(source).toContain("buildProfileHomeSummary");
    expect(source).toContain("useAuthIdentity");
    expect(source).toContain("listReports");
    expect(source).toContain("summary.openTasks");
    expect(source).toContain("summary.unreadAlerts");
  });

  it("renders mobile-like profile-home quick actions by role", () => {
    expect(source).toContain("getProfileHomeActions");
    expect(source).toContain("profileHomeActions");
    expect(source).toContain("Hành động nhanh");
    expect(source).toContain("action.href");
    expect(source).toContain("action.description");
  });
});

type PickerProps = {
  idPrefix: string;
  value: { province: string; ward: string };
  onChange: (next: { province: string; ward: string }) => void;
  requiredProvince?: boolean;
  requiredWard?: boolean;
  disabled?: boolean;
};
const picker = vi.hoisted(() => ({ props: null as PickerProps | null }));
vi.mock("@/features/location/components/vietnam-address-picker", () => ({
  VietnamAddressPicker: (props: PickerProps) => { picker.props = props; return null; },
}));
vi.mock("@/components/feedback/global-alert-provider", () => ({
  useGlobalAlert: () => ({ showAlert: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

// SSR normally reads Zustand's initial snapshot. Use the current real store
// snapshot here so these server-rendered consumer tests can exercise saved drafts.
vi.mock("@/features/profile/store/profile-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/profile/store/profile-store")>();
  return {
    ...actual,
    useProfileStore: Object.assign(
      <T,>(selector: (state: ReturnType<typeof actual.useProfileStore.getState>) => T) => selector(actual.useProfileStore.getState()),
      actual.useProfileStore,
    ),
  };
});

const legacy = { province: "Tỉnh cũ chưa có trong danh mục", ward: "Xã lịch sử" };

describe("profile address picker integration", () => {
  beforeEach(() => {
    resetProfileStore();
    picker.props = null;
    useProfileStore.getState().setForm({ ...useProfileStore.getState().form, ...legacy, address_line: "12 Đường cũ" });
    useProfileStore.getState().setLoading(false);
  });

  it("preserves loaded legacy strings and commits address pairs atomically without overwriting pending fields", () => {
    renderToStaticMarkup(createElement(ProfileSettings));
    const props = picker.props!;
    expect(props.idPrefix).toBe("profile");
    expect(props.value).toEqual(legacy);
    expect(props.requiredProvince).not.toBe(true);
    expect(props.requiredWard).not.toBe(true);
    expect(useProfileStore.getState().form).toMatchObject({ ...legacy, address_line: "12 Đường cũ" });
    useProfileStore.getState().setFormField("email", "new@example.test");
    const observed: Array<{ province?: string; ward?: string }> = [];
    const unsubscribe = useProfileStore.subscribe((state) => observed.push({ province: state.form.province, ward: state.form.ward }));
    const next = { province: "Thành phố Đà Nẵng", ward: "" };
    props.onChange(next);
    unsubscribe();
    expect(observed).toEqual([next]);
    const after = useProfileStore.getState().form;
    expect(after).toMatchObject({ ...next, address_line: "12 Đường cũ" });
    expect(after.email).toBe("new@example.test");
    props.onChange({ ...legacy });
    expect(useProfileStore.getState().form).toMatchObject(legacy);
  });

  it("receives replacement saved values when the loaded account changes", () => {
    renderToStaticMarkup(createElement(ProfileSettings));
    const loaded = { province: "Tỉnh khác", ward: "Phường cũ khác" };
    useProfileStore.getState().setProfile({ id: 41, username: "loaded-profile", ...loaded, address_line: "89 Đường khác" });
    renderToStaticMarkup(createElement(ProfileSettings));
    expect(picker.props?.value).toEqual(loaded);
    expect(useProfileStore.getState().form).toMatchObject({ ...loaded, address_line: "89 Đường khác" });
  });

  it("passes saving state to the picker", () => {
    useProfileStore.getState().setSaving(true);
    renderToStaticMarkup(createElement(ProfileSettings));
    expect(picker.props?.disabled).toBe(true);
  });
});
