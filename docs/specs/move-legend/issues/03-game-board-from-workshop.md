# The game board takes the Workshop's coordinates, selection glow and rails

Status: ready-for-agent
Size: M
Blocked by: none. Tickets 01 and 02 and the Proving Ground are on main.

Owner, 2026-10-11, on the side-by-side renders of the game board and the Workshop board: "do 2-4 (for 4, use the workshop threats). exclude the board change." Items 2 to 4 are A, B and C of this ticket and D of ticket 04. "Exclude the board change": the dark squares, the frame and the size of the game board do not change.

## Scope

- The painted game board everywhere it shows: the game, the Guide lessons (the same board) and the plugin page (it draws its marks with `src/render/marks.ts` and `PaintedView.ts`, web-redesign spec rule 5).
- **A. Coordinates:** the Workshop's style (`src/workshop/ground.css` `.pg-files`, `.pg-ranks`): gold `#c99a3e` capitals A to H and the rank numbers in the display serif (`--font-display`, weight 600), in the frame below and left of the squares, where the game has them now.
- **B. The selected piece:** the Workshop's warm gold glow under the feet (`drawString`, the open piece). It replaces the square outline (`docs/2d-first-pieces/board/scene.mjs`) and the gold ring and pulsing glow at the feet (`src/render/marks.ts`).
- **C. Rails:** the Workshop's rails join the move tiles of each line of the selected piece, with the Workshop's line ends: an arrow at the board edge, a stop bar before a friend that stops the line, and the rail into the centre of a take. One drawing: the rail, the arrowhead and the stop bar move from `src/workshop/marks.ts` to `src/render/legend.ts` as shapes; the Workshop draws them with `toSvg()`, the game with `paint()`.
- Files: `src/render/legend.ts`, `legend.test.ts`, `marks.ts`, `marks.test.ts`, `renderer.ts` (the `Highlights` type only); `src/workshop/marks.ts`; `src/marks-model.ts` and its test; `src/screen/play.ts`; `docs/2d-first-pieces/board/scene.mjs`; `docs/specs/web-redesign/samples/W13.mjs`.

## Plan

1. [x] `legend.ts`: `rail()`, `arrowHead()`, `stopBar()` and `lineEnds()` (the geometry of `drawString`'s rail loop) as shapes, with `o.px`; `glow()` (the gold glow and the red glow under the feet); the gradient `leg-glow-gold` in `DEFS` and in `paint()`. A shape can have a butt cap (the old rails had one).
2. [x] `src/workshop/marks.ts`: draws its rails, arrowheads, stop bars and the open piece's glow from `legend.ts`. Its SVG draws the same as before.
3. [x] `marks-model.ts`: `railsOf(board, from, moves, captures)`: the lines of the piece (bishop, rook, queen, paladin, catapult, a design's lines, the Templar on a capital) and where each ends.
4. [x] `play.ts` puts the rails in `Highlights.rails`; `marks.ts` draws them under the tiles and the line ends after the tiles; the selected piece gets the gold glow; the ring and the pulse go.
5. [x] `scene.mjs`: no square outline when the host draws its own marks (`setDecorate`); the coordinates in the Workshop's style on the framed board.
6. [x] W13: the states `painted-start` (the start position, the knight g1 selected) and `workshop-queen` (the pool queen in the Workshop).

## Verification

- [x] Unit tests: `railsOf` (the queen's lines and ends, a pawn's double step has no rail, a paladin passes a friend); the legend's rail shapes; the gold glow under the selected piece and no ring.
- [x] `npm test` through the lock script passes.
- [x] `npm run check:browser painted-game workshop` and every check that the marks touch pass.
- [x] Renders, before and after, at 1440 × 900 and 390 × 844: the queen, the archer, a start position with a piece selected, the Workshop queen (it looks the same).

## Does not do

- No change to the dark squares, the frame or the board size ("exclude the board change").
- No change to the clay look (parked, owner 2026-10-11) and no game rule.
- No arches over a passed piece in the game; the rails only.

## Comments

**2026-10-11, the build (branch `claude/game-marks`).** `S` is the scratch folder `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/owner5`.

What changed:
- `src/render/legend.ts`: `rail()`, `arrowHead()`, the stop bar, `railLine()` (the line geometry of the Workshop's `drawString`), `arrowLine()`, `threat()` (for ticket 04) and `glow()` move here as shapes. A shape can have a butt cap; `paint()` and `DEFS` know the gradient `glow-gold`.
- `src/workshop/marks.ts`: draws them from `legend.ts`; its own copies and the gradient `kdm-glow-gold` are gone.
- `src/marks-model.ts`: `railsOf()`. `src/screen/play.ts` puts its result in `Highlights.rails` (`renderer.ts`: the type only).
- `src/render/marks.ts`: the gold glow under the selected piece in place of the ring and the pulsing glow; the rails under the tiles, the line ends after them.
- `docs/2d-first-pieces/board/scene.mjs`: no square outline when the host draws its own marks; on the framed board, the coordinates are gold `#c99a3e` capitals and numbers in Cinzel, weight 600.
- W13: the states `painted-start` and `workshop-queen`.

Evidence:
- `npm test` (lock script): 118 files passed, 1 skipped; 1919 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-2.log`). The run before it (`S/logs/npm-test-1.log`) failed on one new test: its position had the black king on a8, so the rook's line ended in a take. I corrected the position.
- `npm run check:browser`: painted-game, workshop, visual-design, verb-marks and read-piece, each "check: all 1 passed", exit 0 (`S/logs/check03-<name>.log`).
- The Workshop queen, main against this branch (`S/before`, `S/after-1`, `workshop-queen-*.png`): at 1440 × 900, 12 of 1,296,000 pixels change by more than 2 of 255, each a single anti-aliased pixel at an arrow tip on the board edge; at 390 × 844, 28 pixels. It looks the same.

Changes from the ticket, and why:
- The line ends follow the Workshop's rules (`scene.ts` `layer()`): an arrow at the board edge, a bar before a piece that stops the line, and the rail into the centre of a take. The Workshop also draws a stub with a bar where a friend stands next to the piece; the game draws no rail for a line with no marked square, so a piece at the start of a game shows no bars.
- In the game a line also ends early when a rule cuts it (a pin or a check): the rail then ends in the centre of its last marked square, with no end mark.
- The SVG keeps each rail's group opacity (.85); the canvas draws each shape at that opacity times its own. The rail's centre on the canvas is therefore a little darker than in the Workshop. A group opacity on a canvas needs a second canvas for each rail; the difference does not show at this size.
- The plugin page gets the glow and the rails too: it draws with `marks.ts`. Its coordinates change only where its board is framed (`setLively` atmosphere), as on the game board.

**2026-10-11, the renders (with ticket 04).** Before: main `ce2fe345` in a temporary detached worktree (removed after); after: this branch. W13 states through a temporary copy of the table with only these states (deleted after): before 10 renders, 0 with a fault (`S/logs/before.log`); after 14 renders, 0 with a fault (`S/logs/after.log`). Side by side, before left: `S/1-queen-*.jpg`, `S/2-archer-*.jpg`, `S/4-start-*.jpg`, `S/5-workshop-queen-*.jpg` (desktop 1440 × 900, phone 390 × 844). The Workshop queen in the final render: 12 (desktop) and 28 (phone) pixels change by more than 2 of 255, as above.
- I looked at each render. The gold capitals and numbers sit in the frame; the rails join the tiles; the arrows sit at the board edge. The gold glow is faint under a tall figure, most on the phone (the knight g1 covers most of it); it is the Workshop's size and colour.
