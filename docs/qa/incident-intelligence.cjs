/* eslint-disable @typescript-eslint/no-require-imports -- Local synthetic browser acceptance runner. */
// No live backend/model/tile traffic. Fixture JWTs and PDF are not integration evidence.
const {chromium} = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { catalogue, choose } = require('./vietnam-address-picker.cjs');
const path = require("node:path");
const base = process.env.QA_WEB_URL || "http://127.0.0.1:3105";
assert(["127.0.0.1","localhost","[::1]"].includes(new URL(base).hostname), "QA_WEB_URL must be localhost");
const output = process.env.QA_INTELLIGENCE_OUTPUT || path.join(require("node:os").homedir(), ".hermes/cache/scratch/vietflood-incident-intelligence");
fs.mkdirSync(output,{recursive:true});
const A="11111111-1111-4111-8111-111111111111", B="22222222-2222-4222-8222-222222222222";
const now="2026-11-05T18:00:00.000Z";
const source={id:7,description:"duong ngap, nguoi mac ket; 50 cm",province:"Đà Nẵng",ward:"Hải Châu",addressLine:"12 đường A",lat:16.047,lng:108.206,createdAt:now,images:[],evidences:[]};
const analysis={pipeline:"incidents-v2",normalizationVersion:"vn-v2",normalizedText:"Đường ngập, người mắc kẹt; 50 cm",matchingText:"duong ngap nguoi mac ket 50 cm"};
const fact={id:"7:1:incidents-v2:0",reportId:7,revision:1,kind:"condition",text:source.description,reportedAt:now,provenance:"citizen_reported"};
const priority={value:"CRITICAL",provenance:"estimate",requiresHumanDecision:true,reasonCodes:["EXPLICIT_LIFE_THREAT"],factIds:[fact.id],sourceReportIds:[7],evidenceVersion:2};
const initialEdit={id:1,title:"Bản Admin cũ",body:"Cần đối chiếu nguồn mới.",actorId:1,createdAt:now,evidenceVersion:1,pipeline:"incidents-v1",stale:true};
function initialIncident(){return {id:A,title:"Ngập tại Hải Châu",province:source.province,ward:source.ward,address:"12 đường A",lat:source.lat,lng:source.lng,status:"DETECTED",severity:"UNKNOWN",version:3,evidence_version:2,assignee_id:2,reportCount:2,isUrgent:true,needsVerification:true,first_reported_at:now,latest_reported_at:now,updated_at:now,merged_into:null};}
function token(role,id){return [Buffer.from('{"alg":"none"}').toString("base64url"),Buffer.from(JSON.stringify({sub:id,role,username:`${role}-fixture`,exp:Math.floor(Date.now()/1000)+3600})).toString("base64url"),"fixture-only"].join(".");}
// A small explicitly synthetic, valid one-page PDF to exercise binary download only.
function fixturePdf(){
 const parts=["%PDF-1.4\n"], offsets=[0];
 const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
 const stream="BT /F1 12 Tf 20 150 Td (LOCAL SYNTHETIC QA FIXTURE - not a backend PDF) Tj ET";
 objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
 objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(parts.join("")));parts.push(`${i+1} 0 obj\n${obj}\nendobj\n`);});
 const start=Buffer.byteLength(parts.join(""));parts.push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
 offsets.slice(1).forEach(offset=>parts.push(`${String(offset).padStart(10,"0")} 00000 n \n`));
 parts.push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);return Buffer.from(parts.join(""));
}
const checks=[], requests=[], errors=[], blocked=[], unexpected=[];
function check(label){checks.push(label);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME || (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")});
 let active;
 async function session(role,width=1440,theme="light",scenario="normal"){
  const state={incident:initialIncident(),edits:[{...initialEdit}],analytics:scenario,pdf:"valid",editorConflict:false,editorTransportFailure:false};
  const id=role==="admin"?1:role==="relief"?2:3;
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:"reduce",serviceWorkers:"block",acceptDownloads:true});
  await context.routeWebSocket("**/*",ws=>ws.close());
  await context.addInitScript(({jwt,theme,origin})=>{if(location.origin===origin){localStorage.setItem("vietflood_access_token",jwt);localStorage.setItem("theme",theme);}}, {jwt:token(role,id),theme,origin:new URL(base).origin});
  const list=items=>({items,nextCursor:null});
  function analytics(){
   const empty=state.analytics==="empty";
   return {generatedAt:now,filters:{},totalIncidents:empty?0:18,totalReports:empty?0:42,linkedReports:empty?0:30,ungroupedReports:empty?0:12,missingGpsReports:empty?0:5,bySeverity:empty?[]:[{key:"UNKNOWN",count:18}],byStatus:empty?[]:[{key:"DETECTED",count:18}],dailyReports:empty?[]:[{date:"2026-11-06",count:42}],topAreas:empty?[]:[{province:"Đà Nẵng",ward:"Hải Châu",reportCount:42,incidentCount:18}],map:{incidents:empty?[]:[{...state.incident,priority},{...state.incident,id:B,title:"<img src=x onerror=alert(1)> sự cố không thực thi",lat:0,lng:0,priority}],density:empty?[]:[{lat:16.047,lng:108.206,count:37}],incidentTotal:empty?0:17,incidentReturned:empty?0:2,densityReportTotal:empty?0:37,limit:2,truncated:!empty}};
  }
  function detail(){return {...state.incident,priority,editorialSummary:state.edits.at(-1),analysisRequired:true,summary:null,summaryStale:true,summaryJob:{status:"failed",failure_code:"provider_unavailable"},facts:[fact],blockedRoadReports:0,strandedPeopleReports:2,strandedVehicleReports:1};}
  await context.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   const cors={"Access-Control-Allow-Origin":new URL(base).origin,"Access-Control-Allow-Credentials":"true","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"};
   const fulfill=(body,status=200)=>route.fulfill({status,contentType:"application/json",headers:cors,body:JSON.stringify(body)});
   if(await catalogue(route))return;
   if(p.startsWith("/socket.io")){blocked.push(req.url());return route.abort();}
   const api=p.startsWith("/incidents")||p.startsWith("/auth/")||p.startsWith("/ai/")||p==="/reports";
   if(api){
    if(req.method()==="OPTIONS") return fulfill({});
    const request={role,width,theme,method:req.method(),path:p,query:url.search,body:req.postData()?req.postDataJSON():null,key:req.headers()["idempotency-key"],authenticated:!!req.headers().authorization};requests.push(request);
    if(p==="/auth/profile") return fulfill({id,role,username:`${role}-fixture`});
    if(role==="citizen" && p.startsWith("/incidents")) return fulfill({message:"Forbidden fixture"},403);
    if(p==="/incidents/analytics") return state.analytics==="error"?fulfill({message:"Phân tích fixture tạm thời không khả dụng"},503):fulfill(analytics());
    if(p==="/incidents/report") return fulfill({generatedAt:now,filters:Object.fromEntries(url.searchParams),analytics:analytics(),incidents:state.analytics==="empty"?[]:[{...detail(),sourceReportIds:[7,8]}],coverage:{complete:true,incidentCount:state.analytics==="empty"?0:1,maximumIncidents:1000}});
    if(p==="/incidents/report.pdf"){
     if(state.pdf==="large") return fulfill({message:"Báo cáo quá lớn; hãy thu hẹp phạm vi."},413);
     if(state.pdf==="invalid") return route.fulfill({status:200,contentType:"application/pdf",headers:cors,body:"invalid PDF"});
     return route.fulfill({status:200,contentType:"application/pdf",headers:cors,body:fixturePdf()});
    }
    if(p===`/incidents/${A}/summary-edits`){
     if(req.method()==="GET") return fulfill(list(state.edits));
     assert.equal(role,"admin");assert(request.key);assert.equal(request.body.expectedVersion,state.incident.version);
     if(state.editorTransportFailure){state.editorTransportFailure=false;return fulfill({message:"Lỗi mạng fixture — thử lại cùng yêu cầu"},503);}
     if(state.editorConflict){state.editorConflict=false;return fulfill({message:"Xung đột phiên bản fixture. Tải lại trước khi sửa."},409);}
     state.incident.version++;state.edits.push({id:state.edits.length+1,title:request.body.title,body:request.body.body,reason:request.body.reason,actorId:id,createdAt:now,evidenceVersion:2,pipeline:"incidents-v2",stale:false});return fulfill(detail());
    }
    if(p==="/incidents/overview")return fulfill({totalReports:42,totalIncidents:18,highPriority:1,awaitingVerification:18,recentlyUpdated:1,pendingReviews:1,failedJobs:1,queuedJobs:0,oldestJobSeconds:null,mode:"review",processingEnabled:false});
    if(p==="/incidents/emergencies")return fulfill(list([]));
    if(p==="/incidents/assignees")return fulfill(list([{id:2,username:"Rescue fixture"}]));
    if(p==="/incidents/review")return fulfill(list([{report_id:7,revision:1,reason:"suggested_match",snapshot:source,analysis,candidates:[{incidentId:A,version:3,title:state.incident.title,score:0.92,distanceMeters:35,timeDifferenceMinutes:8,relation:"possible_duplicate",matchingReportIds:[8]},{incidentId:B,version:1,title:"Sự cố liên quan",score:0.7,distanceMeters:120,timeDifferenceMinutes:20,relation:"related"}]}]));
    if(p===`/incidents/${A}/reports`)return fulfill(list([{id:7,manual:false,archived_at:null,snapshot:source,originalSnapshot:source,revisionCount:1,analysis}]));
    if(p===`/incidents/${A}/history`)return fulfill(list([]));
    if(p===`/incidents/${A}`)return fulfill(detail());
    if(p==="/incidents")return fulfill(list([state.incident]));
    if(p==="/reports")return fulfill([]);
    unexpected.push(request);return fulfill({message:"Unknown fixture route"},404);
   }
   if(url.origin===new URL(base).origin && ["GET","HEAD"].includes(req.method()))return route.continue();
   if(["data:","blob:"].includes(url.protocol))return route.continue();
   blocked.push({url:req.url(),method:req.method()});return route.abort();
  });
  const page=await context.newPage(); active=page;page.setDefaultTimeout(20000);page.on("pageerror",e=>errors.push(e.message));
  return {page,context,state};
 }
 async function openAnalytics(s,role){
  await s.page.goto(base+(role==="relief"?"/phan-cong":"/cuu-tro"));
  await s.page.getByRole("button",{name:"AI Flood Intelligence",exact:true}).click();
  await s.page.getByRole("heading",{name:"AI Flood Intelligence",exact:true}).waitFor();
 }
 async function screenshot(page,name){
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow: ${name}`);
  await page.screenshot({path:path.join(output,name+".png"),fullPage:true});
 }
 try{
  for(const role of ["admin","relief","citizen"])for(const width of [1440,390])for(const theme of ["light","dark"]){
   const s=await session(role,width,theme),{page}=s;active=page;
   if(role==="citizen"){
    const before=requests.length;await page.goto(base+"/su-co/"+A);await page.waitForURL("**/trang-chu");
    assert.equal(await page.getByRole("button",{name:"AI Flood Intelligence",exact:true}).count(),0);
    assert(!requests.slice(before).some(r=>r.path.startsWith("/incidents")),"Citizen must not initiate incident reads");
    check(`${role} ${width} ${theme}: protected route redirects without incident API read`);
   }else{
    await openAnalytics(s,role);
    await page.getByText("Hiển thị 2/17 sự cố",{exact:false}).waitFor();
    await page.getByText("Không tải được nền bản đồ.",{exact:false}).waitFor();
    assert(await page.getByRole("link",{name:"OpenStreetMap",exact:true}).count());
    await page.getByRole("button",{name:"Định vị Ngập tại Hải Châu",exact:true}).focus();await page.keyboard.press("Enter");
    await page.locator(".leaflet-popup").waitFor();
    assert.equal(await page.locator(".leaflet-popup img").count(),0);
    await page.getByRole("button",{name:/Định vị <img/}).click();
    assert.equal(await page.locator(".leaflet-popup img").count(),0);
    await page.locator(".leaflet-popup-content").filter({hasText:"<img src=x"}).waitFor();
    assert(await page.getByText("0, 0 · 2 báo cáo",{exact:true}).count());
    await page.getByLabel("Hiện mật độ ghi nhận (màu cam)").uncheck();
    await screenshot(page,`${role}-${width}-${theme}-analytics`);
    check(`${role} ${width} ${theme}: whole-scope counts, coverage, zero GPS, keyboard map, escaped popup, attribution/tile fallback, no overflow`);
    await page.getByLabel("Ngày báo cáo",{exact:true}).fill("2026-11-06");
    await page.getByRole("button",{name:"Tổng hợp báo cáo",exact:true}).click();
    await page.getByText("Chưa xác minh / cần xác minh",{exact:true}).waitFor();
    await page.getByText("Admin #1 ·",{exact:false}).waitFor();
    const rq=requests.filter(r=>r.path==="/incidents/report").at(-1),qs=new URLSearchParams(rq.query);
    assert.equal(qs.get("from"),"2026-11-05T17:00:00.000Z");assert.equal(qs.get("to"),"2026-11-06T16:59:59.999Z");
    assert(!qs.has("cursor")&&!qs.has("limit"));if(role==="relief")assert.equal(qs.get("assignedToMe"),"true");
    const dl=page.waitForEvent("download");await page.getByRole("button",{name:"Tải PDF có xác thực"}).click();
    const download=await dl;const destination=path.join(output,`${role}-${width}-${theme}-fixture.pdf`);await download.saveAs(destination);
    assert(fs.readFileSync(destination).subarray(0,5).equals(Buffer.from("%PDF-")));assert(requests.filter(r=>r.path==="/incidents/report.pdf").at(-1).authenticated);
    check(`${role} ${width} ${theme}: VN-day report provenance and authenticated fixture PDF download`);
    await page.goto(base+"/su-co/"+A);await page.getByRole("heading",{name:"Tóm tắt có dẫn chứng"}).waitFor();
    await page.getByText("Bản biên tập cũ —",{exact:false}).waitFor();
    await page.getByRole("heading",{name:"Ước tính ưu tiên: Nghiêm trọng",exact:true}).waitFor();
    await page.getByText("Bản chuẩn hóa (không thay nguyên văn)",{exact:true}).click();
    await page.getByText(analysis.normalizedText,{exact:true}).waitFor();
    if(role==="admin") await page.getByText("Biên tập tóm tắt",{exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Lưu bản biên tập",exact:true}).count(),role==="admin"?1:0);
    await screenshot(page,`${role}-${width}-${theme}-detail`);
    check(`${role} ${width} ${theme}: normalized/original distinction, priority sources, stale AI/Admin, editor role gating, detail responsive`);
   }
   await s.context.close();
  }
  // Interactive editor retries/conflicts, filters, report periods and error/empty states.
  const s=await session("admin"),{page,state}=s;active=page;
  await page.goto(base+"/su-co/"+A);
  await page.getByText("Biên tập tóm tắt",{exact:true}).click();
  await page.getByLabel("Tiêu đề biên tập",{exact:true}).fill("Tiêu đề Admin mới");
  await page.getByLabel("Nội dung biên tập",{exact:true}).fill("Chỉ biên tập, không ghi đè nguyên văn hoặc AI.");
  assert(await page.getByRole("button",{name:"Lưu bản biên tập",exact:true}).isDisabled());
  await page.getByLabel("Lý do biên tập",{exact:true}).fill("Đã đối chiếu nguồn tại hiện trường");
  state.editorTransportFailure=true;
  await page.getByRole("button",{name:"Lưu bản biên tập",exact:true}).click();await page.getByRole("alert").filter({hasText:"Lỗi mạng fixture"}).waitFor();
  await page.getByRole("button",{name:"Lưu bản biên tập",exact:true}).click();await page.getByText("Đã lưu bản biên tập; lịch sử đã được tải lại.",{exact:true}).waitFor();
  const writes=requests.filter(r=>r.method==="POST"&&r.path.endsWith("/summary-edits"));assert.equal(writes.length,2);assert.equal(writes[0].key,writes[1].key);assert.equal(writes[0].body.expectedVersion,3);assert.equal(state.edits.length,2);
  assert.equal(state.edits[0].title,"Bản Admin cũ");assert.equal(state.incident.severity,"UNKNOWN");assert.equal(state.incident.status,"DETECTED");
  check("Admin editor validates reason, stable idempotency on retry, concurrency version and append-only readback; no official-state changes");
  state.editorConflict=true;await page.getByLabel("Tiêu đề biên tập",{exact:true}).fill("Bản có xung đột");await page.getByRole("button",{name:"Lưu bản biên tập",exact:true}).click();await page.getByRole("alert").filter({hasText:"Xung đột phiên bản"}).waitFor();
  assert.equal(state.edits.length,2);check("editor 409 leaves drafts and history intact with a visible conflict");
  await openAnalytics(s,"admin");
  await choose(page,'incident-filter-province','da nang','Thành phố Đà Nẵng');await choose(page,'incident-filter-ward','hai chau','Phường Hải Châu');
  const scopedAnalytics=page.waitForResponse(r=>{const u=new URL(r.url());return u.pathname==="/incidents/analytics"&&u.searchParams.get("ward")==="Phường Hải Châu";});
  await page.getByRole("button",{name:"Áp dụng bộ lọc"}).click();await scopedAnalytics;
  await page.getByText("Hiển thị 2/17 sự cố",{exact:false}).waitFor();
  await page.getByLabel("Kỳ báo cáo",{exact:true}).selectOption("week");await page.getByLabel("Tuần ISO",{exact:true}).fill("2020-W01");await page.getByRole("button",{name:"Tổng hợp báo cáo",exact:true}).click();await page.getByText("Chốt dữ liệu",{exact:false}).waitFor();
  const weekly=new URLSearchParams(requests.filter(r=>r.path==="/incidents/report").at(-1).query);assert.equal(weekly.get("from"),"2019-12-29T17:00:00.000Z");assert.equal(weekly.get("to"),"2020-01-05T16:59:59.999Z");assert.equal(weekly.get("province"),"Thành phố Đà Nẵng");assert.equal(weekly.get("ward"),"Phường Hải Châu");
  check("geography scope and ISO week year boundary reach analytics/report in VN timezone");
  await page.getByLabel("Tuần ISO",{exact:true}).fill("2020-W02");assert.equal(await page.getByText("Chốt dữ liệu",{exact:false}).count(),0);check("changing report period clears prior snapshot instead of mislabeling stale data");
  await page.getByLabel("Kỳ báo cáo",{exact:true}).selectOption("area");await page.getByLabel("Ngày báo cáo",{exact:true}).fill("2026-01-01");await page.getByLabel("Ngày kết thúc báo cáo",{exact:true}).fill("2026-02-01");
  const before=requests.filter(r=>r.path==="/incidents/report").length;await page.getByRole("button",{name:"Tổng hợp báo cáo",exact:true}).click();await page.getByRole("alert").filter({hasText:"tối đa 31 ngày"}).waitFor();assert.equal(requests.filter(r=>r.path==="/incidents/report").length,before);check("oversize report interval rejected locally without request");
  await page.getByLabel("Kỳ báo cáo",{exact:true}).selectOption("day");await page.getByLabel("Ngày báo cáo",{exact:true}).fill("2026-11-06");
  for(const [mode,message] of [["large","Báo cáo quá lớn"],["invalid","Tệp PDF không hợp lệ"]]){state.pdf=mode;await page.getByRole("button",{name:"Tải PDF có xác thực"}).click();await page.getByRole("alert").filter({hasText:message}).waitFor();check(`${mode} PDF response surfaces an accessible error, no successful download`);}
  state.analytics="error";await page.getByRole("button",{name:"Tải lại phân tích"}).click();await page.getByRole("alert").filter({hasText:"Phân tích fixture"}).waitFor();await screenshot(page,"analytics-error");check("analytics service error remains visible and retryable");
  state.analytics="empty";await page.getByRole("button",{name:"Tải lại phân tích"}).click();await page.getByText("Không có dữ liệu trong phạm vi bộ lọc.",{exact:true}).waitFor();await page.getByRole("button",{name:"Tổng hợp báo cáo",exact:true}).click();await page.getByText("Không có sự cố trong kỳ báo cáo.",{exact:true}).waitFor();await screenshot(page,"analytics-empty");check("empty analytics/map/report retain zero totals and missing-GPS guidance");
  await page.getByRole("button",{name:/Duyệt ghép nhóm/}).click();await page.getByText("Có thể trùng nội dung",{exact:false}).waitFor();
  assert(await page.getByText(/35 m/).count());assert(await page.getByText(/8 phút/).count());assert(await page.getByText(/không phải xác suất/).count());
  await page.locator("#review-target-7").click();await page.getByRole("option",{name:"Sự cố liên quan · 120 m",exact:true}).click();await page.getByText("Có liên quan (chưa kết luận)",{exact:false}).waitFor();
  check("relation labels include distance/time and do not call similarity a probability");
  await screenshot(page,"relations-admin");
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  fs.writeFileSync(path.join(output,"results.json"),JSON.stringify({checkedAtVietnam:new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"long"}).format(new Date()),passed:checks.length,checks,errors,unexpected,requests,blocked,network:"Only localhost app GET/HEAD can continue. API writes/reads intercepted; all remote/tile/WebSocket and unhandled writes blocked.",limitations:"Synthetic API/tile-error/PDF fixtures only. Not backend RBAC, DB persistence, model quality, real tiles or Vietnamese backend PDF validation."},null,2));
  console.log(JSON.stringify({passed:checks.length,checks,output},null,2));
 }catch(error){if(active)await active.screenshot({path:path.join(output,"failure.png"),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,"failure.json"),JSON.stringify({error:String(error),checks,errors,unexpected,requests,blocked},null,2));throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
