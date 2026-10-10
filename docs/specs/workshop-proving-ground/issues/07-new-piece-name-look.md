# 07 · New piece, name, look and the design menu

Status: ready-for-agent
Size: S
Blocked by: 02

## Scope

- NEW on the ledge makes a blank piece.
- The look row under the rule lines, and "More" with the 34 figures, the tag filter and the army (decision 17).
- A pen renames the design.
- The ⋯ design menu in the top bar (`proving-ground.html:964`): Copy as text, Make a copy, Delete (decision 16). On the phone it also holds Share and Weigh, as the mockup's ⋯ does (`:968`; tickets 02 and 08 make them). No Words switch (decision 22).
- Mockup: the NEW tile and `LOOKS` (`proving-ground.html:733`).

## Plan

1. [ ] **NEW** at the end of the Pieces row (a ghost figure): `fromPreset(BLANK)` (`model.ts:121`, `:128`), named by `autoName` (`names.ts:34`), alone on d4, in brush mode. It saves on the first change (ticket 02).
2. [ ] **Look row:** the figures of `suggestedFigures(d)` (`figures.ts:255-265`) under the rule lines, then "More": a sheet with the 34 `FIGURES`, the `FIGURE_TAGS` filter and the army (Ivory, Charcoal). A choice sets `look.figure` or `look.army` through `change('look', …)`. A pool piece keeps its pool art until the player picks a figure (decision 18).
3. [ ] **Rename:** a pen in the name band opens an inline field; `validName` (`model.ts:197`) checks it, and `saveName` (`names.ts:43`) adds " (yours)" to a pool or card name; the letter follows the name until the player sets it (`letterFollows`, `names.ts:47-48`; `letterOf`, `:45`); `named: true`.
4. [ ] **Design menu (⋯):**
   - Copy as text: move the body of `asText` (`dialog.ts:737-742`) into `text.ts` as pure `designText(d, v, link)`, where `v` is the verdict (`asText` reads `v.worth.point` and `bandOf(v)`); `dialog.ts` calls it, so one copy stays. A calls it with `judge(d, false)`.
   - Make a copy: a new id, the name with the next free number ("My Pawn 2"), saved and opened.
   - Delete: asks first; `deleteDesign` (`store.ts:32`); the ledge drops it and the pool piece it came from opens (else the Pawn).
   - On an unchanged pool piece the menu holds only Copy as text and Make a copy (on the phone, Share and Weigh show only after the first edit, as ticket 02 says).
5. [ ] **Tests:** `ui.test.ts`: `designText` gives the sentences, the MATRIX-style row and the link (the old `sharedLink` check words); the copy name rule ("My Pawn", "My Pawn 2").
6. [ ] **Check groups:** `newPiece`, `rename` (a bad name is refused with its words), `look` (a figure and the army; reload keeps them), `designMenu` (copy as text, make a copy, delete with its question).
7. [ ] **W14 states:** `new-piece`, `look-more`, `rename`, `design-menu`.

## Verification

- [ ] `npm test` passes, with the `designText` and copy-name tests.
- [ ] `npm run check:browser proving-ground` passes three times; `npm run check:browser workshop` still passes (its Copy as text goes through `designText` now).
- [ ] W14 renders at 1440 × 900 and 390 × 844.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A long name in the name band at 320 px.

## Does not do

- No Surprise me (decision 15). No share card (08).
