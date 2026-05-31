"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { getTabsForRole, isTabActive } from "@/features/app-shell/lib/tabs";
import { clearAuthTokens } from "@/features/auth/lib/auth-storage";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { normalizeRole } from "@/features/auth/lib/roles";
import { siteConfig } from "@/lib/site-config";

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
      title: "Signed out",
      description: "Your VietFlood session has ended.",
      variant: "info",
    });
    router.push("/trang-chu");
    router.refresh();
    setIsLoggingOut(false);
  }

  const tabs = role ? getTabsForRole(role) : [];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-[var(--navbar-height)] max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          href="/trang-chu"
          className="inline-flex items-center gap-2.5 font-bold"
          aria-label="VietFlood home"
        >
          <span className="h-3 w-3 rounded-full bg-linear-to-br from-sky-600 to-teal-600 shadow-[0_0_0_5px_rgba(2,132,199,0.12)]" />
          <span>{siteConfig.name}</span>
        </Link>

        {tabs.length > 0 ? (
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {tabs.map((tab) => {
              const active = isTabActive(tab, pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {identity ? (
            <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
              {identity.displayName}
            </span>
          ) : null}
          {identity ? (
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/dang-nhap"
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
