# 02 — Keep the account deletion grace in UTC

Type: task
Status: resolved
Branch: `staging/deletion-utc`

## Cause

The website calls `public.delete_my_account()` as `authenticated`.
The function calls `kingdown_jobs.request_deletion(uuid)`.
The first insert and a request after cancel add seven calendar days.
The caller can select a time zone that uses daylight saving time.
The grace can then be 167 or 169 hours. The required grace is 168 hours.
The deletion job trusts the stored date.

## Plan

1. Check all SQL functions and other time limits for the same access path.
2. Add tests for the caller time zone, first insert, and request after cancel.
3. Add migration 0020. Set the function time zone to UTC.
   Set the column default to 168 hours. Keep the grants and existing rows.
4. Apply the migration twice to a local database at 0019.
   Check existing rows, type checks, focused database tests, and doc checks.

## Acceptance checks

- An `authenticated` caller selects `America/Los_Angeles`.
  A first request and a request after cancel each store exactly 604800 seconds.
- A second request keeps the first date. The caller keeps its time zone.
- The stored column default gives 168 hours across both fixed clock changes.
- Migration 0020 runs twice and keeps existing deletion rows and grants.
- All required commands pass. Each command has a log.

## Release

Production needs migration 0020 applied before the release that carries it.

## Scope check

The SQL search covers migrations 0001 through 0019 and the runtime grants.
Only `request_deletion(uuid)` adds a calendar interval in a function that a
browser role can reach. Migration 0020 sets that function to UTC.
The column default uses `interval '168 hours'` for direct inserts.

| Function or time limit | Action and reason |
| --- | --- |
| `public.delete_my_account()` | Keep it. It calls the corrected function. Its grant stays the same. |
| `kingdown_jobs.delete_account(uuid)` | Keep it. It compares stored timestamps with `now()`. It adds no interval. Browser roles cannot call it. |
| `public.cancel_deletion_on_sign_in()` | Keep it. It stores `now()` and adds no interval. |
| `public.touch_updated_at()` | Keep it. It stores `now()` and adds no interval. |
| `public.keep_newer_sections()` | Keep it. It compares stored numbers and adds no interval. |
| `public.handle_new_user()` and `public.reserve_handle()` | Keep them. They write no time limit. |
| `public.profile_name(jsonb)` and `public.profile_picture(jsonb)` | Keep them. They read text and write no time limit. |
| `public.keep_game_rating_policy()` | Keep it. It writes no time limit. |
| `kingdown_jobs.user_email(uuid)` | No change. Migration 0015 removes it. It writes no time limit. |
| `public.kingdown_before_user_created(jsonb)` and `public.kingdown_access_token_hook(jsonb)` | Keep them. They check account access and write no time limit. Browser roles cannot call them. |
| `AccountService.requestDeletion()` | Keep it. It calls the corrected SQL function. |
| `SafetyService.hold()` | Keep it. The owner command sets the hold. Browser roles cannot write holds. The request cannot select the owner's SQL time zone. |
| `SafetyService.queue()` | Keep it. The report target uses 48 hours. Hours do not change with the time zone. |
| `SafetyService.report()` and `SafetyService.intake()` | Keep them. They store a timestamp and add no interval. |
| `SafetyService.apply()` and `AccountService.setHandle()` | Keep them. They use elapsed milliseconds. |
| `recordResult()`, `playerRecord()`, and `opponentRating()` | Keep them. Rating idle time uses elapsed milliseconds. |
| `cleanup()` and report and error delete policies | Keep them. Server jobs run these queries. The error cleanup already sets UTC. Browser roles have no table access or control of that SQL session. |
| `runDeletions()` | Keep it. It compares stored timestamps and calls `delete_account(uuid)`. |
| `sweepDeadlines()`, `GameService.sweep()`, and `PostgresMatchStore.due()` | Keep them. Server queries select due games. A browser request cannot select the SQL time zone. |
| `createErrorWriter()` | Keep it. Its transaction already sets UTC for the 30-day cleanup and hour limit. |
| `errorAdmission()`, `PluginService.toolTry()`, and `PostgresMatchStore.codeTry()` | Keep them. They use milliseconds, seconds, minutes, or hours. These units do not change across a clock change. |
| `GameService.invite()`, game deadlines, `PostgresMatchStore.seen()`, `inbox()`, `lobby()`, and `activeCount()` | Keep them. They use elapsed milliseconds, seconds, minutes, or hours. A caller cannot change these periods with a time zone. |

The deletion function accepts no test timestamp. The fixed spring and autumn
tests use its stored insert default. The real function tests use the database
clock and select the caller's time zone in each transaction.

## Checks

All checks use the local `kingdown_deletionutc_test` database or its test copies.
The log folder is `/private/tmp/claude-501/ci87/run38/deletion-utc-files/`.

| Command or check | Result | Log |
| --- | --- | --- |
| `npx tsc --noEmit -p .` | Exit 0. | `typecheck.log` |
| `bash tools/test-lock.sh npm run plugin:db:init-test` at 0019 | Exit 0. Each migration runs twice. | `db-init-0019.log` |
| `KINGDOWN_TEST_FILE='src/online/accounts.db.test.ts' KINGDOWN_TEST_NAME='168-hour grace\|deletion default' npm test` at 0019 | Exit 1, as required. Four new tests fail. The real calls give 169 hours. The fixed cases give 167 and 169 hours. | `tests-before.log` |
| `node /private/tmp/claude-501/ci87/run38/deletion-utc-files/migration-check.mjs` | Exit 0. It checks the 0019 settings, applies 0020 twice, and keeps four rows, owners, and grants. A direct insert in Los Angeles gives 604800 seconds. | `migration-upgrade.log` |
| `bash tools/test-lock.sh npm run plugin:db:init-test` through 0020 | Exit 0. Each migration runs twice. | `db-init-0020.log` |
| `node /private/tmp/claude-501/ci87/run38/deletion-utc-files/migration-check.mjs verify` | Exit 0. The complete setup keeps all four rows and recorded grants. It then removes the test rows. | `migration-retention.log` |
| `KINGDOWN_TEST_FILE='src/online/*.db.test.ts' npm test` | Exit 0. Two files and all 27 tests pass. All 57 artwork checks pass. | `tests-after.log` |
| `KINGDOWN_TEST_FILE='tools/plugin-db/migrations.db.test.ts' npm test` | Exit 0. All three tests and 57 artwork checks pass. | `migration-tests.log` |
| `npm run test:docs` | Exit 0. All 176 tests in 15 files pass. This includes the changed release check. | `docs-tests.log` |

The shared lock delays the setup and two test commands. Each command ends.
The full test suite is reserved for CI. No remote database or deploy is used.

## Review and risk

Finding 1 in `/private/tmp/claude-501/ci87/run38/dst-review.md` identifies the
fault. The four tests confirm it on this branch before 0020.
The fix uses function settings and a column default. It adds no service code.
Both migration lists and the release steps include 0020.
Existing requests keep their stored dates, including any old non-UTC date.
