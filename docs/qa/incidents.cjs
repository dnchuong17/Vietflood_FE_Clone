/* eslint-disable @typescript-eslint/no-require-imports -- Standalone fixture-based browser verification. */
// Runs the real Next UI with explicit fixtures. All external network traffic is blocked.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.QA_WEB_URL || "http://127.0.0.1:3105";
const output = process.env.QA_OUTPUT || "/private/tmp/vietflood-incidents-qa";
fs.mkdirSync(output, { recursive: true });
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
const now = "2026-11-01T10:00:00.000Z";
const sources = [1, 2].map((id) => ({
  id,
  manual: false,
  archived_at: id === 1 ? now : null,
  revisionCount: id === 1 ? 2 : 1,
  snapshot: {
    id,
    description:
      id === 1
        ? "Đường ngập 50 cm, xe chết máy."
        : "duong ngap nuoc, nguoi mac ket",
    ward: "Hải Châu",
    province: "Đà Nẵng",
    addressLine: "12 đường A",
    lat: id === 2 ? 16.048 : 16.047,
    lng: id === 2 ? 108.207 : 108.206,
    createdAt: now,
    images: [],
    evidences: [],
  },
  originalSnapshot: { description: "Ngập ban đầu 30 cm" },
}));
const fact = {
  id: "1:2:0",
  reportId: 1,
  revision: 2,
  kind: "condition",
  text: "Đường ngập 50 cm, xe chết máy.",
  reportedAt: now,
  provenance: "citizen_reported",
};
const incidents = [A, B].map((id, index) => ({
  id,
  title: `Sự cố mẫu ${index ? "B" : "A"}`,
  province: "Đà Nẵng",
  ward: "Hải Châu",
  address: "12 đường A, Hải Châu, Đà Nẵng",
  lat: 16.047,
  lng: 108.206,
  status: "DETECTED",
  severity: "UNKNOWN",
  version: 1,
  evidence_version: 2,
  assignee_id: null,
  reportCount: index ? 1 : 2,
  isUrgent: !index,
  needsVerification: true,
  first_reported_at: now,
  latest_reported_at: now,
  updated_at: now,
  merged_into: null,
}));
let pending = true,
  emergency = true;
const requests = [],
  errors = [],
  checks = [];
