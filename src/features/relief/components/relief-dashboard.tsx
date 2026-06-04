"use client";

import Link from "next/link";
import { useEffect, useMemo, type ComponentType, type SVGProps } from "react";
import {
  ArrowPathIcon as RefreshCw,
  ArrowRightIcon as ArrowRight,
  CheckCircleIcon as CheckCircle2,
  ClipboardDocumentCheckIcon as ClipboardCheck,
  ClockIcon as Clock,
  EyeIcon as Eye,
  ExclamationTriangleIcon as AlertTriangle,
  MagnifyingGlassIcon as Search,
  MapIcon as Map,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  UserIcon as UserRound,
  XCircleIcon as XCircle,
} from "@heroicons/react/24/solid";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { normalizeRole } from "@/features/auth/lib/roles";
import {
  listReports,
  updateReportStatus,
  type FloodReport,
  type ReportStatus,
} from "@/features/reports/api/reports";
import {
  REPORT_STATUS_OPTIONS,
  getReportStatusLabel,
} from "@/features/reports/lib/status";
import { useReportsStore } from "@/features/reports/store/reports-store";
import {
  filterOperationalAssignments,
  mapReportToAssignment,
  summarizeAssignments,
  type AssignmentPriority,
} from "@/features/relief/lib/assignments";
import {
  buildReliefQueueStats,
  filterReliefQueueReports,
} from "@/features/relief/lib/queue";
import { useReliefStore } from "@/features/relief/store/relief-store";
import { cn } from "@/lib/utils";

function statusOf(report: FloodReport): ReportStatus {
  const status = String(report.status ?? "pending").toLowerCase();
  return REPORT_STATUS_OPTIONS.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : "pending";
}

function locationOf(report: FloodReport): string {
  return [report.addressLine, report.ward, report.province]
    .filter(Boolean)
    .join(", ");
}

const PRIORITY_BADGE_VARIANTS: Record<
  AssignmentPriority,
  BadgeProps["variant"]
> = {
  urgent: "critical",
  high: "warning",
  medium: "secondary",
  low: "success",
};

function statusBadgeVariant(status: ReportStatus): BadgeProps["variant"] {
  switch (status) {
    case "resolved":
      return "success";
    case "verified":
      return "warning";
    case "rejected":
      return "critical";
    default:
      return "secondary";
  }
}

const REPORT_STATUS_ICONS: Record<
  ReportStatus,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  pending: Clock,
  verified: ClipboardCheck,
  resolved: CheckCircle2,
  rejected: XCircle,
};

