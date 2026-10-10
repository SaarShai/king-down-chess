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

1. [ ] **`src/render/legend.ts` (new): one core, two outputs.**
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
2. [ ] **`src/render/marks.ts` `drawMarks()`** (`marks.ts:72-188`).
   - Delete `gem()` (`:191`), `brackets()` (`:220`), `sight()` (`:232`), the move glow and bob (`:117-126`, `:171-176`), the capture ring and the dashed shot ring (`:127-134`), and the brackets and sight calls in the over layer (`:177-182`).
   - Under layer, for each square in `moves ∪ captures`: in both lists, `both` (or `moveshot` when `shots` has the square); only in `captures` with a figure on the square, `occupied`; only in `captures` on an empty square, the `take` or `shot` tile; only in `moves`, the `move` tile. A power move or take adds `power: true`. The power rune (`:113-116`), swaps, shoves and the shove arrow stay as they are.
   - Over layer, in the row loop: `badge()` for each occupied take, after that row's figures (`scene.mjs:786-801`).
   - Hover on a move: keep the ghost figure; replace the gold ellipse (`:121-125`) with the gold-bright tile edge. Hover on a take: the gold-bright edge and the larger badge.
   - The read of an enemy piece (`:98-106`, `:155-158`): the same legend marks at half strength (alpha 0.5); the read's sight becomes the shot mark.
   - Motion: keep `appear()` and its ripple (`:36-37`, `:76-81`) as scale 0.6 + 0.4 a round the square centre and alpha min(1, a). Remove the pulse, bob, glint and turn from the legend marks. Swap, shove, rune and check keep their motion.
   - `MarkState` (`:20-34`): add `px` (scene units for one CSS pixel) and `board` (the shown position's squares, to find "a figure stands here").
   - Rewrite the header comment (`:5-19`) in the legend's words.
3. [ ] **`src/render/PaintedView.ts` `drawMarks()`** (`:215-257`; the call at `:236`): pass `px: 960 / this.width` (`SIZE` 960, `scene.mjs:21`) and `board: this.pos?.board`. Pass the foot line from `scene.foot(sq)` (`scene.mjs:97`). The plugin board gets the same values.
4. [ ] **`src/render/renderer.ts` `highlight()`** (`:633-685`), the clay look.
   - Remove `markerGeo` and `moveMat` (`:216-217`), the move boxes (`:652-656`) and the capture tint (`:640`).
   - Add legend quads: draw each kind once with `legend.paint` into a 256 × 256 canvas, make a `THREE.CanvasTexture` (`colorSpace = THREE.SRGBColorSpace`, as at `:97`), and cache it by kind, power and detail level. Kinds: move, both, moveshot, occupied take, occupied shot, and the power forms. One shared `PlaneGeometry(1, 1).rotateX(-Math.PI / 2)`; one `Mesh` with `MeshBasicMaterial({ map, transparent: true, depthWrite: false })` for each marked square at y 0.01 (under the check ring at 0.045), in `this.markers`. Occupancy: `this.lastPos.board` (`:516`).
   - Detail level: the middle ring and the badge size come from the square's size on screen (about canvas width / 9). Make the textures again when the level changes on a resize.
   - Black's view: set `rotation.y = Math.PI` on each quad when the board is flipped, so the badge stays at the screen's top-left; `flip()` (`:464-471`) calls `highlight()` again with the last highlights.
   - Hint (`:639`, green `0x1f6a3a`): make it gold, as the painted board's gold hint frame, because green now means "move".
5. [ ] **Old Workshop grids** (they go with the Proving Ground cutover; until then they show the same legend).
   - `src/workshop/card.ts` `cellMarks()` (`:16-23`): on the take grid, return ` c-both` for `both`, ` c-moveshot` for `moveShoot`, ` c-take` for `take` and ` c-shoot` for `shoot`. The move grid stays ` c-move`. Keep the `/ c-/` test in `dialog.ts:443` true. Update the comment.
   - `src/workshop/workshop.css:174-180` and `:368`: the CSS port of `grammar.css:60-73` under the Workshop names. Editor cells (`.ws-cell`, 24 to 44 px): `::before` is the tile (inset 10 %, navy edge, radius 3 px, green gradient or white); `::after` is the target or shot as a data-URI SVG. Read-only grid (`.ws-grid-cell`, about 20 px): the glyph form of `glyphTile` and `glyphTarget` (`marks.js:348-369`): a full-cell fill, ring and dot, no frame.
   - Try it (`workshop.css:278-285`): `.mk-move` is the green wash; `.mk-take` and `.mk-shot` are the red edge and the top-left badge; `.mk-push`, `.mk-swap` and `.mk-many` stay. No class rename.
   - `src/workshop/ui.test.ts:127` expects `['c-both']`; `:133` expects `['c-moveshot']`.
6. [ ] **Tokens and text.**
   - `src/style.css:47-49`: `--mark-move` becomes `124 179 66`, with comments in the legend's words; add `--leg-green`, `--leg-green-hi`, `--leg-green-lo`, `--leg-navy`, `--leg-red`, `--leg-white`, `--leg-halo` from `grammar.css:28-33`.
   - `docs/visual-design/README.md:30-46` (the marker table and the hover sentence) and `:159` (the token list).
   - `docs/visual-design/verify.mjs:266`, `:275`: the messages say "shot targets"; the data assertions stay. These lines are assertion lines of a registered check, so the commit needs one `Removed-check:` trailer for each.
   - `docs/WORKSHOP.md:18` and `:26`: one legend sentence for the boards and Try it, with no word from the deny list of `src/workshop/workshop.docs.test.ts:29-43`.
   - No player text names the old marks today (`src/ui/table.ts:114`, `src/context-line.ts:31` and `src/lessons.ts:18` say "marked"). They stay.
7. [ ] **Sample `docs/specs/web-redesign/samples/W13.mjs`** (phone 390 × 844 and desktop 1440 × 900). States:
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

- [ ] `npm test` passes, with:
  - `src/render/legend.test.ts` (new): a move has no circle; a take has the outer ring, the dot and the halo; the middle ring shows only at R ≥ 16 px; `both` is the green fill plus the target; a shot adds the shaft and fletching lines; the badge is 15 px under s = 48 px and clamp(0.27 s, 15, 22) above; `toSvg` and `paint` (on a fake context that records calls) give the same shape count; a source lint finds no `gem(`, `brackets(` or `sight(` in `src/render` and none of `#e9b44c`, `#f0bf52` or `dashed #b3261e` in `src/workshop/workshop.css`.
  - `src/render/marks.test.ts`: its fake context gets `roundRect`, `ellipse`, `moveTo`, `lineTo` and the two gradient makers; the bite badge and hint order tests stay green.
  - `src/workshop/ui.test.ts:127`, `:133` as in step 5; `src/workshop/css.test.ts` stays green.
- [ ] `npm run check:browser visual-design verb-marks read-piece painted-game special-moves powers playable-clay workshop workshop-cast` passes; `playable-clay` adds one assertion: a selected piece makes legend quads in `renderer.markers`.
- [ ] `npm run check:browser plugin-ui` and `npm run check:browser plugin-ui-http` pass (by name). The plugin page size before and after (`node tools/plugin-ui-build.mjs`) is in this ticket. Stop and ask at 4,350,000 bytes.
- [ ] `grep -rnE "\bgem\(|brackets\(|sight\(|#e9b44c|#f0bf52|dashed #b3261e|markerGeo|moveMat" src` finds nothing.
- [ ] `SAMPLE=W13 node docs/specs/web-ux/capture.mjs <preview-url> <out>` renders each state at 1440 × 900 and 390 × 844 with no fault.
- [ ] Deuteranopia: in each `-deut` render, move, take and both differ by shape (no target; target on white or the badge; target on green with its halo).
- [ ] The phone badge (15 px): the take and the shot badge differ in a zoom of the 390 × 844 renders. If they do not, ask the owner before a larger badge.
- [ ] Clay: the badge stays at the screen's top-left in `clay-black`; a figure still covers the badge of the square behind it; the check ring shows over the quads.
- [ ] Optional, detached: `node docs/specs/web-ux/render-compare.mjs --against main` changes only states with move or take marks.
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
