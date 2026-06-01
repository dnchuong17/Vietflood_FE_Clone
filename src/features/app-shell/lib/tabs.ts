import type { UserRole } from "@/features/auth/lib/roles";

export type AppTab = {
  href: string;
  label: string;
  match?: string[];
};

const CITIZEN_TABS: AppTab[] = [
  { href: "/trang-chu", label: "Bản đồ", match: ["/trang-chu"] },
  { href: "/bao-cao", label: "Báo cáo", match: ["/bao-cao"] },
  { href: "/theo-doi", label: "Theo dõi", match: ["/theo-doi"] },
  { href: "/ho-so", label: "Hồ sơ", match: ["/ho-so"] },
];

const OPERATIONAL_TABS: AppTab[] = [
  { href: "/cuu-tro", label: "Cứu trợ", match: ["/cuu-tro", "/phan-cong"] },
  { href: "/bao-cao", label: "Báo cáo", match: ["/bao-cao"] },
  { href: "/theo-doi", label: "Theo dõi", match: ["/theo-doi"] },
  { href: "/nguoi-dung", label: "Người dùng", match: ["/nguoi-dung"] },
  { href: "/ho-so", label: "Hồ sơ", match: ["/ho-so"] },
];

export function getTabsForRole(role: UserRole): AppTab[] {
  return role === "citizen" ? CITIZEN_TABS : OPERATIONAL_TABS;
}

export function getDefaultRouteForRole(role: UserRole): string {
  return role === "citizen" ? "/trang-chu" : "/cuu-tro";
}

export function isTabActive(tab: AppTab, pathname: string): boolean {
  return (tab.match ?? [tab.href]).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
