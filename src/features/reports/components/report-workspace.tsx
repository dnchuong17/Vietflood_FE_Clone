"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  ArrowPathIcon as RefreshCw,
  CheckCircleIcon as CheckCircle2,
  ClipboardDocumentListIcon as ClipboardList,
  ClockIcon as Clock3,
  CursorArrowRaysIcon as LocateFixed,
  EyeIcon as Eye,
  ExclamationTriangleIcon as AlertTriangle,
  MagnifyingGlassIcon as Search,
  MapPinIcon as MapPin,
  PaperAirplaneIcon as Send,
  PencilSquareIcon as Edit3,
  PhotoIcon as ImageIcon,
  PlusIcon as Plus,
  ShieldCheckIcon as ShieldCheck,
  UserIcon as UserRound,
  XCircleIcon as XCircle,
  XMarkIcon as X,
} from "@heroicons/react/24/solid";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { LoadingBar } from "@/components/feedback/loading-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  geocodeReportLocation,
  reverseGeocodeLocation,
  type GeocodingAttribution,
  type GeocodingResult,
} from "@/features/location/api/geocoding";
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
import {
  buildReportsOverviewSummary,
  formatReportsLastSyncedAt,
} from "@/features/reports/lib/overview";
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
  isLocationManuallyEdited: false,
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

const REPORT_STATUS_ICONS: Record<
  ReportStatus,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  pending: Clock3,
  verified: ShieldCheck,
  resolved: CheckCircle2,
  rejected: XCircle,
};

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
    isLocationManuallyEdited: false,
    files: null,
  };
}

function stripReportCoordinates(values: ReportFormValues): ReportFormValues {
  return {
    ...values,
    lat: "",
    lng: "",
    isLocationManuallyEdited: false,
  };
}

function applyGeocodingResultToValues(
  values: ReportFormValues,
  result: GeocodingResult,
): ReportFormValues {
  return {
    ...values,
    province: result.province?.name ?? values.province,
    ward: result.ward?.name ?? values.ward,
    addressLine: result.addressLine ?? values.addressLine,
    lat: result.coordinates ? String(result.coordinates.lat) : values.lat,
    lng: result.coordinates ? String(result.coordinates.lng) : values.lng,
    isLocationManuallyEdited: false,
  };
}

