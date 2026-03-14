"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { clearAuthTokens, getAuthIdentity, type AuthIdentity } from "@/features/auth/lib/auth-storage";
import { siteConfig } from "@/lib/site-config";

function subscribeToStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}

export function SiteHeader() {
    const router = useRouter();
    const identity = useSyncExternalStore<AuthIdentity | null>(
        subscribeToStorage,
        getAuthIdentity,
        () => null,
    );

    function handleAuthAction() {
        if (identity) {
            clearAuthTokens();
            router.push("/trang-chu");
            router.refresh();
            return;
        }

        router.push("/dang-nhap");
    }

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-4 flex min-h-7 items-center justify-between">
                <Link
                    href="/trang-chu"
                    className="inline-flex items-center gap-2.5 font-bold"
                    aria-label="Trang chủ VietFlood Insight"
                >
                    <span className="h-3 w-3 rounded-full bg-linear-to-br from-sky-600 to-teal-600 shadow-[0_0_0_5px_rgba(2,132,199,0.12)]" />
                    <span>{siteConfig.name}</span>
                </Link>

                <button
                    type="button"
                    className={"rounded-full my-1 mx-3 text-[0.95rem] font-semibold"}
                    onClick={handleAuthAction}
                >
                    {identity ? "Đăng xuất" : "Đăng nhập"}
                </button>
            </div>
        </header>
    );
}
