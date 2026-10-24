# PR 61: plugin UI check races

Status: done
Type: task

## Scope

Check audit findings 1, 9, 10, 11 and 12 at base `d51f954c`.
Change only the four named browser check files and this ticket.
Keep every assertion, size floor, expected value and time limit.
Keep the M2 win sampler as it is. Do not push or merge.

## Plan and checks

1. Check each finding against the code and the fixes in tickets 45, 48,
   49 and 50. Record the confirmed causes here.
2. Wait for current animations and one frame before exact geometry reads.
   Use the board test's checked mouse input for Ready and Send. Keep the
   wait for each button to become enabled.
3. Run the full plugin UI check once in WebKit, then once in Chromium.
   Use `tools/test-lock.sh` for each run. Run no other browser test at
   the same time. Both full checks must pass.
4. Check syntax and the diff. Record the proof and commit one fix with
   both required trailers.

## Cause and change

All five findings match the code. Finding 1 reads exact coin sizes after
animation completion but before the next frame. Finding 11 has the same
gap before the exact coin-row boundary check. Finding 12 reads the card
transform in that gap. Use the frame wait from ticket 49.

Findings 9 and 10 use locator clicks on Ready or Send. Tickets 45 and 49
record WebKit stalls on this input path. Use the checked mouse pattern
from `tools/plugin-board.test.ts`. Wait for an enabled locator, scroll
the button into view, check its hit target and enabled state, then send
real mouse input. Share this helper with the Android check through its
existing caller.

## Validation

Both full checks pass on this Mac. Each command runs once, in this
worktree, through the shared test lock. WebKit ends before Chromium
starts. No retry option is set.

```sh
PLAYABLE_BROWSER=webkit tools/test-lock.sh npm run check:browser plugin-ui
tools/test-lock.sh npm run check:browser plugin-ui
```

| Check | Result |
| --- | --- |
| Full plugin UI check, WebKit | Pass; 213.533 seconds; exit 0. |
| Full plugin UI check, Chromium | Pass; 197.255 seconds; exit 0. |
| `node --check` on each changed `.mjs` file | Pass. |
| Assertion-line comparison with `d51f954c` | Pass; each old assertion line stays. |
| File-suffix comparison with base line 2791 | Pass; M2 and all later code stay as they are. |
| `git diff --check` | Pass. |

Run records have `ok:true` and `fault:null`. Their folders are under
`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/`:

- WebKit: `rc-race-b-gTPIna/plugin-ui.log` and `run.json`.
- Chromium: `rc-race-b-b80B4L/plugin-ui.log` and `run.json`.

Command logs are `race-b-webkit.log` and `race-b-chromium.log` in the
owner's supplied `scratchpad` review folder.

## Review and limits

The diff uses the existing animation loop and mouse-input pattern.
One mouse helper serves all five Ready presses and the shared Send path.
Each caller selects an enabled button before the helper waits and scrolls.
The helper checks the hit target and enabled state before real input.
The three geometry checks keep all exact values and size floors.
The source review finds no product fault.

Only the four named check files and this ticket change. No dependency,
product file, M2 sampler, time limit, STEP factor, workflow or retry changes.
No full `npm test`, Linux CI, VM, push or merge runs here.
The commit hook uses the gate's documented empty-source overrides.
It does not read real secret files.
