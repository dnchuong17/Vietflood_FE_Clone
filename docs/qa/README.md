# Repeatable UI verification

These scripts run the real web/Expo-web UI in Chrome. API behavior comes from explicitly labeled in-memory QA fixtures. They cannot establish live backend integration, real image storage, AI answer quality, socket delivery, or native permission/lifecycle behavior. Remote requests outside the tested app, mocked API, and division fixtures are blocked.

## Prerequisites

- A modern Node runtime supported by the projects. On this machine use `PATH=/opt/homebrew/bin:$PATH` (Node 24), not the default Node 20.15.
- Playwright and Chrome. Playwright 1.59.1 was available from the local npm cache; expose its module directory through `NODE_PATH` or install it in an isolated test-tools directory.
- Run the Next app with the API explicitly pointed at the fixture origin:

```sh
PATH=/opt/homebrew/bin:$PATH NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4310 npm run dev -- --hostname 127.0.0.1 --port 3100
```

No server needs to listen on 4310: Playwright intercepts the requests. Do not use this test origin for ordinary development or deployment.

## Web

From the web repository, the exact command used on this machine is:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/web-smoke.cjs
```

Optional environment settings: `QA_WEB_URL`, `QA_OUTPUT`, `QA_CHROME`, and `QA_API_ORIGIN`. Both the test API origin and the checked-in deployed API default are intercepted, never contacted.

The runner writes individual assertions, fixture API request methods/paths, page exceptions, console errors and screenshots under `evidence/`. It exits nonzero when an assertion fails. Its registration, login, report creation/upload/edit, and history cases exercise real UI event handlers against the fixture API; seeded-role route cases are explicitly not backend authorization tests.

## Mobile browser preview

First run `npm run bundle:web` in the mobile repository and verify `dist/index.html` exists. An incomplete or stale export is not valid UI test evidence. Serve the export on localhost:

```sh
python3 -m http.server 3101 --bind 127.0.0.1 --directory /Users/macbook/VietFlood_mobile/dist
```

Then run from the web repository:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/mobile-smoke.cjs
```

Optional settings: `QA_MOBILE_URL`, `QA_MOBILE_OUTPUT`, `QA_CHROME`, `QA_API_ORIGIN`. Results belong under `evidence/mobile/`. This is **Expo web** evidence, not an iOS/Android pass.

## Enterprise chatbot UI

Run the focused chat matrix against the fixture-facing localhost Next process described above:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/chat-ui.cjs
```

Optional settings: `QA_WEB_URL`, `QA_CHAT_OUTPUT`, `QA_CHROME`. The matrix covers desktop/narrow light/dark UI, draft-only prompt cards, real loaded-history filtering, archived citations, collection/review separation, attachment selection without submission, unavailable-service warnings, layout and uncaught exceptions. Review checks also assert that the entire confirmation button fits inside the task card. All API results are synthetic fixtures, not production integration evidence.

The final October 27, 2026 run passed 29/29 checks. Results are at `/Users/macbook/.hermes/cache/scratch/vietflood-enterprise-chat-web-final/results.json`. Native iPhone checks, final unit/build totals and evidence boundaries are recorded in `VietFlood_mobile/docs/chat-ui-redesign.md` in the sibling mobile repository.

## Chat GPS/photo confirmation regression

With the fixture-facing localhost Next process running, use:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/chat-attachment-confirm.cjs
```

This separate runner deliberately retains the legacy server preview saying GPS is absent while selecting GPS/photo locally. It verifies visible selected-state guidance, reopening the active conversation, switching away/back, a native beforeunload warning for inactive cached drafts, privacy on an ordinary follow-up, attachment retention after a failed confirmation, exact multipart GPS/photo bytes on explicit confirmation/retry, and cancellation without GPS/photo transmission. Replaced/expired proposals must not inherit old selections. The cache stays in the mounted workspace's memory; files are not claimed to survive an accepted full page reload or workspace unmount. It covers desktop and narrow layouts, including valid zero coordinates.

Unlike the read-only `chat-ui.cjs` matrix, this runner explicitly clicks confirmation **only against intercepted synthetic API fixtures**. It requires localhost, blocks unexpected remote requests and app-origin writes, and never creates a real report or uploads an image. Results/screenshots are written under `~/.hermes/cache/scratch/chat-attachment-confirm/`. This is browser/payload coverage, not proof of production persistence or a native iOS run.

