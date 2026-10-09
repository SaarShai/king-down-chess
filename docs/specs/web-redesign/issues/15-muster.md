# 15 · The muster and first sight

Status: wontfix (cut by the fast plan, fast-plan.md §2; the owner can bring it back)
Blocked by: 04, 06

## Scope

- Owner choice: Starting a game A, "one sheet, then the muster": on Start the new army flips in, file by file. The path step "The muster and first sight" stays, and the deck shows "First sight: tap to read" under this choice. So this ticket also builds the first-sight tags.
- Demo: `feat-muster` option A (flip in; the states `first-sight`, `read`, `folded`); `feat-new-game/app.js` 255–297.
- Files: a pure `musterPlan` timing module beside `scene.mjs` and its test (spec rule 8); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (a muster play); `src/render/PaintedView.ts` (an optional `muster`); a pure `src/first-sight.ts` (which types get a tag or a dot) and its test; `src/main.ts` (`newGame`, the tags; call lines only); `src/style.css`; a probe in `tools/verify-new-game.mjs`.

## Plan

1. [ ] On Start of a new game (not Rematch, not Continue, not an opened link), the back-rank figures flip in file by file, each with its twin on the other side: 62 ms apart, 260 ms each, about 700 ms in all.
2. [ ] Then the context line says "Same army for both sides."
3. [ ] Fast: one flip of 240 ms. Motion Off and reduced motion: no flip. A tap or a key skips to the end. A tap on a piece also selects it.
4. [ ] When the computer plays White, it starts after the muster.
5. [ ] First sight: after the muster, one quiet tag for each King Down piece type on the board that the player has not met on this device. A tag is a button: a tap reads that piece (ticket 04). After the first move the tags fold into dots, one for each type. A dot follows its figure, and clears when the player reads that type (either side) or moves a piece of it. The device remembers the met types (in `try`/`catch`) and shows tags in the first three games only. Rematch keeps the dots and shows no muster. Neutral words: the tag names the piece; nothing says "new" or "unlocked".
6. [ ] The Clay look shows the board at once, with no tags.

## Verification

- [ ] Node test of `musterPlan`: it ends on the start position; a skip ends it at once.
- [ ] `src/first-sight.test.ts`: tags only for types not met; one dot for each type; a read or a move clears the type; no tags after three games.
- [ ] Probe: after Start the board shows the start position, the line says "Same army for both sides.", and no animation runs after the end; Motion Off plays none; a tag tap reads the piece; the tags fold after the first move; a read clears the dot.
- [ ] `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample: one phone video at Normal and one at Fast; stills of the tags and the dots at 390×844 and 1440×900. The owner's yes, with the date, in Comments.

## Risks

- `scene.mjs` is shared with the plugin page; the muster is opt-in.
- Tags must not cover a square the player wants to tap: they sit at the figure's feet, and a tap on the square still selects.

## Does not do

- No change to the draw, no crowns.

## Comments
