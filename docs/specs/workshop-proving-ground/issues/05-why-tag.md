# 05 · The Why tag

Status: ready-for-agent
Size: S
Blocked by: 02, 04

## Scope

- In look mode, a tap on a square opens the Why tag: the base mark plus the stamp of each rule equals the mark now, with a short caption under each part.
- Hover-only marks and effects (spec decision 37): the next takes of a chain, the Archer's sight lines and the Ogre's follow show while their square has hover, focus or the open tag.
- Mockup states `hero` (d7), `why-g7`, `beast`, `phone-hero`; functions `renderWhy` (`proving-ground.html:1330-1364`), `whySum` (`marks.js:909`).

## Plan

1. [ ] **`src/workshop/why.ts`: `whyWords(trace, sq, board)`**, pure: the header words (the occupant: "Black knight", "empty"; the square), the count of parts, the captions of each part (the block `label` and `whenWords`, `vocab.ts:137-150`), and a footnote for a shot ("On b6 it takes a pawn and stays."), the own piece ("It stands here.") and a swap.
2. [ ] **`src/workshop/marks.ts`:** port `whySum` (`marks.js:909`) and the count ring.
3. [ ] **`src/workshop/ground.ts`:**
   - Look mode: a tap on a square (or Enter on the focused square) opens the tag; a tap again, × or Esc closes it. In brush mode a tap still paints (ticket 02).
   - Desktop: the tag under the brushes in the right column (336 wide); its pointer follows the square's row. Phone: a bottom sheet from the brush row down (48 px tiles, 34 px stamps).
   - Hover-only marks: the scene's `on` field (`scenes.js:11`), set in `sceneOf`. A chain move (more than one capture, `chainFrom`, `moves.ts:85-100`) shows its next takes, the refused next take (ticket 04) and their order pips while its first square has hover, focus or the open tag (`proving-ground.html:1144`, `:2041`, `:2047-2054`).
   - Hover-only effects, from the same `movesOf` result: a `sight` line from the piece to each shot mark (the empty b6 too), shown on that square (the Archer, `scenes.js:181`); a `follow` arrow for a push with `then: 'follow'`, shown on the push's landing square (the Ogre, `:231-233`). Port the `sight` and `follow` drawing of `marks.js`.
4. [ ] **Tests:** `why.test.ts`: `whyWords` for the Paladin's d7 and g7 and for a Beast chain square; where `scenes.js` has a `why` field, the words agree with it.
5. [ ] **Check groups:** `whyTag` (d7 on the Paladin opens a tag with its parts; g7 says refused; Esc closes; Enter opens; the phone sheet stays inside the screen), `hoverOnly` (hover or focus on the Beast's e5 shows f6 and the barred g7; hover on the Archer's d6 shows its sight line; hover on the Ogre's d6 shows the follow; a tap on e5 keeps them under the tag).
   - `scene.test.ts`: the `on` marks and effects of the `beast`, `archer` and `ogre` scenes equal `sceneOf`'s (ticket 01 left them out).
6. [ ] **W14 states:** `why-d7`, `why-g7`, `beast-hover`, `phone-why`.

## Verification

- [ ] `npm test` passes, with the `whyWords` tests.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `hero` and `why-g7` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A long caption at 390 px; `textNotCut` must hold.

## Does not do

- No step boards (spec, "Later"). No Move here or Take back (06).
