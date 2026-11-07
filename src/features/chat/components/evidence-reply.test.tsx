import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ChatMessage, ChatSource } from "@/features/chat/api/chat";
import { EvidenceReply } from "./evidence-reply";

const source: ChatSource = { id: "p1", citation: 1, documentId: "E01", version: 2, title: "Nguồn", sectionPath: ["Chuẩn bị"], sourceUrl: "https://example.com/source", snapshotUrl: "/chat/sources/E01/versions/2", chunkHash: "hash" };
const message: ChatMessage = { id: "1", role: "assistant", kind: "knowledge", content: "Chuẩn bị nước sạch [1]", createdAt: null, sourceSupportPercent: 100, sources: [source] };
const render = (overrides: Partial<ChatMessage> = {}) => renderToStaticMarkup(<EvidenceReply message={{ ...message, ...overrides }} />);

it("renders accessible versioned inline citations, compact expandable provenance, and support disclaimer", () => {
  const html = render();
  expect(html).toContain('/tro-ly/nguon/E01/2');
  expect(html).toContain('aria-label="Nguồn 1: Nguồn"');
  expect(html).toContain('https://example.com/source');
  expect(html).toContain('<details>');
  expect(html).toContain('<summary');
  expect(html).toContain('Nguồn tham khảo · 1');
  expect(html).toContain('Phiên bản 2 · Chuẩn bị');
  expect(html).toContain('100%');
  expect(html).toContain('không phải xác suất câu trả lời đúng');
});

it.each(["javascript:alert(1)", "data:text/html,unsafe", "file:///secret", "//example.com", "/local/path"])("does not link non-HTTP original URL %s", (sourceUrl) => {
  const html = render({ sources: [{ ...source, sourceUrl }] });
  expect(html).not.toContain('Mở website nguồn gốc');
  expect(html).toContain('/tro-ly/nguon/E01/2');
});

it("escapes source and answer text, encodes document IDs, and leaves unmatched references as text", () => {
  const html = render({ content: '<script>alert(1)</script> [1] [9]', sources: [{ ...source, documentId: "doc/id?", title: "<img>", sectionPath: ["<script>"] }] });
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('/tro-ly/nguon/doc%2Fid%3F/2');
  expect(html).toContain('<span>[9]</span>');
});

it("does not show source claims or percentages for an assistant notice without sources", () => {
  const html = render({ kind: "fallback", content: "Không có kiến thức.", sources: [] });
  expect(html).not.toContain('%');
  expect(html).not.toContain('Nguồn tham khảo');
});

it("keeps zero support distinct from absent support", () => {
  expect(render({ sourceSupportPercent: 0 })).toContain('0%');
  expect(render({ sourceSupportPercent: undefined })).not.toContain('%');
});

it("does not attach assistant warnings, sources or unanswered parts to user text", () => {
  const html = render({ role: "user", status: "unavailable", unansweredParts: ["Không phải nội dung người dùng"] });
  expect(html).not.toContain('<details');
  expect(html).not.toContain('role="status"');
  expect(html).not.toContain('<a');
});

describe("actual API status and knowledge gaps", () => {
  it.each([
    ["partial", "Câu trả lời chưa đầy đủ"],
    ["unavailable", "Nguồn trả lời tạm thời không khả dụng"],
    ["no_knowledge", "Chưa có nguồn kiến thức phù hợp"],
    ["unsupported_dynamic", "Không hỗ trợ thông tin cập nhật tức thời"],
    ["needs_clarification", "Cần thêm thông tin để trả lời"],
  ] as const)("shows %s visibly, outside collapsed provenance", (status, label) => {
    const html = render({ status });
    expect(html).toContain(`role="status"`);
    expect(html.indexOf(label)).toBeLessThan(html.indexOf('<details>'));
  });
  it("does not invent warnings on answered or legacy messages", () => {
    expect(render({ status: "answered" })).not.toContain('role="status"');
    expect(render({ status: undefined })).not.toContain('role="status"');
  });
  it("discloses only returned unanswered content accessibly and escapes it", () => {
    const html = render({ unansweredParts: ["Mực nước hiện tại", "<script>unsafe</script>"] });
    expect(html).toContain('Phần chưa được trả lời');
    expect(html).toContain('Mực nước hiện tại');
    expect(html).toContain('&lt;script&gt;unsafe&lt;/script&gt;');
    expect(render({ unansweredParts: [] })).not.toContain('Phần chưa được trả lời');
  });
});
