"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { clearAuthTokens, getAuthIdentity, type AuthIdentity } from "@/features/auth/lib/auth-storage";
import { mainNav, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
    const router = useRouter();
    const [identity, setIdentity] = useState<AuthIdentity | null | undefined>(undefined);

    useEffect(() => {
        setIdentity(getAuthIdentity());

        function syncAuthState() {
            setIdentity(getAuthIdentity());
        }

        window.addEventListener("storage", syncAuthState);

        return () => {
            window.removeEventListener("storage", syncAuthState);
        };
    }, []);

    function handleLogout() {
        clearAuthTokens();
        setIdentity(null);
        router.push("/trang-chu");
        router.refresh();
    }

    const visibleNavItems = useMemo(() => {
        if (identity === undefined) {
            return [];
        }

        return mainNav;
    }, [identity]);

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-auto flex min-h-[72px] w-[min(1120px,92vw)] items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:py-3">
                <Link
                    href="/trang-chu"
                    className="inline-flex items-center gap-2.5 font-bold"
                    aria-label="Trang chủ VietFlood Insight"
                >
                    <span className="h-3 w-3 rounded-full bg-gradient-to-br from-sky-600 to-teal-600 shadow-[0_0_0_5px_rgba(2,132,199,0.12)]" />
                    <span>{siteConfig.name}</span>
                </Link>

                <nav className="flex items-center gap-2 max-sm:w-full max-sm:flex-wrap" aria-label="Điều hướng chính">
                    {identity ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-teal-600 text-sm font-bold text-white"
                                title={identity.displayName}
                                aria-label={`Tài khoản ${identity.displayName}`}
                            >
                                {identity.initials}
                            </div>
                            <button
                                type="button"
                                className="rounded-full px-4 py-2 text-[0.95rem] font-semibold text-red-700 transition hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        visibleNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-full px-4 py-2 text-[0.95rem] font-semibold transition hover:bg-sky-50"
                            >
                                {item.label}
                            </Link>
                        ))
                    )}
                </nav>
            </div>
        </header>
    );
}
