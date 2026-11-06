# 01. Check concurrent error counts

Status: resolved

## Scope and plan

The owner requests this check after PR 259 reports count 3 instead of 4.
The release marker is present before local work starts. Its exit code is 0.
Use only an isolated local test database on port 55432.

1. Read the failed log, the test, the writer, and migration 0019.
2. Repeat four concurrent calls. Record SQL errors, commits, and stored counts.
3. Separate a lost committed write from an allowed timeout or an early read.
4. Fix the cause. Run the focused tests once. Open a PR into `staging/first-game`.
5. Wait for one CI round. Do not merge, deploy, or apply a production migration.

## Check criteria

- Record the repeat rate before and after the change.
- A count below the number of successful commits must fail the check.
- An unexpected SQL error must fail the check.
- Keep the recorder's 500 ms limits and test their existing behavior.
- Record the PR, head commit, CI result, and unchecked scope.

## Evidence

The CI log reports the failed assertion at 17:40:53 UTC on 2026-11-05.
The test takes 848 ms. It awaits all four calls before it reads the row.
The writer catches SQL errors and resolves after rollback.
The original recorder ticket requires these silent drops after 500 ms.
The conflict update uses `count=client_errors.count+1` on the unique group key.

## Cause and SQL check

This is a test fault. Four resolved calls do not prove four commits.
The SQL is in `src/diagnostics/server.ts`, in `createErrorWriter`.
Migration `0019_client_errors.sql` defines the tables and the unique group key.
It does not define a stored write function.

- The budget insert uses `ON CONFLICT(singleton) DO UPDATE`. A new group takes
  this shared row lock before its report insert. An existing group needs no
  budget slot. The budget ceiling is 1,000 new groups per UTC hour.
- The report insert uses `ON CONFLICT(fingerprint,build,hour) DO UPDATE`.
  It increments the locked row's count. It does not read a count into application
  code and then write an old value. PostgreSQL updates the current row after
  a conflicting writer commits. See the [PostgreSQL 17 isolation rules](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-READ-COMMITTED).
- Retention selects at most 100 expired rows with `FOR UPDATE SKIP LOCKED`.
  Each write runs in one transaction. A timeout rolls that transaction back.
- `Promise.all` waits for these calls before the test reads. There is no early
  read in this test. The defect is its assumption about successful writes.

The CI log does not retain the caught SQL error. A 500 ms timeout is consistent
with the 848 ms test, but the exact CI error cannot be proved from that log.

## Repeat evidence

Both probes use PostgreSQL 17.11 at `127.0.0.1:55432`, in
`kingdown_plugin_dbflake_test`, with a copy of the restricted runtime role.
Each round truncates the two diagnostic tables, starts four writer calls,
awaits all calls, and compares SQL commits with the stored count.
The first probe starts four cold pools. The second opens the clients before
the writes, as the revised test does. No runtime SQL changes.

| Case | Before | After |
| --- | --- | --- |
| Normal rounds | 0 failures / 1,000 | 0 failures / 1,000 |
| One forced 500 ms statement timeout | 20 false count failures / 20 | 0 false count failures / 20 |
| Lost committed count | 0 / 1,020 | 0 / 1,020 |

In every timeout round, three commits store count 3. The fourth call receives
SQL code `57014`, rolls back, and resolves. A local statement trigger delays
only this call for 600 ms. The trigger is removed after the probe.
This is a controlled reproduction, not an observed natural failure rate.

One negative control reduces count 4 to 3 after four successful commits.
The revised check rejects it. This proves that the lost-count check remains.

Probe source, SQL traces, and reports are in `~/kd-runs/fix-db-flake/`:
`repeat.mts`, `repeat.json`, `repeat-after.json`, and their logs and exit files.
Both probe commands exit 0. Run the source with the worktree's `tsx`; add
`--after` to open clients before the writes and include the negative control.

## Fix

The test observes each real client query and counts successful `COMMIT`
responses. It rejects all SQL errors except statement and lock timeouts
(`57014` and `55P03`). Each call must start a transaction. At least two writes
must commit. The stored count must equal the commit count.

The writer, its 500 ms limits, the SQL, and all migrations stay unchanged.
No production migration is needed. No production database is accessed.

## Verification

The one focused `npm test` command selects these cases in
`src/diagnostics/server.db.test.ts`:

- `counts committed writes from four concurrent function calls`
- `counts both writers at the last slot after they wait for the counter`
- `stops blocked SQL, holds write slots, drops pool waits and sends the fault response first`
- `returns a fault before its own blocked recorder completes and registers the lifetime work`

The command first waits for the shared machine lease. It then exits 0.
Both type checks pass. All four selected database cases pass in 2.87 seconds;
36 cases in the file are not selected. The standard `npm test` wrapper also
runs its 70 drawing document checks; all pass. This is one invocation.
`git diff --check` passes. CI covers the rest.
No browser, full local suite, build, merge, or deploy runs.
