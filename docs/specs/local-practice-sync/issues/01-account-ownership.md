# Keep local cloud data with its account

Type: task
Status: claimed

## Second review plan and checks

1. Keep all copies with unconfirmed changes. Treat unknown status as unconfirmed. Apply the three-account limit only to copies that the cloud confirms. Test sign-out, failed sync, return to A and old copies without a list entry.
2. Return a result from each local writer. Show a persistent failure notice for a blocked lesson record and New game. Give Reload when another account owns the keys. Use the existing notice path.

For each finding, run the failing test before the fix. Then run the same selected checks after the fix. Use fake timers. Run the selected tests in series, then the doc checks. Make one commit per finding. Keep the hooks unchanged. Do not push, merge or deploy.

## Review fix plan and checks

The independent review requests four P1 fixes and a storage limit.

1. Test the real settings module before the play module starts. Remove the early skill read.
2. Select local account data before the cloud read. Block all affected local writers if selection fails.
3. Track the account shown in each tab. Check that account before local and cloud writes.
4. Finish a pending restore before the page reads its save or lessons. Test a new move after reload.
5. Keep at most three confirmed account copies. Keep all unconfirmed copies. Test removal and return to a kept account.

Each fault gets a failing test before its fix. Use fake timers. Run selected tests in series, then the doc checks. Commit on this branch. Do not push, merge or deploy.

## Plan and checks

The owner requests audit finding F1. The local save has no account ID. A switch can send A's data to B.

1. Add failing tests for a switch to B with and without a cloud copy.
2. Bind the local save, lessons and section times to the account. Keep the first anonymous import. Keep A's raw copy before a switch. Restore it when A returns.
3. Show B's copy after a switch. Open a new game if B has no game. Keep sign-out local play.
4. Check late replies, storage failure and the page handover. Run focused tests in series. Commit F1 alone.

The source of the existing behavior is the accounts section in [the task archive](../../../tasks-archive/2026-10.md) and [save ownership](../../web-adaptation/issues/11-save-ownership.md). Sign-out keeps local play. A change of account must not import another account's local data.

## Limits

The owner permits selected tests, doc checks and one `new-game` browser check for the review fix. No full suite, publish or database change is in scope.

## Result and evidence

F1 reproduces. The old sync has no local owner. It compares A's times with B's times. Three new cases fail on the old source: B with data, B without data, and a late A reply.

Each remote now carries its user ID. The first account claims local data before its first cloud read, even offline. A switch stores the old raw save, lessons and times under `kingdown.local.<user ID>`. The new account loads its own copy. A pending restore record keeps a failed key write from assigning old bytes to the new account. Return to A restores A's copy and sends A's unsent moves to A only.

The page replaces its live game on a switch. A new account with no game starts fresh. The settings controls return to their initial values before they take the new account's settings. Sign-out keeps the current local game. The old sync refuses local work and late replies after the owner changes.

- Red: `KINGDOWN_TEST_FILE=src/account/sync.test.ts KINGDOWN_TEST_NAME='F1 account ownership' npm test`. Three tests fail on the old source. Log: `web-sync-f1-red.log`.
- Green: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,account/account,account/client}.test.ts' npm test`. All 85 tests in five files pass. Both type checks and all 57 art checks pass. Log: `web-sync-f1-green.log`.
- The checks include first import, offline first sign-in, sign-out, both B states, return to A, late reads, failed archive writes and a restore that resumes after reload.
- Review: the change keeps the existing save keys and section merge. It adds one owner record and one raw copy per account. No new dependency, service, game rule or SQL change is needed.

## Review fixes and evidence

The review finds four P1 faults. The first test uses the real settings and play modules in the start order from `main.ts`. It fails with `ReferenceError`. Settings now take the initial skill without reading play before it exists.

Account selection now runs before the first cloud read. A failed read leaves the correct account on the board. A failed local selection closes game, lesson and stamp writers. The local data module keeps the account shown in each tab. Each write checks that account against the shared owner. The account callback loads the selected data even when another tab already selects the same account and the cloud data is equal.

The page finishes a pending restore before it loads game data or lesson data. A failed restore keeps both readers and writers closed. Tests cover both read orders, a failed stamp write, a retry and a new move before account loading ends. The move stays in the active save and its later account copy.

Copies keep all unconfirmed changes. Only copies with a cloud confirmation record count toward the limit of three. Unknown status stays unconfirmed, including copies without a list entry. The code adds no account list UI.

- Review 1 red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME='review 1' npm test`. One test fails with the early play read. Green: the same command passes one test. Logs: `.web-sync-review1-red.log`, `.web-sync-review1-green.log`.
- Review 2 to 4 and storage red: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play}.test.ts' KINGDOWN_TEST_NAME='review (2|3|4|storage)' npm test`. Six tests fail. Green: the same command passes six tests. Logs: `.web-sync-review2-5-red.log`, `.web-sync-review2-5-green.log`.
- Storage also checks old copies without a list entry. Red: `KINGDOWN_TEST_FILE=src/account/sync.test.ts KINGDOWN_TEST_NAME='review storage' npm test`. One test fails with seven retained copies. The final selected run checks the fix.
- Final selection: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`. All 118 tests in seven files pass. Both type checks and all 57 art checks pass. Log: `.web-sync-focused.log`.
- The tests use fake timers. No real-time sleep runs in a test. The account checks use local storage and cloud substitutes.
- Review of the change: one local data module holds the restore order and the write check. Save and lesson writers use it. The settings fix stays separate. The other save lane still owns its stale-game check and failed-save notice.
- `npm run test:docs` passes all 178 tests in 15 files. `npm run check:browser new-game` passes. It builds the page and checks the local game, saved settings, reload, phone layout and start controls. No page or console error occurs.
- `git diff --check` passes. Review logs stay in `dist/web-sync-review/`. The browser run uses `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/web-sync-HGDHon/`.
- No full suite, live account request or database test runs. The separate lesson write race in ticket 02 stays open. No push, merge or deploy runs.

## Second review: finding 1

The age limit can remove A's only current game and lesson list. The sync module now records cloud confirmation only when every stored section matches the returned cloud data. The record names the exact game and lesson bytes. A later local change makes the record stale. A request with no returned row gives no confirmation.

The local data module counts only confirmed copies. It keeps unknown, changed and unreadable copies, with or without a list entry. Three confirmed copies can remain beside unconfirmed copies. Storage can grow while changes stay unconfirmed.

- Red and green command: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`.
- Red: four failures. The probes lose A's move or lesson data after sign-out, failed sync or no cloud receipt. The limit also removes copies with unknown status.
- Green: all 121 tests in seven files pass. Both type checks and all 57 art checks pass. Tests use fake timers.
- The probes switch A, B, C, D, A. They retain `e7-e5` and Guard. The limit test retains unknown copies and removes an old confirmed copy.
- Logs: `dist/web-sync-review2/finding1-red.log` and `dist/web-sync-review2/finding1-green.log`.
- Change check: the existing stamp record holds confirmation. The raw copy format and the restore path stay the same. No new key or dependency is needed.
