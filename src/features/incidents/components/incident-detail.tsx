"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { WindyMap } from "@/features/map/components/windy-map";
import {
  incidentGet,
  incidentChange,
  incidentDate,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type Assignee,
  type Audit,
  type Fact,
  type Incident,
  type IncidentDetail as Detail,
  type Page,
  type ReportRevision,
  type SourceReport,
} from "../api/incidents";
import { Choice, Empty, IncidentBadges, IncidentLink } from "./incident-common";
import { EmergencyStrip } from "./emergency-strip";

const AUDIT_LABELS: Record<string, string> = {
  "incident.detected": "Phát hiện sự cố",
  "report.attached": "Ghép báo cáo",
  "report.auto_attached": "Tự động ghép báo cáo",
  "report.archived": "Lưu trữ báo cáo",
  "incident.verify": "Xác minh bằng chứng",
  "incident.status": "Cập nhật trạng thái",
  "incident.severity": "Đánh giá mức độ",
  "incident.assignment": "Phân công cứu trợ",
  "incident.merged": "Ghép vào sự cố khác",
  "incident.merge_source": "Nhận báo cáo từ sự cố khác",
  "incident.split": "Tách nhóm báo cáo",
  "incident.split_from": "Tạo sự cố sau khi tách",
  "summary.requested": "Yêu cầu tóm tắt lại",
  "summary.generated": "Cập nhật tóm tắt",
};
function tokenUserId() {
  try {
    const part = getAccessToken()?.split(".")[1];
    return part
      ? Number(JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))).sub)
      : null;
  } catch {
    return null;
  }
}

