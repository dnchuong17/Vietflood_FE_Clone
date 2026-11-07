"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { retryVietnamDivisions, searchProvinces, searchWards, type DivisionOption } from "../api/vietnam-divisions";
import { changeVietnamProvince, resolveVietnamDivision, type VietnamAddressValue } from "../lib/vietnam-address";
import { DivisionCombobox } from "./division-combobox";

export type VietnamAddressPickerProps = {
  idPrefix: string;
  value: VietnamAddressValue;
  onChange: (value: VietnamAddressValue) => void;
  requiredProvince?: boolean;
  requiredWard?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  provinceName?: string;
  wardName?: string;
};

type DatasetState = { options: DivisionOption[]; loading: boolean; error?: string; key: string };

function useDivisions(provinceCode?: number) {
  const key = provinceCode === undefined ? "provinces" : `wards-${provinceCode}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DatasetState>({ options: [], loading: true, key });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState((previous) => ({ options: previous.key === key ? previous.options : [], loading: true, key }));
      try {
        const options = attempt > 0
          ? (await retryVietnamDivisions(provinceCode === undefined ? "provinces" : "wards")).filter((option) => provinceCode === undefined || option.provinceCode === provinceCode)
          : await (provinceCode === undefined ? searchProvinces() : searchWards(provinceCode));
        if (!cancelled) setState({ options, loading: false, key });
      } catch {
        if (!cancelled) setState((previous) => ({ ...previous, loading: false, error: "Không thể tải danh sách địa giới hành chính." }));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [key, provinceCode, attempt]);
  return { ...(state.key === key ? state : { options: [], loading: true, error: undefined }), retry: () => setAttempt((previous) => previous + 1) };
}

function WardField({ provinceCode, ...props }: Omit<React.ComponentProps<typeof DivisionCombobox>, "options" | "loading" | "error" | "onRetry"> & { provinceCode: number }) {
  const state = useDivisions(provinceCode);
  return <DivisionCombobox {...props} options={state.options} loading={state.loading} error={state.error} onRetry={state.retry} />;
}

export function VietnamAddressPicker({ idPrefix, value, onChange, requiredProvince, requiredWard, disabled, className, inputClassName, provinceName = "province", wardName = "ward" }: VietnamAddressPickerProps) {
  const provinces = useDivisions();
  const province = resolveVietnamDivision(provinces.options, value.province);
  const wardProps = {
    id: `${idPrefix}-ward`, name: wardName, label: "Phường/Xã", value: value.ward,
    onChange: (ward: string) => onChange({ ...value, ward }),
    disabled: disabled || !value.province.trim(), required: requiredWard, inputClassName,
  };
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
    <DivisionCombobox id={`${idPrefix}-province`} name={provinceName} label="Tỉnh/Thành phố"
      value={value.province} onChange={(next) => {
        if (next !== value.province) onChange(changeVietnamProvince(value, next, provinces.options));
      }}
      options={provinces.options} loading={provinces.loading} error={provinces.error} onRetry={provinces.retry}
      disabled={disabled} required={requiredProvince} inputClassName={inputClassName} />
    {province ? <WardField key={province.code} {...wardProps} provinceCode={province.code} />
      : <DivisionCombobox key={`manual-${value.province}`} {...wardProps} options={[]} manualOnly />}
  </div>;
}
