/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS QA runner. */
/* Non-mutating QA of deployed public pages. No test JWTs, mocks, login, registration, or production writes. */
const { chromium }=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base='https://vflood.vercel.app';
const out=process.env.QA_DEPLOYED_OUTPUT||path.join(__dirname,'evidence','deployed-public');
fs.mkdirSync(out,{recursive:true});
const results=[],pageErrors=[],consoleErrors=[],failedRequests=[],httpErrors=[],blockedMutations=[];
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',route=>{
  const req=route.request(),u=new URL(req.url());
  if(!['GET','HEAD','OPTIONS'].includes(req.method())){
   blockedMutations.push({method:req.method(),url:u.origin+u.pathname});return route.abort('blockedbyclient');
  }
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',e=>pageErrors.push({url:page.url(),message:e.message}));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push({url:page.url(),message:m.text()});});
 page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
 async function check(name,fn){try{const details=await fn();results.push({name,status:'passed',details});}catch(e){const evidence=`failure-${results.length}`;await page.screenshot({path:path.join(out,evidence+'.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,evidence+'.txt'),await page.locator('body').innerText().catch(()=>''));results.push({name,status:'failed',error:e.message,evidence});}}
 async function navigate(route){await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);}
 for(const width of [390,768,1440]){
 await check(`landing content and responsive bounds at ${width}px`,async()=>{
  await page.setViewportSize({width,height:1000});await navigate('/');await page.getByRole('heading',{level:1}).waitFor();
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  fs.writeFileSync(path.join(out,`landing-${width}.txt`),await page.locator('body').innerText());
  await page.screenshot({path:path.join(out,`landing-${width}.png`),fullPage:true});assert(dims.scroll<=dims.client+1,JSON.stringify(dims));return dims;
 });}
 await check('landing links point to existing page anchors',async()=>{
  const anchors=await page.locator('a[href^="#"]').evaluateAll(as=>as.map(a=>({text:a.innerText,href:a.getAttribute('href'),exists:!!document.getElementById(a.getAttribute('href').slice(1))})));
  assert(anchors.length>0);assert(anchors.every(a=>a.exists),JSON.stringify(anchors));return anchors;
 });
 for(const route of ['/dang-nhap','/dang-ky']){
 for(const width of [390,1440]){await check(`${route} form renders accessibly at ${width}px`,async()=>{
  await page.setViewportSize({width,height:1000});await navigate(route);await page.locator('input[type="password"]').waitFor();
  const inputs=await page.locator('input').evaluateAll(es=>es.map(e=>({id:e.id,type:e.type,required:e.required,label:e.getAttribute('aria-label')||[...(e.labels||[])].map(l=>l.textContent.trim()).join(' ')})));
  assert(inputs.filter(i=>i.type!=='hidden').every(i=>i.label),JSON.stringify(inputs));
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert(dims.scroll<=dims.client+1,JSON.stringify(dims));
  await page.screenshot({path:path.join(out,`${route.slice(1)}-${width}.png`),fullPage:true});return {inputs,...dims};
 });}
 await check(`${route} empty form blocked without production submission`,async()=>{
  const before=blockedMutations.length;await page.locator('form button[type="submit"]').click();
  assert(await page.locator('input:invalid').count()>0,'No invalid input on empty form');assert.equal(blockedMutations.length,before);return {invalidInputs:await page.locator('input:invalid').count()};
 });}
 await check('password visibility toggle works',async()=>{
  await navigate('/dang-nhap');await page.getByRole('button',{name:'Hiện mật khẩu',exact:true}).click();assert.equal(await page.locator('#login-password').getAttribute('type'),'text');
  await page.getByRole('button',{name:'Ẩn mật khẩu',exact:true}).click();assert.equal(await page.locator('#login-password').getAttribute('type'),'password');
 });
 for(const route of ['/trang-chu','/bao-cao','/bao-cao/101','/chat','/cuu-tro','/phan-cong','/theo-doi','/tong-quan','/nguoi-dung','/ho-so','/huong-dan','/tro-ly/nguon/qa-nonexistent/1']){
  await check(`unauthenticated ${route} access restriction`,async()=>{
   await navigate(route);await page.waitForURL('**/dang-nhap',{timeout:10000});assert(await page.locator('input[type="password"]').isVisible());return {finalRoute:new URL(page.url()).pathname};
  });
 }
 await check('unknown route displays a real 404',async()=>{const response=await page.goto(base+'/qa-nonexistent-route',{waitUntil:'domcontentloaded'});assert.equal(response.status(),404);assert((await page.locator('body').innerText()).includes('404'));});
 await check('no uncaught JavaScript exceptions',async()=>assert.deepEqual(pageErrors,[]));
 const landingText=fs.readFileSync(path.join(out,'landing-1440.txt'),'utf8');
 const observations={staticOperationalSample:landingText.includes('42')&&landingText.includes('18')&&landingText.includes('đang trực tuyến'),sampleLabeled:/minh họa|mẫu|demo/i.test(landingText),blockedMutations};
 const report={base,evidenceKind:'live deployed public-site browser checks; no authenticated or mutating workflows',generatedAt:new Date().toISOString(),results,pageErrors,consoleErrors,failedRequests,httpErrors,observations};
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();
 const failures=results.filter(r=>r.status==='failed');console.log(JSON.stringify({passed:results.length-failures.length,failed:failures.length,failures,pageErrors,consoleErrors,httpErrors,observations,output:out},null,2));process.exitCode=failures.length?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
