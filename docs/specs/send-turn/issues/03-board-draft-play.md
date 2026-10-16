# Board: draft play, Undo and the turn button

Status: in-progress

All ticket 03 build items exist. The existing HTTP join-preview fault prevents a pass for the last check. The ticket stays open.

Source: owner ticket 12-submit-turn. Scope: design section 8, ticket 03.

## Plan

1. Merge the whole-turn server and the pure draft model. Keep both test groups.
2. Stage moves on the board. Add Undo and the sword turn button. Keep piece and coin reads available while play waits.
3. Change the browser checks and add the six board journeys. Check the types and all unit tests. Run the browser checks on the M1.
4. Get two independent reviews. Fix confirmed faults. Commit the result.

## Checks

- Journeys 1 to 4, 9 and 10 pass through the UI.
- Each new control has a 48 px target. The bar fits at 320 px. Reduce Motion stops the ready pulse.
- A press sends one actions list. Sent moves do not animate twice. The computer waits for the press.
- Type check, unit tests, plugin-ui and plugin-ui-http pass.

## Scope and taste

- T1a: End turn against the computer; Send your turn against a person. The sword is the only visible button content. Its name and title use these words.
- T2a: Undo, turn button, Menu. J7 already puts Resign and Offer draw in Menu.
- T3a: show the off button on their turn. T4a: one ready pulse; colour only with Reduce Motion.
- T5a: no extra unsent mark. T7a: no leave prompt.
- Ticket 04 owns private state restore, refusal codes and draft recovery. Ticket 05 owns submission copy. Ticket 06 owns the unfinished-turn server check. T6 belongs to ticket 04.

## Evidence

- Merge commits `2a845f90` and `ceea1011` bring in the server and model first. The server merge has no conflict. The model merge has one test conflict. Both draft tests and time-left tests stay.
- Two independent readers check the final source. The confirmed fixes keep the off controls in the Tab order during Send, keep read-sheet opener focus, add the turn press to old saved-turn test flows, draw the draft after failed motion, keep the pending connection error during reads, and show Their move during the opponent's Haste turn. Both readers report no open fault.
- `npx tsc --noEmit` passes. The final single-file board run also runs the type check. It passes all 47 board tests and 50 figure checks in 126.85 seconds. Journeys 1 to 4, 9 and 10 pass. The log is `/tmp/kd-od-board-final-board.log`.
- The local source unit suite uses the supplied test database and two workers. It passes 112 files and 1,619 tests; 8 tests skip. All 50 figure checks pass. It takes 113.58 seconds after the lock wait. The log is `/tmp/kd-od-board-unit.log`.
- The local model file passes 46 tests. The merged server fixture file passes 8 tests. The local motion file passes all 14 tests. The three tooling database files pass all 10 tests with the supplied database URL. Their logs are `/tmp/kd-od-board-fixture-unit.log` and `/tmp/kd-od-board-followup.log`.
- The M1 full `npm test` run at `059b138a` passes 155 files and 2,501 tests in 451.02 seconds. It has 131 skips without the database URL. The local database runs cover the 121 database skips; 10 optional tests stay skipped. All 50 figure checks pass. The final Haste prompt guard and its new test then pass in the 47-test board run. The full log is `/tmp/kd-od-board-full-final.log`.
- The full run finds three old motion tests that wait for an immediate save. Their shared helper now presses the turn button and checks that the end card stays closed before the press. The repeated motion file and full suite pass. The busy-control test now reads the native disabled property and checks Tab access; Playwright treats `aria-disabled` as disabled in its role check.
- The M1 protocol check passes on `42c91498`. The first named fixture check stops at the old sprite count. Undo and the sword add two symbols, so the check now expects 23.
- The final M1 `plugin-ui` check passes in 231.4 seconds at `42c91498`. It includes the final Haste guard. The rendered 390 px board shows the right-pointing sword and all three bar controls. The page payload is 690,029 bytes, below its 1 MB limit. The local log is `/tmp/kd-od-board-ui-final.log`; the sample is `/tmp/kd-od-board-sample.png`.
- The M1 `plugin-ui-http` check fails in 157.6 seconds at `tools/plugin-ui-check.mjs:902`. After the join screen remounts, `#join-confirm` stays hidden for the existing 30-second limit. Profile, setup and seat flows pass. This join block agrees with the server input. Ticket 01 records the same fault on base `d748b1b6` with the same limits. Ticket 03 changes no join code. The local log is `/tmp/kd-od-board-http-final.log`. This existing fault prevents full HTTP acceptance; no ticket 03 build part is missing.
- The M1 job uses the lane folder and the shared check lock. It releases the lock after the failed HTTP check. The local summary log is `/tmp/kd-od-board-browser-final.log`.
- The final doc check passes 8 files and 114 tests in 1.84 seconds. No test or check time limit changes. No dependency changes.
