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

1. [x] **NEW** at the end of the Pieces row (a ghost figure): `fromPreset(BLANK)` (`model.ts:121`, `:128`), named by `autoName` (`names.ts:34`), alone on d4, in brush mode. It saves on the first change (ticket 02).
2. [x] **Look row:** the figures of `suggestedFigures(d)` (`figures.ts:255-265`) under the rule lines, then "More": a sheet with the 34 `FIGURES`, the `FIGURE_TAGS` filter and the army (Ivory, Charcoal). A choice sets `look.figure` or `look.army` through `change('look', …)`. A pool piece keeps its pool art until the player picks a figure (decision 18).
3. [x] **Rename:** a pen in the name band opens an inline field; `validName` (`model.ts:197`) checks it, and `saveName` (`names.ts:43`) adds " (yours)" to a pool or card name; the letter follows the name until the player sets it (`letterFollows`, `names.ts:47-48`; `letterOf`, `:45`); `named: true`.
4. [x] **Design menu (⋯):**
   - Copy as text: move the body of `asText` (`dialog.ts:737-742`) into `text.ts` as pure `designText(d, v, link)`, where `v` is the verdict (`asText` reads `v.worth.point` and `bandOf(v)`); `dialog.ts` calls it, so one copy stays. A calls it with `judge(d, false)`.
   - Make a copy: a new id, the name with the next free number ("My Pawn 2"), saved and opened.
   - Delete: asks first; `deleteDesign` (`store.ts:32`); the ledge drops it and the pool piece it came from opens (else the Pawn).
   - On an unchanged pool piece the menu holds only Copy as text and Make a copy (on the phone, Share and Weigh show only after the first edit, as ticket 02 says).
5. [x] **Tests:** `ui.test.ts`: `designText` gives the sentences, the MATRIX-style row and the link (the old `sharedLink` check words); the copy name rule ("My Pawn", "My Pawn 2").
6. [x] **Check groups:** `newPiece`, `rename` (a bad name is refused with its words), `look` (a figure and the army; reload keeps them), `designMenu` (copy as text, make a copy, delete with its question).
7. [x] **W14 states:** `new-piece`, `look-more`, `rename`, `design-menu`.

## Verification

- [x] `npm test` passes, with the `designText` and copy-name tests.
- [x] `npm run check:browser proving-ground` passes three times; `npm run check:browser workshop` still passes (its Copy as text goes through `designText` now).
- [x] W14 renders at 1440 × 900 and 390 × 844.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A long name in the name band at 320 px.

## Does not do

- No Surprise me (decision 15). No share card (08).

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/07-new-piece/`):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,885 tests pass (21 skipped), with the two new `ui.test.ts` cases ("the design menu (Proving Ground ticket 07)": `designText` and `copyName`). Log: `npm-test-3.log`, the run with this ticket text (`npm-test-2.log` is the run before the text, and `npm-test-1.log` the run before the last small fixes; both exit 0).
- `npm run check:browser proving-ground`: passes three times (48.6 s, 49.2 s, 48.6 s), with the new groups `newPiece`, `rename`, `look` and `designMenu`. Logs: `pg-1.log` to `pg-3.log`, and each run's `check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders: `check-1/new-piece-1440x900.png`, `look-more-1440x900.png`, `long-name-320x568.png` and `design-menu-390x844.png`.
- `npm run check:browser workshop`: passes (65.1 s); its Copy as text goes through `designText` now. Logs: `workshop-1.log`, `check-workshop.log`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/07-new-piece/w14` makes 74 renders with 0 faults (`w14-capture.log`), with the new states `new-piece`, `look-more`, `rename` and `design-menu`.
- Beside the mockup, at 1440 × 900 and 390 × 844 (the mockup on the left, the W14 render on the right): `side-new-piece-1440.png` and `side-new-piece-390.png` (the mockup's `open` and a click on NEW), `side-design-menu-1440.png` and `side-design-menu-390.png` (the mockup's `painted` and ⋯). The mockup has no state for Rename or for "More"; their W14 renders are `w14/rename-*.png` and `w14/look-more-*.png`. Other widths: `layout-1024x768.png`, `layout-1280x800.png`, and `check-1/long-name-320x568.png`.

Changes from the ticket, each with its reason:

1. On the phone, ⋯ also holds Rename and Look. The mockup hides the look row on the phone, and the phone's plinth is one 68 px row. Weigh sets the precedent: in the name band on the desktop, in ⋯ on the phone. The phone's ⋯ on My Pawn: Share, Weigh, Rename, Look, Copy as text, Make a copy, Delete.
2. The pen is at the end of the name's rule line, not after the name. After the name it pushed Weigh to a second line at 1440 × 900.
3. Copy as text and Make a copy show only for a piece that moves. An empty design has no share code. So the menu of a new piece before its first paint is empty, and ⋯ does not show.
4. The desktop has ⋯ too. The mockup's ⋯ on the desktop opens its list of states, not a design menu.
5. A pool piece now has its letter (`letterOf(name)`), so that its share code is valid for Copy as text.
6. The name of an unnamed design follows the design (`autoName` with `autoBody`) on each change, as the old Workshop does. The first change of a pool piece still names the copy "My <Name>". A typed name on a pool piece names the copy with that name.
7. Make a copy: a pool piece gives "My <Name>"; a design gives its name with the next free number ("My Pawn 2"); a link design keeps its name when the shelf does not have it. The letter follows the new name when it followed the old one.
8. Delete asks in a sheet ("Delete My Pawn 2?", "This cannot be undone.", Delete and Keep). After a delete the focus goes to ⋯. A refused delete says "Could not delete: this device refused." and keeps the design.
9. In the "More" sheet the army is above the figures, so that it does not scroll away. Each choice is a look step, and the sheet stays open.
10. NEW shows the first suggested figure (`suggestedFigures`) and the auto name, where the mockup shows the Templar and "New piece". The look row has the three suggested figures and More, where the mockup has eight fixed figures. The Try board plaque shows on NEW, as ticket 06 shows it on each item but the first open of a pool piece.
11. The risk of a long name at 320 px: under 360 px a name of more than nine letters takes the plinth row, and the seals go under it. Before, "Wandering Champion" broke inside its words and went over the top bar. The `rename` group tests this at 320 × 568.

Open problems:

- The owner has not seen the renders (the last Verification box).
- At 1024 × 768 and 1280 × 800, "My Knight" with its Yours tag puts Weigh on a second line. This ticket did not change that row; tickets 02 to 06 show the same.
- After an army change, the figures in the sheet are blank until their images load.


### Reviews

The first review (an independent reader, read only) gave three should-fix findings. Each is confirmed: it fails before the fix, and the failure shows in a log. The probes and the logs are in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/07-review/`. `probe/repro.mjs` shows findings 1 and 2 on the dev server (`logs/repro-before.log`, `logs/repro-after.log`); `probe/repro-tap.mjs` shows the fix of finding 1 with a tap on the phone, a Tab and a click on a piece (`logs/repro-tap.log`); `logs/copyname-before.log` shows finding 3.

