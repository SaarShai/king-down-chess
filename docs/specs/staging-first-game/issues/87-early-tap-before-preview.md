# 87 — A first tap before the legal-move preview only reads the piece

Status: fixed on branch `staging/early-tap` (from `origin/staging/first-game` `a89a9381`); review and merge open.
Type: task

## Fault

On a remote game the board shows "Your move" before the `kingdown_preview` reply arrives. Until then `blocked()` (`src/plugin/screens/board.ts:170`) is true, so `canPlay()` (line 177) is false. A tap on the player's own piece sets `inspected` (line 415), not `selected`. The reply refreshes the board (lines 352–356) but does not turn that inspection into a selection. The player sees no move or swap marks and must tap again. No move is lost.

The fault was found on 2026-10-24 when the browser test "draws Maester swap marks through the shared board adapter" failed in the live deploy's `npm test` on a fast machine. SaarShai/king-down-chess#106 makes that test wait for the reply (`settled(page)`), so the test no longer covers the early tap. The independent review of #106 found this fault (finding 2, P2: moderate, not a merge blocker).

## Plan and checks

1. Add a browser test that holds the preview reply (the harness `harnessHeld` hold), taps the Maester once, releases the reply, and expects swap marks with no second tap. It fails on the current code.
2. Pick the product fix: when the preview reply arrives and `inspected` is the player's own piece that can move, select it, or keep the tap and apply it after the reply. Keep the read-only behaviour for a tap that is not the player's turn.
3. Run the new test and the board suites; the change needs the owner's approval only if it changes what the player sees beyond the marks.

## Fix

`src/plugin/screens/board.ts`:

- `previewWaits()` names the preview part of `blocked()`: a preview request is in flight, or a remote game is ready with no preview yet.
- `earlyTap` keeps the square of a tap that only reads a piece because the preview is not there yet. `select()` sets it in its read branch, for a real tap only. Each `select()` call clears it first, and Escape clears it.
- When the preview reply stages no move, the board applies the kept tap again with `select(earlyTap)`, if that square is still the read square. Each reset clears `inspected` (a new view, Undo, a staged move, a stale read), so a reset also drops the kept tap.
- A reply that restores staged draft steps changes the board that the player tapped, so the tap stays a read. (The independent review found this case: a saved Haste swap put another piece on the tapped square, and the first version selected that piece.)

The replay runs `select()` with no selection, no armed power or card and no held move. So it only selects the piece, reads it again, or clears. It never plays a move. A tap when it is not the player's turn, or when the turn is complete, stays a read: `previewWaits()` is false then, or `canPlay()` is false when the reply arrives.

The player sees what a normal tap shows: the read words while the reply waits, then the selection and its marks. There are no new words or looks, so the change needs no owner approval (plan step 3).

## Tests

`tools/plugin-app.test.ts`:

1. "draws Maester swap marks through the shared board adapter for a tap after the preview reply": the old test.
2. "… for a tap before the preview reply": the harness holds the `kingdown_preview` reply (`holdNext`). The tap reads the Maester ("White Maester") and draws no swap mark. After `releaseHeld()`, the swap marks show and the Maester is selected, with no second tap.
3. "… for a tap before the preview reply, then Escape": after the release, nothing is selected and no swap mark shows.
4. "keeps a tap before a restored draft preview as a read when the draft moves another piece there": a saved Haste swap `Mf1<>g1!H` (Maester and Beast). A new widget restores it through a held preview. A tap on f1 reads the Maester. After the release, the Beast stands on f1 and nothing is selected.
