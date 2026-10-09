"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowRightEndOnRectangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentityState } from "@/features/auth/lib/use-auth-identity";

type LandingAuthActionsProps = {
  placement: "header" | "hero" | "workflow";
};

export function LandingAuthActions({ placement }: LandingAuthActionsProps) {
  const { identity, hasRestoredIdentity } = useAuthIdentityState();

  if (!hasRestoredIdentity) {
    return (
      <span
        className={placement === "header"
          ? "h-9 w-28 animate-pulse rounded-lg bg-muted motion-reduce:animate-none sm:w-56"
          : placement === "hero"
            ? "h-11 w-52 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
            : "h-9 w-64 max-w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none"}
        aria-label="Đang kiểm tra phiên đăng nhập"
        role="status"
      />
    );
  }

  if (identity) {
    const destination = getDefaultRouteForRole(normalizeRole(identity.role) ?? "citizen");

    if (placement === "header") {
      return (
        <>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:hidden" title={identity.displayName} aria-hidden="true">
            {identity.initials}
          </span>
          <span className="hidden max-w-36 truncate text-sm font-semibold text-muted-foreground sm:inline-block" title={identity.displayName}>
            {identity.displayName}
          </span>
          <span className="sr-only">Đã đăng nhập: {identity.displayName}</span>
          <Button asChild>
            <Link href={destination} aria-label={`Vào ứng dụng với tài khoản ${identity.displayName}`}>
              <span className="sm:hidden">Ứng dụng</span>
              <span className="hidden sm:inline">Vào ứng dụng</span>
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </>
      );
    }

    return (
      <Button asChild size={placement === "hero" ? "lg" : "default"}>
        <Link href={destination}>
          {placement === "hero" ? "Tiếp tục vào ứng dụng" : "Tiếp tục trong ứng dụng"}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  if (placement === "header") {
    return (
      <>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/dang-nhap">
            <ArrowRightEndOnRectangleIcon data-icon="inline-start" aria-hidden="true" />
            Đăng nhập
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dang-ky">
            <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
            Tạo tài khoản
          </Link>
        </Button>
      </>
    );
  }

  if (placement === "hero") {
    return (
      <Button asChild size="lg">
        <Link href="/dang-nhap">
          <ArrowRightEndOnRectangleIcon data-icon="inline-start" aria-hidden="true" />
          Đăng nhập
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild>
        <Link href="/dang-ky">
          <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
          Bắt đầu với vai trò người dân
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/dang-nhap">
          <ArrowRightEndOnRectangleIcon data-icon="inline-start" aria-hidden="true" />
          Mở bảng điều phối
        </Link>
      </Button>
    </>
  );
}
