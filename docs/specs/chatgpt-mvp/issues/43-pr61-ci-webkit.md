# 43 PR 61: WebKit checks

Status: done
Branch: claude/rc-ci-webkit
Base: 5957300f

## Scope

Fix only the WebKit group from ticket 43. Keep each check and its WebKit coverage. Do not change time limits.

## Plan and pass criteria

1. Reproduce the three CI faults with the supplied 4x CPU slow-down where possible. Trace each fault to its cause.
2. Make each wait use the event it checks. Fix product code if it causes a fault.
3. Run each fixed check three times at 4x CPU and once at full speed. Run WebKit checks as well. Use npm test and the shared test lock.
4. Review the diff, record the results, and commit. Do not push.

## Evidence

The supplied CDP slow-down kit changes Chromium only. WebKit has no CDP CPU control in this kit. Local logs stay in dist/webkit-ci/.

## Causes and changes

The canvas starts hidden. The artwork load shows it on a frame, and ResizeObserver gives it its first size. A visible seat or board screen does not mean that the canvas has this size.

- The seat-line check and the short-phone matrix start a short width poll from the screen switch. This poll can read zero before the first canvas frame. Wait for the visible canvas before the text or size checks. Keep all size floors, veil checks and control checks.
- The ceremony check sends its final move before the first board frame. Its result-card wait can include the initial artwork load. Wait for the visible canvas before the final move. Keep the final move held until after the cancel action, so the check still detects a ceremony that starts after cancellation.
- The paired New game case sleeps for 1,100 ms to clear the 1,000 ms tap guard. Install the test clock after the initial board frame, then advance it by 1,000 ms after the card opens. The final move remains held through this step.

No timeout setting changes. No test case is removed or disabled. No product file changes.

## Run results

- Supplied Linux WebKit CI log: 157 pass, 3 fail. The three failures match this ticket: result-card open, seat-line zero width, and short-phone zero width.
- Before the fix on this Mac: two Chromium runs at 4x CPU each pass 6/6 selected cases. WebKit at full speed passes 6/6. The CI failures do not recur in these local baseline runs.
- After the fix: three Chromium runs at 4x CPU each pass 6/6. Each log records 22 successful CDP throttle calls. Logs: `dist/webkit-ci/green-slow-1.log`, `green-slow-2.log`, `green-slow-3.log`.
- After the fix at full speed: Chromium passes 6/6; WebKit passes 6/6. Logs: `dist/webkit-ci/green-fast-chromium.log`, `green-fast-webkit.log`.
- Each of the five focused npm test runs also passes the type check and 51 art tests. All npm test runs use the shared lock.
- Full WebKit CI set: 159 pass, 1 fail out of 160. All six selected cases pass again. The failure is `W7: stages a move, sends once, and starts the computer only after the press`, at the End turn Tab-focus assertion (`tools/plugin-board.test.ts:1183`). The same assertion fails at old line 1180 in both supplied pre-change sweep logs, `c1demote.log` and `c2demote.log`. This separate item is outside the WebKit group in ticket 43; it belongs to ticket 44. Log: `dist/webkit-ci/green-webkit-suite.log`.

- Doc checks: 13 files and 160 tests pass through the shared lock. Log: `dist/webkit-ci/green-docs.log`.

The supplied slow-down kit supports Chromium only. These checks use local macOS WebKit. Linux CI still needs a rerun.

## Review

The change uses the canvas wait already used by board-input checks. It adds no helper or product state. The result-card check still waits for a card while the final move is pending. The size matrix still checks all six viewports and both screen transitions.

## PR 61 follow-up

Branch: claude/rc-ci4-wk. Base: bdcd15ef.

The next Linux WebKit run fails both pending-ceremony cases and the W7 mate Undo case. The earlier visible-canvas wait does not fix the cause.

Plan and pass criteria:

