# Painted 2D look for the real game — 2026-09-27

The game can now be played in the painted 2D look: the full rules, random armies, the computer opponent, Hint, Undo, saves, special-move controls and promotions, drawn with the painted figures and their capture animations.

- **Default look** (owner, 2026-09-27). *Look* in the side panel switches to Clay 3D, or `?look=clay`; the choice is remembered.
- **Board:** painted cream and charcoal stone, inspired by the capital tiles of the original King Down board, without the gold ([board-art](../2d-first-pieces/board-art/README.md)); it turns round with the view. Each figure has a soft contrasting rim (dark for ivory, pale for charcoal) so both armies read on the light and dark zones.
- **Art size:** pieces and board load as WebP at full resolution (1.9 MB in total, down from 23 MB of PNG), so every animation coordinate still matches. PNG masters remain the source; regenerate with `python3 docs/2d-first-pieces/web-art.py`.
- **How:** `src/render/PaintedView.ts` implements the same board interface as the clay renderer (`BoardView`), so `main.ts` is unchanged apart from choosing the view. It uses the shared scene `docs/2d-first-pieces/board/scene.mjs` — the same figures, poses and capture animations as the board trial, which now runs on that scene too.
- **Board:** square canvas with headroom above the back rank so tall figures are never clipped; turns round when the human plays Black; click, click-click and drag-to-move work as in clay; markers for moves, captures, swaps, pushes, last move, hint and check.
- **Lab pieces** without painted art (Catapult, Reaver, Templar) draw as lettered tokens and use a plain advance.

## Verification

`PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-painted-game.mjs` against the production build: a 60-ply computer-vs-computer game with captures animated and no stalls or errors; a human drag move and a click-click move; the flipped board when the human plays Black with Undo during play; the board at 390 px phone width with no horizontal scroll. The clay look's special-move checks (`tools/verify-special-moves.mjs`, now forcing `kingdown.look=clay`) still pass; `tools/verify-cursor-adoption.mjs` fails at its drag-as-Black step on this machine, identically on the commit that introduced it, so it is a pre-existing, environment-dependent failure tracked separately; 267 game tests and 24 painted tests pass. Screenshots: [computer-game.png](computer-game.png), [phone.png](phone.png).

## Limits

- Steep Archer shots use the clamped on-board aim (no close-up panel in the game).
- King powers and lab pieces have no dedicated painted animations.
