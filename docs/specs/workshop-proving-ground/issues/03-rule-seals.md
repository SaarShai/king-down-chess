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

1. [x] **Pills.** Port `pill` from `marks.js` into `src/workshop/marks.ts`. A tap on a pill opens a row of its choices (`BLOCKS[…].pill.choices`, `vocab.ts:66-122`). Hover or focus on a choice previews it on the board; a tap or Enter commits it through `change('rule', …)`. A choice that `limit()` (`model.ts:154-161`) refuses shows its words. Arrows move; Esc closes only the row and puts the focus on the pill.
2. [x] **When chip.** `src/workshop/vocab.ts`: new pure `whenChoices(a): { top: When[]; more: When[] }`, moved out of `whenSheet` (`dialog.ts:619-622`, `:631`) with no change: the list is `EVENT_WHENS` for an event block, else `TOP_WHENS` then `MORE_WHENS` (`vocab.ts:179-188`), filtered by the block's own `whens(w)`, plus `always` for "moves like"; `top` is all of an event block's list, else the part in `TOP_WHENS`. `whenSheet` calls it, so there is one copy and no equality test. A tap on a chip (or a "When" button on an `always` rule) opens these choices, with "More choices", the body select for "Next to your …", the move numbers 5, 10, 15 and 20, and "Always (adds it to Moves)" for "moves like" through `likeAlways` (`model.ts:173-184`), disabled with the words of `dialog.ts:626` when `likeAlways` gives null. A block whose only When is `takes` (`chain`, `removedAfter`, `vocab.ts:84`, `:119`) gets no choices, so its chip does not open. `ui.test.ts`: `whenChoices` for `step2` (`always` and three zones), `becomes` (the two events), `chain` (none) and `movesLike` (with `always`).
3. [x] **Rules shelf** (desktop: over the right column, 336 × 672; phone: a bottom sheet, groups in 2 columns, 64 px buttons). The "+ Add a rule" row and the key S open it; × and Esc close it.
   - Seals in the 6 `GROUPS` with their `label`; a ✓ on a block the piece has; a dim seal when its `needs` are not met.
   - A tap on a seal opens the sentence card: the seal, the When chip, the sentence with the default pill, the need line ("Paint a line first.", "It takes nothing already." or "Already in this piece."), and Stamp. Hint: "Tap a seal. The board shows what it does."
   - The board previews the design with the new rule: `sceneOf` of both designs; the added marks show as the preview.
   - Stamp adds the rule through `change('rule', …)`. On a pool piece this makes the copy (ticket 02).
4. [x] **3 of 3.** Under 3 rules: the Add row, and dotted empty rows up to 3 after the first add (`:1048-1050`). At 3: no Add row; S or another try shakes the lines (no motion until ticket 10) and shows "3 of 3 rules. Remove one to add another." (`limit` words).
5. [x] **Remove.** Desktop: a × on the focused or hovered line ("Remove <label>"). Phone: a tap on a focused seal in the plinth strip opens the sentence card with Remove. Undo gives the rule back.
6. [x] **Asleep seal.** While `holds()` (`moves.ts:27-42`) is false for a rule's When here, its seal is dim and its chip hollow.
7. [x] **Check groups:** `pill` (choose, preview, Esc), `whenChip` (open, change, body select, "Always" for "moves like"), `shelf` (need lines, ✓, preview, Stamp), `threeOfThree`, `removeRule` (× and Undo; the phone Remove), keys.
8. [x] **W14 states:** `stamp-preview`, `stamped`, `pill-open`, `when-open`, `three-of-three`, `phone-sentence`.

## Verification

- [x] `npm test` passes, with the `whenChoices` test.
- [x] `npm run check:browser proving-ground` passes three times; `workshop` still passes (its When sheet now calls `whenChoices`).
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `stamp-preview` and `stamped` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The preview of an event rule (chain, removed after, becomes) changes no square on its own; the sentence card must say what it does.

## Does not do

- No rule badges or worth change per rule (decision 14). No stamps on marks or knots (04). No motion (10).

## Comments

### 2026-10-10: built (branch `claude/proving-ground`)

- Step 1: `pill` in `src/workshop/marks.ts`. The rows of choices, the preview and the keys are in `src/workshop/ground.ts`; the styles are in `src/workshop/ground.css`.
- Step 2: `whenChoices` in `src/workshop/vocab.ts`. The old Workshop's `whenSheet` (`src/workshop/dialog.ts`) calls it. The When words ("Always (adds it to Moves)", the clash words, the toast words) moved from `dialog.ts` to `src/workshop/text.ts` (`whenLabel`, `LIKE_CLASH`, `LIKE_ADDED`), so the two views share one copy. Tests in `src/workshop/ui.test.ts`.
- Steps 3 to 6: `src/workshop/ground.ts` and `src/workshop/ground.css`. `FULL` (the 3 of 3 words) in `src/workshop/model.ts`; `limit()` uses it. The preview flag `pv` in `src/workshop/scene.ts`; `drawString` puts `data-pv` on each part that a preview adds.
- Decision 38 (by delegation; the approved mockup wins): the spec has it. `lineParts` in `text.ts` gives each rule its short line with its pill, from one table beside the long sentences. The Proving Ground's lines use it; `ruleText` stays for the old Workshop and names the phone's plinth seals for screen readers. A test in `ui.test.ts` holds the Pawn's and the Paladin's lines.
- Step 7: the groups `shelf`, `threeOfThree`, `pill`, `whenChip` and `removeRule` in `tools/verify-proving-ground.mjs`, and S in the `keys` group. No old assertion changed.
- Step 8: the states `stamp-preview`, `stamped`, `pill-open`, `when-open`, `three-of-three` and `phone-sentence` in `docs/specs/web-redesign/samples/W14.mjs`.

