# 01 — Keep the latest active suspension end

Type: task
Status: resolved
Branch: `staging/fix-suspension`
Base: `f8fcec0a`

## Fault

A new suspension can reduce an existing ban. An appeal can clear the ban while
another suspension stays active. Each write uses one action instead of all
active actions for the account.

## Plan

1. Add database tests for overlap and appeal. Run them on the current code and
   record the failures.
2. Use the same account lock for a suspension and its appeal. Set the ban end to
   the latest end of all active suspensions that are not reversed.
3. Run the affected tests, the full test suite and the document checks. Use the
   shared test lock and the database role lock. Commit, push and open a PR.

## Acceptance

- A short suspension does not reduce a longer active ban.
- An appeal keeps the ban from each other active suspension.
- The ban clears when no active suspension remains.
- Expired and reversed suspensions do not set the ban end.
- Concurrent writes use one account lock and keep the correct ban end.
- Database checks use only the local test server on port 55432.

## Evidence

The base is release 3 at `f8fcec0a`. The tests use
`kingdown_fix_suspension_test` on `127.0.0.1:55432`. The account test file uses
its own database copy. The test runner holds `kingdown-test.lock` in the Git
common directory. Database setup and role changes hold advisory lock `7007007`
on the local `postgres` database.

### Before the fix

Command: `npm test`, with `KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts`
and `KINGDOWN_TEST_NAME='shorter suspension overlaps|other active suspensions after appeal'`.

Three of four selected cases fail on the base code. A one-day suspension reduces
a 30-day ban. Two appeal cases clear the ban while another suspension stays
active. One appeal case passes. The type checks pass. Exit: 1.

Log: `/tmp/kingdown-fix-suspension-before.log`.

### After the fix

Command: `npm test`, with `KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts`.

All 29 account and safety database tests pass. The seven new cases cover a
shorter suspension, three appeal orders, expiry and both account-lock paths.
The type checks and all 67 art tests also pass. Exit: 0.

Log: `/tmp/kingdown-fix-suspension-affected.log`.

After the full run, a second selected run uses
`KINGDOWN_TEST_NAME='suspension|statement of reasons|account lock'` in the same
file. All eight selected cases and all 67 art tests pass. The type checks pass.
Exit: 0. Log: `/tmp/kingdown-fix-suspension-recheck.log`.

### Full checks

- Local database setup: all migrations 0001–0022 pass, each applied twice.
  Log: `/tmp/kingdown-fix-suspension-bootstrap.log`.
- First `npm test`: 5,684 pass, 25 fail and 8 skip in 287 files. The failures
  are in 12 unchanged test files. There are 17 timeout errors and 8 assertion
  failures. The run takes 2,191 seconds. The Mac load average is above 100
  during the run. This result is not a full-suite pass. Exit: 1.
  Log: `/tmp/kingdown-fix-suspension-full.log`.
- `npm run test:docs`: all 183 tests pass in 16 files under the shared test
  lock. Exit: 0. Log: `/tmp/kingdown-fix-suspension-docs.log`.

A second full `npm test` passes after the shared lock becomes free. The Mac load
average is 16 during this run. All 5,709 tests pass in 287 files; 8 tests skip.
The type checks and all 67 art tests pass. Exit: 0.
Log: `/tmp/kingdown-fix-suspension-full-retry.log`.

## Review

Both writes take the existing account lock before a report or action row lock.
Both use one SQL calculation of the latest active suspension end. The query
includes a suspension with no appeal and excludes reversed or expired actions.
The database tests verify both lock paths. No schema change is necessary.

Independent review remains before merge. Existing ban dates change when a
suspension or appeal changes; this fix does not run a data repair.
