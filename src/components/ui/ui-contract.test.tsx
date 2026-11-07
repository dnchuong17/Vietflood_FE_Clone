import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectTrigger, SelectValue } from "./select";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Badge, badgeVariants } from "./badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Field, FieldLabel, FieldDescription, FieldError } from "./field";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { Skeleton } from "./skeleton";
import { OperationsBanner } from "./operations-banner";
import { DropdownMenu, DropdownMenuTrigger } from "./dropdown-menu";
import { SiteHeader } from "@/components/navigation/site-header";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";

const session = vi.hoisted(() => ({
  identity: { role: "citizen", displayName: "Nguyễn Thị Phương Thảo" } as { role: string; displayName: string } | null,
  pathname: "/bao-cao",
  restored: true,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => session.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/auth/lib/use-auth-identity", () => ({
  useAuthIdentity: () => session.identity,
  useAuthIdentityState: () => ({ identity: session.identity, hasRestoredIdentity: session.restored }),
}));
vi.mock("@/components/feedback/global-alert-provider", () => ({ useGlobalAlert: () => ({ showAlert: vi.fn() }) }));
vi.mock("@/components/theme/theme-toggle", () => ({ ThemeToggle: () => <button type="button" aria-label="Giao diện" /> }));

vi.mock("@/components/motion/gsap-motion", () => ({
  prefersReducedMotion: () => true,
  MotionEnter: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  MotionPresence: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null,
}));

