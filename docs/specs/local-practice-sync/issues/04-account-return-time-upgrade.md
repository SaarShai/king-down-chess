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

## PR 163 write failure plan

The P1 review finds that a failed upgrade write still permits the page callback and sync stamp. The next stamp sets time 0, so the older cloud game replaces the newer local moves.

1. Refuse the upgrade write once, then permit writes. Show the failure in the sync and real page tests before the fix.
2. Keep writers closed until a valid time upgrade is stored. Retry before the page callback or an archive stamp. Keep unreadable data distinct from a write failure.
3. Run the save, sync, play, account, client and link tests, docs tests and `web-game` browser check. Use the quiet and shared locks. Commit and push with unchanged hooks and hook inputs.

Pass criteria: no page callback, stamp or cloud request follows the failed write. A retry keeps local moves `e2-e4 e7-e5` at time 900 against cloud moves `d2-d4` at 600. A failed startup write also keeps writers closed. Unreadable records keep an unknown time.

## Change

`selectLocal` runs the existing guarded time upgrade after the restore and account selection. It does this before the page callback can read or stamp the save. The same content, recovery, time, and write guards apply at startup and account return.

## Checks and review

- `KINGDOWN_TEST_FILE='src/{account/sync,account/account,account/client,screen/save,screen/play}.test.ts' npm test`: 304 tests pass in 5 files. Both type checks and all 67 art checks pass. This is a selected run, not a full-suite pass. Log: `/private/tmp/kd-rel3-save-evidence/green.log`.
- `npm run test:docs`: 180 tests pass in 15 files. Log: `/private/tmp/kd-rel3-save-evidence/docs.log`.
- The new case keeps `e2-e4 e7-e5` at time 900. The page callback sees time 900 before its stamp. The cloud then keeps the local game at time 900.
- Change check: the fix uses the existing upgrade and write guard at the shared account-selection boundary. It adds no new key, format, dependency, or sync path.
- The quiet lock is absent before each run. Each run holds the shared browser locks; the test and doc runs also hold the shared test lock. No browser check, full suite, deploy, sign-in, or remote database is used.
- Release review finding 1 supplies the fault and reproduction. Independent PR review remains required before merge.

## PR 163 P1 repair

The upgrade catches read and parse faults only. A valid time write must succeed before writers open. Account selection retries the upgrade before the page callback. An account change also retries the outgoing game's upgrade before its archive stamp. This keeps the original time if the first startup write fails. No storage format, key, dependency or sync interface changes.

- Red: the selected sync and page run has 3 failures, 1 pass and 261 skips at `693098db`. The failures show open writers at startup and account return, and a page callback after the refused write. Log: `/private/tmp/kd-pr163-fix-evidence/red.log`.
- Green: the same selected run has 4 passes and 261 skips. Both type checks and all 67 art checks pass. Log: `/private/tmp/kd-pr163-fix-evidence/targeted-green.log`.
- The account-return case refuses the time-900 write once. No callback, changed stamp or cloud request follows. The next pull upgrades the time first, then keeps and uploads `e2-e4 e7-e5` at 900. The page case also checks that a page save cannot write during the failure. A startup case checks the outgoing archive time. An unreadable-record case keeps writers open with an unknown time.
- Change check: the shared upgrade and selection functions own the fix. A write error uses the existing blocked state and sync retry. No second retry path is needed.

### PR 163 final checks

- `KINGDOWN_TEST_FILE='src/{screen/save,account/sync,screen/play,account/account,account/client,screen/links}.test.ts' npm test`: 326 tests pass in 6 files. Both type checks and all 67 art checks pass. Log: `/private/tmp/kd-pr163-fix-evidence/required-tests.log`.
- `npm run test:docs`: 180 tests pass in 15 files. Log: `/private/tmp/kd-pr163-fix-evidence/docs.log`.
- `npm run check:browser web-game`: passes in 70.7 seconds. Its separate localhost database is removed; the remaining count is 0. Log: `/private/tmp/kd-pr163-fix-evidence/browser.log`. Browser record: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/rel3-save-nWptKv/run.json`.
- The quiet lock is absent before each run. Tests and docs hold the shared test and browser locks. The browser runner holds its normal shared locks. The first regression attempt stops before tests while another run holds the test lock; the next attempt produces the red evidence above. No other process is stopped.
- `git diff --check` passes. This is a selected test run. No full suite, deploy, provider sign-in or remote database is used. The commit and push use the existing hooks and inputs.
