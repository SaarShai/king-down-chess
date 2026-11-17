# 20. Ship Muse code with a server switch

Status: resolved
Type: task

## Scope

The owner asks for production code on branch `muse-switch-on`. The current ChatGPT-only server value must keep Muse parked. Do not merge, deploy, or change a live value or database.

## Change

Include Muse in production builds. After the client row check, serve Muse only with a listed Muse resource row. Keep local test personas. Keep the explicit `muse: false` build path.

Use `/api/status` to show `muse: true` only when Muse is served. Hide the account button without this field. Make live checks read the server state. Update the release and rollback steps.

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