1. **Should-fix, confirmed, fixed: a click after a rename was lost (`ground.ts`, `rename`).** The press on another control blurs the field before its click. The blur saved the name, and the redraw replaced the pressed control, so the browser sent no click to it. Type "Lancer", then click the Move brush: the name was kept, but the brush was not armed. A click on the Knight kept the design open (`repro-before.log`). Fix: while a mouse press (or the press of a tap) is in progress, the blur ends the field in the click of that press, in the capture phase, before the click acts. A blur from the keyboard ends the field at once, as before. Browser check: `rename` renames and clicks a brush once (the name is kept and the brush is armed), then renames and clicks the Knight (the name is kept and the Knight opens).
2. **Should-fix, confirmed, fixed: the focus went to the page body after a Look change (`ground.ts`, `sheet`).** A choice in the Look sheet redraws the plinth and the top bar, so the control that opened the sheet ("More" on the desktop, ⋯ on the phone) is gone. On Esc or × the browser cannot give the focus back to it. The focus went to the page body at 1440 × 900 and at 390 × 844 (`repro-before.log`). Fix: `sheet()` keeps the `data-act` of the control that opened it. When that control is gone at the close, the focus goes to its new copy. Browser check: `look` presses Esc and × after a change, on the desktop (the focus is on More) and on the phone (the focus is on ⋯).
3. **Should-fix, confirmed, fixed: Make a copy cut a free long name (`names.ts`, `copyName`).** `copyName` cut each name to 15 letters before it looked for the name on the shelf. A copy of a link design "Wandering Champion" on an empty shelf was "Wandering Champ" (`copyname-before.log`), but this ticket says that a free link name stays the same (change 7). Fix: a free name stays the same; only a number cuts the name, so that the name with its number has 18 letters or fewer. Test: `ui.test.ts` gives "Wandering Champion" on an empty shelf, and "Wandering Champi 2" when the shelf has the name.

Evidence after the fixes (in the same `07-review/` folder):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,885 tests pass (21 skipped). Log: `logs/npm-test-1.log`; `logs/npm-test-2.log` is the run after this text.
- `npm run check:browser proving-ground`: passes three times (49.0 s, 49.0 s, 49.1 s), with the new `rename` and `look` steps. Logs: `logs/check-1.log` to `logs/check-3.log`, and each run's `logs/check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders: `check-shots-check-1/` to `check-shots-check-3/`.
- `npm run check:browser workshop`: passes (64.8 s). Logs: `logs/check-workshop.log`, `logs/check-workshop.workshop.log`.
- The fixes do not change a render: they change the order of events, the focus and a copy name. So this review makes no new W14 renders.
