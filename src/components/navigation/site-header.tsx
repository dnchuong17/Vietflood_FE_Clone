"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  ArrowLeftStartOnRectangleIcon as LogOut,
  ArrowRightEndOnRectangleIcon as LogIn,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon as FileText,
  HomeIcon as Home,
  ShieldCheckIcon,
  LifebuoyIcon as HeartHandshake,
  RadioIcon as RadioTower,
  UserCircleIcon as UserRound,
  UserGroupIcon as UsersRound,
} from "@heroicons/react/24/solid";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { prefersReducedMotion } from "@/components/motion/gsap-motion";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { getTabsForRole, isTabActive } from "@/features/app-shell/lib/tabs";
import { clearAuthTokens } from "@/features/auth/lib/auth-storage";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { normalizeRole } from "@/features/auth/lib/roles";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const TAB_ICONS: Record<string, HeroIcon> = {
  "/trang-chu": Home,
  "/cuu-tro": HeartHandshake,
  "/bao-cao": FileText,
  "/theo-doi": RadioTower,
  "/nguoi-dung": UsersRound,
  "/ho-so": UserRound,
  "/chat": ChatBubbleLeftRightIcon,
};

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!headerRef.current || prefersReducedMotion()) return;
    gsap.fromTo(headerRef.current, { y: -8 }, {
      y: 0, duration: 0.24, ease: "power2.out", clearProps: "all",
    });
  }, { scope: headerRef });

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
    window.setTimeout(() => setIsLoggingOut(false), 700);
  }

  const tabs = role ? getTabsForRole(role) : [];

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b border-border bg-card"
        data-motion="site-header"
        data-motion-policy="prefers-reduced-motion"
      >
        <div className="mx-auto grid h-[var(--navbar-height)] max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2.5 font-bold"
            aria-label="Trang chủ VietFlood"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheckIcon className="size-6" aria-hidden="true" /></span>
            <span className="hidden sm:grid"><span>{siteConfig.name}</span><span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Ứng phó ngập lụt</span></span>
          </Link>

          {tabs.length > 0 ? (
            <nav
              className="hidden min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain whitespace-nowrap px-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden"
              aria-label="Điều hướng chính"
            >
              {tabs.map((tab) => {
                const active = isTabActive(tab, pathname);
                const Icon = TAB_ICONS[tab.href] ?? Home;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "shrink-0 rounded-sm px-2.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 sm:px-3",
                      active
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="inline size-4 align-[-0.125em]" aria-hidden="true" />
                    <span className="ml-1.5">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="flex items-center justify-end min-w-0 gap-2">
            <ThemeToggle />
            {identity ? (
              <span className="hidden max-w-28 truncate rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold text-muted-foreground xl:inline-block" title={identity.displayName}>
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
                <span className="hidden sm:inline">
                  {isLoggingOut ? "Đang xuất..." : "Đăng xuất"}
                </span>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/dang-nhap">
                  <LogIn data-icon="inline-start" aria-hidden="true" />
                  Đăng nhập
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {isLoggingOut ? (
        <LoadingBar
          title="Đang đăng xuất..."
          description="Đang kết thúc phiên và đưa bạn về trang chủ."
          className="fixed inset-x-0 top-[var(--navbar-height)] z-50 rounded-none border-x-0 border-t-0"
        />
      ) : null}

      {tabs.length > 0 ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                    "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-[11px] leading-4 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full text-center break-words">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
