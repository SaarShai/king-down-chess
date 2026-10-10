# Game and Workshop marks use the owner's legend

Status: ready-for-agent
Size: L
Blocked by: none. The Proving Ground build (`docs/specs/workshop-proving-ground/`, ticket 01) imports `src/render/legend.ts` from this ticket, so this ticket merges first. That ticket can start on a branch stacked on this one.

Owner, 2026-10-10: "yes, go with my legend, but change the red X to a red target symbol." See the [spec](../spec.md).

## Scope

- One drawing of the legend for the painted board, the clay look, the old Workshop grids and Try it. The Proving Ground uses the same module later.
- Source of the drawing: `docs/research/rules-ui-2026-10-10/mockups/shared/marks.js` in the "wash" look that mockup A uses (`proving-ground.html:587`), and `shared/grammar.css:28-33`, `:60-73`.
- In a game, nearly every take is on an enemy figure. The mockup draws that case as the "occupied take": a thin red edge, a faint red glow and ring under the feet, and a small white badge with the target in the top-left corner (`marks.js:1080-1099`, `:519-531`, drawn in the over layer at `:1127-1132`). The full white take tile shows only on an empty square.
- Files: new `src/render/legend.ts` and `src/render/legend.test.ts`; `src/render/marks.ts`, `marks.test.ts`, `PaintedView.ts`, `renderer.ts`; `src/workshop/card.ts`, `workshop.css`, `ui.test.ts`; `src/style.css`; `docs/visual-design/README.md`, `docs/visual-design/verify.mjs`; `docs/WORKSHOP.md`; new sample `docs/specs/web-redesign/samples/W13.mjs`.
- `marks.ts` and `PaintedView.ts` run in the plugin page (web-redesign spec rule 5). `renderer.ts` comes in only as a type there.

## Plan

1. [x] **`src/render/legend.ts` (new): one core, two outputs.**
   - The functions return a list of plain shapes. Shapes: `rect` (with a corner radius), `circle`, `ellipse` and `line` (a polyline for the arrow shaft and the fletching). Fills: a colour, `'green'` (the linear gradient of `marks.js:167-197`) or `'glow-red'` (the radial glow of `:1095-1099`). Use no `Path2D`, so a Node test can record the calls.
   - Two emitters: `toSvg(shapes): string` (for the Proving Ground and for the tests) and `paint(ctx, shapes): void` (for the painted board and the clay textures).
   - Exports: `LEG` (the colours of `marks.js:73-86`: green `#7cb342`, hi `#9ccc65`, lo `#6a9a36`, navy `#1c2e5c`, red `#d63428`, white `#fbf7ee`, halo `rgba(251,247,238,.92)`, ink `#2b2621`, power `#2f5ea8` and `#7fb2ff`), and `TR = 0.32`, `SR = 0.27`, `SO = 0.07` (`marks.js:163`).
   - `target(cx, cy, R, o)`: port of `targetMark` (`marks.js:204-219`). Outer ring width max(1.2, 0.2 R); the middle ring at 0.6 R only when R ≥ 16 CSS px; dot 0.25 R (0.36 R with no middle ring); a vellum halo 1 px each side.
   - `shot(cx, cy, R, o)`: port of `shotMark` (`marks.js:220-241`): the target, an ink shaft from the lower left (1.75 R) and two fletching chevrons.
   - `tile(kind, x, y, s, o)`: port of `tileWash` (`marks.js:300-342`) with the wash on. Kinds `move | take | both | shot | moveshot`. Tile 0.67 s, centred; radius max(3, 0.06 s); navy edge 1.5 px at 70 %; green at 60 % or white at 94 %; the target or shot at `TR` or `SR` (moved up-right by `SO`); `o.power` adds the two blue frames (`marks.js:313-317`); `o.hover` makes the edge gold-bright `#e9c071`.
   - `occupied(kind, x, y, s, footY, o)`: port of `ringTake` and the glow (`marks.js:1080-1090`, `:1095-1099`): red edge inset 0.06 s at 2 px, fill `rgba(214,52,40,.08)`, glow ellipse rx 0.38 s, ry 0.12 s, ring rx 0.34 s, ry 0.1 s at 2.5 px and 60 %. `footY` is the figure's foot line, not 0.9 s. For `both` and `moveshot`, the green wash goes under the edge.
   - `badge(x, y, s, kind, o)`: port of `takeBadge` (`marks.js:519-531`): 15 px when s < 48 px, else clamp(0.27 s, 15, 22) px, 3 px from the top-left corner; white rounded square, navy edge 1.5 px; target at 0.34 g or shot at 0.28 g. `o.hover` scales it by 1.15 with the gold-bright edge.
   - Units: `o.px` is drawing units for one CSS pixel. Every width and each threshold (16, 24, 48 px) is in CSS pixels.
   - Keep the `marks.js` line numbers in the comments.
