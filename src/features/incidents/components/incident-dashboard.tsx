"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { ReliefDashboard } from "@/features/relief/components/relief-dashboard";
import {
  incidentGet,
  incidentChange,
  incidentDate,
  dateBoundary,
  STATUS_LABELS,
  SEVERITY_LABELS,
  type Filters,
  type Incident,
  type Overview,
  type Page,
  type ProcessingJob,
  type Review,
} from "../api/incidents";
import { Choice, Empty, IncidentBadges, IncidentLink } from "./incident-common";
import { EmergencyStrip } from "./emergency-strip";

const REASONS: Record<string, string> = {
  suggested_match: "Có sự cố tương tự, chờ xác nhận",
  ambiguous_match: "Nhiều dấu hiệu chưa đủ chắc chắn",
  missing_coordinates: "Thiếu tọa độ GPS",
  insufficient_flood_evidence: "Chưa đủ thông tin về ngập lụt",
  ambiguous_location: "Vị trí chưa rõ",
  incompatible_analysis: "Cần phân tích lại dữ liệu",
  analysis_unavailable: "Phân tích chưa thành công",
};

export function IncidentDashboard({
  assignments = false,
}: {
  assignments?: boolean;
}) {
  const identity = useAuthIdentity(),
    admin = identity?.role === "admin";
  const [view, setView] = useState<"incidents" | "reports" | "review">(
    "incidents",
  );
  const [filters, setFilters] = useState<Filters>({});
  const [data, setData] = useState<Page<Incident> | null>(null),
    [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const query = {
      ...filters,
      ...(assignments && identity?.role === "relief"
        ? { assignedToMe: "true" }
        : {}),
    };
    try {
      const [next, stats] = await Promise.all([
        incidentGet<Page<Incident>>("/incidents", query, controller.signal),
        incidentGet<Overview>("/incidents/overview", query, controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setData(next);
        setOverview(stats);
        setError(null);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Không thể tải sự cố.");
    }
  }, [filters, assignments, identity?.role]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- State updates follow asynchronous fetches; cleanup aborts stale requests.
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => {
      clearInterval(timer);
      request.current?.abort();
    };
  }, [refresh]);
  async function more() {
    if (!data?.nextCursor) return;
    setBusy(true);
    try {
      const next = await incidentGet<Page<Incident>>("/incidents", {
        ...filters,
        ...(assignments && identity?.role === "relief"
          ? { assignedToMe: "true" }
          : {}),
        cursor: data.nextCursor,
      });
      setData((current) => ({
        items: [...(current?.items ?? []), ...next.items],
        nextCursor: next.nextCursor,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thêm.");
    } finally {
      setBusy(false);
    }
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters({
      province: String(form.get("province") ?? "").trim(),
      ward: String(form.get("ward") ?? "").trim(),
      from: dateBoundary(String(form.get("from") ?? "")),
      to: dateBoundary(String(form.get("to") ?? ""), true),
      status: String(form.get("status") ?? ""),
      severity: String(form.get("severity") ?? ""),
    });
  }
  const [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all");
  return (
    <div className="space-y-5">
      <EmergencyStrip />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Tình hình tại hiện trường
          </p>
          <h2 className="mt-1 text-xl font-bold">
            {assignments
              ? "Sự cố được phân công"
              : "Từ nhiều báo cáo đến một bức tranh chung"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi nhận định đều có nguồn. Mỗi quyết định cứu trợ do con người xác
            nhận.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()}>
          <ArrowPathIcon className="size-4" />
          Làm mới
        </Button>
      </div>
      {overview ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[
            ["Báo cáo người dân", overview.totalReports],
            ["Sự cố tổng hợp", overview.totalIncidents],
            ["Ưu tiên cao", overview.highPriority],
            ["Chờ xác minh", overview.awaitingVerification],
            ["Cập nhật trong 24 giờ", overview.recentlyUpdated],
          ].map(([label, count]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-24" />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2" aria-label="Chế độ xem cứu trợ">
        <Button
          variant={view === "incidents" ? "default" : "outline"}
          onClick={() => setView("incidents")}
        >
          Sự cố
        </Button>
        {!assignments ? (
          <Button
            variant={view === "reports" ? "default" : "outline"}
            onClick={() => setView("reports")}
          >
            Từng báo cáo
          </Button>
        ) : null}
        {admin ? (
          <Button
            variant={view === "review" ? "default" : "outline"}
            onClick={() => setView("review")}
          >
            Duyệt ghép nhóm{" "}
            {overview?.pendingReviews ? `(${overview.pendingReviews})` : ""}
          </Button>
        ) : null}
        <Link
          href="/phan-cong"
          className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Phân công
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error} Dữ liệu trước đó có thể chưa được cập nhật.
          </AlertDescription>
        </Alert>
      ) : null}
      {view === "reports" ? (
        <ReliefDashboard />
      ) : view === "review" ? (
        <ReviewQueue onChange={() => void refresh()} />
      ) : (
        <>
          {overview ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4" />
              <span>
                {overview.mode === "review"
                  ? "Ghép nhóm đang ở chế độ quản trị viên duyệt."
                  : "Ghép nhóm tự động chỉ áp dụng khi vượt qua kiểm định."}
              </span>
              {!overview.processingEnabled ? (
                <Badge variant="warning">Xử lý AI đang tạm dừng</Badge>
              ) : null}
              {overview.failedJobs ? (
                <Badge variant="warning">
                  {overview.failedJobs} tác vụ cần kiểm tra
                </Badge>
              ) : null}
            </div>
          ) : null}
          <form
            onSubmit={apply}
            className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="grid gap-1.5 text-xs font-semibold">
              Tỉnh / thành phố
              <Input name="province" placeholder="Đà Nẵng" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">
              Phường / xã
              <Input name="ward" placeholder="Hải Châu" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">
              Từ ngày
              <Input name="from" type="date" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">
              Đến ngày
              <Input name="to" type="date" />
            </label>
            <Choice
              id="incident-status-filter"
              label="Trạng thái"
              value={status}
              onChange={setStatus}
              options={{ all: "Tất cả trạng thái", ...STATUS_LABELS }}
            />
            <input
              type="hidden"
              name="status"
              value={status === "all" ? "" : status}
            />
            <Choice
              id="incident-severity-filter"
              label="Mức độ"
              value={severity}
              onChange={setSeverity}
              options={{ all: "Tất cả mức độ", ...SEVERITY_LABELS }}
            />
            <input
              type="hidden"
              name="severity"
              value={severity === "all" ? "" : severity}
            />
            <Button type="submit" className="self-end">
              Áp dụng bộ lọc
            </Button>
            <Button
              type="reset"
              variant="ghost"
              className="self-end"
              onClick={() => {
                setFilters({});
                setStatus("all");
                setSeverity("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          </form>
          {data?.items.length ? (
            <div className="grid gap-3">
              {data.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <IncidentLink id={item.id}>{item.title}</IncidentLink>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.address || "Chưa xác định vị trí"}
                      </p>
                      <div className="mt-3">
                        <IncidentBadges incident={item} />
                      </div>
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="font-semibold tabular-nums">
                        {item.reportCount} báo cáo liên quan
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cập nhật {incidentDate(item.updated_at)}
                      </p>
                      <p className="mt-2 text-xs">
                        {item.assignee_id
                          ? `Cứu trợ #${item.assignee_id}`
                          : "Chưa phân công"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data ? (
            <Empty>
              Chưa có sự cố phù hợp. Báo cáo mới đang được phân tích hoặc chờ
              duyệt.
            </Empty>
          ) : null}
          {data?.nextCursor ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void more()}
            >
              {busy ? "Đang tải..." : "Tải thêm sự cố"}
            </Button>
          ) : null}
          {admin ? <Backfill onChange={() => void refresh()} /> : null}
        </>
      )}
    </div>
  );
}

function ReviewQueue({ onChange }: { onChange: () => void }) {
  const [page, setPage] = useState<Page<Review> | null>(null),
    [error, setError] = useState<string | null>(null);
  const load = useCallback(async (cursor?: string) => {
    try {
      const next = await incidentGet<Page<Review>>("/incidents/review", {
        cursor,
      });
      setPage((prev) => ({
        items: cursor ? [...(prev?.items ?? []), ...next.items] : next.items,
        nextCursor: next.nextCursor,
      }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được hàng chờ.");
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Updates are responses to an asynchronous API read.
    void load();
  }, [load]);
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold">Xem bằng chứng trước khi ghép nhóm</h3>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {page?.items.map((item) => (
        <ReviewCard
          key={`${item.report_id}:${item.revision}`}
          item={item}
          onDone={() => {
            void load();
            onChange();
          }}
        />
      ))}
      {page && !page.items.length ? (
        <Empty>Không có báo cáo chờ duyệt ghép nhóm.</Empty>
      ) : null}
      {page?.nextCursor ? (
        <Button variant="outline" onClick={() => void load(page.nextCursor!)}>
          Tải thêm báo cáo chờ duyệt
        </Button>
      ) : null}
    </section>
  );
}
function ReviewCard({ item, onDone }: { item: Review; onDone: () => void }) {
  const [target, setTarget] = useState(
      item.candidates[0]?.incidentId ?? "none",
    ),
    [reason, setReason] = useState(""),
    [action, setAction] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const candidate = item.candidates.find((c) => c.incidentId === target);
  async function confirm() {
    setBusy(true);
    try {
      await incidentChange(`/incidents/review/${item.report_id}/resolve`, {
        action,
        expectedRevision: item.revision,
        reason,
        ...(action === "attach"
          ? { incidentId: target, expectedVersion: candidate?.version }
          : {}),
      });
      setAction(null);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xử lý báo cáo.");
      setAction(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Báo cáo #{item.report_id}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {REASONS[item.reason] ?? "Cần kiểm tra"} ·{" "}
          {incidentDate(item.snapshot.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <blockquote className="border-l-2 border-primary/40 pl-3 text-sm leading-6">
          {item.snapshot.description}
        </blockquote>
        <p className="text-xs text-muted-foreground">
          {[
            item.snapshot.addressLine,
            item.snapshot.ward,
            item.snapshot.province,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
        {item.candidates.length ? (
          <>
            <Choice
              id={`review-target-${item.report_id}`}
              label="Sự cố được đề xuất"
              value={target}
              onChange={setTarget}
              options={Object.fromEntries(
                item.candidates.map((c) => [
                  c.incidentId,
                  `${c.title} · ${c.distanceMeters} m`,
                ]),
              )}
            />
            {candidate ? (
              <p className="text-xs">
                Độ tương đồng: {candidate.score.toFixed(3)} (không phải xác suất
                đúng).{" "}
                <IncidentLink id={candidate.incidentId}>
                  Xem sự cố để đối chiếu
                </IncidentLink>
              </p>
            ) : null}
          </>
        ) : null}
        <label className="grid gap-1 text-xs font-semibold">
          Lý do quyết định
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            placeholder="Ghi lại căn cứ đã kiểm tra"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {candidate ? (
            <Button
              disabled={busy || reason.trim().length < 3}
              onClick={() => setAction("attach")}
            >
              Ghép vào sự cố đã chọn
            </Button>
          ) : null}
          <Button
            variant="outline"
            disabled={busy || reason.trim().length < 3}
            onClick={() => setAction("create")}
          >
            Tạo sự cố riêng
          </Button>
          <Button
            variant="ghost"
            disabled={busy || reason.trim().length < 3}
            onClick={() => setAction("exclude")}
          >
            Không thuộc phạm vi ngập lụt
          </Button>
        </div>
        <ConfirmDialog
          isOpen={!!action}
          title="Xác nhận quyết định ghép nhóm"
          description={
            <>
              <p>
                {action === "attach"
                  ? `Ghép báo cáo #${item.report_id} vào ${candidate?.title}.`
                  : action === "create"
                    ? "Tạo một sự cố riêng từ báo cáo này."
                    : "Giữ nguyên báo cáo và loại khỏi xử lý ngập lụt tự động."}
              </p>
              <p className="mt-2">Lý do: {reason}</p>
            </>
          }
          onConfirm={() => void confirm()}
          onCancel={() => setAction(null)}
          isConfirming={busy}
        />
      </CardContent>
    </Card>
  );
}
function Backfill({ onChange }: { onChange: () => void }) {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [busy, setBusy] = useState(false),
    [job, setJob] = useState<ProcessingJob | null>(null),
    [error, setError] = useState<string | null>(null);
  async function check(id: string) {
    try {
      setJob(await incidentGet<ProcessingJob>(`/ai/incidents/jobs/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được tiến độ.");
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await incidentChange<{ jobId: string }>(
        "/ai/incidents/process",
        { from: dateBoundary(from), to: dateBoundary(to, true) },
      );
      await check(result.jobId);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể bắt đầu xử lý.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-xl border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Xử lý báo cáo đã có
      </summary>
      <p className="my-3 text-xs text-muted-foreground">
        Chọn tối đa 31 ngày và 1.000 báo cáo mỗi lần. Các bản gốc vẫn được giữ
        nguyên.
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-semibold">
          Từ ngày lịch sử
          <Input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          Đến ngày lịch sử
          <Input
            type="date"
            required
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy || !from || !to}>
          {busy ? "Đang tiếp nhận..." : "Bắt đầu xử lý"}
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {job ? (
        <div role="status" className="mt-3 text-sm">
          <p>
            Đã tiếp nhận đợt xử lý.{" "}
            {job.children
              .map(
                (c) =>
                  `${({ pending: "Đang chờ", running: "Đang xử lý", succeeded: "Hoàn thành", failed: "Lỗi", obsolete: "Đã có bản mới" } as Record<string, string>)[c.status] ?? c.status}: ${c.count}`,
              )
              .join(" · ")}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void check(job.id)}>
            Cập nhật tiến độ
          </Button>
        </div>
      ) : null}
    </details>
  );
}
