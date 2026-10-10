# 15 · See all: the binder grid (later)

Status: ready-for-agent
Size: S
Blocked by: 08, 11
Later: not needed for v1; the ledge row scrolls through "Yours", and a grid helps only with many designs.

## Scope

- From mockup B, the binder grid as the "See all" page (`REVIEW.md:106`; decision 26).
- Sources: `mockups/binder-and-table.html` `library()` (`:1088`), `pieceThumb` (`:1001`), `copyThumb` (`:1009`).

## Plan

1. [ ] **`src/workshop/face.ts`:** a small face for the grid (figure, name, diagram, band word), from `faceHtml` (ticket 08).
2. [ ] **`src/workshop/ground.ts`:** a "See all" tile at the end of the "Yours" row opens a full-screen grid of the pool pieces and the player's designs, with a Pool / Yours filter. A tap opens the piece on the board. The full-shelf alert's "Choose one to delete" opens this grid with a Delete button on each design.
3. [ ] **Check group `seeAll`** (open, filter, open a design, delete from a full shelf); W14 states `see-all`, `phone-see-all`.

## Verification

- [ ] `npm test` passes.
- [ ] `npm run check:browser workshop` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Does not do

- No binder pages, no sort beyond the filter.
