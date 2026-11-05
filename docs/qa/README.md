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

## Chat GPS/photo confirmation

With the fixture-facing localhost Next process above running:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/chat-attachment-confirm.cjs
```

This localhost-only runner intercepts every API request and blocks unexpected remote requests and app-origin writes. Confirmation captures synthetic multipart data only; it never creates a real report or uploads a photo. It checks desktop/narrow layouts, zero coordinates, reopening the active conversation, switching away/back, a native reload/discard warning even for inactive cached drafts, selection retention after a failed confirmation, exact GPS/photo bytes on explicit confirmation/retry, cancellation privacy and replacement-proposal isolation.

Attachments remain in the mounted workspace's memory. Accepting a discard/reload prompt or unmounting the workspace is not claimed to preserve files permanently. Results and screenshots default to `~/.hermes/cache/scratch/chat-attachment-confirm/`; override with `QA_ATTACHMENT_OUTPUT`. This is frontend/payload coverage, not live storage or native iOS proof.

## AI Flood Intelligence / incident acceptance (rev8)

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

**Evidence boundaries:** browser fixtures are not PostgreSQL/HTTP-JWT integration, live RBAC, real tiles, model/clustering validation, production availability or a Vietnamese backend PDF/font/layout pass. The local binary PDF is intentionally labeled synthetic and only proves authenticated transport/download handling. The parent backend acceptance must independently verify actual API-generated Vietnamese PDFs. Existing AI summaries are never invented when missing. Editor UI accepts title 3–200 chars and body 3–4000 chars (gateway allows up to 12,000); report periods use Vietnam UTC+7 and max 31 inclusive days. Editorial `reason` is rendered when provided by the updated backend; older responses honestly point to audit history rather than fabricating provenance.

## Acceptance limits

Inspect the final verification report and feature matrix for unresolved checks. Treat startup directory listings, empty pages, redirects, and service-failure screens as failures unless explicitly expected by that test. Source screenshots and fixture answers are not real flood reports or emergency guidance. Do not deploy these fixtures or test JWTs.
