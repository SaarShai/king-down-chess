# 18 · Review and fixes

Status: resolved
Type: AFK
Size: M
Blocked by: 03–17

## Scope

The code-review skill on the integration branch against main and this spec: standards and spec. A reader that did not write the diff. Fix each confirmed should-fix in one fix pass; record the findings here and in the PR body.

## Review fixes

Plan: fix the create boundary and random reuse; limit Report to the app; remove email jobs and record the cron host gap; fix the sweep, board cleanup and poll delay. Add one failing test, then its fix, for each code path.

Checks: focused unit and database tests use `npm test` and `kingdown_mvp18_test`. The final checks are `npm test`, `plugin:build`, `build:vercel`, `check:vercel` and `check:browser plugin-ui`. Record the counts and open release items here.

1. The site build has no API function or route. The server entry has no website verifier. Human creates require plugin options, refuse custom setup and use daily speed. Tests cover both kinds and both refusals. Legacy database fixtures seed saved games instead of using the closed create path.
2. Random tool creates use `find`, with its reuse and lock. Two concurrent creates return one open game.
3. Report stays registered with app-only visibility. This is the smaller safe change.
4. Cron removes email and reminder jobs, including old schedules. The plugin target has no `/internal/*` route. The README release order records this host gap for ticket 19.
5. Ticket 19 records the deletion text change and the owner's required yes.
6. The sweep ends a friend game after 7 days with no invitation. It checks again under the game lock and keeps a valid code.
7. The lobby search uses `for update skip locked` and takes another open game while the oldest is locked.
8. Daily cleanup deletes boards older than 7 days. Migration 0013 adds `created_at`; role block 9 adds delete permission. The start check checks both.
9. A legacy live human game with an inactive opponent polls at 15000 ms.
10. the tick ends a missed move deadline within a minute, so Claim rarely shows; accepted (delegated choice, 2026-10-12).

Checks (2026-10-12):

- `npm test`: 144 files pass; 2,231 tests pass, 124 opt-in tests skip; all 50 artwork tests pass.
- The seven changed database files: 100 tests pass on `kingdown_mvp18_test` and each suite's private copy. The command uses `npm test` with `PLUGIN_TEST_DATABASE_URL` and `KINGDOWN_TEST_FILE=src/{api/http,match/{service,setup,matchmaking,results},online/jobs,plugin/server}.db.test.ts`.
- `npm run plugin:build` and `npm run build:vercel`: both pass.
- `npm run check:vercel`: passes; 101 art files, MCP open and move, OAuth, API refusal, internal jobs and 4 archived engines.
- `npm run check:browser plugin-ui`: 1 of 1 passes, in 194.5 s. The first run found a fixture that still creates a custom human game. The local harness now seeds that legacy position. The fixture's 7 unit tests also pass through `npm test`.
- Each new code regression fails before its fix and passes after it. Board retention first finds the absent creation date, then fails on cleanup before the cleanup fix. Local logs are in `/tmp/kingdown-mvp18/`.

Open items: ticket 19 must close the cron host gap and ship the deletion text after the owner's yes. Cron SQL and live deploy checks do not run here. Unsent outbox rows stay in the database; the README and ticket 19 record this limit.
