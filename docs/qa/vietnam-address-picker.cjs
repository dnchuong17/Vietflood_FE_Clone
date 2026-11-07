/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local browser acceptance. */
// Explicit synthetic catalogues, not authoritative provider/production records.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.QA_WEB_URL || 'http://127.0.0.1:3105';
const output = process.env.QA_ADDRESS_OUTPUT || path.join(require('node:os').homedir(), '.hermes/cache/scratch/vietnam-address-picker');
const provinces = [{code:48,name:'Thành phố Đà Nẵng'},{code:79,name:'Thành phố Hồ Chí Minh'},{code:1,name:'Thành phố Hà Nội'}];
const wards = [{code:20194,name:'Phường Hải Châu',province_code:48},{code:20200,name:'Phường Thanh Khê',province_code:48},{code:26734,name:'Phường Bến Thành',province_code:79},{code:1,name:'Phường Ba Đình',province_code:1},{code:26800,name:'Phường Tăng Nhơn Phú',province_code:79}];
async function catalogue(route) {
  if (new URL(route.request().url()).hostname !== 'provinces.open-api.vn') return false;
  await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(new URL(route.request().url()).pathname.includes('/w/')?wards:provinces)});
  return true;
}
async function choose(page,id,query,name) {
  await page.locator('#'+id).fill(query);
  await page.getByRole('option',{name:new RegExp('^'+name+'(?: ✓)?$')}).click();
  assert.equal(await page.locator('#'+id).inputValue(),name);
}
function multipartField(body,name){return body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`))?.[1];}
module.exports={catalogue,choose,provinces,wards};
if(require.main===module) (async()=>{
  assert(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Local app only');
  fs.mkdirSync(output,{recursive:true});
  const checks=[],requests=[],blocked=[],unexpected=[],errors=[],consoleErrors=[];
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  let active;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const initial=(role='citizen')=>({id:1,username:'address-fixture',role,first_name:'QA',last_name:'Synthetic',email:'address@example.invalid',phone:'0900000000',province:provinces[0].name,ward:wards[0].name,address_line:'12 synthetic QA street'});
  const jwt=role=>[Buffer.from('{"alg":"none"}').toString('base64url'),Buffer.from(JSON.stringify({...initial(role),sub:1,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture-only'].join('.');
  async function session(role,width,theme,options={}) {
    const state={profile:{...initial(role),...options.profile},users:[{...initial(),id:2,username:'managed-fixture'}],catalogue:'normal',delay:0,...options};
    state.reports=[{id:101,userId:1,user:initial(),category:['flood'],description:'SYNTHETIC saved report',province:state.profile.province,ward:state.profile.ward,addressLine:state.profile.address_line,lat:16.0471,lng:108.2062,status:'pending',createdAt:'2026-11-06T10:00:00Z',evidences:[]}];
    const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',permissions:['geolocation'],geolocation:{latitude:16.0471,longitude:108.2062}});
    await context.routeWebSocket('**/*',ws=>ws.close());
    await context.addInitScript(({value,theme,origin})=>{if(location.origin===origin){localStorage.setItem('theme',theme);if(value)localStorage.setItem('vietflood_access_token',value);}},{value:role?jwt(role):null,theme,origin:new URL(base).origin});
    await context.route('**/*',async route=>{
      const req=route.request(),u=new URL(req.url()),p=u.pathname;
      const fulfill=(body,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'},body:JSON.stringify(body)});
      if(u.hostname==='provinces.open-api.vn') {
        requests.push({method:req.method(),path:p,catalogue:true});
        const mode=state.catalogue,delay=p.includes('/w/')?(state.wardDelay??state.delay):state.delay;
        if(mode==='timeout'){await pause(12000);return route.abort().catch(()=>{});}
        if(delay) await pause(delay);
        if(mode==='error')return fulfill({message:'Synthetic catalogue outage'},503);
        return catalogue(route);
      }
      // Only exact known fixture API origins may be handled; no API traffic continues.
      if(u.origin==='http://127.0.0.1:4310'||u.origin==='https://vietflood-api.ndtd.indevs.in') {
        if(req.method()==='OPTIONS')return fulfill({});
        const raw=req.postDataBuffer(),multipart=req.headers()['content-type']?.includes('multipart/form-data');
        const body=raw?(multipart?raw.toString('utf8'):req.postDataJSON()):null;
        requests.push({method:req.method(),path:p,query:u.search,body,multipart});
        if(p==='/auth/profile')return fulfill(state.profile);
        if(p==='/auth/all')return fulfill(state.users);
        if(p==='/auth/register')return fulfill('SYNTHETIC account accepted',201);
        if(p==='/auth/update'){Object.assign(state.profile,body);return fulfill({message:'Synthetic saved'});}
        if(p==='/auth/update/user/2'){Object.assign(state.users[0],body);return fulfill({message:'Synthetic saved'});}
        if((p==='/locations/geocode'||p==='/locations/reverse')&&state.geocodeError)return fulfill({message:'SYNTHETIC geocoder unavailable'},503);
        if(p==='/locations/geocode'||p==='/locations/reverse')return fulfill({coordinates:{lat:16.0471,lng:108.2062},province:{code:48,name:provinces[0].name},ward:{code:20194,name:wards[0].name,provinceCode:48},addressLine:'12 synthetic QA street',displayName:'Synthetic QA location',matchLevel:'ward',attribution:{provider:'SYNTHETIC fixture',license:'Test only',url:'https://example.invalid'}});
        if(p==='/reports/create'||p==='/reports/update/101'){
          const field=name=>body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`))?.[1];
          const report={...state.reports[0],id:p==='/reports/create'?102:101,description:field('description'),province:field('province'),ward:field('ward'),addressLine:field('addressLine')};
          if(report.id===102)state.reports.push(report);else state.reports[0]=report;
          return fulfill({report},201);
        }
        if(p==='/reports'||p==='/reports/user'||p==='/reports/user/2')return fulfill(state.reports);
        if(p==='/incidents')return fulfill({items:[],nextCursor:null});
        if(p==='/incidents/overview')return fulfill({totalReports:0,totalIncidents:0,highPriority:0,awaitingVerification:0,recentlyUpdated:0,pendingReviews:0,failedJobs:0,queuedJobs:0,mode:'review',processingEnabled:false});
        if(['/incidents/emergencies','/incidents/assignees','/incidents/review'].includes(p))return fulfill({items:[],nextCursor:null});
        unexpected.push({method:req.method(),path:p});return fulfill({message:'Unknown fixture endpoint'},404);
      }
      if(u.origin===new URL(base).origin&&['GET','HEAD'].includes(req.method()))return route.continue();
      if(['data:','blob:'].includes(u.protocol))return route.continue();
      blocked.push({url:req.url(),method:req.method()});return route.abort();
    });
    const page=await context.newPage();active=page;page.setDefaultTimeout(18000);page.setDefaultNavigationTimeout(60000);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
    const close=context.close.bind(context);
    context.close=async()=>{if(!page.isClosed()){await page.screenshot({path:path.join(output,'last-screen.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,'last-screen.txt'),await page.locator('body').innerText().catch(()=>''));}await close();};
    return {page,context,state};
  }
  async function check(label,fn){await fn();checks.push(label);console.log('PASS '+label);}
  async function picture(page,label){
    await page.locator('input[id$="-province"]').first().scrollIntoViewIfNeeded();
    if(await page.locator('section[aria-label="Khu vực báo cáo"]').count()){await page.locator('section[aria-label="Khu vực báo cáo"]').evaluate(el=>el.scrollIntoView({block:'center'}));await page.locator('section[aria-label="Khu vực báo cáo"]').screenshot({path:path.join(output,label+'-address.png')});}
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'horizontal overflow '+label);
    await page.screenshot({path:path.join(output,label+'.png'),fullPage:true});
  }
  async function picker(page,prefix){
    const p=page.locator('#'+prefix+'-province'),w=page.locator('#'+prefix+'-ward');
    await p.waitFor();assert.equal(await p.getAttribute('role'),'combobox');assert.equal(await w.getAttribute('role'),'combobox');
    await choose(page,prefix+'-province','da nang',provinces[0].name);
    await choose(page,prefix+'-ward','hai chau',wards[0].name);
    await choose(page,prefix+'-province','Đà Nẵng',provinces[0].name);
    assert.equal(await w.inputValue(),wards[0].name,'same province must preserve ward');
    await p.fill('hcm');await page.getByRole('option',{name:provinces[1].name,exact:true}).waitFor();
    await p.press('Escape');assert.equal(await p.getAttribute('aria-expanded'),'false');
    await choose(page,prefix+'-province','TP. HCM',provinces[1].name);
    assert.equal(await w.inputValue(),'','different province must clear ward');
    await choose(page,prefix+'-ward','ben thanh',wards[2].name);
    await choose(page,prefix+'-province','tp da nang',provinces[0].name);
    await w.fill('hai chau');await page.getByRole('option',{name:wards[0].name,exact:true}).waitFor();
    await w.press('ArrowDown');await w.press('Enter');assert.equal(await w.inputValue(),wards[0].name);
  }
  const last=p=>requests.filter(r=>r.path===p).at(-1);
  try {
    for(const width of [1440,390])for(const theme of ['light','dark']) {
      const label=width+'-'+theme;
      await check(label+' registration: shared interactions, canonical strings, optional street and citizen payload',async()=>{
        const s=await session(null,width,theme),{page}=s;
        try{await page.goto(base+'/dang-ky');await picker(page,'register');
          for(const [id,value] of Object.entries({'first-name':'QA','last-name':'Synthetic',username:'synthetic-only',password:'Synthetic-only-123',email:'address@example.invalid',phone:'0900000000',address:'12 synthetic QA street'}))await page.locator('#register-'+id).fill(value);
          await picture(page,label+'-register');
          await page.getByRole('button',{name:'Tạo tài khoản người dân',exact:true}).click();await page.waitForURL('**/dang-nhap');
          assert.equal(last('/auth/register').body.province,provinces[0].name);assert.equal(last('/auth/register').body.ward,wards[0].name);assert.equal(last('/auth/register').body.role,'citizen');assert.equal(last('/auth/register').body.address_line,'12 synthetic QA street');
        }finally{await s.context.close();}
      });
      await check(label+' profile: prefilled values, dependency, canonical update and readback',async()=>{
        const s=await session('citizen',width,theme),{page}=s;
        try{await page.goto(base+'/ho-so');await page.locator('#profile-ward').waitFor();assert.equal(await page.locator('#profile-ward').inputValue(),wards[0].name);
          await picker(page,'profile');await picture(page,label+'-profile');await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await page.getByText('Đã lưu hồ sơ',{exact:true}).waitFor();
          assert.equal(last('/auth/update').body.province,provinces[0].name);assert.equal(last('/auth/update').body.ward,wards[0].name);assert.equal(s.state.profile.address_line,'12 synthetic QA street');
        }finally{await s.context.close();}
      });
      await check(label+' managed user: real selection, canonical update, street/role retained',async()=>{
        const s=await session('admin',width,theme),{page}=s;
        try{await page.goto(base+'/nguoi-dung');await page.getByRole('button').filter({hasText:'@managed-fixture'}).click();await picker(page,'user-address');await picture(page,label+'-user');
          await page.getByRole('button',{name:'Lưu',exact:true}).click();await page.getByText('Đã cập nhật người dùng',{exact:false}).waitFor();
          assert.equal(last('/auth/update/user/2').body.province,provinces[0].name);assert.equal(last('/auth/update/user/2').body.ward,wards[0].name);assert.equal(s.state.users[0].address_line,'12 synthetic QA street');assert.equal(s.state.users[0].role,'citizen');
        }finally{await s.context.close();}
      });
      await check(label+' reports create/edit: picker, GPS reverse fixture, synthetic file multipart, explicit submit/readback',async()=>{
        const s=await session('citizen',width,theme),{page}=s;
        try{await page.clock.setFixedTime(new Date('2026-11-07T06:00:00Z')); // Keep the 06/11 fixture inside the existing 24h edit window; wall-clock drift is not a product regression.
          await page.goto(base+'/bao-cao');await page.getByRole('button',{name:'Tạo mới',exact:true}).click();await picker(page,'report');
          await page.getByRole('textbox',{name:'Mô tả',exact:true}).fill('SYNTHETIC created report');
          await page.getByRole('button',{name:'Dùng GPS',exact:true}).click();await page.getByText('Đã ghi nhận tọa độ từ thiết bị.',{exact:true}).waitFor();
          assert.equal(await page.locator('#report-province').inputValue(),provinces[0].name);assert.equal(await page.locator('#report-ward').inputValue(),wards[0].name);
          const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6z8AAAAASUVORK5CYII=','base64');
          await page.locator('input[type=file]').setInputFiles({name:'synthetic-address.png',mimeType:'image/png',buffer:png});
          assert(!last('/reports/create')||last('/reports/create').body.includes('SYNTHETIC created report'));
          const before=requests.filter(r=>r.path==='/reports/create').length;await picture(page,label+'-report-create');assert.equal(requests.filter(r=>r.path==='/reports/create').length,before);
          await page.getByRole('button',{name:'Gửi báo cáo',exact:true}).click();await page.getByText('SYNTHETIC created report',{exact:true}).waitFor();
          const created=last('/reports/create');assert(created.multipart);assert(created.body.includes('synthetic-address.png'));assert(created.body.includes(png.toString('utf8')));assert(created.body.includes(provinces[0].name));assert(created.body.includes(wards[0].name));assert(created.body.includes('16.0471'));for(const [key,value] of Object.entries({province:provinces[0].name,ward:wards[0].name,addressLine:'12 synthetic QA street',lat:'16.0471',lng:'108.2062',category:'flood'}))assert.equal(multipartField(created.body,key),value,key);
          await page.locator('article').filter({hasText:'SYNTHETIC saved report'}).getByRole('button',{name:'Sửa',exact:true}).click();
          assert.equal(await page.locator('#report-ward').inputValue(),wards[0].name);await picker(page,'report');await picture(page,label+'-report-edit');
          await page.getByRole('textbox',{name:'Mô tả',exact:true}).fill('SYNTHETIC edited report');const editedResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/reports/update/101');await page.getByRole('button',{name:'Lưu báo cáo',exact:true}).click();await editedResponse;await page.locator('article').getByText('SYNTHETIC edited report',{exact:true}).waitFor();
          assert(last('/reports/update/101').multipart);assert.equal(multipartField(last('/reports/update/101').body,'province'),provinces[0].name);assert.equal(multipartField(last('/reports/update/101').body,'ward'),wards[0].name);assert.equal(multipartField(last('/reports/update/101').body,'addressLine'),'12 synthetic QA street');assert(last('/locations/geocode'));await page.reload();await page.getByText('SYNTHETIC edited report',{exact:true}).waitFor();
        }finally{await s.context.close();}
      });
      for(const [route,prefix,role] of [['/cuu-tro','relief-filter','admin'],['/phan-cong','assignment-filter','relief']])await check(label+' '+prefix+': apply only, canonical address, blank/reset semantics',async()=>{
        const s=await session(role,width,theme),{page}=s;
        if(route==='/cuu-tro')s.state.reports.push({...s.state.reports[0],id:102,description:'SYNTHETIC other province report',province:provinces[1].name,ward:wards[2].name});
        try{await page.goto(base+route);await page.locator('#'+prefix+'-province').waitFor();await pause(300);
          if(route==='/cuu-tro') {
            const rendered=async expected=>page.waitForFunction(ids=>JSON.stringify(Array.from(document.querySelectorAll('article[data-report-id]'),el=>Number(el.dataset.reportId)).sort((a,b)=>a-b))===JSON.stringify(ids),expected);
            await rendered([101,102]);const before=requests.filter(r=>!r.catalogue).length;await picker(page,prefix);await rendered([101,102]);
            await picture(page,label+'-'+prefix);await page.getByRole('button',{name:'Áp dụng bộ lọc',exact:true}).click();await rendered([101]);
            await page.getByText(/^1\s*\/\s*2\s+báo cáo$/).first().waitFor();assert.equal(requests.filter(r=>!r.catalogue).length,before,'Relief filtering must be client-side, not incident/report requests');
            await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();await rendered([101,102]);
            assert.equal(await page.locator('#'+prefix+'-province').inputValue(),'');assert.equal(await page.locator('#'+prefix+'-ward').inputValue(),'');
            return;
          }
          const before=requests.filter(r=>r.path==='/incidents').length;await picker(page,prefix);assert.equal(requests.filter(r=>r.path==='/incidents').length,before,'typing/selecting must not apply');
          await picture(page,label+'-'+prefix);const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/incidents'&&new URL(r.url()).searchParams.has('province'));
          await page.getByRole('button',{name:'Áp dụng bộ lọc',exact:true}).click();await response;
          const q=new URLSearchParams(last('/incidents').query);assert.equal(q.get('province'),provinces[0].name);assert.equal(q.get('ward'),wards[0].name);if(role==='relief')assert.equal(q.get('assignedToMe'),'true');
          await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();assert.equal(await page.locator('#'+prefix+'-province').inputValue(),'');assert.equal(await page.locator('#'+prefix+'-ward').inputValue(),'');
        }finally{await s.context.close();}
      });
    }
    // Edge cases run in fresh contexts to avoid shared in-memory/localStorage catalogue caches.
    await check('legacy prefilled address remains verbatim through mount, catalogue load and save',async()=>{
      const s=await session('citizen',390,'dark',{profile:{province:'Tỉnh cũ QA',ward:'Phường cũ QA'}}),{page}=s;
      try{await page.goto(base+'/ho-so');await page.locator('#profile-ward').waitFor();await pause(500);assert.equal(await page.locator('#profile-province').inputValue(),'Tỉnh cũ QA');assert.equal(await page.locator('#profile-ward').inputValue(),'Phường cũ QA');await picture(page,'legacy');await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await page.getByText('Đã lưu hồ sơ',{exact:true}).waitFor();assert.equal(last('/auth/update').body.ward,'Phường cũ QA');}finally{await s.context.close();}
    });
    for(const mode of ['error','timeout'])await check('catalogue '+mode+': visible failure, explicit retry and selection',async()=>{
      const s=await session(null,390,'dark',{catalogue:mode}),{page}=s;
      try{await page.goto(base+'/dang-ky');await page.locator('#register-province').fill('da nang');await page.getByRole('button',{name:/Thử lại/}).first().waitFor({timeout:16000});await picture(page,'catalogue-'+mode);s.state.catalogue='normal';await page.getByRole('button',{name:/Thử lại/}).first().click();await choose(page,'register-province','da nang',provinces[0].name);}finally{await s.context.close();}
    });
    await check('delayed catalogue and rapidly changed query: late results do not restore stale search/province ward',async()=>{
      const s=await session(null,1440,'light',{delay:1200}),{page}=s;
      try{await page.goto(base+'/dang-ky');await page.locator('#register-province').fill('da nang');await page.locator('#register-province').fill('hcm');await page.getByRole('option',{name:provinces[1].name,exact:true}).waitFor();assert.equal(await page.getByRole('option',{name:provinces[0].name,exact:true}).count(),0);await page.getByRole('option',{name:provinces[1].name,exact:true}).click();await choose(page,'register-ward','ben thanh',wards[2].name);await picture(page,'delayed');}finally{await s.context.close();}
    });
    for(const width of [1440,390])for(const theme of ['light','dark'])await check(width+' '+theme+' manual offline entry and blank clear: explicit verbatim payload, no implicit geocoding',async()=>{
      const s=await session('citizen',width,theme,{catalogue:'error'}),{page}=s;const requestStart=requests.length;
      try{await page.goto(base+'/ho-so');await page.locator('#profile-ward').waitFor();await page.getByRole('button',{name:/Nhập tỉnh\/thành phố thủ công/i}).click();
        await page.locator('#profile-province').fill('Tỉnh QA thủ công');await page.getByRole('button',{name:/Nhập phường\/xã thủ công/i}).click();await page.locator('#profile-ward').fill('Xã QA nguyên văn');
        assert.equal(await page.locator('#profile-province').getAttribute('role'),null);await picture(page,width+'-'+theme+'-manual');
        await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await page.getByText('Đã lưu hồ sơ',{exact:true}).waitFor();assert.equal(last('/auth/update').body.province,'Tỉnh QA thủ công');assert.equal(last('/auth/update').body.ward,'Xã QA nguyên văn');
        await page.getByRole('button',{name:'Xóa Tỉnh/Thành phố',exact:true}).click();assert.equal(await page.locator('#profile-ward').inputValue(),'');assert(await page.locator('#profile-ward').isDisabled());
        const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/auth/update');await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await response;assert.equal(last('/auth/update').body.province,'');assert.equal(last('/auth/update').body.ward,'');assert(!requests.slice(requestStart).some(r=>r.path.startsWith('/locations/')),'account manual entry must not geocode');
      }finally{await s.context.close();}
    });
    await check('uncommitted search cannot submit or silently replace canonical form fields; Escape restores selection',async()=>{
      const s=await session('citizen',1440,'light'),{page}=s;
      try{await page.goto(base+'/ho-so');await page.locator('#profile-ward').waitFor();const before=requests.filter(r=>r.path==='/auth/update').length;
        await page.locator('#profile-province').fill('unknown no result QA');await page.getByText('Không tìm thấy kết quả.',{exact:true}).waitFor();
        assert.equal(await page.locator('input[type=hidden][name=province]').inputValue(),provinces[0].name);await page.locator('#profile-province').press('Enter');assert.equal(requests.filter(r=>r.path==='/auth/update').length,before);
        await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();assert.equal(requests.filter(r=>r.path==='/auth/update').length,before);assert.equal(await page.locator('#profile-province').evaluate(el=>el.validity.customError),true);
        await page.locator('#profile-province').press('Escape');assert.equal(await page.locator('#profile-province').inputValue(),provinces[0].name);assert.equal(await page.locator('#profile-ward').inputValue(),wards[0].name);
        await page.locator('#profile-ward').fill('hai chau');await page.locator('#profile-ward').press('ArrowUp');assert(await page.locator('#profile-ward').getAttribute('aria-activedescendant'));await page.locator('#profile-ward').press('Enter');
      }finally{await s.context.close();}
    });
    await check('late shared ward catalogue after province switch never inserts wards from old province',async()=>{
      const s=await session(null,390,'dark',{wardDelay:2000}),{page}=s;
      try{await page.goto(base+'/dang-ky');await choose(page,'register-province','da nang',provinces[0].name);await page.locator('#register-ward').fill('hai');await choose(page,'register-province','hcm',provinces[1].name);await page.locator('#register-ward').click();
        await page.getByRole('option',{name:wards[2].name,exact:true}).waitFor();assert.equal(await page.getByRole('option',{name:wards[0].name,exact:true}).count(),0);assert.equal(await page.locator('#register-ward').inputValue(),'');await page.getByRole('option',{name:wards[2].name,exact:true}).click();await picture(page,'out-of-order-wards');
      }finally{await s.context.close();}
    });
    await check('report required province and geocoder failure: no write until explicit coordinate-free confirmation',async()=>{
      const s=await session('citizen',390,'dark',{geocodeError:true}),{page}=s;
      try{await page.goto(base+'/bao-cao');await page.getByRole('button',{name:'Tạo mới',exact:true}).click();await page.getByRole('textbox',{name:'Mô tả',exact:true}).fill('SYNTHETIC fallback report');
        const before=requests.filter(r=>r.path==='/reports/create').length;await page.getByRole('button',{name:'Gửi báo cáo',exact:true}).click();assert.equal(requests.filter(r=>r.path==='/reports/create').length,before);assert(await page.locator('#report-province').evaluate(el=>el.validity.valueMissing));
        await picker(page,'report');await page.getByRole('button',{name:'Gửi báo cáo',exact:true}).click();await page.getByRole('alertdialog').waitFor();assert.equal(requests.filter(r=>r.path==='/reports/create').length,before);
        await page.getByRole('button',{name:'Kiểm tra lại',exact:true}).click();assert.equal(requests.filter(r=>r.path==='/reports/create').length,before);
        await page.getByRole('button',{name:'Gửi báo cáo',exact:true}).click();await page.getByRole('alertdialog').waitFor();const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/reports/create');await page.getByRole('button',{name:'Gửi không tọa độ',exact:true}).click();await response;
        assert.equal(requests.filter(r=>r.path==='/reports/create').length,before+1);const body=last('/reports/create').body;assert(body.includes(provinces[0].name));assert(body.includes(wards[0].name));assert(!body.includes('name="lat"'));assert(!body.includes('name="lng"'));await page.locator('article').getByText('SYNTHETIC fallback report',{exact:true}).waitFor();
      }finally{await s.context.close();}
    });
    assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:checks.length,checks,requests,blocked,errors,consoleErrors,network:'Only local app GET/HEAD continues; all APIs and writes intercepted; remote and sockets blocked.',limitations:'Synthetic catalogue shape and API payload/browser evidence only; no provider completeness, backend persistence, live credentials, geocoder quality or production integration claim.'},null,2));
    console.log(JSON.stringify({passed:checks.length,output},null,2));
  }catch(error){if(fs.existsSync(path.join(output,'last-screen.png')))fs.copyFileSync(path.join(output,'last-screen.png'),path.join(output,'failure.png'));if(active&&!active.isClosed())await active.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error),checks,errors,unexpected,requests,consoleErrors},null,2));throw error;}
  finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
