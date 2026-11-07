# Web E2E tooling and fixture UI regressions (rev14)

This is the current portable entry point. Earlier machine-local commands and acceptance results in `README.md` are historical evidence, not prerequisites for these commands and not a fresh pass.

## Install and run

From the web repository root, use a Node runtime supported by the application and the checked-in npm lockfile:

```sh
PLAYWRIGHT_SKIP_BROWSER_GC=1 npm ci
PLAYWRIGHT_SKIP_BROWSER_GC=1 npm run e2e:install
npm test
npm run test:e2e
npm run test:qa
```

`@playwright/test` and `playwright` are direct local dependencies pinned to **1.59.1**. Do not migrate package managers or install a global test package. Browser installation keeps `PLAYWRIGHT_SKIP_BROWSER_GC=1`, including when `PLAYWRIGHT_BROWSERS_PATH` is inherited from a shared tool environment: do not garbage-collect another tool's browsers. No install is necessary if the matching bundled browser is already available.

- `test:e2e`: the separate Playwright Test specs/configuration, with their own reporter artifacts.
- `test:e2e:ui`: Playwright's interactive test runner.
- `test:qa`: the five existing standalone regression scripts, sequentially orchestrated by `scripts/qa/run-regressions.cjs`.
- `test:all`: the root package's combined test entry point; inspect `package.json` for its exact sequence.

**Run `test:e2e` and `test:qa` separately, never concurrently.** Both own localhost port **3105**. Stop a manually started app yourself before running them. The regression orchestrator refuses an occupied port rather than killing or reusing an unknown process; it also checks the IPv6 loopback binding. Do not point these commands at production.

## Regression server lifecycle

`test:qa` builds Next with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4310`, then starts the production server on exactly `http://127.0.0.1:3105`. It waits for a successful local HTTP readiness response and runs all five suites. API port **4310 must not host a real backend**: API/catalogue handlers fulfill synthetic data in browser memory. No API listener is required.

The script uses the current Node executable and locally resolved Next/Playwright modules. It replaces legacy machine-specific Chrome/output defaults without modifying the historical runners. By default Playwright selects its installed bundled headless browser, honoring its normal browser environment. Optional `QA_CHROME` must name an existing executable local file (a local `file:` URL is also accepted); HTTP URLs and credentials are rejected. Do not supply real credentials or test tokens from an account.

The orchestrator bounds build, startup and each child run. Defaults:

| Environment override | Default | Meaning |
| --- | ---: | --- |
| `QA_BUILD_TIMEOUT_MS` | 600000 | Production build deadline |
| `QA_SERVER_TIMEOUT_MS` | 90000 | Startup/readiness deadline |
| `QA_SUITE_TIMEOUT_MS` | 600000 | Deadline for each legacy runner |

Each override must be an integer between 1000 and 3600000 milliseconds. The server also has a bounded overall lifetime. Teardown stops owned process groups on POSIX (process trees via `taskkill` on Windows); TERM escalates to KILL. Normal completion, build/runner failures, timeout, SIGINT, SIGTERM and SIGHUP retain artifacts and tear down owned children. No program can guarantee cleanup following host failure or an uncatchable SIGKILL; inspect ownership before manually removing any remaining process. Windows teardown code is provided but must not be described as tested on Windows unless actually exercised there.

A failed suite does not suppress the remaining suites unless interrupted or the owned server dies. A missing/partial result is a failure, not a pass. The address report-edit scenario already fixes its browser clock to **November 7, 2026, 13:00 UTC+7** so the synthetic report remains inside the existing 24-hour citizen-edit window; the product's permission logic is not changed.

## Network isolation

Every legacy runner is launched with the committed `tests/e2e/network-guard.cjs` preload. It:

- forces `serviceWorkers: 'block'` for browser contexts;
- blocks all browser WebSockets, including later legacy socket handlers, and HTTP `/socket.io` polling;
- blocks credential-bearing URLs and remote/protocol-relative image-optimizer sources;
- permits real network fallthrough **only for GET/HEAD on the exact app origin**;
- permits API/catalogue/mutation fixtures only through in-memory `route.fulfill`, never `route.fetch` or live-response fulfillment;
- wraps context and page handlers so legacy `route.continue()` becomes `route.fallback()` and reaches the bottom deny rule instead of bypassing it;
- records browser/context initialization, local reads, fulfilled fixture responses, blocked traffic, uncaught page exceptions and hydration diagnostics in `network-guard.jsonl`.

