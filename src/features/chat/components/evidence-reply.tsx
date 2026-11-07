import Link from "next/link";
import type { ChatMessage } from "@/features/chat/api/chat";

function safeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const STATUS_LABELS = {
  partial: "Câu trả lời chưa đầy đủ",
  no_knowledge: "Chưa có nguồn kiến thức phù hợp",
  unsupported_dynamic: "Không hỗ trợ thông tin cập nhật tức thời",
  needs_clarification: "Cần thêm thông tin để trả lời",
  unavailable: "Nguồn trả lời tạm thời không khả dụng",
} as const;

export function EvidenceReply({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  const sources = isAssistant ? message.sources ?? [] : [];
  const warning = isAssistant && message.status && message.status !== "answered"
    ? STATUS_LABELS[message.status]
    : null;
  const unanswered = isAssistant ? message.unansweredParts ?? [] : [];
  const fragments = message.content.split(/(\[\d+\])/g);

  return <>
    {warning ? <p role="status" className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium leading-5 text-foreground">{warning}</p> : null}
    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{fragments.map((text, index) => {
      const citation = /^\[(\d+)\]$/.exec(text);
      const source = citation && sources.find((item) => item.citation === Number(citation[1]));
      return source ? <Link key={index} href={`/tro-ly/nguon/${encodeURIComponent(source.documentId)}/${source.version}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4" aria-label={`Nguồn ${source.citation}: ${source.title}`}>{text}</Link> : <span key={index}>{text}</span>;
    })}</p>
    {unanswered.length > 0 ? <details className="mt-3 rounded-lg border border-border px-3 py-2 text-xs leading-5">
      <summary className="cursor-pointer py-2 font-medium">Phần chưa được trả lời</summary>
      <ul className="mt-2 list-disc space-y-1 pl-4">{unanswered.map((part, index) => <li key={index} className="whitespace-pre-wrap break-words">{part}</li>)}</ul>
    </details> : null}
    {sources.length > 0 ? <div className="mt-3 border-t border-border pt-3 text-xs leading-5">
      <details>
        <summary className="cursor-pointer py-2 font-medium text-foreground">Nguồn tham khảo · {sources.length}</summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>AI diễn đạt từ nguồn được truy xuất.</p>
          {message.sourceSupportPercent !== undefined ? <p>Mức bám nguồn theo kiểm tra của model: {message.sourceSupportPercent}%.</p> : null}
          <p>Mức bám nguồn không phải xác suất câu trả lời đúng.</p>
          <ol className="divide-y divide-border">{sources.map((source) => {
            const original = safeUrl(source.sourceUrl);
            return <li key={source.id} className="min-w-0 space-y-1 break-words py-3 first:pt-0 last:pb-0">
              <Link href={`/tro-ly/nguon/${encodeURIComponent(source.documentId)}/${source.version}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4" aria-label={`Nguồn ${source.citation}: ${source.title}`}>[{source.citation}] {source.title}</Link>
              <p className="mt-0.5">Phiên bản {source.version}{source.sectionPath.length > 0 ? ` · ${source.sectionPath.join(" › ")}` : ""}</p>
              {original ? <a href={original} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-primary underline underline-offset-4">Mở website nguồn gốc</a> : null}
            </li>;
          })}</ol>
        </div>
      </details>
    </div> : null}
  </>;
}
