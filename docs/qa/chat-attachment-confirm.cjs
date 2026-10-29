/* eslint-disable @typescript-eslint/no-require-imports -- Isolated synthetic browser regression. */
// NEVER run against production. Every API request is intercepted. Confirmation
// below only captures multipart bytes locally; no report or upload is created.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Localhost only.');
const out = process.env.QA_ATTACHMENT_OUTPUT || path.join(os.homedir(), '.hermes/cache/scratch/chat-attachment-confirm');
fs.mkdirSync(out, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
const profile = { id: 991, sub: 991, username: 'QA_ONLY', role: 'citizen', exp: Math.floor(Date.now()/1000)+3600 };
const token = [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from(JSON.stringify(profile)).toString('base64url'), 'QA-NOT-A-REAL-TOKEN'].join('.');
const session = { sessionId: 'qa-attachment-session', title: 'QA attachment report draft', createdAt: null, updatedAt: new Date().toISOString() };
const action = { id: 'qa-attachment-action', intent: 'create_report', status: 'awaiting_confirmation' };
// Deliberately retain legacy server text: local selection must remain clear.
const preview = 'QA ONLY — GPS: chưa cung cấp (tùy chọn). Chưa tạo báo cáo.';
const cases = [];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const variant of [{ width: 1280, latitude: 10.75, longitude: 106.65 }, { width: 390, latitude: 0, longitude: 0 }]) {
      const audit = { variant, checks: [], posts: [], pageErrors: [] };
      cases.push(audit);
      const context = await browser.newContext({ viewport: { width: variant.width, height: 1000 }, geolocation: { latitude: variant.latitude, longitude: variant.longitude }, reducedMotion: 'reduce' });
      await context.grantPermissions(['geolocation'], { origin });
      await context.addCookies([{ name: 'vietflood_access_token', value: token, url: base }]);
      const json = (route, body, status=200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(body) });
      let confirmations = 0;
      await context.route('**/*', async route => {
        const request = route.request(); const url = new URL(request.url());
        const api = (url.hostname === '127.0.0.1' && url.port === '4310') || url.origin === 'https://vietflood-api.ndtd.indevs.in';
        if (api) {
          if (request.method() === 'OPTIONS') return json(route, {});
          if (url.pathname === '/auth/profile') return json(route, profile);
          if (url.pathname === '/auth/refresh_token') return json(route, { accessToken: token, refresh_token: 'QA_ONLY' });
          if (url.pathname === '/chat/sessions') return json(route, { items: [session], nextCursor: null });
          if (url.pathname === `/chat/sessions/${session.sessionId}/messages`) return json(route, { session, items: [{ id: 'qa-preview', role: 'assistant', kind: 'action', content: preview, createdAt: null }], pendingAction: action, nextCursor: null });
          if (url.pathname === '/chat' && request.method() === 'POST') {
            const type = request.headers()['content-type'] || '';
            if (type.startsWith('multipart/form-data')) {
              const decoded = await new Request(request.url(), { method: 'POST', headers: { 'content-type': type }, body: request.postDataBuffer() }).formData();
              const image = decoded.get('files');
              const record = { decision: decoded.get('actionDecision'), actionId: decoded.get('actionId'), sessionId: decoded.get('sessionId'), latitude: decoded.get('latitude'), longitude: decoded.get('longitude'), fileCount: decoded.getAll('files').length, name: image?.name, mime: image?.type, bytesMatch: image && Buffer.from(await image.arrayBuffer()).equals(png) };
              audit.posts.push(record);
              confirmations++;
              if (confirmations === 1) return json(route, { message: 'QA confirmation failed; retry locally' }, 503);
              return json(route, { answer: 'QA ONLY — confirmation captured locally; no report created.', sessionId: session.sessionId, action: { ...action, status: 'completed' } });
            }
            const body = request.postDataJSON(); audit.posts.push(body);
            if (body.actionDecision === 'cancel') return json(route, { answer: 'QA ONLY — cancelled locally.', sessionId: session.sessionId, action: { ...action, status: 'cancelled' } });
            return json(route, { answer: preview, sessionId: session.sessionId, action });
          }
          return json(route, { message: 'Unexpected fixture endpoint' }, 404);
        }
        if ((url.origin === origin && ['GET', 'HEAD'].includes(request.method())) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
        return route.abort('blockedbyclient');
      });
      const page = await context.newPage();
      page.on('pageerror', error => audit.pageErrors.push(error.message));
      page.setDefaultTimeout(15000);
      async function openDraft() {
        if (variant.width < 1024) await page.getByRole('button', { name: 'Mở lịch sử hội thoại', exact: true }).click();
        await page.locator('button:visible').filter({ hasText: session.title }).first().click();
        await page.getByTestId('chat-report-task').waitFor();
      }
      async function selectAttachments() {
        await page.getByRole('button', { name: 'Chia sẻ GPS', exact: true }).click();
        await page.getByRole('button', { name: 'Đã thêm GPS', exact: true }).waitFor();
        await page.getByLabel('Chọn ảnh minh chứng', { exact: true }).setInputFiles({ name: 'QA-photo.png', mimeType: 'image/png', buffer: png });
        const summary = await page.getByTestId('chat-selected-attachments').innerText();
        assert(summary.includes(`${variant.latitude.toFixed(6)}, ${variant.longitude.toFixed(6)}`));
        assert(summary.includes('1 ảnh đã chọn'));
        assert(summary.includes('chưa bao gồm lựa chọn trên thiết bị'));
      }
      try {
        await page.goto(base+'/chat', { waitUntil: 'networkidle', timeout: 60000 });
        await openDraft(); await selectAttachments();
        await openDraft();
        await page.getByTestId('chat-selected-attachments').waitFor({ state: 'visible', timeout: 4000 });
        assert((await page.getByTestId('chat-selected-attachments').innerText()).includes('1 ảnh đã chọn'));
        audit.checks.push('reopening the active conversation preserves selected GPS/photo');
        if (variant.width < 1024) await page.getByRole('button', { name: 'Mở lịch sử hội thoại', exact: true }).click();
        await page.locator('[data-testid="chat-new-conversation"]:visible').click();
        assert.equal(await page.getByTestId('chat-selected-attachments').count(), 0);
        const unloadDialog = page.waitForEvent('dialog', { timeout: 3500 });
        const reloadResult = page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }).then(() => false, () => true);
        const dialog = await unloadDialog;
        assert.equal(dialog.type(), 'beforeunload');
        await dialog.dismiss();
        await reloadResult;
        await openDraft();
        await page.getByTestId('chat-selected-attachments').waitFor({ state: 'visible' });
        assert((await page.getByTestId('chat-selected-attachments').innerText()).includes('1 ảnh đã chọn'));
        audit.checks.push('switching away and back restores attachments; reload warns even with an inactive draft');
        assert.equal(audit.posts.length, 0); audit.checks.push('selection stays private and actual GPS/photo state is visible');
        await page.locator('#chat-message').fill('QA ONLY — labeled report details; prepare review only.');
        await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận thực hiện', exact: true }).waitFor({ state: 'visible' });
        await page.waitForFunction(() => !document.querySelector('[data-testid="chat-report-task"]')?.getAttribute('aria-busy')?.includes('true'));
        assert.equal(audit.posts.length, 1);
        assert.equal(audit.posts[0].latitude, undefined); assert.equal(audit.posts[0].longitude, undefined); assert.equal(audit.posts[0].files, undefined);
        assert((await page.getByTestId('chat-selected-attachments').innerText()).includes('1 ảnh đã chọn'));
        audit.checks.push('ordinary follow-up sends no private GPS/photo and preserves selection');
        await page.getByRole('button', { name: 'Xác nhận thực hiện', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'QA confirmation failed' }).waitFor();
        assert((await page.getByTestId('chat-selected-attachments').innerText()).includes('1 ảnh đã chọn'));
        audit.checks.push('failed confirmation retains selected GPS/photo');
        await page.screenshot({ path: path.join(out, `${variant.width}-selected-after-retry.png`), fullPage: true });
        await page.getByRole('button', { name: 'Xác nhận thực hiện', exact: true }).click();
        await page.getByText('QA ONLY — confirmation captured locally; no report created.', { exact: true }).waitFor();
        const sent = audit.posts.filter(p => p.decision === 'confirm'); assert.equal(sent.length, 2);
        for (const p of sent) {
          assert.equal(p.actionId, action.id); assert.equal(p.sessionId, session.sessionId);
          assert.equal(p.latitude, String(variant.latitude)); assert.equal(p.longitude, String(variant.longitude));
          assert.equal(p.fileCount, 1); assert.equal(p.name, 'QA-photo.png'); assert.equal(p.mime, 'image/png'); assert.equal(p.bytesMatch, true);
        }
        assert.equal(await page.getByTestId('chat-selected-attachments').count(), 0);
        audit.checks.push('both explicit confirmation attempts contain exact GPS/photo bytes; completion clears selection');
        await openDraft(); await selectAttachments();
        await page.getByRole('button', { name: 'Hủy thao tác', exact: true }).click();
        await page.getByText('QA ONLY — cancelled locally.', { exact: true }).waitFor();
        const cancel = audit.posts.at(-1); assert.equal(cancel.actionDecision, 'cancel'); assert.equal(cancel.latitude, undefined); assert.equal(cancel.longitude, undefined); assert.equal(cancel.files, undefined);
        audit.checks.push('cancellation sends no GPS/photo');
        await openDraft(); await selectAttachments();
        action.id = `qa-replaced-${variant.width}`;
        await page.locator('#chat-message').fill('QA ONLY — new proposal after previous proposal expired.');
        await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Đề xuất báo cáo trước đã được thay thế' }).waitFor();
        assert.equal(await page.getByTestId('chat-selected-attachments').count(), 0);
        audit.checks.push('replacement proposal clears prior selections with an explicit warning');
        await selectAttachments();
        action.id = `qa-replaced-again-${variant.width}`;
        await openDraft();
        await page.getByRole('alert').filter({ hasText: 'Bản nháp báo cáo đã thay đổi hoặc hết hiệu lực' }).waitFor();
        assert.equal(await page.getByTestId('chat-selected-attachments').count(), 0);
        audit.checks.push('reopened replacement proposal cannot inherit another proposal attachments');
        assert.deepEqual(audit.pageErrors, []); audit.status='passed';
      } catch(error) { audit.status='failed'; audit.error=error.message; await page.screenshot({ path: path.join(out, `${variant.width}-failure.png`), fullPage:true }); }
      await context.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out,'results.json'), JSON.stringify({ evidenceType:'Synthetic localhost UI/API fixtures only; no real report or upload', cases }, null, 2));
    console.log(JSON.stringify(cases.map(c=>({width:c.variant.width,status:c.status,checks:c.checks,error:c.error})),null,2));
    if(cases.some(c=>c.status!=='passed'))process.exitCode=1;
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
