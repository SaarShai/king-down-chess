# 43 PR 61: swipe checks

Status: in-progress
Branch: claude/rc-ci-swipe
Base: 5957300f

Scope: the swipe group of the PR 61 CI ticket. Check the top-strip touch swipe and the code display on a fresh friend page. Keep all check intent and WebKit coverage. Do not change time limits.

## Plan and pass criteria

1. Read the CI evidence and reproduce each fault with CPU speed reduced by a factor of four, where possible.
2. Find the cause at the input, page, or state boundary. Fix the product if the product fails.
3. Replace waits in the changed path with waits for the event or state they need.
4. Pass each changed check three times with the slow-down and once at full speed. Run the relevant tests through `npm test`, which holds the project test lock. Check WebKit.
5. Record the evidence, inspect the diff, and commit. Do not push.

## Evidence

CI run 2 fails in both plugin-ui and plugin-ui-http at the top-strip swipe assertion. The board swipe before it passes. The fresh friend-page code timeout is a second fault in scope.


The first unchanged plugin-ui check passes with CPU speed reduced by a factor of four (385.6 s). Thus this Mac does not reproduce the Linux CI assertion. A small source-page probe shows that a native gesture can return before `scrollend`; another gesture can start after an unfinished scroll moves the reset position. The strip centre is at y=53 px inside the frame in the probe. Its old gesture moves 500 px up, out of the viewport.

The change waits for the native scroll end before it reads or resets the scroll position. It also keeps the strip gesture inside the viewport and checks its hit target. The probe passes 20 of 20 swipes at 4x slow-down, with a scroll-end event on each swipe.

The fresh host sends safe insets and touch capability to the frame without checking that the frame has applied them. The change waits for those CSS values and the touch state before input. The friend check also waits for the selected radio state before Start. The normal run does not reproduce the one-time code timeout. A controlled delayed host-context notification does reproduce it at 4x slow-down with the helper from 5957300f: the helper returns before the frame applies its insets, the layout moves during the radio click, Friend stays unchecked, and Start opens the seat screen. The code wait then fails. With the changed helper, the same delayed notification holds the helper until the frame applies it; Friend is selected and six code tiles appear. The product uses the selected mode correctly in both cases.


## Checks

The changed swipe cases and all four fresh friend-page widths pass in three complete `plugin-ui` attempts at 4x slow-down. The second attempt passes in full (363.9 s). The first attempt stops later on the M2 end-word check at line 2755 (362.5 s). The third attempt completes the case assertions, then reports an SDK connection timeout from a clock step in `assertNoErrors` (363.4 s). These two faults are outside the swipe group and remain unchanged.

The full-speed `plugin-ui` check passes in full (184.9 s). The local preload uses the supplied slow-down kit with its Playwright import set to this worktree, so it changes the browser instance under test.


The full WebKit check passes (231.9 s). The full HTTP check passes with an isolated local PostgreSQL database (197.4 s). Its database process stops at the end.

Pass counts for the changed paths:

| Check | Scroll cases | Fresh friend widths | Whole check |
| --- | --- | --- | --- |
| Chromium, 4x, three attempts | 27/27 | 12/12 | 1/3; two later faults above |
| Chromium, full speed | 9/9 | 4/4 | Pass |
| WebKit, full speed | 9/9 | 4/4 | Pass |
| HTTP, full speed | 9/9 | 4/4 | Pass |

`npm test` with the three targeted files (`checks.lint`, `plugin-ui-harness`, `plugin-lobby`) reaches the project lock but does not start. The races worktree holds the lock. Stop only this worktree's queued commands. Do not bypass the lock or stop the other worktree. No unit test result is claimed. The browser runner builds with `tsc --noEmit`; the type check passes. `node --check tools/plugin-ui-check.mjs` and `git diff --check` also pass.

The diff changes only this ticket and `tools/plugin-ui-check.mjs`. It keeps all test assertions, time limits, and WebKit coverage. No product change is needed for the faults shown by the probes. Linux CI still needs a recheck; the unmodified native swipe does not fail on this Mac.

## Logs

The local scratch files are under `node_modules/.cache/swipe/`. `friend-probe.log` holds the old-helper failure and fixed-helper pass with the same delayed notification. `probe-fixed.log` holds the 20/20 native swipe probe. The browser runner logs are under the system `kingdown-check-runs` folder:

- `rc-ci-swipe-UGAhdf/plugin-ui.log`: slow attempt 1; changed paths pass; M2 fails later.
- `rc-ci-swipe-8UuvRp/plugin-ui.log`: slow attempt 2; whole check passes.
- `rc-ci-swipe-RscYGO/plugin-ui.log`: slow attempt 3; changed paths pass; the final error check finds an SDK timeout.
- `rc-ci-swipe-TaytYu/plugin-ui.log`: full-speed Chromium passes.
- `rc-ci-swipe-PFrNse/plugin-ui.log`: WebKit passes.
- `rc-ci-swipe-WOHtna/plugin-ui-http.log`: HTTP passes.
