"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useRef, useState, type HTMLAttributes, type MouseEventHandler, type ReactNode } from "react";

import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;
}

type EnterProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  distance?: number;
  delay?: number;
};

export function MotionEnter({ children, distance = 12, delay = 0, className, ...props }: EnterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, y: distance }, {
      autoAlpha: 1, y: 0, duration: 0.42, delay, ease: "power2.out", clearProps: "all",
    });
  }, { scope: ref, dependencies: [pathname, distance, delay], revertOnUpdate: true });

  return <div ref={ref} className={className} data-motion-policy="prefers-reduced-motion" {...props}>{children}</div>;
}

export function MotionReveal({ children, distance = 20, delay = 0, className, ...props }: EnterProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    const scroller = element.closest<HTMLElement>("[data-motion-scroller]");
    gsap.fromTo(element, { autoAlpha: 0, y: distance }, {
      autoAlpha: 1, y: 0, duration: 0.55, delay, ease: "power2.out", clearProps: "all",
      scrollTrigger: {
        trigger: element,
        scroller: scroller ?? undefined,
        start: "top 92%",
        once: true,
      },
    });
  }, { scope: ref, dependencies: [distance, delay], revertOnUpdate: true });

  return <div ref={ref} className={className} data-motion-policy="prefers-reduced-motion" {...props}>{children}</div>;
}

type PresenceProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  mode?: "dialog" | "sheet" | "toast";
  onExitComplete?: () => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
};

export function MotionPresence({ open, children, className, mode = "dialog", onExitComplete, onClick, onMouseDown }: PresenceProps) {
  const [rendered, setRendered] = useState(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = open || rendered;

  useGSAP(() => {
    if (open && !rendered) setRendered(true);
  }, { dependencies: [open, rendered] });

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !visible) return;
    const panel = root.querySelector<HTMLElement>("[data-motion-panel]");
    if (prefersReducedMotion()) {
      if (!open) {
        setRendered(false);
        onExitComplete?.();
      }
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        if (!open) {
          setRendered(false);
          onExitComplete?.();
        }
      },
    });
    if (open) {
      timeline.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
      if (panel) timeline.fromTo(panel,
        { autoAlpha: 0, x: mode === "sheet" ? -20 : 0, y: mode === "toast" ? -12 : mode === "dialog" ? 12 : 0, scale: mode === "dialog" ? 0.98 : 1 },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.28, ease: "power2.out" }, 0);
    } else {
      if (panel) timeline.to(panel, {
        autoAlpha: 0, x: mode === "sheet" ? -16 : 0, y: mode === "toast" ? -10 : mode === "dialog" ? 8 : 0,
        duration: 0.18, ease: "power1.in",
      });
      timeline.to(root, { autoAlpha: 0, duration: 0.18, ease: "power1.in" }, 0);
    }
  }, { scope: rootRef, dependencies: [open, visible, mode], revertOnUpdate: true });

  if (!visible) return null;
  return <div ref={rootRef} className={cn(className)} inert={!open} onClick={onClick} onMouseDown={onMouseDown} data-motion-policy="prefers-reduced-motion">{children}</div>;
}
