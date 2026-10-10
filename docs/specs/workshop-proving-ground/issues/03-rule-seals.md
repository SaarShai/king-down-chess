# 03 · Rule seals: change, add and remove

Status: ready-for-agent
Size: M
Blocked by: 02

## Scope

- The pills of a rule line open their choices, with a preview on the board.
- The When chip opens the When choices (decision 10).
- The Rules shelf adds a rule: seals in 6 groups, a sentence card, the preview, Stamp. At most 3 rules.
- Remove a rule: × on the desktop line, Remove in the phone sentence card (decision 11).
- A seal is dim and its chip hollow while its When does not hold here.
- Mockup states `stamp-preview`, `stamped`, `hero` (3 rules); functions `sealLineHTML` (`proving-ground.html:979-1005`), `choosePill` (`:1854`), `previewPill` (`:1866`), `stamp` (`:1828`), `showPhoneSentence` (`:2099`).

## Plan

1. [ ] **Pills.** Port `pill` from `marks.js` into `src/workshop/marks.ts`. A tap on a pill opens a row of its choices (`BLOCKS[…].pill.choices`, `vocab.ts:66-122`). Hover or focus on a choice previews it on the board; a tap or Enter commits it through `change('rule', …)`. A choice that `limit()` (`model.ts:154-161`) refuses shows its words. Arrows move; Esc closes only the row and puts the focus on the pill.
2. [ ] **When chip.** `src/workshop/vocab.ts`: new pure `whenChoices(a): { top: When[]; more: When[] }`, moved out of `whenSheet` (`dialog.ts:619-622`, `:631`) with no change: the list is `EVENT_WHENS` for an event block, else `TOP_WHENS` then `MORE_WHENS` (`vocab.ts:179-188`), filtered by the block's own `whens(w)`, plus `always` for "moves like"; `top` is all of an event block's list, else the part in `TOP_WHENS`. `whenSheet` calls it, so there is one copy and no equality test. A tap on a chip (or a "When" button on an `always` rule) opens these choices, with "More choices", the body select for "Next to your …", the move numbers 5, 10, 15 and 20, and "Always (adds it to Moves)" for "moves like" through `likeAlways` (`model.ts:173-184`), disabled with the words of `dialog.ts:626` when `likeAlways` gives null. A block whose only When is `takes` (`chain`, `removedAfter`, `vocab.ts:84`, `:119`) gets no choices, so its chip does not open. `ui.test.ts`: `whenChoices` for `step2` (`always` and three zones), `becomes` (the two events), `chain` (none) and `movesLike` (with `always`).
3. [ ] **Rules shelf** (desktop: over the right column, 336 × 672; phone: a bottom sheet, groups in 2 columns, 64 px buttons). The "+ Add a rule" row and the key S open it; × and Esc close it.
   - Seals in the 6 `GROUPS` with their `label`; a ✓ on a block the piece has; a dim seal when its `needs` are not met.
   - A tap on a seal opens the sentence card: the seal, the When chip, the sentence with the default pill, the need line ("Paint a line first.", "It takes nothing already." or "Already in this piece."), and Stamp. Hint: "Tap a seal. The board shows what it does."
   - The board previews the design with the new rule: `sceneOf` of both designs; the added marks show as the preview.
   - Stamp adds the rule through `change('rule', …)`. On a pool piece this makes the copy (ticket 02).
4. [ ] **3 of 3.** Under 3 rules: the Add row, and dotted empty rows up to 3 after the first add (`:1048-1050`). At 3: no Add row; S or another try shakes the lines (no motion until ticket 10) and shows "3 of 3 rules. Remove one to add another." (`limit` words).
5. [ ] **Remove.** Desktop: a × on the focused or hovered line ("Remove <label>"). Phone: a tap on a focused seal in the plinth strip opens the sentence card with Remove. Undo gives the rule back.
6. [ ] **Asleep seal.** While `holds()` (`moves.ts:27-42`) is false for a rule's When here, its seal is dim and its chip hollow.
7. [ ] **Check groups:** `pill` (choose, preview, Esc), `whenChip` (open, change, body select, "Always" for "moves like"), `shelf` (need lines, ✓, preview, Stamp), `threeOfThree`, `removeRule` (× and Undo; the phone Remove), keys.
8. [ ] **W14 states:** `stamp-preview`, `stamped`, `pill-open`, `when-open`, `three-of-three`, `phone-sentence`.

## Verification

- [ ] `npm test` passes, with the `whenChoices` test.
- [ ] `npm run check:browser proving-ground` passes three times; `workshop` still passes (its When sheet now calls `whenChoices`).
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `stamp-preview` and `stamped` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The preview of an event rule (chain, removed after, becomes) changes no square on its own; the sentence card must say what it does.

## Does not do

- No rule badges or worth change per rule (decision 14). No stamps on marks or knots (04). No motion (10).
