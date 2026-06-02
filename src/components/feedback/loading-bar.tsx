"use client";

import type { CSSProperties } from "react";
import BarLoader from "react-spinners/BarLoader";

import { cn } from "@/lib/utils";

const barLoaderStyle = {
  borderRadius: 9999,
} satisfies CSSProperties;

type LoadingBarProps = {
  title: string;
  description?: string;
  className?: string;
};

export function LoadingBar({ title, description, className }: LoadingBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <BarLoader
          aria-hidden="true"
          color="var(--primary)"
          cssOverride={barLoaderStyle}
          height={4}
          speedMultiplier={0.85}
          width="100%"
        />
      </div>
    </div>
  );
}
