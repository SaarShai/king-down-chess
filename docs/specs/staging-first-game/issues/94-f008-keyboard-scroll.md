# F-008: stable keyboard scroll check

Type: task
Status: in review

The owner asks for the cause and the smallest fix for the F-008 CI failure.
Work stays on `staging/f008-fix`, from `origin/main` at `f8fcec0a`.

## Plan and checks

1. Read the test, the sheet code and the failed CI attempts. Record the assertion and times.
2. Repeat the original case. Use scroll and redraw probes to find the cause.
3. Fix the cause. Keep the keyboard, focus, region and end-of-list checks.
4. Repeat the case at least 30 times, also with CPU load. Run the full `npm test` and the board input lane with their shared locks.
5. Let the commit and push hooks run without changes. Push the branch and open a PR into main.

Pass: the cause has direct evidence; the repeat runs and required checks pass.
No deploy, sign-in or remote database use.

## Evidence

Logs stay in `/private/tmp/f008-evidence`.

### CI records

- [Run 40485897131, attempt 1](https://github.com/SaarShai/king-down-chess/actions/runs/40485897131/attempts/1): `browser-board (board-input)` fails on 2026-10-27 at 10:11:02 UTC. F-008 takes 4894 ms. The poll at line 722 expects `{ end: true }` but gets `{ end: false, top: 446 }`. The file has 44 passes and one failure. Attempt 2 passes.
- [Run 40183623337, attempt 1](https://github.com/SaarShai/king-down-chess/actions/runs/40183623337/attempts/1) and [run 40225675633, attempt 1](https://github.com/SaarShai/king-down-chess/actions/runs/40225675633/attempts/1): the same end-of-list assertion fails on 2026-10-25. The latter case takes 4682 ms.
- [Run 40573896694, attempt 1](https://github.com/SaarShai/king-down-chess/actions/runs/40573896694/attempts/1): the other run with a second attempt on 2026-10-27 fails in `verify`. Its board input job passes. The available logs show one F-008 failure on that date, plus the two earlier failures above.
- [Main run 40600254381](https://github.com/SaarShai/king-down-chess/actions/runs/40600254381): the board input job passes on the base commit, `f8fcec0a`.

The commands are `gh run list --branch staging/first-game`, `gh run list --branch main`, and `gh run view <id> --attempt 1 --log-failed`. A log without `--attempt 1` can show the later pass in place of the first failure.

### Cause

The test checks only that PageDown starts to scroll (`scrollTop > 0`). It then sends End while the native scroll can still run. In the failing local case, End arrives in the last PageDown frame and has no effect. A longer poll after End cannot complete a scroll that never starts.

The test drives the real board sheet in `src/plugin/screens/board.ts`. That code makes the body a focusable region. It leaves PageDown and End to the browser. The trace checks the scroll events, focus, body size and child changes. Focus stays on the body. Its size stays at 510 px, with 1711 px of content. No row change occurs.

The failed local trace has these events. Times are milliseconds from page start.

| Event | Time | Scroll top |
| --- | ---: | ---: |
| PageDown keydown | 848 | 0 |
| Final PageDown scroll update | 1011 | 470 |
| End keydown | 1014 | 470 |
| End keyup | 1017 | 470 |
| PageDown scrollend | 1028 | 470 |

No further scroll event occurs. The required bottom is 1201 px. This has the same failure as CI: the sheet stays one PageDown from its start. The native page step differs by platform.

### Fix

Register a one-use `scrollend` listener before PageDown. Wait for its marker before End. Keep the PageDown movement assertion, the bottom assertion, the focus checks and the region checks. The listener changes only the test DOM. Product code, poll limits and retry settings do not change.

### Repeat checks

The repeat driver replaces only the case declaration with 30 separate cases. Each case opens a fresh page. It runs through `npm test`. The driver holds `tools/test-lock.sh` for the complete group and restores the test file after the group. CPU load uses 12 separate integer-loop workers. The slow-browser probe uses CDP `Emulation.setCPUThrottlingRate` with rate 6 before PageDown. The driver stops each load worker by PID.

| Code | Condition | Result | Log |
| --- | --- | --- | --- |
| Before | Idle | 30 pass | `before-idle-30.log` |
| Before | 12 load workers | 30 pass | `before-load-30.log` |
| Before | Browser at rate 6 | 30 pass | `before-probe-throttle-30.log` |
| Before | Rate 6, 12 load workers, event trace | 29 pass, 1 fail | `before-probe-throttle-load-30.log` |
| After | Same rate, load and trace | 30 pass | `after-probe-throttle-load-30.log` |
| After | Idle | 30 pass | `after-idle-30.log` |

All 30 fixed traces show End after PageDown's `scrollend`. All reach 1201 px. Temporary probes, slowdown and repetition edits are removed from the final test.

The selected command is `KINGDOWN_TEST_FILE=tools/plugin-board-input.test.ts KINGDOWN_TEST_NAME='^F-008: the keyboard scrolls' npm test`. The scratch driver is `/private/tmp/f008-evidence/repeat.py`; its inputs are the case count, the load-worker count and a log label.

### Other checks

- WebKit: `PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board-input.test.ts KINGDOWN_TEST_NAME='^F-008:' npm test` passes both F-008 cases. This also checks the new event wait in that browser.
- The complete board input lane passes: `KINGDOWN_TEST_FILE=tools/plugin-board-input.test.ts npm test`, 45 of 45 cases, 93.33 s. Log: `after-board-input-lane.log`.
- The full `npm test` passes: 270 files pass, 17 files are skipped; 5368 cases pass, 342 are skipped. All 67 drawing cases pass too. The type checks pass. Duration: 1016.56 s. Log: `after-full-npm-test.log`. No test database is set; the local setup skips the database cases.
- `npm run test:docs` passes all 183 checks in 16 files. Log: `after-docs.log`.
- `tools/lib/registry.mjs` has no `board-input` check. `.github/workflows/plugin-checks.yml` runs the lane with the selected-file command above. This is the required lane command. Both checks hold the shared test lock.

## Review

The final change waits for a browser event. The listener is in place before the key and runs once. Existing assertions and limits stay in place. Only the test and this ticket change. Independent PR review remains open.
