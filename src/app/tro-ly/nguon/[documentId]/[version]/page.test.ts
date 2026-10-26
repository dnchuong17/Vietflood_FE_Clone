import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("saved source route", () => {
  it("mounts document loading behind the shared authenticated shell", () => {
    expect(source).toContain('<AppShell title="Tài liệu nguồn"><SourceDocument /></AppShell>');
    const page = source.slice(source.indexOf("export default function SourcePage"));
    expect(page).not.toContain("getSourceSnapshot(");
    expect(source).toContain("<SiteHeader />");
  });

  it("validates the original route identifiers before requesting a snapshot", () => {
    expect(source).toContain("Number.isSafeInteger(parsedVersion)");
    expect(source.indexOf("Number.isSafeInteger(parsedVersion)")).toBeLessThan(source.indexOf("getSourceSnapshot(documentId, parsedVersion)"));
    expect(source).toContain("Mã tài liệu hoặc phiên bản không hợp lệ.");
  });

  it("provides persistent errors, retry, archived labels and safe external links", () => {
    expect(source).toContain('role="alert"');
    expect(source).toContain("Thử tải lại nguồn");
    expect(source).toContain("source.active === false");
    expect(source).toContain('["https:", "http:"].includes(url.protocol)');
    expect(source).toContain('rel="noopener noreferrer"');
  });
});
