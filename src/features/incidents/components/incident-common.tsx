"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { API_BASE_URL } from "@/lib/api-config";
import {
  STATUS_LABELS,
  SEVERITY_LABELS,
  type Incident,
} from "../api/incidents";

export function Choice({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function IncidentBadges({ incident }: { incident: Incident }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={incident.isUrgent ? "critical" : "secondary"}>
        {SEVERITY_LABELS[incident.severity]}
      </Badge>
      <Badge variant={incident.status === "RESOLVED" ? "success" : "outline"}>
        {STATUS_LABELS[incident.status]}
      </Badge>
      {incident.needsVerification ? (
        <Badge variant="warning">Cần xác minh</Badge>
      ) : null}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
export function EvidenceLink({
  reportId,
  children,
}: {
  reportId: number;
  children: ReactNode;
}) {
  return (
    <a
      href={`#report-${reportId}`}
      className="font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  );
}
export function IncidentLink({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/su-co/${id}`}
      className="font-semibold text-primary hover:underline"
    >
      {children}
    </Link>
  );
}
export function useIncidentEvents(onChange: () => void) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const socket = io(`${API_BASE_URL}/incidents`, {
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
    });
    let pending: ReturnType<typeof setTimeout> | undefined;
    socket.on("incidents.changed", () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = undefined;
        callback.current();
      }, 200);
    });
    return () => {
      clearTimeout(pending);
      socket.disconnect();
    };
  }, []);
}
