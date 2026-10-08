"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
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
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
  const [isDeleting, setIsDeleting] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<string | null>(null);
  const sessionsCursorRef = useRef<string | null>(null);
  const preserveScrollRef = useRef(false);

  const loadSessions = useCallback(async (append = false) => {
    if (append && !sessionsCursorRef.current) return;
    setError(null);
    if (append) setIsLoadingMoreSessions(true);
    else setIsLoadingSessions(true);
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
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (preserveScrollRef.current) {
      preserveScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const startNewChat = () => {
    activeSessionRef.current = null;
    setActiveSessionId(null);
    setMessages([]);
    setMessagesCursor(null);
    setDraft("");
    setError(null);
    setErrorAction(null);
    setRetryDraft(null);
    setIsHistoryOpen(false);
  };

  const openSession = async (session: ChatSession) => {
    activeSessionRef.current = session.sessionId;
    setActiveSessionId(session.sessionId);
    setMessages([]);
    setMessagesCursor(null);
    setIsLoadingMessages(true);
    setError(null);
    setRetryDraft(null);
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
    const list = messageListRef.current;
    const oldHeight = list?.scrollHeight ?? 0;
    const oldTop = list?.scrollTop ?? 0;
    setIsLoadingOlderMessages(true);
    setError(null);
    setErrorAction(null);
    try {
      const page = await getChatMessages(sessionId, messagesCursor);
      if (activeSessionRef.current !== sessionId) return;
      preserveScrollRef.current = true;
      setMessages((current) => [...page.items, ...current]);
      setMessagesCursor(page.nextCursor);
      requestAnimationFrame(() => {
        if (list) list.scrollTop = oldTop + list.scrollHeight - oldHeight;
      });
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
    const text = draft.trim();
    if (!text || isSending) return;
    if (text.length > MESSAGE_LIMIT) {
      setError(`Tin nhắn tối đa ${MESSAGE_LIMIT.toLocaleString("vi-VN")} ký tự.`);
      return;
    }

    const submittedSessionId = activeSessionId;
    const clientMessageId = `user-${Date.now()}`;
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
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${now}`,
          role: "assistant",
          kind: "legacy",
          content: reply.answer,
          createdAt: now,
        },
      ]);
      void loadSessions();
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
    requestAnimationFrame(() => {
      const form = document.getElementById("chat-composer");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    });
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
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

  return (
    <section className="relative grid h-[min(760px,calc(100dvh-14.5rem))] min-h-[430px] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]" aria-label="Trợ lý VietFlood">
      <aside className={cn(
        "absolute inset-0 z-20 flex flex-col border-r bg-card transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
        isHistoryOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )} aria-label="Lịch sử hội thoại">
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div>
            <h2 className="font-bold">Cuộc trò chuyện</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Lịch sử được lưu an toàn trên tài khoản</p>
          </div>
          <Button variant="ghost" size="icon" className="size-11 lg:hidden" onClick={() => setIsHistoryOpen(false)} aria-label="Đóng lịch sử">
            <XMarkIcon aria-hidden="true" />
          </Button>
        </div>
        <div className="p-3">
          <Button className="h-11 w-full justify-start" onClick={startNewChat} disabled={isSending}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Cuộc trò chuyện mới
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-busy={isLoadingSessions}>
          {isLoadingSessions ? (
            <div className="space-y-2 px-2 py-3" aria-label="Đang tải lịch sử">
              {[0, 1, 2].map((item) => <div key={item} className="h-[58px] animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-3 py-5 text-sm leading-6 text-muted-foreground">Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((session) => (
                <li key={session.sessionId}>
                  <div className={cn(
                    "group flex min-h-12 items-center gap-1 rounded-xl px-2 transition-colors",
                    activeSessionId === session.sessionId ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  )}>
                    <button type="button" disabled={isSending} className="min-w-0 flex-1 rounded-md py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void openSession(session)} aria-current={activeSessionId === session.sessionId ? "page" : undefined}>
                      <span className="block truncate text-sm font-semibold">{session.title || "Cuộc trò chuyện mới"}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><ClockIcon className="size-3" aria-hidden="true" />{formatSessionDate(session.updatedAt || session.createdAt)}</span>
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 opacity-70 hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => setSessionToDelete(session)} aria-label={`Xóa hội thoại: ${session.title}`}>
                      <TrashIcon aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {sessionsCursor ? (
            <Button variant="ghost" className="mt-2 w-full" onClick={() => void loadSessions(true)} disabled={isLoadingMoreSessions}>
              {isLoadingMoreSessions ? "Đang tải..." : "Tải hội thoại cũ hơn"}
            </Button>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex min-h-[68px] items-center justify-between gap-3 border-b px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="size-11 shrink-0 lg:hidden" onClick={() => setIsHistoryOpen(true)} aria-label="Mở lịch sử hội thoại">
              <Squares2X2Icon aria-hidden="true" />
            </Button>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold sm:text-base">{activeSession?.title || "Trợ lý VietFlood"}</h2>
              <p className="text-xs text-muted-foreground">Hỏi đáp về an toàn lũ và dịch vụ VietFlood</p>
            </div>
          </div>
          {activeSession ? <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">Hội thoại riêng tư</span> : null}
        </header>

        {error ? (
          <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm sm:mx-5" role="alert">
            <p className="min-w-0 flex-1 leading-5">{error}</p>
            {errorAction ? <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={retryError}><ArrowPathIcon className="size-4" aria-hidden="true" />{errorAction === "sessions" ? "Tải lại" : "Thử lại"}</Button> : null}
            {error.includes("đăng nhập") ? <Button asChild size="sm"><Link href="/dang-nhap">Đăng nhập</Link></Button> : null}
            <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-1 size-8 shrink-0" onClick={() => setError(null)} aria-label="Đóng thông báo"><XMarkIcon aria-hidden="true" /></Button>
          </div>
        ) : null}

        <div ref={messageListRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8" aria-label="Tin nhắn hội thoại">
          {activeSessionId && messagesCursor ? (
            <div className="mb-5 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => void loadOlderMessages()} disabled={isLoadingOlderMessages}>
                <ArrowDownIcon className="size-4 rotate-180" aria-hidden="true" />
                {isLoadingOlderMessages ? "Đang tải tin nhắn..." : "Xem tin nhắn cũ hơn"}
              </Button>
            </div>
          ) : null}
          {isLoadingMessages ? (
            <div className="mx-auto mt-10 max-w-xl space-y-4" role="status" aria-label="Đang tải tin nhắn">
              <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
              <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-primary/10 motion-reduce:animate-none" />
              <div className="h-20 w-2/3 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
              <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-7" aria-hidden="true" /></span>
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">Tôi có thể giúp gì cho bạn?</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Hỏi về cách chuẩn bị trước lũ, hướng dẫn an toàn, báo cáo sự cố hoặc trạng thái báo cáo của bạn.</p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
                {STARTER_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => setDraft(prompt)} className="min-h-12 rounded-xl border bg-background px-3 py-2.5 text-left text-sm leading-5 transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{prompt}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5" aria-live="polite" aria-relevant="additions text">
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <article key={message.id} className={cn("flex gap-2.5 sm:gap-3", isUser ? "justify-end" : "justify-start")}>
                    {!isUser ? <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-4" aria-hidden="true" /></span> : null}
                    <div className={cn("max-w-[88%] sm:max-w-[78%]", isUser ? "items-end" : "items-start")}>
                      <div className={cn("rounded-2xl px-4 py-3 text-sm leading-6", isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground")}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p className={cn("mt-1 px-1 text-[11px] text-muted-foreground", isUser ? "text-right" : "text-left")}>
                        {isUser ? "Bạn" : "Trợ lý VietFlood"}{message.createdAt ? ` · ${formatTime(message.createdAt)}` : ""}
                      </p>
                    </div>
                  </article>
                );
              })}
              {isSending ? (
                <div className="flex items-start gap-2.5" role="status" aria-label="Trợ lý đang trả lời">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ChatBubbleLeftRightIcon className="size-4" aria-hidden="true" /></span>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <span className="flex items-center gap-1.5"><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s] motion-reduce:animate-none" /><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s] motion-reduce:animate-none" /><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none" /><span className="sr-only">Trợ lý đang trả lời</span></span>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
          {messages.length === 0 && isSending ? <div ref={bottomRef} /> : null}
        </div>

        <footer className="border-t bg-card px-3 py-3 sm:px-5 sm:py-4">
          <form id="chat-composer" onSubmit={submitMessage} className="mx-auto max-w-3xl">
            <label htmlFor="chat-message" className="sr-only">Tin nhắn của bạn</label>
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
              <textarea
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MESSAGE_LIMIT))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={MESSAGE_LIMIT}
                rows={1}
                placeholder="Nhập câu hỏi của bạn..."
                className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-2 py-2.5 text-base leading-5 outline-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-sm"
                disabled={isSending}
              />
              <Button type="submit" size="icon" className="size-11 shrink-0" disabled={isSending || !draft.trim()} aria-label="Gửi tin nhắn">
                <ArrowDownIcon className="size-5 rotate-[-90deg]" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
              <span>Enter để gửi, Shift + Enter để xuống dòng</span>
              <span aria-live="polite">{draft.length}/{MESSAGE_LIMIT.toLocaleString("vi-VN")}</span>
            </div>
          </form>
        </footer>
      </div>
      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        title="Xóa cuộc trò chuyện?"
        description={<>Tin nhắn trong <strong>{sessionToDelete?.title || "cuộc trò chuyện này"}</strong> sẽ bị xóa vĩnh viễn.</>}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setSessionToDelete(null)}
        confirmLabel="Xóa hội thoại"
        danger
        isConfirming={isDeleting}
      />
    </section>
  );
}
