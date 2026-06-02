"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

import { cn } from "@/lib/utils";

type LandingMotionProps = HTMLMotionProps<"div"> & {
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
};

type LandingProgressBarProps = Omit<
  HTMLMotionProps<"div">,
  "style"
> & {
  width: string;
};

const offsetByDirection = {
  up: { y: 22 },
  down: { y: -22 },
  left: { x: 22 },
  right: { x: -22 },
  none: {},
} as const;

const staggerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

export function LandingHeroMotion({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: LandingMotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-hero"
      data-motion-policy="prefers-reduced-motion"
      className={className}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, scale: 0.98, ...offsetByDirection[direction] }
      }
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: 1, scale: 1, x: 0, y: 0 }
      }
      transition={{ delay, duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function LandingReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: LandingMotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-reveal"
      data-motion-policy="prefers-reduced-motion"
      className={className}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, ...offsetByDirection[direction] }
      }
      whileInView={
        shouldReduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }
      }
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function LandingStagger({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-stagger"
      data-motion-policy="prefers-reduced-motion"
      className={className}
      variants={shouldReduceMotion ? undefined : staggerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "show"}
      viewport={{ once: true, margin: "-80px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function LandingMotionItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-item"
      className={className}
      variants={shouldReduceMotion ? undefined : itemVariants}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function LandingPulseMarker({
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-pulse-marker"
      className={cn("absolute size-3 rounded-full", className)}
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: [1, 0.72, 1], scale: [1, 1.26, 1] }
      }
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      {...props}
    />
  );
}

export function LandingProgressBar({
  className,
  width,
  ...props
}: LandingProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-motion="landing-progress"
      className={cn("h-1.5 rounded-full bg-primary", className)}
      initial={shouldReduceMotion ? false : { width: 0 }}
      whileInView={shouldReduceMotion ? undefined : { width }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={shouldReduceMotion ? { width } : undefined}
      {...props}
    />
  );
}
