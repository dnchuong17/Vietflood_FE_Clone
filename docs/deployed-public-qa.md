# Deployed-site public QA — vflood.vercel.app

Date: 2026-10-26. Target: https://vflood.vercel.app/.

## Result

Real Chrome browser run: **24 passed, 1 failed, 25 assertions**. No API fixtures, seeded sessions or forged tokens were used. No sign-in, registration, report, chat or profile mutation was submitted. A request interceptor prevented any non-GET/HEAD/OPTIONS operation; the run recorded zero blocked mutations because no mutating request was attempted.

Command (from the web repository):

```sh
PATH=/opt/homebrew/bin:$PATH NODE_PATH=/Users/macbook/.npm/_npx/b234c773f454f454/node_modules node docs/qa/deployed-public.cjs
```

Raw results: `docs/qa/evidence/deployed-public/results.json`. Screenshots and extracted page text are in the same directory.

## Passed

- Landing page rendered at 390, 768 and 1440px without document horizontal overflow.
- Header anchor links target existing sections.
- Login and registration forms rendered at 390/1440px, with associated labels on visible inputs.
- Empty submissions were blocked by required-field validation without a production request.
- Login password show/hide toggled correctly.
- Eleven protected route checks redirected unauthenticated users to sign-in: map, reports list/detail, chat, relief, assignments, tracking, overview, users, profile and guide.
- An unknown route returned an actual HTTP 404.
- No uncaught JavaScript exceptions were recorded.

## Findings

### 1. Source-document route has inconsistent unauthenticated handling

Severity: medium, UX/authentication flow. Reproduce while signed out by visiting `/tro-ly/nguon/qa-nonexistent/1`.

Expected: the same sign-in redirect as the rest of the authenticated application, or a clear sign-in link and retry path.

Actual: the page stays on the source route with only “Tài liệu nguồn VietFlood” and “Không tải được nguồn. Hãy kiểm tra đăng nhập và thử lại.” There is no link or button to sign in or retry. The browser requests `/chat/sources/qa-nonexistent/versions/1`, receives HTTP 401, then logs a missing-refresh-token error.

Evidence: `failure-22.png`, `failure-22.txt`, and the raw request/console result. The backend denied the request; **no protected source content was disclosed**. The failure is inconsistent navigation and a dead-end error state, not evidence of an authorization bypass.

The current local source page already uses AppShell and retry UI, unlike this deployment. A local correction is not claimed to be deployed.

### 2. Landing-page sample looks like a live operational feed

Severity: medium, content/trust. The public landing presents an “đang trực tuyến” badge, 18 active devices, 42 new reports, and report IDs #214/#213/#212 without a visible sample/demo label. These match the static sample in the repository baseline; this QA did not establish them as actual operational data.

Expected: label the preview as illustrative data and do not imply live status, or use a genuinely authenticated live feed with freshness information.

Evidence: `landing-1440.txt`, `landing-1440.png`, `landing-390.png`. This matters for an emergency-response interface because users must distinguish operational facts from examples.

## Console/network interpretation

The only HTTP errors recorded were the source route's HTTP 401 and the deliberate unknown-route HTTP 404. The source route also logged the failed refresh attempt. No uncaught page exception was recorded. This does not prove the logged-in app has no errors.

## Not tested on production

Authenticated citizen/relief/admin workflows; report creation/edit/status/delete; real image upload; profile/user management; chat action confirmations/history mutation; authenticated source snapshots; live tracking and native location permission behavior. These require a dedicated test account and explicit scope for production mutations. Exposed admin credentials were not used, and no token was forged to enter protected pages.

## Deployment boundary

This report describes the deployed public site only. Separate localhost fixture browser runs and repository unit tests must not be added to its pass count. No deployment was performed.
