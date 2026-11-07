"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DivisionOption } from "../api/vietnam-divisions";
import { filterVietnamDivisions } from "../lib/vietnam-address";

export type DivisionComboboxProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (name: string) => void;
  options: DivisionOption[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  disabled?: boolean;
  required?: boolean;
  inputClassName?: string;
  manualOnly?: boolean;
};

export function DivisionCombobox({ id, name, label, value, onChange, options, loading, error, onRetry, disabled, required, inputClassName, manualOnly }: DivisionComboboxProps) {
  const [observedValue, setObservedValue] = useState(value);
  const [draft, setDraft] = useState(value);
  const [manual, setManual] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  // Controlled resets/prefills synchronize without emitting a selection event.
  if (observedValue !== value) {
    setObservedValue(value);
    setDraft(value);
    setActive(-1);
  }
  const results = filterVietnamDivisions(options, draft === value ? "" : draft);
  const statusId = `${id}-status`;
  const listId = `${id}-options`;
  const hasDraft = !manual && draft !== value;
  useEffect(() => {
    input.current?.setCustomValidity(hasDraft ? "Chọn một kết quả hoặc chuyển sang nhập thủ công." : "");
  }, [hasDraft]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { setDraft(value); setOpen(false); setActive(-1); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [value]);
  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, id]);

  function commit(next: string) {
    setDraft(next);
    setOpen(false);
    setActive(-1);
    if (next !== value) onChange(next);
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}{required ? " *" : ""}</label>
      <input type="hidden" name={name} value={value} disabled={disabled} />
      <Popover.Root open={open && !manual && !disabled} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className="relative">
            <Input ref={input} id={id} role={manual ? undefined : "combobox"} value={draft}
              autoComplete="off" required={required} disabled={disabled}
              aria-expanded={manual ? undefined : open && !disabled} aria-controls={manual ? undefined : listId}
              aria-autocomplete={manual ? undefined : "list"}
              aria-activedescendant={open && active >= 0 && active < results.length ? `${id}-option-${active}` : undefined}
              aria-describedby={statusId} aria-busy={loading || undefined}
              placeholder={manual ? "Nhập tên thủ công" : "Tìm và chọn…"}
              className={cn("h-10 pr-9", inputClassName)}
              onFocus={() => { if (!manual) setOpen(true); }}
              onClick={() => { if (!manual) setOpen(true); }}
              onChange={(event) => {
                const next = event.target.value;
                setDraft(next); setActive(-1);
                if (manual) onChange(next); else setOpen(true);
              }}
              onBlur={() => { if (!manual) { setOpen(false); setActive(-1); } }}
              onKeyDown={(event) => {
                if (manual) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault(); setOpen(true);
                  setActive((index) => results.length ? (event.key === "ArrowDown" ? (index + 1) % results.length : (index <= 0 ? results.length - 1 : index - 1)) : -1);
                } else if (event.key === "Enter" && open) {
                  event.preventDefault();
                  if (active >= 0 && results[active]) commit(results[active].name);
                } else if (event.key === "Escape") {
                  event.preventDefault(); setDraft(value); setOpen(false); setActive(-1);
                } else if (event.key === "Tab") {
                  setOpen(false); setActive(-1);
                }
              }} />
            {(value || draft) && !disabled && <button type="button" aria-label={`Xóa ${label}`} className="absolute inset-y-0 right-0 w-9 text-muted-foreground hover:text-foreground" onClick={() => commit("")}>×</button>}
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content sideOffset={4} align="start" onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => { if (event.target === input.current) event.preventDefault(); }}
            className="z-[100] w-[var(--radix-popover-trigger-width)] min-w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <div role="listbox" id={listId} aria-label={`${label} — kết quả`} className="max-h-60 overflow-y-auto overscroll-contain">
              {results.map((option, index) => <div key={option.code} id={`${id}-option-${index}`} role="option" aria-selected={option.name === value}
                className={cn("cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent", index === active && "bg-accent", option.name === value && "font-semibold")}
                onPointerMove={() => setActive(index)} onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(option.name)}>{option.name}{option.name === value ? " ✓" : ""}</div>)}
              {!results.length && <p className="px-3 py-2 text-sm text-muted-foreground">{loading ? "Đang tải danh sách…" : error ? "Danh sách chưa khả dụng." : manualOnly ? "Chọn tỉnh trong danh sách hoặc nhập phường/xã thủ công." : "Không tìm thấy kết quả."}</p>}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <div id={statusId} className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
        {loading && <p role="status">Đang tải danh sách…</p>}
        {error && <p role="alert">{error} {onRetry && <button type="button" disabled={disabled || loading} className="underline" onClick={onRetry}>Thử lại</button>}</p>}
        {value && !loading && !options.some((option) => option.name === value) && <p>Giữ nguyên giá trị đã lưu: {value}. Có thể nhập thủ công nếu địa chỉ cũ chưa có trong danh sách.</p>}
        {manual && <p>Đang nhập thủ công — tên được lưu nguyên văn.</p>}
        {hasDraft && <p role="status">Chọn một kết quả để xác nhận, nhấn Escape để hủy tìm kiếm hoặc chuyển sang nhập thủ công.</p>}
        <button type="button" disabled={disabled} className="min-h-8 text-left underline underline-offset-2 disabled:opacity-50"
          onClick={() => { setManual(!manual); setDraft(value); setOpen(false); setActive(-1); }}>
          {manual ? "Chọn từ danh sách" : `Nhập ${label.toLocaleLowerCase("vi")} thủ công (địa chỉ cũ / mất kết nối)`}
        </button>
      </div>
    </div>
  );
}
