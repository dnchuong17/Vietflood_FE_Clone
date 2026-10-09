"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
    CheckIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";

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
        cancelButtonRef.current?.focus({ preventScroll: true });
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isConfirmingRef.current) {
                event.preventDefault();
                onCancelRef.current();
                return;
            }
            if (event.key !== "Tab") return;
            const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
            if (!controls.length) return;
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
            document.removeEventListener("keydown", onKeyDown);
            previousFocus?.focus({ preventScroll: true });
        };
    }, [isOpen]);

    const confirmButtonClass = danger
        ? "rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        : "rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60";

    const accentTextClass = danger ? "text-rose-700" : "text-teal-700";
    const borderClass = danger ? "border-rose-200" : "border-teal-200";

    return (
        <MotionPresence
            open={isOpen}
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/55 px-4"
            onClick={() => {
                if (!isConfirming) {
                    onCancel();
                }
            }}
        >
            <div
                ref={dialogRef}
                data-motion-panel
                className={`w-full max-w-md rounded-2xl border bg-white p-5 shadow-2xl ${borderClass}`}
                role="alertdialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
            >
                <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${accentTextClass}`}>
                    <span className="inline-flex items-center gap-1.5">
                        <ExclamationTriangleIcon className="size-4" aria-hidden="true" />
                        Xác nhận hành động
                    </span>
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
                <div className="mt-2 text-sm text-slate-600">{description}</div>

                {isConfirming ? (
                    <LoadingBar
                        title="Đang xử lý..."
                        description="Vui lòng chờ trong khi hệ thống hoàn tất thao tác."
                        className="mt-4"
                    />
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        <XMarkIcon className="mr-1.5 inline size-4 align-[-0.125em]" aria-hidden="true" />
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={confirmButtonClass}
                        onClick={onConfirm}
                        disabled={isConfirming}
                    >
                        <CheckIcon className="mr-1.5 inline size-4 align-[-0.125em]" aria-hidden="true" />
                        {isConfirming ? "Đang xử lý..." : confirmLabel}
                    </button>
                </div>
            </div>
        </MotionPresence>
    );
}