## AI Flood Intelligence / incident acceptance (rev8 — legacy `/cuu-tro` assumptions)

**Superseded for the default relief page by rev12 below.** These historic incident/intelligence results describe the previous incident-based `/cuu-tro`; they do not establish a pass for today's direct-report page. Keep the evidence for unchanged incident modules, `/phan-cong` and `/su-co/[id]`, not as current default-page acceptance.

Start the **local fixture-facing** app from `/Users/macbook/Vietflood_FE_Clone`:

```sh
PATH=/opt/homebrew/bin:$PATH NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4310 npm run dev -- --hostname 127.0.0.1 --port 3105
```

No API listener on 4310 is needed. In another shell, run both browser suites:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/incidents.cjs
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/incident-intelligence.cjs
```

Both reject a non-local `QA_WEB_URL`. API requests (including mutations) are intercepted in memory; remote tiles, media, sockets and unexpected app-origin writes cannot reach a server. The intelligence runner blocks all WebSockets and service workers. Never change these runners to point at production or supply real credentials. `QA_CHROME` selects a Chrome executable. `QA_OUTPUT` controls the original runner's artifact directory; `QA_INTELLIGENCE_OUTPUT` controls the new runner's directory.

The November 6, 2026 Vietnam-time local acceptance passed:

- `incidents.cjs`: **16 checks**, including emergency polling with sockets blocked, filters, preserved originals/revisions, assignment, verification, split/merge and Rescue/Citizen route controls.
- `incident-intelligence.cjs`: **38 checks**, Admin/Rescue/Citizen × 1440/390 px × light/dark, accessible charts/map list, zero GPS, tile failure/attribution, escaped marker text, full-scope coverage, VN day/ISO-week filters, PDF transport, unverified/AI/Admin/stale labels, editor reason/version/idempotent retry/conflict/history, empty/error/oversize responses and relation labels.
- `npm test`: **58 files / 247 tests**, including **37 incident tests**. `npx tsc --noEmit`, scoped incident/runner ESLint and `npm run build` passed. Build used the explicit localhost API origin above.

Artifacts (not checked into Git):

- `~/.hermes/cache/scratch/vietflood-incidents-qa/results.json`, desktop/mobile PNGs.
- `~/.hermes/cache/scratch/vietflood-incident-intelligence/results.json`, role/width/theme PNGs, eight explicitly synthetic `*-fixture.pdf` downloads, `unit-tests.log`, `types.log`, `eslint.log`, `build.log`, `acceptance-commands.json`.

**Evidence boundaries:** browser fixtures are not PostgreSQL/HTTP-JWT integration, live RBAC, real tiles, model/clustering validation, production availability or a Vietnamese backend PDF/font/layout pass. The local binary PDF is intentionally labeled synthetic and only proves authenticated transport/download handling. The parent backend acceptance must independently verify actual API-generated Vietnamese PDFs. Existing AI summaries are never invented when missing. Gateway limits inspected read-only: editor title 3–200 chars, body 3–4000 chars; report periods use Vietnam UTC+7 and max 31 inclusive days. Editorial `reason` is rendered when provided; the currently inspected backend editorial projection omits it, so the UI honestly points to audit history rather than fabricating provenance.

## Vietnam address picker acceptance (rev9)

Run against the same fixture-facing localhost Next server on port 3105 (see the command above):

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/vietnam-address-picker.cjs
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/incidents.cjs
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/incident-intelligence.cjs
```

The address runner rejects non-local `QA_WEB_URL`, intercepts API reads/writes in memory, blocks remote requests/WebSockets/service workers and unhandled app-origin mutations, and uses unsigned **fixture-only** JWTs, never credentials. `QA_ADDRESS_OUTPUT` overrides its default `~/.hermes/cache/scratch/vietnam-address-picker/`; `QA_CHROME` selects Chrome. No backend needs to listen on 4310.

The November 7, 2026 local run passed **35 address acceptance scenarios**, plus **16 incident** and **38 intelligence** regression checks. Scoped ESLint passed for all three runners. Address scenarios cover:

