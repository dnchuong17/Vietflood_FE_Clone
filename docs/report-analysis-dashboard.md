# Admin report analysis — `/cuu-tro`

## Scope

The operational route lives in `Vietflood_FE_Clone`, not the separate minimal `VietFlood_FE` application. The admin-only analysis panel uses the existing role-scoped `listReports(role)` collection. Relief retains the original report list and filters; citizen/anonymous route guards remain unchanged. No backend/mobile edits, commits, deployments or production mutations were performed.

The dashboard retains API normalization, deduplication and the existing test tooling. The current web-only change removes urgency classification, counts, quick scopes and ordering effects. Stored API fields and original report content remain unchanged. Historical acceptance below describes earlier implementations, not a fresh pass for this change.

## Dashboard

- Unique-ID report total, pending/verified unfinished count, resolved count and identified-location count.
- Clickable status distribution, last seven report-bearing Vietnam calendar dates, province distribution and location drilldown.
- Locations ordered by total reports, unfinished count and stable key tie-break; urgency flags do not affect ordering.
- Region and exact-location drilldown scope original reports without an urgency toggle. Clearing the quick scope restores the list; Apply, Reset and quick status changes clear selection.
- Charts remain based on the full applied-filter collection, independent of list pagination and quick location/region drilldown. The quick-scope notice explicitly states this boundary.
- Date/address/status/search filters remain draft-until-Apply; invalid filters preserve the previous applied scope. Date handling is inclusive Vietnam UTC+7 with open endpoints and no inherited incident 31-day restriction.
- Original reports retain detail links. Pagination renders at most twelve reports per page without changing summary counts.
- Loading, API failure, marked stale refresh data, actual empty collections, filter-empty and quick-scope-empty states remain distinct.

## Duplicate protection and limits

1. **Repeated valid report ID:** count/list once, retaining the first API occurrence. Conflicting payloads produce a visible warning; no freshness claim is made without an update timestamp. Missing/invalid IDs are preserved rather than silently discarded.
2. **Same identifiable location:** one analytical location row for a complete normalized province/ward/street address; otherwise use an exact valid GPS pair. Administrative-name aliases, Unicode normalization, case and whitespace are handled. House-number punctuation and street accents are retained. Coordinates are not rounded or clustered by distance; missing positions are not all collapsed into a fictitious location.
3. **Different report IDs at the same location:** remain separate reports and remain included in totals. Repeated location does not prove repeated need or incident.
4. **Possible duplicate submissions:** the helper retains advisory comparison groups requiring matching identified location, normalized description, reporter identity and category set within a one-hour anchored window. The dashboard no longer renders the “Báo cáo có thể trùng” suggestions or “Cách đếm và giới hạn chống trùng” explanation panels. Original reports and their detail links remain in the main list; ID deduplication and exact-location analysis are unchanged.

This is read-only dashboard deduplication and review support. It does **not** prevent duplicate creation at the backend, erase stored records, certify real-world location identity or automatically merge incidents. Submission idempotency and database-level duplicate prevention would require a separately scoped backend change.

## Baseline verification — November 7, 2026

Executed from the operational frontend with the supported Homebrew Node runtime:

```sh
PATH=/opt/homebrew/bin:$PATH npm test
PATH=/opt/homebrew/bin:$PATH npx tsc --noEmit
PATH=/opt/homebrew/bin:$PATH npx eslint src/features/relief src/features/reports/api/reports.ts src/features/reports/api/reports.test.ts tests/e2e docs/qa/report-relief.cjs
PATH=/opt/homebrew/bin:$PATH npm run test:e2e
PATH=/opt/homebrew/bin:$PATH npm run test:qa
```

Results:

- Unit tests: **65 files / 382 tests passed**, including 44 report-analysis helper tests.
- TypeScript and scoped ESLint: passed.
- Production build: passed through both browser entry points, including `/cuu-tro`.
- Playwright E2E: **132/132 passed**, desktop 1440px/narrow 390px × light/dark. Includes unique-ID/candidate/exact-location behavior, admin-only controls, urgency/location intersection and empty recovery, draft/Apply/Reset, full-scope metrics, pagination, retry/staleness, authentication/role guards and direct report-detail navigation.
- Legacy fixture regressions: **290/290 passed** across five suites: report relief 100, Vietnam address picker 35, broad UI 108, chat UI 29 and explicit chat attachment confirmation 18.

Final E2E machine report: `test-results/results.json`; screenshots and fixture request audits: per-test subdirectories and `playwright-report/`.

Final regression report: `test-results/qa-regressions/2026-11-07T16-01-16-112Z-55213/summary.json` and suite-specific `results.json` files.

Representative desktop-light and narrow-dark summary, location and candidate sections were visually inspected, including wrapped Vietnamese labels, numeric counts, grouped locations and original comparison links. Section screenshots scroll the actual app scroller rather than assuming a full-page image expands it.

Two test harness assumptions were corrected without weakening behavior: comparison links are asserted individually (section text concatenation can join a report number to the next GPS label), and the status filter is queried by its combobox role rather than an ambiguous label shared with the new chart region.

## Evidence boundary

All browser API/catalogue results are explicitly synthetic, fulfilled in memory with external network/write guards. Relief tests require zero incident requests, unexpected API requests, operational writes and uncaught page exceptions. Other explicit profile/chat mutation regression scenarios remain fixture-only. Results are not proof of live backend/database RBAC, production availability, real weather/maps/media, native behavior or full WCAG conformance. No real flood reports or accounts were created or removed.

## Regional Recharts dashboard

The current extension installs pinned `recharts@3.10.1` and its matching React peer `react-is@19.2.3` using the project's npm lockfile. Official Recharts BarChart guidance and installed TypeScript declarations were consulted. Existing unrelated dependency advisories were not force-upgraded.

