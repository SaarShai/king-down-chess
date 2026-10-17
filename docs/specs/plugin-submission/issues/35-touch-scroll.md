# 35 Touch scroll on the board

Status: built
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
- Unit checks cover the square tap, both drag directions, scroll from empty and enemy squares, and pointer cancellation followed by another tap. The full unit suite passes.
- Chromium `plugin-ui` passes on the M1 at `9ef65a41` and `674c0c4f`. Both runs check all eight native-touch scroll cases and six touch drags. Two saved renders show the bar inside the frame.
- Desktop WebKit raw touch input fails the top-strip positive control. It does not prove native pan on this Mac. Keep native pan and touch-drag checks on Chromium. WebKit checks its computed `pan-y` values, native square taps, mouse drags and wheel-scroll bounds. The real iOS swipe and End turn tap remain with the main session after merge 5, as the ticket requires.
- The existing card refresh check assumes that a mouse click focuses a checkbox. WebKit does not do that. The check now sets focus before it tests that a refresh keeps focus. No app code changes for that check.

## Check results

- `npx tsc --noEmit` passes with exit 0.
- Chromium `plugin-ui` passes on the M1 at `c8c44a06` in 193.2 s. Final runner line: `check-runner: M1 exit 0 at c8c44a06`. Logs: `checks-green-5.txt` and `chromium-plugin-ui.log` in the touch-scroll scratchpad lane.
- WebKit `plugin-ui` passes on this Mac at `c8c44a06` in 262.3 s. Final runner line: `check-runner: mac exit 0 at c8c44a06`. Logs: `checks-webkit-4.txt` and `webkit-plugin-ui.log` in the same lane. This is the CSS, tap, mouse-drag and wheel-scroll check described above. It does not prove native iOS pan.
- Both checks cover the four board states, both inset pairs and the existing size checks. The saved renders `board-turn-scroll-31.png` and `board-their-turn-scroll-62.png` show the three bar controls inside the frame.
- `npm test` passes with the required local test database: 188 files, 3,056 passed tests, one expected failure and eight skipped tests. All 51 drawing tests pass. The type check also passes in this command. Log: `tests-2.txt` in the same lane.
- The one-second lock polling loop lets newer runs take the lock first. After more than 35 minutes, this lane replaces only its own waiter with a blocking wait on the same lock file. The lock stays held across `npm test` through the lock script's existing re-entry flag. The original wait deadline stays in force. No project lock script or other process changes.
- No server code changes. `plugin-ui-http` does not apply to this change. No merge, push or deploy.

## Remaining check and choices

- No code part remains open. The native iOS Simulator swipe and End turn tap stay with the main session after merge 5. Desktop WebKit cannot prove that native pan through its raw touch protocol on this Mac.
- A touch on a piece keeps the existing drag. A vertical swipe from an empty square scrolls. The check uses the empty square nearest the visible board centre. No visual taste choice or change to the 210 px floor.
