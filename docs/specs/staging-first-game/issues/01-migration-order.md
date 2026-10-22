# Reconcile the staging migration order

Status: resolved. The required database suites pass on `staging/lane-dbcompat` (base `c4f3d3c3`). See "Database results".

## Plan

1. Keep email helper removal at 0015. Move web account access to 0016.
2. Update the explicit migration lists, startup checks, grants and release steps.
   Remove the unused email worker, sender and internal routes with their direct tests.
3. Check the diff and types. Give the coordinated test lane the exact database checks.

## Verification

- Apply each migration twice on a new disposable database.
- Startup works before and after 0015; account deletion keeps its runtime grant.
- Web access follows 0015, keeps data and existing switch values, and has SELECT-only runtime access.
- The guarded release paste matches its sources and works again after email removal.
- No production database or deployment changes.

## Changes

- Email removal is 0015. Web account access is 0016 and keeps runtime-role block 12.
- Startup has no email probe and checks the account deletion grant.
- The email worker, sender and two internal email routes are removed. Tick, daily cleanup and
  account deletion stay in place. The website API keeps its access and identity checks.
- The guarded release paste includes 0015 and can run after the email helper is absent.
- Tests check unique migration numbers, both explicit lists, repeated release application,
  startup before and after email removal, and the removed internal routes.

## Evidence

- `npm run typecheck`: pass.
- `node --check tools/plugin-db-check.mjs`: pass.
- `node --check tools/plugin-server.mjs`: pass.
- Static assertions: 16 unique ordered migration files; bootstrap and server lists match the
  files; 12 runtime blocks; all 11 release source sections match their SQL sources; no email
  helper call remains in the runtime jobs or startup probe.
- `git diff --check`: pass.

## Remaining check

The parent task owns the test lane. No database is touched here. In that lane, set
`PLUGIN_TEST_DATABASE_URL` to the new disposable loopback database, then run:

1. `npm run plugin:db:init-test`
2. `npm test`

Keep the database input set for both commands. The required suites include
`tools/plugin-db/migrations.db.test.ts`, `tools/plugin-db/web-account-access.db.test.ts`,
`tools/plugin-db/release-packet.db.test.ts`, `tools/plugin-db/release-order.docs.test.ts`,
`src/online/jobs.db.test.ts`, `src/api/http.db.test.ts`, `src/api/http.test.ts` and
`tools/plugin-db-check.test.ts`. Record their results before this ticket is done.

## Database results

Ticket 68 ran the remaining check on `staging/lane-dbcompat` (base `c4f3d3c3`), on the disposable loopback database
`kingdown_lane_dbcompat_test`, with `PLUGIN_TEST_DATABASE_URL` set for both commands.

- `npm run plugin:db:init-test`: `Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`.
- `KINGDOWN_TEST_FILE` with the eight named suites (`tools/plugin-db/migrations.db.test.ts`,
  `tools/plugin-db/web-account-access.db.test.ts`, `tools/plugin-db/release-packet.db.test.ts`,
  `tools/plugin-db/release-order.docs.test.ts`, `src/online/jobs.db.test.ts`, `src/api/http.db.test.ts`,
  `src/api/http.test.ts`, `tools/plugin-db-check.test.ts`), then `npm test`: `Test Files  8 passed (8)`,
  `Tests  105 passed (105)`. No case is skipped. The database copies `_migrations`, `_webaccess`, `_release19docs`,
  `_jobs` and `_api` exist after the run, so the database cases ran.

Ticket 68 finds one gap in the production release order (not in this ticket's migration order): the new start check
needs the current runtime-role block 4, which production does not have. See
`68-production-schema-switch.md`.
