# PR 61: intermittent cursor test fault during an opponent move

Status: done
Type: task

## Scope

Fix the reported Linux Chromium fault in `tools/plugin-board.test.ts`.
Base: `ef0e45cc`. Change only the test and this ticket. Keep all time limits
and the STEP factor. Do not push or merge.

## Plan and checks

1. Read the move path and find an existing way to hold its animation state.
2. Hold the replay with the pending promise pattern in the ceremony test.
   Send a real ArrowRight key. Record the animation state at the key event
   and check that the cursor moves.
3. Run the case five times in Chromium and three times in WebKit. Run the
   full board file once in Chromium. Run one browser test at a time through
   `tools/test-lock.sh`. Do not add a retry option.
4. Check types and the diff. Record the evidence and commit one fix.

## Cause and change

The test polls for a short state from outside the page. The opponent's
one-square rook glide lasts 189 ms at the plugin's fast pace:
`(350 + 28) * 0.5`. Reduced motion uses a 210 ms slide. The board can
finish the move between polls. `PaintedView.animateMove` also returns
at once when pace is off, or for pass, Freeze, Ward and Sacrifice.
The screen skips move playback for drops and when no replay is needed.
The CI log shows a missed state. It does not show a product fault.

Use the pending `animateMove` promise from the ceremony test in this
file. Install it before `routeView`. This holds `data-animating="true"`
until the key check ends. Record that attribute in the board's ArrowRight
event listener. Check the record after a real `page.keyboard.press`.
The test fails if the key arrives after the animation state ends.

Move the cursor to b1 first with ArrowLeft. Black sees the board in the
reverse direction. Its default cursor is at a1, where ArrowRight cannot
move it. Check b1 before the replay and a1 after ArrowRight. The exact
label checks replace the old check for any square name. Release the held
promise and wait for `data-animating="false"` before the page closes.

## Validation

All browser commands run in this worktree, one at a time, through
`tools/test-lock.sh`. No test retry option is set.

```sh
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t "moves the keyboard cursor while the opponent move animates"
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t "moves the keyboard cursor while the opponent move animates"
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts
```

| Check | Result |
| --- | --- |
| Cursor case, five Chromium runs | All pass: 2.57, 2.63, 2.61, 2.60 and 2.49 seconds. Each run has 1 pass and 127 filtered cases. |
| Cursor case, three WebKit runs | All pass: 3.26, 3.00 and 3.02 seconds. Each run has 1 pass and 127 filtered cases. |
| Full board file, Chromium | All 128 pass; 98.95 seconds. |
| `npm run typecheck` | Pass. |
| `git diff --check` | Pass. |

Logs use the prefix `anim-cursor-` in the owner's supplied `scratchpad` review folder
folder: `chromium-1.log` through `chromium-5.log`, `webkit-1.log` through
`webkit-3.log` and `chromium-full.log`.

## Review and limits

The diff changes only this test and ticket. It uses the existing held
promise pattern. The key-event check and exact cursor labels test the
required state and movement. No product file, dependency, time limit,
STEP factor, workflow or retry changes.

Linux CI and a CPU-load check do not run here. The full `npm test` does
not run, as the owner directs. No push or merge is made.
The commit hook uses empty secret sources through its documented
overrides. It does not read or compare real secret files.
