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

  it("sends optional GPS and evidence as multipart only on confirmation", async () => {
    const payload = { answer: "Đã tạo báo cáo.", sessionId: "session-1" };
    apiRequest.mockResolvedValue(Response.json(payload));
    const { sendChatMessage } = await import("./chat");
    const image = new File(["evidence"], "evidence.png", { type: "image/png" });

    await expect(sendChatMessage("Xác nhận tạo báo cáo", "session-1", {
      actionId: "action-1", actionDecision: "confirm",
    }, { latitude: 16.05, longitude: 108.2, files: [image] })).resolves.toEqual(payload);
    const request = apiRequest.mock.calls.at(-1)?.[1] as RequestInit;
    expect(request.headers).not.toHaveProperty("Content-Type");
    expect(request.body).toBeInstanceOf(FormData);
    const form = request.body as FormData;
    expect(form.get("latitude")).toBe("16.05");
    expect(form.get("longitude")).toBe("108.2");
    expect(form.get("actionDecision")).toBe("confirm");
    expect(form.get("files")).toBe(image);
  });

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