- `report-areas.ts` builds separate administrative province and province-qualified ward rollups. Volume is the primary ordering, then unfinished count and deterministic key tie-breaks. Known division aliases are normalized only for lookup; labels and source reports are retained.
- Repeated valid report IDs count once. Different IDs remain distinct even with identical content/addresses. Same ward names in different provinces never share a group.
- The main horizontal Recharts BarChart shows the top eight regions by report volume. An adjacent, scrollable full ranking retains every region and full Vietnamese name, with total/open counts and share of the complete applied scope.
- Province/ward controls switch the regional granularity. Clicking a bar or pressing Enter on a ranked row scopes original reports without fetching/writing the API or changing chart totals. Selecting a precise location replaces region selection; urgency flags never narrow the list. Apply, Reset, status changes or changing region level clear the selected region.
- Missing province/ward values are disclosed separately and remain in overall counts/list. GPS alone is not reverse-geocoded into an invented administrative area. Administrative aggregation is not exact-location deduplication or incident merging.
- The daily trend uses Recharts AreaChart with the total-report series only. Charts use theme tokens, accessible textual alternatives, fixed responsive parent heights, and no chart entrance animation.

### Historical verification before urgency removal

- Unit tests: **66 files / 388 tests passed**, including six additional regional grouping tests.
- TypeScript, scoped relief/E2E ESLint, `git diff --check`, and production build: passed.
- E2E: **140/140 passed** at 1440/390px, light/dark, including actual SVG rendering, bar clicks, keyboard area selection, province/ward counts after ID deduplication, unknown addresses, ten distinct same-named wards, the top-eight limit with full ranking preserved, urgency intersection and clear/reset.
- Five regression suites: **290/290 passed**. Relief audit has zero unexpected API calls, incident requests, operational writes and uncaught page errors.
- A mobile visual inspection caught the initial flex header squeezing the description beside the region switch; it now stacks on narrow screens. A minimum heading-width assertion complements document overflow checks, and the full suites were rerun after the fix.

Final preserved E2E report: `/Users/macbook/.hermes/cache/scratch/recharts-area-review/e2e-final-results.json`, started `2026-11-07T16:42:23.228Z`. Its exact source run reported 140 expected, zero unexpected/skipped/flaky cases. Screenshots are in `recharts-area-review/e2e-final/`, including `analysis-summary-report-area-heading.png` and `area-chart-rendered.png`. Desktop-light and narrow-dark screenshots were visually inspected.

Final regression report: `test-results/qa-regressions/2026-11-07T16-45-09-407Z-48156/summary.json`, with a preserved copy at `/Users/macbook/.hermes/cache/scratch/recharts-area-review/qa-final-summary.json`.

Earlier attempts in this extension are not final passes: a concurrent local E2E run occupied port 3105 and removed shared report files during one regression run. That run's individual checks passed but the required browser/context audit was incomplete. Its status stayed failed; the final sequential run above passed both assertions and isolation audits. No other process was terminated to obtain the final result.

The current urgency-removal changes remain local and uncommitted; they do not deploy changes or prove live report correctness.

## Web urgency removal — verified November 25, 2026

The approved web-only change removes urgency badges/counts/filters/series, urgency-based ordering and assignment deadline overrides. Dashboard cards now show unique reports, unfinished reports, resolved reports and identified locations. Regional Recharts, exact-location drilldown, duplicate protection, original source descriptions, attachments/GPS/contact, guards and operational actions remain. Severity-derived high/medium/low assignment behavior and official incident severity are retained; API DTO fields and backend storage are unchanged.

Incident/assignment views no longer mount or poll the emergency feed or show estimated-priority evidence in detail/web export. The incident overview's `highPriority` card is also removed: the backend aggregate includes emergency source flags, so retaining it would indirectly preserve urgency classification. Its API contract remains intact.

Fresh final verification after the aggregate-card fix:

- Unit: **67 files / 409 tests passed**.
- TypeScript, scoped ESLint, diff whitespace checks and production builds: passed.
- Playwright: **140/140 passed**, no skipped, unexpected or flaky cases; 1440/390px × light/dark. Includes true/false legacy-flag invariance of IDs, rankings and metrics, region/bar/keyboard drilldown, filtering, retry/stale data, pagination and guards.
- Five fixture UI regression suites: **291/291 passed** (100 relief + 35 address + 109 broad UI + 29 chat + 18 attachment confirmation). Broad UI includes **64/64 route cases**, zero emergency-feed calls, unknown API requests and uncaught page exceptions. Relief records zero incident requests, operational writes, unknown API requests and page exceptions.
- Desktop-light summary and narrow-dark region charts, report list/detail, incident detail and final four-card assignment overview screenshots were visually inspected. Original prose containing “khẩn cấp” remains visible; product badges/filters are absent. This is sampled visual inspection, not a full accessibility audit.

Preserved final evidence:

- E2E: `/Users/macbook/.hermes/cache/scratch/remove-web-urgency/e2e-final/results.json`, run started `2026-11-25T16:51:37.368Z`.
- QA: `test-results/qa-regressions/2026-11-25T16-53-26-251Z-52491/summary.json`, preserved with screenshots/network audits at `/Users/macbook/.hermes/cache/scratch/remove-web-urgency/qa-final-verified/`.

The first QA attempt failed only its aggregate count contract: adding the explicit emergency-feed safety check raised broad UI from 108 to 109. The runner manifest was corrected and all suites rerun. Historical passing totals above remain unchanged and are not counted as current evidence. All results use synthetic localhost fixtures, not live backend/production/native acceptance. No backend/mobile changes, data migrations, commits, pushes or deployments were performed.
