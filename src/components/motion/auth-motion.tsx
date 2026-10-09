"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

import { prefersReducedMotion } from "@/components/motion/gsap-motion";

export function AuthPageMotion({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useGSAP(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const targets = [
      root.querySelector("[data-auth-motion='header']"),
      root.querySelector("[data-auth-motion='frame']"),
      root.querySelector("[data-auth-motion='story']"),
    ].filter(Boolean);
    gsap.fromTo(targets, { autoAlpha: 0, y: 20 }, {
      autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08, ease: "power2.out", clearProps: "all",
    });
  }, { scope: ref, dependencies: [pathname], revertOnUpdate: true });
  return <div ref={ref} className={className} data-motion-policy="prefers-reduced-motion">{children}</div>;
}
