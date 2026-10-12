import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { EvidenceReply } from "./evidence-reply";

it("renders clickable versioned citations and explicitly distinguishes support from correctness", () => {
  const html = renderToStaticMarkup(<EvidenceReply message={{ id:"1",role:"assistant",kind:"knowledge",content:"Chuẩn bị nước sạch [1]",createdAt:null,sourceSupportPercent:100,sources:[{id:"p1",citation:1,documentId:"E01",version:2,title:"Nguồn",sectionPath:["Chuẩn bị"],sourceUrl:"https://example.com/source",snapshotUrl:"/chat/sources/E01/versions/2",chunkHash:"hash"}] }} />);
  expect(html).toContain('/tro-ly/nguon/E01/2'); expect(html).toContain('https://example.com/source'); expect(html).toContain('không phải xác suất');
});
it("escapes evidence text and does not render unsafe original source URLs", () => {
  const html = renderToStaticMarkup(<EvidenceReply message={{id:"1",role:"assistant",kind:"knowledge",content:"<script>alert(1)</script> [1]",createdAt:null,sources:[{id:"p1",citation:1,documentId:"E01",version:1,title:"<img>",sectionPath:[],sourceUrl:"javascript:alert(1)",snapshotUrl:"source",chunkHash:"hash"}]}} />);
  expect(html).not.toContain('<script>');expect(html).not.toContain('href="javascript:');expect(html).toContain('&lt;script&gt;');
});
it("does not show support percentage for a system notice without sources", () => {
  const html = renderToStaticMarkup(<EvidenceReply message={{id:"1",role:"assistant",kind:"fallback",content:"Không có kiến thức.",createdAt:null,sources:[]}} />);
  expect(html).not.toContain('%');
});