Blocked external resource/socket attempts are intentional and retained, not automatically treated as broken UI. Uncaught page errors, hydration/nesting diagnostics, unexpected fixture 404/501 responses and missing guard initialization fail orchestration. API writes seen in fixture request audits are not network writes: explicit profile/chat/upload/confirmation scenarios must be fulfilled in memory. Relief additionally requires zero incident requests and operational write attempts in its own report.

The guard is for these trusted checked-in regression scripts, not an OS sandbox for arbitrary untrusted programs. It does not intercept server-side Node network APIs.

## Suites, artifacts and result schema

All new regression artifacts live under the ignored root:

```text
test-results/qa-regressions/<ISO-time>-<pid>/
  summary.json
  build.log
  server.log
  <suite>.log
  <suite>/results.json
  <suite>/failure.json            # when emitted by the original runner
  <suite>/network-guard.jsonl
  <suite>/*.png                   # original screenshots/failure evidence
```

Each invocation has a fresh directory; failed/interrupted runs are not overwritten. The terminal prints the exact summary path. No historic scratch directory is required.

| Suite (order) | Output variable set by orchestrator | Expected individual checks | Result source |
| --- | --- | ---: | --- |
| `report-relief` | `QA_RELIEF_OUTPUT` | 100 | `results[]` statuses; 96 scenario cases plus coverage/safety |
| `vietnam-address-picker` | `QA_ADDRESS_OUTPUT` | 35 | `checks[]` strings and `passed`; `failure.json` retained on early failure |
| `ui-enhancement` | `QA_UI_OUTPUT` | 108 | `results[]` statuses, including all 64 route cases |
| `chat-ui` | `QA_CHAT_OUTPUT` | 29 | `results[]` statuses, `passed`/`failed`, page exceptions |
| `chat-attachment-confirm` | `QA_ATTACHMENT_OUTPUT` | 18 | Two `cases[]`, each `status: passed`, nine `checks[]`, zero page exceptions |

The expected total is **290 individual fixture UI checks across five suites**. These are **not 290 Playwright Test cases**, nor proof of backend persistence or a new run result. Counts must come from the new result files; every declared count/status is checked against its schema. Relief must complete 96/96 scenarios and broad UI 64/64 route cases. Unexpected API/write arrays, page exceptions, failures and relevant console diagnostics are asserted separately. Raw expected blocked-resource/synthetic-outage console messages remain in original reports.

`summary.json` records:

- run metadata: `runId`, `startedAt`, `finishedAt`, `base`, `api`, `evidenceKind`, `status`, `interrupted`, `errors`;
- planned totals: `expectedSuites`, `expectedChecks`; actual `checkCount`, `passed`, `notRun` suite identifiers;
- build/server subprocess details: `pid`, `log`, `exitCode`, `signal`, `timedOut`, `error`;
- `suites[]`: `id`, `expectedChecks`, `status`, `notRun`, subprocess details, `checkCount`, `passed`, `failed`, `errors`, `output`, `report`, and network event counts when available.

Unstarted entries retain `status: notRun`, `notRun: true`, `exitCode: null` and zero observed checks. Interrupted current children retain their exit/signal/timeout and any partial report. Only all five complete schemas, successful child exits and safety assertions produce `status: passed` / exit 0. SIGINT returns 130, other handled termination signals 143, failures 1.

## Evidence boundaries and review

These commands exercise the actual browser UI with synthetic API/catalogue responses. They do **not** establish backend/database persistence, real JWT/RBAC enforcement, production availability, live map/media/socket delivery, AI quality, a complete accessibility audit, or native iOS/Android behavior. Inspect real screenshots, especially narrow/dark states and combined relief filters, before a visual acceptance claim. A screenshot capture alone is not a visual inspection.

The old `incidents.cjs` and `incident-intelligence.cjs` are intentionally **not** in this default regression list: their historic `/cuu-tro` assumptions were superseded by the direct-report relief page. Historic evidence in `README.md` remains unchanged.

Existing application dependency audit advisories are a separate issue; installing the test tooling is not a dependency-security remediation or authorization to force-update the application.
