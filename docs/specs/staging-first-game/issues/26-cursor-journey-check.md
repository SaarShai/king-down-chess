# Check the cursor browser journey

Status: complete. Parent: U05 presentation boundary. Check code only.

## Evidence and plan

The cursor check fails after its first two cases at `8ec109a6` and exact base `e92871fd`. The saved log waits for a hidden New game menu row. The failed image shows a staged Black pawn move with End turn still on.

The move list updates before the move animation ends. The board consumes the first pointer press during an animation to skip it. The check reads the move list, then presses Menu too soon. It also omits End turn, so the computer has no pending reply to cancel.

1. Wait for the saved move and the end of its animation with the existing `played` helper.
2. Press End turn through the existing browser action. Check that the real computer search starts before New game cancels it.
3. Keep the existing assertions and thresholds. Change no gameplay or shared helper.
   For a preset fixture, first open its supported position URL and copy its active rules into the saved-game fixture. A saved game without rules uses current defaults; a URL preset does not reinterpret that save.
   For Undo during a move, use the supported `z` key. A pointer press skips the animation first; it does not also undo.
4. Run `npm run check:browser cursor-adoption` alone after the shared CPU lane is free. Record the receipt and obtain an independent review.

## Verification

The first repair run reaches and passes the real pending-search cancellation case. It then fails at the 2017 promotion picker. The fixture has no saved rules, so save replay correctly uses current defaults. Receipt: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u05-cursor-journey-oqgPAw`.

The second run passes seven cases, including promotion and preset checks. It then reaches the same pointer-skip behavior in the Catapult arc case. Its Undo pointer press skips the animation. It does not undo. The Reaver arc case uses the same stale action. Receipt: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u05-cursor-journey-ophUKu`.

The third run completes all ten cases with no page errors. Its receipt is invalid: the check's result labels and a comment changed while it ran. The runner detects the changed file and refuses that receipt. Receipt: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u05-cursor-journey-CRvY7E`.

The final frozen-worktree run of `npm run check:browser cursor-adoption` passes all ten cases with no page errors in 19.7 seconds. Valid receipt: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u05-cursor-journey-W3jf5g`. Log: `/tmp/kingdown-u05-cursor-journey-frozen.log`.

Independent review clears the animation wait, End turn, real-search assertion, preset seed and supported Undo key. It finds no confirmed issue. All original assertions and thresholds remain. Post-animation button Undo and real mobile touch input still run. No gameplay or shared-helper file changes. Normal commit hooks pass.