export function IncidentDetail({ incidentId }: { incidentId: string }) {
  const identity = useAuthIdentity(),
    admin = identity?.role === "admin";
  const [incident, setIncident] = useState<Detail | null>(null),
    [sources, setSources] = useState<Page<SourceReport>>({
      items: [],
      nextCursor: null,
    }),
    [history, setHistory] = useState<Page<Audit>>({
      items: [],
      nextCursor: null,
    });
  const [assignees, setAssignees] = useState<Assignee[]>([]),
    [others, setOthers] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(""),
    [severity, setSeverity] = useState("UNKNOWN"),
    [status, setStatus] = useState("none"),
    [assignee, setAssignee] = useState("none"),
    [mergeSource, setMergeSource] = useState("none");
  const [selected, setSelected] = useState<number[]>([]),
    [verified, setVerified] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
      null,
    ),
    [factLimit, setFactLimit] = useState(30);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => Promise<unknown>;
  } | null>(null);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const [next, reports, events] = await Promise.all([
        incidentGet<Detail>(`/incidents/${incidentId}`, {}, controller.signal),
        incidentGet<Page<SourceReport>>(
          `/incidents/${incidentId}/reports`,
          {},
          controller.signal,
        ),
        incidentGet<Page<Audit>>(
          `/incidents/${incidentId}/history`,
          {},
          controller.signal,
        ),
      ]);
      if (controller.signal.aborted) return;
      setIncident(next);
      setSources(reports);
      setHistory(events);
      setSeverity(next.severity);
      setStatus("none");
      setAssignee(next.assignee_id ? String(next.assignee_id) : "none");
      setVerified(
        next.facts.filter((f) => f.provenance === "verified").map((f) => f.id),
      );
      setSelected([]);
      setError(null);
      if (typeof next.lat === "number" && typeof next.lng === "number")
        setLocation({ lat: next.lat, lng: next.lng });
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Không thể tải sự cố.");
    }
  }, [incidentId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- State updates follow asynchronous fetches; cleanup aborts stale requests.
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);
  useEffect(() => {
    if (!admin) return;
    let active = true;
    Promise.all([
      incidentGet<Page<Assignee>>("/incidents/assignees", { limit: 100 }),
      incidentGet<Page<Incident>>("/incidents", { limit: 100 }),
    ])
      .then(([users, items]) => {
        if (active) {
          setAssignees(users.items);
          setOthers(
            items.items.filter((i) => i.id !== incidentId && !i.merged_into),
          );
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Không tải được danh sách phân công hoặc ghép nhóm. Vui lòng tải lại.",
          );
      });
    return () => {
      active = false;
    };
  }, [admin, incidentId]);
  async function run() {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      await confirm.action();
      setConfirm(null);
      setMessage("Đã ghi nhận thay đổi.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu thay đổi.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }
  function change(
    action: string,
    body: Record<string, unknown>,
    method: "POST" | "PATCH",
    title: string,
  ) {
    if (!incident) return;
    const payload = { expectedVersion: incident.version, reason, ...body };
    setConfirm({
      title,
      description: `${title} cho “${incident.title}”. Lý do: ${reason}`,
      action: () =>
        incidentChange(`/incidents/${incidentId}/${action}`, payload, method),
    });
  }
  async function moreReports() {
    if (!sources.nextCursor) return;
    try {
      const next = await incidentGet<Page<SourceReport>>(
        `/incidents/${incidentId}/reports`,
        { cursor: sources.nextCursor },
      );
      setSources((prev) => ({
        items: [...prev.items, ...next.items],
        nextCursor: next.nextCursor,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được báo cáo.");
    }
  }
  async function moreHistory() {
    if (!history.nextCursor) return;
    try {
      const next = await incidentGet<Page<Audit>>(
        `/incidents/${incidentId}/history`,
        { cursor: history.nextCursor },
      );
      setHistory((prev) => ({
        items: [...prev.items, ...next.items],
        nextCursor: next.nextCursor,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được lịch sử.");
    }
  }
  const canProgress =
    admin ||
    (identity?.role === "relief" && incident?.assignee_id === tokenUserId());
  const canSave = reason.trim().length >= 3 && !busy;
  async function revealSource(reportId: number) {
    try {
      if (!sources.items.some((r) => r.id === reportId)) {
        const source = await incidentGet<SourceReport>(
          `/incidents/${incidentId}/reports/${reportId}`,
        );
        setSources((prev) => ({ ...prev, items: [...prev.items, source] }));
      }
      requestAnimationFrame(() =>
        document
          .getElementById(`report-${reportId}`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không tải được nguồn báo cáo.",
      );
    }
  }
  const verifiedIds = new Set(
    incident?.facts.filter((f) => f.provenance === "verified").map((f) => f.id),
  );
  return (
    <div className="space-y-5">
      <Link
        href="/cuu-tro"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeftIcon className="size-4" />
        Tất cả sự cố
      </Link>
      <EmergencyStrip />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error}{" "}
            <Button variant="ghost" size="sm" onClick={() => void refresh()}>
              Tải lại dữ liệu
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      ) : null}
      {!incident && !error ? <Skeleton className="h-64" /> : null}
      {incident ? (
        <>
          {incident.merged_into ? (
            <Alert>
              <AlertDescription>
                Sự cố đã được ghép.{" "}
                <IncidentLink id={incident.merged_into}>
                  Mở sự cố đang được theo dõi
                </IncidentLink>
                . Lịch sử cũ vẫn được giữ.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{incident.title}</h2>
              <p className="mb-3 mt-2 text-sm text-muted-foreground">
                {incident.address || "Chưa xác định vị trí"} ·{" "}
                {incident.reportCount} báo cáo
              </p>
              <IncidentBadges incident={incident} />
            </div>
            <Button variant="outline" onClick={() => void refresh()}>
              <ArrowPathIcon className="size-4" />
              Cập nhật
            </Button>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Tóm tắt có dẫn chứng</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Bắt đầu {incidentDate(incident.first_reported_at)} · Ghi
                    nhận mới nhất {incidentDate(incident.latest_reported_at)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ["Đường bị chặn", incident.blockedRoadReports],
                      ["Người mắc kẹt", incident.strandedPeopleReports],
                      ["Xe mắc kẹt", incident.strandedVehicleReports],
                    ].map(([label, count]) => (
                      <div key={label} className="rounded-lg bg-muted p-3">
                        <p className="text-2xl font-bold tabular-nums">
                          {count}
                        </p>
                        <p className="text-xs">
                          báo cáo đề cập {String(label).toLowerCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {incident.summaryStale ? (
                    <Alert>
                      <AlertDescription>
                        {incident.summary
                          ? "Có bằng chứng mới. Tóm tắt này chưa phản ánh toàn bộ cập nhật."
                          : "Chưa có tóm tắt AI. Các báo cáo gốc và số liệu hiện có vẫn xem được bên dưới."}
                        {incident.summaryJob?.status === "failed"
                          ? " Tác vụ tóm tắt cần được thử lại."
                          : ""}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {incident.summary ? (
                    <>
                      <FactList
                        title="Tình hình được ghi nhận"
                        facts={incident.summary.conditions}
                        verifiedIds={verifiedIds}
                        onSource={(id) => void revealSource(id)}
                      />
                      <FactList
                        title="Mực nước được báo cáo"
                        facts={incident.summary.depths}
                        verifiedIds={verifiedIds}
                        onSource={(id) => void revealSource(id)}
                      />
                      <FactList
                        title="Thay đổi theo thời gian"
                        facts={incident.summary.updates}
                        verifiedIds={verifiedIds}
                        onSource={(id) => void revealSource(id)}
                      />
                      <p className="text-sm">
                        AI đề xuất mức độ:{" "}
                        <strong>
                          {
                            SEVERITY_LABELS[
                              incident.summary.suggestedSeverity.value
                            ]
                          }
                        </strong>{" "}
                        <Badge variant="outline">
                          Ước tính, chưa phải quyết định
                        </Badge>
                      </p>
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <h3 className="font-semibold">
                          Khuyến nghị để người phụ trách xem xét
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                          {incident.summary.recommendations.map((r) => (
                            <li key={r.code}>{r.text}</li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Khuyến nghị không tự động triển khai lực lượng.
                        </p>
                      </div>
                    </>
                  ) : null}
                  {admin && !incident.merged_into ? (
                    <Button
                      variant="outline"
                      disabled={!canSave}
                      onClick={() =>
                        change(
                          "regenerate-summary",
                          {},
                          "POST",
                          "Tạo lại tóm tắt",
                        )
                      }
                    >
                      Tạo lại tóm tắt
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
              <section
                aria-labelledby="source-reports-title"
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 id="source-reports-title" className="text-lg font-bold">
                    Báo cáo gốc · {incident.reportCount}
                  </h3>
                  {admin ? (
                    <span className="text-xs text-muted-foreground">
                      Chọn báo cáo để tách nhóm
                    </span>
                  ) : null}
                </div>
                {sources.items.map((source) => (
                  <SourceCard
                    key={source.id}
                    incidentId={incidentId}
                    source={source}
                    selectable={admin && !incident.merged_into}
                    selected={selected.includes(source.id)}
                    onSelect={(value) =>
                      setSelected((prev) =>
                        value
                          ? [...prev, source.id]
                          : prev.filter((id) => id !== source.id),
                      )
                    }
                    onLocation={setLocation}
                  />
                ))}
                {!sources.items.length ? (
                  <Empty>Chưa có báo cáo đang liên kết với sự cố này.</Empty>
                ) : null}
                {sources.nextCursor ? (
                  <Button variant="outline" onClick={() => void moreReports()}>
                    Tải thêm báo cáo gốc
                  </Button>
                ) : null}
                {admin && !incident.merged_into ? (
                  <Button
                    variant="outline"
                    disabled={
                      !canSave ||
                      !selected.length ||
                      selected.length >= incident.reportCount
                    }
                    onClick={() =>
                      change(
                        "split",
                        { reportIds: selected },
                        "POST",
                        `Tách ${selected.length} báo cáo thành sự cố riêng`,
                      )
                    }
                  >
                    Tách báo cáo đã chọn ({selected.length})
                  </Button>
                ) : null}
              </section>
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử xử lý</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {history.items.map((event) => (
                      <li
                        key={event.id}
                        className="border-l-2 border-border pl-3"
                      >
                        <p className="text-sm font-semibold">
                          {AUDIT_LABELS[event.action] ?? "Cập nhật sự cố"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {incidentDate(event.created_at)} ·{" "}
                          {event.actor_id
                            ? `Người phụ trách #${event.actor_id}`
                            : event.action === "report.archived"
                              ? "Chưa ghi nhận người thao tác"
                              : "Hệ thống"}
                        </p>
                        {event.reason ? (
                          <p className="mt-1 text-sm">{event.reason}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  {history.nextCursor ? (
                    <Button variant="ghost" onClick={() => void moreHistory()}>
                      Tải thêm lịch sử
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
            <aside className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Vị trí đại diện</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Điểm từ báo cáo, không phải ranh giới ngập đã xác minh.
                  </p>
                </CardHeader>
                <CardContent>
                  {location ? (
                    <div className="h-72 overflow-hidden rounded-xl">
                      <WindyMap
                        lat={location.lat}
                        lon={location.lng}
                        zoom={15}
                      />
                    </div>
                  ) : (
                    <Empty>Chưa có tọa độ GPS. Cần xác minh vị trí.</Empty>
                  )}
                </CardContent>
              </Card>
              {!incident.merged_into && canProgress ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Quyết định xử lý</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="grid gap-2 text-xs font-semibold">
                      Lý do / căn cứ cho thao tác
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={1000}
                        placeholder="Ghi rõ thông tin đã kiểm tra"
                      />
                    </label>
                    <Choice
                      id="incident-next-status"
                      label="Trạng thái tiếp theo"
                      value={status}
                      onChange={setStatus}
                      options={
                        admin
                          ? {
                              none: "Chọn trạng thái tiếp theo",
                              DETECTED: STATUS_LABELS.DETECTED,
                              UNDER_REVIEW: STATUS_LABELS.UNDER_REVIEW,
                              RESCUE_DEPLOYED: STATUS_LABELS.RESCUE_DEPLOYED,
                              RESOLVED: STATUS_LABELS.RESOLVED,
                            }
                          : {
                              none: "Chọn trạng thái tiếp theo",
                              RESCUE_DEPLOYED: STATUS_LABELS.RESCUE_DEPLOYED,
                              RESOLVED: STATUS_LABELS.RESOLVED,
                            }
                      }
                    />
                    <Button
                      className="w-full"
                      disabled={
                        !canSave ||
                        status === "none" ||
                        status === incident.status
                      }
                      onClick={() =>
                        change(
                          "status",
                          { status },
                          "PATCH",
                          "Cập nhật trạng thái",
                        )
                      }
                    >
                      Lưu trạng thái
                    </Button>
                    {admin ? (
                      <>
                        <Choice
                          id="incident-severity"
                          label="Mức độ do quản trị viên đánh giá"
                          value={severity}
                          onChange={setSeverity}
                          options={SEVERITY_LABELS}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={!canSave}
                          onClick={() =>
                            change(
                              "severity",
                              { severity },
                              "PATCH",
                              "Cập nhật mức độ",
                            )
                          }
                        >
                          Lưu mức độ
                        </Button>
                        <Choice
                          id="incident-assignee"
                          label="Tài khoản cứu trợ phụ trách"
                          value={assignee}
                          onChange={setAssignee}
                          options={{
                            none: "Chưa phân công",
                            ...Object.fromEntries(
                              assignees.map((u) => [
                                String(u.id),
                                `${u.username} (#${u.id})`,
                              ]),
                            ),
                          }}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={!canSave}
                          onClick={() =>
                            change(
                              "assignment",
                              {
                                assigneeId:
                                  assignee === "none" ? null : Number(assignee),
                              },
                              "PATCH",
                              "Cập nhật phân công",
                            )
                          }
                        >
                          Lưu phân công
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Phân công tài khoản không đồng nghĩa với triển khai
                          cứu trợ.
                        </p>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
              {admin && !incident.merged_into ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Xác minh bằng chứng</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Chỉ chọn những thông tin đã kiểm chứng. Xác minh sự cố
                        không xác nhận mọi báo cáo.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {incident.facts.slice(0, factLimit).map((f) => (
                        <label
                          key={f.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Checkbox
                            checked={verified.includes(f.id)}
                            onCheckedChange={(checked) =>
                              setVerified((prev) =>
                                checked === true
                                  ? [...prev, f.id]
                                  : prev.filter((id) => id !== f.id),
                              )
                            }
                          />
                          <span>
                            {f.text}
                            <span className="block text-xs text-muted-foreground">
                              Báo cáo #{f.reportId} · bản {f.revision}
                            </span>
                          </span>
                        </label>
                      ))}
                      {incident.facts.length > factLimit ? (
                        <Button
                          variant="ghost"
                          onClick={() => setFactLimit((n) => n + 30)}
                        >
                          Xem thêm bằng chứng
                        </Button>
                      ) : null}
                      <Button
                        className="w-full"
                        disabled={!canSave}
                        onClick={() =>
                          change(
                            "verify",
                            { factIds: verified },
                            "POST",
                            "Xác minh sự cố và bằng chứng đã chọn",
                          )
                        }
                      >
                        Ghi nhận xác minh
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Ghép sự cố trùng lặp</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Giữ sự cố hiện tại và toàn bộ lịch sử. Phân công đang
                        hoạt động phải được thống nhất trước.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Choice
                        id="merge-source"
                        label="Sự cố cần ghép vào đây"
                        value={mergeSource}
                        onChange={setMergeSource}
                        options={{
                          none: "Chọn sự cố",
                          ...Object.fromEntries(
                            others.map((i) => [i.id, i.title]),
                          ),
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!canSave || mergeSource === "none"}
                        onClick={() => {
                          const source = others.find(
                            (i) => i.id === mergeSource,
                          );
                          if (!source) return;
                          setConfirm({
                            title: "Ghép hai sự cố",
                            description: `Ghép “${source.title}” vào “${incident.title}”. Lý do: ${reason}`,
                            action: () =>
                              incidentChange("/incidents/merge", {
                                targetId: incident.id,
                                expectedVersion: incident.version,
                                sources: [
                                  {
                                    id: source.id,
                                    expectedVersion: source.version,
                                  },
                                ],
                                reason,
                              }),
                          });
                        }}
                      >
                        Ghép và giữ sự cố này
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title ?? "Xác nhận"}
        description={confirm?.description}
        onConfirm={() => void run()}
        onCancel={() => setConfirm(null)}
        isConfirming={busy}
      />
    </div>
  );
}

function FactList({
  title,
  facts,
  verifiedIds,
  onSource,
}: {
  title: string;
  facts: Fact[];
  verifiedIds: Set<string>;
  onSource: (id: number) => void;
}) {
  if (!facts.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <ul className="space-y-3">
        {facts.map((f) => (
          <li key={f.id} className="text-sm leading-6">
            <p>{f.text}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-4"
                onClick={() => onSource(f.reportId)}
              >
                Báo cáo #{f.reportId}
              </button>
              <Badge variant={verifiedIds.has(f.id) ? "success" : "outline"}>
                {verifiedIds.has(f.id) ? "Đã kiểm chứng" : "Người dân báo cáo"}
              </Badge>
              <span className="text-muted-foreground">
                {incidentDate(f.reportedAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
function SourceCard({
  incidentId,
  source,
  selectable,
  selected,
  onSelect,
  onLocation,
}: {
  incidentId: string;
  source: SourceReport;
  selectable: boolean;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onLocation: (location: { lat: number; lng: number }) => void;
}) {
  const [revisions, setRevisions] = useState<Page<ReportRevision> | null>(null),
    [revisionError, setRevisionError] = useState<string | null>(null);
  async function loadRevisions(cursor?: string) {
    try {
      const next = await incidentGet<Page<ReportRevision>>(
        `/incidents/${incidentId}/reports/${source.id}/revisions`,
        { cursor },
      );
      setRevisions((prev) => ({
        items: cursor ? [...(prev?.items ?? []), ...next.items] : next.items,
        nextCursor: next.nextCursor,
      }));
      setRevisionError(null);
    } catch {
      setRevisionError("Không tải được phiên bản. Vui lòng thử lại.");
    }
  }
  const report = source.snapshot,
    lat = Number(report.lat),
    lng = Number(report.lng);
  const images = Array.from(
    new Set([
      ...(report.images ?? []),
      ...(report.evidences ?? []).map((e) => e.url ?? ""),
    ]),
  ).filter((url) => /^https?:\/\//i.test(url));
  return (
    <Card id={`report-${source.id}`} className="scroll-mt-24">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {selectable ? (
            <Checkbox
              aria-label={`Chọn báo cáo ${source.id}`}
              checked={selected}
              onCheckedChange={(checked) => onSelect(checked === true)}
            />
          ) : null}
          <h4 className="font-semibold">Báo cáo #{source.id}</h4>
          {source.archived_at ? (
            <Badge variant="outline">Đã lưu trữ · giữ bằng chứng</Badge>
          ) : null}
          {source.manual ? (
            <Badge variant="outline">Ghép nhóm thủ công</Badge>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">
          {report.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {[report.addressLine, report.ward, report.province]
            .filter(Boolean)
            .join(", ")}{" "}
          · {incidentDate(report.createdAt)}
        </p>
        {report.lat != null &&
        report.lng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLocation({ lat, lng })}
          >
            <MapPinIcon className="size-4" />
            Xem vị trí báo cáo
          </Button>
        ) : null}
        {images.length ? (
          <details>
            <summary className="cursor-pointer text-sm font-semibold">
              Minh chứng đính kèm ({images.length})
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {images.map((url) =>
                /\.(mp4|webm|mov)(?:\?|$)/i.test(url) ? (
                  <video
                    key={url}
                    src={url}
                    controls
                    preload="none"
                    className="w-full rounded-lg"
                    aria-label={`Video báo cáo ${source.id}`}
                  />
                ) : (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={url}
                      alt={`Minh chứng của báo cáo ${source.id}`}
                      width={640}
                      height={400}
                      unoptimized
                      loading="lazy"
                      className="h-44 w-full rounded-lg border object-cover"
                    />
                  </a>
                ),
              )}
            </div>
          </details>
        ) : null}
        {source.revisionCount > 1 ? (
          <details
            onToggle={(e) => {
              if (e.currentTarget.open && !revisions) void loadRevisions();
            }}
          >
            <summary className="cursor-pointer text-sm font-semibold">
              Các phiên bản đã lưu ({source.revisionCount})
            </summary>
            {revisionError ? (
              <p role="alert" className="text-sm text-destructive">
                {revisionError}
                <Button variant="ghost" onClick={() => void loadRevisions()}>
                  Thử lại
                </Button>
              </p>
            ) : null}
            <ol className="mt-3 space-y-3">
              {revisions?.items.map((revision) => (
                <li key={revision.revision} className="border-l-2 pl-3">
                  <p className="text-xs font-semibold">
                    Bản {revision.revision} · {incidentDate(revision.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {revision.snapshot.description}
                  </p>
                </li>
              ))}
            </ol>
            {revisions?.nextCursor ? (
              <Button
                variant="ghost"
                onClick={() => void loadRevisions(revisions.nextCursor!)}
              >
                Tải thêm phiên bản
              </Button>
            ) : null}
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
