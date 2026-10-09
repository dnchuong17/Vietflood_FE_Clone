import {
  apiPath,
  apiRequest,
} from "@/features/auth/lib/api-client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "knowledge" | "first_aid" | "report_guide" | "report_status" | "community_reports" | "small_talk" | "action" | "fallback" | "legacy";
  content: string;
  createdAt: string | null;
};

export type ChatAction = {
  id: string;
  status: "collecting" | "awaiting_confirmation" | "completed" | "cancelled";
};

export type ChatSession = {
  sessionId: string;
  title: string;
  createdAt: string | null;
  updatedAt: string;
};

export type ChatPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ChatMessagesPage = ChatPage<ChatMessage> & {
  session: ChatSession;
  pendingAction?: ChatAction | null;
};

export type ChatReply = { answer: string; sessionId: string; action?: ChatAction };

export class ChatApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ChatApiError";
    this.statusCode = statusCode;
  }
}

async function requestJson<T>(path: string, fallback: string): Promise<T> {
  const response = await apiRequest(apiPath(path), {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message || fallback;
    throw new ChatApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function getChatSessions(cursor?: string): Promise<ChatPage<ChatSession>> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  return requestJson(`/chat/sessions?${params.toString()}`, "Không tải được lịch sử hội thoại.");
}

export async function getChatMessages(
  sessionId: string,
  cursor?: string,
): Promise<ChatMessagesPage> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  return requestJson(
    `/chat/sessions/${encodeURIComponent(sessionId)}/messages?${params.toString()}`,
    "Không tải được tin nhắn.",
  );
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  decision?: { actionId: string; actionDecision: "confirm" | "cancel" },
): Promise<ChatReply> {
  const response = await apiRequest(apiPath("/chat"), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({ message, ...(sessionId ? { sessionId } : {}), ...decision }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const messageText = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message || "Không gửi được tin nhắn.";
    throw new ChatApiError(response.status, messageText);
  }
  return response.json() as Promise<ChatReply>;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await apiRequest(
    apiPath(`/chat/sessions/${encodeURIComponent(sessionId)}`),
    { method: "DELETE", cache: "no-store" },
  );
  if (response.status === 204) return;
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message || "Không thể xóa hội thoại.";
    throw new ChatApiError(response.status, message);
  }
}
