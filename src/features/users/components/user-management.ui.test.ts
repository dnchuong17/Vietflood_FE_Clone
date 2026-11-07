import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UserManagement } from "./user-management";
import { useUsersStore, resetUsersStore } from "@/features/users/store/users-store";

const source = readFileSync(
  new URL("./user-management.tsx", import.meta.url),
  "utf8",
);

describe("user management UI", () => {
  it("uses shadcn controls, badges, and semantic surfaces", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/select");
    expect(source).toContain("@/components/ui/badge");
    expect(source).toContain("<Button");
    expect(source).toContain("buildUsersOverviewSummary");
    expect(source).toContain("formatUsersLastSyncedAt");
    expect(source).toContain("lastSyncedAt");
    expect(source).toContain("Tổng người dùng");
    expect(source).toContain("Đang hiển thị");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });

  it("validates uncommitted address drafts before non-form Save without wrapping permission actions in a form", () => {
    const saveHandler = source.slice(source.indexOf("async function handleSave()"), source.indexOf("async function handleAssignRole()"));
    expect(source).toContain('<div ref={addressPickerRef}>');
    expect(source).not.toContain('<form');
    expect(saveHandler).toContain('addressPickerRef.current?.querySelectorAll("input")');
    expect(saveHandler).toContain('!input.reportValidity()');
    expect(saveHandler.indexOf('!input.reportValidity()')).toBeLessThan(saveHandler.indexOf('setSaving(true)'));
    expect(saveHandler.indexOf('!input.reportValidity()')).toBeLessThan(saveHandler.indexOf('await updateUser('));
  });

  it("shows mobile-like selected-user report history for relief and admin", () => {
    expect(source).toContain("listReports");
    expect(source).toContain("filterReportsByUserId");
    expect(source).toContain("selectedUserReports");
    expect(source).toContain("Báo cáo của người dùng");
    expect(source).toContain('href={`/bao-cao/${report.id}`}');
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
vi.mock("@/features/users/store/users-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/users/store/users-store")>();
  return {
    ...actual,
    useUsersStore: Object.assign(
      <T,>(selector: (state: ReturnType<typeof actual.useUsersStore.getState>) => T) => selector(actual.useUsersStore.getState()),
      actual.useUsersStore,
    ),
  };
});

const legacy = { province: "Tỉnh cũ chưa có trong danh mục", ward: "Xã lịch sử" };

describe("users address picker integration", () => {
  beforeEach(() => {
    resetUsersStore();
    picker.props = null;
    useUsersStore.getState().selectUser({ id: 12, username: "fixture-user", role: "citizen", ...legacy, address_line: "12 Đường cũ" });
    useUsersStore.getState().setLoading(false);
  });

  it("preserves loaded legacy strings and commits address pairs atomically without overwriting pending fields", () => {
    renderToStaticMarkup(createElement(UserManagement));
    const props = picker.props!;
    expect(props.idPrefix).toBe("user-address");
    expect(props.value).toEqual(legacy);
    expect(props.requiredProvince).not.toBe(true);
    expect(props.requiredWard).not.toBe(true);
    expect(useUsersStore.getState().form).toMatchObject({ ...legacy, address_line: "12 Đường cũ" });
    useUsersStore.getState().setField("email", "new@example.test");
    const observed: Array<{ province?: string; ward?: string }> = [];
    const unsubscribe = useUsersStore.subscribe((state) => observed.push({ province: state.form.province, ward: state.form.ward }));
    const next = { province: "Thành phố Đà Nẵng", ward: "" };
    props.onChange(next);
    unsubscribe();
    expect(observed).toEqual([next]);
    const after = useUsersStore.getState().form;
    expect(after).toMatchObject({ ...next, address_line: "12 Đường cũ" });
    expect(after.email).toBe("new@example.test");
    expect(after.role).toBe("citizen");
    props.onChange({ ...legacy });
    expect(useUsersStore.getState().form).toMatchObject(legacy);
  });

  it("receives replacement saved values when the loaded account changes", () => {
    renderToStaticMarkup(createElement(UserManagement));
    const loaded = { province: "Tỉnh khác", ward: "Phường cũ khác" };
    useUsersStore.getState().selectUser({ id: 41, username: "another-user", role: "relief", ...loaded, address_line: "89 Đường khác" });
    renderToStaticMarkup(createElement(UserManagement));
    expect(picker.props?.value).toEqual(loaded);
    expect(useUsersStore.getState().form).toMatchObject({ ...loaded, address_line: "89 Đường khác" });
  });

  it("passes saving state to the picker", () => {
    useUsersStore.getState().setSaving(true);
    renderToStaticMarkup(createElement(UserManagement));
    expect(picker.props?.disabled).toBe(true);
  });
});