Changes from the ticket, with the reasons:

- Ticket 01 kept the long vocabulary sentence on each line and said that no later ticket changes it. Decision 38 changes it: each line has the mockup's short line with its pill, and the When chip holds the When words only. "a piece, not a pawn" is a pill after the chip.
- The desktop × and the "When" button of an "always" rule are on a small bar on the line's top edge. The bar shows while the line has the pointer or the focus, and it takes no clicks while it does not show. A bar in the middle of the line covered the end of long lines ("cannot be taken by anything but a king"), and a bar in the flow put four preset lines on two rows. On a touch screen the bar is in the flow and always shows (decision 11).
- On the phone, the first tap on a seal in the plinth strip opens the rule's card. "A tap on a focused seal" needs the focus mode of ticket 04.
- The card on the phone has the seal and its name with × beside it, the line, the example, then "When" (an "always" rule) and Remove. The × is beside the name, as in the mockup's `phone-sentence` state.
- A pill or a chip is in a 44 px button (decision 9). The button stands 11 px out of the row, so the line keeps the mockup's height. A choice is a 32 px pill in a 44 px button.
- A choice that `limit()` refuses is faint (`aria-disabled`), its words show under the row, and a tap or Enter on it shows the words in a toast.
- In a pill choice, the words after a colon do not show: "a piece you choose", not "a piece you choose: queen, rook, bishop or knight". The long sentence on the shelf's card keeps them out too; the old Workshop keeps them.
- "More choices" shows the rest of the When choices in the order of the old When sheet: the plain ones, "Next to your" with a piece list (its first item is "piece", which a player cannot choose), then the move numbers.
- The preview parts have `data-pv` and no style of their own. The mockup pulses them; motion is ticket 10.
- The shelf's sentence card shows the block's example when the preview adds no part to the board (the ticket's risk: "becomes", "takes again", "removed too").
- The shelf's groups use a grid of columns 148 px or wider, so they fit at each desktop width; at 336 px they are the mockup's two columns.
- After Stamp, the focus goes to the new line's chip or pill (on the phone, to its seal). After Remove, it goes to the Add row (on the phone, to +).
- The desktop lines show on the wide layout only, and the plinth strip of seals on the narrow layout only.

Evidence (S = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/03-seals`):

- `npm test` through the shared lock: 113 test files passed and 1 skipped, 1,863 tests passed and 21 skipped (4 new: the 3 `whenChoices` tests and the short lines), the node tests 50 of 50, `exit 0`. Log: `S/npm-test-1.log`. A second run after this text: `S/npm-test-2.log`.
- `npm run check:browser proving-ground workshop workshop-cast`: all 3 passed (26.0, 65.2 and 8.6 s). Logs: `S/check-1.log` (the runner), `S/pg-run-1.log`, `S/old-workshop.log` and `S/old-workshop-cast.log`. The old Workshop's When sheet calls `whenChoices` now, and its check passes.
- `npm run check:browser proving-ground`, two more runs: each "ok proving-ground" (26.1 and 26.4 s), "proving-ground: all groups pass". Logs: `S/check-2.log`, `S/check-3.log`, `S/pg-run-2.log` and `S/pg-run-3.log`.
- The check's own screens: `S/check/` (`stamp-preview-1440x900.png`, `stamped-1440x900.png`, `stamp-preview-390x844.png`, `three-of-three-1440x900.png`, `pill-open-1440x900.png`, `when-open-1440x900.png`, `phone-sentence-390x844.png` and the layouts).
- `SAMPLE=W14 node docs/specs/web-ux/capture.mjs` on a Vite dev server of this worktree (port 5183): 36 renders, 0 with a fault. Renders: `S/w14/<state>-desktop.png` and `S/w14/<state>-phone.png`; log `S/w14.log`.
- The build beside the mockup, both from the same server, with reduced motion: `S/build-<state>-<size>.png` beside `S/mock-<state>-<size>.png` for `stamp-preview` and `stamped` at 1440 and 390; `S/build-pill-open-1440.png` beside `S/mock-pill-open-1440.png` (the mockup's `hero` with its pill open); `S/build-phone-sentence-390.png` beside `S/mock-phone-sentence-390.png`; the Paladin (`S/w14/paladin-desktop.png`) beside `S/mock-hero-1440.png`. The builds of `when-open` and `three-of-three` have no mockup state. The shelf, the sentence card, Stamp, the lines, the Add row and the phone sheet agree with the mockup. The differences that stay are in the list above, or they are parts of later tickets: the knots on the last rank and the rule stamps on the marks (04), the bracket of a chain of rules beside the lines, the "Try board" tag and the Try with tray (06), the Becomes key tile, NEW and the Kings, Cards and Rules tabs (07, 12 to 14), the pulse of a preview and the shake at 3 of 3 (10), and the lock next to the name on the phone.
