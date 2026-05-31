"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardList,
  Home,
  MapPinned,
  RadioTower,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import type { UserRole } from "@/features/auth/lib/roles";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import {
  getDefaultRouteForRole,
  getTabsForRole,
  isTabActive,
  type AppTab,
} from "@/features/app-shell/lib/tabs";

type AppShellProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
};

function TabIcon({ tab }: { tab: AppTab }) {
  const className = "h-5 w-5";

  if (tab.href === "/trang-chu") {
    return <Home className={className} aria-hidden="true" />;
  }
  if (tab.href === "/cuu-tro") {
    return <Shield className={className} aria-hidden="true" />;
  }
  if (tab.href === "/bao-cao") {
    return <ClipboardList className={className} aria-hidden="true" />;
  }
  if (tab.href === "/theo-doi") {
    return <RadioTower className={className} aria-hidden="true" />;
  }
  if (tab.href === "/nguoi-dung") {
    return <Users className={className} aria-hidden="true" />;
  }
  if (tab.href === "/ho-so") {
    return <Settings className={className} aria-hidden="true" />;
  }

  return <MapPinned className={className} aria-hidden="true" />;
}

export function AppShell({ children, allowedRoles, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const isAllowed = role && (!allowedRoles || allowedRoles.includes(role));

  useEffect(() => {
    if (!identity) {
      router.replace("/dang-nhap");
      return;
    }

    if (role && allowedRoles && !allowedRoles.includes(role)) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [allowedRoles, identity, role, router]);

  if (!identity || !role || !isAllowed) {
    return (
      <main className="grid min-h-[calc(100vh-var(--navbar-height))] place-items-center bg-slate-50 px-4 pt-[var(--navbar-height)] text-sm font-semibold text-slate-600">
        Checking access...
      </main>
    );
  }

  const tabs = getTabsForRole(role);

  return (
    <div className="min-h-full bg-slate-50 pb-24 pt-[var(--navbar-height)] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        {title ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                {role}
              </p>
              <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              {identity.displayName}
            </div>
          </div>
        ) : null}
        {children}
      </div>

      <nav
        aria-label="Main app tabs"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.7)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 sm:max-w-2xl sm:grid-cols-5">
          {tabs.map((tab) => {
            const active = isTabActive(tab, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold transition ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <TabIcon tab={tab} />
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
