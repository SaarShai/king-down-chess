# Keep lesson completions from both devices

Type: task
Status: resolved

## Plan and checks

The owner requests audit finding F4. A stale device can send a newer list that omits lessons from the cloud.

1. Prove the loss with two devices on the real sync module and the existing timestamp rule.
2. Merge lesson names on a pull, even when the cloud time is older or equal. Read the latest cloud row before a lesson upload. Merge it with the current local list before the write.
3. Check clock differences, a failed read and a local completion during the read. Run focused tests in series. Commit F4 alone.

## Database boundary

[The account client](../../../../src/account/client.ts) upserts `public.user_data` and returns the kept row. [Migration 0001](../../../../supabase/migrations/0001_accounts.sql) defines the section timestamp trigger, own-row RLS and the authenticated read, insert and update grants. The trigger keeps a newer lesson section as a whole. It does not unite lesson names. No later migration replaces this rule.

An atomic union needs a server change. The owner permits a client read before the write and forbids a migration or grant change. Use that client repair. Two devices can still read the same old row and then write together. Record this race as a limit.

## Result and evidence

F4 reproduces. Device A sends Archer and Guard. Device B then sends its newer Archer and Ogre list. The old cloud result omits Guard. The old pull also ignores missing completions when the cloud time is older or equal.

Lesson lists now merge at any time. Before a lesson upload, sync reads the latest cloud row and merges it with the current local list. It keeps the higher section time, so a clock difference cannot prevent the union from reaching the server. A failed read sends nothing and uses the existing retry. A late read checks the stopped flag and the local account owner before it applies data.

- Red: `KINGDOWN_TEST_FILE=src/account/sync.test.ts KINGDOWN_TEST_NAME='F4 add-only' npm test`. Five tests fail before the F4 change; the future-clock control passes. Log: `web-sync-f4-red.log`.
- Green: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,account/account,account/client}.test.ts' npm test`. All 93 tests in five files pass. Both type checks and all 57 art checks pass. Log: `web-sync-f4-green.log`.
- The checks cover two stale devices, older, equal and future cloud times, a failed read, a local completion during the read, and a reply after stop or account switch. F1 still passes.
- Review: the repair uses the existing read, write, merge and retry paths. It adds no dependency, SQL function, grant, migration or game rule. It keeps the known read-to-write race in one source comment and in this ticket.

## Limits and follow-up

This client repair is not atomic. Two devices can read the same lesson row before either writes. A later accepted list can still omit a completion that the other device adds between that read and write. An atomic server union is the follow-up if this race must close. It needs separate authority for a database change.

The quiet lock stays in effect. No full suite, browser check, build, deploy, live account request or database execution runs here. CI must run the full suite and browser checks later.
