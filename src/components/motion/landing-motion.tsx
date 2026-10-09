"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type HTMLAttributes } from "react";

import { prefersReducedMotion } from "@/components/motion/gsap-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type LandingMotionProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
};

const offsets = {
  up: { x: 0, y: 22 }, down: { x: 0, y: -22 },
  left: { x: 22, y: 0 }, right: { x: -22, y: 0 }, none: { x: 0, y: 0 },
};

export function LandingHeroMotion({ children, className, delay = 0, direction = "up", ...props }: LandingMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, scale: 0.98, ...offsets[direction] }, {
      autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.56, delay, ease: "power2.out", clearProps: "all",
    });
  }, { scope: ref, dependencies: [delay, direction], revertOnUpdate: true });
  return <div ref={ref} data-motion="landing-hero" data-motion-policy="prefers-reduced-motion" className={className} {...props}>{children}</div>;
}

export function LandingReveal({ children, className, delay = 0, direction = "up", ...props }: LandingMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    gsap.fromTo(element, { autoAlpha: 0, ...offsets[direction] }, {
      autoAlpha: 1, x: 0, y: 0, duration: 0.5, delay, ease: "power2.out", clearProps: "all",
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  }, { scope: ref, dependencies: [delay, direction], revertOnUpdate: true });
  return <div ref={ref} data-motion="landing-reveal" data-motion-policy="prefers-reduced-motion" className={className} {...props}>{children}</div>;
}

export function LandingStagger({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    const items = element.querySelectorAll<HTMLElement>("[data-motion='landing-item']");
    gsap.fromTo(items, { autoAlpha: 0, y: 18 }, {
      autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: "power2.out", clearProps: "all",
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  }, { scope: ref });
  return <div ref={ref} data-motion="landing-stagger" data-motion-policy="prefers-reduced-motion" className={className} {...props}>{children}</div>;
}

export function LandingMotionItem({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-motion="landing-item" className={className} {...props}>{children}</div>;
}

export function LandingPulseMarker({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.to(ref.current, { opacity: 0.72, scale: 1.26, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }, { scope: ref });
  return <div ref={ref} data-motion="landing-pulse-marker" className={cn("absolute size-3 rounded-full", className)} {...props} />;
}

export function LandingProgressBar({ className, width, ...props }: HTMLAttributes<HTMLDivElement> & { width: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    gsap.fromTo(element, { scaleX: 0, transformOrigin: "left center" }, {
      scaleX: 1, duration: 0.6, ease: "power2.out", clearProps: "transform",
      scrollTrigger: { trigger: element, start: "top 95%", once: true },
    });
  }, { scope: ref });
  return <div ref={ref} data-motion="landing-progress" className={cn("h-1.5 rounded-full bg-primary", className)} style={{ width }} {...props} />;
}
