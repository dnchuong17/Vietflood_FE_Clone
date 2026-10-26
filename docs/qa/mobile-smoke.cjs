/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS runner shares the fixture module and supports NODE_PATH. */

/* Real Expo-web browser checks against explicit local QA fixtures only.
 * This does not verify native iOS/Android behavior or a live backend.
 */
process.env.QA_WEB_URL = process.env.QA_MOBILE_URL || 'http://127.0.0.1:3101';
const { chromium } = require('playwright');
const { mock, fixtureState } = require('./web-smoke.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.QA_WEB_URL;
const out = process.env.QA_MOBILE_OUTPUT || path.join(__dirname, 'evidence', 'mobile');
fs.mkdirSync(out, { recursive: true });
const results = [];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  for (const role of ['citizen', 'relief', 'admin']) {
    fixtureState.setRole(role);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'vi-VN', reducedMotion: 'reduce' });
    await context.route('**/*', mock);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    async function check(name, fn) {
      try { const details = await fn(); results.push({ role, name, status: 'passed', details }); }
      catch (error) {
        const file = `${role}-${results.length}-failure`;
        await page.screenshot({ path: path.join(out, file + '.png'), fullPage: true }).catch(() => {});
        fs.writeFileSync(path.join(out, file + '.txt'), await page.locator('body').innerText().catch(() => 'unavailable'));
        results.push({ role, name, status: 'failed', error: error.message, evidence: file });
      }
    }
    await check('welcome and sign-in render; fixture login reaches authenticated navigation', async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      fs.writeFileSync(path.join(out, `${role}-startup.txt`), await page.locator('body').innerText());
      await page.getByRole('button', { name: /Bắt đầu|Get Started|Get started/ }).first().click();
      await page.getByPlaceholder(/Nhập tên đăng nhập|Enter.*username/i).fill(`qa-${role}`);
      await page.getByPlaceholder(/Nhập mật khẩu|Enter.*password/i).fill('QA-fixture-only-123');
      await page.getByTestId('login-button').click();
      await page.getByRole('button', { name: /Trợ lý|Assistant/ }).last().waitFor();
      await page.screenshot({ path: path.join(out, `${role}-authenticated.png`), fullPage: true });
      return { buttons: await page.getByRole('button').allTextContents() };
    });
    await check('reports tab remains reachable for this role', async () => {
      const reportTab = page.getByRole('button', { name: /Báo cáo|Reports|Tạo báo cáo/ });
      await reportTab.last().click();
      await page.getByText('QA fixture: flooded street', { exact: false }).first().waitFor();
      await page.screenshot({ path: path.join(out, `${role}-reports.png`), fullPage: true });
    });
    await check('chat sends fixture answer and exposes source metadata', async () => {
      await page.getByRole('button', { name: /Trợ lý|Assistant/ }).last().click();
      await page.getByLabel('Tin nhắn', { exact: true }).fill(`QA mobile fixture question ${role}`);
      await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
      await page.getByText('QA fixture response: this verifies rendering, not emergency advice.', { exact: true }).last().waitFor();
      await page.getByRole('link', { name: '[1] QA fixture source', exact: true }).last().waitFor();
      await page.screenshot({ path: path.join(out, `${role}-chat.png`), fullPage: true });
    });
    await check('citation opens authenticated archived source snapshot', async () => {
      await page.getByRole('link', { name: '[1] QA fixture source', exact: true }).last().click();
      await page.getByText('QA fixture archived source text. Not real emergency guidance.', { exact: true }).waitFor();
      await page.getByText('Phiên bản này đã được thay thế hoặc nguồn đã rút khỏi kho tra cứu hiện tại.', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(out, `${role}-source.png`), fullPage: true });
      await page.getByRole('button', { name: 'Đóng tài liệu', exact: true }).click();
    });
    await check('no uncaught browser exceptions and no document horizontal overflow', async () => {
      assert.deepEqual(pageErrors, []);
      const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert(dims.scroll <= dims.client + 1, JSON.stringify(dims));
      return { ...dims, consoleErrors };
    });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'mobile-smoke-results.json'), JSON.stringify({ evidenceKind: 'Expo web, explicit fixtures; not native or live integration', generatedAt: new Date().toISOString(), base, results, requests: fixtureState.getRequests() }, null, 2));
  const failed = results.filter(r => r.status === 'failed');
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, failures: failed, output: out }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