- Registration, profile, managed-user editing, report creation/editing and incident/assignment filters at **1440 and 390 px, light and dark**. Actual consumer event handlers are exercised, with canonical province/ward string payload assertions and retained street/role fields.
- Accentless search, `đ/d`, city prefixes/`HCM`, ArrowDown/ArrowUp/Enter/Escape, same-province ward retention, incompatible-ward clearing, blank/clear/reset, no filter requests until Apply, and query text that cannot silently replace a committed value or pass form validation.
- Prefilled and unsupported legacy values, explicitly labeled manual offline entry with verbatim saved names and no account-address geocoding, catalogue failure/timeout/retry, delayed searches and late ward loads after a province switch.
- Synthetic GPS reverse/geocode responses, retained evidence file bytes and multipart fields, explicit report submission/readback, required-province validation, and geocoder failure with cancellation/no write before explicit coordinate-free confirmation.

Artifacts include `results.json` (scenario names, captured requests, blocked network, page exceptions and separate console errors), per-consumer/layout PNGs and focused report address-area PNGs. Failure runs preserve `failure.json`, `failure.png` and `last-screen.txt`. Desktop/narrow dark report address screenshots were visually inspected; no light-on-white address-picker contrast defect was observed in the current themed UI. The layout screenshots assert no document horizontal overflow. Both existing incident runners now reuse only the synthetic catalogue/selection helpers; their date, status, severity, report, role and mutation assertions remain intact.

**Evidence boundary:** the intentionally small catalogue is shaped like the division API, with explicit synthetic records; its codes/names are test inputs, not a verified current administrative mapping. API readback is fixture memory, not database persistence. These checks do not establish provider coverage/correctness, production availability, backend RBAC, real upload storage, live GPS/geocoder accuracy or native permissions. No live accounts/reports were created and no production network writes were made.

## Blue-brand UI enhancement acceptance

Run the local Next app on **3105** with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4310` as above, then:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules QA_WEB_URL=http://127.0.0.1:3105 node docs/qa/ui-enhancement.cjs
```

`QA_UI_OUTPUT` overrides the default `~/.hermes/cache/scratch/evondev-ui/web-qa/ui-enhancement/`; `QA_CHROME` selects Chrome. `QA_WEB_URL` and `QA_API_ORIGIN` must be credential-free localhost HTTP(S) URLs. No API listener is needed. API reads and the explicitly allowed synthetic profile update are fulfilled in session memory. Unknown endpoints/writes fail acceptance; external API/media/map requests, socket polling, all WebSockets and service workers are blocked. No real accounts, reports, confirmations or location sharing are used.

The runner enumerates **16 page route groups × 1440/390 px × light/dark = 64 route cases**: landing, login, registration, map, chat, reports, report detail, relief, assignments, incident detail, users, overview, tracking, profile, guide and archived source detail. Each route requires its own rendered content/control and exact final pathname, not merely navigation-shell visibility. Incident detail opens the original revision; report detail checks record identity; archived source checks saved Vietnamese text, archive disclosure and unsafe-link exclusion. Each case records keyboard focus and a full-page screenshot, and asserts no document horizontal overflow. External map/socket outage displays are intentional boundaries, not a claim of working live services.

Additional checks exercise real theme dropdown keyboard/return-focus and live theme changes, canonical address selection and synthetic profile save/reload, report search empty/data states, a long Vietnamese report draft with no submission, confirmation dialog name/focus containment/cancel/return-focus without mutation, controlled report loading/empty/error states, and an explicit unknown-page 404 in each viewport/theme. Selected rendered control and pending/urgent status text contrast is measured (4.5:1), converting CSS colors through the browser's canvas and compositing translucent backgrounds; this is not a complete WCAG audit. Screenshots also capture the top/bottom of the actual nested app scroller where needed, rather than assuming `fullPage` expands a scroll container. Every assertion is individually recorded; failures preserve screenshots and visible text and do not prevent the rest of the matrix from running. `results.json` distinguishes expected route total, attempted/passed route cases, all passed/failed assertions, page exceptions, raw console errors, intentional fixture outages, blocked network and unknown routes. Review failure screenshots and narrow/dark images; a successful process or shell screenshot alone does not establish all-route acceptance.

Rerun `vietnam-address-picker.cjs`, `incidents.cjs`, `incident-intelligence.cjs`, `chat-ui.cjs` and `chat-attachment-confirm.cjs` with `QA_WEB_URL=http://127.0.0.1:3105` for existing behavioral regressions. Use their separate output variables documented above. Treat synthetic fixture readback, blocked-network console errors, live backend behavior and actual native runtime acceptance as distinct evidence categories. Final counts must come from the current result JSON, not this planned matrix.

