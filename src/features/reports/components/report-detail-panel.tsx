"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, ImageIcon, MapPin, UserRound } from "lucide-react";

import { LoadingBar } from "@/components/feedback/loading-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import {
  getReportDetail,
  type FloodReport,
  type ReportStatus,
} from "@/features/reports/api/reports";
import { getReportStatusLabel } from "@/features/reports/lib/status";
import {
  buildReportAddress,
  formatReportDateTime,
  getReportCoordinates,
  getReportImageUrls,
  getReportReporter,
  getReportTitle,
  normalizeReportStatus,
} from "@/features/reports/lib/report-detail";
import { withReportDetailTimeout } from "@/features/reports/lib/report-detail-timeout";

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

export function ReportDetailPanel({ reportId }: { reportId: number }) {
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "citizen";
  const [report, setReport] = useState<FloodReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadReport() {
      if (!Number.isFinite(reportId)) {
        setError("Mã báo cáo không hợp lệ.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nextReport = await withReportDetailTimeout(
          getReportDetail(role, reportId),
        );
        if (isActive) {
          setReport(nextReport);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải chi tiết báo cáo.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      isActive = false;
    };
  }, [reportId, role]);

  const detail = useMemo(() => {
    if (!report) {
      return null;
    }

    return {
      address: buildReportAddress(report) || "-",
      coordinates: getReportCoordinates(report),
      images: getReportImageUrls(report),
      reporter: getReportReporter(report),
      status: normalizeReportStatus(report.status),
      title: getReportTitle(report),
    };
  }, [report]);

  if (isLoading) {
    return (
      <LoadingBar
        title="Đang tải chi tiết báo cáo..."
        description="Đang đồng bộ thông tin vận hành và minh chứng."
      />
    );
  }

  if (error || !report || !detail) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể mở báo cáo</AlertTitle>
        <AlertDescription>{error ?? "Không tìm thấy báo cáo."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{detail.title}</CardTitle>
              <CardDescription>Báo cáo #{report.id ?? reportId}</CardDescription>
            </div>
            <Badge variant={statusBadgeVariant(detail.status)}>
              {getReportStatusLabel(detail.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {report.description || "Chưa có mô tả."}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                Vị trí
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{detail.address}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {detail.coordinates
                  ? `${detail.coordinates.latitude}, ${detail.coordinates.longitude}`
                  : "Chưa có toạ độ hợp lệ"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                Người báo
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {detail.reporter.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {detail.reporter.contact}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ImageIcon className="size-4 text-primary" aria-hidden="true" />
              Minh chứng
            </div>
            {detail.images.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                {detail.images.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate rounded-md border bg-background px-3 py-2 text-sm text-primary hover:bg-accent"
                  >
                    {url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Chưa có tệp minh chứng.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin vận hành</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">Thời gian tạo</p>
              <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4" aria-hidden="true" />
                {formatReportDateTime(report.createdAt)}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Mức độ</p>
              <p className="mt-1 text-muted-foreground">
                {report.severity ?? "-"}
                {report.isUrgent ? " · khẩn cấp" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button asChild variant="outline">
          <Link href="/bao-cao">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    </div>
  );
}
