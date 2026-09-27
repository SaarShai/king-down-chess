# Painted 2D look for the real game — 2026-09-27

The game can now be played in the painted 2D look: the full rules, random armies, the computer opponent, Hint, Undo, saves, special-move controls and promotions, drawn with the painted figures and their capture animations.

- **Switch:** *Look* in the side panel (Clay 3D / Painted 2D), or `?look=painted`. The choice is remembered. Clay 3D stays the default until the owner chooses.
- **How:** `src/render/PaintedView.ts` implements the same board interface as the clay renderer (`BoardView`), so `main.ts` is unchanged apart from choosing the view. It uses the shared scene `docs/2d-first-pieces/board/scene.mjs` — the same figures, poses and capture animations as the board trial, which now runs on that scene too.
- **Board:** square canvas with headroom above the back rank so tall figures are never clipped; turns round when the human plays Black; click, click-click and drag-to-move work as in clay; markers for moves, captures, swaps, pushes, last move, hint and check.
- **Lab pieces** without painted art (Catapult, Reaver, Templar) draw as lettered tokens and use a plain advance.

## Verification

`PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-painted-game.mjs` against the production build: a 60-ply computer-vs-computer game with captures animated and no stalls or errors; a human drag move and a click-click move; the flipped board when the human plays Black with Undo during play; the board at 390 px phone width with no horizontal scroll. The clay look's special-move checks (`tools/verify-special-moves.mjs`) still pass; 267 game tests and 24 painted tests pass. Screenshots: [computer-game.png](computer-game.png), [phone.png](phone.png).

## Limits

- The painted sheets are full size (about 2 MB each, 23 MB total); they download only in the painted look. Downscale them before publishing to the web.
- Steep Archer shots use the clamped on-board aim (no close-up panel in the game).
- King powers and lab pieces have no dedicated painted animations.
