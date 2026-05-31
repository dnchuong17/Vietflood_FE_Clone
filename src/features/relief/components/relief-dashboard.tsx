"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowRight, ClipboardCheck, RefreshCw } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
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

export function ReliefDashboard({ assignmentMode = false }: { assignmentMode?: boolean }) {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "relief";
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
        title: "Relief data unavailable",
        description:
          error instanceof Error ? error.message : "Could not load reports.",
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

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => statusOf(report) === "pending").length,
      verified: reports.filter((report) => statusOf(report) === "verified").length,
      resolved: reports.filter((report) => statusOf(report) === "resolved").length,
      urgent: reports.filter((report) => report.isUrgent).length,
    };
  }, [reports]);

  const queue = useMemo(() => {
    return reports
      .filter((report) =>
        assignmentMode
          ? statusOf(report) === "pending" || statusOf(report) === "verified"
          : statusOf(report) !== "resolved",
      )
      .sort((first, second) => {
        if (Boolean(first.isUrgent) !== Boolean(second.isUrgent)) {
          return first.isUrgent ? -1 : 1;
        }
        const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
        const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
        return secondTime - firstTime;
      });
  }, [assignmentMode, reports]);

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
        title: "Status update failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not update report status.",
        variant: "error",
      });
      rollbackReportStatus(report.id, previousStatus);
    } finally {
      finishReportStatusSave(report.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["Verified", stats.verified],
          ["Resolved", stats.resolved],
          ["Urgent", stats.urgent],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {assignmentMode ? "Operational assignment queue" : "Relief queue"}
          </h2>
          <p className="text-sm text-slate-600">
            {assignmentMode
              ? "Prioritized incidents for relief/admin dispatch."
              : "Open field reports that need triage or response."}
          </p>
        </div>
        <div className="flex gap-2">
          {!assignmentMode ? (
            <Link
              href="/phan-cong"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Assignments
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void loadReports()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Loading relief queue...
        </div>
      ) : null}

      <div className="grid gap-3">
        {queue.map((report) => (
          <article
            key={report.id ?? report.description}
            className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                  #{report.id ?? "-"}
                </span>
                <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">
                  {getReportStatusLabel(statusOf(report))}
                </span>
                {report.isUrgent ? (
                  <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                    urgent
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-950">
                {report.description || "No description"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {locationOf(report) || "No location"} | reporter{" "}
                {report.user?.username ?? report.userId ?? "-"}
              </p>
            </div>

            <div className="flex max-w-xl flex-wrap gap-1.5 lg:justify-end">
              {REPORT_STATUS_OPTIONS.map((status) => {
                const currentStatus = statusOf(report);
                const reportId = report.id ?? -1;
                const savingStatus = savingStatusByReportId[reportId];
                const isActive = currentStatus === status;
                const isSaving = savingStatus === status;
                const isDisabled = Boolean(savingStatus) || isActive;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void setStatus(report, status)}
                    disabled={isDisabled}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      isActive
                        ? "border-sky-200 bg-sky-50 text-sky-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {status === "verified" ? (
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                    {isSaving ? "Saving..." : getReportStatusLabel(status)}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