function formatLocationAttribution(
  attribution: GeocodingAttribution | null,
): string {
  return attribution
    ? `${attribution.provider} - ${attribution.license}`
    : "OpenStreetMap Nominatim";
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
  const [pendingCoordinatesFallback, setPendingCoordinatesFallback] =
    useState<ReportFormValues | null>(null);
  const [locationAttribution, setLocationAttribution] =
    useState<GeocodingAttribution | null>(null);

  function setField<T extends keyof ReportFormValues>(
    field: T,
    value: ReportFormValues[T],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function setManualLocationField<T extends "province" | "ward" | "addressLine">(
    field: T,
    value: ReportFormValues[T],
  ) {
    setValues((prev) => ({
      ...prev,
      [field]: value,
      isLocationManuallyEdited: true,
    }));
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
  const selectedLocationParts = [values.province.trim(), values.ward.trim()].filter(Boolean);
  const hasGpsCoordinates = Boolean(values.lat.trim() && values.lng.trim());
  const canEditWard = Boolean(selectedProvinceCode || values.province.trim());
  const normalizedProvinceValue = values.province.trim().toLocaleLowerCase("vi-VN");
  const normalizedWardValue = values.ward.trim().toLocaleLowerCase("vi-VN");
  const visibleProvinceOptions = useMemo(
    () =>
      provinceOptions.filter(
        (option) => option.name.trim().toLocaleLowerCase("vi-VN") !== normalizedProvinceValue,
      ),
    [normalizedProvinceValue, provinceOptions],
  );
  const visibleWardOptions = useMemo(
    () =>
      wardOptions.filter(
        (option) => option.name.trim().toLocaleLowerCase("vi-VN") !== normalizedWardValue,
      ),
    [normalizedWardValue, wardOptions],
  );
  const locationAttributionLabel = formatLocationAttribution(locationAttribution);

  function handleProvinceInput(value: string) {
    setValues((prev) => ({
      ...prev,
      province: value,
      ward: "",
      isLocationManuallyEdited: true,
    }));
    setSelectedProvinceCode(null);
    setWardOptions([]);
  }

  function selectProvince(option: DivisionOption) {
    setValues((prev) => ({
      ...prev,
      province: option.name,
      ward: "",
      isLocationManuallyEdited: true,
    }));
    setSelectedProvinceCode(option.code);
    setWardOptions([]);
  }

  function handleWardInput(value: string) {
    setManualLocationField("ward", value);
  }

  function selectWard(option: DivisionOption) {
    setManualLocationField("ward", option.name);
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

  async function applyReverseGeocode(position: GeolocationPosition) {
    const coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    setValues((prev) => ({
      ...prev,
      lat: String(position.coords.latitude),
      lng: String(position.coords.longitude),
      isLocationManuallyEdited: false,
    }));

    try {
      const result = await reverseGeocodeLocation(coordinates);
      setValues((prev) => applyGeocodingResultToValues(prev, result));
      setSelectedProvinceCode(result.province?.code ?? null);
      setLocationAttribution(result.attribution);
    } catch (error) {
      showAlert({
        title: "Không thể tự điền địa chỉ",
        description:
          error instanceof Error
            ? error.message
            : "Đã giữ tọa độ GPS nhưng không thể lấy tỉnh/phường.",
        variant: "error",
      });
    }
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
        void applyReverseGeocode(position);
      },
      () => {
        showAlert({
          title: "Vị trí bị chặn",
          description: "Hãy cho phép truy cập vị trí hoặc tiếp tục gửi báo cáo không có tọa độ.",
          variant: "error",
        });
      },
      { enableHighAccuracy: true },
    );
  }

  async function resolveReportLocationBeforeSubmit(
    nextValues: ReportFormValues,
  ): Promise<ReportFormValues> {
    if (!nextValues.isLocationManuallyEdited) {
      return nextValues;
    }

    const result = await geocodeReportLocation({
      province: nextValues.province,
      ward: nextValues.ward,
      addressLine: nextValues.addressLine,
    });

    if (!result.coordinates) {
      throw new Error("Không thể tìm tọa độ cho địa chỉ này.");
    }

    const resolvedValues = applyGeocodingResultToValues(nextValues, result);
    setValues(resolvedValues);
    setSelectedProvinceCode(result.province?.code ?? selectedProvinceCode);
    setLocationAttribution(result.attribution);
    return resolvedValues;
  }

  async function submitPendingCoordinatesFallback() {
    if (!pendingCoordinatesFallback) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(pendingCoordinatesFallback);
      setPendingCoordinatesFallback(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    let resolvedValues: ReportFormValues;

    try {
      resolvedValues = await resolveReportLocationBeforeSubmit(values);
    } catch (error) {
      setPendingCoordinatesFallback(stripReportCoordinates(values));
      showAlert({
        title: "Không thể xác định tọa độ",
        description:
          error instanceof Error
            ? error.message
            : "Bạn có thể kiểm tra lại địa chỉ hoặc xác nhận gửi không có tọa độ.",
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(resolvedValues);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ClipboardList className="size-4 text-sky-700" aria-hidden="true" />
          Loại báo cáo
        </span>
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

      <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">Khu vực báo cáo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chọn tỉnh/thành phố trước, sau đó chọn hoặc nhập phường/xã để lọc gợi ý địa chỉ.
            </p>
          </div>
          <div
            data-location-summary="selected"
            className="flex flex-wrap gap-2"
            aria-live="polite"
          >
            {selectedLocationParts.length > 0 ? (
              selectedLocationParts.map((part) => (
                <Badge key={part} variant="outline">
                  {part}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Chưa chọn khu vực</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_8rem]">
          <Field data-location-step="province">
            <FieldLabel htmlFor="report-province">Tỉnh/Thành phố</FieldLabel>
            <Input
              id="report-province"
              value={values.province}
              onChange={(event) => handleProvinceInput(event.target.value)}
              placeholder="Tìm tỉnh/thành phố"
              required
            />
            {values.province.trim() ? (
              <Badge variant={selectedProvinceCode ? "success" : "outline"} className="w-fit">
                Tỉnh/Thành phố đã chọn: {values.province}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                Nhập tên tỉnh/thành phố để tìm từ danh mục hành chính.
              </span>
            )}
            {visibleProvinceOptions.length > 0 ? (
              <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm">
                {visibleProvinceOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => selectProvince(option)}
                    className="rounded-md px-2 py-1.5 text-left text-xs font-semibold text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : isLoadingProvinces ? (
              <span className="text-xs font-medium text-muted-foreground">
                Đang tải tỉnh/thành phố...
              </span>
            ) : null}
          </Field>

          <Field data-location-step="ward">
            <FieldLabel htmlFor="report-ward">Phường/Xã</FieldLabel>
            <Input
              id="report-ward"
              value={values.ward}
              onChange={(event) => handleWardInput(event.target.value)}
              disabled={!canEditWard}
              placeholder={canEditWard ? "Tìm phường/xã" : "Chọn tỉnh/thành phố trước"}
            />
            {values.ward.trim() ? (
              <Badge variant="success" className="w-fit">
                Phường/Xã đã chọn: {values.ward}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {canEditWard
                  ? "Chọn từ danh sách gợi ý hoặc nhập thủ công nếu chưa có dữ liệu."
                  : "Chọn tỉnh/thành phố trước"}
              </span>
            )}
            {visibleWardOptions.length > 0 ? (
              <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm">
                {visibleWardOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => selectWard(option)}
                    className="rounded-md px-2 py-1.5 text-left text-xs font-semibold text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : isLoadingWards ? (
              <span className="text-xs font-medium text-muted-foreground">
                Đang tải phường/xã...
              </span>
            ) : null}
          </Field>

        </div>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Địa chỉ
          <input
            value={values.addressLine}
            onChange={(event) => setManualLocationField("addressLine", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="Số nhà, tên đường"
        />
        {addressSuggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {addressSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setManualLocationField("addressLine", suggestion)}
                className="rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </label>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-1 text-sm text-slate-700">
          <span className="font-semibold">Tọa độ GPS</span>
          <span className="text-xs text-slate-600">
            {hasGpsCoordinates
              ? "Đã ghi nhận tọa độ từ thiết bị."
              : "Chưa có tọa độ GPS; báo cáo vẫn có thể gửi bằng địa chỉ đã nhập."}
          </span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            Dữ liệu địa lý: {locationAttributionLabel} / OpenStreetMap
          </a>
        </div>
        <button
          type="button"
          onClick={fillCurrentLocation}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          Dùng GPS
        </button>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="size-4 text-sky-700" aria-hidden="true" />
            Tệp minh chứng
          </span>
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
          <X className="mr-2 inline size-4 align-[-0.125em]" aria-hidden="true" />
          Huỷ
        </button>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          <Send className="mr-2 inline size-4 align-[-0.125em]" aria-hidden="true" />
          {isSubmitting ? "Đang lưu..." : submitLabel}
        </button>
      </div>
      </form>
      <ConfirmDialog
        isOpen={Boolean(pendingCoordinatesFallback)}
        title="Gửi báo cáo không có tọa độ?"
        description="Không thể geocode địa chỉ hiện tại. Nếu tiếp tục, báo cáo vẫn có tỉnh/phường/địa chỉ nhưng không có lat/lng."
        confirmLabel="Gửi không tọa độ"
        cancelLabel="Kiểm tra lại"
        isConfirming={isSubmitting}
        onCancel={() => setPendingCoordinatesFallback(null)}
        onConfirm={() => void submitPendingCoordinatesFallback()}
      />
    </>
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
  const lastSyncedAt = useReportsStore((state) => state.lastSyncedAt);
  const isCreating = useReportsStore((state) => state.isCreating);
  const editingReport = useReportsStore((state) => state.editingReport);
  const savingStatusByReportId = useReportsStore(
    (state) => state.savingStatusByReportId,
  );
  const setReports = useReportsStore((state) => state.setReports);
  const setLoading = useReportsStore((state) => state.setLoading);
  const setFilter = useReportsStore((state) => state.setFilter);
  const setQuery = useReportsStore((state) => state.setQuery);
  const setLastSyncedAt = useReportsStore((state) => state.setLastSyncedAt);
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
      const nextReports = await listReports(role);
      setReports(nextReports);
      setLastSyncedAt(new Date().toISOString());
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

  const reportsOverview = useMemo(
    () => buildReportsOverviewSummary(reports, filteredReports.length),
    [filteredReports.length, reports],
  );
  const lastSyncedLabel = formatReportsLastSyncedAt(lastSyncedAt);

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
      <Card>
        <CardContent className="grid gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-card-foreground">
                Tổng quan báo cáo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Theo dõi nhanh trạng thái báo cáo từ danh sách hiện tại.
              </p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Đồng bộ: {lastSyncedLabel}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Tổng báo cáo
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {reportsOverview.total}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Đang hiển thị
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {reportsOverview.filtered}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {getReportStatusLabel("pending")}
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {reportsOverview.pending}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Khẩn cấp
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {reportsOverview.urgent}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {getReportStatusLabel("verified")}: {reportsOverview.verified}
            </Badge>
            <Badge variant="success" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {getReportStatusLabel("resolved")}: {reportsOverview.resolved}
            </Badge>
            <Badge variant="critical" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {getReportStatusLabel("rejected")}: {reportsOverview.rejected}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor="report-search">Tìm kiếm</FieldLabel>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="report-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mã, vị trí, loại báo cáo, mô tả"
              className="pl-9"
            />
          </div>
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
        <LoadingBar
          title="Đang tải báo cáo..."
          description="Đồng bộ danh sách báo cáo hiện trường mới nhất."
        />
      ) : null}

      {!isLoading && filteredReports.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
          <ClipboardList className="size-9 text-sky-700" aria-hidden="true" />
          <span>Không tìm thấy báo cáo.</span>
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
                <dt className="flex w-24 items-center gap-1.5 font-semibold text-muted-foreground">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  Địa chỉ
                </dt>
                <dd>{addressText(report) || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="flex w-24 items-center gap-1.5 font-semibold text-muted-foreground">
                  <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
                  Toạ độ
                </dt>
                <dd>
                  {report.lat ?? "-"}, {report.lng ?? "-"}
                </dd>
              </div>
              {identity?.role !== "citizen" && (
                <div className="flex gap-2">
                  <dt className="flex w-24 items-center gap-1.5 font-semibold text-muted-foreground">
                    <UserRound className="size-4 shrink-0" aria-hidden="true" />
                    Người báo
                  </dt>
                  <dd>{report.user?.username ?? report.userId ?? "-"}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {report.id ? (
                  <Button asChild variant="outline">
                    <Link href={`/bao-cao/${report.id}`}>
                      <Eye data-icon="inline-start" aria-hidden="true" />
                      Chi tiết
                    </Link>
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
                    const StatusIcon = REPORT_STATUS_ICONS[status];

                    return (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => void handleStatusChange(report, status)}
                        disabled={isDisabled}
                      >
                        <StatusIcon data-icon="inline-start" aria-hidden="true" />
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
