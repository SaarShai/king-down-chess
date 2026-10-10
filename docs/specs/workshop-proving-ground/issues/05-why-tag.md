# 05 · The Why tag

Status: ready-for-agent
Size: S
Blocked by: 02, 04

## Scope

- In look mode, a tap on a square opens the Why tag: the base mark plus the stamp of each rule equals the mark now, with a short caption under each part.
- Hover-only marks and effects (spec decision 37): the next takes of a chain, the Archer's sight lines and the Ogre's follow show while their square has hover, focus or the open tag.
- Mockup states `hero` (d7), `why-g7`, `beast`, `phone-hero`; functions `renderWhy` (`proving-ground.html:1330-1364`), `whySum` (`marks.js:909`).

## Plan

1. [x] **`src/workshop/why.ts`: `whyWords(trace, sq, board)`**, pure: the header words (the occupant: "Black knight", "empty"; the square), the count of parts, the captions of each part (the block `label` and `whenWords`, `vocab.ts:137-150`), and a footnote for a shot ("On b6 it takes a pawn and stays."), the own piece ("It stands here.") and a swap.
2. [x] **`src/workshop/marks.ts`:** port `whySum` (`marks.js:909`) and the count ring.
3. [x] **`src/workshop/ground.ts`:**
   - Look mode: a tap on a square (or Enter on the focused square) opens the tag; a tap again, × or Esc closes it. In brush mode a tap still paints (ticket 02).
   - Desktop: the tag under the brushes in the right column (336 wide); its pointer follows the square's row. Phone: a bottom sheet from the brush row down (48 px tiles, 34 px stamps).
   - Hover-only marks: the scene's `on` field (`scenes.js:11`), set in `sceneOf`. A chain move (more than one capture, `chainFrom`, `moves.ts:85-100`) shows its next takes, the refused next take (ticket 04) and their order pips while its first square has hover, focus or the open tag (`proving-ground.html:1144`, `:2041`, `:2047-2054`).
   - Hover-only effects, from the same `movesOf` result: a `sight` line from the piece to each shot mark (the empty b6 too), shown on that square (the Archer, `scenes.js:181`); a `follow` arrow for a push with `then: 'follow'`, shown on the push's landing square (the Ogre, `:231-233`). Port the `sight` and `follow` drawing of `marks.js`.
