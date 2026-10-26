/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS runner supports optional Playwright via NODE_PATH. */

/* Isolated UI smoke test. All API responses below are explicit TEST FIXTURES.
 * No production API calls are allowed. This is not live-backend evidence.
 * NODE_PATH=<directory containing playwright> node docs/qa/web-smoke.cjs
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3100';
const out = process.env.QA_OUTPUT || path.join(__dirname, 'evidence');
fs.mkdirSync(out, { recursive: true });
const now = new Date().toISOString();
const session = { sessionId: 'qa-session', title: 'QA fixture conversation', createdAt: now, updatedAt: now };
const source = { id: 'qa-source', citation: 1, documentId: 'qa-doc', version: 1, title: 'QA fixture source', sectionPath: ['QA'], sourceUrl: 'https://example.invalid/qa-source', snapshotUrl: '/chat/sources/qa-doc/versions/1', chunkHash: 'qa-not-a-real-document' };
const results = [];
const requests = [];
const external = new Set();
const profile = role => ({ id: 1, username: `qa-${role}`, role, first_name: 'QA', last_name: 'Tester', email: 'qa@example.invalid', phone: '0900000000', province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu', address_line: 'QA fixture address' });
const token = role => [Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ ...profile(role), sub: 1, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'qa-test-only'].join('.');
const reports = [{ id: 101, userId: 1, user: profile('citizen'), category: ['flood'], description: 'QA fixture: flooded street', province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu', addressLine: 'QA fixture address', lat: 16.0471, lng: 108.2062, status: 'pending', isUrgent: true, severity: 3, createdAt: now, evidences: [] }];
function multipartField(req, name) {
  const body = req.postDataBuffer()?.toString('utf8') || '';
  return body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`))?.[1];
}
let activeRole = 'citizen';
let sessions = [session];
let chatMessages = [];
let apiFailure = false;
let activePage;
function apiResponse(route, data, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(data) });
}
async function mock(route) {
  const req = route.request();
  const url = new URL(req.url());
  if ((url.hostname === '127.0.0.1' && url.port === '4310') || url.origin === (process.env.QA_API_ORIGIN || 'https://vietflood-api.ndtd.indevs.in')) {
    const p = url.pathname;
    requests.push({ method: req.method(), path: p });
    if (req.method() === 'OPTIONS') return apiResponse(route, {});
    if (apiFailure) return apiResponse(route, { message: 'QA fixture service unavailable' }, 503);
    if (p === '/auth/sign_in' || p === '/auth/refresh_token') return apiResponse(route, { accessToken: token(activeRole), refresh_token: 'qa-refresh-test-only' });
    if (p === '/auth/profile') return apiResponse(route, profile(activeRole));
    if (p === '/auth/all' || p === '/auth/relief/users') return apiResponse(route, [profile('citizen'), { ...profile('relief'), id: 2 }]);
    if (p === '/auth/register') return apiResponse(route, 'QA fixture registration accepted', 201);
    if (p === '/auth/update' || p.startsWith('/auth/update/user/')) return apiResponse(route, { message: 'QA fixture update acknowledged' });
    if (p === '/reports' || p === '/reports/user' || /^\/reports\/\d+$/.test(p)) return apiResponse(route, reports);
    if (p === '/reports/create') {
      const created = { ...reports[0], id: 102, description: multipartField(req, 'description'), status: 'pending', isUrgent: false };
      reports.push(created);
      return apiResponse(route, { report: created }, 201);
    }
    if (/^\/reports\/\d+\/status$/.test(p)) {
      const target = reports.find(r => r.id === Number(p.split('/')[2]));
      if (target) target.status = req.postDataJSON().status;
      return apiResponse(route, { reportId: target?.id, status: target?.status });
    }
    if (p.startsWith('/reports/update/') || p.startsWith('/reports/relief/')) {
      const target = reports.find(r => r.id === Number(p.split('/')[3]));
      if (target) target.description = multipartField(req, 'description');
      return apiResponse(route, { report: target });
    }
    if (p === '/chat/sessions') return apiResponse(route, { items: sessions, nextCursor: null });
    if (p === '/chat/sessions/qa-session' && req.method() === 'DELETE') { sessions = []; return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true' } }); }
    if (p === '/chat/sessions/qa-session/messages') return apiResponse(route, { session, items: chatMessages, nextCursor: null, pendingAction: null });
    if (p === '/chat/sources/qa-doc/versions/1') return apiResponse(route, { documentId: 'qa-doc', version: 1, title: source.title, text: 'QA fixture archived source text. Not real emergency guidance.', sourceUrl: source.sourceUrl, active: false });
    if (p === '/chat' && req.method() === 'POST') {
      const payload = req.postDataJSON();
      const answer = 'QA fixture response: this verifies rendering, not emergency advice.';
      chatMessages.push({ id: 'qa-user', role: 'user', kind: 'knowledge', content: payload.message, createdAt: now }, { id: 'qa-assistant', role: 'assistant', kind: 'knowledge', content: answer, createdAt: now, status: 'answered', sources: [source], sourceSupportPercent: 90, generationMode: 'grounded_synthesis' });
      return apiResponse(route, { answer, sessionId: session.sessionId, status: 'answered', sources: [source], sourceSupportPercent: 90, generationMode: 'grounded_synthesis' });
    }
    if (p === '/locations/geocode' || p === '/locations/reverse') return apiResponse(route, { coordinates: { lat: 16.0471, lng: 108.2062 }, province: { code: 48, name: 'Thành phố Đà Nẵng' }, ward: { code: 20194, name: 'Phường Hải Châu', provinceCode: 48 }, addressLine: 'QA fixture address', displayName: 'QA fixture address', matchLevel: 'ward', attribution: { provider: 'QA fixture', license: 'Test only', url: 'https://example.invalid' } });
    return apiResponse(route, { message: `Unhandled QA fixture endpoint: ${p}` }, 404);
  }
  if (url.hostname === 'provinces.open-api.vn') return apiResponse(route, url.pathname.includes('/w/') ? [{ code: 20194, name: 'Phường Hải Châu', province_code: 48 }] : [{ code: 48, name: 'Thành phố Đà Nẵng' }]);
  if (url.origin === new URL(base).origin || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
  external.add(url.origin);
  return route.abort('blockedbyclient');
}
async function check(name, fn) {
  if (process.env.QA_FILTER && !new RegExp(process.env.QA_FILTER).test(name)) return;
  try { const details = await fn(); results.push({ name, status: 'passed', details }); }
  catch (error) {
    const file = `failure-${results.length}`;
    if (activePage) {
      await activePage.screenshot({ path: path.join(out, file + '.png'), fullPage: true }).catch(() => {});
      fs.writeFileSync(path.join(out, file + '.txt'), await activePage.locator('body').innerText().catch(() => 'unavailable'));
    }
    results.push({ name, status: 'failed', error: error.message, evidence: file });
  }
}
module.exports = { mock, profile, token, source, session, reports, fixtureState: { setRole: role => { activeRole = role; }, setApiFailure: value => { apiFailure = value; }, getRequests: () => requests, getMessages: () => chatMessages } };
if (require.main === module) (async () => {
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', mock);
  const page = await context.newPage();
  activePage = page;
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const width of [390, 768, 1440]) {
    await check(`public landing renders without horizontal overflow at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base, { waitUntil: 'networkidle' });
      assert(await page.getByRole('heading', { level: 1 }).isVisible());
      const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      await page.screenshot({ path: path.join(out, `landing-${width}.png`), fullPage: true });
      assert(dims.scroll <= dims.client + 1, JSON.stringify(dims));
      return dims;
    });
  }
  await check('unauthenticated report route redirects to sign in', async () => {
    await page.goto(`${base}/bao-cao`, { waitUntil: 'networkidle' });
    await page.waitForURL('**/dang-nhap');
    assert(await page.locator('input[type="password"]').isVisible());
  });
  await check('empty sign-in is blocked by required fields', async () => {
    const count = requests.length;
    await page.locator('form button[type="submit"]').click();
    assert.equal(await page.locator('#login-username').evaluate(input => input.validity.valueMissing), true);
    assert.equal(requests.length, count);
  });
  await check('registration sends citizen payload and returns to sign-in', async () => {
    await page.goto(base + '/dang-ky', { waitUntil: 'networkidle' });
    for (const [id, value] of Object.entries({ 'register-first-name': 'QA', 'register-last-name': 'Tester', 'register-username': 'qa-fixture', 'register-password': 'QA-fixture-only-123', 'register-email': 'qa@example.invalid', 'register-phone': '0900000000' })) await page.locator('#' + id).fill(value);
    const request = page.waitForRequest(req => req.url().endsWith('/auth/register') && req.method() === 'POST');
    await page.locator('form button[type="submit"]').click();
    assert.equal((await request).postDataJSON().role, 'citizen');
    await page.waitForURL('**/dang-nhap');
  });
  await check('fixture sign-in persists identity and opens citizen map', async () => {
    await page.locator('#login-username').fill('qa-citizen');
    await page.locator('#login-password').fill('QA-fixture-only-123');
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL('**/trang-chu');
    assert((await context.cookies()).some(cookie => cookie.name === 'vietflood_access_token'));
  });
  for (const role of ['citizen', 'relief', 'admin']) {
    activeRole = role;
    await context.addCookies([{ name: 'vietflood_access_token', value: token(role), url: base }]);
    for (const route of ['/trang-chu', '/chat', '/bao-cao', '/theo-doi', '/ho-so', '/huong-dan', ...(role === 'citizen' ? [] : ['/cuu-tro', '/phan-cong', '/nguoi-dung', '/tong-quan'])]) {
      await check(`${role} renders ${route}`, async () => {
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(200);
        assert.equal(new URL(page.url()).pathname, route, `Unexpected redirect: ${page.url()}`);
        assert(!(await page.locator('body').innerText()).includes('Application error'), 'Application error');
        const text = await page.locator('body').innerText();
        assert(text.length > 80, 'Page has insufficient visible content');
        if (route === '/bao-cao') await page.getByText('QA fixture: flooded street', { exact: false }).first().waitFor();
        const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        assert(dims.scroll <= dims.client + 1, JSON.stringify(dims));
        if (role === 'relief' && route === '/cuu-tro') await page.screenshot({ path: path.join(out, 'relief-desktop.png'), fullPage: true });
        return { finalRoute: new URL(page.url()).pathname, visibleCharacters: text.length, ...dims };
      });
    }
  }
  activeRole = 'citizen';
  await context.addCookies([{ name: 'vietflood_access_token', value: token(activeRole), url: base }]);
  await check('citizen cannot access user management', async () => {
    await page.goto(base + '/nguoi-dung', { waitUntil: 'networkidle' });
    await page.waitForURL('**/trang-chu');
  });
  await check('report search filters and restores fixture rows', async () => {
    await page.goto(base + '/bao-cao', { waitUntil: 'networkidle' });
    await page.locator('#report-search').fill('qa-no-match');
    await page.getByText('Không tìm thấy báo cáo.', { exact: true }).waitFor();
    await page.locator('#report-search').fill('');
    await page.getByText('QA fixture: flooded street', { exact: false }).first().waitFor();
  });
  await check('report detail resolves requested report identity', async () => {
    await page.goto(base + '/bao-cao/101', { waitUntil: 'networkidle' });
    await page.getByText('QA fixture: flooded street', { exact: false }).first().waitFor();
    assert((await page.locator('body').innerText()).includes('101'));
  });
  await check('report creation submits multipart evidence and reads back new record', async () => {
    await page.goto(base + '/bao-cao', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    await page.getByRole('textbox', { name: 'Mô tả', exact: true }).fill('QA fixture created report');
    await page.locator('#report-province').fill('Đà Nẵng');
    await page.getByRole('button', { name: 'Thành phố Đà Nẵng', exact: true }).click();
    await page.locator('#report-ward').fill('Hải Châu');
    await page.getByRole('button', { name: 'Phường Hải Châu', exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: 'qa-fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6z8AAAAASUVORK5CYII=', 'base64') });
    const pending = page.waitForRequest(req => req.url().endsWith('/reports/create') && req.method() === 'POST');
    await page.getByRole('button', { name: 'Gửi báo cáo', exact: true }).click();
    const createdRequest = await pending;
    assert(createdRequest.headers()['content-type'].includes('multipart/form-data'));
    assert(createdRequest.postDataBuffer().includes(Buffer.from('qa-fixture.png')));
    await page.getByText('QA fixture created report', { exact: true }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('QA fixture created report', { exact: true }).waitFor();
  });
  await check('citizen edits own report and sees persisted fixture change', async () => {
    await page.goto(base + '/bao-cao', { waitUntil: 'networkidle' });
    const card = page.locator('article').filter({ hasText: 'QA fixture: flooded street' });
    await card.getByRole('button', { name: 'Sửa', exact: true }).click();
    await page.getByRole('textbox', { name: 'Mô tả', exact: true }).fill('QA fixture edited report');
    await page.getByRole('button', { name: 'Lưu báo cáo', exact: true }).click();
    await page.getByText('QA fixture edited report', { exact: true }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('QA fixture edited report', { exact: true }).waitFor();
  });
  await check('chat sends fixture message and renders grounded source', async () => {
    await page.goto(base + '/chat', { waitUntil: 'networkidle' });
    const composer = page.locator('textarea');
    await composer.fill('QA fixture question');
    await composer.press('Enter');
    await page.getByText('QA fixture response: this verifies rendering, not emergency advice.', { exact: true }).waitFor();
    assert(await page.getByText('QA fixture source', { exact: false }).first().isVisible());
    await page.screenshot({ path: path.join(out, 'chat-desktop.png'), fullPage: true });
  });
  await check('saved source snapshot renders archive content', async () => {
    await page.goto(base + '/tro-ly/nguon/qa-doc/1', { waitUntil: 'networkidle' });
    await page.getByText('QA fixture archived source text. Not real emergency guidance.', { exact: false }).waitFor();
  });
  await check('chat history reopens saved fixture conversation', async () => {
    await page.goto(base + '/chat', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /QA fixture conversation/ }).first().click();
    await page.getByText('QA fixture response: this verifies rendering, not emergency advice.', { exact: true }).waitFor();
  });
  await check('report service error is visible instead of false success', async () => {
    apiFailure = true;
    try {
      await page.goto(base + '/bao-cao', { waitUntil: 'domcontentloaded' });
      await page.getByText('QA fixture service unavailable', { exact: false }).first().waitFor();
    }
    catch (error) {
      await page.screenshot({ path: path.join(out, 'report-error-failure.png'), fullPage: true });
      fs.writeFileSync(path.join(out, 'report-error-failure.txt'), await page.locator('body').innerText());
      throw error;
    }
    finally { apiFailure = false; }
  });
  for (const theme of ['light', 'dark']) {
    for (const route of ['/bao-cao', '/chat', '/ho-so']) {
      await check(`${theme} ${route} fits mobile viewport`, async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await page.evaluate(t => { document.documentElement.classList.toggle('dark', t === 'dark'); document.documentElement.style.colorScheme = t; }, theme);
        await page.screenshot({ path: path.join(out, `${theme}-${route.slice(1)}-mobile.png`), fullPage: true });
        const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        assert(dims.scroll <= dims.client + 1, JSON.stringify(dims));
        return dims;
      });
    }
  }
  await check('no uncaught browser exceptions', async () => { assert.deepEqual(pageErrors, []); });
  await browser.close();
  const report = { evidenceKind: 'mock-backed browser smoke; not live integration', base, generatedAt: new Date().toISOString(), results, requests, blockedExternalOrigins: [...external], pageErrors, consoleErrors };
  fs.writeFileSync(path.join(out, 'web-smoke-results.json'), JSON.stringify(report, null, 2));
  const failed = results.filter(r => r.status === 'failed');
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, failures: failed, output: out }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
