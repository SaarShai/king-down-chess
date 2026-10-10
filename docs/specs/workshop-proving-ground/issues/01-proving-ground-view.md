# 01 · The Proving Ground view

Status: ready-for-agent
Size: L
Blocked by: move-legend 01 (`src/render/legend.ts`). Work can start on a branch stacked on that ticket's branch.

## Scope

- The smallest slice that the owner knows as A, behind `?workshop=a`, with no edit:
  - the stone board with the open piece on d4 and its example pieces; the marks in the legend; rails, arches, the asleep and awake marks, and the swap and push effects (Maester, Ogre);
  - the rim: the files and ranks and the forward chevron on the desktop; on the phone, the coordinates inside the edge squares (`proving-ground.html:550-559`, `:1251-1254`, `:484`);
  - the plinth: the name band, the figure on its stone, and up to 3 rule lines (wax seal, When chip, one sentence; the pill as plain text);
  - the brushes Move, Take and Both as the key (no paint yet), and the live key row (desktop);
  - the ledge with the Pieces tab: the 11 pool pieces, then "Yours" from the store. A tap opens the piece on the plinth and the board;
  - a `?workshop=a&design=<code>` link opens that design on the board, read only;
  - the wide layout (1000 px and wider) and the narrow layout (under 1000 px), keys and screen-reader labels.
- The golden fixtures for old saves and links, before any other change.
- Mockup source: `mockups/proving-ground.html` states `open`, `hero`, `archer`, `beast`, `maester`, `ogre`, `guard`, `phone-open` (`:2107-2114`). In this ticket the `hero`, `beast` and `ogre` states show without their refused marks, stamps and knots (ticket 04) and without their hover-only marks (ticket 05).

## Plan

1. [x] **Mockup in Git.** If main does not hold `docs/research/rules-ui-2026-10-10/` yet, commit it first, as its own commit (REVIEW.md, compare.html, `mockups/` 3.2 MB, `screens/` 6.5 MB).
2. [x] **Golden fixtures: `src/workshop/compat.test.ts` (new).** Make literal strings from today's main and paste them in the test as text:
   - `?design=` codes: the W12 design (`docs/specs/web-redesign/samples/W12.mjs:5-10`); a code with each mark (`move`, `take`, `both`, `shoot`, `moveShoot`); one with each of the 10 blocks; one with `glow: 'Frost'`; one with `body: 'token'` and `auto: true`; one with a `figure` and `army: 1`.
   - `kingdown.workshop` entries: one with no `figure`, one with no `ownLetter`, one damaged entry.
   - Each code passes `parseDesign` (`model.ts:222-233`) and gives the same `keyOf` (`:150`) as its source design. Each code that `designCode` made (all but the hand-made W12 code) gives the same string again through `designCode(parseDesign(code))`. Each stored entry passes `validStored` (`:215-219`); `loadShelf(box)` (`store.ts:24`) on a fake storage reads them and returns `bad: 1` for the damaged one.
