/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser regression runner. */
// Uses isolated API fixtures; no production requests or report creation.
// NODE_PATH=/Users/macbook/VietFlood_mobile/node_modules node docs/qa/report-gps.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mock, token, session } = require('./web-smoke.cjs');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3100';

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const surface of ['report', 'chat']) {
    for (const scenario of ['success', 'denied', 'retry', 'geocode-failure']) {
      if (surface === 'chat' && scenario === 'geocode-failure') continue;
      const context = await browser.newContext({
        geolocation: { latitude: 16.0471, longitude: 108.2062 },
        permissions: ['geolocation'],
      });
      await context.route('**/*', mock);
      if (surface === 'chat') {
        await context.route('**/chat/sessions/qa-session/messages*', route => route.fulfill({
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' },
          body: JSON.stringify({ session, items: [], nextCursor: null, pendingAction: {
            id: 'gps-test-draft', intent: 'create_report', status: 'awaiting_confirmation',
          } }),
        }));
      }
      await context.addCookies([{ name: 'vietflood_access_token', value: token('citizen'), url: base }]);
      if (scenario === 'denied' || scenario === 'retry') {
        await context.addInitScript(({ scenario }) => {
          window.gpsAttempts = [];
          Object.defineProperty(navigator.geolocation, 'getCurrentPosition', {
            value: (success, failure, options) => {
              window.gpsAttempts.push(options);
              setTimeout(() => {
                if (scenario === 'denied') failure({ code: 1 });
                else if (window.gpsAttempts.length === 1) failure({ code: 3 });
                else success({ coords: { latitude: 16.0471, longitude: 108.2062 } });
              }, 100);
            },
          });
        }, { scenario });
      }
      if (scenario === 'geocode-failure') {
        await context.route('**/locations/reverse?*', route => route.fulfill({
          status: 503, contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' },
          body: JSON.stringify({ message: 'Fixture geocoder unavailable' }),
        }));
      }
      const page = await context.newPage();
      await page.goto(base + (surface === 'chat' ? '/chat' : '/bao-cao'));
      if (surface === 'chat') {
        await page.locator('button:visible').filter({ hasText: session.title }).first().click();
      } else {
        await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
      }
      const gps = page.getByRole('button', { name: surface === 'chat' ? 'Chia sẻ GPS' : 'Dùng GPS', exact: true });
      await gps.click();
      if (scenario === 'denied') {
        await page.getByText('Quyền vị trí bị chặn.', { exact: false }).waitFor();
        assert.equal(await page.evaluate(() => window.gpsAttempts.length), 1);
      } else {
        if (surface === 'chat') {
          await page.getByRole('button', { name: 'Đã thêm GPS', exact: true }).waitFor();
          assert((await page.getByTestId('chat-selected-attachments').innerText()).includes('16.047100, 108.206200'));
        } else {
          await page.getByText('Đã ghi nhận tọa độ từ thiết bị.', { exact: true }).waitFor();
        }
        if (surface === 'report' && scenario !== 'geocode-failure') {
          assert.equal(await page.locator('#report-province').inputValue(), 'Thành phố Đà Nẵng');
          assert.equal(await page.locator('#report-ward').inputValue(), 'Phường Hải Châu');
        }
        if (scenario === 'retry') {
          assert.deepEqual(await page.evaluate(() => window.gpsAttempts.map(o => o.enableHighAccuracy)), [false, true]);
        }
      }
      console.log('PASS ' + surface + ' GPS:', scenario);
      await context.close();
    }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
