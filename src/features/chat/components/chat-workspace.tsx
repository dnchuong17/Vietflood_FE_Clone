"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowDownIcon,
  ArrowPathIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { MotionPresence, prefersReducedMotion } from "@/components/motion/gsap-motion";
import {
  ChatApiError,
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  sendChatMessage,
  type ChatMessage,
  type ChatSession,
} from "@/features/chat/api/chat";
import { cn } from "@/lib/utils";
import styles from "./chat-workspace.module.css";

const MESSAGE_LIMIT = 2000;
const STARTER_PROMPTS = [
  "Tôi cần chuẩn bị gì trước lũ?",
  "Làm sao để báo cáo điểm ngập?",
  "Tôi xem trạng thái báo cáo ở đâu?",
];

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSessionDate(value: string | null): string {
  if (!value) return "Hội thoại cũ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hôm nay";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export function ChatWorkspace() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsCursor, setSessionsCursor] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingMoreSessions, setIsLoadingMoreSessions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<"sessions" | "messages" | "older" | "send" | "delete" | null>(null);
  const [retryDraft, setRetryDraft] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [displaySessionToDelete, setDisplaySessionToDelete] = useState<ChatSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; text: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyTriggerRef = useRef<HTMLButtonElement>(null);
  const historyDialogRef = useRef<HTMLElement>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const activeSessionRef = useRef<string | null>(null);
  const sessionsCursorRef = useRef<string | null>(null);
  const shouldFollowRef = useRef(true);
  const prependScrollRef = useRef<{ top: number; height: number } | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const newMessageSequenceRef = useRef(0);
  const newMessageIdsRef = useRef<Set<string>>(new Set());

  useGSAP(() => {
    if (prefersReducedMotion()) {
      newMessageIdsRef.current.clear();
      return;
    }
    const list = messageListRef.current;
    if (!list) return;
    for (const message of messages) {
      if (!newMessageIdsRef.current.has(message.id)) continue;
      const node = Array.from(list.querySelectorAll<HTMLElement>("[data-chat-message-id]"))
        .find((element) => element.dataset.chatMessageId === message.id);
      if (node) {
        newMessageIdsRef.current.delete(message.id);
        gsap.fromTo(node, { autoAlpha: 0, y: 10 }, {
          autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out", clearProps: "all",
        });
      }
    }
  }, { scope: messageListRef, dependencies: [messages] });

  const loadSessions = useCallback(async (append = false) => {
    if (append && !sessionsCursorRef.current) return;
    setError(null);
    if (append) setIsLoadingMoreSessions(true);
    try {
      const page = await getChatSessions(append ? sessionsCursorRef.current ?? undefined : undefined);
      setSessions((current) => append ? [...current, ...page.items] : page.items);
      sessionsCursorRef.current = page.nextCursor;
      setSessionsCursor(page.nextCursor);
    } catch (loadError) {
      setError(errorMessage(loadError));
      setErrorAction("sessions");
    } finally {
      setIsLoadingSessions(false);
      setIsLoadingMoreSessions(false);
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    queueMicrotask(() => { if (!canceled) void loadSessions(); });
    return () => { canceled = true; };
  }, [loadSessions]);

  useEffect(() => {
    const list = messageListRef.current;
    const bottom = bottomRef.current;
    if (!list || !bottom) return;
    const observer = new IntersectionObserver(([entry]) => {
      shouldFollowRef.current = entry.isIntersecting;
      setIsAtBottom(entry.isIntersecting);
    }, { root: list, rootMargin: "0px 0px 24px 0px", threshold: 0 });
    observer.observe(bottom);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    if (prependScrollRef.current) {
      const { top, height } = prependScrollRef.current;
      list.scrollTop = top + list.scrollHeight - height;
      prependScrollRef.current = null;
      return;
    }
    if (shouldFollowRef.current) list.scrollTop = list.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    if (!isHistoryOpen) return;
    const dialog = historyDialogRef.current;
    const trigger = historyTriggerRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsHistoryOpen(false);
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [isHistoryOpen]);

  useEffect(() => () => {
    if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current);
  }, []);

  useEffect(() => {
    isDeletingRef.current = isDeleting;
  }, [isDeleting]);

  useEffect(() => {
    if (!sessionToDelete) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = deleteDialogRef.current;
    deleteCancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeletingRef.current) {
        event.preventDefault();
        setSessionToDelete(null);
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [sessionToDelete]);

  const scrollToLatest = (smooth = false) => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    shouldFollowRef.current = true;
    setIsAtBottom(true);
  };

  const startNewChat = () => {
    activeSessionRef.current = null;
    shouldFollowRef.current = true;
    setIsAtBottom(true);
    setIsLoadingMessages(false);
    setActiveSessionId(null);
    setMessages([]);
    setMessagesCursor(null);
    setDraft("");
    setError(null);
    setErrorAction(null);
    setRetryDraft(null);
    setAnnouncement("");
    setCopyFeedback(null);
    setIsHistoryOpen(false);
  };

  const openSession = async (session: ChatSession) => {
    activeSessionRef.current = session.sessionId;
    shouldFollowRef.current = true;
    setIsAtBottom(true);
    setActiveSessionId(session.sessionId);
    setMessages([]);
    setMessagesCursor(null);
    setIsLoadingMessages(true);
    setError(null);
    setRetryDraft(null);
    setAnnouncement("");
    setCopyFeedback(null);
    setIsHistoryOpen(false);
    try {
      const page = await getChatMessages(session.sessionId);
      if (activeSessionRef.current !== session.sessionId) return;
      setMessages(page.items);
      setMessagesCursor(page.nextCursor);
    } catch (loadError) {
      if (activeSessionRef.current !== session.sessionId) return;
      setError(errorMessage(loadError));
      if (loadError instanceof ChatApiError && loadError.statusCode === 404) {
        activeSessionRef.current = null;
        setActiveSessionId(null);
        setIsLoadingMessages(false);
        void loadSessions();
      } else {
        setErrorAction("messages");
      }
    } finally {
      if (activeSessionRef.current === session.sessionId) setIsLoadingMessages(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!activeSessionId || !messagesCursor || isLoadingOlderMessages) return;
    const sessionId = activeSessionId;
    setIsLoadingOlderMessages(true);
    setError(null);
    setErrorAction(null);
    try {
      const page = await getChatMessages(sessionId, messagesCursor);
      if (activeSessionRef.current !== sessionId) return;
      const list = messageListRef.current;
      prependScrollRef.current = list ? { top: list.scrollTop, height: list.scrollHeight } : null;
      setMessages((current) => [...page.items, ...current]);
      setMessagesCursor(page.nextCursor);
    } catch (loadError) {
      if (activeSessionRef.current === sessionId) {
        setError(errorMessage(loadError));
        setErrorAction("older");
      }
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    textareaRef.current?.focus({ preventScroll: true });
    const text = draft.trim();
    if (!text || isSending) return;
    if (text.length > MESSAGE_LIMIT) {
      setError(`Tin nhắn tối đa ${MESSAGE_LIMIT.toLocaleString("vi-VN")} ký tự.`);
      return;
    }

    const submittedSessionId = activeSessionId;
    const clientMessageId = `user-local-${++newMessageSequenceRef.current}`;
    newMessageIdsRef.current.add(clientMessageId);
    setIsSending(true);
    setDraft("");
    setError(null);
    setErrorAction(null);
    setRetryDraft(null);
    setMessages((current) => [...current, {
      id: clientMessageId,
      role: "user",
      kind: "legacy",
      content: text,
      createdAt: new Date().toISOString(),
    }]);
    try {
      const reply = await sendChatMessage(text, submittedSessionId ?? undefined);
      const now = new Date().toISOString();
      if (activeSessionRef.current !== submittedSessionId) return;
      activeSessionRef.current = reply.sessionId;
      setActiveSessionId(reply.sessionId);
      const assistantMessageId = `assistant-local-${++newMessageSequenceRef.current}`;
      newMessageIdsRef.current.add(assistantMessageId);
      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          kind: "legacy",
          content: reply.answer,
          createdAt: now,
        },
      ]);
      setAnnouncement(`Trợ lý VietFlood: ${reply.answer}`);
      setSessions((current) => {
        const existing = current.find((session) => session.sessionId === reply.sessionId);
        return [
          {
            sessionId: reply.sessionId,
            title: existing?.title ?? text,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          },
          ...current.filter((session) => session.sessionId !== reply.sessionId),
        ];
      });
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== clientMessageId));
      const status = sendError instanceof ChatApiError ? sendError.statusCode : 0;
      setDraft(text);
      setRetryDraft(text);
      if (status === 403 || status === 404) {
        activeSessionRef.current = null;
        setActiveSessionId(null);
        setMessages([]);
        setMessagesCursor(null);
        void loadSessions();
        setError("Hội thoại này không còn khả dụng. Tin nhắn vẫn được giữ, hãy gửi lại để bắt đầu hội thoại mới.");
      } else if (status === 400) {
        setError("Tin nhắn chưa hợp lệ. Hãy kiểm tra nội dung và thử lại.");
      } else if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi gửi tin nhắn.");
      } else if (status === 429) {
        setError("Bạn đã gửi nhiều tin nhắn trong thời gian ngắn. Hãy chờ một chút rồi thử lại.");
      } else if (status === 503) {
        setError("Trợ lý đang tạm thời không khả dụng. Nội dung đã soạn vẫn được giữ để thử lại.");
      } else {
        setError(errorMessage(sendError));
      }
      setErrorAction("send");
    } finally {
      setIsSending(false);
    }
  };

  const retryMessage = () => {
    if (!retryDraft || isSending) return;
    setDraft(retryDraft);
    setRetryDraft(null);
    setError(null);
    textareaRef.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      const form = document.getElementById("chat-composer");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    });
  };

  const copyReply = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyFeedback({ id: message.id, text: "Đã sao chép" });
    } catch {
      setCopyFeedback({ id: message.id, text: "Không thể sao chép" });
    }
    if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopyFeedback(null), 3000);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete || isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    setError(null);
    setErrorAction(null);
    try {
      await deleteChatSession(sessionToDelete.sessionId);
      setSessions((current) => current.filter((item) => item.sessionId !== sessionToDelete.sessionId));
      if (activeSessionId === sessionToDelete.sessionId) startNewChat();
      setSessionToDelete(null);
      setError(null);
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setErrorAction("delete");
      if (deleteError instanceof ChatApiError && deleteError.statusCode === 404) {
        void loadSessions();
      }
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const activeSession = sessions.find((session) => session.sessionId === activeSessionId);
  const retryError = () => {
    if (errorAction === "sessions") void loadSessions();
    if (errorAction === "messages" && activeSession) void openSession(activeSession);
    if (errorAction === "older") void loadOlderMessages();
    if (errorAction === "send") retryMessage();
    if (errorAction === "delete") void confirmDelete();
  };

  const historyPanel = (mobile: boolean) => (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">VietFlood</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-sidebar-foreground">Lịch sử trò chuyện</h2>
        </div>
        {mobile ? (
          <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => setIsHistoryOpen(false)} aria-label="Đóng lịch sử">
            <XMarkIcon className="size-5" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="px-4 py-4">
        <Button className="h-11 w-full justify-start rounded-xl" onClick={startNewChat} disabled={isSending}>
          <PlusIcon className="size-4" aria-hidden="true" />
          Cuộc trò chuyện mới
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-busy={isLoadingSessions}>
        <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Gần đây</p>
        {isLoadingSessions ? (
          <div className="space-y-2 px-1" role="status" aria-label="Đang tải lịch sử">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Chưa có cuộc trò chuyện nào. Hãy bắt đầu bằng một câu hỏi.</p>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <div className={cn(
                  "group flex min-h-16 items-center gap-1 rounded-xl border-l-2 pl-3 pr-1 transition-colors",
                  activeSessionId === session.sessionId
                    ? "border-primary bg-primary/10 text-sidebar-foreground"
                    : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent",
                )}>
                  <button type="button" disabled={isSending} className="min-w-0 flex-1 rounded-md py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void openSession(session)} aria-current={activeSessionId === session.sessionId ? "page" : undefined}>
                    <span className="block truncate text-sm font-semibold">{session.title || "Cuộc trò chuyện mới"}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><ClockIcon className="size-3.5" aria-hidden="true" />{formatSessionDate(session.updatedAt || session.createdAt)}</span>
                  </button>
                  <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 text-muted-foreground hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100" onClick={() => { if (mobile) setIsHistoryOpen(false); setDisplaySessionToDelete(session); setSessionToDelete(session); }} disabled={isSending || isDeleting} aria-label={`Xóa hội thoại: ${session.title}`}>
                    <TrashIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {sessionsCursor ? (
          <Button variant="ghost" className="mt-3 min-h-11 w-full" onClick={() => void loadSessions(true)} disabled={isLoadingMoreSessions || isSending}>
            {isLoadingMoreSessions ? "Đang tải..." : "Tải hội thoại cũ hơn"}
          </Button>
        ) : null}
      </div>
    </>
  );

  return (
    <section className={cn(styles.chatFrame, "relative grid grid-cols-1 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:grid-cols-[300px_minmax(0,1fr)]")} aria-label="Trợ lý VietFlood">
      <aside className="hidden min-h-0 flex-col border-r border-border/70 bg-sidebar lg:flex" aria-label="Lịch sử hội thoại">
        {historyPanel(false)}
      </aside>

      <MotionPresence open={isHistoryOpen} mode="sheet" className="absolute inset-0 z-30 lg:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/35" onClick={() => setIsHistoryOpen(false)} aria-label="Đóng lịch sử hội thoại" />
          <aside ref={historyDialogRef} data-motion-panel role="dialog" aria-modal="true" aria-label="Lịch sử hội thoại" className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] flex-col border-r border-border bg-sidebar shadow-2xl">
            {historyPanel(true)}
          </aside>
      </MotionPresence>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-border/70 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button ref={historyTriggerRef} variant="ghost" size="icon" className="size-11 shrink-0 lg:hidden" onClick={() => setIsHistoryOpen(true)} aria-label="Mở lịch sử hội thoại" aria-expanded={isHistoryOpen}>
              <Squares2X2Icon aria-hidden="true" />
            </Button>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">Trợ lý VietFlood</h1>
              <p className="truncate text-xs text-muted-foreground">{activeSession?.title || "Hỏi đáp về an toàn lũ và dịch vụ VietFlood"}</p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm sm:mx-6 sm:flex-nowrap" role="alert">
            <p className="min-w-0 basis-full leading-5 sm:basis-0 sm:flex-1">{error}</p>
            {errorAction ? <Button type="button" variant="outline" size="sm" className="min-h-11 shrink-0" onClick={retryError}><ArrowPathIcon className="size-4" aria-hidden="true" />{errorAction === "sessions" ? "Tải lại" : "Thử lại"}</Button> : null}
            {error.includes("đăng nhập") ? <Button asChild size="sm" className="min-h-11"><Link href="/dang-nhap">Đăng nhập</Link></Button> : null}
            <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-1 size-11 shrink-0" onClick={() => setError(null)} aria-label="Đóng thông báo"><XMarkIcon aria-hidden="true" /></Button>
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1">
          <div ref={messageListRef} className="h-full overflow-y-auto bg-background/50 px-4 py-6 sm:px-8 sm:py-8" aria-label="Tin nhắn hội thoại">
            {activeSessionId && messagesCursor ? (
              <div className="mb-7 flex justify-center">
                <Button variant="outline" className="min-h-11 rounded-xl" onClick={() => void loadOlderMessages()} disabled={isLoadingOlderMessages}>
                  <ArrowDownIcon className="size-4 rotate-180" aria-hidden="true" />
                  {isLoadingOlderMessages ? "Đang tải tin nhắn..." : "Xem tin nhắn cũ hơn"}
                </Button>
              </div>
            ) : null}
            {isLoadingMessages ? (
              <div className="mx-auto mt-10 max-w-2xl space-y-5" role="status" aria-label="Đang tải tin nhắn">
                <div className="h-20 w-3/4 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
                <div className="ml-auto h-14 w-1/2 animate-pulse rounded-2xl bg-primary/10 motion-reduce:animate-none" />
                <div className="h-24 w-2/3 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
              </div>
            ) : messages.length === 0 ? (
              <div className={cn(styles.waterlines, "relative mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-8 text-center sm:px-8")}>
                <div className="relative z-10 flex w-full min-w-0 flex-col items-center">
                  <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-7" aria-hidden="true" /></span>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Bạn cần biết gì về lũ?</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Hỏi cách chuẩn bị, xử lý tình huống an toàn hoặc xem thông tin báo cáo của bạn.</p>
                  <div className="mt-6 flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                    {STARTER_PROMPTS.map((prompt, index) => (
                      <button key={prompt} type="button" onClick={() => { setDraft(prompt); textareaRef.current?.focus({ preventScroll: true }); }} className={cn("min-h-12 min-w-[230px] flex-none snap-start rounded-xl border border-border bg-card/95 px-4 py-3 text-left text-sm font-medium leading-5 text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0", index === 0 ? "sm:col-span-2" : "")}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-[760px] space-y-7">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const feedback = copyFeedback?.id === message.id ? copyFeedback.text : null;
                  return (
                    <article key={message.id} data-chat-message-id={message.id} className={cn("flex gap-2.5 sm:gap-3", isUser ? "justify-end" : "justify-start")}>
                      {!isUser ? <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-4" aria-hidden="true" /></span> : null}
                      <div className={cn("min-w-0 max-w-[88%] sm:max-w-[76%]", isUser ? "text-right" : "text-left")}>
                        <div className={cn("inline-block rounded-2xl px-4 py-3 text-left text-sm leading-6 shadow-sm sm:px-5", isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-card-foreground")}>
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className={cn("mt-1.5 flex min-h-11 items-center gap-2 px-1 text-xs text-muted-foreground", isUser ? "justify-end" : "justify-start")}>
                          <span>{isUser ? "Bạn" : "Trợ lý"}{message.createdAt ? ` · ${formatTime(message.createdAt)}` : ""}</span>
                          {!isUser ? (
                            <button type="button" onClick={() => void copyReply(message)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Sao chép câu trả lời lúc ${formatTime(message.createdAt)}`}>
                              {feedback === "Đã sao chép" ? <CheckIcon className="size-4" aria-hidden="true" /> : <ClipboardDocumentIcon className="size-4" aria-hidden="true" />}
                              {feedback || "Sao chép"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {isSending ? (
                  <div className="flex items-start gap-2.5" role="status" aria-label="Trợ lý đang trả lời">
                    <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-4" aria-hidden="true" /></span>
                    <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      <span>Đang trả lời</span>
                      <span className="flex items-center gap-1" aria-hidden="true"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s] motion-reduce:animate-none" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s] motion-reduce:animate-none" /><span className="size-1.5 animate-bounce rounded-full bg-primary motion-reduce:animate-none" /></span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <div ref={bottomRef} className="h-px" aria-hidden="true" />
          </div>
          {!isAtBottom && messages.length > 0 && !isLoadingMessages ? (
            <Button type="button" variant="outline" className="absolute bottom-4 right-4 min-h-11 rounded-xl border-primary/25 bg-card shadow-lg sm:right-8" onClick={() => scrollToLatest(true)}>
              <ArrowDownIcon className="size-4" aria-hidden="true" />
              Về tin nhắn mới nhất
            </Button>
          ) : null}
        </div>
        <p className="sr-only" aria-live="polite">{announcement}</p>
        <p className="sr-only" role="status">{copyFeedback?.text ?? ""}</p>

        <footer className="border-t border-border/70 bg-card px-3 py-3 sm:px-6 sm:py-4">
          <form id="chat-composer" onSubmit={submitMessage} className="mx-auto max-w-3xl">
            <label htmlFor="chat-message" className="sr-only">Tin nhắn của bạn</label>
            <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-colors focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
              <textarea
                id="chat-message"
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MESSAGE_LIMIT))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if (!isSending) event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={MESSAGE_LIMIT}
                rows={1}
                placeholder="Nhập câu hỏi của bạn..."
                className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-2 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-sm"
                readOnly={isSending}
              />
              <Button type="submit" size="icon" className="size-11 shrink-0" disabled={isSending || !draft.trim()} aria-label="Gửi tin nhắn">
                <ArrowDownIcon className="size-5 rotate-[-90deg]" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <span>Enter để gửi, Shift + Enter để xuống dòng</span>
              <span aria-live="polite">{draft.length}/{MESSAGE_LIMIT.toLocaleString("vi-VN")}</span>
            </div>
          </form>
        </footer>
      </div>
      {typeof document !== "undefined" ? createPortal(
        <MotionPresence open={!!sessionToDelete} onExitComplete={() => setDisplaySessionToDelete(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setSessionToDelete(null); }}>
          {displaySessionToDelete ? <div ref={deleteDialogRef} data-motion-panel role="alertdialog" aria-modal="true" aria-labelledby="chat-delete-title" aria-describedby="chat-delete-description" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><TrashIcon className="size-5" aria-hidden="true" /></div>
            <h2 id="chat-delete-title" className="text-lg font-bold">Xóa cuộc trò chuyện?</h2>
            <p id="chat-delete-description" className="mt-2 text-sm leading-6 text-muted-foreground">Tin nhắn trong <strong className="text-card-foreground">{displaySessionToDelete.title || "cuộc trò chuyện này"}</strong> sẽ bị xóa vĩnh viễn.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button ref={deleteCancelRef} type="button" variant="outline" className={cn("min-h-11", isDeleting && "opacity-50")} onClick={() => { if (!isDeleting) setSessionToDelete(null); }} aria-disabled={isDeleting}>Hủy</Button>
              <Button type="button" variant="destructive" className={cn("min-h-11", isDeleting && "opacity-60")} onClick={() => { if (!isDeleting) void confirmDelete(); }} aria-disabled={isDeleting}>{isDeleting ? "Đang xóa..." : "Xóa hội thoại"}</Button>
            </div>
          </div> : null}
        </MotionPresence>, document.body,
      ) : null}
    </section>
  );
}
