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
