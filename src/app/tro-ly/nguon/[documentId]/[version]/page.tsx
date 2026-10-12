"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSourceSnapshot, type SourceSnapshot } from "@/features/chat/api/chat";

export default function SourcePage() {
  const { documentId, version } = useParams<{ documentId: string; version: string }>();
  const [source, setSource] = useState<SourceSnapshot | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSource(null); setError("");
    getSourceSnapshot(documentId, Number(version)).then(value => { if (active) setSource(value); }).catch(() => { if (active) setError("Không tải được nguồn. Hãy kiểm tra đăng nhập và thử lại."); });
    return () => { active = false; };
  }, [documentId, version]);
  let originalUrl: string | undefined;
  try { const url = new URL(source?.sourceUrl ?? ""); if (["https:", "http:"].includes(url.protocol)) originalUrl = url.href; } catch { /* Snapshot remains readable when no valid original URL exists. */ }
  return <main className="mx-auto max-w-3xl p-6">
    <h1 className="mb-4 text-2xl font-bold">{source?.title ?? "Tài liệu nguồn VietFlood"}</h1>
    {error ? <p role="alert">{error}</p> : !source ? <p role="status">Đang tải tài liệu...</p> : <>
      <p className="mb-4 text-sm text-muted-foreground">Bản lưu đã dùng làm nguồn, phiên bản {source.version}. Đây là nội dung trong kho RAG, có thể là bản diễn giải của nguồn. Nội dung hiện hành trên website gốc có thể thay đổi.</p>
      {source.active === false && <p className="mb-4 text-sm">Phiên bản lưu trữ này đã được thay thế hoặc nguồn đã rút khỏi kho tra cứu hiện tại.</p>}
      {originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="mb-4 inline-block text-primary underline">Mở website nguồn gốc để đối chiếu</a>}
      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{source.text}</pre>
    </>}
  </main>;
}