## November 7, 2026 resumed web acceptance

Fresh evidence is under `/Users/macbook/.hermes/cache/scratch/evondev-ui/resume-web/` (not checked into Git). `acceptance-summary.json` aggregates the final result files; `browser-exits.json` preserves commands, environment overrides and process exit codes. All six final browser processes exited **0**:

| Runner | Passed checks | Result file relative to evidence root |
| --- | ---: | --- |
| Blue-brand UI enhancement | **108/108** | `final-ui-enhancement/results.json` |
| Vietnam address picker | **35/35** | `final-vietnam-address-picker/results.json` |
| Incidents | **16/16** | `final-incidents/results.json` |
| Incident intelligence | **38/38** | `final-incident-intelligence/results.json` |
| Chat UI | **29/29** | `final-chat-ui/results.json` |
| Chat GPS/photo explicit confirmation | **18/18** (9 checks × 2 widths) | `final-chat-attachment-confirm/results.json` |

Total: **244 fixture-backed browser checks**. UI enhancement includes **64/64 exact route cases**, with **0 page exceptions**, **0 unknown API routes/unexpected operational writes**, and **0 React hydration/invalid-nesting diagnostics**. It captured **198 PNGs**, including nested-scroller top/bottom views. Raw console errors remain recorded: 32 intentionally blocked-resource messages, 8 expected synthetic 503 responses and 4 expected 404 responses. They are not page exceptions or hidden application failures. The other runners also recorded no page exceptions in their respective `errors`/`pageErrors` fields.

Final static gates, recorded separately as `final-{test,types,lint,build}.log` and `final-static-exits.json`, all exited **0**:

