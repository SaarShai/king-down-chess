# 18 · Server limits and invite codes

Status: in-progress

## Scope

Build ticket 18-d and 18-e only, on `claude/server-limits`. The owner gives the build go on 2026-10-16. Server code only.

## Plan and checks

1. Add database counters for Computer, Create, Open and Report. Use the invite-try pattern: one atomic write, in its own commit, before the tool runs. Count refused calls too. Keep counters separate for each user and tool. Test the boundary, reset, user split and concurrent calls.
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

- Code commit: `7d4cc85a`. The server diff is complete. No UI file changes.
- `npx tsc --noEmit` passes.
- The first full `npm test` run has 163 passing files, four failing files, 2,556 passing tests, six failing tests and eight skipped tests. The failures come from repeated test handles, an out-of-scope test helper, old schema error text, and an old account test that expects report deletion to have no grant. Role block 10 already permits deletion under the retention policy. The test now checks that recent reports stay.
- The full recheck passes: 167 files, 2,562 tests pass, eight tests skip, and all 50 artwork tests pass. Exit 0. It uses the local test database at port 55432. Logs: `/tmp/kd-server-limits-recheck.log` and `.exit`.
- M1 `plugin-ui` passes in 219.3 seconds on `90db017a`. The first HTTP check fails at Join. A second run with a temporary status probe repeats the failure and shows HTTP 429. A focused HTTP regression fails in 668 ms: the third overlapping board read gets 429. The two-request cap is too low for normal board reads. The cap is now three, so another user keeps the fourth slot. The tests keep the abort and slot-release checks. No UI change is needed. The temporary probe is removed.
- The final unit and browser checks are pending. M1 uses `~/projects/kd-server-limits`.

Parts 18-a, 18-b and 18-c belong to other lanes.
