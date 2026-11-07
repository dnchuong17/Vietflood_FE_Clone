/* eslint-disable @typescript-eslint/no-require-imports -- Standalone fixture-backed browser runner. */
// ALL API data is explicitly synthetic QA data. No production API request is allowed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('UI fixtures require a localhost app.');
const out = process.env.QA_CHAT_OUTPUT || path.join(os.homedir(), '.hermes/cache/scratch/vietflood-enterprise-chat-web');
fs.mkdirSync(out, { recursive: true });
const now = new Date().toISOString();
const profile = { id: 991, username: 'qa-chat-only', role: 'citizen', first_name: 'QA', last_name: 'Fixture', email: 'qa@example.invalid' };
const token = [Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ ...profile, sub: profile.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'qa-ui-not-a-real-token'].join('.');
const titles = { knowledge: 'QA — An toàn trước lũ', collecting: 'QA — Bản nháp báo cáo', review: 'QA — Chờ xác nhận báo cáo' };
const sources = [1, 2, 3].map(n => ({ id: `qa-source-${n}`, citation: n, documentId: `qa-doc-${n}`, version: 1, title: `QA — Tài liệu tham khảo ${n}`, sectionPath: ['Dữ liệu kiểm thử giao diện'], sourceUrl: 'https://example.invalid/qa-source', snapshotUrl: `/chat/sources/qa-doc-${n}/versions/1`, chunkHash: `qa-fixture-hash-${n}` }));
const longAnswer = 'DỮ LIỆU KIỂM THỬ GIAO DIỆN — KHÔNG PHẢI HƯỚNG DẪN KHẨN CẤP.\n\n' + ('Đoạn văn giả lập để kiểm tra khả năng đọc, xuống dòng và cuộn trong hội thoại dài. [1]\n\n'.repeat(14));
const results = [];
const audits = [];
const pageErrors = [];
const consoleErrors = [];
const blocked = new Set();
let activePage;
async function check(name, fn) {
  try { const detail = await fn(); results.push({ name, status: 'passed', detail }); }
  catch (error) {
    const file = `failure-${results.length}`;
    if (activePage) await activePage.screenshot({ path: path.join(out, `${file}.png`), fullPage: true }).catch(() => {});
    results.push({ name, status: 'failed', error: error.message, screenshot: `${file}.png` });
  }
}
async function configure(context, theme) {
  const sessions = Object.entries(titles).map(([key, title]) => ({ sessionId: `qa-${key}`, title, createdAt: now, updatedAt: now }));
  const requests = [];
  await context.addCookies([{ name: 'vietflood_access_token', value: token, url: base }]);
  await context.addInitScript(({ mode, appOrigin }) => {
    if (location.origin === appOrigin) localStorage.setItem('theme', mode);
  }, { mode: theme, appOrigin: origin });
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(body) });
  await context.route('**/*', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const api = (url.hostname === '127.0.0.1' && url.port === '4310') || url.origin === 'https://vietflood-api.ndtd.indevs.in';
    if (api) {
      const p = url.pathname;
      requests.push({ method: req.method(), path: p });
      if (req.method() === 'OPTIONS') return json(route, {});
      if (p === '/auth/profile') return json(route, profile);
      if (p === '/auth/refresh_token') return json(route, { accessToken: token, refresh_token: 'qa-only' });
      if (p === '/chat/sessions') return json(route, { items: sessions, nextCursor: null });
      const messageMatch = /^\/chat\/sessions\/qa-(knowledge|collecting|review)\/messages$/.exec(p);
      if (messageMatch) {
        const key = messageMatch[1];
        const session = sessions.find(item => item.sessionId === `qa-${key}`);
        const content = key === 'knowledge' ? longAnswer : key === 'collecting' ? 'QA TEST — Vui lòng bổ sung phường/xã. Đây là bản nháp giả lập, chưa có báo cáo thật.' : 'QA TEST — Bản xem trước giả lập: ngập lụt; địa chỉ kiểm thử; không khẩn cấp. Chưa gửi báo cáo.';
        const pendingAction = key === 'knowledge' ? null : { id: `qa-action-${key}`, intent: 'create_report', status: key === 'collecting' ? 'collecting' : 'awaiting_confirmation' };
        return json(route, { session, items: [{ id: `qa-message-${key}`, role: 'assistant', kind: key === 'knowledge' ? 'knowledge' : 'action', content, createdAt: now, ...(key === 'knowledge' ? { status: 'partial', sources, sourceSupportPercent: 85, unansweredParts: ['QA — Nội dung chưa có nguồn đối chiếu.'] } : {}) }], nextCursor: null, pendingAction });
      }
      if (/^\/chat\/sources\/qa-doc-[123]\/versions\/1$/.test(p)) return json(route, { documentId: p.split('/')[3], version: 1, title: 'QA archived source', text: 'QA archived source — not real emergency guidance.', sourceUrl: 'javascript:invalid-fixture', active: false });
      if (p === '/chat' && req.method() === 'POST') {
        const body = req.postDataJSON();
        assert.equal(body.actionDecision, undefined, 'This QA run must stop before confirmation.');
        return json(route, { answer: 'QA — Dịch vụ tạo câu trả lời không khả dụng. Bản nháp chưa được gửi.', sessionId: 'qa-unavailable', status: 'unavailable', generationMode: 'system_notice', sources: [] });
      }
      return json(route, { message: `Unimplemented QA endpoint: ${p}` }, 404);
    }
    if (url.hostname === 'provinces.open-api.vn') return json(route, []);
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    blocked.add(url.origin);
    return route.abort('blockedbyclient');
  });
  context.on('page', page => {
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  });
  audits.push({ theme, requests });
  return requests;
}
async function openHistory(page, width) {
  if (width < 1024) await page.getByRole('button', { name: 'Mở lịch sử hội thoại', exact: true }).click();
  const search = page.locator('[data-testid="chat-history-search"]:visible');
  await search.waitFor();
  return search;
}
async function selectSession(page, width, title) {
  const search = await openHistory(page, width);
  await search.fill('');
  await page.locator('button:visible').filter({ hasText: title }).first().click();
}
async function assertLayout(page) {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert(size.scroll <= size.client + 1, `Horizontal overflow: ${JSON.stringify(size)}`);
  const input = await page.locator('#chat-message').boundingBox();
  const send = await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).boundingBox();
  assert(input && input.height >= 40 && input.height <= 160, `Composer input is not compact: ${JSON.stringify(input)}`);
  assert(send && send.width >= 44 && send.height >= 44, `Send target too small: ${JSON.stringify(send)}`);
  return { ...size, composer: input, send };
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const theme of ['light', 'dark']) for (const width of [1440, 390]) {
      const label = `${theme}-${width}`;
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', colorScheme: theme });
      const requests = await configure(context, theme);
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(15000);
      await page.goto(base + '/chat', { waitUntil: 'networkidle', timeout: 60000 });
      await check(`${label}: empty workspace and compact composer`, async () => {
        await page.getByRole('heading', { name: 'Trợ lý VietFlood', exact: true }).waitFor();
        await page.getByTestId('chat-prompt-create-report').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme === 'dark');
        const dimensions = await assertLayout(page);
        await page.screenshot({ path: path.join(out, `${label}-empty.png`), fullPage: true });
        return dimensions;
      });
      await check(`${label}: quick prompt fills draft without an API send`, async () => {
        const before = requests.filter(r => r.method === 'POST').length;
        await page.getByTestId('chat-prompt-create-report').click();
        assert.equal(await page.locator('#chat-message').inputValue(), 'Tạo báo cáo ngập lụt');
        assert.equal(requests.filter(r => r.method === 'POST').length, before);
        await page.locator('#chat-message').fill('');
      });
      await check(`${label}: history search filters actual loaded sessions`, async () => {
        const search = await openHistory(page, width);
        await search.fill('zz-no-matching-qa-session');
        assert.equal(await page.locator('button:visible').filter({ hasText: titles.knowledge }).count(), 0);
        await search.fill('An toàn');
        await page.locator('button:visible').filter({ hasText: titles.knowledge }).first().click();
        await page.getByText('DỮ LIỆU KIỂM THỬ GIAO DIỆN', { exact: false }).first().waitFor();
        await page.screenshot({ path: path.join(out, `${label}-conversation.png`), fullPage: true });
      });
      await check(`${label}: citations open the authenticated archived version`, async () => {
        const link = page.getByRole('link', { name: 'Nguồn 1: QA — Tài liệu tham khảo 1', exact: true }).first();
        assert((await link.getAttribute('href')).endsWith('/tro-ly/nguon/qa-doc-1/1'));
        const opened = context.waitForEvent('page');
        await link.click();
        const sourcePage = await opened;
        await sourcePage.getByText('QA archived source — not real emergency guidance.', { exact: true }).waitFor();
        assert.equal(await sourcePage.locator('a[href^="javascript:"]').count(), 0);
        await sourcePage.close();
      });
      await check(`${label}: collecting state is distinct from confirmation`, async () => {
        await selectSession(page, width, titles.collecting);
        await page.getByText('QA TEST — Vui lòng bổ sung phường/xã.', { exact: false }).waitFor();
        await page.getByTestId('chat-report-task').waitFor();
        assert.equal(await page.getByRole('button', { name: /^Xác nhận/ }).count(), 0);
        await page.screenshot({ path: path.join(out, `${label}-collecting.png`), fullPage: true });
      });
      await check(`${label}: review and image attachment stop before submission`, async () => {
        await selectSession(page, width, titles.review);
        await page.getByText('QA TEST — Bản xem trước giả lập:', { exact: false }).waitFor();
        await page.getByRole('button', { name: /^Xác nhận/ }).waitFor();
        const before = requests.filter(r => r.method === 'POST').length;
        await page.getByLabel('Chọn ảnh minh chứng', { exact: true }).setInputFiles({ name: 'qa-ui.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6z8AAAAASUVORK5CYII=', 'base64') });
        await page.getByText('qa-ui.png', { exact: true }).waitFor();
        assert.equal(requests.filter(r => r.method === 'POST').length, before);
        const dimensions = await assertLayout(page);
        const task = await page.getByTestId('chat-report-task').boundingBox();
        const confirm = await page.getByRole('button', { name: /^Xác nhận/ }).boundingBox();
        assert(task && confirm && confirm.y >= task.y && confirm.y + confirm.height <= task.y + task.height, `Confirmation is clipped by task card: ${JSON.stringify({ task, confirm })}`);
        await page.screenshot({ path: path.join(out, `${label}-review.png`), fullPage: true });
        return dimensions;
      });
      await check(`${label}: unavailable state remains visible and does not claim success`, async () => {
        if (width < 1024) await openHistory(page, width);
        await page.locator('[data-testid="chat-new-conversation"]:visible').first().click();
        await page.locator('#chat-message').fill('QA unavailable response check');
        await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
        await page.getByText('QA — Dịch vụ tạo câu trả lời không khả dụng. Bản nháp chưa được gửi.', { exact: true }).waitFor();
        await page.getByText('Nguồn trả lời tạm thời không khả dụng', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: /^Xác nhận/ }).count(), 0);
        await page.screenshot({ path: path.join(out, `${label}-unavailable.png`), fullPage: true });
      });
      await context.close();
    }
    await check('no uncaught browser exceptions', async () => { assert.deepEqual(pageErrors, []); });
  } finally {
    await browser.close();
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const report = { evidenceType: 'Explicitly synthetic fixture-backed Chrome UI checks; NOT live backend evidence', passed, failed, total: results.length, results, audits, pageErrors, consoleErrors, blockedExternalOrigins: [...blocked] };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed, failed, total: results.length, output: out }, null, 2));
    if (failed) { console.log(results.filter(r => r.status === 'failed')); process.exitCode = 1; }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
