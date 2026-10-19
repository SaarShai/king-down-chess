# 44 PR 61: Linux scroll wait

Status: in-progress
Branch: claude/rc-ci4-ui
Base: bdcd15ef

## Scope

Find and fix the shared `plugin-ui` and `plugin-ui-http` timeout after the Ticket 13 look checks. Keep the check intent and time limits. Do not push.

## Plan and pass criteria

1. Identify the failed wait from both CI logs and check commit `6e040c6f`.
2. Reproduce the fault in a small browser probe. Check the input, scroll event, and page clock. Fix the product if it is at fault.
3. Pass `npm run check:browser plugin-ui` twice. Run `npm test` through its test lock.
4. Inspect the diff, record the cause and results, and commit with the required trailer.

## Evidence

Both Linux logs fail in `scrollEnded()` at line 2171, called by the first board swipe at line 2218. Commit `6e040c6f` adds this wait. The board is visible and has no error.

The input path has a fault. The board swipe starts near y=200 in a 357 px host and moves 500 px up. It ends outside the frame. The strip change in `6e040c6f` uses `y - 1`, but y is a host coordinate, not a frame coordinate. Chromium also adds touch slop to the requested distance. Thus that strip touch also ends outside the frame.

A small served frame runs the actual old and fixed helpers. It records native `touchend` coordinates. The old helpers fail the new endpoint check; the fixed helpers pass it. All four cases produce a real scroll.

| Helper | Start | Release y in frame | Scroll top | Endpoint check |
| --- | --- | --- | --- | --- |
| Old | Board | -339 | 248 | Fails |
| Old | Strip | -38 | 77 | Fails |
| Fixed | Board | 17 | 144 | Passes |
| Fixed | Strip | 17 | 22 | Passes |

Command: `node node_modules/.cache/ci44/compare.mjs`. The probe extracts the helpers from `bdcd15ef` and the current file. Its result is in `node_modules/.cache/ci44/compare.log`.

Chromium's [move generator](https://chromium.googlesource.com/chromium/src/+/HEAD/content/common/input/synthetic_smooth_move_gesture.cc) adds touch slop. Its [Mac input target](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/renderer_host/input/synthetic_gesture_target_mac.mm) and [Aura input target](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/renderer_host/input/synthetic_gesture_target_aura.cc) send touch input through different platform paths. This Mac accepts the old outside-frame release and sends `scrollend`. Both Linux CI runs time out at that wait. The invalid input is confirmed; its link to the missing Linux event is an inference. A Linux recheck is still needed. No product fault is shown by the Mac checks.

## Change

Limit each touch distance by the frame's top edge, with 32 px of room for touch slop. Require a native `touchend` inside the frame and keep the native `scrollend` wait. The first swipe must start on the same board target and must scroll it. Use more swipes from the empty screen margin to reach the lower controls. Each swipe must make progress. Keep the top-strip, other-turn status, control bounds, and hit-target assertions. Keep the WebKit wheel path and all time limits.

The first local attempt continues on the board rim. It stops in Cards mode when the board has moved out of view. The final version uses the screen margin for those later swipes. The initial board touch keeps its original target.

## Checks

The final code has two complete `npm run check:browser plugin-ui` passes: 183.7 s and 180.5 s. Each pass includes eight board scroll cases and one top-strip case. A run between them stops at the separate `The dealt Vault has a move` assertion at line 1902. Its Maester swipe cases pass. That assertion remains unchanged.

`npm test` passes through `tools/test-lock.sh`: type check passes; 179 test files and 2,988 tests pass; 12 files and 163 tests have existing conditional skips. The 51 art tests also pass. No skip is added or selected by this change. The full log is `node_modules/.cache/ci44/npm-test.log`.

`node --check tools/plugin-ui-check.mjs` and `git diff --check` pass. The diff changes only this check and this ticket. The assertions cover the input fault directly, so no separate unit mock is added. Linux, HTTP mode, and WebKit are not rerun here.

## Browser logs

Under `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/`:

- `rc-ci4-ui-6khplI/plugin-ui.log`: old code with temporary event logs passes, 181.3 s.
- `rc-ci4-ui-c2UIOq/plugin-ui.log`: first fix attempt stops at the Cards-mode rim assertion, 106.0 s.
- `rc-ci4-ui-Attfz9/plugin-ui.log`: final code passes, 183.7 s.
- `rc-ci4-ui-od2Zwe/plugin-ui.log`: final code stops at the unchanged Vault assertion, 102.1 s.
- `rc-ci4-ui-AYYsYT/plugin-ui.log`: final code passes, 180.5 s.

Temporary event logs are removed from the check. The local probes stay in the ignored scratch folder `node_modules/.cache/ci44/`. Local work is complete; this ticket stays open for the Linux recheck.