const detail = (i) => ({
  ...i,
  summaryStale: false,
  summaryJob: { status: "succeeded", failure_code: null },
  blockedRoadReports: 0,
  strandedPeopleReports: 1,
  strandedVehicleReports: 1,
  facts: [fact],
  summary: {
    title: i.title,
    conditions: [fact],
    updates: [],
    depths: [],
    suggestedSeverity: { value: "MODERATE", provenance: "estimate" },
    recommendations: [
      {
        code: "VERIFY_ON_SITE",
        text: "Xác minh thông tin tại hiện trường khi điều kiện an toàn.",
        requiresHumanDecision: true,
      },
    ],
    generatedAt: now,
  },
});
const list = (items) => ({ items, nextCursor: null });
async function mock(route) {
  const req = route.request(),
    url = new URL(req.url()),
    p = url.pathname;
  const fulfill = (body, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": new URL(base).origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify(body),
    });
  if (p.startsWith("/socket.io")) return route.abort();
  if (
    p.startsWith("/incidents") ||
    p.startsWith("/ai/incidents") ||
    p.startsWith("/auth/") ||
    p === "/reports"
  ) {
    if (req.method() === "OPTIONS") return fulfill({});
    requests.push({
      method: req.method(),
      path: p,
      query: url.search,
      body: req.postData() ? req.postDataJSON() : null,
      key: req.headers()["idempotency-key"],
    });
    if (p === "/auth/profile")
      return fulfill({ id: 1, role: "admin", username: "admin-demo" });
    if (p === "/incidents/overview")
      return fulfill({
        totalReports: 3,
        totalIncidents: incidents.filter((i) => !i.merged_into).length,
        highPriority: 1,
        awaitingVerification: 1,
        recentlyUpdated: 2,
        pendingReviews: pending ? 1 : 0,
        failedJobs: 0,
        queuedJobs: 0,
        mode: "review",
        processingEnabled: true,
      });
    if (p === "/incidents/emergencies")
      return fulfill(
        list(
          emergency
            ? [
                {
                  report_id: 2,
                  revision: 1,
                  incident_id: A,
                  snapshot: sources[1].snapshot,
                },
              ]
            : [],
        ),
      );
    if (p === "/incidents/assignees")
      return fulfill(list([{ id: 2, username: "relief-demo" }]));
    if (p === "/incidents/review")
      return fulfill(
        list(
          pending
            ? [
                {
                  report_id: 3,
                  revision: 1,
                  reason: "suggested_match",
                  snapshot: { ...sources[0].snapshot, id: 3 },
                  candidates: [
                    {
                      incidentId: A,
                      version: incidents[0].version,
                      title: "Sự cố mẫu A",
                      score: 0.92,
                      distanceMeters: 30,
                    },
                  ],
                },
              ]
            : [],
        ),
      );
    if (p === "/incidents/review/3/resolve") {
      pending = false;
      return fulfill({ incidentId: A });
    }
    if (p === "/incidents/merge") {
      incidents[1].merged_into = A;
      incidents[0].version++;
      return fulfill({ incidentId: A });
    }
    if (p === "/incidents")
      return fulfill(list(incidents.filter((i) => !i.merged_into)));
    if (p === "/ai/incidents/process") return fulfill({ jobId: B }, 202);
    if (p.startsWith("/ai/incidents/jobs/"))
      return fulfill({
        id: B,
        status: "succeeded",
        children: [{ status: "succeeded", count: 3 }],
      });
    if (p === "/reports") return fulfill(sources.map((s) => s.snapshot));
    const parts = p.split("/"),
      incident = incidents.find((i) => i.id === parts[2]);
    if (incident) {
      if (req.method() === "PATCH") {
        const body = req.postDataJSON();
        if (parts[3] === "assignment") incident.assignee_id = body.assigneeId;
        else incident[parts[3]] = body[parts[3]];
        incident.version++;
        return fulfill(incident);
      }
      if (parts[3] === "verify") {
        fact.provenance = "verified";
        incident.needsVerification = false;
        incident.version++;
        return fulfill(incident);
      }
      if (parts[3] === "split") return fulfill({ incidentId: B, sourceId: A });
      if (parts[3] === "regenerate-summary") return fulfill({ jobId: B }, 202);
      if (parts[3] === "reports" && parts[5] === "revisions")
        return fulfill(
          list([
            {
              revision: 1,
              snapshot: sources[0].originalSnapshot,
              createdAt: now,
            },
            { revision: 2, snapshot: sources[0].snapshot, createdAt: now },
          ]),
        );
      if (parts[3] === "reports")
        return fulfill(
          parts[4]
            ? sources.find((s) => s.id === Number(parts[4]))
            : list(sources),
        );
      if (parts[3] === "history")
        return fulfill(
          list([
            {
              id: 1,
              action: "incident.detected",
              actor_id: null,
              reason: "",
              created_at: now,
            },
          ]),
        );
      return fulfill(detail(incident));
    }
    return fulfill({ message: "Unhandled fixture route" }, 404);
  }
  if (
    url.origin === new URL(base).origin ||
    ["data:", "blob:"].includes(url.protocol)
  )
    return route.continue();
  return route.abort();
}
function token(role, id) {
  return [
    Buffer.from('{"alg":"none"}').toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub: id,
        username: `${role}-demo`,
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url"),
    "fixture-only",
  ].join(".");
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.QA_CHROME ||
      (fs.existsSync(chromium.executablePath())
        ? chromium.executablePath()
        : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
  });
  let page;
  async function session(role, id, width = 1440) {
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await ctx.route("**/*", mock);
    await ctx.routeWebSocket("**/socket.io/**", (ws) => ws.close());
    await ctx.addInitScript(
      ({ value, origin }) => {
        if (location.origin === origin)
          localStorage.setItem("vietflood_access_token", value);
      },
      { value: token(role, id), origin: new URL(base).origin },
    );
    const tab = await ctx.newPage();
    tab.setDefaultTimeout(20000);
    tab.on("pageerror", (e) => errors.push(e.message));
    return tab;
  }
  async function confirm() {
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Xác nhận", exact: true })
      .click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  }
  try {
    emergency = false;
    page = await session("admin", 1);
    await page.goto(base + "/cuu-tro");
    await page
      .getByRole("link", { name: "Sự cố mẫu A", exact: true })
      .waitFor();
    checks.push("incident overview renders");
    await page.getByText(/Chưa có báo cáo khẩn cấp đang chờ/).waitFor();
    const committedAt = Date.now();
    emergency = true;
    await page
      .getByRole("button", { name: "Xem báo cáo", exact: true })
      .waitFor({ timeout: 5000 });
    const emergencyVisibilityMs = Date.now() - committedAt;
    assert(emergencyVisibilityMs < 5000);
    checks.push("emergency polling displays committed fixture within five seconds with sockets blocked");
    await page
      .getByRole("button", { name: "Xem báo cáo", exact: true })
      .click();
    await page
      .getByText("duong ngap nuoc, nguoi mac ket", { exact: true })
      .waitFor();
    checks.push("emergencies render without clustering");
    await page.getByLabel("Tỉnh / thành phố", { exact: true }).fill("Đà Nẵng");
    await page.getByLabel("Phường / xã", { exact: true }).fill("Hải Châu");
    await page.getByLabel("Từ ngày", { exact: true }).fill("2026-11-01");
    await page.getByLabel("Đến ngày", { exact: true }).fill("2026-11-02");
    await page.locator("#incident-status-filter").click();
    await page.getByRole("option", { name: "Mới phát hiện", exact: true }).click();
    await page.locator("#incident-severity-filter").click();
    await page.getByRole("option", { name: "Chưa đánh giá", exact: true }).click();
    const filtered = page.waitForRequest((r) => {
      const u = new URL(r.url());
      return u.pathname === "/incidents" && u.searchParams.get("province") === "Đà Nẵng";
    });
    await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
    const query = new URL((await filtered).url()).searchParams;
    assert.equal(query.get("ward"), "Hải Châu");
    assert.equal(query.get("status"), "DETECTED");
    assert.equal(query.get("severity"), "UNKNOWN");
    assert.equal(query.get("from"), "2026-10-31T17:00:00.000Z");
    assert.equal(query.get("to"), "2026-11-02T16:59:59.999Z");
    await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
    checks.push("geography date severity and status filters reach the API");
    await page.getByRole("button", { name: /Duyệt ghép nhóm/ }).click();
    await page
      .getByLabel("Lý do quyết định")
      .fill("Cùng một vị trí đã kiểm tra");
    await page.getByRole("button", { name: "Ghép vào sự cố đã chọn" }).click();
    await confirm();
    await page.getByText("Không có báo cáo chờ duyệt ghép nhóm.").waitFor();
    assert(
      requests.some(
        (r) =>
          r.path === "/incidents/review/3/resolve" &&
          r.key &&
          r.body.expectedRevision === 1,
      ),
    );
    checks.push("review confirmation uses version and idempotency key");
    await page.goto(base + "/su-co/" + A);
    await page.getByRole("heading", { name: "Tóm tắt có dẫn chứng" }).waitFor();
    await page.getByText("Các phiên bản đã lưu (2)").click();
    await page.getByText("Ngập ban đầu 30 cm", { exact: true }).waitFor();
    checks.push("archived originals and revisions accessible");
    const map = page.getByTitle("Bản đồ tương tác Windy");
    assert.equal(new URL(await map.getAttribute("src")).searchParams.get("lat"), "16.047");
    const locate = page.locator("#report-2").getByRole("button", { name: "Xem vị trí báo cáo" });
    await locate.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector('iframe[title="Bản đồ tương tác Windy"]').src.includes("lat=16.048"));
    assert.equal(new URL(await map.getAttribute("src")).searchParams.get("lon"), "108.207");
    checks.push("keyboard report selection updates representative map coordinates");
    await page
      .getByLabel("Lý do / căn cứ cho thao tác")
      .fill("Đã đối chiếu tại hiện trường");
    await page.locator("#incident-severity").click();
    await page.getByRole("option", { name: "Cao", exact: true }).click();
    await page.getByRole("button", { name: "Lưu mức độ", exact: true }).click();
    await confirm();
    assert.equal(incidents[0].severity, "HIGH");
    checks.push("manual severity update");
    await page.locator("#incident-assignee").click();
    await page
      .getByRole("option", { name: "relief-demo (#2)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lưu phân công", exact: true })
      .click();
    await confirm();
    assert.equal(incidents[0].assignee_id, 2);
    assert.equal(incidents[0].status, "DETECTED");
    checks.push("assignment does not deploy rescue");
    await page
      .getByRole("button", { name: "Ghi nhận xác minh", exact: true })
      .click();
    await confirm();
    checks.push("verification requires a confirmation");
    await page
      .getByRole("checkbox", { name: "Chọn báo cáo 2", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Tách báo cáo đã chọn (1)" })
      .click();
    await confirm();
    assert(
      requests.some(
        (r) => r.path.endsWith("/split") && r.body.reportIds[0] === 2,
      ),
    );
    checks.push("split submits selected originals");
    await page.locator("#merge-source").click();
    await page
      .getByRole("option", { name: "Sự cố mẫu B", exact: true })
      .click();
    await page.getByRole("button", { name: "Ghép và giữ sự cố này" }).click();
    await confirm();
    assert(
      requests.some(
        (r) => r.path === "/incidents/merge" && r.body.targetId === A,
      ),
    );
    checks.push("merge identifies survivor and source versions");
    await page.screenshot({
      path: output + "/incident-desktop.png",
      fullPage: true,
    });
    const mobile = await session("relief", 2, 390);
    await mobile.goto(base + "/su-co/" + A);
    await mobile.getByRole("heading", { name: "Quyết định xử lý" }).waitFor();
    assert.equal(
      await mobile.getByRole("button", { name: "Ghi nhận xác minh" }).count(),
      0,
    );
    assert(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await mobile.screenshot({
      path: output + "/incident-mobile.png",
      fullPage: true,
    });
    checks.push("assigned relief controls and mobile layout");
    const assignmentRequest = mobile.waitForRequest((r) => {
      const u = new URL(r.url());
      return u.pathname === "/incidents" && u.searchParams.get("assignedToMe") === "true";
    });
    await mobile.goto(base + "/phan-cong");
    await assignmentRequest;
    await mobile.getByRole("link", { name: "Sự cố mẫu A", exact: true }).waitFor();
    checks.push("relief assignment workspace requests real assigned incidents");
    const unassigned = await session("relief", 4, 768);
    await unassigned.goto(base + "/su-co/" + A);
    await unassigned
      .getByRole("heading", { name: "Tóm tắt có dẫn chứng" })
      .waitFor();
    assert.equal(
      await unassigned
        .getByRole("heading", { name: "Quyết định xử lý" })
        .count(),
      0,
    );
    checks.push("unassigned relief controls hidden");
    const citizen = await session("citizen", 3);
    await citizen.goto(base + "/su-co/" + A);
    await citizen.waitForURL("**/trang-chu");
    checks.push("citizen incident route redirects");
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      output + "/results.json",
      JSON.stringify(
        {
          checks,
          emergencyVisibilityMs,
          errors,
          requests,
          network:
            "All external traffic intercepted or blocked; fixture API only",
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ passed: checks.length, emergencyVisibilityMs, checks, output }, null, 2),
    );
  } catch (error) {
    if (page)
      await page
        .screenshot({ path: output + "/failure.png", fullPage: true })
        .catch(() => {});
    fs.writeFileSync(
      output + "/failure.json",
      JSON.stringify({ error: String(error), errors, requests }, null, 2),
    );
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
