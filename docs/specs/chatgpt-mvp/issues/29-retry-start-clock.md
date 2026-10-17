# Retry and the device clock

Status: ready-for-human

On 2026-10-15 the test "keeps a timed-out start and its Retry on New game when the player leaves at the wait line" failed one time on `claude/submission-fixes` (73627094). A browser check ran on the same Mac. The test expected one `kingdown_create` and received 2. Work is on `claude/retry-held-create`, from `claude/fault-round-2` (fd8e1341). Do not merge to main.

## Cause

The fault is in the product, not in the test. The test counts the calls correctly: Retry really sends a second Create.

1. Retry reads the board before it sends the start again (`resendPending` in `src/plugin/app.ts`). The read finds the game that the held Create made.
2. The page accepts that game only when `created_at >= started_at`. `created_at` is server time. `started_at` is device time.
3. The two clocks are not the same clock. Under load, the Playwright page clock was 1 to 14 ms ahead of the server clock (each failed repeat logged its read). The page then rejects its own game and sends Create again. The server gives back the first game because the command ID is the same, so there is one game but two sends.
4. A real device clock is often seconds ahead of or behind the server. Ahead, Retry always sends again. Behind, the check also accepts a board game made up to that many seconds before the start; the game tag stops only the game that the board showed.

## Fix

The device clock now measures only the time since the start. The read's `server_now` minus that time puts the start on the server clock. A game counts as the start's game when `created_at` is at or after that moment. No clock offset enters the check. The margin is the reply time of the read.

## Checks

- New test "makes one game when Retry reads a timed-out Create and the device clock is ahead of or behind the server". The page clock runs 60 s ahead, then 60 s behind. It fails on the old code (2 sends) and passes with the fix.
- The reported test with `repeats: 40` under load before the fix: 1 failure in 41 runs. Two such runs at the same time with `repeats: 60`: 13 failures in 122 runs.
- After the fix, the same two parallel runs (the reported test with `repeats: 60` and the new test), with a load average of about 40: 0 failures in 122 runs.
- The time limits do not change. The `repeats` option was for the load runs only and is not committed.
- `npm test`, two runs while other sessions loaded the Mac (load average 22 to 40): 2,395 passed, 130 skipped, 1 failed. Both runs failed only in `src/rules/power-fixes.test.ts` ("on random boards each reading changes exactly what its sentence says"): a 5 s time-out (8.4 s, then 5.9 s). This change does not touch that code. The file alone passes, 35 of 35, in 7.3 s.
