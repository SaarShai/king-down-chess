# 87 — A first tap before the legal-move preview only reads the piece

Status: needs-triage
Type: task

## Fault

On a remote game the board shows "Your move" before the `kingdown_preview` reply arrives. Until then `blocked()` (`src/plugin/screens/board.ts:170`) is true, so `canPlay()` (line 177) is false. A tap on the player's own piece sets `inspected` (line 415), not `selected`. The reply refreshes the board (lines 352–356) but does not turn that inspection into a selection. The player sees no move or swap marks and must tap again. No move is lost.

The fault was found on 2026-10-24 when the browser test "draws Maester swap marks through the shared board adapter" failed in the live deploy's `npm test` on a fast machine. SaarShai/king-down-chess#106 makes that test wait for the reply (`settled(page)`), so the test no longer covers the early tap. The independent review of #106 found this fault (finding 2, P2: moderate, not a merge blocker).

## Plan and checks

1. Add a browser test that holds the preview reply (the harness `harnessHeld` hold), taps the Maester once, releases the reply, and expects swap marks with no second tap. It fails on the current code.
2. Pick the product fix: when the preview reply arrives and `inspected` is the player's own piece that can move, select it, or keep the tap and apply it after the reply. Keep the read-only behaviour for a tap that is not the player's turn.
3. Run the new test and the board suites; the change needs the owner's approval only if it changes what the player sees beyond the marks.
