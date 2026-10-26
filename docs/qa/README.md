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

## Acceptance limits

Inspect the final verification report and feature matrix for unresolved checks. Treat startup directory listings, empty pages, redirects, and service-failure screens as failures unless explicitly expected by that test. Source screenshots and fixture answers are not real flood reports or emergency guidance. Do not deploy these fixtures or test JWTs.
