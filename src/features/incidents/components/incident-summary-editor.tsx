"use client";

import { useState, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { incidentGet, incidentChange, incidentDate, type IncidentDetail, type SummaryEdit, type Page } from "../api/incidents";

function EditProvenance({ edit }: { edit: SummaryEdit }) {
  return <><p className="text-xs">Admin #{edit.actorId ?? "không xác định"} · {incidentDate(edit.createdAt)} · {edit.pipeline} · Bằng chứng v{edit.evidenceVersion}</p><p className="text-xs">Lý do: {edit.reason || "Chưa được API cung cấp; xem lịch sử xử lý."}</p></>;
}
export function IncidentSummaryEditor({ incident, admin, onSaved }: { incident: IncidentDetail; admin: boolean; onSaved: () => Promise<void> }) {
  const id = useId();
  const [title, setTitle] = useState(incident.editorialSummary?.title ?? incident.title), [body, setBody] = useState(incident.editorialSummary?.body ?? ""), [reason, setReason] = useState("");
  const [history, setHistory] = useState<Page<SummaryEdit> | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const attempt = useRef<{ serialized: string; key: string } | null>(null);
  async function load(cursor?: string) {
    try {
      const next = await incidentGet<Page<SummaryEdit>>(`/incidents/${incident.id}/summary-edits`, { cursor });
      setHistory(current => ({ items: cursor ? [...(current?.items ?? []), ...next.items] : next.items, nextCursor: next.nextCursor }));
      setError(""); return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được lịch sử."); return false; }
  }
  async function save() {
    const payload = { expectedVersion: incident.version, reason: reason.trim(), title: title.trim(), body: body.trim() };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.serialized !== serialized) attempt.current = { serialized, key: crypto.randomUUID() };
    setBusy(true); setError(""); setSaved(false);
    try {
      await incidentChange(`/incidents/${incident.id}/summary-edits`, payload, "POST", attempt.current.key);
      await onSaved();
      setSaved(await load()); attempt.current = null;
    } catch (e) { setError(e instanceof Error ? e.message : "Không lưu được. Tải lại dữ liệu nếu có xung đột phiên bản."); }
    finally { setBusy(false); }
  }
  const edit = incident.editorialSummary;
  return <section className="rounded-xl border bg-card p-4 space-y-3 break-words" aria-label="Biên tập tóm tắt Admin">
    <h3 className="font-bold">Tóm tắt biên tập của Admin</h3>
    <p className="text-xs text-muted-foreground">Tách biệt với AI và mức độ chính thức; không sửa báo cáo gốc. Phiên bản bằng chứng {incident.evidence_version}.</p>
    {edit ? <article className="rounded border p-3"><h4 className="font-semibold">{edit.title}</h4><p className="whitespace-pre-wrap text-sm">{edit.body}</p><EditProvenance edit={edit} />{(edit.stale || edit.pipeline !== "incidents-v2" || edit.evidenceVersion !== incident.evidence_version) && <p className="text-sm text-amber-700 dark:text-amber-300">Bản biên tập cũ — cần đối chiếu bằng chứng mới / pipeline mới.</p>}</article> : <p className="text-sm">Chưa có bản biên tập Admin.</p>}
    {admin && !incident.merged_into && <details><summary className="cursor-pointer text-sm font-semibold">Biên tập tóm tắt</summary><div className="mt-3 grid gap-3">
      <div className="grid gap-1 text-sm"><label htmlFor={`${id}-title`}>Tiêu đề biên tập</label><Input id={`${id}-title`} value={title} minLength={3} maxLength={200} onChange={e => setTitle(e.target.value)} /></div>
      <div className="grid gap-1 text-sm"><label htmlFor={`${id}-body`}>Nội dung biên tập</label><textarea id={`${id}-body`} className="rounded border bg-background p-2 min-h-28" value={body} minLength={3} maxLength={4000} onChange={e => setBody(e.target.value)} /></div>
      <div className="grid gap-1 text-sm"><label htmlFor={`${id}-reason`}>Lý do biên tập</label><Input id={`${id}-reason`} value={reason} minLength={3} maxLength={1000} onChange={e => setReason(e.target.value)} /></div>
      <Button disabled={busy || title.trim().length < 3 || title.trim().length > 200 || body.trim().length < 3 || body.trim().length > 4000 || reason.trim().length < 3} onClick={() => void save()}>Lưu bản biên tập</Button>
    </div></details>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{saved && <p role="status">Đã lưu bản biên tập; lịch sử đã được tải lại.</p>}
    <Button variant="outline" onClick={() => void load()}>Xem lịch sử biên tập</Button>
    {history && <ol className="space-y-2">{history.items.map(item => <li key={item.id} className="border-l-2 pl-3 text-sm"><strong>{item.title}</strong><p className="whitespace-pre-wrap">{item.body}</p><EditProvenance edit={item} />{item.stale && <p className="text-xs">Bản biên tập cũ</p>}</li>)}{!history.items.length && <li>Chưa có lịch sử biên tập.</li>}</ol>}
    {history?.nextCursor && <Button variant="ghost" onClick={() => void load(history.nextCursor!)}>Tải thêm biên tập</Button>}
  </section>;
}