4. [x] **Tests:** `why.test.ts`: `whyWords` for the Paladin's d7 and g7 and for a Beast chain square; where `scenes.js` has a `why` field, the words agree with it.
5. [x] **Check groups:** `whyTag` (d7 on the Paladin opens a tag with its parts; g7 says refused; Esc closes; Enter opens; the phone sheet stays inside the screen), `hoverOnly` (hover or focus on the Beast's e5 shows f6 and the barred g7; hover on the Archer's d6 shows its sight line; hover on the Ogre's d6 shows the follow; a tap on e5 keeps them under the tag).
   - `scene.test.ts`: the `on` marks and effects of the `beast`, `archer` and `ogre` scenes equal `sceneOf`'s (ticket 01 left them out).
6. [x] **W14 states:** `why-d7`, `why-g7`, `beast-hover`, `phone-why`.

## Verification

- [x] `npm test` passes, with the `whyWords` tests.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `hero` and `why-g7` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A long caption at 390 px; `textNotCut` must hold.

## Does not do

- No step boards (spec, "Later"). No Move here or Take back (06).

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/05-why-tag/`):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,877 tests pass (21 skipped). Log: `logs/npm-test-2.log`. The first run (`logs/npm-test-1.log`) had 4 failures in the new tests; the fixes are changes 12 and 13 below.
- `npm run check:browser proving-ground`: passes three times, with the new groups `whyTag` and `hoverOnly`. Logs: `logs/final-check-1.log` to `logs/final-check-3.log`, and each run's `final-check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders of the tag: `check-shots/why-d7-1440.png`, `why-d7-390x844.png`, `why-d7-320x568.png`, `beast-hover-1440.png`, `beast-why-390x844.png`, `ogre-follow-1440.png`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/05-why-tag/w14 desktop,phone` makes 54 renders with 0 faults (`logs/w14.log`).
- Beside the mockup, at 1440 × 900 and 390 × 844 (the mockup on the left, the W14 render on the right): `side-hero-1440.png`, `side-hero-390.png`, `side-why-g7-1440.png`, `side-why-g7-390.png`, `side-beast-1440.png`, `side-beast-390.png` (the mockup's `beast` beside W14 `beast-hover`), `side-phone-hero-390.png`. The single renders: `mock-<state>-<width>.png`, `build-<state>-<width>.png` and `w14/<state>-<size>.png`.

Changes from the ticket, each with its reason:

1. The function is `whyWords(d, sc, trace, q)`, not `whyWords(trace, sq, board)`. The words need the scene (the mark now, its stamps, the hover-only marks, the pieces) and the design's rules (the captions). `ground.ts` runs `traceOf` when the tag opens.
2. A rule's caption is the seal label, with the pill's words in place of "…", and then the When of a state rule (ticket, plan item 1). So the captions are "lines pass" and "can't take a king", where the mockup has "passes own pieces" and "cannot take a king". The caption of the painted square is the legend's word ("line", "move or take", "not painted"), where the mockup has "step". The caption of the mark now is "takes, then leaves" with "removed too", "then f6" on the first take of a chain, "asleep here" or "awake here", else the legend's word. The test compares the number of captions and the last caption with `scenes.js`.
3. The notes: "It takes a pawn and stays." and "On b6 it takes a pawn and stays." (a shot, or a design with "removed too"); on the first take of a chain, "Then it may take f6. Never the king on g7."; on a next take, "It takes e5 first."; a swap or a push names the piece and its square. A square with no mark says "It stands here.", "Its own piece." or "Out of reach.".
4. The mark now has no take badge in the sum, as in the mockup's `whySum`. The header icon is the game's piece icon in its army's colours (`src/piece-icons.ts`); the mockup inverts the rulebook icon with a CSS filter.
5. The desktop also shows the mockup's rim notch at the row of the square (`#notch`, `proving-ground.html:176-177`, `:1217-1223`). It is in the mockup's `hero` state; the ticket does not name it.
6. The phone's sheet is fixed to the bottom of the screen, 358 px high, as the rule card, and it does not slide. On a short screen it takes half of the screen, so the top of the board stays in view (the mockup puts it from the brush row down, in the page). Under 360 px a sum of three rules wraps to a second row (the risk "a long caption at 390 px"). The covered brushes and ledge leave the Tab order.
7. A tap on a square also closes an open row, the shelf, the card and the kept rule or knot (`proving-ground.html:1663`). A tap on a seal or a knot, a brush, the shelf, a row, a card and another piece close the tag.
8. Only a keyboard focus (`:focus-visible`) on a square shows its hover-only parts, as for a rule (ticket 04, change 10). While the tag is open, the pointer and the focus do not change the board.
9. The scene's `pip` has `sq` and `n`, as in `scenes.js`; `drawString` writes it as `data-at` and `data-n`, so `[data-sq]` stays on the marks only. A `hop` is an ink arc, a `sight` line a flat gold arc, and a `follow` a thin push arrow.
10. A next take of a chain gets the stamp of "takes again" (its trace), as each mark with a `by` does (ticket 04, change 4). The hand Beast scene has no stamp on f6. The phone shows the stamps of a kept rule only, so its tag on e5 shows no stamp on the board.
11. The key row lists only a push and a swap of the effects. A square's label leaves out its hover-only marks.
12. `scene.test.ts` compares the hover-only marks and effects of the `beast`, `archer` and `ogre` scenes only: the hand scene `archer-alone` has no sight lines. It compares only the effects that the builder draws; the `threat` and `becomes` effects are those of later tickets.
13. The open piece's own name is its occupant ("Beast"); a design with no name says "This piece".
14. W14: `hero` now opens the tag on d7, as the mockup's `hero`. `phone-why` shows the Pawn's d6, the longest caption ("steps 2, on its start rank"), at both sizes. `beast-hover` taps e5 on the phone, which has no hover.

Open problems:

- The owner has not seen the renders (the last Verification box).
- No step boards (spec, "Later") and no Move here or Take back (ticket 06), so the tag is shorter than the mockup's.
- The mockup's lock icon and ⋯ in the phone's name row, and the Try tray, are not in this ticket.

