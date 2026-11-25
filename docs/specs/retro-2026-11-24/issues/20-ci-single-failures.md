# CI reds that occur one time in a re-run (2026-11-05 to 2026-11-25)

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

Each row is one red attempt of a run that someone ran again. "Proven" means a later attempt of the same head is green. Lines are exact.

Open (no repair found):

| Run | Job | File:line | Failing line | Proven |
|---|---|---|---|---|
| 45130853149 | checks / test (2) | tools/plugin-motion.test.ts:481 | `FAIL  tools/plugin-motion.test.ts > releases Freeze at its card and rests in the same spent style (reduced motion false)` `Error: expect.poll() function didn't resolve in time.` | yes |
| 45085150926 | checks / browser-default (1) | tools/verify-painted-leaps.mjs:72 | `FAIL leap-start         43.2 s  AssertionError [ERR_ASSERTION]: a leap starts late` | yes |
| 45013437775 | checks / browser-ui (http) | tools/plugin-ui-check.mjs:1926 | `FAIL plugin-ui-http    268.7 s  AssertionError [ERR_ASSERTION]: The white pawn shows its rulebook symbol and army colour (223,206,172)` | yes |
| 45181260544 | checks / browser-webkit-ui (board) | plugin-ui check, 150% text scene | `FAIL plugin-ui         371.7 s  AssertionError [ERR_ASSERTION]: 150% text: 1 fault(s)` | no (attempt 2 red in another job) |
| 43726433342 | browser-ui | plugin-ui check | `FAIL plugin-ui         960.2 s  timed out at the 960 s limit` | yes |
| 43716368363 | verify | tools/plugin-app.test.ts:1379 | `FAIL  tools/plugin-app.test.ts > recovers a held move at 10 seconds and ignores its late reply` `TimeoutError: locator.click: Timeout 5000ms exceeded.` (waiting for `#end-turn[aria-disabled="false"]`) | yes |
| 42897489915 | verify | src/render/character-runtime.test.ts:329 | `FAIL  src/render/character-runtime.test.ts > ready character playback > drains synchronous image failures without re-entering the pump` `Error: Test timed out in 5000ms.` | yes |
| 42456046417 | browser-web | web-game check | `FAIL web-game           60.5 s  AssertionError [ERR_ASSERTION]: null-object response` | yes |
| 42305325857 | browser-web | web-game check, tools/lib/error-recorder-check.mjs:75 is the last pass line | `FAIL web-game          116.0 s  Error recorder: thrown error, rejection, private fields, opaque script filter, duplicate, five-report limit and missing table pass; ChatGPT bundle has no recorder` | yes |
| 42075593029 | verify | src/diagnostics/server.db.test.ts | `FAIL  src/diagnostics/server.db.test.ts > first-party fault HTTP and database writes > adds four concurrent function writes without a lost count` `AssertionError: expected [ { id: '73', …(12) } ] to match object [ { count: '4' } ]` | yes |
| 44278837637 | verify | tools/plugin-real-host.test.ts:96 | `FAIL  tools/plugin-real-host.test.ts > plays the recorded Knight cues in the widget only with Sound on` `AssertionError: expected [ 54022, 29108 ] to deeply equal [ 54022, 29108, 45908 ]` | no (attempt 2 cancelled) |
| 44278837637 | browser-board (board-drafts) | tools/plugin-board-drafts.test.ts | 7 tests: `× F11: tap skips the whole reply and keeps the server position` (also Escape, drag, Menu Escape, Moves Escape) and `× N11: the local move uses the web sounds at start, contact and rest` (also the replay move) | no (attempt 2 cancelled) |

Repaired (a later commit names this red or its cause):

| Run | Job | Failing line | Repair |
|---|---|---|---|
| 42499763088 | verify | `× the club level returns a legal move within its time cap`; `FAIL  src/ai/random-play.test.ts > agrees with the engine through seeded random games` `Error: Test timed out in 30000ms.`; `FAIL  tools/plugin-real-host.test.ts > serves the widget from a sandboxed second origin with the CSP of its resource` `TimeoutError: locator.waitFor: Timeout 5000ms exceeded.` | 403553252 |
| 42496377604 | browser-default | `FAIL character-prepare    6.5 s  AssertionError [ERR_ASSERTION]: a later move uses the recovered turn image` | 403553252 (tools/verify-character-prepare.mjs) |
| 42369216400 | browser-webkit | `FAIL  tools/plugin-board.test.ts > uses the correct seat line for computer=true at 320 × 568` `AssertionError: expected '' to be 'Their side stays hidden until you are…' // Object.is equality` | 23ec83276 |
| 42361145582 | verify | `FAIL  tools/offline-build.test.ts > rejects an invalid beam field in a build` `Error: Test timed out in 5000ms.` | b6b99a168 |
| 44257368883 | verify (check:vercel) | `AssertionError [ERR_ASSERTION]: Public build file: audio/armour/knight-land-A.wav` | ff008d428; a code fault, not a flake (attempt 2 cancelled) |

Not a failure: 44162426554 browser-default attempt 1 is `##[error]The operation was canceled.`

## Change

For each open row: first read the check log artifact of a new red (the job log has only the FAIL line), then make one family ticket if the line comes back. Cheapest first step for 42456046417 and 45181260544: print the response or the fault list in the assert message. For 43716368363, see docs/specs/retro-2026-11-24/issues/07-plugin-app-workers.md first: it can be the same worker cause.

## Proof

One red is not enough to name a cause. A row becomes a family when the same line comes back. Then use a forced order as in ticket 07 of the retro: a Playwright route that holds the request, an abort or a delay; red with the exact line without the repair, green with it.

## Known limits

The window is 2026-11-05 to 2026-11-25 (the oldest run the API gives back). Runs that failed and were not run again are not in this list: their heads did not pass later, so code changed.

## Work record

Not started (open rows). Repaired rows: see the commit in each row.
