# Stratus Undo rewind

## The fault

When the player presses Undo during or just after a Stratus king move, the king's painted effect jumps. The cloud and the ground do not return with the figure. They restart, or they keep the clock of the forward move. The result is a visible break: the effect pops instead of travelling back.

## The fix

The scene keeps the move's clock while the rewind runs, and it draws from that clock backwards. The king effect keeps its growth value at the source square, so the cloud continues from where it stood. These rules apply:

- A run of the move clock covers the forward travel time. The scene draws at the reverse of that clock until it reaches the start. After landing, it keeps the move while its result remains the shown position. Undo starts from the drawn cloud and ground, without a timer window.
- A pointer press on Undo reaches the control during a move. Other presses still skip the animation.
- When reduced motion is on or pace is off, Undo is instant. Other kings and pieces keep their usual Undo path.
- A move that is still preparing exits from the drawn prepared body, not from a fresh one.
- A late body load that arrives after Undo does nothing.
- Reduced motion, a hidden page or a skip ends the rewind at once, and the promises settle with `false`.
- Game replacement clears the retained clock. A position sync of the same Position object keeps it. An ordinary move keeps the clock of the still king.
- The effect clock is keyed by king design, so a design swap does not reuse a clock.

## Files

- `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts`: `prepareUndo`, `rewindUndo`, `resetKingEffects`, the rewind clock in the draw and tick paths.
- `src/render/PaintedView.ts`: `prepareUndo` and `resetEffects` reach the scene; a pending Undo skips the normal cancel.
- `src/move-moments.ts`: the Undo gesture offers the last move to the view before the game rolls back.
- `src/screen/play.ts`: a different Game object clears the effect history.

## Tests

- `src/render/PaintedView.test.ts`: view Undo before and after landing, pointer input, reduced motion, pace off, and the non-Stratus path.
- `src/render/scene-load.test.ts`: the landed state, its invalidation, and rewind for both armies with and without skip, a delayed body load, a replacement position, reduced motion with prepared and fallback bodies, a drawn ground and cloud continuity check, a mid-travel start, and the three clock-retention cases.
- `src/screen/play.test.ts`: effect history clears for a new game, and a position review in the same game keeps it.

## Status

The code is in branch `anim/stratus-undo-1030` for review. Visual smoothness at game speed and size waits for the owner. The full animation set, both board orientations and non-Stratus regression are open. See [the ticket](issues/01-keep-king-state-through-undo.md) for the checked evidence.
