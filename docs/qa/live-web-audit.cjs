/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS runner supports optional Playwright via NODE_PATH. */
/* READ-ONLY deployed-site audit. No fixture API and no supplied credentials.
 * All non-GET/HEAD/OPTIONS requests are blocked to prevent production mutations.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.QA_LIVE_URL || 'https://vflood.vercel.app';
const out = process.env.QA_LIVE_OUTPUT || path.join(__dirname, 'evidence', 'live');
fs.mkdirSync(out, { recursive: true });
const results = [];
const errors = [];
const consoleErrors = [];
const requestsFailed = [];
const badResponses = [];
const blockedMutations = [];
let page;
async function check(name, fn) {
  try { const details = await fn(); results.push({ name, status: 'passed', details }); }
  catch (error) {
    const file = `failure-${results.length}`;
    await page.screenshot({ path: path.join(out, file + '.png'), fullPage: true }).catch(() => {});
    fs.writeFileSync(path.join(out, file + '.txt'), await page.locator('body').innerText().catch(() => 'unavailable'));
    results.push({ name, status: 'failed', error: error.message, evidence: file });
  }
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'vi-VN' });
  await context.route('**/*', route => {
    const req = route.request();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method())) return route.continue();
    blockedMutations.push({ method: req.method(), url: req.url() });
    return route.abort('blockedbyclient');
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(45000);
  page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ url: page.url(), message: message.text() }); });
  page.on('requestfailed', req => requestsFailed.push({ url: req.url(), method: req.method(), error: req.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    for (const width of [390, 768, 1440]) {
      for (const route of ['/', '/dang-nhap', '/dang-ky']) {
        await check(`${route} renders at ${width}px; motion ${reducedMotion}`, async () => {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(base + route, { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200);
          await page.waitForTimeout(1200);
          const snapshot = await page.evaluate(() => ({ title: document.title, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, headings: [...document.querySelectorAll('h1')].map(h => ({ text: h.innerText, visibility: getComputedStyle(h).visibility, opacity: getComputedStyle(h).opacity })), unlabeledInputs: [...document.querySelectorAll('input:not([type=hidden]), textarea, select')].filter(e => !(e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby'))).map(e => ({ id: e.id, type: e.type })), emptyLinks: [...document.querySelectorAll('a')].filter(e => !e.textContent.trim() && !e.getAttribute('aria-label')).map(e => e.getAttribute('href')) }));
          const name = `${route === '/' ? 'landing' : route.slice(1)}-${width}-${reducedMotion}`;
          await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
          assert(snapshot.headings.length > 0, 'Missing h1');
          assert(snapshot.headings.every(h => h.visibility !== 'hidden' && Number(h.opacity) > 0), 'Hidden heading after animation settles');
          assert(snapshot.scrollWidth <= snapshot.clientWidth + 1, `Horizontal overflow: ${JSON.stringify(snapshot)}`);
          assert.deepEqual(snapshot.unlabeledInputs, []);
          assert.deepEqual(snapshot.emptyLinks, []);
          return snapshot;
        });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/trang-chu', '/chat', '/bao-cao', '/bao-cao/101', '/theo-doi', '/cuu-tro', '/phan-cong', '/nguoi-dung', '/ho-so', '/tong-quan', '/huong-dan', '/tro-ly/nguon/qa-doc/1']) {
    await check(`anonymous access to ${route} redirects to sign-in`, async () => {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.waitForURL('**/dang-nhap');
      assert(await page.locator('#login-username').isVisible());
    });
  }
  await check('empty login cannot send a production sign-in request', async () => {
    await page.goto(base + '/dang-nhap', { waitUntil: 'networkidle' });
    const before = blockedMutations.length;
    await page.locator('form button[type="submit"]').click();
    assert.equal(await page.locator('#login-username').evaluate(e => e.validity.valueMissing), true);
    assert.equal(blockedMutations.length, before);
  });
  await check('empty registration cannot send a production registration request', async () => {
    await page.goto(base + '/dang-ky', { waitUntil: 'networkidle' });
    const before = blockedMutations.length;
    await page.locator('form button[type="submit"]').click();
    assert.equal(await page.locator('#register-first-name').evaluate(e => e.validity.valueMissing), true);
    assert.equal(blockedMutations.length, before);
  });
  await check('password visibility toggle changes field type without submission', async () => {
    await page.goto(base + '/dang-nhap', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    assert.equal(await page.locator('#login-password').getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
    assert.equal(await page.locator('#login-password').getAttribute('type'), 'password');
  });
  await check('landing section links have valid targets', async () => {
    await page.goto(base, { waitUntil: 'networkidle' });
    const anchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(a => ({ href: a.getAttribute('href'), targetExists: !!document.querySelector(a.getAttribute('href')) })));
    assert(anchors.length > 0);
    assert(anchors.every(a => a.targetExists), JSON.stringify(anchors));
    return anchors;
  });
  await check('unknown route shows a real 404', async () => {
    const response = await page.goto(base + '/qa-nonexistent-route', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 404);
  });
  await check('no uncaught browser exceptions', async () => assert.deepEqual(errors, []));
  await context.close();
  await browser.close();
  const report = { target: base, generatedAt: new Date().toISOString(), evidenceKind: 'deployed web, anonymous read-only; no credentials and no production mutations', results, errors, consoleErrors, requestsFailed, badResponses, blockedMutations, authenticatedWorkflows: 'not tested: requires a dedicated test account/session' };
  fs.writeFileSync(path.join(out, 'live-audit-results.json'), JSON.stringify(report, null, 2));
  const failed = results.filter(r => r.status === 'failed');
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, failures: failed, output: out }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