export function ReliefDashboard({ assignmentMode = false }: { assignmentMode?: boolean }) {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "relief";
  const searchQuery = useReliefStore((state) => state.searchQuery);
  const queueFilter = useReliefStore((state) => state.queueFilter);
  const setSearchQuery = useReliefStore((state) => state.setSearchQuery);
  const setQueueFilter = useReliefStore((state) => state.setQueueFilter);
  const reports = useReportsStore((state) => state.reports);
  const isLoading = useReportsStore((state) => state.isLoading);
  const savingStatusByReportId = useReportsStore(
    (state) => state.savingStatusByReportId,
  );
  const setReports = useReportsStore((state) => state.setReports);
  const setLoading = useReportsStore((state) => state.setLoading);
  const startReportStatusSave = useReportsStore(
    (state) => state.startReportStatusSave,
  );
  const rollbackReportStatus = useReportsStore(
    (state) => state.rollbackReportStatus,
  );
  const finishReportStatusSave = useReportsStore(
    (state) => state.finishReportStatusSave,
  );

  async function loadReports() {
    try {
      setLoading(true);
      setReports(await listReports(role));
    } catch (error) {
      showAlert({
        title: "Không thể tải dữ liệu cứu trợ",
        description:
          error instanceof Error ? error.message : "Không thể tải báo cáo.",
        variant: "error",
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const stats = useMemo(() => buildReliefQueueStats(reports), [reports]);
  const assignments = useMemo(
    () => reports.map((report) => mapReportToAssignment(report)),
    [reports],
  );
  const assignmentStats = useMemo(
    () => summarizeAssignments(assignments),
    [assignments],
  );
  const statCards = assignmentMode
    ? [
        ["Tổng phân công", assignmentStats.total],
        ["Chờ nhận việc", assignmentStats.assigned],
        ["Đang thực hiện", assignmentStats.inProgress],
        ["Khẩn cấp", assignmentStats.urgent],
      ]
    : [
        ["Tổng số", stats.total],
        ["Chờ xử lý", stats.awaiting],
        ["Đang xử lý", stats.active],
        ["Đã xử lý", stats.resolved],
        ["Sẵn tuyến đường", stats.routeReady],
      ];
  const statCardIcons = assignmentMode
    ? [ClipboardCheck, Clock, ArrowRight, AlertTriangle]
    : [ClipboardCheck, Clock, RefreshCw, CheckCircle2, Map];
  const reliefQueueFilters = useMemo(
    () => [
      { key: "all" as const, label: "Tất cả", count: stats.total },
      { key: "awaiting" as const, label: "Chờ xử lý", count: stats.awaiting },
      { key: "active" as const, label: "Đang xử lý", count: stats.active },
      { key: "resolved" as const, label: "Đã xử lý", count: stats.resolved },
      {
        key: "route-ready" as const,
        label: "Sẵn tuyến đường",
        count: stats.routeReady,
      },
    ],
    [stats],
  );

  const queue = useMemo(() => {
    return filterReliefQueueReports(
      reports,
      queueFilter,
      searchQuery,
    )
      .sort((first, second) => {
        if (Boolean(first.isUrgent) !== Boolean(second.isUrgent)) {
          return first.isUrgent ? -1 : 1;
        }
        const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
        const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
        return secondTime - firstTime;
      });
  }, [queueFilter, searchQuery, reports]);
  const assignmentQueue = useMemo(() => {
    const priorityWeight: Record<AssignmentPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return filterOperationalAssignments(assignments).sort((first, second) => {
      if (priorityWeight[first.priority] !== priorityWeight[second.priority]) {
        return priorityWeight[first.priority] - priorityWeight[second.priority];
      }

      const firstTime = first.report.createdAt
        ? new Date(first.report.createdAt).getTime()
        : 0;
      const secondTime = second.report.createdAt
        ? new Date(second.report.createdAt).getTime()
        : 0;
      return secondTime - firstTime;
    });
  }, [assignments]);

  async function setStatus(report: FloodReport, status: ReportStatus) {
    if (!report.id) {
      return;
    }

    const previousStatus = statusOf(report);
    try {
      startReportStatusSave(report.id, status);
      await updateReportStatus(report.id, status);
      await loadReports();
    } catch (error) {
      showAlert({
        title: "Cập nhật trạng thái thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái báo cáo.",
        variant: "error",
      });
      rollbackReportStatus(report.id, previousStatus);
    } finally {
      finishReportStatusSave(report.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map(([label, value], index) => {
          const Icon = statCardIcons[index] ?? ClipboardCheck;

          return (
            <Card key={label} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {label}
                  </p>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {assignmentMode ? "Hàng đợi phân công vận hành" : "Hàng đợi cứu trợ"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {assignmentMode
                ? "Các sự cố được ưu tiên để đội cứu trợ hoặc quản trị viên điều phối."
                : "Các báo cáo hiện trường đang cần phân loại hoặc phản hồi."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/trang-chu">
                <Map data-icon="inline-start" aria-hidden="true" />
                Bản đồ
              </Link>
            </Button>
            {!assignmentMode ? (
              <Button asChild variant="outline">
                <Link href="/phan-cong">
                  <ClipboardCheck data-icon="inline-start" aria-hidden="true" />
                  Phân công
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadReports()}
            >
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {!assignmentMode ? (
        <Card className="bg-card">
          <CardContent className="grid gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-card-foreground">
                  Hàng chờ trực tiếp
                </h3>
                <p className="text-sm text-muted-foreground">
                  {queue.length} báo cáo đang hiển thị theo bộ lọc hiện tại.
                </p>
              </div>
              <Badge variant="outline">
                {queueFilter === "route-ready"
                  ? "Chế độ tuyến đường"
                  : "Chế độ vận hành"}
              </Badge>
            </div>

            <Field>
              <FieldLabel htmlFor="relief-queue-search">Tìm ca cứu trợ</FieldLabel>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="relief-queue-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo địa chỉ, danh mục hoặc người báo"
                  className="pl-9"
                />
              </div>
            </Field>

            <div className="flex flex-wrap gap-2">
              {reliefQueueFilters.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant={queueFilter === filter.key ? "default" : "outline"}
                  onClick={() => setQueueFilter(filter.key)}
                >
                  {filter.label}
                  <Badge
                    variant={queueFilter === filter.key ? "secondary" : "outline"}
                    className="ml-1"
                  >
                    {filter.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingBar
          title="Đang tải hàng đợi cứu trợ..."
          description="Đang đồng bộ các báo cáo cần phản hồi và phân công."
        />
      ) : null}

      <div className="grid gap-3">
        {!isLoading && assignmentMode && assignmentQueue.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="grid place-items-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <ClipboardCheck className="size-9 text-primary" aria-hidden="true" />
              <span>Chưa có phân công vận hành nào trong hàng đợi hiện tại.</span>
            </CardContent>
          </Card>
        ) : null}
        {!isLoading && !assignmentMode && queue.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="grid place-items-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <Map className="size-9 text-primary" aria-hidden="true" />
              <span>Chưa có báo cáo cứu trợ phù hợp với bộ lọc hiện tại.</span>
            </CardContent>
          </Card>
        ) : null}
        {assignmentMode
          ? assignmentQueue.map((assignment) => (
              <Card
                key={assignment.id}
                className="bg-card"
              >
                <CardContent className="grid gap-4 p-4 xl:grid-cols-[1fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{assignment.report.id ?? "-"}</Badge>
                      <Badge variant={PRIORITY_BADGE_VARIANTS[assignment.priority]}>
                        {assignment.priorityLabel}
                      </Badge>
                      <Badge variant="secondary">{assignment.statusLabel}</Badge>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-card-foreground">
                      {assignment.title}
                    </h3>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{assignment.reporter}</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{assignment.contact}</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{assignment.location}</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{assignment.deadlineLabel}</span>
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden="true" />
                          Tiến độ nhiệm vụ
                        </span>
                        <span>{assignment.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {assignment.reassignStatus ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          void setStatus(assignment.report, assignment.reassignStatus!)
                        }
                        disabled={Boolean(
                          assignment.report.id &&
                            savingStatusByReportId[assignment.report.id],
                        )}
                      >
                        {assignment.reassignActionLabel}
                      </Button>
                    ) : null}
                    {assignment.nextStatus ? (
                      <Button
                        type="button"
                        onClick={() =>
                          void setStatus(assignment.report, assignment.nextStatus!)
                        }
                        disabled={Boolean(
                          assignment.report.id &&
                            savingStatusByReportId[assignment.report.id],
                        )}
                      >
                        {assignment.nextActionLabel}
                        <ArrowRight data-icon="inline-end" aria-hidden="true" />
                      </Button>
                    ) : null}
                    {assignment.report.id ? (
                      <Button asChild variant="outline">
                        <Link href={`/bao-cao/${assignment.report.id}`}>
                          <Eye data-icon="inline-start" aria-hidden="true" />
                          Chi tiết
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          : queue.map((report) => (
          <Card
            key={report.id ?? report.description}
            className="bg-card"
          >
            <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">#{report.id ?? "-"}</Badge>
                  <Badge variant={statusBadgeVariant(statusOf(report))}>
                    {getReportStatusLabel(statusOf(report))}
                  </Badge>
                  {report.isUrgent ? (
                    <Badge variant="critical">khẩn cấp</Badge>
                  ) : null}
                </div>
                <h3 className="mt-2 text-base font-bold text-card-foreground">
                  {report.description || "Chưa có mô tả"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locationOf(report) || "Chưa có vị trí"} | người báo{" "}
                  {report.user?.username ?? report.userId ?? "-"}
                </p>
              </div>

              <div className="flex max-w-xl flex-wrap gap-1.5 lg:justify-end">
                {report.id ? (
                  <Button asChild variant="outline">
                    <Link href={`/bao-cao/${report.id}`}>
                      <Eye data-icon="inline-start" aria-hidden="true" />
                      Chi tiết
                    </Link>
                  </Button>
                ) : null}
                {REPORT_STATUS_OPTIONS.map((status) => {
                  const currentStatus = statusOf(report);
                  const reportId = report.id ?? -1;
                  const savingStatus = savingStatusByReportId[reportId];
                  const isActive = currentStatus === status;
                  const isSaving = savingStatus === status;
                  const isDisabled = Boolean(savingStatus) || isActive;
                  const StatusIcon = REPORT_STATUS_ICONS[status];

                  return (
                    <Button
                      key={status}
                      type="button"
                      variant={isActive ? "secondary" : "outline"}
                      onClick={() => void setStatus(report, status)}
                      disabled={isDisabled}
                      className={cn(isActive && "border-primary/20")}
                    >
                      <StatusIcon data-icon="inline-start" aria-hidden="true" />
                      {isSaving ? "Đang lưu..." : getReportStatusLabel(status)}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
