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