const render = (element: React.ReactNode) => renderToStaticMarkup(element);
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const theme = (dark: boolean) => Object.fromEntries(
  [...css.split(dark ? ".dark {" : ":root {")[1].split("}")[0].matchAll(/--([\w-]+):\s*([^;]+);/g)]
    .map((match) => [match[1], match[2].trim()]),
);
const luminance = (hex: string) => {
  const channels = hex.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a: string, b: string) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe("shared UI contract", () => {
  it("keeps default buttons primary, all existing variants and all sizes", () => {
    expect(buttonVariants()).toContain("bg-primary");
    for (const variant of ["default", "secondary", "outline", "ghost", "destructive"] as const) {
      const html = render(<Button variant={variant} disabled type="submit">Lưu thay đổi</Button>);
      expect(html).toContain('disabled=""');
      expect(html).toContain('type="submit"');
      expect(html).toContain("Lưu thay đổi");
      expect(html).toContain("focus-visible:outline-ring");
      expect(html).not.toContain("shadow-");
    }
    for (const size of ["default", "sm", "lg", "icon"] as const) {
      expect(buttonVariants({ size })).toContain(size === "icon" ? "size-11" : "min-h-");
    }
  });

  it("preserves asChild link semantics and caller classes", () => {
    const html = render(<Button asChild variant="outline" className="custom-action"><a href="https://example.test/report">Báo cáo</a></Button>);
    expect(html).toContain('<a href="https://example.test/report"');
    expect(html).not.toContain("<button");
    expect(html).toContain("custom-action");
  });

  it("retains native input contracts, opaque surfaces, validation and focus", () => {
    const html = render(<><Input id="email" name="email" type="email" required defaultValue="user@example.test" aria-invalid /><Textarea name="notes" rows={4} defaultValue="Đường Nguyễn Thị Minh Khai" disabled /></>);
    expect(html).toContain('type="email"');
    expect(html).toContain('name="email"');
    expect(html).toContain('required=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('rows="4"');
    expect(html).toContain("Đường Nguyễn Thị Minh Khai");
    expect(html.match(/bg-card/g)).toHaveLength(2);
    expect(html.match(/focus-visible:outline-ring/g)).toHaveLength(2);
    expect(html).not.toMatch(/(?:class="| )bg-transparent(?: |")/);
  });

  it("keeps select size, disabled and placeholder semantics", () => {
    const html = render(<Select disabled><SelectTrigger size="sm" aria-label="Tỉnh thành"><SelectValue placeholder="Chọn tỉnh thành" /></SelectTrigger></Select>);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("Chọn tỉnh thành");
    expect(html).toContain("bg-card");
  });

  it("retains checked, mixed and disabled choice states", () => {
    const html = render(<><Checkbox checked="indeterminate" aria-label="Chọn báo cáo" /><Switch checked size="sm" disabled aria-label="Thông báo" /></>);
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain('disabled=""');
    expect(html.match(/focus-visible:outline-ring/g)).toHaveLength(2);
  });

  it("renders flat readable cards without replacing caller content", () => {
    const html = render(<Card className="custom-panel"><CardHeader><CardTitle>Báo cáo hiện trường</CardTitle><CardDescription>Địa điểm và mức độ</CardDescription></CardHeader><CardContent>Nội dung</CardContent></Card>);
    expect(html).toContain("custom-panel");
    expect(html).toContain("text-base font-semibold");
    expect(html).toContain("Địa điểm và mức độ");
    expect(html).not.toContain("shadow");
  });

  it.each(["default", "secondary", "outline", "success", "warning", "critical"] as const)("preserves badge variant %s", (variant) => {
    expect(render(<Badge variant={variant}>Trạng thái</Badge>)).toContain(badgeVariants({ variant }));
  });

  it("keeps warning text readable on a translucent dark badge, not the solid-warning foreground", () => {
    expect(badgeVariants({ variant: "warning" })).toContain("dark:text-warning");
  });

  it("passes vertical orientation to Radix, retaining selected tab and panel semantics", () => {
    const html = render(<Tabs orientation="vertical" defaultValue="reports"><TabsList aria-label="Nội dung"><TabsTrigger value="reports">Báo cáo</TabsTrigger><TabsTrigger value="history" disabled>Lịch sử</TabsTrigger></TabsList><TabsContent value="reports">Chi tiết</TabsContent></Tabs>);
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Chi tiết");
    expect(html).toContain("focus-visible:outline-ring");
  });

  it("keeps labels, descriptions and deduplicated inline errors", () => {
    const html = render(<Field data-invalid><FieldLabel htmlFor="address">Địa chỉ</FieldLabel><Input id="address" aria-describedby="address-help" /><FieldDescription id="address-help">Nhập địa chỉ đầy đủ</FieldDescription><FieldError errors={[{ message: "Cần địa chỉ" }, { message: "Cần địa chỉ" }]} /></Field>);
    expect(html).toContain('for="address"');
    expect(html).toContain('aria-describedby="address-help"');
    expect(html).toContain('role="alert"');
    expect(html.match(/Cần địa chỉ/g)).toHaveLength(1);
  });

  it("preserves destructive alert semantics and truthful operations content", () => {
    const html = render(<><Alert variant="destructive"><AlertTitle>Không thể tải</AlertTitle><AlertDescription>Vui lòng thử lại</AlertDescription></Alert><OperationsBanner eyebrow="Hiện trường" title="Theo dõi báo cáo" description="Dữ liệu chưa xác minh"><Button>Thử lại</Button></OperationsBanner></>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("text-destructive");
    expect(html).toContain('aria-label="Hiện trường"');
    expect(html).toContain("Dữ liệu chưa xác minh");
    expect(html).toContain("Thử lại");
  });

  it("keeps dropdown trigger semantics and reduced-motion skeletons", () => {
    const html = render(<><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Thao tác</Button></DropdownMenuTrigger></DropdownMenu><Skeleton aria-hidden className="h-8" /></>);
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("motion-safe:animate-pulse");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("names and describes confirmations and preserves pending/destructive actions", () => {
    const html = render(<ConfirmDialog isOpen title="Xóa báo cáo?" description="Không thể hoàn tác." danger isConfirming onConfirm={() => {}} onCancel={() => {}} />);
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("bg-destructive");
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(render(<ConfirmDialog isOpen={false} title="Ẩn" description="Ẩn" onConfirm={() => {}} onCancel={() => {}} />)).toBe("");
  });

  it("keeps desktop/mobile destinations and active route names for citizens and relief", () => {
    for (const role of ["citizen", "relief"]) {
      session.identity = { role, displayName: "Nguyễn Thị Phương Thảo" };
      const html = render(<SiteHeader />);
      expect(html).toContain('aria-label="Điều hướng chính"');
      expect(html).toContain('aria-label="Thanh tab di động"');
      expect(html.match(/href="\/bao-cao"/g)).toHaveLength(2);
      expect(html.match(/aria-current="page"/g)).toHaveLength(2);
      expect(html).toContain(role === "citizen" ? 'href="/trang-chu"' : 'href="/cuu-tro"');
      expect(html).not.toContain("backdrop-blur");
    }
    session.identity = { role: "citizen", displayName: "Nguyễn Thị Phương Thảo" };
  });

  it("preserves guest login and keeps protected content out of unauthorized render", () => {
    session.identity = null;
    expect(render(<SiteHeader />)).toContain('href="/dang-nhap"');
    const html = render(<AppShell title="Báo cáo"><p>Protected content</p></AppShell>);
    expect(html).not.toContain("Protected content");
    expect(html).toContain("Đang kiểm tra quyền truy cập");
    session.identity = { role: "citizen", displayName: "Nguyễn Thị Phương Thảo" };
    expect(render(<AppShell allowedRoles={["relief"]}>Protected content</AppShell>)).not.toContain("Protected content");
  });

  it("renders compact task-first shell headers without route-entry motion", () => {
    const html = render(<AppShell title="Báo cáo hiện trường"><p>Nội dung</p></AppShell>);
    expect(html).toContain('class="workspace-header"');
    expect(html).toContain("workspace-title");
    expect(html).toContain("workspace-description");
    expect(html).toContain("Nội dung");
    expect(html).not.toContain("data-motion-policy");
  });

  it("defines the reusable workspace vocabulary and keeps operations/map compatibility", () => {
    for (const name of ["header", "title", "description", "section", "toolbar", "stack"]) {
      expect(css).toContain(`.workspace-${name} {`);
    }
    for (const name of ["operations-banner", "operations-surface", "operations-grid", "metric-tile", "map-workspace"]) {
      expect(css).toContain(`.${name} {`);
    }
    expect(css).not.toMatch(/(?:linear|radial)-gradient\(/);
    expect(css).toContain("--radius-sm: 0.5rem");
    expect(css).toContain("--radius-md: 0.75rem");
    expect(css).toContain("--radius-xl: 1rem");
  });

  it.each([false, true])("meets token text and control contrast in dark=%s", (dark) => {
    const t = theme(dark);
    expect(t.primary).toBe(dark ? "#7DC7F4" : "#1266A8");
    const surface = dark ? t.card : "#FFFFFF";
    for (const [a, b] of [[t.foreground, surface], [t["muted-foreground"], surface], [t["primary-foreground"], t.primary]]) {
      expect(contrast(a, b)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(t.input, surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.ring, surface)).toBeGreaterThanOrEqual(3);
  });
});
