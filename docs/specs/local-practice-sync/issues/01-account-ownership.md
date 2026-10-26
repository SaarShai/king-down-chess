# Keep local cloud data with its account

Type: task
Status: resolved

## Plan and checks

The owner requests audit finding F1. The local save has no account ID. A switch can send A's data to B.

1. Add failing tests for a switch to B with and without a cloud copy.
2. Bind the local save, lessons and section times to the account. Keep the first anonymous import. Keep A's raw copy before a switch. Restore it when A returns.
3. Show B's copy after a switch. Open a new game if B has no game. Keep sign-out local play.
4. Check late replies, storage failure and the page handover. Run focused tests in series. Commit F1 alone.

The source of the existing behavior is the accounts section in [the task archive](../../../tasks-archive/2026-10.md) and [save ownership](../../web-adaptation/issues/11-save-ownership.md). Sign-out keeps local play. A change of account must not import another account's local data.

## Limits

The quiet lock is present. No full suite, browser check, build, publish or database change is in scope.

## Result and evidence

F1 reproduces. The old sync has no local owner. It compares A's times with B's times. Three new cases fail on the old source: B with data, B without data, and a late A reply.

Each remote now carries its user ID. The first account claims local data before its first cloud read, even offline. A switch stores the old raw save, lessons and times under `kingdown.local.<user ID>`. The new account loads its own copy. A pending restore record keeps a failed key write from assigning old bytes to the new account. Return to A restores A's copy and sends A's unsent moves to A only.

The page replaces its live game on a switch. A new account with no game starts fresh. The settings controls return to their initial values before they take the new account's settings. Sign-out keeps the current local game. The old sync refuses local work and late replies after the owner changes.

- Red: `KINGDOWN_TEST_FILE=src/account/sync.test.ts KINGDOWN_TEST_NAME='F1 account ownership' npm test`. Three tests fail on the old source. Log: `web-sync-f1-red.log`.
- Green: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,account/account,account/client}.test.ts' npm test`. All 85 tests in five files pass. Both type checks and all 57 art checks pass. Log: `web-sync-f1-green.log`.
- The checks include first import, offline first sign-in, sign-out, both B states, return to A, late reads, failed archive writes and a restore that resumes after reload.
- Review: the change keeps the existing save keys and section merge. It adds one owner record and one raw copy per account. No new dependency, service, game rule or SQL change is needed.
