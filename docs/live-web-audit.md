# Deployed web audit — vflood.vercel.app

Audit timestamp: `2026-10-26T16:11:08.581Z`.

## Scope and outcome

Real deployed-site browser testing, **anonymous and read-only**. No API fixtures, supplied server secrets, fake authentication tokens, account creation, database changes or production mutations were used. The runner blocked non-GET/HEAD/OPTIONS requests; **zero mutation attempts** occurred.

**36 assertions: 21 passed, 15 failed. The failures represent 3 distinct issues, not 15 independent bugs.** There were no uncaught JavaScript exceptions. A dedicated test login is not yet available, so signed-in reporting, uploads, profile changes, user administration, relief assignments, chat and tracking are not marked verified on the deployed site.

## Confirmed findings

| ID | Severity | Finding | Reproduction and evidence | Local remediation |
|---|---|---|---|---|
| LIVE-01 | Medium, responsive UX | Landing page horizontally overflows with normal motion at mobile/tablet widths | Open `/` at 390px or 768px with reduced motion off. After animation settling, document width is 396px/774px respectively, 6px wider than the viewport. Reduced-motion checks and 1440px checks pass. `evidence/live/landing-390-no-preference.png`, `failure-0.png`, `failure-3.png`. | Local redesign includes an overflow-safe landing wrapper and revised animations. The same full public browser regression suite passes locally: 36/36 checks. Not deployed. |
| LIVE-02 | Medium, accessibility/semantics | Sign-in and registration have no level-one main heading | Open `/dang-nhap` or `/dang-ky`; inspect headings. The pages render but lack an `h1` at all three checked widths and both motion preferences. This accounts for 12 failed assertions. `evidence/live/dang-nhap-390-reduce.png`, `dang-ky-1440-no-preference.png`. | AuthFormCard now renders its page title as an `h1`. Added regression assertion; targeted tests, scoped ESLint and TypeScript pass. Not deployed. |
| LIVE-03 | Medium, authentication UX | Saved-source route does not redirect signed-out visitors | Visit `/tro-ly/nguon/qa-doc/1` without a session. It makes an unauthenticated source request, receives HTTP 401, attempts refresh without a refresh token, and displays a generic source-load error instead of sign-in navigation. `evidence/live/failure-29.png` and `.txt`. | Source content now mounts behind AppShell, with shared navigation, identifier validation and retryable error handling. Added regression assertions; targeted tests, scoped ESLint and TypeScript pass. The full public browser regression suite passes locally: 36/36 checks, including this redirect. Not deployed. |

**LIVE-03 is not evidence of a data disclosure:** the backend source endpoint correctly rejected the anonymous request with HTTP 401. A fabricated document identifier was used only to exercise the route; no real saved source content was fetched.

## Passed checks

- Anonymous access to map, chat, reports, report detail, tracking, relief, assignments, user management, profile, overview and help redirects to sign-in.
- Blank login and registration are blocked by required-field validation without submitting requests.
- Password show/hide toggles the field type without submission.
- Landing section links resolve to existing target elements.
- An unknown route returns HTTP 404.
- No uncaught browser exceptions.
- Landing layout passes at desktop width and with reduced motion at all checked widths.

## Evidence and reproduction

- Machine-readable results: `docs/qa/evidence/live/live-audit-results.json`.
- Browser screenshots and failure text: `docs/qa/evidence/live/`.
- Runner: `docs/qa/live-web-audit.cjs`.

Exact command used from the web repository:

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/live-web-audit.cjs
```

The local fixes do not change the deployed build. Re-run this command after deployment, then use a dedicated securely stored test account to cover signed-in workflows. Browser UI redirects are not a substitute for backend authorization tests.
