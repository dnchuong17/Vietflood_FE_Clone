import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RegisterForm } from "./register-form";
import { AuthFormCard } from "./auth-form-card";
import { useAuthFormStore, resetAuthFormStore } from "@/features/auth/store/auth-form-store";

const loginSource = readFileSync(new URL("./login-form.tsx", import.meta.url), "utf8");
const registerSource = readFileSync(new URL("./register-form.tsx", import.meta.url), "utf8");
const authCardSource = readFileSync(new URL("./auth-form-card.tsx", import.meta.url), "utf8");

describe("auth form UI", () => {
  it("renders a task-first auth heading and form before supporting content on narrow screens", () => {
    const props = { title: "Đăng nhập", description: "Tiếp tục hỗ trợ", mode: "login" as const, children: null };
    const html = renderToStaticMarkup(createElement(AuthFormCard, props, createElement("form", { "aria-label": "Đăng nhập" })));
    expect(html).toContain('class="workspace-title">Đăng nhập</h1>');
    expect(html).toContain('aria-label="Đăng nhập"');
    expect(html).toContain("order-1");
    expect(html).toContain("order-2");
    expect(authCardSource).not.toContain("auth-experience.module.css");
  });

  it("uses shadcn form primitives for login and registration", () => {
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain("@/components/ui/button");
      expect(source).toContain("@/components/ui/input");
      expect(source).toContain("@/components/ui/field");
    }
  });

  it("uses the shared card composition for auth pages", () => {
    expect(authCardSource).toContain("@/components/ui/card");
    expect(authCardSource).toContain("CardHeader");
    expect(authCardSource).toContain("CardContent");
  });

  it("gives both authentication pages a semantic main heading", () => {
    expect(authCardSource).toContain('<h1 className={styles.formTitle}>{title}</h1>');
  });

  it("shows BarLoader feedback while login and registration submit", () => {
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain("@/components/feedback/loading-bar");
      expect(source).toContain("<LoadingBar");
      expect(source).toContain("isSubmitting ? (");
    }

    expect(loginSource).toContain('title="Đang đăng nhập..."');
    expect(registerSource).toContain('title="Đang tạo tài khoản..."');
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
vi.mock("@/features/auth/store/auth-form-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/store/auth-form-store")>();
  return {
    ...actual,
    useAuthFormStore: Object.assign(
      <T,>(selector: (state: ReturnType<typeof actual.useAuthFormStore.getState>) => T) => selector(actual.useAuthFormStore.getState()),
      actual.useAuthFormStore,
    ),
  };
});

const legacy = { province: "Tỉnh cũ chưa có trong danh mục", ward: "Xã lịch sử" };

describe("auth address picker integration", () => {
  beforeEach(() => {
    resetAuthFormStore();
    picker.props = null;
    useAuthFormStore.setState((state) => ({ register: { ...state.register, ...legacy, address_line: "12 Đường cũ", username: "pending-user", password: "unchanged-secret" } }));
  });

  it("preserves loaded legacy strings and commits address pairs atomically without overwriting pending fields", () => {
    renderToStaticMarkup(createElement(RegisterForm));
    const props = picker.props!;
    expect(props.idPrefix).toBe("register");
    expect(props.value).toEqual(legacy);
    expect(props.requiredProvince).not.toBe(true);
    expect(props.requiredWard).not.toBe(true);
    expect(useAuthFormStore.getState().register).toMatchObject({ ...legacy, address_line: "12 Đường cũ" });
    useAuthFormStore.getState().setRegisterField("email", "new@example.test");
    const observed: Array<{ province?: string; ward?: string }> = [];
    const unsubscribe = useAuthFormStore.subscribe((state) => observed.push({ province: state.register.province, ward: state.register.ward }));
    const next = { province: "Thành phố Đà Nẵng", ward: "" };
    props.onChange(next);
    unsubscribe();
    expect(observed).toEqual([next]);
    const after = useAuthFormStore.getState().register;
    expect(after).toMatchObject({ ...next, address_line: "12 Đường cũ" });
    expect(after.email).toBe("new@example.test");
    expect(after.password).toBe("unchanged-secret");
    props.onChange({ ...legacy });
    expect(useAuthFormStore.getState().register).toMatchObject(legacy);
  });

  it("groups registration into semantic account and contact fieldsets without losing address inputs", () => {
    const html = renderToStaticMarkup(createElement(RegisterForm));
    expect(html.match(/<fieldset/g)).toHaveLength(2);
    expect(html).toMatch(/<legend[^>]*>Thông tin tài khoản<\/legend>/);
    expect(html).toMatch(/<legend[^>]*>Liên hệ &amp; khu vực<\/legend>/);
    expect(html).toContain('id="register-address"');
    expect(html).toContain('name="street-address"');
    expect(picker.props?.value).toEqual(legacy);
  });

  it("passes saving state to the picker", () => {
    useAuthFormStore.getState().setRegisterSubmitting(true);
    renderToStaticMarkup(createElement(RegisterForm));
    expect(picker.props?.disabled).toBe(true);
  });
});
