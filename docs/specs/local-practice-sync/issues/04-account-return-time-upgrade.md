# Keep the old save time after account return

Type: task
Status: resolved

## Plan and checks

Release review finding 1: a tab opens account A, then selects B. B has an old local save at time 900 and a cloud game at time 600. The account restore skips the time upgrade, so the cloud game replaces newer local moves.

1. Add a sync test for account return. Check the save before the page reads or stamps it. Show the failure before the fix.
2. Run the existing guarded time upgrade after account restore and before the page callback.
3. Run the account, save, and page tests with `npm test`. Run `npm run test:docs`. Use the quiet lock and shared locks. Let the commit and push hooks run unchanged.
4. Commit on `staging/rel3-save`, push, and open a PR into `staging/first-game`.

Pass criteria: B keeps its newer local moves at time 900. The page sees time 900 before it can stamp the save. B's cloud copy gets the newer moves. Existing time guards and account tests pass.

## Before the fix

`KINGDOWN_TEST_FILE=src/account/sync.test.ts KINGDOWN_TEST_NAME='upgrades an archived account save before the page reads or stamps it' npm test` fails the new case. The local moves become `d2-d4` instead of `e2-e4 e7-e5`. Both type checks pass. The run selects one case and skips 64 cases. Log: `/private/tmp/kd-rel3-save-evidence/red.log`.

## Change

`selectLocal` runs the existing guarded time upgrade after the restore and account selection. It does this before the page callback can read or stamp the save. The same content, recovery, time, and write guards apply at startup and account return.

## Checks and review

- `KINGDOWN_TEST_FILE='src/{account/sync,account/account,account/client,screen/save,screen/play}.test.ts' npm test`: 304 tests pass in 5 files. Both type checks and all 67 art checks pass. This is a selected run, not a full-suite pass. Log: `/private/tmp/kd-rel3-save-evidence/green.log`.
- `npm run test:docs`: 180 tests pass in 15 files. Log: `/private/tmp/kd-rel3-save-evidence/docs.log`.
- The new case keeps `e2-e4 e7-e5` at time 900. The page callback sees time 900 before its stamp. The cloud then keeps the local game at time 900.
- Change check: the fix uses the existing upgrade and write guard at the shared account-selection boundary. It adds no new key, format, dependency, or sync path.
- The quiet lock is absent before each run. Each run holds the shared browser locks; the test and doc runs also hold the shared test lock. No browser check, full suite, deploy, sign-in, or remote database is used.
- Release review finding 1 supplies the fault and reproduction. Independent PR review remains required before merge.
