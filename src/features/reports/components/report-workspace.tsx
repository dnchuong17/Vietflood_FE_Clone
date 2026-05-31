"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, LocateFixed, Plus, RefreshCw } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { canManageReports, normalizeRole } from "@/features/auth/lib/roles";
import {
  createReport,
  listReports,
  updateReport,
  updateReportStatus,
  type FloodReport,
  type ReportFormValues,
  type ReportStatus,
} from "@/features/reports/api/reports";
import {
  REPORT_STATUS_OPTIONS,
  getReportStatusLabel,
} from "@/features/reports/lib/status";
import { useReportsStore } from "@/features/reports/store/reports-store";

const CATEGORY_OPTIONS = [
  { value: "flood", label: "Flood" },
  { value: "rescue", label: "Rescue" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "incident", label: "Incident" },
];

const EMPTY_FORM: ReportFormValues = {
  categories: ["flood"],
  description: "",
  province: "",
  ward: "",
  addressLine: "",
  lat: "",
  lng: "",
  severity: "3",
  isUrgent: false,
  files: null,
};

function categoryText(report: FloodReport): string {
  const categories = Array.isArray(report.category)
    ? report.category
    : report.category
      ? [report.category]
      : [];
  return categories.length > 0 ? categories.join(", ") : "Uncategorized";
}

function addressText(report: FloodReport): string {
  return [report.addressLine, report.ward, report.province]
    .filter(Boolean)
    .join(", ");
}

function statusOf(report: FloodReport): ReportStatus {
  const status = String(report.status ?? "pending").toLowerCase();
  return REPORT_STATUS_OPTIONS.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : "pending";
}

function toFormValues(report: FloodReport): ReportFormValues {
  return {
    categories: Array.isArray(report.category)
      ? report.category
      : report.category
        ? [report.category]
        : ["flood"],
    description: report.description ?? "",
    province: report.province ?? "",
    ward: report.ward ?? "",
    addressLine: report.addressLine ?? "",
    lat: report.lat === undefined ? "" : String(report.lat),
    lng: report.lng === undefined ? "" : String(report.lng),
    severity: report.severity === undefined ? "3" : String(report.severity),
    isUrgent: Boolean(report.isUrgent),
    files: null,
  };
}

function ReportForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: ReportFormValues;
  submitLabel: string;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const { showAlert } = useGlobalAlert();
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<T extends keyof ReportFormValues>(
    field: T,
    value: ReportFormValues[T],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(category: string) {
    setValues((prev) => {
      const exists = prev.categories.includes(category);
      const next = exists
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category];
      return { ...prev, categories: next.length > 0 ? next : ["flood"] };
    });
  }

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      showAlert({
        title: "Location unavailable",
        description: "This browser does not support geolocation.",
        variant: "error",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((prev) => ({
          ...prev,
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        }));
      },
      () => {
        showAlert({
          title: "Location blocked",
          description: "Allow location access or enter coordinates manually.",
          variant: "error",
        });
      },
      { enableHighAccuracy: true },
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <span className="text-sm font-semibold text-slate-700">Categories</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                checked={values.categories.includes(option.value)}
                onChange={() => toggleCategory(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Description
        <textarea
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          rows={4}
          className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Province
          <input
            value={values.province}
            onChange={(event) => setField("province", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Ward
          <input
            value={values.ward}
            onChange={(event) => setField("ward", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Severity
          <input
            value={values.severity}
            onChange={(event) => setField("severity", event.target.value)}
            min={1}
            max={5}
            type="number"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Address
        <input
          value={values.addressLine}
          onChange={(event) => setField("addressLine", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Latitude
          <input
            value={values.lat}
            onChange={(event) => setField("lat", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Longitude
          <input
            value={values.lng}
            onChange={(event) => setField("lng", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <button
          type="button"
          onClick={fillCurrentLocation}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          Use GPS
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={values.isUrgent}
            onChange={(event) => setField("isUrgent", event.target.checked)}
          />
          Urgent report
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Evidence files
          <input
            type="file"
            multiple
            onChange={(event) => setField("files", event.target.files)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ReportWorkspace() {
  const { showAlert } = useGlobalAlert();
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role) ?? "citizen";
  const canManage = canManageReports(role);
  const reports = useReportsStore((state) => state.reports);
  const isLoading = useReportsStore((state) => state.isLoading);
  const filter = useReportsStore((state) => state.filter);
  const query = useReportsStore((state) => state.query);
  const isCreating = useReportsStore((state) => state.isCreating);
  const editingReport = useReportsStore((state) => state.editingReport);
  const savingStatusByReportId = useReportsStore(
    (state) => state.savingStatusByReportId,
  );
  const setReports = useReportsStore((state) => state.setReports);
  const setLoading = useReportsStore((state) => state.setLoading);
  const setFilter = useReportsStore((state) => state.setFilter);
  const setQuery = useReportsStore((state) => state.setQuery);
  const setCreating = useReportsStore((state) => state.setCreating);
  const setEditingReport = useReportsStore((state) => state.setEditingReport);
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
        title: "Reports unavailable",
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

  const filteredReports = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return reports
      .filter((report) => {
        if (filter !== "all" && statusOf(report) !== filter) {
          return false;
        }
        if (!keyword) {
          return true;
        }
        return [
          report.id,
          report.description,
          report.province,
          report.ward,
          report.addressLine,
          categoryText(report),
          report.user?.username,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [filter, query, reports]);

  async function handleCreate(values: ReportFormValues) {
    try {
      await createReport(values);
      setCreating(false);
      showAlert({
        title: "Report created",
        description: "Your field report was submitted.",
        variant: "success",
      });
      await loadReports();
    } catch (error) {
      showAlert({
        title: "Create failed",
        description:
          error instanceof Error ? error.message : "Could not create report.",
        variant: "error",
      });
    }
  }

  async function handleUpdate(values: ReportFormValues) {
    if (!editingReport) {
      return;
    }

    try {
      await updateReport(role, editingReport, values);
      setEditingReport(null);
      showAlert({
        title: "Report updated",
        description: "Report details were saved.",
        variant: "success",
      });
      await loadReports();
    } catch (error) {
      showAlert({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Could not update report.",
        variant: "error",
      });
    }
  }

  async function handleStatusChange(report: FloodReport, status: ReportStatus) {
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
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, location, category, description"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Status
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as "all" | ReportStatus)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">All</option>
            {REPORT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getReportStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadReports()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          {!canManage ? (
            <button
              type="button"
              onClick={() => {
                setEditingReport(null);
                setCreating(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </button>
          ) : null}
        </div>
      </div>

      {isCreating ? (
        <ReportForm
          initialValues={EMPTY_FORM}
          submitLabel="Submit report"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {editingReport ? (
        <ReportForm
          initialValues={toFormValues(editingReport)}
          submitLabel="Save report"
          onSubmit={handleUpdate}
          onCancel={() => setEditingReport(null)}
        />
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Loading reports...
        </div>
      ) : null}

      {!isLoading && filteredReports.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
          No reports found.
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredReports.map((report) => (
          <article
            key={report.id ?? `${report.description}-${report.createdAt}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Report #{report.id ?? "-"}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {categoryText(report)}
                </h2>
              </div>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                {getReportStatusLabel(statusOf(report))}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              {report.description || "No description."}
            </p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-slate-500">Address</dt>
                <dd>{addressText(report) || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-slate-500">Coords</dt>
                <dd>
                  {report.lat ?? "-"}, {report.lng ?? "-"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-slate-500">Reporter</dt>
                <dd>{report.user?.username ?? report.userId ?? "-"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditingReport(report);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>

              {canManage ? (
                <div className="flex flex-wrap gap-1.5">
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
                        onClick={() => void handleStatusChange(report, status)}
                        disabled={isDisabled}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          isActive
                            ? "border-sky-200 bg-sky-50 text-sky-800"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {isSaving ? "Saving..." : getReportStatusLabel(status)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
