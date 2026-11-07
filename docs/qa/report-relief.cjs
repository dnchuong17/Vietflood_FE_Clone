/* eslint-disable @typescript-eslint/no-require-imports -- Local-only synthetic Playwright acceptance. */
// rev12: direct citizen reports, NEVER incident or live backend acceptance.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { catalogue, choose } = require('./vietnam-address-picker.cjs');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3105';
const api = process.env.QA_API_ORIGIN || 'http://127.0.0.1:4310';
for (const value of [base, api]) {
  const u = new URL(value);
  assert(['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) && ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password, 'Credential-free localhost HTTP(S) only');
}
const origin = new URL(base).origin;
const output = process.env.QA_RELIEF_OUTPUT || path.join(require('node:os').homedir(), '.hermes/cache/scratch/report-relief');
const profile = role => ({ id: 1, username: 'relief-fixture', role, first_name: 'QA', last_name: 'Synthetic', name: 'QA Synthetic', email: 'fixture@example.invalid' });
const jwt = role => [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from(JSON.stringify({ ...profile(role), sub: 1, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'fixture-only'].join('.');
const make = (id, status, createdAt, extra = {}) => ({ id, userId: 1, user: profile('citizen'), description: `SYNTHETIC báo cáo ${id} — Đường ngập cần đối chiếu`, category: ['flood'], province: 'Hồ Chí Minh', ward: 'Tăng Nhơn Phú', addressLine: '12 đường kiểm thử', status, createdAt, isUrgent: id === 101, evidences: [], images: [], ...extra });
// Exact UTC+7 edges: 16/10 00:00 through 01/11 23:59:59.999.
const reports = [
  make(101, 'pending', '2026-10-15T17:00:00.000Z'),
  make(102, 'verified', '2026-11-01T16:59:59.999Z', { province: 'Thành phố Hồ Chí Minh', ward: 'Phường Tăng Nhơn Phú' }),
  make(103, 'resolved', '2026-10-15T16:59:59.999Z'),
  make(104, 'rejected', '2026-11-01T17:00:00.000Z'),
  make(105, 'pending', '2026-10-20T00:00:00Z', { province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu' }),
  make(106, 'verified', undefined),
  make(107, 'resolved', 'invalid-date'),
  make(108, 'rejected', undefined, { created_at: '2026-10-20T00:00:00Z' }),
  make(109, 'pending', '2026-09-01T00:00:00Z'),
];
const allIds = reports.map(r => r.id);
const results = [], requests = [], blocked = [], unexpected = [], incidentRequests = [], writes = [], pageErrors = [], consoleErrors = [];
const matrix = ['admin', 'relief'].flatMap(role => [1440, 390].flatMap(width => ['light', 'dark'].map(theme => ({ role, width, theme }))));
let active;
function save() {
  fs.mkdirSync(output, { recursive: true });
  const data = { evidenceKind: 'Synthetic localhost direct-report UI, not production/backend/RBAC acceptance', base, api, generatedAt: new Date().toISOString(), matrix, expectedScenarioCases: matrix.length * 12, scenarioCasesAttempted: results.filter(r => r.kind === 'scenario').length, scenarioCasesPassed: results.filter(r => r.kind === 'scenario' && r.status === 'passed').length, passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length, results, requests, blocked, unexpected, incidentRequests, writes, pageErrors, consoleErrors, limitations: 'Synthetic catalogue/API only; no operational writes, live GPS/media/socket, backend persistence or production claim. Screenshots require human inspection.' };
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(data, null, 2));
  return data;
}
async function check(name, kind, fn) {
  try { results.push({ name, kind, status: 'passed', details: await fn() }); }
  catch (error) {
    const screenshot = `${String(results.length).padStart(3, '0')}-failure.png`;
    if (active && !active.isClosed()) {
      await active.screenshot({ path: path.join(output, screenshot), fullPage: true, caret: 'initial' }).catch(() => {});
      fs.writeFileSync(path.join(output, screenshot.replace('.png', '.txt')), await active.locator('body').innerText().catch(() => 'unavailable'));
    }
    results.push({ name, kind, status: 'failed', error: String(error), screenshot });
  }
  save(); console.log(results.at(-1).status.toUpperCase(), name);
}
async function ids(page, expected) {
  const sorted = [...expected].sort((a,b) => a-b);
  await page.waitForFunction(wanted => JSON.stringify(Array.from(document.querySelectorAll('article[data-report-id]'), e => Number(e.dataset.reportId)).sort((a,b) => a-b)) === JSON.stringify(wanted), sorted);
  await page.getByText(new RegExp(`^${expected.length}\\s*/\\s*${allIds.length}\\s+báo cáo$`)).first().waitFor();
}
async function picture(page, name) {
  const screenshot = name + '.png', extraScreenshots = [];
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Document horizontal overflow');
  await page.screenshot({ path: path.join(output, screenshot), fullPage: true, caret: 'initial' });
  const scroller = page.locator('[data-motion-scroller]').first();
  if (await scroller.count()) {
    const geometry = await scroller.evaluate(e => ({ top: e.scrollTop, height: e.scrollHeight, client: e.clientHeight, width: e.scrollWidth, clientWidth: e.clientWidth }));
    assert(geometry.width <= geometry.clientWidth + 1, 'App scroller horizontal overflow');
    if (geometry.height > geometry.client) {
      for (const edge of ['top', 'bottom']) {
        await scroller.evaluate((e, edge) => { e.scrollTop = edge === 'top' ? 0 : e.scrollHeight; }, edge);
        const file = `${name}-${edge}.png`; await page.screenshot({ path: path.join(output, file), fullPage: true, caret: 'initial' }); extraScreenshots.push(file);
      }
      await scroller.evaluate((e, top) => { e.scrollTop = top; }, geometry.top);
    }
  }
  return { screenshot, extraScreenshots };
}
async function selectStatus(page, value) {
  const control = page.locator('#relief-filter-status');
  assert.equal(await page.locator('form select[name="status"]').count(), 1, 'Status must serialize under name=status');
  if (await control.evaluate(e => e.tagName === 'SELECT')) await control.selectOption(value);
  else {
    await control.click();
    const labels = { pending: 'Chờ xử lý', verified: 'Đã xác minh', resolved: 'Đã xử lý', rejected: 'Từ chối', all: 'Tất cả trạng thái' };
    await page.getByRole('option', { name: labels[value], exact: true }).click();
  }
}
async function main() {
  save();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROME || chromium.executablePath() });
  try {
    for (const { role, width, theme } of matrix) {
      const label = `${role}-${width}-${theme}`, state = { mode: 'data', held: [] };
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await context.routeWebSocket('**/*', ws => { blocked.push({ label, type: 'websocket', url: ws.url() }); ws.close(); });
      await context.addInitScript(({ token, theme, origin }) => { if (location.origin === origin) { localStorage.setItem('vietflood_access_token', token); localStorage.setItem('theme', theme); } }, { token: jwt(role), theme, origin });
      await context.route('**/*', async route => {
        const req = route.request(), u = new URL(req.url()), p = u.pathname, method = req.method();
        const record = { label, method, path: p, query: u.search, mode: state.mode };
        const fulfill = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(body) });
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) { writes.push(record); return fulfill({ message: 'Forbidden operational write' }, 501); }
        if (await catalogue(route)) return;
        if (p.startsWith('/socket.io') || (p === '/_next/image' && /^https?:/.test(u.searchParams.get('url') || ''))) { blocked.push({ ...record, type: 'socket-or-media-proxy' }); return route.abort(); }
        if (u.origin === new URL(api).origin || u.origin === 'https://vietflood-api.ndtd.indevs.in') {
          if (method === 'OPTIONS') return fulfill({});
          requests.push(record);
          if (/^\/incidents(?:\/|$)/.test(p)) { incidentRequests.push(record); return fulfill({ message: 'SYNTHETIC incident API forbidden on direct-report page' }, 503); }
          if (p === '/auth/profile') return fulfill(profile(role));
          if (p === '/reports' || p === '/reports/user') {
            if (state.mode === 'loading') await new Promise(resolve => state.held.push(resolve));
            if (state.mode === 'error') return fulfill({ message: 'SYNTHETIC reports outage' }, 503);
            return fulfill(state.mode === 'empty' ? [] : reports);
          }
          const detail = p.match(/^\/reports\/(\d+)$/);
          if (detail && reports.some(r => r.id === Number(detail[1]))) return fulfill(reports.find(r => r.id === Number(detail[1])));
          unexpected.push(record); return fulfill({ message: 'Unknown synthetic API route' }, 501);
        }
        if (u.origin === origin && ['GET', 'HEAD'].includes(method)) return route.continue();
        if (['data:', 'blob:'].includes(u.protocol)) return route.continue();
        blocked.push({ ...record, url: req.url(), type: 'external' }); return route.abort();
      });
      const page = await context.newPage(); active = page; page.setDefaultTimeout(12000); page.setDefaultNavigationTimeout(60000);
      page.on('pageerror', e => pageErrors.push({ label, message: e.message }));
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ label, text: m.text() }); });
      const run = (name, fn) => check(`${label} ${name}`, 'scenario', fn);
      const apply = () => page.getByRole('button', { name: 'Áp dụng bộ lọc', exact: true }).click();
      const reset = () => page.locator('form').getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
      const load = async () => { state.mode = 'data'; await page.goto(base + '/cuu-tro', { waitUntil: 'domcontentloaded' }); await ids(page, allIds); };
      const dates = async (from, to) => { await page.locator('#relief-filter-from').fill(from); await page.locator('#relief-filter-to').fill(to); await apply(); };
      try {
        await run('initial all four statuses incl pending, honest report-only identity and accessible controls', async () => {
          await load(); await page.getByRole('heading', { name: 'Báo cáo người dân', exact: true }).waitFor();
          assert.equal(new URL(page.url()).pathname, '/cuu-tro');
          assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme === 'dark');
          for (const [id, name] of [['search','query'],['from','from'],['to','to']]) assert.equal(await page.locator('#relief-filter-'+id).getAttribute('name'), name);
          await page.getByLabel('Trạng thái báo cáo', { exact: true }).waitFor();
          for (const r of reports) {
            const card = page.locator(`article[data-report-id="${r.id}"]`);
            assert(await card.locator(`a[href="/bao-cao/${r.id}"]`).count(), 'Missing report detail link');
            const labels={pending:'Chờ xử lý',verified:'Đã xác minh',resolved:'Đã xử lý',rejected:'Từ chối'};
            await card.getByText(labels[r.status],{exact:true}).waitFor();
            await card.getByText(/Người báo:.*QA Synthetic/).waitFor();
          }
          await page.locator('article[data-report-id="101"]').getByText('Khẩn cấp',{exact:true}).waitFor();
          assert.equal(await page.locator('a[href^="/su-co/"]').count(), 0);
          assert(!/Intelligence|điểm AI|xếp hạng AI|duyệt ghép nhóm/i.test(await page.locator('main').innerText()), 'Invented AI/incident workflow');
          return picture(page, label+'-initial');
        });
        await run('draft is inert; Apply filters locally; Reset clears every field', async () => {
          await load(); const count = requests.length;
          await page.locator('#relief-filter-search').fill('NO-MATCH-QA'); await ids(page, allIds); await apply(); await ids(page, []);
          await page.locator('#relief-filter-search').fill(''); await dates('2026-10-16','2026-11-01');
          await choose(page,'relief-filter-province','hcm','Thành phố Hồ Chí Minh'); await choose(page,'relief-filter-ward','tang nhon phu','Phường Tăng Nhơn Phú'); await selectStatus(page,'pending');
          await reset(); await ids(page, allIds);
          for (const field of ['search','from','to','province','ward']) assert.equal(await page.locator('#relief-filter-'+field).inputValue(), '');
          assert(['','all'].includes(await page.locator('form select[name="status"]').inputValue()));
          assert.equal(requests.length, count, 'Client filters must not fetch API'); return picture(page,label+'-reset');
        });
        await run('combined 16/10/2026–01/11/2026 + canonical HCM/Tăng Nhơn Phú matches legacy names', async () => {
          await load(); await page.locator('#relief-filter-from').fill('2026-10-16'); await page.locator('#relief-filter-to').fill('2026-11-01');
          await choose(page,'relief-filter-province','hcm','Thành phố Hồ Chí Minh'); await choose(page,'relief-filter-ward','tang nhon phu','Phường Tăng Nhơn Phú');
          await ids(page,allIds); await apply(); await ids(page,[101,102,108]);
          return picture(page,label+'-combined-2026-10-16_2026-11-01-hcm-tang-nhon-phu');
        });
        await run('each report status and all selection', async () => {
          await load();
          for (const status of ['pending','verified','resolved','rejected']) { await selectStatus(page,status); await apply(); await ids(page,reports.filter(r=>r.status===status).map(r=>r.id)); }
          await selectStatus(page,'all'); await apply(); await ids(page,allIds);
        });
        await run('Vietnamese accentless search including đ/d', async () => {
          await load(); await page.locator('#relief-filter-search').fill('duong ngap can doi chieu'); await apply(); await ids(page,allIds);
          await page.locator('#relief-filter-search').fill('bao cao 101'); await apply(); await ids(page,[101]);
        });
        await run('UTC+7 inclusive edges, open endpoints, missing/invalid dates and no 31-day cap', async () => {
          await load(); await dates('2026-10-16','2026-10-16'); await ids(page,[101]);
          await dates('2026-11-01','2026-11-01'); await ids(page,[102]);
          await dates('2026-10-16','2026-11-01'); await ids(page,[101,102,105,108]);
          await dates('2026-10-16',''); await ids(page,[101,102,104,105,108]);
          await dates('','2026-11-01'); await ids(page,[101,102,103,105,108,109]);
          await dates('2026-09-01','2026-11-01'); await ids(page,[101,102,103,105,108,109]);
          await dates('',''); await ids(page,allIds);
        });
        await run('reversed dates report error and preserve applied results', async () => {
          await load(); await dates('2026-10-16','2026-11-01'); await ids(page,[101,102,105,108]);
          await dates('2026-11-02','2026-10-16'); await page.getByRole('alert').filter({ hasText: /ngày/i }).first().waitFor(); await ids(page,[101,102,105,108]);
          return picture(page,label+'-reversed-date');
        });
        await run('uncommitted invalid picker draft blocks Apply', async () => {
          await load(); await page.locator('#relief-filter-search').fill('NO-MATCH-QA');
          await page.locator('#relief-filter-province').fill('UNKNOWN PICKER QA'); await page.getByText('Không tìm thấy kết quả.', { exact: true }).waitFor();
          await apply(); assert(await page.locator('#relief-filter-province').evaluate(e=>e.validity.customError), 'Picker draft must fail native validation'); await ids(page,allIds);
          await page.locator('#relief-filter-province').press('Escape'); await apply(); await ids(page,[]);
        });
        await run('actual report detail navigation without operational write', async () => {
          await load(); await page.locator('article[data-report-id="101"] a[href="/bao-cao/101"]').first().click(); await page.waitForURL('**/bao-cao/101');
          await page.getByText(reports[0].description,{exact:true}).first().waitFor(); await page.getByText('Báo cáo #101',{exact:true}).first().waitFor();
          assert(requests.some(r=>r.label===label && r.path==='/reports/101'), 'Detail API never requested'); return picture(page,label+'-detail-101');
        });
        await run('loading is explicit, then recovers', async () => {
          state.mode='loading'; await page.goto(base+'/cuu-tro',{waitUntil:'domcontentloaded'});
          try { await page.getByText(/Đang tải báo cáo/).first().waitFor(); return await picture(page,label+'-loading'); }
          finally { state.mode='data'; state.held.splice(0).forEach(resolve=>resolve()); await ids(page,allIds); }
        });
        await run('API error distinct from empty; explicit retry and refresh recover', async () => {
          state.mode='error'; await page.goto(base+'/cuu-tro',{waitUntil:'domcontentloaded'}); await page.getByText('SYNTHETIC reports outage',{exact:false}).first().waitFor();
          await picture(page,label+'-error'); assert.equal(await page.locator('article[data-report-id]').count(),0);
          state.mode='data'; await page.getByRole('button',{name:'Thử lại',exact:true}).click(); await ids(page,allIds);
          const count=requests.filter(r=>r.label===label && r.path==='/reports').length;
          const refreshed=page.waitForResponse(r=>new URL(r.url()).pathname==='/reports' && r.request().method()==='GET');
          await page.getByRole('button',{name:'Làm mới',exact:true}).click(); await refreshed; await ids(page,allIds);
          assert(requests.filter(r=>r.label===label && r.path==='/reports').length>count, 'Refresh must reload reports');
        });
        await run('genuinely empty and no-match are distinct, Reset restores data', async () => {
          state.mode='empty'; await page.goto(base+'/cuu-tro',{waitUntil:'domcontentloaded'});
          await page.getByText(/Chưa có báo cáo/i).first().waitFor(); await page.getByText(/^0\s*\/\s*0\s+báo cáo$/).first().waitFor();
          const emptyText=await page.locator('main').innerText(); await picture(page,label+'-empty');
          await load(); await page.locator('#relief-filter-search').fill('NO-MATCH-QA'); await apply(); await ids(page,[]);
          await page.getByText(/Không (?:có|tìm thấy) báo cáo.*(?:khớp|phù hợp)/i).first().waitFor();
          assert.notEqual(await page.locator('main').innerText(),emptyText); await picture(page,label+'-no-match'); await reset(); await ids(page,allIds);
        });
      } finally { state.held.splice(0).forEach(resolve=>resolve()); await context.close(); }
    }
    await check('complete eight-session scenario matrix','coverage',async()=>assert.equal(results.filter(r=>r.kind==='scenario').length,matrix.length*12));
    await check('no incident API calls, including failed calls','safety',async()=>assert.deepEqual(incidentRequests,[]));
    await check('no unknown APIs or operational writes','safety',async()=>{assert.deepEqual(unexpected,[]);assert.deepEqual(writes,[]);});
    await check('no uncaught exceptions or hydration/nesting errors','safety',async()=>{assert.deepEqual(pageErrors,[]);assert.deepEqual(consoleErrors.filter(e=>/hydrat|cannot (?:be a descendant|contain a nested)/i.test(e.text)),[]);});
  } finally { await browser.close(); }
  const data=save(); console.log(JSON.stringify({passed:data.passed,failed:data.failed,scenarioCasesAttempted:data.scenarioCasesAttempted,expectedScenarioCases:data.expectedScenarioCases,output},null,2)); process.exitCode=data.failed?1:0;
}
if(require.main===module) main().catch(error=>{save();console.error(error);process.exitCode=1;});
module.exports={reports,matrix};
