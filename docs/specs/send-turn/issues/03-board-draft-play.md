# Board: draft play, Undo and the turn button

Status: in-progress

All ticket 03 build items exist. All six review findings have fixes and tests. The local checks pass. The new M1 checks wait for the shared lock. The ticket stays open.

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

## Review fixes

Plan:

1. Check all six findings against the source and the approved design.
2. Fix each confirmed fault. Add a test for each fault. Test real drag and keyboard paths against legal moves.
3. Run the local unit tests with the supplied test database. Run the board tests as one local test file. Run plugin-ui and plugin-ui-http on the M1 in the lane folder, with the shared lock.
4. Record the results and commit on claude/od-board.

Checks:

- A dropped draft leaves only saved move text and marks. Resign and Abort show no draft move in the end card.
- A saved half turn names the correct turn button in both game modes.
- A send shows no instruction to press an off control. Piece and coin rules stay available.
- Escape clears selection, power and card arming, choices and the sheet. It keeps the draft.
- A draw offer keeps the short rule text and All rules. The controls fit at 320 px.
- Journey 4 uses occupied sources and legal destinations. The draft position and move calls stay fixed before the press and while Send waits.

Findings:

- A1 confirmed. A reply with no history and no move keeps the draft's lastMove. Reset it to the last saved move when the draft drops. Tests cover Menu Resign, Menu Abort, and an incremental draw reply with and without saved history.
- A2 confirmed. turnLine returns no words at zero staged steps. Use the ready half turn for its words. Model tests check Haste and Freeze in both game modes.
- A3 confirmed. The turn line and waitNotice name off controls during a send. Show Sending while the turn waits for its reply. Keep piece rule text during sends. Journey 4 checks the words before and during Send.
- B1 confirmed. The sheet Escape handler only closes the sheet. One handler now clears selection, power and card arming, and choices. It keeps the draft. Tests cover the Haste draft and both arming paths on the board and in a sheet. Stable rule-button IDs keep focus after the refresh.
- B2 confirmed. drawReply hides All rules, and the draw note replaces the short rule text. Keep All rules and add the draw note after the rule text. The 320 px test checks reads, control bounds and the text bounds before and during Send.
- B3 confirmed. The old drag starts on empty e5, and Enter reads a1. Journey 4 now attempts e7-e5 by tap, keyboard and drag. A second test attempts the player's legal Haste follow-up e4-e5 while Send waits. The engine confirms both moves are legal in their draft positions. Probes check that the real drag handler runs. Each path checks the full board FEN, the saved FEN and move calls.

Results:

- The local source suite passes on 805cc3b8. It uses npm test, the source test filter and the supplied test database. All 112 files and 1,619 tests pass; 8 tests skip. All 50 figure checks pass. The suite takes 95.53 seconds after the lock wait. Log: /tmp/kd-od-board-review-unit.log.
- The type check and commit hooks pass. The document checks pass all 114 tests in 8 files.
- The three tooling database files pass with the supplied database URL. All 10 tests and 50 figure checks pass. Log: /tmp/kd-od-board-review-db.log.
- The final board file passes all 56 tests with npm test and the single-file filter on this Mac. The type check and all 50 figure checks pass. The board file takes 132.30 seconds after the lock wait. This covers all six findings, the player's legal Haste follow-up during Send, Escape before the next tap, no blocked-move animation, and the draw layout at 320 px. Log: /tmp/kd-od-board-review-board-local.log.
- The document check passes all 114 tests in 8 files. No dependency, test limit or check limit changes.

M1 blocker and resume:

- The new plugin-ui and plugin-ui-http checks have not started at the checkpoint. The shared lock stays in use by other lanes for about 105 minutes after the first launch. The detached job stays queued. Do not start a second job.
- M1 job: PID 82165, script /tmp/kd-od-board-review-m1-named.sh, folder ~/projects/kd-od-board. It uses source commit cb5f0dd2. The later local commit adds test assertions and result notes only; the production source is the same.
- Read /tmp/kd-od-board-review-m1.results on the M1 when the job ends. The check logs are /tmp/kd-od-board-review-ui.log and /tmp/kd-od-board-review-http.log. The launcher log is /tmp/kd-od-board-review-m1.log. The script releases ~/projects/.check.lock through its exit trap, also after a failed check.
- Check each new failure against the source and the prior HTTP join-preview fault above. Record the two results here. Browser acceptance stays unverified until those checks finish.
