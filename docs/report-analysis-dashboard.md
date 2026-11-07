# Admin report analysis — `/cuu-tro`

## Scope

The operational route lives in `Vietflood_FE_Clone`, not the separate minimal `VietFlood_FE` application. The admin-only analysis panel uses the existing role-scoped `listReports(role)` collection. Relief retains the original report list and filters; citizen/anonymous route guards remain unchanged. No backend/mobile edits, commits, deployments or production mutations were performed.

The existing in-progress dashboard, API normalization and test-tooling changes were preserved. This completion added urgent-report drilldown, location priority ordering, empty quick-scope recovery and browser regression coverage; it verified the existing deduplication and analysis behavior rather than replacing it.

## Dashboard

- Unique-ID report total, pending/verified unfinished count, explicit urgent count and identified-location count.
- Clickable status distribution, last seven report-bearing Vietnam calendar dates, province distribution and location drilldown.
- Locations ordered by urgent report count, unfinished count, total reports and stable label/key tie-break.
- Admin quick urgency toggle combines with location selection and resets the report page. Clearing either scope restores the corresponding list; Apply, Reset and quick status changes clear quick urgency selection.
- Charts remain based on the full applied-filter collection, independent of list pagination and quick location/urgency drilldown. The quick-scope notice explicitly states this boundary.
- Date/address/status/search filters remain draft-until-Apply; invalid filters preserve the previous applied scope. Date handling is inclusive Vietnam UTC+7 with open endpoints and no inherited incident 31-day restriction.
- Original reports retain detail links. Pagination renders at most twelve reports per page without changing summary counts.
- Loading, API failure, marked stale refresh data, actual empty collections, filter-empty and quick-scope-empty states remain distinct.

## Duplicate protection and limits

1. **Repeated valid report ID:** count/list once, retaining the first API occurrence. Conflicting payloads produce a visible warning; no freshness claim is made without an update timestamp. Missing/invalid IDs are preserved rather than silently discarded.
2. **Same identifiable location:** one analytical location row for a complete normalized province/ward/street address; otherwise use an exact valid GPS pair. Administrative-name aliases, Unicode normalization, case and whitespace are handled. House-number punctuation and street accents are retained. Coordinates are not rounded or clustered by distance; missing positions are not all collapsed into a fictitious location.
3. **Different report IDs at the same location:** remain separate reports and remain included in totals. Repeated location does not prove repeated need or incident.
4. **Possible duplicate submissions:** advisory comparison groups require matching identified location, normalized description, reporter identity and category set within a one-hour anchored window. Each report links to its original detail. Different senders, locations, incomplete identities or dates are not silently merged.

This is read-only dashboard deduplication and review support. It does **not** prevent duplicate creation at the backend, erase stored records, certify real-world location identity or automatically merge incidents. Submission idempotency and database-level duplicate prevention would require a separately scoped backend change.

## Verification — November 7, 2026

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
