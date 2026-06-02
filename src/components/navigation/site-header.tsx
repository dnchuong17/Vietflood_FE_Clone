"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  RadioTower,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { getTabsForRole, isTabActive } from "@/features/app-shell/lib/tabs";
import { clearAuthTokens } from "@/features/auth/lib/auth-storage";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { normalizeRole } from "@/features/auth/lib/roles";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const TAB_ICONS: Record<string, LucideIcon> = {
  "/trang-chu": Home,
  "/cuu-tro": HeartHandshake,
  "/bao-cao": FileText,
  "/theo-doi": RadioTower,
  "/nguoi-dung": UsersRound,
  "/ho-so": UserRound,
};

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    setIsLoggingOut(true);
    clearAuthTokens();
    showAlert({
      title: "Đã đăng xuất",
      description: "Phiên VietFlood của bạn đã kết thúc.",
      variant: "info",
    });
    router.push("/trang-chu");
    router.refresh();
    setIsLoggingOut(false);
  }

  const tabs = role ? getTabsForRole(role) : [];

  return (
    <>
      <header className="sticky top-0 z-20 border-b shadow-sm bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid h-[var(--navbar-height)] max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2.5 font-bold"
            aria-label="Trang chủ VietFlood"
          >
            <span className="size-3 shrink-0 rounded-full bg-linear-to-br from-primary to-success shadow-[0_0_0_5px_color-mix(in_oklch,var(--primary)_18%,transparent)]" />
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </Link>

          {tabs.length > 0 ? (
            <nav
              className="hidden min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain whitespace-nowrap px-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden"
              aria-label="Điều hướng chính"
            >
              {tabs.map((tab) => {
                const active = isTabActive(tab, pathname);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold transition sm:px-3",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="flex items-center justify-end min-w-0 gap-2">
            <ThemeToggle />
            {identity ? (
              <span className="hidden rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                {identity.displayName}
              </span>
            ) : null}
            {identity ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Đăng xuất"
              >
                <LogOut data-icon="inline-start" className="sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {tabs.length > 0 ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
          aria-label="Thanh tab di động"
        >
          <div
            className="grid max-w-md px-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map((tab) => {
              const active = isTabActive(tab, pathname);
              const Icon = TAB_ICONS[tab.href] ?? Home;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
