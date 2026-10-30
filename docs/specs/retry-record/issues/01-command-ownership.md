# Keep the recovery record for its command

Type: task
Status: resolved

The owner requests audit finding 1 on `staging/fix-retry-record`.
Base: release 3, `f8fcec0a4d282822fbde913813eff386f2f9c0f2`.

## Plan

1. Add a failing test. Two tabs retry command X. One reply clears X.
   Command Y starts. The late reply for X must keep Y's record.
2. Clear only the record for the completed command. Use one account lock
   for each record write and clear across tabs. Keep requests outside the lock.
3. Run the affected tests, the full tests, doc checks and a local browser check.
   Use the shared test lock and browser slots.
4. Commit with the unchanged hooks. Push and open a pull request into main.

## Acceptance

- Test all success and refusal orders for the two replies to X.
- A lost reply for Y keeps its exact inputs after a reload.
- Record writes and clears use the same lock across tabs.
- A completed command clears its own record.
- No deploy, account sign-in, remote database or animation bank change.

## Evidence

- Before: the four new reply-order cases fail on the release code.
  Each late reply deletes Y's record. The test expects Y and gets no record.
  Selection: `KINGDOWN_TEST_FILE=src/online/runtime.test.ts` and
  `KINGDOWN_TEST_NAME='keeps a newer command after two tabs retry'`, with `npm test`.
  Log: `retry-record-logs/before.log`.
- After: the affected run passes 138 tests in four files and 67 artwork checks.
  It covers all reply orders, a queued clear, a blocked write and cancellation.
  Files: `src/online/{runtime,client}.test.ts` and
  `src/plugin/{client,queue}.test.ts`.
  Log: `retry-record-logs/affected-final.log`.
- Full `npm test`: 287 files pass; 5,709 tests pass and eight skip.
  All 67 artwork checks pass. The database URL uses only the local test
  Postgres at `127.0.0.1:55432`. Log: `retry-record-logs/full.log`.
- `npm run test:docs`: 183 tests pass in 16 files.
  Log: `retry-record-logs/docs.log`.
- Two real tabs in Chrome and WebKit pass eight reply orders and two
  shared-lock cases. Y survives its lost reply and reload in each order.
  Log and check: `retry-record-logs/two-tabs.log` and `two-tabs.mjs`.
- `npm run check:browser web-online`: passes in 102.8 seconds with the local
  test database. Log: `retry-record-logs/web-online.log`.
- The affected, full, doc and two-tab checks hold the shared test lock and
  all three browser slots. The named browser check uses the repo runner's locks.
- No deploy, sign-in, remote database or animation bank change.

## Result

The success and refusal paths remove the account record without an ownership
check. A reply for X can thus remove the later record for Y.

Each clear now checks the full saved receipt under the account's Web Lock.
Each record write uses that same lock. The check and removal form one locked
step across tabs. A network request does not hold the lock.

Independent review remains before merge.
