# 15 · See all: the binder grid (later)

Status: ready-for-agent
Size: S
Blocked by: 08, 11
Later: not needed for v1; the ledge row scrolls through "Yours", and a grid helps only with many designs.

## Scope

- From mockup B, the binder grid as the "See all" page (`REVIEW.md:106`; decision 26).
- Sources: `mockups/binder-and-table.html` `library()` (`:1088`), `pieceThumb` (`:1001`), `copyThumb` (`:1009`).

## Plan

1. [x] **`src/workshop/face.ts`:** a small face for the grid (figure, name, diagram, band word), from `faceHtml` (ticket 08).
2. [x] **`src/workshop/ground.ts`:** a "See all" tile at the end of the "Yours" row opens a full-screen grid of the pool pieces and the player's designs, with a Pool / Yours filter. A tap opens the piece on the board. The full-shelf alert's "Choose one to delete" opens this grid with a Delete button on each design.
3. [x] **Check group `seeAll`** (open, filter, open a design, delete from a full shelf); W14 states `see-all`, `phone-see-all`.

## Verification

- [x] `npm test` passes.
- [x] `npm run check:browser workshop` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Does not do

- No binder pages, no sort beyond the filter.

## Comments

### 2026-10-11: built (branch `claude/proving-ground`)

- Step 1: `thumbHtml` in `src/workshop/face.ts`. It shows the icon and the name, the figure, the 98 px reach diagram, a 22 px seal for each rule, the band word, and the Yours tag on a design. It holds phrasing content only, so a button can hold it. `faceHtml` and `thumbHtml` share one `icon` helper. Two new tests in `face.test.ts`.
- Step 2: `seeAll` in `src/workshop/ground.ts`, with its styles in `ground.css`. "See all" is the last slot of the Yours row, before NEW. It opens a full-screen sheet with the 11 pool pieces, then the shelf designs, and an All / Pool / Yours filter. A tap opens the piece on the board, and the focus goes to its slot. The full-shelf alert's "Choose one to delete" opens the same sheet with only the designs, each with Delete. This replaces the old list sheet (`makeRoom`), and its `.pg-room-row` style is deleted.
- Step 3: the group `seeAll` in `tools/verify-workshop.mjs`; the W14 states `see-all` and `phone-see-all` in `docs/specs/web-redesign/samples/W14.mjs`. No old assertion changed.

Changes from the ticket, with the reasons:

- The filter has three choices: All, Pool and Yours. Pool and Yours do not overlap, so a filter with only those two cannot show all the pieces. All is the first choice.
- The face also shows the seals and the Yours tag, as mockup B's `pieceThumb` and `copyThumb` do. The seals use the group colours of `seal()`, as on the plinth (the mockup's thumbnails show all seals in red).
- "See all" shows only when the shelf holds a design. With no design there is no Yours row ("at the end of the Yours row").
- In delete mode a face is not a button: a tap must not open another piece while the open design is not saved.
- The open piece has a gold ring and `aria-current` in the grid.
- The sheet title is "Pieces", and the note under it is the mockup's line ("Pick a piece. Change anything. The original stays."; the mockup says "card"). The title uses the sheet header of the other sheets, so it is smaller than the mockup's 23 px "PIECES".
- One line in the dialog's click handler: a tap inside a sheet does not close the ledge's sheet in short landscape. Without it, a tap on the filter in short landscape closed the ledge under the grid and moved the focus to Pieces.
- W14 `phone-see-all` is the delete grid of a full shelf (50 copies of My Beast). It shows the second form of the grid at both sizes.

Evidence (S = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/15-see-all`):

- `npm test` through the shared lock: 115 test files passed and 1 skipped, 1,885 tests passed and 21 skipped, `exit 0` (`S/npm-test-1.log`).
- `npm run check:browser workshop`, three runs: "ok workshop" and "check: all 1 passed" each time (`S/check-1.log`, `S/check-2.log`, `S/check-3.log`; `S/check-runs.log`). Each workshop log ends "workshop: all groups pass" (`S/ws-1.log`, `S/ws-2.log`, `S/ws-3.log`).
- The W14 states `see-all` and `phone-see-all` at 1440 × 900 and 390 × 844 on the dev server (port 5183), through a scratch table with only these two states: 4 renders, 0 with a fault (`S/w14/`).
- The build beside mockup B's state `binder`: `S/build-see-all-desktop.png` and `S/build-see-all-phone.png` beside `S/mock-binder-desktop.png` and `S/mock-binder-phone.png`; the ledge tile in `S/build-ledge-desktop.png`. The faces, the grid (7 columns of 168 px on the desktop, 2 columns on the phone) and the art agree with the mockup. The differences that stay are in the list above. The mockup's Kings door, NEW tile and side tabs are not in the grid: the ticket names the pool pieces and the designs only.

### 2026-10-11: Reviews

Evidence in `S/review/` (S as above). `probe.mjs` opens See all at 5 sizes and reads the columns, the face width and, in short landscape, the ledge after a filter tap.

1. should-fix, confirmed: the short-landscape check did not read the ledge's sheet. With `.pg-sheet` removed from the `closest(...)` selector in the dialog's click handler, the ledge closed at the filter tap, but `aria-pressed` was still `true` (`S/review/probe-mutant.log`; the build: `S/review/probe-before.log`). Fix: one assertion in `seeAll` after the filter tap, "the ledge's sheet stays open under the grid".
2. should-fix, confirmed: the two-column rule applied to each narrow layout. At 844 × 390 and 768 × 1024 the grid had 2 columns of 398 px and 360 px faces (`S/review/probe-before.log`). Fix: in the narrow block, `.pg-grid` is `repeat(auto-fill, minmax(150px, 1fr))`. Now 844 × 390 has 4 columns of 191 px, 768 × 1024 has 4 columns of 172 px, and 390 × 844 keeps 2 columns of 171 px; 1000 × 800 and 1440 × 900 do not change (`S/review/probe-after.log`, `S/review/after-*.png`).
3. nit, confirmed but not fixed: `phone-see-all` shows the delete grid, and other `phone-<x>` states are the phone form of `<x>`. The ticket names the state `phone-see-all`, and the rename costs more than one line (the state, the W14 comment and this ticket). The list of changes above records what the state shows.

After the fixes: `npm test` through the shared lock, 115 test files passed and 1 skipped, 1,885 tests passed and 21 skipped, `exit 0` (`S/review/npm-test.log`). `npm run check:browser workshop`: runs 2, 3 and 4 pass with "check: all 1 passed" (`S/review/check-2.log`, `check-3.log`, `check-4.log`). Run 1 stopped with "changed in the checkout": the ticket file changed while it ran. No assertion failed (`S/review/check-1.log`, `S/review/check-runs.log`).
