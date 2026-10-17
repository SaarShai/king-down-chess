# Rolling QA 2: end card at 200% zoom

Status: in-progress

This step covers ticket 32 fault C only. The base is `4692477c`.
The owner asks for the cut-action cue. No new visual cue is needed.
Faults A and B are refuted. Faults D and G are outside this step.

## Plan and checks

1. Tighten `zoomEndFits` on a built page. Open a fresh mobile host at 197 x 426 with touch, fullscreen and insets 51/59. At scroll top zero, Play again fits and at least 12 px of New game shows below it. New game must cross the card edge. Scroll each of the three actions into the card and frame. Check each centre with `elementFromPoint`.
2. Commit the check before the CSS fix. Run `plugin-ui` with the owner's runner. Record its failure against the base CSS. Add the same cue and full-button checks to the existing host-size test.
3. Fix `end.css` under 320 px. Keep the cut-action cue and Back clear. Test a frame bottom gap of 96 px and 59 px. Keep the board and hall CSS as they are.
4. Run `npx tsc --noEmit`, `npm test` with the local test database, and `plugin-ui` through the owner's runner. Keep all time limits. Check the existing normal-size cases. Record the evidence and commit the result.

## Evidence

Work starts with a clean worktree on `claude/qa2-faults` at `4692477c`.

- The base CSS fails the new check at `f76584ce` on the M1. This commit changes checks only. Frame: y 51 to 330. Card: y 107 to 318. New game starts at y 332.84 and ends at 376.84. No part shows. Log: `checks-zoom-end-baseline-3.txt` in the lane folder.
- The first check run at `9bd6a47c` stops on the full Play again assertion. It ends at y 322.84, 4.84 px past the card edge. The next check puts the cut-action assertion first. Both runs use a fresh mobile host, with the built page and fonts ready.
- The fix changes only the under-320 px rules in `end.css`. It caps the card at 224 px, sets top padding to 8 px, hides the empty line above a loss, and removes the title's bottom margin. It keeps the win text, result type, button order and cut-action cue.

## Final checks

- `npx tsc --noEmit`: pass, including a final run after the check repairs.
- `npm test`: pass with the local test database. All 188 files pass. There are 3,051 passed tests, one expected failure and eight skips. All 51 art tests pass. Log: `tests-zoom-end-1.txt`. The command waits for the shared test lock before it starts. No time limit changes.
- `plugin-ui`: pass on the M1 at `5a3ebde3` in 141.2 seconds. The runner ends with `check-runner: M1 exit 0 at 5a3ebde3`. Log: `checks-zoom-end-fix-3.txt`. Full detail: `browser-final-detail.txt`.
- The existing 320 x 568, 393 x 852 and 1280 x 800 checks pass. The product diff applies below 320 px only. The board and hall CSS do not change.
- The new check uses a fresh 197 x 426 mobile host with touch, fullscreen and insets 51/59. It tests both win and loss with the three solo actions. It checks the result, the full first action, the cut second action and all three full action boxes and centre hits after scroll.
- The host-size test also checks the cut second action at scroll top zero and the full bounds of each action after scroll. Its existing Back check stays.
- All four saved images pass visual review. Back stays clear. The win text and the button order stay. The cue uses the cut action. No new visual element is added.
- `node --check tools/plugin-ui-check.mjs` and `git diff --check`: pass.

The measured boxes use CSS pixels. New game is 44 px high in all four cases.

| Result | Bottom gap | Frame y | Card y | New game y | Part in view |
| --- | --- | --- | --- | --- | --- |
| Loss | 96 | 51 to 330 | 107 to 318 | 300.84 to 344.84 | 17.16 px |
| Win | 96 | 51 to 330 | 107 to 318 | 303.75 to 347.75 | 14.25 px |
| Loss | 59 | 51 to 367 | 131 to 355 | 324.84 to 368.84 | 30.16 px |
| Win | 59 | 51 to 367 | 131 to 355 | 327.75 to 371.75 | 27.25 px |

The 59 px bottom-gap case passes. It does not need a follow-up.

## Check repairs and limits

The first fixed run at `ee8a01b7` passes both loss cases. The win sample fails to mount because the new host has no board ID for that sample. The repair passes the host board ID and holds the sample through the mount read with the harness's existing reply override.

The next run at `8f9c071b` reaches the win buttons. That old sample is a friend game, so it has Rematch and a block control. The check asks for Play again. The repair uses the solo actions for both results. The full check then passes at `5a3ebde3`. These are check setup repairs. The CSS stays at `ee8a01b7`.

The failed `8f9c071b` check ends on the M1 in 154.4 seconds. Its SSH process remains open after that end. The lane stops only its own SSH PID 99719 after it reads the saved end record. The runner returns 255. The final passing run ends on its own.

No server code changes. `plugin-ui-http` is not needed. No requested part of fault C remains. A and B stay refuted. D and G are outside this step. No push, merge or deploy is made.

The compact spacing keeps the approved cut-action cue and the current text. No new visual element is added.

## Review repair plan

Review A reports no fault. Review B reports that the width-only 224 px cap cuts the actions in a tall frame. The CSS confirms this cause.

1. Add a fresh 197 x 800 mobile host with insets 51/0 to `zoomEndFits`, for loss and win. At scroll top zero, all three actions must fit inside the card and frame, with no scroll. Add the tall case to the host-size test.
2. Commit the checks. Run `plugin-ui` through the owner's runner against the current CSS. Record the tall-case failure.
3. Keep the 224 px cap on short viewports only. Keep the narrow spacing and `calc(100% - 68px)` at other heights.
4. Run `npm test` with the local test database and `plugin-ui` through the owner's runner. Keep all time limits. Check both short bottom gaps and the existing normal sizes. Record the results and commit the repair.