3. [x] **`src/workshop/moves.ts`: export `patternOf(d, board, from, st)`**, the union of the piece's squares and lines with its "moves like" piece while that When holds (`:53-61`). `movesOf` calls it, so there is one copy.
4. [x] **`src/workshop/scene.ts` (new), pure.**
   - `EXAMPLES`: the example board of each pool key, from the `pieces` lists of `mockups/shared/scenes.js` (paladin `:37`, pawn `:92`, archer `:178`, beast `beastPieces()`, maester `:219`, ogre `:228`, guard `:241`, rook `rookPieces()`, knight `:308`, bishop `:313`, queen `:323`). A design with `from: [key]` uses that board; any other design stands alone on d4.
   - `boardOf(pieces)`: a `Uint8Array(64)`; the open design is `piece(T, WHITE)`, as `sandbox.ts:53`.
   - `sceneOf(d, board, from, st)`: the scene of `scenes.js:7-23` without `by`, `impressions`, `knots` and `why` (ticket 04):
     - `marks` (spec decision 36): on each square of `patternOf`, the painted mark shows when the square is empty or holds an enemy that `movesOf` takes there; a move-only mark on an occupied square and any friend show nothing (the Pawn's empty c5 and e5 are `take`, `scenes.js:90-93`; the Archer's empty b6 is `shot` and its e5 is bare, `:176-181`). A line square is `move` when empty and `take` on the enemy that ends the line. A move that `movesOf` gives on a square with no painted mark (a rule's move, such as step 2) shows its `marksModel` kind (`src/marks-model.ts:4-30`). A move with more than one capture (a chain) waits for ticket 05; an enemy that it cannot take waits for ticket 04.
     - `rails` and `arches`, with no second walk of the rules: the reach of one line is `movesOf` on the design with that line only (`{ squares: [], lines: [l], rules }`), less swaps, shoves and chains. The rail runs to the farthest square of that reach; an occupied square before it is an arch (a `linesPass` rule). The end is `x` (the farthest square is a take), `stop` (a friend stops the line: the rail goes onto it, as the Rook's d2 and e1, `scenes.js:252-254`), or `arrow` (the edge). An enemy that it cannot take gets no end until ticket 04 (`blocked`).
     - `effects`: `{ k: 'swap', a, b }` for each `movesOf` move with `swap`, and `{ k: 'push', from, to }` for each `shove` (the Maester and the Ogre, `scenes.js:219-235`). The hover-only `follow` and `sight` effects come in ticket 05.
     - `cond`: `asleep` for the new squares of a run with that state rule's When forced to `always`; `awake` for the squares that go when that rule is removed. A rail whose squares are all asleep gets `style: 'asleep'`.
     - `pieces` from the board, with `open: true` on the design.
   - `src/workshop/scene.test.ts` (new): load `scenes.js` with `node:vm` (`runInNewContext(src, { window: {} })`, then `window.KD.scenes`); expect `check()` to return no problems. The G22 lists (`scenes.js:356-370`) are a local constant and not exported; `check()` holds each scene's `marks` equal to them. So for paladin, pawn, pawn-e2, archer, archer-alone, beast, maester, ogre, guard, rook, knight, bishop, rook-alone and queen: build the board from the scene's `pieces`, the design from `PRESETS`, and compare `sceneOf`'s marks (square, kind, `cond`) with `get(id).marks`, less the `blocked` marks (ticket 04) and the marks with `on` (ticket 05). Compare the rails (`from`, `to`, `end`, less `blocked`), the arches and the swap and push effects too. Where the engine and a hand list differ, the engine wins; the test names each such case with a one-line reason.
5. [x] **`src/workshop/marks.ts` (new): port of `mockups/shared/marks.js`, as ES exports.** Port only what this ticket draws: `drawString` (`:1003-1175`) with the helpers that its layers call for this ticket's scene parts (rails and arches, `:386-466`; the swap and push effects), `viewBox` and `squareXY` (`:990-1000`), `tile` (`:852`), `seal` (`:710`), `sigil` (`:752`, which `seal` and `tag` call), `SIGILS` (`:88`), `chip` (`:693`), `picto` (`:690`), `tag` (`:805`). The plaque waits for ticket 06. Later tickets port the rest when they use it. Changes:
   - no IIFE and no `window.KD` (`:1186-1196`); `ground.ts` calls `ensureDefs()` (`:187-197`) on its first open;
   - `BLOCKS`, `GROUPS`, `blockOf` and `whenWords` come from `vocab.ts` (not the copies at `:127-141`, `:650`);
   - the tiles, the occupied take (red edge, glow and ring under the feet) and the badge come from `legend.ts` (`occupied`, `badge`, `toSvg`; move-legend ticket 01), in place of `tileWash`, `targetMark`, `shotMark`, `takeBadge` and the over-layer glow (`:204-241`, `:300-342`, `:519-531`, `:1080-1099`); `look.wash` and `look.familyWax` are always on;
   - `assets` is `${import.meta.env.BASE_URL}ui/`; the board image is `public/ui/stone-board.webp` as the field's background (`noBoard`; the path at `:1041` does not exist in the game);
   - each mark group has `data-sq` and `data-k`, for the tests and the check.
6. [x] **`src/workshop/vocab.ts`:** add `label` to each block, from the mockup's short seal names (`proving-ground.html:681`). `ui.test.ts`: each block has a label of 14 characters or fewer.
7. [x] **`src/workshop/ground.ts` (new): `groundDialog(): { open(): void; openDesign(code: string): void }`.** `<dialog id="workshop" class="pg">`, `aria-labelledby` on the title.
   - Top bar: "‹ Menu" (closes; the focus goes back to the opener) and the "WORKSHOP" title (`renderTop`, `proving-ground.html:952-969`).
   - Plinth: the name band, the figure (pool art from `pieceArt(BODY_TYPE[body])`, `src/ui/guide.ts:22-24`, for a pool piece and a copy with no `look.figure`; else `figureUrl(selectedFigure(d).id, d.look.army)`, `figures.ts:253`, `:267`, as `look.ts:18` does), and the rule lines (`sealLineHTML`, `proving-ground.html:979-1005`): `seal()` in its family colour, `chip()` for the When (none for `always`), and the sentence from `ruleParts` (`text.ts:91-98`).
   - Board: `drawString(sceneOf(...))` into an SVG, and a hit layer of 64 buttons (`#hits`, `proving-ground.html:559`): `role="grid"`, one tab stop, arrow keys, a label per square after `squareLabel` (`:1265`). A tap does nothing yet. The rim: the files and ranks and the chevron (desktop), the coordinates inside the edge squares (phone).
   - Right column: the three brush tiles as the key (legend tiles with Move, Take, Both), and the live key row (`keyKinds`, `:1191`), desktop only.
   - Ledge: the Pieces tab only. The 11 `PRESETS`, a "Yours" divider and the designs of `loadShelf()`. A tap opens the item. No NEW tile until ticket 07.
   - `openDesign(code)`: `parseDesign`; a bad code shows "This design link could not be read." (the words of `dialog.ts:780`).
8. [x] **`src/workshop/ground.css` (new):** the regions in CSS grid (no scaled stage); wide at 1000 px and up, narrow below (`proving-ground.html:443-540` for the phone form). The components of `grammar.css` that this ticket uses, scoped under `#workshop.pg`, with no `.mk-*` class and no `:root` tokens (`src/style.css` has them). `src/workshop/css.test.ts` reads `ground.css` too.
9. [x] **`src/main.ts:90-97`:** `openWorkshop` imports `./workshop/ground` when `params.get('workshop') === 'a'`, else `./workshop/dialog`. The `workshop` promise type (`:90`) stays: `groundDialog()` returns the same `{ open, openDesign }` shape (`dialog.ts:48`). No other change in `main.ts`.
10. [x] **`tools/verify-proving-ground.mjs` (new)**, registered in `tools/lib/registry.mjs` as `{ name: 'proving-ground', script: 'tools/verify-proving-ground.mjs', limit: 180 }`. Groups:
    - `opens`: with `?workshop=a`, the menu door opens `#workshop.pg`; ‹ Menu and Esc close it; the focus goes back to the menu.
    - `poolPieces`: each of the 11 pieces opens; the Pawn's and the Paladin's `data-sq`/`data-k` marks equal the scene test lists.
    - `link`: a design link opens it read only; a bad code shows the toast.
    - `keys`: arrows move over the squares; one tab stop.
    - `layouts` at 1440 × 900, 1280 × 800, 1024 × 768 (the narrowest wide layout), 768 × 1024, 390 × 844 and 320 × 568: `noSidewaysScroll`, `insideViewport`, `textNotCut` (`tools/lib/checks.mjs:110-140`), and `minTarget` (`:105`) at 44 px on the buttons that are not board squares; the board squares at 24 px (spec decision 9: 36 px at 320 px wide).
    - `oldDefault`: with no `?workshop=a`, the old Workshop opens.
11. [x] **Sample `docs/specs/web-redesign/samples/W14.mjs` (new):** states `open-pawn`, `paladin`, `archer`, `beast`, `maester`, `ogre`, `guard` and `link`, each with `?workshop=a` and with `targets: 'button:not(.sq, .nub, .knot), select, summary, label'`, so that the 44 px touch test of `capture.mjs` (`:108`) leaves out the board squares and the 24 px parts (spec decision 9).

## Verification

- [x] `npm test` passes: `compat.test.ts`, `scene.test.ts`, the vocab label test, `css.test.ts` with `ground.css`, and `moves.test.ts` (unchanged, with `patternOf` inside `movesOf`).
- [x] `npm run check:browser proving-ground` passes three times; `npm run check:browser workshop workshop-cast menu-extra home` passes (the old Workshop is the default).
- [x] `SAMPLE=W14` renders each state at 1440 × 900 and 390 × 844 with no fault. Put them beside the mockup's `open`, `hero`, `archer` and `phone-open` states (served by the dev server, never `file://`).
- [ ] The owner sees the W14 renders before the merge. The ticket records his words and the date.

## Risks

- `marks.js` is 1,196 lines. Port only the parts in use, or the chunk grows with dead code.
- The scene builder and the hand scenes can differ. The engine wins; each difference is named in the test.
- The fonts Cinzel and Alegreya Sans are in `public/fonts` (`src/style.css:6-14`); the port must not load them a second time.

## Does not do

- No paint, no rule change, no why-trace, no Try with, no NEW, no Share, no Kings, Cards or Rules tab, no motion.
- No change to the old Workshop.

## Comments

### 2026-10-10: part 1, steps 1 to 4 and 6 (branch `claude/proving-ground`)

Steps 5 and 7 to 11 wait for `src/render/legend.ts` (move-legend ticket 01, branch `claude/move-legend`). No Verification box is ticked: each one needs part 2.

- Step 1: main holds the mockup folder (commit 423082fb, 120 files). This branch adds no commit for it.
- Step 2: `src/workshop/compat.test.ts`. It holds 14 share codes: the W12 link, one code with each mark, 10 codes with one block each, a Frost glow, a token with `auto: true`, and a figure with `army: 1`. Together the codes use each kind of When. The `kingdown.workshop` value comes from today's `saveDesign`: an entry with no figure, an entry with no `ownLetter`, and a damaged entry (`y: 4`).
- Step 3: `patternOf(d, board, from, st)` in `src/workshop/moves.ts`, and `movesOf` calls it. `step` and `Can` are exported for `scene.ts`. `moves.test.ts` does not change.
- Step 4: `src/workshop/scene.ts` and `src/workshop/scene.test.ts`. The built scene equals the hand scene (marks, rails, arches, swap and push effects) for the 14 scenes of the list. It also equals `mypawn` (an asleep mark) and `mypawn-queen` (awake marks and 8 awake rails). The engine and the hand lists agree on all 16 scenes, so the test names no exception.
- Step 6: each block in `src/workshop/vocab.ts` has a `label` from the mockup's short names. `ui.test.ts` holds each label to 1 to 14 characters.

Changes from the ticket, with the reasons:

- `EXAMPLES` is private. `examplesOf(d)` gives the piece list of a design: the example board of its pool piece when `from` holds one pool key, else the piece alone on d4. The rule of step 4 then has one place, and `ground.ts` (step 7) calls it.
- The open design's piece in a scene has `k: 'design'`. The board holds it as `T`, and its look comes from the design, not from an engine name.
- A line that stops at an enemy it cannot take: its rail runs to the farthest square of its reach, with the end `none` of the scene format. Ticket 04 changes it to `blocked`. The test leaves out these rails and the hand `blocked` rails.
- Rail styles: the ticket gives `asleep` to a rail whose squares are all asleep. That rule fails the mockup's `mypawn-queen-b4`, whose asleep queen rails cross the painted b5. A When on "Cannot take" would also add a second rail on a line that has a rail now. So a rail is `asleep` when the run with that When forced to "always" has a rail on a line with no rail now, and `awake` when its line has no rail without that rule. The test holds the 8 awake rails of `mypawn-queen`.

Evidence:

- `npm test` before the commit, two runs (the second after a type-only change in `moves.ts`): each 112 test files passed and 1 skipped, 1,844 tests passed and 21 skipped, the node tests 50 of 50, `exit 0`. Logs: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/pg/npm-test-1.log` and `npm-test-2.log` in the same folder.

### 2026-10-10: part 2, steps 5 and 7 to 11 (branch `claude/proving-ground`)

The branch holds `claude/move-legend` (merge 9368918c), so `src/render/legend.ts` is here.

- Step 5: `src/workshop/marks.ts`. `drawString` gives three layers: under (tiles, rails, arches, effects), the pieces, and over (the take badges). The tiles, the occupied takes and the badges come from `legend.ts`. Each mark group has `data-sq`, `data-k` and, for a mark that holds only sometimes, `data-cond`. Rails have `data-k="line"` with `data-from`, `data-to` and `data-end`; arches have `data-k="arch"` with `data-from`, `data-over` and `data-to`; the swap and push effects have `data-k="swap"` or `"push"` with `data-from` and `data-to`.
- Step 7: `src/workshop/ground.ts`.
- Step 8: `src/workshop/ground.css`. `src/workshop/css.test.ts` reads it with `workshop.css`.
- Step 9: `src/main.ts` `openWorkshop`.
- Step 10: `tools/verify-proving-ground.mjs`, registered as `proving-ground` (limit 180 s).
- Step 11: `docs/specs/web-redesign/samples/W14.mjs`.

Changes from the ticket, with the reasons:

- The condition frames (the dashed frame, and the pale fill of an asleep tile) and the key's full-strength tile (`solid`: 0.8 s, with a bevel) are in `legend.ts` `tile()` and `occupied()`, not in the port. Spec rule 5 says that no colour or size of a mark is written a second time. The board look does not change: the wash tile keeps its numbers, and `legend.test.ts` holds the new options. Only the asleep moon pip stays in `marks.ts`.
- The rule lines: the sentence is `partsText` of the block's `say()`, in lower case with no full stop. An event head (for example "when it takes a piece, not a pawn") goes into the chip with the When words. The mockup's short lines are hand text; the game's text is the vocabulary's.
- The tab is 44 px high (the mockup has 36 px), so that it passes `minTarget` at 44 px. The ledge stays 156 px high.
- The board column width is `min(672px, 100dvh - 228px, 100vw - 600px)`. With a plain grid, the side columns took the free space first, and the board was 256 px wide at 1024 × 768.
- On a narrow screen, a tap on a ledge slot scrolls the dialog back to the top, so that the new piece's board shows.
- Under 360 px wide, the rule seals are 34 px and the name is 16 px, so that "Paladin" and "Maester" keep one line.
- The legend's `occupied()` puts the green move tile under the red edge for `both` and `moveshot` (the Beast's e5). The mockup draws the red edge only. The legend wins.
- The `guard` state shows without its refused strike on e5, as `hero`, `beast` and `ogre` do: refused marks come in ticket 04. The `beast` chain on e5 and f6 comes in ticket 05.
- The check has a sixth group, `yours`: two stored designs show under "Yours" with the quill tag, "from Knight", and the army-1 figure.
- `marks.ts` has no `assets` constant. The board image is the field's CSS background (`url('/ui/stone-board.webp')`, as `src/style.css` has it; Vite adds the base), and the figures come from `pieceArt` and `figureUrl`. The port of `tag` is `tagYours()`: this ticket draws only the "Yours" tag.

Evidence (S = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/pg01`):

- `npm test` through the shared lock: 113 test files passed and 1 skipped, 1,856 tests passed and 21 skipped, the node tests 50 of 50, `exit 0`. Log: `S/npm-test-1.log`.
- `npm run check:browser proving-ground`, three runs: each "ok proving-ground" (9.7 to 9.8 s), "proving-ground: all groups pass". Logs: `S/check-pg-1.log` to `S/check-pg-3.log` (the runner) and `S/pg-run-1.log` to `S/pg-run-3.log` (the check).
- `npm run check:browser workshop workshop-cast menu-extra home`: all 4 passed (65.0, 9.0, 12.2 and 22.3 s). Logs: `S/check-old.log` and `S/old-<name>.log`.
- `SAMPLE=W14 node docs/specs/web-ux/capture.mjs` on `npm run build` and a preview server: 16 renders, 0 with a fault. Renders: `S/w14/<state>-desktop.png` and `S/w14/<state>-phone.png`; log `S/w14-capture.log`.
- The build beside the mockup, at 1440 × 900 and 390 × 844, both served by a Vite dev server from the worktree: `S/build-<state>-<size>.png` beside `S/mock-<state>-<size>.png`, for `open`, `hero`, `archer`, `beast`, `maester`, `ogre`, `guard` and `phone-open`. The differences that stay are in the list above, or they are parts of later tickets (the Try board tag, Add a rule, the Try with tray, the plaque, the refused and chain marks, NEW, ⋯, and the Kings, Cards and Rules tabs).
- The check's own screens at the six sizes: `S/check/<piece>-<width>x<height>.png`.

### 2026-10-10: review of part 2

Reviews:

- Should-fix, `src/workshop/ground.ts:147`: a ledge slot opened with Enter or Space loses the keyboard focus, because `renderLedge` replaces each slot through `innerHTML`. **Confirmed.** A new part of the check's `keys` group focuses the Knight slot and presses Enter. Before the fix it failed: "the focus stays on the slot that Enter opens", with no slot in focus. **Fix:** the slot click handler gives the focus to the new open slot with `focus({ preventScroll: true })`. The option keeps the narrow layout on the board after `show()` scrolls to the top (the `layouts` group holds the board in view after each slot tap). The `keys` group now also holds Tab from the Knight slot to the Bishop slot, and Space on the Bishop slot, with the focus kept.

Evidence (R = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/pg01-review`):

- Before the fix: `npm run check:browser proving-ground` failed in `keys`. Logs: `R/check-red.log` and `R/pg-red.log`.
- After the fix: `npm run check:browser proving-ground`, three runs: each "ok proving-ground" (9.9 to 10.0 s), "proving-ground: all groups pass". Logs: `R/check-pg-1.log` to `R/check-pg-3.log` and `R/pg-run-1.log` to `R/pg-run-3.log`.
- `npm run check:browser workshop workshop-cast menu-extra home`: all 4 passed (65.8, 8.6, 12.3 and 7.8 s). Log: `R/check-old.log`.
- `npm test` through the shared lock: 113 test files passed and 1 skipped, 1,856 tests passed and 21 skipped, the node tests 50 of 50, `exit 0`. Log: `R/npm-test-1.log`.
