# Rolling QA 2: end card at 200% zoom

Status: ready-for-human

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

## Review repair evidence

- Review A: no findings. No repair is needed.
- Review B, finding 1: confirmed. The new browser check fails on the current CSS at `7a71f9c7`. The loss case has a 653 px frame and a 224 px card at 197 x 800. All three actions do not fit. The M1 ends with `check-runner: M1 exit 1 at 7a71f9c7` after 91.9 seconds. Log: `checks-zoom-end-review-baseline-1.txt`; full detail: `zoom-end-review-baseline-detail.txt` in the lane folder.
- The repair keeps the 224 px cap only at viewport heights of 480 px or less. All other narrow viewports use `calc(100% - 68px)`. The two short cases keep their existing rules. Widths of 320 px or more keep their existing rules.
- The checks use fresh mobile hosts at 197 x 426 with insets 51/59 and at 197 x 800 with insets 51/0. Both result types must pass. The tall case requires all three actions to fit at scroll top zero and no card scroll. The host-size test adds the same tall loss case.

- `plugin-ui`: pass on the M1 at `72616464` in 144.0 seconds. The runner ends with `check-runner: M1 exit 0 at 72616464`. Log: `checks-zoom-end-review-fix-1.txt`; full detail: `zoom-end-review-fix-detail.txt` in the lane folder.
- At 197 x 800, the loss card is 369.44 px high (`scrollHeight` and `clientHeight`: 367). The win card is 372.34 px high (`scrollHeight` and `clientHeight`: 370). All three actions fit at scroll top zero. Both short bottom-gap cases keep the cut New game cue and the full action checks after scroll.
- The existing 320 x 568, 393 x 852 and 1280 x 800 browser checks pass. All six saved end images pass visual review. Back stays clear. The tall cards show all three actions.
- No server code changes. `plugin-ui-http` is not needed.

The first full test run starts after about 22 minutes in the shared queue. It reports three match test failures, one database test failure, and one failure in the new tall unit check. The new assertion includes the hidden Skip button. Its empty box fails the bounds check. The repair excludes hidden buttons, as the browser check already does. The lane stops only its own test runner, PID 94289, with SIGINT to repair this check. The command exits 130. Log: `tests-zoom-end-review-1.txt`. This run is incomplete and is not a pass. No time limit changes.

The host-size and full-suite repeats use the local test database and the current limits.

The host-size file passes through `npm test` with `KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts`. All 31 tests pass in 40.21 seconds, including the tall case. All 51 art tests also pass. Log: `tests-zoom-end-review-size-1.txt`. The command exits 0. No time limit changes. The full suite starts again with the local test database.

The final `plugin-ui` run passes on the M1 at `48bcc1de` in 141.9 seconds. It ends with `check-runner: M1 exit 0 at 48bcc1de`. Log: `checks-zoom-end-review-final-1.txt`; full detail: `zoom-end-review-final-detail.txt` in the lane folder. Both tall results and both short bottom gaps pass again.

The second full `npm test` run completes in 304.73 seconds. It has 187 passed files and one failed file. There are 3,051 passed tests, one failure, one expected failure and eight skips. The failure is the unchanged home remount check at `tools/plugin-app.test.ts:93`: `data-page` is null instead of `home` after the test sees the enabled Home button. The match and database tests from the first run pass. The end-card tests pass. This run exits 1. Log: `tests-zoom-end-review-2.txt`. The app source and its test have no diff from `1de36781`. A single-file repeat checks this failure with the same limits.

The unchanged app test file passes on repeat through `npm test` with `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts`. All 129 tests pass in 263.36 seconds. All 51 art tests pass. The command exits 0. Log: `tests-zoom-end-review-app-1.txt`. No app code or app test changes. The full suite starts again with the same limits.

The third full `npm test` run exits 1 in 331.73 seconds. It has 185 passed files and three failed files: 3,049 passed tests, three failures, one expected failure and eight skips. The home remount test now passes. The end-card tests pass. The failures are timing checks in unchanged files: the computer reply poll at `tools/plugin-join-review.test.ts:65`, the 5-second fixed-depth test at `src/ai/search.test.ts:115`, and the 30-second random-design test at `src/workshop/judge.test.ts:193`. These files have no diff from `1de36781`. Log: `tests-zoom-end-review-3.txt`. Three single-file repeats run through the shared test lock with the current limits. That run is not a pass.

All three unchanged files pass alone through `npm test`: join review, 8 tests in 18.67 seconds; judge, 12 tests in 15.87 seconds; search, 18 tests in 96.00 seconds. Each command also passes all 51 art tests and exits 0. Logs: `tests-zoom-end-review-join-1.txt`, `tests-zoom-end-review-judge-1.txt`, `tests-zoom-end-review-search-1.txt`.

The installed test runner reads `VITEST_MAX_WORKERS`. A final full `npm test` run uses `VITEST_MAX_WORKERS=1` to reduce contention. All test limits stay as they are. No runner or package configuration changes.

## Final review result

- Review A: no findings. No repair is needed.
- Review B, finding 1: fixed. The width-only cap now also checks the viewport height. It applies at 480 px or less. Taller narrow views use `calc(100% - 68px)`. Both 197 x 800 results show all three actions with no scroll. The new check fails before the repair and passes after it.
- Full `npm test` with `VITEST_MAX_WORKERS=1` and the local test database: pass, exit 0. All 188 files pass in 1,175.53 seconds. There are 3,052 passed tests, one expected failure and eight skips. All 51 art tests pass. Log: `tests-zoom-end-review-serial-1.txt` in the lane folder. The full runs with the default worker count report timing failures in unchanged files. Their single-file repeats pass. No time limit changes.
- `plugin-ui`: pass on the M1 at `48bcc1de` in 141.9 seconds. Both tall results, both short bottom gaps, and the existing normal-size checks pass. All six saved end images pass visual review. Log: `checks-zoom-end-review-final-1.txt`.
- The product diff changes `end.css` only. No board, hall or server changes. `plugin-ui-http` is not needed. No push, merge or deploy.
