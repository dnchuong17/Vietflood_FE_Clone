/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  MapPin,
  RefreshCw,
  Route,
  UserRound,
} from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { LoadingBar } from "@/components/feedback/loading-bar";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { canManageReports, normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import {
  getReportDetail,
  updateReportStatus,
  type FloodReport,
  type ReportStatus,
} from "@/features/reports/api/reports";
import {
  buildReportAddress,
  formatReportDateTime,
  getReportCoordinates,
  getReportImageUrls,
  getReportReporter,
  getReportTitle,
  normalizeReportStatus,
  type ReportCoordinate,
} from "@/features/reports/lib/report-detail";
import {
  REPORT_STATUS_OPTIONS,
  getReportStatusLabel,
} from "@/features/reports/lib/status";
import { withReportDetailTimeout } from "@/features/reports/lib/report-detail-timeout";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPointUrl,
} from "@/features/tracking/lib/tracking";

const CATEGORY_LABELS: Record<string, string> = {
  flood: "Ngập lụt",
  rescue: "Cứu hộ",
  infrastructure: "Hạ tầng",
  incident: "Sự cố",
};

function statusBadgeVariant(
  status: ReportStatus,
): "default" | "success" | "warning" | "critical" {
  if (status === "resolved") {
    return "success";
  }

  if (status === "pending") {
    return "warning";
  }

  if (status === "rejected") {
    return "critical";
  }

  return "default";
}

