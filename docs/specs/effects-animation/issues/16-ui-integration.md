# Approved interface motion in the game

Status: resolved
Type: task

## Scope and result

The owned UI implementation is complete. It applies the original 18 approved interface studies to real UI events. It keeps current art, text, layout and rules. The five later object studies stay in the workshop. Root owns the final review, combined checks and merge. No deploy, commit or PR runs.

## Plan and checks

1. Audit each approved study and its real consumers. Record all 18 IDs below.
2. Add one small playback helper. Use event onset times and native animations. Keep the readable result in the DOM.
3. Capture an early real game at 430 px and 390 px, in both board directions. Check one-time onset, hidden tabs, disposal and motion settings.
4. Run focused tests and current browser checks. Record exact cases and limits.

All four steps pass the worker checks. The playback helper is 100 lines. It has no clock loop, timer, dependency or event registry. Rebuilt controls seek to the same event time. Hidden, replaced, disabled and disposed playback cannot write late state. Only explicit dialog opens opt into a sheet transition. The page and menu keep their own lifecycle.

## Effect matrix

| ID | Real component and event | Applied motion and limit |
| --- | --- | --- |
| victory | Local `connectGameEnd`; account `endScreen`, after a live finish | Reviewed title scale/blur settle, real king art and result detail. Existing real recap tiles remain. Reload is still. No fabricated recap or second king fall. |
| timer | Account `updateTime`, on a new authoritative deadline, warning and expiry | Short start reveal, one border/lift beat when the real deadline crosses one minute, then readable expired feedback. Hours/minutes stay. The sample seconds clock has no real time-control trigger. |
| army | Local `newGame`; account creation or setup/waiting → playing | King portrait first, real board/army fade, then first prompt. Pieces remain in the renderer. An unknown first host projection stays still because it cannot prove a new start. |
| turn | Local `handOver`; account authoritative side change | The reviewed diamond travels once between the real portrait positions. No repeating waiting pulse. A staged move alone does not send the turn. |
| check | Local committed check; account live check onset | One tightening red frame and word reveal. Portrait art stays still. The red state remains readable. Initial and historic checks are still. |
| defeat | Live local/account loss | Quiet downward art/title settle and real result detail. No victory flourish or new board fall. |
| draw | Live local/account draw | Both existing king portraits meet from opposite sides. The real reason stays. No invented agreement message. |
| abort | Account live aborted/no-start result | Level fade on the existing result. Solo Abort keeps its current return-to-setup flow, which has no result panel. |
| cards | Account live deal, arm and spent-state change | Original stagger, scaled selection lift and press into the existing grey spent state. The old gold pulse is removed. No coin-spend object study. Refill has no rule or trigger. |
| power | Real power-use count increase in account/local play | Emblem breath and only the newly spent notch close once. Other uses stay still. Always-on powers gain no false spend. |
| promotion | Real local promotion picker and account promotion choices | Panel rise and brief option stagger. The chosen move resolves at once. No fake selected hold or input delay. Auto-queen stays unchanged. |
| confirm | Successful account move write | A small check draws in the existing turn button after success. Current label, width and live-region text stay. No fabricated send result. |
| failure | Actual account command error and Retry | Error settles below the pending action; Retry enters in place. The draft and current error text stay. No screen shake. |
| history | Local `showPly`/Undo; account draft Undo | The real move label moves in the direction of review. Existing board replay/rewind stays unchanged. Account play has no new replay rail. |
| dialog | Explicit board sheets, New game, Guide and promotion | Reviewed rise/scale and soft native backdrop, with reverse exit. Native close and focus stay immediate. Closing sheets reject pointer input. Resize does not restart motion. |
| button | Existing real button press | The existing two-pixel face press already matches the study. Off/reduced choices keep it still. Flat controls keep their current style. |
| connection | Actual stale/read notice and successful recovery | The real notice enters from above. Recovery gives one quiet reveal of the current status. No mocked loss or recovery text. |
| lesson | `LESSONS` goal succeeds in local play | The completed progress icon settles once; the real learned line and Next lesson enter. Existing saved progress supplies the state. No invented progress bar or lesson text. |

