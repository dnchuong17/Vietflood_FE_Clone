"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edit3, LocateFixed, Plus, RefreshCw } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchProvinces,
  searchWards,
  type DivisionOption,
} from "@/features/location/api/vietnam-divisions";
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
import {
  canEditReport,
  getReportEditRestrictionReason,
} from "@/features/reports/lib/edit-permissions";
import { buildAddressSuggestions } from "@/features/reports/lib/address-suggestions";
import { useReportsStore } from "@/features/reports/store/reports-store";

const CATEGORY_LABELS: Record<string, string> = {
  flood: "Ngập lụt",
  rescue: "Cứu hộ",
  infrastructure: "Hạ tầng",
  incident: "Sự cố",
};

const CATEGORY_OPTIONS = [
  { value: "flood", label: CATEGORY_LABELS.flood },
  { value: "rescue", label: CATEGORY_LABELS.rescue },
  { value: "infrastructure", label: CATEGORY_LABELS.infrastructure },
  { value: "incident", label: CATEGORY_LABELS.incident },
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
  return categories.length > 0
    ? categories.map((category) => CATEGORY_LABELS[category] ?? category).join(", ")
    : "Chưa phân loại";
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

function statusBadgeVariant(
  status: ReportStatus,
): "default" | "secondary" | "success" | "warning" | "critical" {
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
  reports,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: ReportFormValues;
  reports: FloodReport[];
  submitLabel: string;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const { showAlert } = useGlobalAlert();
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<DivisionOption[]>([]);
  const [wardOptions, setWardOptions] = useState<DivisionOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  function setField<T extends keyof ReportFormValues>(
    field: T,
    value: ReportFormValues[T],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let isActive = true;
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoadingProvinces(true);
        const options = await searchProvinces(values.province);
        if (isActive) {
          setProvinceOptions(options);
        }
      } catch {
        if (isActive) {
          setProvinceOptions([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingProvinces(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [values.province]);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWardOptions([]);
      return;
    }

    let isActive = true;
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoadingWards(true);
        const options = await searchWards(selectedProvinceCode, values.ward);
        if (isActive) {
          setWardOptions(options);
        }
      } catch {
        if (isActive) {
          setWardOptions([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingWards(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [selectedProvinceCode, values.ward]);

  const addressSuggestions = useMemo(
    () =>
      buildAddressSuggestions({
        query: values.addressLine,
        province: values.province,
        ward: values.ward,
        reports,
      }),
    [reports, values.addressLine, values.province, values.ward],
  );

  function handleProvinceInput(value: string) {
    setValues((prev) => ({
      ...prev,
      province: value,
      ward: "",
    }));
    setSelectedProvinceCode(null);
    setWardOptions([]);
  }

  function selectProvince(option: DivisionOption) {
    setValues((prev) => ({
      ...prev,
      province: option.name,
      ward: "",
    }));
    setSelectedProvinceCode(option.code);
    setWardOptions([]);
  }

  function handleWardInput(value: string) {
    setField("ward", value);
  }

  function selectWard(option: DivisionOption) {
    setField("ward", option.name);
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
        title: "Không có vị trí",
        description: "Trình duyệt này không hỗ trợ định vị.",
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
          title: "Vị trí bị chặn",
          description: "Hãy cho phép truy cập vị trí hoặc nhập toạ độ thủ công.",
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
        <span className="text-sm font-semibold text-slate-700">Loại báo cáo</span>
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
        Mô tả
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
          Tỉnh/Thành phố
          <input
            value={values.province}
            onChange={(event) => handleProvinceInput(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="Tìm tỉnh/thành phố"
            required
          />
          {provinceOptions.length > 0 ? (
            <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              {provinceOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => selectProvince(option)}
                  className="rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50"
                >
                  {option.name}
                </button>
              ))}
            </div>
          ) : isLoadingProvinces ? (
            <span className="text-xs font-medium text-slate-500">Đang tải tỉnh/thành phố...</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Phường/Xã
          <input
            value={values.ward}
            onChange={(event) => handleWardInput(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={!selectedProvinceCode}
            placeholder={selectedProvinceCode ? "Tìm phường/xã" : "Chọn tỉnh/thành phố trước"}
          />
          {wardOptions.length > 0 ? (
            <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              {wardOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => selectWard(option)}
                  className="rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50"
                >
                  {option.name}
                </button>
              ))}
            </div>
          ) : isLoadingWards ? (
            <span className="text-xs font-medium text-slate-500">Đang tải phường/xã...</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Mức độ
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
        Địa chỉ
        <input
          value={values.addressLine}
          onChange={(event) => setField("addressLine", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="Số nhà, tên đường"
        />
        {addressSuggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {addressSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setField("addressLine", suggestion)}
                className="rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Vĩ độ
          <input
            value={values.lat}
            onChange={(event) => setField("lat", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Kinh độ
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
          Dùng GPS
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={values.isUrgent}
            onChange={(event) => setField("isUrgent", event.target.checked)}
          />
          Báo cáo khẩn cấp
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Tệp minh chứng
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
          Huỷ
        </button>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang lưu..." : submitLabel}
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
  const assumeCurrentUserReport = !canManage;
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
        title: "Không thể tải báo cáo",
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
        title: "Đã tạo báo cáo",
        description: "Báo cáo hiện trường của bạn đã được gửi.",
        variant: "success",
      });
      await loadReports();
    } catch (error) {
      showAlert({
        title: "Tạo báo cáo thất bại",
        description:
          error instanceof Error ? error.message : "Không thể tạo báo cáo.",
        variant: "error",
      });
    }
  }

  async function handleUpdate(values: ReportFormValues) {
    if (!editingReport) {
      return;
    }

    const editRestrictionReason = getReportEditRestrictionReason(
      editingReport,
      identity,
      { assumeCurrentUserReport },
    );
    if (editRestrictionReason) {
      setEditingReport(null);
      showAlert({
        title: "Không thể sửa báo cáo",
        description: editRestrictionReason,
        variant: "error",
      });
      return;
    }

    try {
      await updateReport(role, editingReport, values);
      setEditingReport(null);
      showAlert({
        title: "Đã cập nhật báo cáo",
        description: "Chi tiết báo cáo đã được lưu.",
        variant: "success",
      });
      await loadReports();
    } catch (error) {
      showAlert({
        title: "Cập nhật thất bại",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật báo cáo.",
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
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor="report-search">Tìm kiếm</FieldLabel>
          <Input
            id="report-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mã, vị trí, loại báo cáo, mô tả"
          />
        </Field>
        <Field>
          <FieldLabel>Trạng thái</FieldLabel>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as "all" | ReportStatus)}
          >
            <SelectTrigger className="w-full min-w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả</SelectItem>
                {REPORT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getReportStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReports()}
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Làm mới
          </Button>
          {!canManage ? (
            <Button
              type="button"
              onClick={() => {
                setEditingReport(null);
                setCreating(true);
              }}
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Tạo mới
            </Button>
          ) : null}
        </div>
      </div>

      {isCreating ? (
        <ReportForm
          initialValues={EMPTY_FORM}
          reports={reports}
          submitLabel="Gửi báo cáo"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {editingReport ? (
        <ReportForm
          initialValues={toFormValues(editingReport)}
          reports={reports}
          submitLabel="Lưu báo cáo"
          onSubmit={handleUpdate}
          onCancel={() => setEditingReport(null)}
        />
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Đang tải báo cáo...
        </div>
      ) : null}

      {!isLoading && filteredReports.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
          Không tìm thấy báo cáo.
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredReports.map((report) => (
          <article
            key={report.id ?? `${report.description}-${report.createdAt}`}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Báo cáo #{report.id ?? "-"}
                </p>
                <h2 className="mt-1 text-lg font-bold text-card-foreground">
                  {categoryText(report)}
                </h2>
              </div>
              <Badge variant={statusBadgeVariant(statusOf(report))}>
                {getReportStatusLabel(statusOf(report))}
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {report.description || "Chưa có mô tả."}
            </p>
            <dl className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-muted-foreground">Địa chỉ</dt>
                <dd>{addressText(report) || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-muted-foreground">Toạ độ</dt>
                <dd>
                  {report.lat ?? "-"}, {report.lng ?? "-"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 font-semibold text-muted-foreground">Người báo</dt>
                <dd>{report.user?.username ?? report.userId ?? "-"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {report.id ? (
                  <Button asChild variant="outline">
                    <Link href={`/bao-cao/${report.id}`}>Chi tiết</Link>
                  </Button>
                ) : null}
              {canEditReport(report, identity, { assumeCurrentUserReport }) ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setEditingReport(report);
                  }}
                >
                  <Edit3 data-icon="inline-start" aria-hidden="true" />
                  Sửa
                </Button>
              ) : null}
              </div>

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
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => void handleStatusChange(report, status)}
                        disabled={isDisabled}
                      >
                        {isSaving ? "Đang lưu..." : getReportStatusLabel(status)}
                      </Button>
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
