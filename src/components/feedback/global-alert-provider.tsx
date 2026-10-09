"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MotionPresence } from "@/components/motion/gsap-motion";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";

type AlertVariant = "success" | "error" | "info";

type ShowAlertOptions = {
    title?: string;
    description: string;
    variant?: AlertVariant;
    durationMs?: number;
};

type AlertState = {
    id: number;
    title?: string;
    description: string;
    variant: AlertVariant;
};

type GlobalAlertContextValue = {
    showAlert: (options: ShowAlertOptions) => void;
};

const GlobalAlertContext = createContext<GlobalAlertContextValue | null>(null);
const DEFAULT_DURATION_MS = 3200;

function getVariantClasses(variant: AlertVariant): string {
    if (variant === "success") {
        return "border-emerald-200 bg-emerald-50 text-emerald-900";
    }

    if (variant === "error") {
        return "border-red-200 bg-red-50 text-red-900";
    }

    return "border-sky-200 bg-sky-50 text-sky-900";
}

function AlertIcon({ variant }: { variant: AlertVariant }) {
    if (variant === "success") {
        return <CheckCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />;
    }

    if (variant === "error") {
        return <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />;
    }

    return <InformationCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />;
}

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState | null>(null);
    const [displayAlert, setDisplayAlert] = useState<AlertState | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearDismissTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const dismissAlert = useCallback(() => {
        clearDismissTimer();
        setAlert(null);
    }, [clearDismissTimer]);

    const showAlert = useCallback(
        ({ title, description, variant = "info", durationMs = DEFAULT_DURATION_MS }: ShowAlertOptions) => {
            clearDismissTimer();

            const nextAlert = {
                id: Date.now(),
                title,
                description,
                variant,
            };
            setDisplayAlert(nextAlert);
            setAlert(nextAlert);

            timeoutRef.current = setTimeout(() => {
                setAlert(null);
                timeoutRef.current = null;
            }, durationMs);
        },
        [clearDismissTimer],
    );

    useEffect(() => {
        return () => {
            clearDismissTimer();
        };
    }, [clearDismissTimer]);

    const contextValue = useMemo(() => ({ showAlert }), [showAlert]);

    return (
        <GlobalAlertContext.Provider value={contextValue}>
            {children}

            <MotionPresence
                    open={!!alert}
                    mode="toast"
                    onExitComplete={() => setDisplayAlert(null)}
                    className="pointer-events-none fixed right-4 z-60 w-[min(26rem,calc(100%-2rem))]"
                >
                {displayAlert ? (
                    <div
                        key={displayAlert.id}
                        data-motion-panel
                        role="status"
                        aria-live="polite"
                        className={`pointer-events-auto w-full rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${getVariantClasses(displayAlert.variant)}`}
                        style={{ marginTop: "max(1rem, env(safe-area-inset-top))" }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                                <AlertIcon variant={displayAlert.variant} />
                                <div className="space-y-0.5">
                                {displayAlert.title ? <p className="m-0 text-sm font-semibold">{displayAlert.title}</p> : null}
                                <p className="m-0 text-sm">{displayAlert.description}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={dismissAlert}
                                className="rounded-full p-1 text-current/80 transition hover:bg-black/10 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                                aria-label="Đóng thông báo"
                            >
                                <XMarkIcon className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                ) : null}
            </MotionPresence>
        </GlobalAlertContext.Provider>
    );
}

export function useGlobalAlert(): GlobalAlertContextValue {
    const context = useContext(GlobalAlertContext);

    if (!context) {
        throw new Error("useGlobalAlert phải được dùng bên trong GlobalAlertProvider.");
    }

    return context;
}
