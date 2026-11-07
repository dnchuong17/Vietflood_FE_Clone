/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local-only Playwright acceptance. */
// Synthetic UI evidence, never a production API/backend/RBAC/socket acceptance.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { catalogue, choose } = require('./vietnam-address-picker.cjs');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3105';
const api = process.env.QA_API_ORIGIN || 'http://127.0.0.1:4310';
for (const value of [base, api]) {
  const u = new URL(value);
  assert(['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) && ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password, 'Only credential-free localhost HTTP(S) URLs are permitted');
}
const origin = new URL(base).origin;
const output = process.env.QA_UI_OUTPUT || path.join(require('node:os').homedir(), '.hermes/cache/scratch/evondev-ui/web-qa/ui-enhancement');
fs.mkdirSync(output, { recursive: true });
const A = '11111111-1111-4111-8111-111111111111';
const now = '2026-11-07T06:00:00.000Z';
const long = 'DỮ LIỆU KIỂM THỬ — Đường Nguyễn Thị Minh Khai ngập sâu, người dân cần đối chiếu tình hình tại phường Hải Châu. ' + 'Nội dung tiếng Việt dài có dấu để kiểm tra khả năng đọc và xuống dòng, không phải hướng dẫn khẩn cấp. '.repeat(6);
const title = 'SYNTHETIC — Sự cố ngập tại Hải Châu';
const sourceText = 'BẢN LƯU NGUỒN SYNTHETIC — ' + long;
const profile = role => ({ id: 1, username: 'ui-fixture', role, first_name: 'Nguyễn', last_name: 'Kiểm Thử Giao Diện', email: 'ui@example.invalid', phone: '0900000000', province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu', address_line: '123 đường Nguyễn Thị Minh Khai — địa chỉ tổng hợp kiểm thử' });
const jwt = role => [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from(JSON.stringify({ ...profile(role), sub: 1, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'synthetic-only'].join('.');
const report = { id: 101, userId: 1, user: profile('citizen'), description: long, category: ['flood'], province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu', addressLine: '123 đường Nguyễn Thị Minh Khai', lat: 16.047, lng: 108.206, status: 'pending', isUrgent: true, severity: 3, createdAt: now, evidences: [], images: [] };
const incident = { id: A, title, province: report.province, ward: report.ward, address: report.addressLine, lat: report.lat, lng: report.lng, status: 'DETECTED', severity: 'UNKNOWN', version: 1, evidence_version: 1, assignee_id: 1, reportCount: 1, isUrgent: false, needsVerification: true, first_reported_at: now, latest_reported_at: now, updated_at: now, merged_into: null };
const fact = { id: '101:1:0', reportId: 101, revision: 1, kind: 'condition', text: long, reportedAt: now, provenance: 'citizen_reported' };
const routes = [
  { path: '/', role: null, text: 'Cùng nhau an toàn.' },
  { path: '/dang-nhap', role: null, selector: '#login-username' },
  { path: '/dang-ky', role: null, selector: '#register-province' },
  { path: '/trang-chu', role: 'citizen', selector: 'iframe[title="Bản đồ tương tác Windy"]' },
  { path: '/chat', role: 'citizen', selector: '#chat-message' },
  { path: '/bao-cao', role: 'citizen', text: long },
  { path: '/bao-cao/101', role: 'citizen', text: long },
  { path: '/cuu-tro', role: 'admin', text: long },
  { path: '/phan-cong', role: 'relief', text: title },
  { path: '/su-co/' + A, role: 'admin', text: 'Tóm tắt có dẫn chứng' },
  { path: '/nguoi-dung', role: 'admin', text: '@managed-fixture' },
  { path: '/tong-quan', role: 'admin', text: '@managed-fixture' },
  { path: '/theo-doi', role: 'citizen', text: 'Chia sẻ vị trí' },
  { path: '/ho-so', role: 'citizen', selector: '#profile-ward' },
  { path: '/huong-dan', role: 'citizen', text: 'Hướng dẫn đồng bộ với ứng dụng di động' },
  { path: '/tro-ly/nguon/ui-doc/1', role: 'citizen', text: sourceText },
];
const results = [], requests = [], blocked = [], unexpected = [], pageErrors = [], consoleErrors = [], expectedOutages = [];
let active;
function save() {
  const passed = results.filter(r => r.status === 'passed').length;
  const routeChecks = results.filter(r => r.kind === 'route');
  const data = { evidenceKind: 'Synthetic fixture-backed local browser UI; not live integration', base, api, generatedAt: new Date().toISOString(), routeManifest: routes, expectedRouteCases: routes.length * 4, routeCasesAttempted: routeChecks.length, routeCasesPassed: routeChecks.filter(r => r.status === 'passed').length, passed, failed: results.length - passed, results, requests, blocked, unexpected, pageErrors, consoleErrors, expectedOutages, limitations: 'External maps/media/socket intentionally blocked. No live permissions, production availability, backend persistence or native runtime claims. Contrast checks are sampled rendered UI controls, not a full WCAG audit.' };
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(data, null, 2));
  return data;
}
async function check(name, kind, fn) {
  const label = String(results.length).padStart(3, '0');
  try { const details = await fn(); results.push({ name, kind, status: 'passed', details }); }
  catch (error) {
    const screenshot = `${label}-failure.png`;
    if (active && !active.isClosed()) {
      await active.screenshot({ path: path.join(output, screenshot), fullPage: true }).catch(() => {});
      fs.writeFileSync(path.join(output, `${label}-failure.txt`), await active.locator('body').innerText().catch(() => 'unavailable'));
    }
    results.push({ name, kind, status: 'failed', error: String(error), screenshot });
  }
  save();
  console.log(results.at(-1).status.toUpperCase(), name);
}
async function picture(page, name) {
  const screenshot = name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';
  // Do not temporarily mutate input styles while an SSR auth form is hydrating.
  await page.screenshot({ path: path.join(output, screenshot), fullPage: true, caret: 'initial' });
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert(size.scroll <= size.client + 1, `Document overflow ${JSON.stringify(size)}`);
  const scroller=page.locator('[data-motion-scroller]').first();
  const extraScreenshots=[];
  if(await scroller.count()) {
    const geometry=await scroller.evaluate(e=>({top:e.scrollTop,height:e.scrollHeight,client:e.clientHeight,width:e.scrollWidth,clientWidth:e.clientWidth}));
    assert(geometry.width<=geometry.clientWidth+1,`Clipped app scroller width ${JSON.stringify(geometry)}`);
    if(geometry.top>1){await scroller.evaluate(e=>e.scrollTop=0);const top=screenshot.replace('.png','-top.png');await page.screenshot({path:path.join(output,top),fullPage:true,caret:'initial'});extraScreenshots.push(top);}
    if(geometry.height>geometry.client+1){await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);const bottom=screenshot.replace('.png','-bottom.png');await page.screenshot({path:path.join(output,bottom),fullPage:true,caret:'initial'});extraScreenshots.push(bottom);}
    await scroller.evaluate((e,top)=>e.scrollTop=top,geometry.top);
  }
  return { screenshot, extraScreenshots, ...size };
}
async function focusCheck(page) {
  await page.mouse.click(1, 1);
  await page.keyboard.press('Tab');
  const item = await page.evaluate(() => {
    const e = document.activeElement, s = getComputedStyle(e), r = e.getBoundingClientRect();
    return { tag: e.tagName, name: e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 100), focusVisible: e.matches(':focus-visible'), outline: s.outlineStyle, shadow: s.boxShadow, width: r.width, height: r.height };
  });
  assert(!['BODY', 'HTML'].includes(item.tag) && item.focusVisible && item.width > 0 && item.height > 0, JSON.stringify(item));
  assert(item.outline !== 'none' || item.shadow !== 'none', 'Keyboard focus has no rendered outline/ring');
  return item;
}
async function readable(locator) {
  // Effective opaque ancestor background; alpha text is blended. Record exact measured colors.
  const data = await locator.evaluate(el => {
    const canvas=document.createElement('canvas'); canvas.width=1;canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const parse = c => { ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);const v=Array.from(ctx.getImageData(0,0,1,1).data);return [v[0],v[1],v[2],v[3]/255]; };
    const blend=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
    let bg = [255,255,255];
    const ancestors=[]; for(let node=el;node;node=node.parentElement)ancestors.unshift(node);
    for(const node of ancestors)bg=blend(parse(getComputedStyle(node).backgroundColor),bg);
    const s = getComputedStyle(el), raw = parse(s.color);
    const fg = blend(raw,bg);
    const lum = rgb => rgb.map(v => { v /= 255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4; }).reduce((a,v,i) => a+v*[.2126,.7152,.0722][i],0);
    const l = [lum(fg),lum(bg)].sort((a,b) => b-a);
    return { text: el.textContent?.trim().slice(0,90), fg, bg, ratio: (l[0]+.05)/(l[1]+.05), fontSize: s.fontSize };
  });
  assert(data.ratio >= 4.5, `Rendered text contrast ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROME || (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') });
  async function session(role, width, theme) {
    const label = `${width}-${theme}`;
    const state = { mode: 'data', held: [], reports: [{...report}], user: profile(role), revision: 1 };
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.routeWebSocket('**/*', ws => { blocked.push({ label, type: 'websocket', url: ws.url() }); ws.close(); });
    await context.addInitScript(({ value, theme, origin }) => { if (location.origin === origin) { localStorage.setItem('theme', theme); if (value) localStorage.setItem('vietflood_access_token', value); } }, { value: role ? jwt(role) : null, theme, origin });
    await context.route('**/*', async route => {
      const req = route.request(), u = new URL(req.url()), p = u.pathname, method = req.method();
      const fulfill = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(body) });
      if (await catalogue(route)) return;
      if (p.startsWith('/socket.io') || (p === '/_next/image' && /^https?:/.test(u.searchParams.get('url') || ''))) { blocked.push({ label, type: 'socket-or-media-proxy', url: req.url() }); return route.abort(); }
      if (u.origin === new URL(api).origin || u.origin === 'https://vietflood-api.ndtd.indevs.in') {
        if (method === 'OPTIONS') return fulfill({});
        const record = { label, role, method, path: p, query: u.search, mode: state.mode };
        requests.push(record);
        const list = items => ({ items, nextCursor: null });
        if (method === 'GET' && (p === '/reports' || p === '/reports/user' || p === '/reports/101')) {
          if (state.mode === 'loading') await new Promise(resolve => state.held.push(resolve));
          if (state.mode === 'error') { expectedOutages.push(record); return fulfill({ message: 'SYNTHETIC UI fixture outage — reports unavailable' }, 503); }
          return fulfill(p === '/reports/101' ? state.reports[0] : state.mode === 'empty' ? [] : state.reports);
        }
        if (method === 'GET' && p === '/auth/profile') return fulfill(state.user);
        if (method === 'GET' && ['/auth/all', '/auth/relief/users'].includes(p)) return fulfill([{...profile('citizen'), id: 2, username: 'managed-fixture'}]);
        if (method === 'GET' && p === '/incidents/overview') return fulfill({ totalReports: 1, totalIncidents: 1, highPriority: 0, awaitingVerification: 1, recentlyUpdated: 1, pendingReviews: 0, failedJobs: 0, queuedJobs: 0, processingEnabled: false, mode: 'review' });
        if (method === 'GET' && p === '/incidents') return fulfill(list([incident]));
        if (method === 'GET' && ['/incidents/emergencies','/incidents/assignees','/incidents/review'].includes(p)) return fulfill(list([]));
        if (method === 'GET' && p === `/incidents/${A}`) return fulfill({...incident, summaryStale: false, summaryJob: {status:'succeeded',failure_code:null}, summary: {title,conditions:[fact],updates:[],depths:[],suggestedSeverity:{value:'MODERATE',provenance:'estimate'},recommendations:[],generatedAt:now}, facts:[fact], blockedRoadReports:0,strandedPeopleReports:0,strandedVehicleReports:0});
        if (method === 'GET' && p === `/incidents/${A}/reports`) return fulfill(list([{id:101,manual:false,archived_at:now,snapshot:report,originalSnapshot:{...report,description:'SYNTHETIC bản gốc chưa bị ghi đè'},revisionCount:2}]));
        if (method === 'GET' && p === `/incidents/${A}/reports/101/revisions`) return fulfill(list([{revision:1,snapshot:{...report,description:'SYNTHETIC bản gốc chưa bị ghi đè'},createdAt:now},{revision:2,snapshot:report,createdAt:now}]));
        if (method === 'GET' && [`/incidents/${A}/history`,`/incidents/${A}/summary-edits`].includes(p)) return fulfill(list([]));
        if (method === 'GET' && p === '/chat/sessions') return fulfill(list([]));
        if (method === 'GET' && p === '/chat/sources/ui-doc/versions/1') return fulfill({documentId:'ui-doc',version:1,title:'SYNTHETIC — Nguồn tiếng Việt lưu trữ',text:sourceText,sourceUrl:'javascript:fixture-must-not-render',active:false});
        // Only this explicit profile mutation is allowed, and only in this session's memory.
        if (method === 'PUT' && p === '/auth/update') { Object.assign(state.user, req.postDataJSON()); state.revision++; return fulfill({message:'Synthetic profile saved'}); }
        unexpected.push(record); return fulfill({message:'Unhandled synthetic route or forbidden write'}, 501);
      }
      if (u.origin === origin && method === 'POST' && p === '/__nextjs_original-stack-frames') {
        blocked.push({label,method,url:req.url(),type:'next-development-diagnostic'});
        return route.abort('blockedbyclient');
      }
      if (u.origin === origin && ['GET','HEAD'].includes(method)) return route.continue();
      if (['data:', 'blob:'].includes(u.protocol)) return route.continue();
      const record = {label,method,url:req.url(),type:'external-or-write'};
      blocked.push(record);
      if (u.origin === origin && !['GET','HEAD'].includes(method)) unexpected.push(record);
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage(); active = page;
    page.setDefaultTimeout(12000); page.setDefaultNavigationTimeout(60000);
    page.on('pageerror', e => pageErrors.push({label,url:page.url(),message:e.message}));
    page.on('console', m => { if(m.type()==='error') consoleErrors.push({label,url:page.url(),text:m.text()}); });
    return {page,context,state,label};
  }
  try {
    for (const width of [1440,390]) for (const theme of ['light','dark']) {
      for (const route of routes) {
        const s = await session(route.role,width,theme), {page} = s;
        await check(`${s.label} route ${route.path}`, 'route', async () => {
          await page.goto(base + route.path, {waitUntil:'domcontentloaded'});
          if (route.selector) await page.locator(route.selector).first().waitFor();
          else await page.getByText(route.text,{exact:false}).first().waitFor();
          assert.equal(new URL(page.url()).pathname,route.path,'Unexpected redirect is not route coverage');
          assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')),theme==='dark');
          assert(!(await page.locator('body').innerText()).includes('Application error'));
          if(route.path.startsWith('/bao-cao/')) assert((await page.locator('body').innerText()).includes('101'),'Wrong report identity');
          if(route.path.startsWith('/su-co/')) { await page.getByText('Các phiên bản đã lưu (2)').click(); await page.getByText('SYNTHETIC bản gốc chưa bị ghi đè',{exact:true}).waitFor(); }
          if(route.path.startsWith('/tro-ly/')) { assert.equal(await page.locator('a[href^="javascript:"]').count(),0); await page.getByText('Phiên bản lưu trữ này đã được thay thế',{exact:false}).waitFor(); }
          const focus = await focusCheck(page);
          return {...await picture(page,`${s.label}${route.path==='/'?'-landing':route.path}`),focus};
        });
        await s.context.close();
      }
      const s = await session('citizen',width,theme), {page,state} = s;
      await check(`${s.label} dropdown keyboard, live theme change and return focus`, 'interaction', async () => {
        await page.goto(base+'/ho-so'); await page.locator('#profile-ward').waitFor();
        const trigger=page.getByRole('button',{name:'Đổi giao diện',exact:true}).first();
        await trigger.focus(); await page.keyboard.press('Enter');
        await page.getByRole('menuitem',{name:'Sáng',exact:true}).waitFor();
        const contrast=await readable(page.getByRole('menuitem',{name:'Sáng',exact:true}));
        await page.keyboard.press('Escape'); assert(await trigger.evaluate(e=>e===document.activeElement),'Dropdown did not return focus');
        await trigger.click(); await page.getByRole('menuitem',{name:theme==='light'?'Tối':'Sáng',exact:true}).click();
        await page.waitForFunction(d=>document.documentElement.classList.contains('dark')===d,theme==='light');
        await trigger.click(); await page.getByRole('menuitem',{name:theme==='light'?'Sáng':'Tối',exact:true}).click();
        await page.waitForFunction(d=>document.documentElement.classList.contains('dark')===d,theme==='dark');
        return {contrast,...await picture(page,s.label+'-theme')};
      });
      await check(`${s.label} committed address dropdown, profile save and exact fixture readback`, 'interaction', async () => {
        await page.goto(base+'/ho-so'); await page.locator('#profile-ward').waitFor();
        await choose(page,'profile-province','hcm','Thành phố Hồ Chí Minh');
        assert.equal(await page.locator('#profile-ward').inputValue(),'');
        await choose(page,'profile-ward','ben thanh','Phường Bến Thành');
        const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/auth/update'&&r.request().method()==='PUT');
        await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click(); await saved;
        await page.getByText('Đã lưu hồ sơ',{exact:true}).waitFor();
        assert.equal(state.user.ward,'Phường Bến Thành');
        await page.reload(); await page.locator('#profile-ward').waitFor();
        assert.equal(await page.locator('#profile-ward').inputValue(),'Phường Bến Thành');
        return picture(page,s.label+'-profile-readback');
      });
      await check(`${s.label} profile password labels, inline visibility controls and no password write`, 'interaction', async () => {
        await page.goto(base+'/ho-so'); await page.locator('#profile-ward').waitFor();
        const before=requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length;
        const fields=[['profile-current-password','Mật khẩu hiện tại','mật khẩu hiện tại'],['profile-new-password','Mật khẩu mới','mật khẩu mới'],['profile-confirm-password','Xác nhận mật khẩu mới','mật khẩu xác nhận']];
        const geometry=[];
        for(const [id,label,name] of fields){
          const input=page.getByLabel(label,{exact:true});
          assert.equal(await input.getAttribute('id'),id);
          await page.locator(`label[for="${id}"]`).click();
          assert(await input.evaluate(e=>document.activeElement===e),'Password label did not focus its field');
          const trigger=page.getByRole('button',{name:'Hiện '+name,exact:true});
          const a=await input.boundingBox(),b=await trigger.boundingBox();
          assert(a&&b&&Math.abs(a.y-b.y)<=1&&b.width>=44&&b.height>=44,'Password toggle must stay inline with a 44px target');
          await trigger.click(); assert.equal(await input.getAttribute('type'),'text');
          await page.getByRole('button',{name:'Ẩn '+name,exact:true}).click();
          assert.equal(await input.getAttribute('type'),'password'); geometry.push({id,input:a,toggle:b});
        }
        assert.equal(requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length,before,'Visibility toggle sent a password mutation');
        return {geometry,...await picture(page,s.label+'-profile-password-controls')};
      });
      await check(`${s.label} report filter empty/data and long Vietnamese form draft without write`, 'interaction', async () => {
        await page.goto(base+'/bao-cao'); await page.getByText(long,{exact:false}).first().waitFor();
        await page.locator('#report-search').fill('NO-SYNTHETIC-MATCH'); await page.getByText('Không tìm thấy báo cáo.',{exact:true}).waitFor();
        await picture(page,s.label+'-filter-empty'); await page.locator('#report-search').fill('');
        await page.getByText(long,{exact:false}).first().waitFor();
        const before=requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length;
        await page.getByRole('button',{name:'Tạo mới',exact:true}).click();
        const description=page.getByRole('textbox',{name:'Mô tả',exact:true}); await description.fill(long);
        assert.equal(await description.inputValue(),long);
        const contrast=await readable(description);
        assert.equal(requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length,before,'Draft transmitted');
        return {contrast,...await picture(page,s.label+'-report-draft')};
      });
      await check(`${s.label} rendered pending/urgent report status text contrast`, 'readability', async()=>{
        await page.goto(base+'/bao-cao',{waitUntil:'domcontentloaded'});
        await page.getByText(long,{exact:false}).first().waitFor();
        const card=page.locator('article').first();
        const evidence=await picture(page,s.label+'-status-readability');
        const pending=await readable(card.getByText('Chờ xử lý',{exact:true}));
        const urgent=await readable(card.getByText('Khẩn cấp',{exact:true}));
        return {...evidence,pending,urgent};
      });
      await s.context.close();
      const ops=await session('admin',width,theme);
      await check(`${ops.label} confirmation dialog accessible name, keyboard trap, cancel/no mutation and return focus`, 'interaction', async () => {
        const p=ops.page; await p.goto(base+'/su-co/'+A); await p.getByRole('heading',{name:'Tóm tắt có dẫn chứng'}).waitFor();
        await p.getByLabel('Lý do / căn cứ cho thao tác').fill('SYNTHETIC — chỉ mở và hủy, không xác nhận');
        const trigger=p.getByRole('button',{name:'Ghi nhận xác minh',exact:true});
        const before=requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length;
        await trigger.focus(); await p.keyboard.press('Enter');
        const dialog=p.getByRole('alertdialog'); await dialog.waitFor();
        assert(await dialog.getAttribute('aria-labelledby') || await dialog.getAttribute('aria-label'),'Dialog has no accessible name');
        for(let i=0;i<5;i++){await p.keyboard.press('Tab');assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'Focus escaped dialog');}
        await picture(p,ops.label+'-dialog');
        await p.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
        assert(await trigger.evaluate(e=>document.activeElement===e),'Dialog did not restore focus');
        assert.equal(requests.filter(r=>!['GET','OPTIONS'].includes(r.method)).length,before,'Canceled dialog caused a mutation');
      });
      await ops.context.close();
      const states=await session('citizen',width,theme);
      for(const mode of ['loading','empty','error']) await check(`${states.label} representative reports ${mode} state`, 'state', async () => {
        const p=states.page; states.state.mode=mode; await p.goto(base+'/bao-cao');
        try {
          if(mode==='loading') { await p.getByText(/Đang tải báo cáo/).first().waitFor(); }
          if(mode==='empty') { await p.getByText('Không tìm thấy báo cáo.',{exact:true}).waitFor(); }
          if(mode==='error') { await p.getByText('SYNTHETIC UI fixture outage',{exact:false}).first().waitFor(); }
          assert.equal(new URL(p.url()).pathname,'/bao-cao');
          return await picture(p,states.label+'-'+mode);
        } finally { if(mode==='loading') { states.state.mode='data'; states.state.held.splice(0).forEach(resolve=>resolve()); } }
      });
      await states.context.close();
      const unknown=await session(null,width,theme);
      await check(`${unknown.label} unknown page is an explicit 404, not a blank redirect`, 'state', async()=>{
        const response=await unknown.page.goto(base+'/qa-no-such-ui-route',{waitUntil:'domcontentloaded'});
        assert.equal(response.status(),404);
        await unknown.page.getByText('404',{exact:true}).waitFor();
        assert.equal(new URL(unknown.page.url()).pathname,'/qa-no-such-ui-route');
        return picture(unknown.page,unknown.label+'-not-found');
      });
      await unknown.context.close();
    }
    await check('64 route cases were attempted without substituting shell/redirect checks','coverage',async()=>assert.equal(results.filter(r=>r.kind==='route').length,routes.length*4));
    await check('no uncaught page exceptions','safety',async()=>assert.deepEqual(pageErrors,[]));
    await check('no React hydration or invalid nesting console errors','safety',async()=>assert.deepEqual(consoleErrors.filter(e=>/hydrat|cannot (?:be a descendant|contain a nested)/i.test(e.text)),[]));
    await check('no unknown API routes or unexpected operational writes','safety',async()=>assert.deepEqual(unexpected,[]));
  } finally { await browser.close(); }
  const summary=save();
  console.log(JSON.stringify({passed:summary.passed,failed:summary.failed,routeCasesPassed:summary.routeCasesPassed,expectedRouteCases:summary.expectedRouteCases,output},null,2));
  process.exitCode=summary.failed?1:0;
}
if(require.main===module) main().catch(error=>{save();console.error(error);process.exitCode=1;});
module.exports={routes};
