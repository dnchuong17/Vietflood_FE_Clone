import type { ReactNode } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";

type OperationsBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

/** Context and next action, never a claim that live data is connected. */
export function OperationsBanner({ eyebrow, title, description, children, className }: OperationsBannerProps) {
  return (
    <section className={cn("operations-banner", className)} aria-label={eyebrow}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-card text-primary">
          <ShieldCheckIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">{eyebrow}</p>
          <h2 className="mt-1 text-base font-semibold leading-snug">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children ? <div className="flex max-w-full flex-wrap items-center gap-2">{children}</div> : null}
    </section>
  );
}