2. [x] **`src/render/marks.ts` `drawMarks()`** (`marks.ts:72-188`).
   - Delete `gem()` (`:191`), `brackets()` (`:220`), `sight()` (`:232`), the move glow and bob (`:117-126`, `:171-176`), the capture ring and the dashed shot ring (`:127-134`), and the brackets and sight calls in the over layer (`:177-182`).
   - Under layer, for each square in `moves ∪ captures`: in both lists, `both` (or `moveshot` when `shots` has the square); only in `captures` with a figure on the square, `occupied`; only in `captures` on an empty square, the `take` or `shot` tile; only in `moves`, the `move` tile. A power move or take adds `power: true`. The power rune (`:113-116`), swaps, shoves and the shove arrow stay as they are.
   - Over layer, in the row loop: `badge()` for each occupied take, after that row's figures (`scene.mjs:786-801`).
   - Hover on a move: keep the ghost figure; replace the gold ellipse (`:121-125`) with the gold-bright tile edge. Hover on a take: the gold-bright edge and the larger badge.
   - The read of an enemy piece (`:98-106`, `:155-158`): the same legend marks at half strength (alpha 0.5); the read's sight becomes the shot mark.
   - Motion: keep `appear()` and its ripple (`:36-37`, `:76-81`) as scale 0.6 + 0.4 a round the square centre and alpha min(1, a). Remove the pulse, bob, glint and turn from the legend marks. Swap, shove, rune and check keep their motion.
   - `MarkState` (`:20-34`): add `px` (scene units for one CSS pixel) and `board` (the shown position's squares, to find "a figure stands here").
   - Rewrite the header comment (`:5-19`) in the legend's words.
3. [x] **`src/render/PaintedView.ts` `drawMarks()`** (`:215-257`; the call at `:236`): pass `px: 960 / this.width` (`SIZE` 960, `scene.mjs:21`) and `board: this.pos?.board`. Pass the foot line from `scene.foot(sq)` (`scene.mjs:97`). The plugin board gets the same values.
4. [x] **`src/render/renderer.ts` `highlight()`** (`:633-685`), the clay look.
   - Remove `markerGeo` and `moveMat` (`:216-217`), the move boxes (`:652-656`) and the capture tint (`:640`).
   - Add legend quads: draw each kind once with `legend.paint` into a 256 × 256 canvas, make a `THREE.CanvasTexture` (`colorSpace = THREE.SRGBColorSpace`, as at `:97`), and cache it by kind, power and detail level. Kinds: move, both, moveshot, occupied take, occupied shot, and the power forms. One shared `PlaneGeometry(1, 1).rotateX(-Math.PI / 2)`; one `Mesh` with `MeshBasicMaterial({ map, transparent: true, depthWrite: false })` for each marked square at y 0.01 (under the check ring at 0.045), in `this.markers`. Occupancy: `this.lastPos.board` (`:516`).
   - Detail level: the middle ring and the badge size come from the square's size on screen (about canvas width / 9). Make the textures again when the level changes on a resize.
   - Black's view: set `rotation.y = Math.PI` on each quad when the board is flipped, so the badge stays at the screen's top-left; `flip()` (`:464-471`) calls `highlight()` again with the last highlights.
   - Hint (`:639`, green `0x1f6a3a`): make it gold, as the painted board's gold hint frame, because green now means "move".
5. [x] **Old Workshop grids** (they go with the Proving Ground cutover; until then they show the same legend).
   - `src/workshop/card.ts` `cellMarks()` (`:16-23`): on the take grid, return ` c-both` for `both`, ` c-moveshot` for `moveShoot`, ` c-take` for `take` and ` c-shoot` for `shoot`. The move grid stays ` c-move`. Keep the `/ c-/` test in `dialog.ts:443` true. Update the comment.
   - `src/workshop/workshop.css:174-180` and `:368`: the CSS port of `grammar.css:60-73` under the Workshop names. Editor cells (`.ws-cell`, 24 to 44 px): `::before` is the tile (inset 10 %, navy edge, radius 3 px, green gradient or white); `::after` is the target or shot as a data-URI SVG. Read-only grid (`.ws-grid-cell`, about 20 px): the glyph form of `glyphTile` and `glyphTarget` (`marks.js:348-369`): a full-cell fill, ring and dot, no frame.
   - Try it (`workshop.css:278-285`): `.mk-move` is the green wash; `.mk-take` and `.mk-shot` are the red edge and the top-left badge; `.mk-push`, `.mk-swap` and `.mk-many` stay. No class rename.
   - `src/workshop/ui.test.ts:127` expects `['c-both']`; `:133` expects `['c-moveshot']`.
6. [x] **Tokens and text.**
   - `src/style.css:47-49`: `--mark-move` becomes `124 179 66`, with comments in the legend's words; add `--leg-green`, `--leg-green-hi`, `--leg-green-lo`, `--leg-navy`, `--leg-red`, `--leg-white`, `--leg-halo` from `grammar.css:28-33`.
   - `docs/visual-design/README.md:30-46` (the marker table and the hover sentence) and `:159` (the token list).
   - `docs/visual-design/verify.mjs:266`, `:275`: the messages say "shot targets"; the data assertions stay. These lines are assertion lines of a registered check, so the commit needs one `Removed-check:` trailer for each.
   - `docs/WORKSHOP.md:18` and `:26`: one legend sentence for the boards and Try it, with no word from the deny list of `src/workshop/workshop.docs.test.ts:29-43`.
   - No player text names the old marks today (`src/ui/table.ts:114`, `src/context-line.ts:31` and `src/lessons.ts:18` say "marked"). They stay.
7. [x] **Sample `docs/specs/web-redesign/samples/W13.mjs`** (phone 390 × 844 and desktop 1440 × 900). States:
   - `painted-queen`: a queen on d4, enemies on b6 and f2 (dark squares) and on d7 and g4 (light squares); tap d4.
   - `painted-knight`: a knight on d4, enemies on c6 and e6; tap d4.
   - `painted-archer`: `4k3/8/1p3r2/8/3A4/8/8/4K3 w - - 0 1`, tap d4 (as `verify.mjs:262`).
   - `painted-hover`: the queen state, then hover a move square and a take square.
   - `painted-power`: `?kings=stratus:flight,none` with the position of `verify.mjs:269`; arm the power and tap b1.
   - `clay-queen`, `clay-archer`, `clay-power` (the same with `&look=clay`) and `clay-black` (the queen state, board turned for Black).
   - `workshop-editor` (a design with `move`, `take`, `both`, `shoot` and `moveShoot` squares, as `ui.test.ts:122`), `workshop-read` (its read-only card, as `W12.mjs`) and `workshop-try`.
   - A `-deut` copy of the painted-queen, clay-queen and workshop-editor states: in its steps, `(await page.context().newCDPSession(page)).send('Emulation.setEmulatedVisionDeficiency', { type: 'deuteranopia' })`.
   - Check each position with the engine (`window.view.marks`) before the shots. Each kind lands on a light and a dark square at least once.

## Decisions (decided by delegation, owner 2026-10-09)

- **D1 Occupied take:** the mockup's form as it is (red edge, faint glow and ring under the feet, top-left badge), because the ticket says "Do not make a second design". "No old ring" means no crimson ring as the only take sign.
- **D2 "Both" on the old Takes board:** the Takes board shows the full legend for each square that takes (`c-take`, `c-both`, `c-shoot`, `c-moveshot`); the Moves board shows green for each square that moves. The two boards go at the Proving Ground cutover.
- **D3 Clay hint:** gold, as on the painted board. Green now means move.
- **D4 Read of an enemy piece:** the same legend marks at half strength, so one mark language serves both.
- **D5 Show threats** (`src/style.css:134-146`, `src/screen/play.ts:262-281`): it keeps its red dot and ring in this ticket. Ask the owner with the screenshots, because a red dot can now read as a take target.
- **D6 Hover:** the ghost figure stays; the gold ellipse becomes a gold-bright tile edge.
- **D7 Plugin:** the plugin board follows the legend through the shared modules. No plugin release until the owner asks.

## Verification

- [x] `npm test` passes, with:
  - `src/render/legend.test.ts` (new): a move has no circle; a take has the outer ring, the dot and the halo; the middle ring shows only at R ≥ 16 px; `both` is the green fill plus the target; a shot adds the shaft and fletching lines; the badge is 15 px under s = 48 px and clamp(0.27 s, 15, 22) above; `toSvg` and `paint` (on a fake context that records calls) give the same shape count; a source lint finds no `gem(`, `brackets(` or `sight(` in `src/render` and none of `#e9b44c`, `#f0bf52` or `dashed #b3261e` in `src/workshop/workshop.css`.
  - `src/render/marks.test.ts`: its fake context gets `roundRect`, `ellipse`, `moveTo`, `lineTo` and the two gradient makers; the bite badge and hint order tests stay green.
  - `src/workshop/ui.test.ts:127`, `:133` as in step 5; `src/workshop/css.test.ts` stays green.
- [x] `npm run check:browser visual-design verb-marks read-piece painted-game special-moves powers playable-clay workshop workshop-cast` passes; `playable-clay` adds one assertion: a selected piece makes legend quads in `renderer.markers`.
- [x] `npm run check:browser plugin-ui` and `npm run check:browser plugin-ui-http` pass (by name). The plugin page size before and after (`node tools/plugin-ui-build.mjs`) is in this ticket. Stop and ask at 4,350,000 bytes.
- [x] `grep -rnE "\bgem\(|brackets\(|sight\(|#e9b44c|#f0bf52|dashed #b3261e|markerGeo|moveMat" src` finds nothing.
- [x] `SAMPLE=W13 node docs/specs/web-ux/capture.mjs <preview-url> <out>` renders each state at 1440 × 900 and 390 × 844 with no fault.
- [x] Deuteranopia: in each `-deut` render, move, take and both differ by shape (no target; target on white or the badge; target on green with its halo).
- [x] The phone badge (15 px): the take and the shot badge differ in a zoom of the 390 × 844 renders. If they do not, ask the owner before a larger badge.
- [x] Clay: the badge stays at the screen's top-left in `clay-black`; a figure still covers the badge of the square behind it; the check ring shows over the quads.
- [x] Optional, detached: `node docs/specs/web-ux/render-compare.mjs --against main` changes only states with move or take marks.
- [ ] The owner sees the W13 renders before the merge. The ticket records his words and the date, and his answer to D5.

## Risks

- The phone badge is small, so the take and shot badges can look alike.
- The plugin page changes with the shared modules (rule 5).
- The clay quads use `depthWrite: false`; check the order against the figures and the check ring.
- The mockup's figures stand lower (0.9 s) than the game's (the row centre + 40 units, `scene.mjs:97`); use the foot line.

## Does not do

- No change to swap, shove, rune, check, last-move or bite marks.
- No new mark in the Proving Ground; that build imports `legend.ts`.
- No plugin release.
- No change to Show threats (D5).

## Comments

**2026-10-10, the build (branch `claude/move-legend`).** `S` is the scratch folder `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/legend`.

What changed:
- `src/render/legend.ts` (new) and `legend.test.ts` (new, 9 tests). `target`, `shot`, `tile`, `occupied` and `badge` return plain shapes; `toSvg` and `paint` draw them. `kindOf` gives the kind of a marked square.
- `marks.ts`: the gem, the brackets, the sight, the move glow and bob, the capture ring and the dashed ring are gone. The under layer draws the tile, or the occupied take on a figure; the over layer draws the badge after the figures of its row. The read uses the same marks at alpha 0.5.
- `PaintedView.ts` passes `px` and `board`. `renderer.ts`: one ground quad for each marked square, with a 256 × 256 canvas texture cached by kind, figure and power; the hint is gold (`0x7a5712`); the capture tint is gone.
- Workshop: the `card.ts` classes, the `workshop.css` port (editor tile and target, read-only glyph, Try it wash, edge and badge), `ui.test.ts`, `css.test.ts`.
- `style.css` tokens, `docs/visual-design/README.md`, the two `verify.mjs` messages, `docs/WORKSHOP.md`, one assertion in `tools/verify-playable-clay.mjs`, and the sample `W13.mjs` (18 states).

Evidence:
- `npm test` (lock script): 111 files passed, 1 skipped; 1833 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-3.log`). Run 1 had 1 failure in `css.test.ts` (`S/logs/npm-test-1.log`); change 1 below fixes it.
- `npm run check:browser visual-design verb-marks read-piece painted-game special-moves powers playable-clay workshop workshop-cast`: all 9 passed (`S/logs/checks-1.log`; run folder `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/move-legend-G2j85V`). `playable-clay` passes 18 checks, with the new assertion: the selected knight makes the legend quads `move:false:false` on a3 and c3.
- `plugin-ui` passed (`S/logs/checks-2.log`, `move-legend-BIHvZ8`). `plugin-ui-http` stopped at once in that run, because `PLUGIN_TEST_DATABASE_URL` was not set. With the local test database of `docs/plugin-preparation.md`, after `npm run plugin:db:init-test`, it passed (`S/logs/checks-3.log`, `move-legend-SeS6vx`).
- The plugin page (`node tools/plugin-ui-build.mjs`): 4,296,150 bytes before, 4,297,565 bytes after (+1,415), below the 4,350,000-byte line.
- The grep of Verification finds nothing (exit 1).
- W13 on a preview of this tree: 34 renders, 0 with a fault (`S/w13-2`, `S/logs/w13-2.log`). The `clay-check` state came after that run: 2 renders, 0 with a fault (`S/w13-check`, `S/logs/w13-check.log`, through a temporary one-state copy of the table).
- `node docs/specs/web-ux/render-compare.mjs --against main --samples 00,01,W1,W11,W12` (five samples, not all, to save time): 92 pairs, 14 stable changes, 24 unstable, 0 faults (`S/logs/compare.log`, renders in `S/compare`). Each stable change is a state with marks: `selected` of 00 (5 sizes) and of 01 (with `selected-dark`, 4), `haste` of W1 (2), and the read-only card of W12 (3). W11 has no marks and no stable change. The tool exits 1 when a stable change exists, so exit 1 is the expected result here.
- I looked at each render. Deuteranopia (`*-deut-*.png`): the move is a plain tile, the take is the target on white or the badge, and both is the target on a tile; the shapes differ with no help from colour. The phone badges (`S/zoom-badges-phone.png`): the shot badge has the arrow, the take badge has none. Clay: in `clay-black` the board turns and each badge stays at the screen's top-left. In `clay-check` the check ring and its line show next to the four move quads. The quads test depth and do not write it, and the figures are opaque, so a figure in front hides a quad. (The review corrects the rest of this sentence: see Reviews, item 4.) On the painted board a row's badges draw before the figures of the rows in front.

Changes from the ticket, and why:
1. `css.test.ts` removes `url("…")` values before it scans the classes. The data-URI SVGs hold `www.w3.org`, and the scan read `w3` and `org` as classes. A data URI holds no class.
2. The clay detail size is the width of one square on screen at the camera's zoom, rounded to 8 px, at least 24 px (the review changed it from min(w, h) / 9.4, at least 16 px; see Reviews, items 1 and 2). The ticket says about width / 9, but the camera's short side holds 9.4 squares.
3. Hover on an occupied take makes its red edge gold-bright too, as for a tile edge; the badge grows by 1.15.
4. `legend.ts` has no glyph form (`glyphTile`, `glyphTarget`, the s < 24 branch of `tileWash`). No canvas draws a tile under 24 px, and the Proving Ground ticket does not ask for one. The read-only Workshop grid gets the glyph as static SVGs in `workshop.css`, with the values of `glyphTarget` at t = 20.
5. W13 has three more states than the ticket. `painted-archer-light`: from d4 the Archer shoots only dark squares, so a shot on a light square needs the Archer on e4. `clay-check`: the check ring next to the quads. `painted-hover` is two states, `painted-hover-move` and `painted-hover-take`, because one render shows one pointer.
6. `clay-black` uses the queen state turned for Black (`7K/5R2/8/3q2N1/8/1B6/3P4/k7 b`) with White as the computer, because the board turns only when Black is the human side.
7. Try it draws the badge inside the red edge at the top-left, because an `::after` box cannot draw outside itself.
8. The read of an enemy piece keeps the plain brown ring for its swap and push squares; the legend has no mark for them.
9. `both` and `moveshot` on a figure use the occupied form with the green tile under the red edge (step 1); the badge shows the target or the shot.

Open:
- The owner sees the W13 renders (`S/w13-2`, `S/w13-check`) before the merge.
- D5, for the owner: Show threats keeps its red dot and ring. With the legend, a red dot can read as a take target. Keep it, or change it?

**2026-10-10, the review fixes.** A reader that did not write the diff reviewed the branch (`S/../review-legend.md`).

Reviews:
1. Should-fix, `renderer.ts`: the clay texture clips the blue power frames of a take on a figure. **Confirmed.** At a 32 px square, the outer frame of `occupied()` with `power` starts at -24.64 texture units; the old texture starts at 0 (at 40 px: -17.18; at 96 px: -4.11). One correction: the reviewer's position needs `?rules=2017`. With the game's rules Haste cannot take (`hasteCaptures: false`), and no power of the game takes. Under the 2017 rules, a5 is a power take. Fix: the canvas is 384 × 384 with the square in the middle 256 × 256, and the quad is 1.5 squares wide. The detail floor goes from 16 px to 24 px, so the frames reach at most 38 units (0.15 square) past the square, inside the 64 units of room. New W13 states `painted-power-take` and `clay-power-take`: they check that a5 is a power take, and in each render the two blue frames show in full round a5 (`S/zoom-power-take-clay-desk.png`, `S/zoom-power-take-painted-desk.png`).
2. Should-fix, `renderer.ts`: the mark detail ignores the camera zoom. **Confirmed.** Only `resize()` set the detail, and OrbitControls changes `camera.zoom` from 0.7 to 3 with no resize. Fix: `legendDetail()` uses the width of one square on screen at the camera's zoom. `resize()` and each frame call it; when the size changes (in 8 px steps), it makes the textures again. `playable-clay` adds one assertion: at twice the zoom, the detail is twice as large (within 8 px). A probe at 1440 × 900 (the knight on d4, the take on e6): zoom 1 gives detail 88 and zoom 2 gives 184; the white box of the badge on screen is 20 × 17 px and 19 × 16 px (`S/zoom-detail-badge-z1.png`, `S/zoom-detail-badge-z2.png`). Before the fix, zoom 2 doubled it to about 44 px.
3. Should-fix, `W13.mjs`: no light-square coverage for `both` and `moveShoot`. **Confirmed, with one correction.** On the Workshop grids the piece's cell is light (`(x + y) & 1` adds `dk`), so `both` (1, 1) and `moveShoot` (2, 2) stood on light cells, not dark cells. `take` stood only on light cells and `shoot` only on dark cells, so the same fault applied to them. Fix: four more design squares, `both` (-1, 2), `take` (1, 2), `shoot` (-2, 2) and `moveShoot` (-2, 1). `shades()` in `workshop-editor` and `workshop-read` stops the render when a mark class has no light or no dark cell. Three waits get `.first()`, because two cells now have each class.
4. Should-fix, this ticket: the clay depth check was ticked with no evidence. **Confirmed.** The build's evidence said that no W13 state puts a figure in front of a badge. That was also wrong: in `clay-queen` the figure on f2 stands in front of its own badge and covers a part of it, most of it on the phone (`S/zoom-own-badge-desk.png`, `S/zoom-own-badge-phone.png`). At the default camera, a figure on another square does not reach a badge; it does when the player tilts the camera. Fix: the new state `clay-depth` (the rook a5 takes the knight e5, and the queen e4 stands in front of e5) sets the camera to its lowest angle (`maxPolarAngle`). In both renders the queen covers the right part of the e5 badge and the red edge behind her (`S/zoom-depth-desk.png`, `S/zoom-depth-phone.png`). I unticked the check, and I ticked it again after these renders.

Evidence after the fixes:
- `npm run check:browser visual-design verb-marks read-piece painted-game special-moves powers playable-clay workshop workshop-cast`: all 9 passed (`S/logs/checks-4.log`, run folder `move-legend-GfhKoC`); `playable-clay` passes 18 checks with the zoom assertion.
- `plugin-ui` and `plugin-ui-http` (with the local test database): both passed (`S/logs/checks-5.log`, `move-legend-zZMNxN`). The plugin page is 4,297,565 bytes, no change (`S/logs/plugin-review.log`).
- W13 on a preview of this tree: 42 renders, 0 with a fault (`S/w13-3`, `S/logs/w13-3.log`).
- `npm test` (lock script): 111 files passed, 1 skipped; 1833 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-5.log`).
