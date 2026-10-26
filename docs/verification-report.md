# VietFlood verification report

Status: source changes prepared for publication at the user's request. Full live/native acceptance is not complete.

## Pre-push verification

Fresh parent-run checks on the source being committed:

| Repository | Command | Result |
|---|---|---|
| Web | `npm test -- --reporter=dot` | 178 passed, 52 test files |
| Mobile | `npm test -- --runInBand --json` | 201 passed, 37 suites |
| Backend | `npm test` | 187 passed, 15 skipped; 17 passed suites, 2 skipped |
| RAG | scratch virtualenv Python `-m unittest test_pipeline test_sync` | 11 passed after upstream reconciliation |
| Web QA runners | `npx eslint docs/qa/*.cjs` | Passed |

Earlier saved runs also passed web production build/typecheck, mobile TypeScript/Expo web export, and all three backend service builds. Full-repository lint is not a green gate: backend audit recorded 627 errors and 51 warnings; web baseline included broad skill-directory lint errors and three application-source errors. Native/device and authenticated production workflows remain unverified.

RAG was 17 commits behind `origin/main`. The branch was fast-forwarded, the corpus test was adapted to the new cl100k_base tokenizer, and the newer upstream sync/publication/cache/rollback tests were preserved instead of replacing them with the older local test. The original local test edits remain backed up in a named git stash and a scratch patch.

Deployment note: refresh-token fixes intentionally reject legacy bcrypt refresh-token hashes; existing users may need to sign in again after backend deployment. Password-change backend support is still absent; the mobile screen explicitly handles an unavailable endpoint. Source publication is not a claim that all requirements or deployments are complete.

## Environment baseline

- Node v20.15.0; npm 10.8.3; Python 3.13.5.
- `pnpm` and `maestro` are not on PATH; use equivalent npm scripts for available checks.
- Docker CLI exists, but its daemon socket is absent. No VietFlood API or frontend listener was running at baseline. The checked-in Compose stack consumes `DATABASE_URL` and defaults to remote Qdrant/model endpoints rather than provisioning a completely isolated test database and knowledge collection; it was not started with deployment credentials merely to obtain a green integration result.
- Xcode simulator tooling responds; no iOS simulator was booted at baseline. An isolated boot of iPhone 17 Pro stalled in first-boot data migration (CoreLocation migrator) for over seven minutes; the test process was stopped and that simulator shut down. `npm run test:maestro` exits 127 (`maestro: command not found`), and `.maestro/flows` is absent. Native runtime acceptance remains blocked, not passed.
- Preserve pre-existing backend README/.DS_Store changes and untracked guide/references, plus RAG .DS_Store files. Web and mobile working trees were clean initially.

## Evidence policy

Automated unit/contract tests, mock-backed UI smoke tests, native simulator tests, and live backend integration are separate evidence categories. Mock-backed outcomes do not prove live database, queue, storage, model, socket or native permission integration. Any unavailable feature path is recorded as blocked, not passed.

The completed report will include exact checks, counts, changed files, screenshots and remaining blockers.
