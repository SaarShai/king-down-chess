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
- Integration tip `b0e16067` merges with no conflicts. The check after the merge passes with the same counts.
- `npm run plugin:db:init-test` passes. All 9 migrations run twice.
- `git diff --check` passes.
- Open items: none.

## Review

- Should-fix: the 300 ms pause can end before the second client starts. The event order alone does not prove that the second client waits. Confirmed in the test. Fix: hold the first callback until `pg_stat_activity` shows the named second session on `postgres` waiting for an advisory lock. Check that only the first callback starts, release it in `finally`, then check the full event order.
- Should-fix: the error test checks lock release and the return value, but does not check that the client closes. Confirmed in the test. Fix: use a unique `application_name` for each success and error case. Check that one session exists in the callback and that none exists after the helper ends. Keep the return-value and lock-release checks.

Plan:

1. Hold the first callback until PostgreSQL shows the second session waiting on the advisory lock. Then release it and check the event order.
2. Give each client-release test a unique `application_name`. Check that the session exists in the callback and is gone after success or error.
3. Check that the tests reject a missing shared lock and an open client. Restore the helper, run `npm test` with `kingdown_mvp20_test`, then commit and push this branch.

Checks: both failure forms must fail the new tests. The final helper must pass all tests. Only the test and this ticket need a final change.

Result:

- Failure check: a temporary helper gives the second client a lock in its own database and unlocks the success and error clients without closing them. `npm test` fails all three new cases: the wait check sees no blocked session, and each close check still sees one session. This run has 2,117 passes, 5 failures and 8 skips. The other two failures report deadlocks in the accounts and games tests.
- Restore the helper with no final change. `npm test` with `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_mvp20_test` passes 137 test files, 2,122 tests and 50 artwork checks; 8 tests skip. All three role-lock cases pass. The deadlocks do not recur.
- `npm run plugin:db:init-test` passes on the same test database. All 9 migrations run twice.
- `git diff --check` passes. Both review findings are fixed.