- `npm test`: **62 test files / 317 tests passed**.
- `npx tsc --noEmit`: passed.
- `npx eslint src/components src/features docs/qa/ui-enhancement.cjs`: passed, no output/warnings. CSS is not covered by this scoped ESLint command; it is exercised through the build and browser matrix.
- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4310 npm run build`: passed, including **16/16 static pages**. TypeScript and production compilation do not substitute for browser acceptance.

### Verified fixes and inspected images

- Dark translucent warning badges used the solid-warning dark foreground: rendered pending-status contrast was **1.70:1**. The badge now uses the dark theme's warning text, measured at **6.46:1**. Urgent status text measured **4.67:1** in dark and **5.14:1** in light; light pending text measured **15.44:1**. These are sampled status combinations, not a full accessibility audit.
- Incident detail placed a block badge inside a paragraph. A block wrapper now preserves the content and removes React invalid-nesting/hydration diagnostics; the matrix explicitly fails if these recur.
- Profile password visibility buttons occupied separate full-width rows and labels did not target their inputs. Labels now focus their fields; the existing visibility handlers are preserved in compact inline controls. Browser checks verify all three labels/toggles, password/text/password transitions, **44×44px** unshrunk targets and no password-change request in all four viewport/theme combinations.
- Updated two stale unit assertions for the approved palette and the styled semantic weather fieldset; retained the existing weather radio/switch checks.
- Screenshot capture now uses `caret: 'initial'`, avoiding Playwright's temporary inline caret styling racing early SSR-form hydration. This does not suppress genuine console diagnostics.

Visually inspected fresh desktop/narrow light/dark report, profile, chat and dialog images, including long Vietnamese text, nested-scroller bottom actions and the password-control fix. Contact sheets: `final-narrow-profile-chat-inspection.png`, `final-narrow-report-dialog-inspection.png`, and `final-desktop-profile-chat-inspection.png`. Original full-resolution images are in `final-ui-enhancement/`. No remaining clipping/contrast defect was found in these inspected representative views; this is not a claim that every pixel or all WCAG criteria were audited.

### Interrupted Chromium investigation and isolation

The old `web-qa/final-ui-enhancement.log` is **incomplete, not passing**: it recorded 44 passed checks and 3 failed state checks before `browser.newContext: Target page, context or browser has been closed`, with repeated macOS `CVDisplayLinkCreateWithCGDisplay` errors and allocator/GPU messages. Its route/state matrix never completed. Those logs establish browser interruption, not the exact reason the process closed. The fresh full matrix instead used isolated **Chromium headless shell 147.0.7727.15**, without closing or reusing the user's Chrome session:

```sh
export PATH=/opt/homebrew/bin:$PATH
export NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules
export QA_WEB_URL=http://127.0.0.1:3105
export QA_API_ORIGIN=http://127.0.0.1:4310
export QA_CHROME='/Users/macbook/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell'
python3 /Users/macbook/.hermes/cache/scratch/evondev-ui/resume-web/run-browser.py
```

The scratch orchestration invokes each original runner through `node --require .../resume-web/network-guard.cjs`, sets the corresponding output variable, disables service workers, blocks all WebSockets, socket polling and remote image-optimizer proxies, and allows network fallthrough only for GET/HEAD on the exact localhost app origin. API operations and catalogue requests must be fulfilled by synthetic fixture handlers, not sent to either a live server or the internet. Guard events are recorded in `network-guard.jsonl`. No API listener was needed on 4310. The first complete diagnostic UI attempt (`ui-enhancement/`) exposed the contrast defect; `before-password-polish/` retains the intermediate complete six-runner pass. `password-target-failure/` retains the stopped attempt whose new target-size assertion caught flex-shrinking eye buttons before `shrink-0` was added. Only the final directories in the table above establish final acceptance.

**Boundaries:** no commit, push, deployment or production mutation. Existing blue-brand, address-picker, role guards, report GPS/photos and confirmation behavior remain intact. No browser gate is currently blocked. Live backend persistence/RBAC, external maps/media/sockets, full WCAG conformance, native iOS/Android and Expo-web acceptance are outside these web results; mobile evidence is reported independently.

## Direct user-report relief acceptance (rev12 — current `/cuu-tro` scope)

`/cuu-tro` now reads `listReports(role)` directly. It must show pending/verified/resolved/rejected reports without incident creation, AI ranking, assignment or pipeline actions. `/phan-cong` and `/su-co/[id]` retain their existing behavior. **All earlier `/cuu-tro` incident/intelligence passes above are historical, superseded evidence, not a current default-page pass.** Do not run the unadapted incident/intelligence runners as acceptance for the new default page; their old route assumptions can fail even when rev12 is correct. Historic totals and artifacts above are intentionally retained.

Wait for the parent-owned production build and localhost server on **3105**; these QA scripts do not build/start a server. From `/Users/macbook/Vietflood_FE_Clone`:

```sh
export PATH=/opt/homebrew/bin:$PATH
export NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules
export QA_WEB_URL=http://127.0.0.1:3105
export QA_API_ORIGIN=http://127.0.0.1:4310
export QA_CHROME=/Users/macbook/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell
export QA_RELIEF_OUTPUT=/Users/macbook/.hermes/cache/scratch/report-relief-fix/report-relief
export QA_ADDRESS_OUTPUT=/Users/macbook/.hermes/cache/scratch/report-relief-fix/vietnam-address-picker
export QA_UI_OUTPUT=/Users/macbook/.hermes/cache/scratch/report-relief-fix/ui-enhancement
export QA_GUARD_OUTPUT=/Users/macbook/.hermes/cache/scratch/report-relief-fix/guards
mkdir -p "$QA_GUARD_OUTPUT"
node docs/qa/report-relief.cjs
# Retain the existing outer network guard for legacy regression runners:
node --require /Users/macbook/.hermes/cache/scratch/evondev-ui/resume-web/network-guard.cjs docs/qa/vietnam-address-picker.cjs
node --require /Users/macbook/.hermes/cache/scratch/evondev-ui/resume-web/network-guard.cjs docs/qa/ui-enhancement.cjs
```

The guard path is a machine-local prerequisite documented in the historic isolation section; if unavailable, restore that guard before running these legacy suites rather than silently dropping socket/image-proxy protections. The dedicated `report-relief.cjs` has its own socket/external/media-proxy/write guards. No API server on 4310, live credentials, commit/push/deploy or production writes are required or permitted.

Dedicated scope: **Admin + Relief × 1440/390 px × light/dark**, 12 scenarios per session. Fixtures are nine explicitly synthetic reports spanning all four statuses, legacy/canonical HCM/Tăng Nhơn Phú, exact UTC+7 start/end-day edges, missing/invalid dates and `created_at` fallback. Assertions cover initial pending visibility and exact identities/detail links; draft/Apply/Reset and no filter fetch; combined **16/10/2026–01/11/2026 + HCM/Tăng Nhơn Phú** screenshots in every matrix cell; each status; Vietnamese accentless `đ/d` search; inclusive/open/same-day date handling, a range over 31 days and invalid reversed range preserving prior results; invalid uncommitted picker draft; actual `/bao-cao/101` navigation; controlled loading/error/retry/refresh; and distinct API-empty/no-match states. All `/incidents*` requests receive synthetic **503** and are recorded as acceptance failures even if the UI ignores them. Every operational write is denied. No fixtures are added to make the new relief page depend on incidents.

`QA_RELIEF_OUTPUT` defaults to `~/.hermes/cache/scratch/report-relief/`. `results.json` schema:

- `evidenceKind`, `base`, `api`, `generatedAt`, `matrix: [{role,width,theme}]`, `limitations`.
- `expectedScenarioCases` (planned 96), `scenarioCasesAttempted`, `scenarioCasesPassed`, `passed`, `failed`.
- `results: [{name,kind: "scenario"|"coverage"|"safety",status: "passed"|"failed",details?,error?,screenshot?}]`; successful screenshot details include `screenshot` and `extraScreenshots` for nested-scroller top/bottom views.
- `requests`, `blocked`, `unexpected`, `incidentRequests`, `writes`, `pageErrors`, `consoleErrors`; request records contain `label`, `method`, `path`, `query`, `mode`. Raw console errors are retained separately from uncaught exceptions/hydration failures; synthetic 503 and blocked-resource diagnostics are expected only for their explicit scenarios.

The process exits nonzero on assertion/startup failure and persists progress after each check; a partial JSON is not a pass. Require all matrix scenarios plus safety/coverage checks to pass, zero `incidentRequests`/`writes`/`unexpected`/`pageErrors`, and review real narrow/dark and combined-filter PNGs before claiming browser acceptance. `vietnam-address-picker.cjs` now checks `/cuu-tro` by client-rendered report IDs/counters (not incident query strings), while preserving its `/phan-cong` network regression; `ui-enhancement.cjs` expects report description text only for `/cuu-tro`, leaving other routes unchanged. Their result schemas/output overrides remain as documented above. Runner preparation/static checks alone are not a browser pass.

### Rev12 local evidence — November 7, 2026

Fresh runs against the parent-started production localhost server exited **0**: dedicated relief **100/100** (96/96 matrix scenarios + four safety/coverage checks), address **35/35**, broad UI **108/108** with **64/64** exact route cases. The dedicated runner recorded zero incident requests, operational writes, unknown API requests and page exceptions. Address and broad UI recorded zero page exceptions/unknown routes; their intentionally synthetic mutation regressions remain intercepted, not real backend writes. Scoped runner ESLint and `node --check` passed.

Evidence: `~/.hermes/cache/scratch/report-relief-fix/{report-relief,vietnam-address-picker,ui-enhancement}/results.json`, `browser-exits.json`, `acceptance-summary.json`, regression logs and PNGs. Representative actual desktop/narrow light/dark combined-filter images, narrow card bottoms and long-text broad-UI relief images were inspected: dates 16/10/2026–01/11/2026, canonical HCM/Tăng Nhơn Phú, `3 / 9` results and pending/urgent report #101 are visible without horizontal clipping in the inspected views. This is sampled visual inspection, not a full accessibility audit.

An initial address run stopped because its fixed 06/11 report aged past the existing 24-hour citizen-edit window; preserved at `address-time-window-failure/` and `first-*.json`. Only that create/edit scenario now fixes browser time to 07/11/2026 13:00 UTC+7, keeping the original fixture inside the existing window without changing product permissions. Final full reruns passed. The old outer guard also requires an existing `QA_GUARD_OUTPUT` directory (included in the commands above); omitting it causes a harness startup error, not a product failure. No product files/server lifecycle or production data were changed by this QA work.

## Acceptance limits

Inspect the final verification report and feature matrix for unresolved checks. Treat startup directory listings, empty pages, redirects, and service-failure screens as failures unless explicitly expected by that test. Source screenshots and fixture answers are not real flood reports or emergency guidance. Do not deploy these fixtures or test JWTs.
