"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { UserRole } from "@/features/auth/lib/roles";
import { getUserRoleLabel, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentityState } from "@/features/auth/lib/use-auth-identity";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";

type AppShellProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
};

export function AppShell({ children, allowedRoles, title }: AppShellProps) {
  const router = useRouter();
  const { identity, hasRestoredIdentity } = useAuthIdentityState();
  const shouldReduceMotion = useReducedMotion();
  const role = normalizeRole(identity?.role);
  const isAllowed = role && (!allowedRoles || allowedRoles.includes(role));

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
      <main className="grid min-h-[calc(100vh-var(--navbar-height))] place-items-center bg-background px-4 pt-[var(--navbar-height)] text-sm font-semibold text-muted-foreground">
        Đang kiểm tra quyền truy cập...
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {getUserRoleLabel(role)}
              </p>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
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
