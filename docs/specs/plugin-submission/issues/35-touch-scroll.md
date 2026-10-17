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