1. Trace the hidden canvas, the New game click, and the Undo click. Check the test clock and board load events separately.
2. Fix the cause in product code where needed. Keep all test cases, time limits, and WebKit coverage. Each wait must use a real event.
3. Run the three failed checks three times in WebKit and once in Chromium through the test lock. Compare the full WebKit CI set before and after the change. Run the type and relevant doc checks.
4. Review the diff, record evidence here, and commit without a push.

Docker is not installed. Local checks use Mac WebKit with Playwright 1.63.0. The supplied CI log provides the Linux failure evidence. Local logs go in `dist/pr61-webkit/`.


### Causes and evidence

- **Hidden canvas:** `PaintedView` sets `visibility: hidden` until `scene.load()` resolves and the next frame runs. That load waits for the stone image decode and the piece sheets. The prior test starts its 3,000 ms canvas wait before this load ends. A four-second stone decode probe gives the exact CI error on the old code: hidden `<canvas width="960" height="1024">`. Both ceremony cases fail. The new code waits for `board.ready()` first, then waits for the visible frame. Both cases pass with the same probe. The time limits do not change. Logs: `red-art-load.log` and `green-art-load.log`.
- **New game:** the old test installs the clock after the renderer starts its timers and frame loop. This mixes native and test timers. [Playwright requires clock installation before app timer calls](https://playwright.dev/docs/clock). `runFor(1000)` also runs every frame in that second, though this check needs only the tap guard to expire. The Linux log stops at the start of the locator click, before mouse input. The fix installs the clock before navigation, jumps the guard with `fastForward(1000)`, and waits for the result card's CSS animation to finish. CSS animation uses the browser timeline.
- **Undo:** this test has no fake clock. The Linux log says the button is visible, enabled and stable, and scrolling has ended. The call then stops before mouse input, in Playwright's geometry or hit-target path. It does not report an intercepted click or a disabled control. The three actions now use the same real mouse input as board-square checks. A small helper checks that the button is enabled and that its centre hits that button before the mouse click. It does not call the handler directly or force a click through an overlay.

The exact Linux engine cause of the two locator stalls is not proved on this Mac. The isolated WebKit iframe probe passes with a running clock and with a paused clock. Playwright 1.63.0 source also shows that `runFor()` restores a clock that was running. Thus a paused clock is not an established cause of either CI failure. The late clock installation is a separate, confirmed test fault. The new ceremony actions also pass with an explicitly paused clock (`paused-actions.log`).

No product fault is found. No product code changes. The test now checks the result-card close and the target screen before it releases the held final move. Undo still restores the exact status text; mate still sends once and plays no second move animation. All 127 board test cases remain.

### Follow-up run results

All test runs use `tools/test-lock.sh`. The test-name filter selects the three reported failures; it does not remove or disable any case.

- Baseline, selected checks: Mac WebKit 3/3 pass (`baseline.log`).
- Baseline, full CI set: 159/160 pass. The existing End turn Tab-focus check fails at old line 1183 (`baseline-suite.log`). It is the same separate fault recorded in the prior review above.
- Fixed, selected checks: Mac WebKit 3/3 pass in each of three runs (`verified-webkit-1.log`, `verified-webkit-2.log`, `verified-webkit-3.log`).
- Fixed, selected checks: Chromium, with `PLAYABLE_BROWSER` unset, 3/3 pass (`verified-chromium.log`).
- Slow artwork probe: old code 0/2, fixed code 2/2. Paused-clock ceremony probe: 2/2. The probes are removed from the source after use.
- Fixed, full CI set: 159/160 pass. The same End turn Tab-focus check fails at new line 1199 (`verified-webkit-suite.log`). The three reported checks pass. No new failure appears.
- Type check passes (`typecheck.log`). Document checks pass: 13 files, 160 tests (`docs.log`). `git diff --check` passes.

### Follow-up review

The change keeps all assertions and real pointer input. It uses the existing board readiness promise and browser animation completion promises. It adds no timeout, dependency, product state, or clock pause. The helper is limited to this iframe harness and the three actions that stall in Linux CI. Linux WebKit must still confirm the fix on CI.
