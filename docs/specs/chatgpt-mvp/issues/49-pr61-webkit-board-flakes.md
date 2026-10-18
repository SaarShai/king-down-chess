# PR 61: two intermittent WebKit board test faults

Status: done
Type: task

## Scope

Fix the two reported Linux WebKit faults in `tools/plugin-board.test.ts`.
Base: `6864b846`. Keep all assertions, size floors and time limits.
Use the existing frame wait and checked mouse input. Do not change product
code. Do not push or merge.

## Plan and checks

1. Compare the failed steps with the helpers from [ticket 45](45-pr61-linux-ci.md#size-and-hit-checks-read-unfinished-frames).
2. Wait for the next frame after coin animations. Show all measured values
   if either face assertion fails. Use checked mouse input for both Send
   presses in D10.
3. Run each changed test three times in Mac WebKit. Then run the full board
   file once in WebKit and once in Chromium. Use the test lock for each run.
4. Check the diff and commit one fix. Record the commands and results here.

## Cause and change

The coin wait ends when the current animations finish. It does not wait
for the next frame. Ticket 45 shows that WebKit can apply the final
transform on that frame. The CI log omits the measured values, so the
exact size error is unknown. Add the same frame wait as the nearby size
tests. Keep the one-call measure on the stable table root. Both face
assertions now show the measured values on failure.

D10 uses locator clicks for both Send presses. The CI log shows that the
first press finds an enabled button, then stalls in the stability check.
Use the existing `clickButton` helper. It checks the hit target and enabled
state, then sends real mouse input. Scroll each Send button into view first,
as the existing Ready check does. The old locator click supplies this step.
Keep every server and draft assertion.
The evidence shows test timing faults. It does not show a product fault.

The first local D10 check with direct helper calls fails its second hit
check. A probe puts Send at y=740.65625 with a 44 px height. Its centre
hits `app-root`, outside the visible panel. The draw note adds content.
Scroll the button into view before the checked mouse press. The next
three D10 runs pass. Remove the probe before the final checks.

## Validation

All browser commands run in this worktree, one at a time, through
`tools/test-lock.sh`. No test retry option is set.

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t 'measures the card coin face in one page call on a root a redraw keeps'
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t 'W7-04: a refused press after a real draw offer keeps T6 and the note, then saves the turn'
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts
```

| Check | Result |
| --- | --- |
| Coin case, three WebKit runs | Pass: 4.47, 3.93 and 3.72 seconds. Each run has 1 pass and 127 filtered cases. |
| D10, three WebKit runs after the scroll step | Pass: 3.60, 3.48 and 3.64 seconds. Each run has 1 pass and 127 filtered cases. |
| Full board file, WebKit | 127 pass, 1 fails; 131.10 seconds. Both changed cases pass. |
| Full board file, Chromium | All 128 pass; 97.71 seconds. |
| `npm run typecheck` | Pass. |
| `git diff --check` | Pass. |

The full WebKit run fails the unchanged case `W7: stages a move, sends
once, and starts the computer only after the press`. Its Tab-focus
assertion at line 1218 gets false. A separate locked WebKit check uses
the test file from base `6864b846` and reproduces the same failure at
base line 1215 in 3.31 seconds:

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t 'W7: stages a move, sends once, and starts the computer only after the press'
```

The fixed file is restored after that check. This task does not change
the separate focus case. Two earlier D10 checks fail before the scroll
step: one with direct helper calls, one with a temporary hit probe.

Logs use the prefix `wk-flakes-` in the owner's supplied `scratchpad/sol`
folder: `coin-1.log` through `coin-3.log`, `send-1.log` through
`send-4.log`, `send-probe.log`, `webkit-full.log`, `chromium-full.log`
and `webkit-base-focus.log`.

## Review and limits

The diff changes only the two reported tests and this ticket. Every
assertion and each 44, 36 and 0 check stays. The frame wait and mouse
helper match the existing size and Ready checks. No helper, time limit,
STEP factor, workflow, product file or dependency changes. No new retry
or fixed sleep enters a test.

The owner checks Linux CI. The full Mac WebKit file is not all green
because of the separate base focus failure. No push or merge is made.
The commit hook uses empty secret sources through its documented
overrides. It does not read or compare real secret files.
