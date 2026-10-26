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
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldCheckIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold leading-snug sm:text-xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </section>
  );
}
