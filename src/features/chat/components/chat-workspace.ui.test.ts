import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { filterLoadedSessions } from "./chat-workspace";
import type { ChatSession } from "@/features/chat/api/chat";

const source = readFileSync(new URL("./chat-workspace.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./chat-workspace.module.css", import.meta.url), "utf8");
const sessions: ChatSession[] = [
  { sessionId: "a", title: "Báo cáo Đà Nẵng", createdAt: null, updatedAt: "2026-10-27T10:00:00Z" },
  { sessionId: "b", title: "Chuẩn bị trước lũ", createdAt: null, updatedAt: "2026-10-26T10:00:00Z" },
  { sessionId: "c", title: "", createdAt: null, updatedAt: "2026-10-25T10:00:00Z" },
];

describe("loaded conversation search", () => {
  it("filters Vietnamese case and diacritic-insensitive titles without mutating history", () => {
    expect(filterLoadedSessions(sessions, "  BAO CAO DA NANG ").map((item) => item.sessionId)).toEqual(["a"]);
    expect(filterLoadedSessions(sessions, "trước LŨ").map((item) => item.sessionId)).toEqual(["b"]);
    expect(filterLoadedSessions(sessions, "trò chuyện mới").map((item) => item.sessionId)).toEqual(["c"]);
    expect(sessions).toHaveLength(3);
  });
  it("returns loaded history in its existing order for blank queries, and no fake results", () => {
    expect(filterLoadedSessions(sessions, "  ")).toBe(sessions);
    expect(filterLoadedSessions(sessions, "không tồn tại")).toEqual([]);
    expect(filterLoadedSessions([], "báo cáo")).toEqual([]);
  });
  it("renders the filtered list and honestly discloses cursor-limited search", () => {
    expect(source).toContain("filteredSessions.map((session)");
    expect(source).toContain("Không tìm thấy cuộc trò chuyện trong lịch sử đã tải");
    expect(source).toContain("Chỉ tìm trong lịch sử đã tải");
    expect(source).toContain("loadSessions(true)");
  });
});

describe("enterprise chat interaction contracts", () => {
  it("keeps composer help wrapping and device evidence removal keyboard-accessible", () => {
    expect(source).toContain("flex flex-wrap items-center justify-between gap-x-4 gap-y-1");
    expect(source).toContain("min-h-11 items-center rounded-lg px-2 font-semibold text-destructive focus-visible:outline-2");
    expect(source).toContain('aria-label={`Gỡ ảnh ${file.name}`}');
    expect(source).toContain("GPS và ảnh là tùy chọn, chỉ được gửi khi bạn xác nhận tạo báo cáo.");
  });

  it("keeps report actions outside the scrollable attachment details", () => {
    expect(source).toContain('className={styles.reportTaskBody}');
    expect(source).toContain('cn(styles.reportTaskActions,');
    expect(css).toContain('.reportTaskBody');
    expect(css).toContain('.reportTaskActions');
    expect(css).toContain('flex-shrink: 0');
  });
  it("keeps automation hooks, accessible labels and composer identity stable", () => {
    for (const hook of ["chat-workspace", "chat-history-search", "chat-new-conversation", "chat-message-input", "chat-send-button", "chat-prompt-create-report", "chat-report-task", "chat-history-toggle", "chat-history-close"]) {
      expect(source).toContain(hook);
    }
    for (const text of ["Trợ lý VietFlood", "Cuộc trò chuyện mới", "Tin nhắn của bạn", 'aria-label="Gửi tin nhắn"', 'id="chat-message"', 'role="alertdialog"']) expect(source).toContain(text);
  });
  it("offers the three aligned starter actions without auto-sending", () => {
    for (const prompt of ["Tạo báo cáo ngập lụt", "Tôi cần chuẩn bị gì trước lũ?", "Làm gì khi nước bắt đầu dâng?"]) expect(source).toContain(prompt);
    const starterHandler = source.match(/onClick=\{\(\) => \{ setDraft\(prompt\);[^\n]+?\}\} className/)?.[0];
    expect(starterHandler).toContain("textareaRef.current?.focus");
    expect(starterHandler).not.toContain("requestSubmit");
    expect(starterHandler).not.toContain("sendChatMessage");
  });
  it("retains IME protection, reduced-motion scrolling and prepend scroll anchoring", () => {
    expect(source).toContain("!event.nativeEvent.isComposing");
    expect(source).toContain("!event.shiftKey");
    expect(source).toContain('smooth && !prefersReducedMotion() ? "smooth" : "auto"');
    expect(source).toContain("list.scrollTop = top + list.scrollHeight - height");
    expect(css).toContain("prefers-reduced-motion");
    expect(source).toContain("input:not([disabled])");
  });
  it("keeps attachment submission behind explicit report confirmation and never ordinary sending", () => {
    expect(source).toContain("sendChatMessage(text, submittedSessionId ?? undefined)");
    expect(source).toContain('decision === "confirm" && isReportCreation');
    expect(source).toContain("files: reportEvidence");
    expect(source).toContain('pendingAction.status === "awaiting_confirmation" ? <Button');
    expect(source).toContain('onClick={() => void decidePendingAction("cancel")}');
    expect(source).toContain('setActionDecision(decision)');
    expect(source).toContain('setPendingAction(reply.action && ["collecting", "awaiting_confirmation"].includes(reply.action.status)');
    expect(source).toContain("requestId !== locationRequestRef.current");
  });
});
