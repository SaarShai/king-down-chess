# 18 · Server limits and invite codes

Status: resolved
Parts: 18-d and 18-e

## Scope

Build ticket 18-d and 18-e only, on `claude/server-limits`. The owner gives the build go on 2026-10-16. Server code only.

## Plan and checks

1. Add database counters for Computer, Create, Open and Report. Use the invite-try pattern: one atomic write, in its own commit, before the tool runs. Count refused actions too. Keep counters separate for each user and tool. Test the boundary, reset, user split and concurrent calls.
2. Keep the four-slot server cap. Add a three-slot cap for each user. Keep these slots until work ends, also after a client disconnects. Test both caps and slot release.
3. Store short invite codes with HMAC-SHA-256 and `KINGDOWN_INTERNAL_SECRET`. Keep long tokens on SHA-256. Test the stored hash, preview and join, and refusal without the secret. Add release notes.
4. Run `npx tsc --noEmit`, `npm test` with the local test database, and M1 browser checks `plugin-ui` and `plugin-ui-http`. Read each result. Commit the code and evidence on this branch.

## Limits and choices

- Computer: 120 calls per minute. A human needs time for a move before each computer turn.
- Create: 30 calls per minute. This permits a burst of new games beyond normal play.
- Open: 60 calls per minute. This permits one new board each second.
- Report: 30 calls per hour. This permits many reports without an open path to fill the table.
- HTTP: three active calls per user. The board can overlap three reads. One user cannot hold all four server slots.
- The existing internal secret also protects short codes. HMAC uses a fixed invite-code prefix. No new setting is needed. The review-data tool also needs this secret; its command notes and owner steps state this. Old short codes stop working; long links still work.

## Results

Both requested parts are built. Server code commit: `5ce3a95c`. Parts 18-a, 18-b and 18-c stay outside this lane. No product UI file changes.

- `npx tsc --noEmit` passes.
- The focused HTTP suite passes all 18 tests in 606 ms. The new three-read test fails before the cap fix: it gets HTTP 429 instead of 200, in 668 ms.
- The final full `npm test` run passes 167 files and 2,563 tests. Eight tests skip. All 50 artwork tests pass. Exit 0. Database tests use the local database at port 55432. Log: `/tmp/kd-server-limits-final-tests.log`.
- Tests cover each tool limit, the reset window, separate users and tools, concurrent calls, refused actions, no game/board/report change after a refusal, the four-slot server cap, the three-slot user cap, client disconnects and slot release. HMAC tests check the stored value, two code formats, preview, join, a new server instance, an absent or changed secret, and old long links. Schema tests check migration repeatability, runtime grants and browser-role refusal.
- M1 `plugin-ui` passes in 216.2 seconds on `5ce3a95c`. Output folder: `kd-server-limits-0ubWI0`.
- M1 `plugin-ui-http` fails in 153.5 seconds on `5ce3a95c`. After a Join-screen remount, the second preview returns but `#join-confirm` stays hidden (`tools/plugin-ui-check.mjs:905`). Output folder: `kd-server-limits-3M7HiL`.
- A temporary Join-result probe repeats the failure in 153.7 seconds. Both preview calls succeed and return preview data. Neither has an error code. Output folder: `kd-server-limits-zHbQcu`. The probe is removed.
- The parent commit `74fcebc0`, before this lane, fails the same HTTP check at the same line in 150.9 seconds. Output folder: `kd-server-limits-d7CSeg`. The Join screen and its browser test have no diff between the parent and this lane. This existing remount failure stays outside the server-only build. The M1 checkout returns to `5ce3a95c`, with no changes. The check job releases its lock.

M1 output folders are under `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/`. The wrapper logs are `/tmp/kd-server-limits-m1-final.log`, `/tmp/kd-server-limits-m1-join-probe.log` and `/tmp/kd-server-limits-m1-baseline.log`.

## Review fixes

The first test run finds repeated test handles, one test helper outside its scope and old schema error text. These are fixed. An old account test expects no report-delete grant. Role block 10 already permits deletion under the retention policy. The test now checks that recent reports stay.

The first two-request user cap also refuses a normal third board read. A temporary status probe shows HTTP 429; the test host turns it into HTTP 500. The three-request cap fixes those transport errors and keeps one slot for another user. The focused regression test goes from red to green. The existing Join remount failure remains on both this lane and its parent.
