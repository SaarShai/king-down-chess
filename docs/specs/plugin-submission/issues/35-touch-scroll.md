# 35 Touch scroll on the board

Status: in-progress
Branch: claude/touch-scroll
Base: 4692477c

Source: the approved ticket in the release scratchpad. The owner asks to fix T-A.

## Plan and checks

1. Add a touch check to `plugin-ui`. Use browser touch input at 201 × 357, fullscreen, with insets 31/17 and 62/34. Compare a swipe from the board with a swipe from the top strip. Show the check fail with the code from 4692477c.
2. Allow vertical scroll from the board. Keep square taps, piece drags and the 210 px floor. Keep the website and other lanes' parts unchanged.
3. Check board-turn, board-cards-armed, board-swap-preview and board-their-turn. After a board swipe, check all three bar buttons inside the frame and the End turn hit target. Check square selection before the swipe. Keep the existing size checks.
4. Run `npx tsc --noEmit` and `npm test`. Commit. Run `plugin-ui` on Chromium on the M1 and WebKit on this Mac through the required runner. Keep all time limits.
5. Record the checked commits, logs, result and any limits here and in the lane report.

## Findings

- The screen has vertical overflow. Both `#board` and its painted canvas have `touch-action: none`.
- `PaintedView` has a piece drag. A drag starts on a piece of the side to move. A tap selects a square. The fix must keep both paths.

## Build and evidence

- The test-only commit `a532532c` has the app files from `4692477c`. The M1 Chromium check fails at the new board-swipe assertion. Native input hits the canvas. Both computed touch-action values are `none`. The board swipe leaves `scrollTop` at 0. The top-strip swipe changes it to 220. The runner ends with `M1 exit 1 at a532532c`. Log: `checks-red-6.txt` in the touch-scroll scratchpad lane.
- The first test drafts put the strip swipe first. Its later scroll motion affected the next read. The final cause check puts the board swipe first and records its start position.
- The plugin board and its canvas now use `pan-y`. A non-passive touch-start handler keeps a press on a piece on the existing drag path. The shared website CSS and the 210 px floor stay unchanged.
- Gesture choice: a piece starts a drag. An empty square starts scroll. The scroll check uses the empty square nearest the visible board centre. The tap check selects the Maester before the swipe at 201 px. The drag checks use vertical and horizontal rook moves at 320 × 568, 393 × 852 and 1280 × 800.
- Unit checks cover the square tap, both drag directions, scroll from empty and enemy squares, and pointer cancellation followed by another tap. Full checks are in progress.
