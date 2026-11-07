"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, type ComponentType, type SVGProps } from "react";
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  LifebuoyIcon,
  RadioIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

import { LoadingBar } from "@/components/feedback/loading-bar";
import { MotionEnter } from "@/components/motion/gsap-motion";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/features/auth/lib/roles";
import { getUserRoleLabel, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentityState } from "@/features/auth/lib/use-auth-identity";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";
import { getWorkspaceContext } from "@/features/app-shell/lib/workspace-context";

type AppShellProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
};

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ROUTE_TITLE_ICONS: Record<string, HeroIcon> = {
  "/trang-chu": HomeIcon,
  "/bao-cao": DocumentTextIcon,
  "/theo-doi": RadioIcon,
  "/cuu-tro": LifebuoyIcon,
  "/su-co": LifebuoyIcon,
  "/phan-cong": ClipboardDocumentCheckIcon,
  "/nguoi-dung": UserGroupIcon,
  "/ho-so": UserCircleIcon,
  "/chat": ChatBubbleLeftRightIcon,
  "/huong-dan": BookOpenIcon,
};

export function AppShell({ children, allowedRoles, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { identity, hasRestoredIdentity } = useAuthIdentityState();
  const role = normalizeRole(identity?.role);
  const isAllowed = role && (!allowedRoles || allowedRoles.includes(role));
  const context = getWorkspaceContext(pathname);
  const TitleIcon = title
    ? ROUTE_TITLE_ICONS[
        Object.keys(ROUTE_TITLE_ICONS).find((route) => pathname.startsWith(route)) ??
          ""
      ]
    : null;

  useEffect(() => {
    if (!hasRestoredIdentity) {
      return;
    }

    if (!identity) {
      router.replace("/dang-nhap");
      return;
    }

    if (role && allowedRoles && !allowedRoles.includes(role)) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [allowedRoles, hasRestoredIdentity, identity, role, router]);

  if (!hasRestoredIdentity || !identity || !role || !isAllowed) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-var(--navbar-height))] bg-background px-4 pt-[var(--navbar-height)]">
        <div className="mx-auto grid min-h-[calc(100vh-var(--navbar-height))] max-w-xl place-items-center">
          <LoadingBar
            title="Đang kiểm tra quyền truy cập..."
            description="Đang khôi phục phiên và xác minh quyền vào khu vực này."
          />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="operations-surface min-h-dvh bg-background pb-24 pt-[var(--navbar-height)] text-foreground lg:pb-8">
      <MotionEnter
        distance={0}
        className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:py-6"
      >
        {title ? (
          <div className="workspace-header">
            <div className="flex min-w-0 items-center gap-3">
              {TitleIcon ? (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
                  <TitleIcon className="size-5" aria-hidden="true" />
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {context.label} · {getUserRoleLabel(role)}
                </p>
                <h1 className="workspace-title mt-1">{title}</h1>
                <p className="workspace-description">{context.description}</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Thao tác nhanh">
              {pathname !== "/trang-chu" ? <Button asChild variant="outline" size="sm"><Link href="/trang-chu">Bản đồ hiện trường</Link></Button> : null}
              <Button asChild variant="outline" size="sm"><Link href="/huong-dan">Hướng dẫn</Link></Button>
              {role === "citizen" && !pathname.startsWith("/bao-cao") ? (
                <Button asChild size="sm"><Link href="/bao-cao">Báo cáo sự cố</Link></Button>
              ) : null}
            </nav>
          </div>
        ) : null}
        {children}
      </MotionEnter>
    </main>
  );
}
