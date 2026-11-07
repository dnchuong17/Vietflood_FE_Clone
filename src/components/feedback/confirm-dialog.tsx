"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import {
    CheckIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { MotionPresence } from "@/components/motion/gsap-motion";

type ConfirmDialogProps = {
    isOpen: boolean;
    title: string;
    description: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isConfirming?: boolean;
    danger?: boolean;
};

export function ConfirmDialog({
    isOpen,
    title,
    description,
    onConfirm,
    onCancel,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    isConfirming = false,
    danger = false,
}: ConfirmDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const onCancelRef = useRef(onCancel);
    const isConfirmingRef = useRef(isConfirming);

    useEffect(() => {
        onCancelRef.current = onCancel;
        isConfirmingRef.current = isConfirming;
    }, [onCancel, isConfirming]);

    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focusFrame = requestAnimationFrame(() => {
            (cancelButtonRef.current?.disabled ? dialogRef.current : cancelButtonRef.current)?.focus({ preventScroll: true });
        });
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isConfirmingRef.current) {
                event.preventDefault();
                onCancelRef.current();
                return;
            }
            if (event.key !== "Tab") return;
            const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
            if (!controls.length) {
                event.preventDefault();
                dialogRef.current?.focus();
                return;
            }
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!dialogRef.current?.contains(document.activeElement)) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            cancelAnimationFrame(focusFrame);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
            previousFocus?.focus({ preventScroll: true });
        };
    }, [isOpen]);

    const accentTextClass = danger ? "text-destructive" : "text-primary";

    return (
        <MotionPresence
            open={isOpen}
            className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6"
            onClick={() => {
                if (!isConfirming) {
                    onCancel();
                }
            }}
        >
            <div
                ref={dialogRef}
                data-motion-panel
                className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
                tabIndex={-1}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                aria-busy={isConfirming}
                onClick={(event) => event.stopPropagation()}
            >
                <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${accentTextClass}`}>
                    <span className="inline-flex items-center gap-1.5">
                        <ExclamationTriangleIcon className="size-4" aria-hidden="true" />
                        Xác nhận hành động
                    </span>
                </p>
                <h3 id={titleId} className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
                <div id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>

                {isConfirming ? (
                    <LoadingBar
                        title="Đang xử lý..."
                        description="Vui lòng chờ trong khi hệ thống hoàn tất thao tác."
                        className="mt-4"
                    />
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                    <Button
                        ref={cancelButtonRef}
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        <XMarkIcon className="mr-1.5 inline size-4 align-[-0.125em]" aria-hidden="true" />
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant={danger ? "destructive" : "default"}
                        onClick={onConfirm}
                        disabled={isConfirming}
                    >
                        <CheckIcon className="mr-1.5 inline size-4 align-[-0.125em]" aria-hidden="true" />
                        {isConfirming ? "Đang xử lý..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </MotionPresence>
    );
}
