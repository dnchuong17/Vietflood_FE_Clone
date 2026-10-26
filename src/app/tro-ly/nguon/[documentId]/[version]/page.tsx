"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { getSourceSnapshot, type SourceSnapshot } from "@/features/chat/api/chat";

function SourceDocument() {
  const { documentId, version } = useParams<{ documentId: string; version: string }>();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; source?: SourceSnapshot; error?: string } | null>(null);
  const parsedVersion = Number(version);
  const valid = /^[A-Za-z0-9_-]{1,80}$/.test(documentId) && /^\d+$/.test(version) && Number.isSafeInteger(parsedVersion) && parsedVersion > 0;
  const requestKey = JSON.stringify([documentId, version, retry]);
  const current = result?.key === requestKey ? result : null;
  const source = current?.source ?? null;
  const error = valid ? current?.error ?? "" : "Mã tài liệu hoặc phiên bản không hợp lệ.";

  useEffect(() => {
    if (!valid) return;
    let active = true;
    getSourceSnapshot(documentId, parsedVersion)
      .then((value) => { if (active) setResult({ key: requestKey, source: value }); })
      .catch((cause: unknown) => {
        if (active) setResult({ key: requestKey, error: cause instanceof Error ? cause.message : "Không tải được nguồn. Vui lòng thử lại." });
      });
    return () => { active = false; };
  }, [documentId, parsedVersion, requestKey, valid]);

  let originalUrl: string | undefined;
  try {
    const url = new URL(source?.sourceUrl ?? "");
    if (["https:", "http:"].includes(url.protocol)) originalUrl = url.href;
  } catch {
    // Saved content remains readable without a valid original URL.
  }

  return (
    <section className="max-w-3xl rounded-xl border bg-card p-4 sm:p-6" aria-label="Bản lưu tài liệu nguồn">
      <h2 className="mb-4 text-xl font-bold">{source?.title ?? "Tài liệu nguồn VietFlood"}</h2>
      {error ? (
        <div className="grid gap-3">
          <p role="alert">{error}</p>
          {valid && <Button variant="outline" className="w-fit" onClick={() => setRetry((value) => value + 1)}>Thử tải lại nguồn</Button>}
        </div>
      ) : !source ? (
        <p role="status">Đang tải tài liệu...</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Bản lưu đã dùng làm nguồn, phiên bản {source.version}. Đây là nội dung trong kho RAG, có thể là bản diễn giải của nguồn. Nội dung hiện hành trên website gốc có thể thay đổi.</p>
          {source.active === false && <p className="mb-4 text-sm">Phiên bản lưu trữ này đã được thay thế hoặc nguồn đã rút khỏi kho tra cứu hiện tại.</p>}
          {originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="mb-4 inline-block break-all text-primary underline">Mở website nguồn gốc để đối chiếu</a>}
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{source.text}</pre>
        </>
      )}
    </section>
  );
}

export default function SourcePage() {
  return (
    <>
      <SiteHeader />
      <AppShell title="Tài liệu nguồn"><SourceDocument /></AppShell>
    </>
  );
}
