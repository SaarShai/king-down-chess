# 27 The settled wait misses the computer command that starts when a replay ends

Status: resolved
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

- Reproduction with the old helper (WebKit, CPU canvas, page clock, the exact `openPlay` steps): 2 of 40 natural games lose the Menu open, each with a two-command computer turn. With an engine wrapper that makes the first computer action keep the turn, 9 of 20 lose it. In each loss, `settled()` returns before (by up to 87 ms) or within 3 ms of the start of the second `kingdown_computer` call, and the Menu pointerdown comes during the second replay with no mousedown.
- The same forced reproduction with the fixed helper: 20 of 20 open the Menu. In each game, `settled()` returns after the second `kingdown_computer` call.

| Check | Result |
| --- | --- |
| `KINGDOWN_TEST_FILE=tools/plugin-settled.test.ts npm test`, old helper, Chromium and WebKit | Fails: `{ calls: 0 }`, expected `{ calls: 1 }` |
| The same test with the fixed helper, Chromium and WebKit | Passes |
| `KINGDOWN_TEST_FILE='{tools/plugin-settled.test.ts,tools/plugin-motion.test.ts,tools/plugin-ios-size.test.ts}' npm test` | 60 tests and 57 Node tests pass |
| `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test` | 33 tests pass |
| `npm run check:browser plugin-ui` | Passes in 303.7 s |
| `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui` | Passes in 353.5 s |

The full test suite does not run for this fix. CI runs it.

## Comments
