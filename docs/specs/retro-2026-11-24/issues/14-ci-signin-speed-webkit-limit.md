# Find why WebKit sign-in passes the 5 s limit by a small amount

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

tools/lib/signin-speed-check.mjs:117 asserts `row.elapsed_ms < 5000` for each entry and mode. In the WebKit jobs, the time is 5132 to 5797 ms, 3 to 16 % more than the limit. Chromium jobs did not fail on this line in the runs since 2026-11-05.

Runs and lines (exact):
- 45192452003 attempt 1 (2026-11-23, checks / browser-webkit-board (input)), attempt 2 green: `FAIL signin-speed       71.6 s  AssertionError [ERR_ASSERTION]: Account daylight sign-in takes 5231 ms with an unused offline card held for 12 s (limit 5000 ms)`
- 45181260544 attempts 1 and 2 (2026-11-23, same job), both red, not proven: `... Account daylight sign-in takes 5240 ms ...` and `... takes 5235 ms ...`
- 44485141044 attempts 1 and 2 (2026-11-19, browser-webkit-ui), attempt 3 cancelled, not proven: `... Account daylight sign-in takes 5367 ms ...` and `... 5373 ms ...`
- 44117703609 attempt 1 (2026-11-17, browser-webkit-ui), attempt 2 green: `FAIL signin-speed       51.7 s  AssertionError [ERR_ASSERTION]: Account home restore takes 5797 ms with an unused offline card held for 12 s (limit 5000 ms)`
- 43231607047 attempt 1 (2026-11-12, browser-webkit-ui), attempt 2 green: `... Account home restore takes 5132 ms ...`

## Change

First change (cheapest): put the per-row times in the job log, not only in the check log artifact. The `console.log` at tools/lib/signin-speed-check.mjs:104 goes to the check log; the job log shows only the FAIL line. Print the `rows` table (entry, mode, options_ms, elapsed_ms) in the assert message at :117.

Then pick one repair from the proof below:
- If the time is a fixed wait (a 5 s retry or timer in the sign-in path), remove that wait in the app.
- If the time grows with runner load, set the limit from the fault it guards: a held offline card holds for 12 s, so a limit of 8000 ms still catches a block on the card.

tools/lib/*-check.mjs is in the file list of lane seam-ci this week. Do not change it before that lane merges.

## Test that fails first

Forced order in a scratch copy:
1. Playwright route on the account origin that delays each `/auth/v1/token` and `/rest/v1/user_data` reply by 300 ms. If the daylight sign-in row grows by about 2 x 300 ms only, the time is load. If a time near 5000 ms stays the same with the delay at 0 ms on a fast machine, there is a fixed wait.
2. Hold the offline card (the 12 s hold) and make the list wait for it (a scratch change that awaits the worker install before the list). Red with `takes 12xxx ms ... (limit 5000 ms)` and with `(limit 8000 ms)`: the guard still catches the real fault with the higher limit.

## Known limits

- Cause not proven. The check log artifact of these runs has the per-row times; the job logs do not.
- 1e674c4e3 (2026-11-19) moved the start of the daylight sign-in time to the account tap. 74456576c (2026-11-20) added a wait for the resumed name view, which can make the measured time longer. The failures on 2026-11-23 come after both.

## Work record

Not started.
