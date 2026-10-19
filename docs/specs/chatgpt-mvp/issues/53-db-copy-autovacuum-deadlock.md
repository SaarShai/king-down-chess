# Database test copies: no autovacuum beside a role script

Status: done (waits for the owner's merge word)
Type: task
Size: S
Blocked by: none

## Problem

CI run 39247632012 (PR 65, job `verify`, 2026-10-19) failed one test in `src/online/jobs.db.test.ts`: "runs every job
with the reviewed runtime role, which cannot read or delete accounts itself". `withRoleLock` ran
`plugin-deploy/runtime-role.sql` with a test role name, and PostgreSQL ended it with `deadlock detected` (40P01) at
`create policy ... on public.games`. The push run of the same commit passed, so the failure depends on timing.

## Cause

The server log in the CI job names the other process: `autovacuum: ANALYZE public.games`. No test connection takes
part.

1. The role script grants on `public.games`. A grant changes the `pg_class` row of the table (`relacl`) and keeps that
   row version open until the script's transaction ends.
2. Autovacuum analyzes `public.games` (the tests before it write many games). It holds a SHARE UPDATE EXCLUSIVE lock on
   the table. At its end it updates the same `pg_class` row in place (`reltuples`). PostgreSQL 17.11 makes an in-place
   update wait for the transaction that changed the row, so autovacuum waits for the script.
3. The script's `create policy` on `public.games` asks for an ACCESS EXCLUSIVE lock and waits for autovacuum.

That is a cycle. The process whose deadlock check runs first ends with the error. When autovacuum gets it, the test
passes; when the script gets it, the test fails. The teardown (`drop owned by`: a revoke, then a policy drop) has the
same cycle.

Local proof on PostgreSQL 17.11 (the CI version): one session grants on a table and keeps its transaction open; a manual
`analyze` of the table in a second session waits on `transactionid`; the first session's `create policy` on the table
then gives `deadlock detected`. The local jobs copy shows 14 automatic analyzes of `games` from earlier runs.

## Change

- `tools/plugin-db/own-test-db.ts`: after the bootstrap, set `autovacuum_enabled=false` on every permanent table of the
  test file's own copy, then run one `vacuum` on those tables. The copy is disposable and the tests do not need
  autovacuum. The tests delete their rows, so the one `vacuum` keeps a copy that later runs use again small. All test
  files that use `ownTestDatabase` get the change.
- `tools/plugin-db/role-lock.db.test.ts`: a check that every permanent table of a copy has autovacuum off.
- No change to production SQL, to `withRoleLock` or to `src/plugin/`.

A retry is not the fix: the concurrent process is autovacuum, and the test can remove it from its own copy.

## Checks

- Red: the role-lock file with the helper's `alter table` removed, on a fresh database, fails the new check.
- Green: the role-lock file passes with the change.
- `KINGDOWN_TEST_FILE=src/online/jobs.db.test.ts npm test` passes five times in a row, and once beside
  `src/match/service.db.test.ts`.
- No automatic analyze or vacuum of the jobs copy's tables after the change.

## Result

Test database `kingdown_dlfix_test` on `127.0.0.1:55432` (PostgreSQL 17.11), all runs in one hold of the test lock:

- Red: the role-lock file, with the helper's `alter table` switched off, on the fresh `kingdown_dlred_test`: 1 failure
  (28 tables with autovacuum on), 3 passes.
- Green: the role-lock file passes 4 of 4.
- `KINGDOWN_TEST_FILE=src/online/jobs.db.test.ts npm test`: 5 runs, each 11 of 11, no deadlock.
- `KINGDOWN_TEST_FILE='src/{online/jobs,match/service}.db.test.ts' npm test`: 2 files, 31 of 31.
- Autovacuum check: the jobs copy's statistics reset after run 1. 90 s after the last run (the naptime is 1 min),
  `games` has 505 changes since its last analyze (the threshold is about 51), and 0 automatic analyzes and vacuums. The
  jobs copy of the main checkout, made without this change, shows 14 automatic analyzes and 14 vacuums of `games`.
- The scratch databases are dropped. CI runs the full suite on the pull request.

## Limits

- The role script has the same cycle in production when autovacuum runs on a table while the script runs. Each block is
  one transaction, so a deadlock there rolls back the block and the owner runs it again. This ticket does not change
  production SQL.
- A test that drops and makes its tables again (`tools/plugin-db/release-packet.db.test.ts`) gets new tables with
  autovacuum on. Its tables stay almost empty, so autovacuum does not start on them.
