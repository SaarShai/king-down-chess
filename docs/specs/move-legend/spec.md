# One move legend for the game and the Workshop

Owner, 2026-10-10: "yes, go with my legend, but change the red X to a red target symbol."

## Decision
The game and the Workshop use one mark language. It comes from the owner's physical-game legend (`art-src/emblems-logo/range-tiles.png`):

| Meaning | Mark |
|---|---|
| Can move there | a green tile |
| Can take there (only) | a white tile with a red target |
| Can move or take there | a green tile with a red target |
| Takes from where it stands (shot) | a red target with an arrow |

The red target replaces the red X of the printed legend. The shared renderer and the specimen are in `docs/research/rules-ui-2026-10-10/mockups/` (`shared/marks.js`, `grammar.html`).

## Today
- Painted board (default look): a gold gem for a move, a crimson ring and corner brackets for a take, and a turning sight for a shot (`src/render/marks.ts`).
- Clay look: green and red tile tints (`src/render/renderer.ts`, `highlight()`).
- Workshop grids: a gold diamond for a move, a red ring for a take, and a dashed ring with a dot for a shot (`src/workshop/workshop.css`, `.c-move`, `.c-take`, `.c-shoot`).

## Tickets
- [01 Game and Workshop marks](issues/01-game-marks.md)
