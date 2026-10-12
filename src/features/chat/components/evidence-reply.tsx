import Link from "next/link";
import type { ChatMessage } from "@/features/chat/api/chat";

function safeUrl(value: string): string | undefined {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
export function EvidenceReply({ message }: { message: ChatMessage }) {
  const sources = message.role === "assistant" ? message.sources ?? [] : [];
  const fragments = message.content.split(/(\[\d+\])/g);
  return <>
    <p className="whitespace-pre-wrap break-words">{fragments.map((text, index) => {
      const citation = /^\[(\d+)\]$/.exec(text);
      const source = citation && sources.find(s => s.citation === Number(citation[1]));
      return source ? <Link key={index} href={`/tro-ly/nguon/${encodeURIComponent(source.documentId)}/${source.version}`} target="_blank" className="font-medium text-primary underline underline-offset-4" aria-label={`Nguồn ${source.citation}: ${source.title}`}>{text}</Link> : <span key={index}>{text}</span>;
    })}</p>
    {sources.length > 0 && <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
      <p className="text-muted-foreground">AI diễn đạt từ nguồn được truy xuất. {message.sourceSupportPercent !== undefined && <span title="Tỷ lệ khẳng định trong câu trả lời được model đối chiếu với nguồn; không phải xác suất thông tin đúng.">Mức bám nguồn theo kiểm tra của model: {message.sourceSupportPercent}%.</span>}</p>
      <p className="text-muted-foreground">Mức bám nguồn không phải xác suất câu trả lời đúng.</p>
      <ol className="space-y-2">{sources.map(source => {
        const original = safeUrl(source.sourceUrl);
        return <li key={source.id}>
          <Link href={`/tro-ly/nguon/${encodeURIComponent(source.documentId)}/${source.version}`} target="_blank" className="font-medium text-primary underline underline-offset-4">[{source.citation}] {source.title}</Link>
          {source.sectionPath.length > 0 && <p className="text-muted-foreground">{source.sectionPath.join(" › ")}</p>}
          {original && <a href={original} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-primary underline">Mở website nguồn gốc</a>}
        </li>;
      })}</ol>
    </div>}
  </>;
}