function categoryText(report: FloodReport): string {
  const categories = Array.isArray(report.category)
    ? report.category
    : report.category
      ? [report.category]
      : [];

  return categories.length > 0
    ? categories.map((category) => CATEGORY_LABELS[category] ?? category).join(", ")
    : "Chưa phân loại";
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ReportDetail({ reportId }: { reportId: string }) {
  const identity = useAuthIdentity();
  const { showAlert } = useGlobalAlert();
  const role = normalizeRole(identity?.role) ?? "citizen";
  const canManage = canManageReports(role);
  const numericReportId = useMemo(() => {
    const parsed = Number(reportId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [reportId]);
  const [report, setReport] = useState<FloodReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<ReportStatus | null>(null);

  const loadReport = useCallback(
    async (showLoading = true) => {
      if (!numericReportId) {
        setErrorMessage("Mã báo cáo không hợp lệ.");
        setIsLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setErrorMessage(null);
        setReport(await withReportDetailTimeout(getReportDetail(role, numericReportId)));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết báo cáo.",
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [numericReportId, role],
  );

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const coordinates = useMemo(
    () => (report ? getReportCoordinates(report) : null),
    [report],
  );
  const images = useMemo(
    () => (report ? getReportImageUrls(report) : []),
    [report],
  );
  const reporter = useMemo(
    () => (report ? getReportReporter(report) : { name: "-", contact: "-" }),
    [report],
  );
  const status = report ? normalizeReportStatus(report.status) : "pending";

  function openPointMap() {
    if (!coordinates) {
      showAlert({
        title: "Thiếu tọa độ",
        description: "Báo cáo này chưa có tọa độ để mở bản đồ.",
        variant: "error",
      });
      return;
    }

    openNewTab(buildGoogleMapsPointUrl(coordinates));
  }

  function openDirectionsWithOrigin(
    destination: ReportCoordinate,
    origin?: ReportCoordinate | null,
  ) {
    openNewTab(buildGoogleMapsDirectionsUrl(destination, origin));
  }

  function openDirections() {
    if (!coordinates) {
      showAlert({
        title: "Thiếu tọa độ",
        description: "Báo cáo này chưa có tọa độ để dẫn đường.",
        variant: "error",
      });
      return;
    }

    if (!navigator.geolocation) {
      showAlert({
        title: "Không có vị trí hiện tại",
        description: "Trình duyệt không hỗ trợ định vị, đã mở tuyến đến điểm báo cáo.",
        variant: "error",
      });
      openDirectionsWithOrigin(coordinates);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        openDirectionsWithOrigin(coordinates, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        showAlert({
          title: "Vị trí bị chặn",
          description: "Không lấy được vị trí hiện tại, đã mở tuyến đến điểm báo cáo.",
          variant: "error",
        });
        openDirectionsWithOrigin(coordinates);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleStatusChange(nextStatus: ReportStatus) {
    if (!report?.id || nextStatus === status) {
      return;
    }

    const previousReport = report;
    try {
      setSavingStatus(nextStatus);
      setReport({ ...report, status: nextStatus });
      await updateReportStatus(report.id, nextStatus);
      await loadReport(false);
      showAlert({
        title: "Đã cập nhật trạng thái",
        description: `Báo cáo #${report.id} đã chuyển sang ${getReportStatusLabel(nextStatus)}.`,
        variant: "success",
      });
    } catch (error) {
      setReport(previousReport);
      showAlert({
        title: "Cập nhật trạng thái thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái báo cáo.",
        variant: "error",
      });
    } finally {
      setSavingStatus(null);
    }
  }

  if (isLoading) {
    return (
      <LoadingBar
        title="Đang tải chi tiết báo cáo..."
        description="Đang lấy vị trí, minh chứng và trạng thái mới nhất."
      />
    );
  }

  if (errorMessage || !report) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể mở báo cáo</AlertTitle>
        <AlertDescription>{errorMessage ?? "Không tìm thấy báo cáo."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/bao-cao">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Danh sách
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={() => void loadReport()}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardDescription>Báo cáo #{report.id ?? "-"}</CardDescription>
              <CardTitle className="mt-2 leading-tight">
                {getReportTitle(report)}
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.isUrgent ? (
                <Badge variant="critical">Khẩn cấp</Badge>
              ) : null}
              <Badge variant={statusBadgeVariant(status)}>
                {getReportStatusLabel(status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {report.description || "Chưa có mô tả."}
          </p>

          <div className="grid gap-3 md:grid-cols-4">
            <DetailMetric label="Loại báo cáo" value={categoryText(report)} />
            <DetailMetric
              label="Mức độ"
              value={report.severity === undefined ? "-" : String(report.severity)}
            />
            <DetailMetric
              label="Ngày tạo"
              value={formatReportDateTime(report.createdAt ?? report.created_at)}
            />
            <DetailMetric label="Mã người báo" value={String(report.userId ?? "-")} />
          </div>

          {canManage ? (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {REPORT_STATUS_OPTIONS.map((option) => {
                  const isActive = option === status;
                  const isSaving = option === savingStatus;

                  return (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      disabled={Boolean(savingStatus) || isActive}
                      onClick={() => void handleStatusChange(option)}
                    >
                      {isSaving ? "Đang lưu..." : getReportStatusLabel(option)}
                    </Button>
                  );
                })}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              Vị trí báo cáo
            </CardTitle>
            <CardDescription>
              Địa chỉ, tọa độ và thao tác dẫn đường cho đội cứu trợ.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">
                {buildReportAddress(report) || "Chưa có địa chỉ"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {coordinates
                  ? `${coordinates.latitude}, ${coordinates.longitude}`
                  : "Chưa có tọa độ"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={openPointMap}
                disabled={!coordinates}
              >
                <ExternalLink data-icon="inline-start" aria-hidden="true" />
                Xem bản đồ
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  onClick={openDirections}
                  disabled={!coordinates}
                >
                  <Route data-icon="inline-start" aria-hidden="true" />
                  Dẫn đường
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              Người báo
            </CardTitle>
            <CardDescription>Thông tin liên hệ từ backend.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailMetric label="Tên" value={reporter.name} />
            <DetailMetric label="Liên hệ" value={reporter.contact} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" aria-hidden="true" />
            Minh chứng
          </CardTitle>
          <CardDescription>Ảnh và tệp minh chứng đi kèm báo cáo.</CardDescription>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={url}
                    alt={`Minh chứng báo cáo #${report.id ?? "-"}`}
                    className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Báo cáo này chưa có minh chứng.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value || "-"}
      </p>
    </div>
  );
}
