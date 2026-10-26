# 27 The settled wait misses the computer command that starts when a replay ends

Status: in review (CI and the full suite run on the PR)
Branch: staging/openplay-race
Base: origin/staging/first-game, 9b5b8016
Scope: tools only. No `src/` change, no longer time limit, no retry.

## Problem

CI run 40269187192, job `browser-webkit-ui`, check `plugin-ui`, fails at 399 s:

`locator.waitFor: Timeout 90000ms exceeded, waiting for frame.locator('#board-sheet[open]').getByRole('button', { name: 'Main menu', exact: true }) to be visible`

The wait is in `openPlay` (`tools/plugin-ui-check.mjs:245`), called at line 753, after Play now starts a solo game from a saved setup. The player is Black, with cards and king powers. At the failure, the board is idle: revision 3, turn 1 (the player's seat), 'Your move.', no pending command, Menu on. The audit of 2026-10-25 (`playtest/reports/audit-2026-10-25/flakes.md`, fault 5) records the same failure once in a local Chromium `plugin-ui-http` run, at revision 4.

## Cause (a race in the check)

1. The computer moves first. When its first action keeps the turn (a card or a power), its turn takes two `kingdown_computer` commands. Each reply animates on the board.
2. After the first replay, `src/plugin/screens/board.ts` (end of the replay in `draw()`) sets `data-animating` to false and calls `scheduleComputer()`, a 0 ms timer, in the same task. That timer starts the second command.
3. `settled()` (`tools/lib/plugin-settled.mjs`) ran its frame timer probe before its frame wait. The probe ran during the first replay, so it did not cover the timer of step 2. The frame wait then passed when the replay ended, the second fence came back before the timer, and the host call count did not change. `settled()` returned, and the second command started some milliseconds later.
4. `openPlay` then clicked Menu. The click waited while the write disabled Menu, and landed when the second reply enabled Menu and started its replay. A tap during a replay ends the replay and does nothing else (owner pick A8, `src/render/PaintedView.ts`), so the sheet did not open. A sheet that opens before the second reply closes when that reply draws (`draw()` closes the board sheets on a new revision). In both cases the wait for Main menu ends at its limit.

The app behaves as designed: a second tap opens Menu with Main menu. The fault is in the check helper.

Under Playwright's page clock (`page.clock.install`), a 0 ms timer that a timer callback sets gets 1 ms, so a later 0 ms probe from the check can also run before it.

## Fix

`settled()` now:

- runs the frame timer probe after the frame condition holds, so the probe comes after each timer that the step which ended the animation set;
- uses a 1 ms probe timer, which HTML and the page clock both run after each earlier 0 ms timer of the frame;
- reads the frame condition again at the end of the pass, so a timer that changes the frame runs the pass again.

`openPlay` and each other `idleBoard()` caller use this helper, so they wait for the whole computer turn. `tools/plugin-settled.test.ts` holds a frame whose timers run late, as the page clock can, and checks that `settled()` sees the call that a timer starts when the board animation ends.

## Evidence

The data of the reproduction are in the session scratchpad (`openplay-repro/`), not in the repository.

- Reproduction with the old helper (WebKit, CPU canvas, page clock; the `openPlay` steps after a Play now start, from the script's own saved setup with cards Freeze, Ice Wall, Strike, Haste and Leap): 2 of 40 natural games lose the Menu open (`check40.out`), each with a two-command computer turn. With an engine wrapper that makes the first computer action keep the turn, the check variant loses it in 3 of 6 games (`forceB.out`) and the logged variant in 3 of 10 (`loadD.out`). In each loss, `settled()` returns before (by up to 87 ms) or within 3 ms of the start of the second `kingdown_computer` call, and the Menu pointerdown comes during the second replay with no mousedown.
- The same forced reproduction with the fixed helper: 20 of 20 open the Menu (`after-forced.out`). In each game, `settled()` returns after the second `kingdown_computer` call.

| Check | Result |
| --- | --- |
| `KINGDOWN_TEST_FILE=tools/plugin-settled.test.ts npm test`, old helper, Chromium and WebKit | Fails: `{ calls: 0 }`, expected `{ calls: 1 }` |
| The same test with the fixed helper, Chromium and WebKit | Passes |
| `KINGDOWN_TEST_FILE='{tools/plugin-settled.test.ts,tools/plugin-motion.test.ts,tools/plugin-ios-size.test.ts}' npm test` | 60 tests and 57 Node tests pass |
| `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test` | 33 tests pass |
| `npm run check:browser plugin-ui` | Passes in 303.7 s |
| `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui` | Passes in 353.5 s |

The full test suite does not run for this fix. CI runs it.

## Other board taps after a computer write

Branch: staging/harness-menu. Base: staging/openplay-race, 7941f1d1. Scope: tools only, as above.

The review of the fix found more taps in the checks that can come right after a computer write with no `settled()` before them. The audit read each `#board-menu` tap and each other board control tap in `tools/plugin-ui-check.mjs` and in the check modules that it and `tools/web-game-check.mjs` call.

| Tap | Before | Now |
| --- | --- | --- |
| `menuAction` (`tools/plugin-ui-check.mjs`) | Waited only for `#board:not([data-animating="true"])`. That wait passes between the two replays of a two-command computer turn, so the Menu tap can land during the second replay. | `openBoardMenu()` |
| `openMoveChoices` (`tools/plugin-ui-check.mjs`) | Tapped Menu with no wait. | `idleBoard()` before its sheet test, then `openBoardMenu()` |
| Close of the Moves sheet in `checkSoloSync` (`tools/lib/solo-sync-check.mjs`), after the computer answers a remote turn | Waited for the board to stop, which can pass before the computer answers, then for 'Your move', which shows when the answer draws and its replay starts. The Close tap then can land during the replay; the later resign closes the sheet, so the check did not fail. | The embedded check passes `settle: idleBoard`. |

`openBoardMenu(page, frame)` (`tools/lib/plugin-settled.mjs`) waits for `settled()`, closes an open board sheet, and taps Menu. The sheet closes after the wait: its scrim blocks Menu, and a Close tap during a replay does nothing either.

Taps that need no change:

- `openPlay` taps Menu after `idleBoard()`. It has no recovery for a tap that the board takes during a replay, and it needs none: after `settled()`, no replay runs and no computer command is due. A retry would hide a fault of the wait.
- The other direct Menu taps in `tools/plugin-ui-check.mjs` (block player, Ranked, draft words, resign, abort, draw offer) are in friend games, or in solo games that `legacyStart` opens with the player as White to move, so no computer write comes before them. `tools/lib/card-detail-check.mjs` taps Menu on fixed views where the player has the move, after `settled()`. The square, coin, End turn and Undo taps after a computer turn come after `idleBoard()` (`sendTurn` starts with it).
- `tools/web-game-check.mjs` and `tools/lib/shared-mechanics-check.mjs` drive the website, which has no host call count, so `settled()` does not apply there. The website path of `checkSoloSync` keeps its old wait, so its Close tap can still land during the replay. This lane does not change the website checks.

| Check | Result |
| --- | --- |
| `KINGDOWN_TEST_FILE=tools/plugin-settled.test.ts npm test`, `openBoardMenu()` with the old `menuAction` wait, Chromium and WebKit | Fails: the sheet does not open (`expected false to be true`) |
| The same test with no wait, as the old `openMoveChoices`, Chromium | Fails the same way |
| The same test with the new helper, Chromium and WebKit | 2 tests pass |
| `KINGDOWN_TEST_FILE='tools/{checks.lint,plugin-ui-check}.test.ts' npm test` | 36 tests pass |
| `KINGDOWN_TEST_FILE='{src,tools,.claude/hooks}/**/*.docs.test.ts' npm test` | 178 tests pass |
| `npm run check:browser plugin-ui` | Passes in 337.3 s |
| `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui` | Passes in 407.3 s |

Other work loaded the machine during the two browser checks (load average 15 to 22), so their times do not compare with the runs above. The full test suite does not run for this change. CI runs it.

## Comments