## Caller audit

At `stageMove` and response playback in `plugin/screens/board.ts`, `drop === undefined || move.power` now reaches `board.animateMove`. The pre-animation sync bypass also applies only to an ordinary reserve drop. Ordinary reserve drops keep their old path. Board animation method semantics do not change.

The other UI callers are local commit, local review, `ui/previously.ts` and `ceremony.ts`. None has a drop-specific `animateMove` bypass. Their character/action animation stays unchanged. Renderer, marks, scene, engine, board effect modules and registry are untouched.

## Evidence

- [Early real game](16-ui-evidence/GAME_READY.md). Captures include 430/390 px and both board directions.
- Focused command: `KINGDOWN_TEST_FILE='src/{ui/motion,plugin/screens/lifecycle,plugin/screens/board-model,ceremony-game,ui/powers}.test.ts' npm test`. Result: 5 files, 96 cases pass. The required command also runs all 50 scene tests; all pass. Log: `/tmp/effects-ui-focused-tests.log`. This is not a full unit-suite claim.
- `npm run check:browser turn powers lessons end gui-board-a8`: all five pass. Run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-ui-game-gprWXd/`.
- Final rerun after result-lifecycle fixes: `npm run check:browser end gui-board-a8`: both pass. Run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-ui-game-pPwpE4/`.
- The end browser check asserts live once, Normal/Fast timing, no resize/reload replay, system reduced motion, Off, one result announcement, focus, New game cancellation and readable results. It saves 430/390 px live result PNGs and both board directions.
- The helper tests cover replacement, remaining event time, hidden onset consumption, cancellation, disposal, focus and settings. The account lifecycle test keeps a new result through board unlock, plays it once and cancels it on navigation.
- Visual inspection checks the early 390 px Black view and the final 430 px live result. The phone result and actions fit. `git diff --check` passes.

### UI regression follow-up

The focused baseline reproduces all five reported failures. Each old assertion names replaced motion: no loss motion, the gold card pulse, CSS deal classes (two cases), or the old board fade. No production fault is found. Only `tools/plugin-motion.test.ts` changes. It checks the approved native keyframes and Fast timings, one event time across rebuilt controls, completion, reduced motion, grey spent-state contrast, and no replay on result reopen, game remount or reload. The loss check keeps the last move and rejects a victory ceremony.

`KINGDOWN_TEST_FILE='tools/plugin-motion.test.ts' npm test` waits for the shared lock and passes typecheck, all 20 selected cases and all 50 required scene cases. Log: `/tmp/effects-ui-regression-check-2.log`. `git diff --check` passes. This is not a full-suite pass. The launch snapshot is `/tmp/effects-ui-game-launch.diff`; the file copies in `/tmp/effects-ui-regression-launch/` define the incremental diff. No renderer, engine, registry, global tracker, combat or excluded board indication changes.

## Files owned and changed

- `src/ui/motion.ts`
- `src/ui/motion.test.ts`
- `src/game-end.ts`
- `src/new-game.ts`
- `src/screen/play.ts`
- `src/ui/guide.ts`
- `src/style.css`
- `src/plugin/screens/board.ts`
- `src/plugin/screens/board.css`
- `src/plugin/screens/end.ts`
- `src/plugin/screens/end.css`
- `src/plugin/screens/lifecycle.test.ts`
- `tools/verify-end.mjs`
- This ticket and `16-ui-evidence/GAME_READY.md`.

## Limits for root

No implementation blocker remains in the owned scope. The engine has no card refill or seconds clock. A first host projection with no known creation event stays still. Promotion choice and native dismissal remain immediate. The account's existing Off choice is Symbols only; local play also has Normal/Fast/Off. OS reduced motion applies to both.

The five later object samples remain unintegrated and need owner feedback: coin-spend, draw-reply, opponent-found, setup-ready and invite-copy. This work makes no new owner-approval claim. Root still owns combined card/state verification, independent review, registry changes and merge. Worker checks do not claim a full multiplayer/network-failure visual review or full unit-suite pass.
