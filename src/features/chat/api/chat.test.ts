import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.fn();

vi.mock("@/features/auth/lib/api-client", () => ({
  apiRequest,
  apiPath: (path: string) => `https://api.test${path}`,
}));

describe("chat API contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a regular chat turn with the legacy-compatible request shape", async () => {
    const payload = { answer: "Theo hướng dẫn đã duyệt.", sessionId: "session-1" };
    apiRequest.mockResolvedValue(Response.json(payload));
    const { sendChatMessage } = await import("./chat");

    await expect(sendChatMessage("Tôi cần chuẩn bị gì?", "session-1")).resolves.toEqual(payload);
    expect(apiRequest).toHaveBeenCalledWith("https://api.test/chat", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "Tôi cần chuẩn bị gì?", sessionId: "session-1" }),
    }));
  });

  it.each(["confirm", "cancel"] as const)(
    "sends an explicit %s decision with the pending action ID",
    async (actionDecision) => {
      const payload = {
        answer: actionDecision === "confirm" ? "Đã cập nhật báo cáo." : "Đã hủy thao tác.",
        sessionId: "session-1",
        action: { id: "action-1", status: actionDecision === "confirm" ? "completed" : "cancelled" },
      };
      apiRequest.mockResolvedValue(Response.json(payload));
      const { sendChatMessage } = await import("./chat");

      await expect(sendChatMessage("Xác nhận thao tác", "session-1", {
        actionId: "action-1", actionDecision,
      })).resolves.toEqual(payload);
      expect(apiRequest).toHaveBeenCalledWith("https://api.test/chat", expect.objectContaining({
        body: JSON.stringify({
          message: "Xác nhận thao tác", sessionId: "session-1",
          actionId: "action-1", actionDecision,
        }),
      }));
    },
  );

  it("decodes paginated history, nullable timestamps and a restored pending action", async () => {
    const payload = {
      session: { sessionId: "session-1", title: "Báo cáo", createdAt: null, updatedAt: "2026-10-09T00:00:00Z" },
      items: [{ id: "message-1", role: "assistant", kind: "action", content: "Xem lại trước khi thực hiện", createdAt: null }],
      nextCursor: null,
      pendingAction: { id: "action-1", status: "awaiting_confirmation" },
    };
    apiRequest.mockResolvedValue(Response.json(payload));
    const { getChatMessages } = await import("./chat");

    await expect(getChatMessages("session-1")).resolves.toEqual(payload);
    expect(apiRequest).toHaveBeenCalledWith(
      "https://api.test/chat/sessions/session-1/messages?limit=20",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("preserves server status and validation messages on API errors", async () => {
    apiRequest.mockResolvedValue(new Response(JSON.stringify({ message: ["actionId is invalid", "actionDecision is required"] }), {
      status: 400, headers: { "Content-Type": "application/json" },
    }));
    const { sendChatMessage } = await import("./chat");

    await expect(sendChatMessage("Xác nhận", "session-1", {
      actionId: "invalid", actionDecision: "confirm",
    })).rejects.toMatchObject({
      name: "ChatApiError", statusCode: 400,
      message: "actionId is invalid actionDecision is required",
    });
  });
});
