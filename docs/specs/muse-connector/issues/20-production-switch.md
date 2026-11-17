# 20. Ship Muse code with a server switch

Status: resolved
Type: task

## Scope

The owner asks for production code on branch `muse-switch-on`. The current ChatGPT-only server value must keep Muse parked. Do not merge, deploy, or change a live value or database.

## Change

Include Muse in production builds. After the client row check, serve Muse only with a listed Muse resource row. Keep local test personas. Keep the explicit `muse: false` build path.

Keep the exact two-field `/api/status` response for shipped apps. Account controls use `/api/status?muse=1` to read the Muse state. Hide the account button without `muse: true`. Make live checks read the server state. Update the release and rollback steps.

## Checks

- `npm test`: 7,340 tests pass; 387 skip. The 114 native tests pass. The run uses browser files in this worktree.
- `npm run test:docs`: 197 pass; one skips.
- Production site and function build: pass, with no `KINGDOWN_STAGE`.
- `npm run check:vercel`: pass. The compiled Muse paths pass with Muse on and off. The six tools pass with Muse on.
- `PLUGIN_TEST_DATABASE_URL=<local test database> KINGDOWN_TEST_FILE='src/muse/*.db.test.ts' npm test`: 13 pass.
- `KINGDOWN_TEST_FILE='src/account/*.test.ts' npm test`: 253 pass.
- `npm run check:browser account web-online`: both pass on Chromium.
- The build keeps the exact bytes of `privacy.html`, `terms.html`, `delete-data.html` and `support.html`. Only the two entry pages, the service worker and the account asset graph change.

The first full run lacks the browser files and finds three old production fixtures. The corrected fixtures pass. The first completed browser run finds a status read at board start. The account screen now reads status only when the player opens Account. The full suite and both browser checks pass again.

`tools/release/live.sh check` is not run: it checks a fresh `origin/main` outside this worktree. The branch uses the same production build and Vercel checks here. No live setting or database changes. No merge or deploy. The draft PR still needs independent review.

## Review repair

The independent review of PR 370 blocks the first head, `04ebfc1f4585a730a5e79d76a07300d7f9693322`. The shipped iOS build 1.0 (3), commit `a0956f012`, rejects a third status field. With Muse on, this closes account play in that app.

The repair adds the Muse field only for `?muse=1`. The default response keeps the old bytes for all callers. Account controls alone opt in. Both responses use `no-store`. The service worker bypasses both URLs. The URL selects the form; no new `Vary` field is needed. The iOS `Vary: Origin` header stays in place.

The test fixture copies the shipped parser from `a0956f012:src/online/account-access.ts` without a logic change. HTTP tests pass the default response to that parser with Muse on and account access open or closed. Other tests cover the opt-in field, both Account surfaces, the service worker, and the compiled function.

- `KINGDOWN_TEST_FILE='src/api/http.test.ts' KINGDOWN_TEST_NAME='shipped iOS status bytes|opt-in status URL' npm test`: 4 pass; 70 unselected cases skip.
- `KINGDOWN_TEST_FILE='{src/api/http,src/online/account-access,src/online/launch,src/account/account-screen-muse,tools/plugin-server-config,tools/service-worker}.test.ts' npm test`: 292 pass.
- `npm test`: 7,346 pass; 387 skip. All 114 native tests pass. This run uses Chromium in the worktree.
- `npm run test:docs`: 197 pass; one skips.
- Production site and function builds pass. The site build sets `envDir: false`. No stage value is set.
- `npm run plugin:db:init-test`: pass on a new disposable loopback database. Migrations 0001 to 0026 pass twice.
- `npm run check:vercel`: pass. The compiled function keeps the default status at two fields and returns the Muse field on opt-in. Muse on and off, six Muse tools, and 15 engine archives pass. The test database is stopped after the check.

The test commands wait for the machine lease and then pass. No lock is removed. No merge, deploy, live setting or live database change is made. The repair still needs independent review before a merge.
