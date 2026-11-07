# Effect bounds and Freeze ice fit

Status: done
Type: task

Three faults from the attack and king-power checks (also on live):

1. A Queen on the back rank that takes beside her shoots thorns above the canvas top. The canvas cuts them (a red tip with no stem).
2. The promotion column and burst stop with a hard line at the canvas top, and on the a-file at the left canvas edge.
3. The Freeze ice is Pawn-sized. On the Rook, the Ogre and the Queen the head and shoulders stand above it.

## Change

- `fx-queen.mjs`: the plan takes `bounds` (the canvas edges). A thorn bow that would take its tip, stem or trail past an edge flattens in steps until it fits. Petals rise no higher than the top. The scene passes `[0, -headroom, SIZE, SIZE]`.
- `promotion.ts`: the column is no taller than the space above its base, so its own faded top shows. Near an edge the burst moves in until it fits. Motes turn back from a side and rise less under the top. The floor pool is no wider than the space to each side.
- `ice-material.mjs`: `iceScale` stretches the ice to the frozen figure. The front face covers the same share of the height as on the Pawn. The back face stands above the head. Both faces reach past the widest side. The thaw (`freeze-release.ts`) cuts its pieces from the same fitted ice, so its first frame matches the held frame.
- `scene.figureBox(piece, square)`: the rest-frame bounds of a figure (bank outline; the HEIGHT table while frames load). Board effects pass its height and half-width to the ice.
- Ice Wall is a low ring round the figure's feet. It does not cover the figure, so it does not change.

## Checks

- Unit: `fx-queen.test.mjs` (thorns and petals stay inside the bounds on the back rank), `ice-material.test.mjs` (ice size by figure), `board-effects.test.ts` (size goes to the thaw).
- Before/after frames at game size (1440x900, Chromium): `/Users/za/kd-runs/checks/fix-effect-bounds-and-ice/` (`thorns-before.jpg`, `thorns-after.jpg`, `promotion-before-after.jpg`, `freeze-before-after.jpg`).
