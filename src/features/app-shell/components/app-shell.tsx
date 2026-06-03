"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ComponentType, type SVGProps } from "react";
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  LifebuoyIcon,
  RadioIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

import { LoadingBar } from "@/components/feedback/loading-bar";
import type { UserRole } from "@/features/auth/lib/roles";
import { getUserRoleLabel, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentityState } from "@/features/auth/lib/use-auth-identity";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";

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
  "/phan-cong": ClipboardDocumentCheckIcon,
  "/nguoi-dung": UserGroupIcon,
  "/ho-so": UserCircleIcon,
  "/huong-dan": BookOpenIcon,
};

export function AppShell({ children, allowedRoles, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { identity, hasRestoredIdentity } = useAuthIdentityState();
  const shouldReduceMotion = useReducedMotion();
  const role = normalizeRole(identity?.role);
  const isAllowed = role && (!allowedRoles || allowedRoles.includes(role));
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
      <main className="min-h-[calc(100vh-var(--navbar-height))] bg-background px-4 pt-[var(--navbar-height)]">
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
    <div className="min-h-screen bg-background pb-24 pt-[var(--navbar-height)] text-foreground lg:pb-8">
      <motion.div
        className="w-full px-4 py-4 mx-auto max-w-7xl"
        data-motion-policy="prefers-reduced-motion"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {title ? (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex min-w-0 items-center gap-3">
              {TitleIcon ? (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TitleIcon className="size-5" aria-hidden="true" />
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {getUserRoleLabel(role)}
                </p>
                <h1 className="truncate text-2xl font-bold text-foreground">{title}</h1>
              </div>
            </div>
            {/* <div className="px-3 py-2 text-sm border rounded-lg shadow-sm bg-card text-muted-foreground">
              {identity.displayName}
            </div> */}
          </div>
        ) : null}
        {children}
      </motion.div>
    </div>
  );
}
