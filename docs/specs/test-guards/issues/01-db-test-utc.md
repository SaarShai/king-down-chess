# 01: Use UTC in the test database

Status: resolved
Type: task
Size: S
Blocked by: none

## Problem

The account deletion test requires a grace period of exactly 168 hours.
The local PostgreSQL server uses `America/Los_Angeles`.
Seven calendar days can include a daylight saving time change.
The production database uses UTC.

## Plan

1. Check the shared test database setup and its callers.
2. Run the deletion test with the local time zone and UTC. Record both results.
3. Set UTC once in the shared test database setup. Keep the exact grace check.
4. Check a fixed daylight saving time change. Run all required checks.
5. Record the results, commit the change, and write the report and PR text.

## Acceptance checks

- The deletion test passes with `TZ=America/Los_Angeles` and `TZ=UTC`.
- A fixed date check proves that seven calendar days equal 168 hours in UTC.
- `npx tsc --noEmit -p .` passes.
- The online database tests pass. Use `KINGDOWN_TEST_FILE='src/online/*.db.test.ts'`.
- The full `npm test` passes.
- `npm run test:docs` passes.
- The change does not need a migration or a change to the grace check.

## Cause

`ownTestDatabase` reads `PLUGIN_TEST_DATABASE_URL`. It checks that the host is
local and the database name ends in `_test`. It makes a copy for each test file.
The tests then open pools and clients with the copy URL.

The local PostgreSQL session uses `America/Los_Angeles`. The column default in
`supabase/migrations/0005_accounts_v2.sql:60` adds seven calendar days.
From 2026-10-25 to 2026-11-01, the local clock moves back one hour.
The grace is 608,400,000 ms, or 169 hours. The check requires 604,800,000 ms.
With a UTC session, the same unchanged test passes.

## Fix

`tools/plugin-db/own-test-db.ts` sets the copy database default to UTC before
the schema setup and new test connections. This applies to existing copies too.
New pools, clients, and child tools get the same default. A session can still
select another time zone. The diagnostics test keeps its `Asia/Kolkata` session.

`src/online/accounts.db.test.ts` adds two fixed date checks. In Los Angeles,
seven calendar days from 2026-03-01 take 167 hours. From 2026-10-25, they take
169 hours. Both take 168 hours in the test session. The checks use SQL dates.
They need no clock change or sleep.

The exact deletion check stays in place. The fix changes no migration or
production code. One shared default is smaller than a change in each pool.

## Checks

The local test server listens at `127.0.0.1:55432`. The test database is
`kingdown_dstgrace_test`. No remote database is in use. For each `npm test` below,
`PLUGIN_TEST_DATABASE_URL` selects this database. Log files are in
`/private/tmp/claude-501/ci87/run38/`.

| Command | Result | Log |
| --- | --- | --- |
| Local SQL check at a fixed date in Los Angeles and UTC | 169 hours and 168 hours | `db-baseline.log` |
| `npm run plugin:db:init-test` | Pass. Each migration runs twice. | `db-init.log` |
| Before: `TZ=America/Los_Angeles KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts KINGDOWN_TEST_NAME='asks for a deletion' npm test` | Exit 1. The grace is 169 hours. | `before-los-angeles.log` |
| Before: `TZ=UTC KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts KINGDOWN_TEST_NAME='asks for a deletion' npm test` with URL option `options=-c%20timezone%3DUTC` | Exit 0. One selected test and 57 artwork checks pass. The URL option sets the database session to UTC. | `before-utc-session.log` |
| Before the helper fix: `TZ=America/Los_Angeles KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts KINGDOWN_TEST_NAME='uses UTC for a 7-day grace' npm test` | Exit 1. Both new cases detect the local session time zone. | `regression-before.log` |
| After: `TZ=America/Los_Angeles KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts KINGDOWN_TEST_NAME='asks for a deletion\|uses UTC for a 7-day grace' npm test` | Exit 0. Three selected tests and 57 artwork checks pass. | `after-los-angeles.log` |
| After: `TZ=UTC KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts KINGDOWN_TEST_NAME='asks for a deletion\|uses UTC for a 7-day grace' npm test` | Exit 0. Three selected tests and 57 artwork checks pass. No URL time zone option is in use. | `after-utc.log` |
| `npx tsc --noEmit -p .` | Exit 0. | `tsc.log` |
| `KINGDOWN_TEST_FILE='{src/online/*.db.test.ts}' npm test` | Exit 1. The single-item braces select no files in this runner. | `online-db.log` |
| `KINGDOWN_TEST_FILE='src/online/*.db.test.ts' npm test` | Exit 0. Both files, all 25 tests, and 57 artwork checks pass. | `online-db-corrected.log` |
| `npm test` | Exit 0. All 277 files and 5,166 tests pass. Eight tests skip. All 57 artwork checks pass. | `full-test.log` |
| `npm run test:docs` | Exit 0. All 15 files and 176 tests pass. | `docs-first.log` |

The online and full runs use `TZ=America/Los_Angeles`. Each focused run lists its
selected cases above. A focused pass does not stand for a full pass.

## Other time checks

- `src/online/jobs.db.test.ts:71` uses exact milliseconds at the seven-day board
  cleanup limit. The cleanup SQL subtracts calendar days.
- `src/match/results.db.test.ts:301` and `:302` subtract 365 and 180 calendar days.
  The test checks exact rating results from the elapsed time. Another local time
  zone can change that time.
- The deletion test also checks a 365-day data hold. The SQL adds calendar days,
  and the test compares the result with exact milliseconds.

All these tests use the shared helper. The online and full runs pass with UTC
as the default. Other database tests use calendar intervals for test data too.
The search finds no other exact seven-day grace assertion.

## Review

The change keeps the local host and database name checks. It changes only the
test database default. It keeps the exact grace assertion and all cleanup paths.
The full suite includes the test that selects `Asia/Kolkata`. It passes.
No separate agent review is part of this run. A PR needs an independent review
before merge.
