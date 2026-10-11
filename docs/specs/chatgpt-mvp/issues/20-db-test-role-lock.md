# 20 · One role lock for the whole test database server

Status: resolved
Type: AFK
Size: S
Blocked by: none

## Problem

The database tests (`src/online/accounts.db.test.ts`, `src/match/service.db.test.ts`, `src/online/jobs.db.test.ts`) and `tools/plugin-db/bootstrap-test.mjs` create, grant and drop roles. Roles belong to the whole PostgreSQL server, not to one database. The tests guard role changes with `pg_advisory_lock(7_007_007)`, but an advisory lock belongs to one database. Two worktrees with two test databases on the same server (127.0.0.1:55432) therefore do not wait for each other, and PostgreSQL reports "deadlock detected" (ticket 17, run 4; the fold-in of 2026-10-11, `accounts.db.test.ts`). The shared `npm test` lock (PR #53) does not cover a bootstrap that runs outside `npm test`.

## Scope

- One helper that holds the role lock on the server's `postgres` database (shared by every test database on that server) while it runs a role change; the three tests and the bootstrap use it for every create, grant, alter and drop of a role.
- No change to production SQL or to the runtime role.

## Acceptance

- A test runs two role changes at the same time from two different test databases and shows that the second waits for the first (no deadlock, no overlap).
- `npm test` with a test database passes; `npm run plugin:db:init-test` passes.
- AGENTS rule kept: each agent uses its own test database.

## Plan

1. Check that two role changes in two databases overlap with the old helper.
2. Hold one client on `postgres` until the role change ends. Use the helper in the three tests, the bootstrap and the API and migration tests, which also change roles.
3. Check lock release after an error. Run the bootstrap and `npm test` with `kingdown_mvp20_test`.
4. Commit the fix. Merge the current integration tip, run `npm test` again and push this branch.

## Checks

- The role test must fail before the fix and pass after it. The second change must wait for the first.
- The helper must return the work result and release its client after an error.
- The bootstrap and all tests must pass with this ticket's test database.

## Result

- The helper holds one client on `postgres` until the work ends. Closing the client frees the lock, also when the work fails. The accounts, games, jobs, API and migration tests and the bootstrap use it for role and grant changes.
- Test database: `kingdown_mvp20_test` on `127.0.0.1:55432`. The role test uses a second copy, `kingdown_mvp20_rolelock_test`.
- Red check: `npm test` fails the role test because the two changes overlap; 2,119 other tests pass and 8 skip.
- Before the API fix: `npm test` passes 137 test files, 2,121 tests and 50 artwork checks; 8 tests skip. Both role tests pass.
- The next check finds a deadlock when the game test drops its role. The API test also changes roles and has no lock. The full caller search finds this missed path; it now uses the same helper. This check has 2,120 passes, 1 failure and 8 skips.
- After the API fix, `npm test` passes 137 test files, 2,121 tests and 50 artwork checks; 8 tests skip. Both role tests pass.
- `npm run plugin:db:init-test` passes. All 9 migrations run twice.
- `git diff --check` passes.
- Open items: none.
