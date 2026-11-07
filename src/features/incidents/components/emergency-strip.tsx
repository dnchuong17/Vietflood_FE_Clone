"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import {
  incidentGet,
  incidentDate,
  type Emergency,
  type Page,
} from "../api/incidents";
import { useIncidentEvents } from "./incident-common";

export function EmergencyStrip() {
  const [data, setData] = useState<Page<Emergency>>({
    items: [],
    nextCursor: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    try {
      const result = await incidentGet<Page<Emergency>>(
        "/incidents/emergencies",
        {},
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setData(result);
        setError(null);
        setLoaded(true);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Chưa tải được báo cáo khẩn cấp.",
        );
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 4000); // Leave one second for fetching and rendering within the five-second target.
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      request.current?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  useIncidentEvents(() => void refresh());
  async function more() {
    if (!data.nextCursor) return;
    try {
      const next = await incidentGet<Page<Emergency>>(
        "/incidents/emergencies",
        { cursor: data.nextCursor },
      );
      setData((prev) => ({
        items: [...prev.items, ...next.items],
        nextCursor: next.nextCursor,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thêm.");
    }
  }
  if (error && !data.items.length)
    return (
      <div
        role="status"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
      >
        Luồng khẩn cấp chưa cập nhật: {error}{" "}
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Thử lại
        </Button>
      </div>
    );
  if (!loaded)
    return (
      <p role="status" className="text-xs text-muted-foreground">
        Đang tải luồng báo cáo khẩn cấp...
      </p>
    );
  if (!data.items.length)
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="size-2 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        Chưa có báo cáo khẩn cấp đang chờ. Tự động cập nhật.
      </p>
    );
  return (
    <section
      aria-label="Báo cáo khẩn cấp"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          Luồng khẩn cấp bị gián đoạn. Các báo cáo dưới đây có thể chưa được cập
          nhật.
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ExclamationTriangleIcon
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <h2 className="font-bold">Cần chú ý ngay</h2>
          <span className="text-sm">
            {data.items.length}
            {data.nextCursor ? "+" : ""} báo cáo
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Thu gọn" : "Xem báo cáo"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Thông tin do người dân gửi, hiển thị trước khi AI tổng hợp. Chưa phải
        xác nhận mức độ nghiêm trọng.
      </p>
      {expanded ? (
        <ul className="mt-4 grid gap-3 xl:grid-cols-2">
          {data.items.map((item) => (
            <li key={item.report_id} className="min-w-0 space-y-3 rounded-xl border border-destructive/20 bg-card p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {item.snapshot.description}
              </p>
              <p className="my-2 text-xs text-muted-foreground">
                {item.snapshot.ward} · {incidentDate(item.snapshot.createdAt)}
              </p>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                href={
                  item.incident_id
                    ? `/su-co/${item.incident_id}`
                    : `/bao-cao/${item.report_id}`
                }
              >
                {item.incident_id ? "Mở sự cố" : "Mở báo cáo gốc"} #
                {item.report_id}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {expanded && data.nextCursor ? (
        <Button variant="ghost" onClick={() => void more()}>
          Tải thêm báo cáo khẩn cấp
        </Button>
      ) : null}
    </section>
  );
}
