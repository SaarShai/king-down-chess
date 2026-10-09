# 05 · Menu and Extra: one sheet, Board help, Feel, and Resign in place

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02c

## Scope

- Owner choices: Menu and Extra C (the index part; Tricks come in ticket 19), Board help beside Guide (our pick), Warm joy with no dial (Sound and Motion). Decision D6 (option 2: the designer tools stay visible).
- This step comes before the table (03), in today's layout. One Menu button takes the place of the four buttons New game, Guide, Workshop and Settings in the panel. Ticket 03 then only moves the Menu button into the bar.
- Demo: `feat-menu-extra` (`PAGES` 227–271, the index 274–296, the Coming group 303–305, the live previews 333 and on, navigation 359–410).
- Files: `index.html` (the Settings dialog goes; the four nav buttons, `#resign`, `#share`, `#account`, `#setup` and `#copy` move); new `src/ui/menu.ts`; `src/main.ts` (settings handlers, Resign, the Workshop and Guide openers); `tools/app-ui.mjs` (the helper bodies: `openMenu`, `menuItem`, `openExtra`, `setPace`); new `tools/verify-menu-extra.mjs`; `docs/specs/web-redesign/samples/W2.mjs`.

## Plan

The fast plan, §2, sets this build scope.

1. [x] Build New game, Guide, Board help, Feel, Extra and Resign rows. Feel holds Sound and Motion. Move Resign off the game bar.
2. [x] Use one native dialog with pages, Back, Esc, Close, outside close and focus return. Game keys stay off under the Menu.
3. [x] Close Menu before Guide, Workshop, New game or the account delete question opens.
4. [x] Move the four Board help switches as they are. Each saves and changes the board. Cut live previews.
5. [x] Build Extra: Today's army, Workshop, This game, Account, Look and Reset view. Keep Card mode as a static Coming row.
6. [x] Rename Animations to Motion. Keep `#pace` and its values.
7. [x] Cut Vibration and the haptic module under the fast plan.
8. [x] Remove Settings and the four old nav buttons. Keep the army code node and the account node.
9. [x] Update the Menu helper bodies for the moved controls.

## Verification

- [x] Check all rows, Back, Esc, Close, outside close, focus return and dialog hand-over. Check saved Sound on and off, saved Motion Fast and Off, and the board pace.
- [x] Check Board help, Look, Reset view and the in-sheet Resign question.
- [x] Run `account` through Extra. Run `npm test` and the named browser checks. Run the new `menu-extra` check twice after the merge.
- [x] Render Menu, Board help, Extra and Resign in W2 at all three sizes. Inspect each contact sheet.
- [ ] The owner's yes on the sample waits.

## Risks

- Account finds its nodes by id once. Keep each node when the page changes.

## Does not do

- No Tricks (19), no new New game sheet (06), no `?lab=1` switch (D6), no new layout (03).

## Comments


W2 builds this ticket with 03 under the fast plan, §2.
The native sheet keeps its pages and setting nodes. Resign asks in the sheet.
Feel checks prove that Sound and Motion save each change.
Cut: live previews, Vibration and the haptic module.
`npm test`: 1499 tests and 50 scene tests pass. All 19 named checks pass.
`menu-extra` passes twice after the merge. The supplied M1 script uses its local fallback.
W2 has 45 clean renders. All three size sheets and the phone pair are inspected.

Batch 2: decided by delegation (2026-10-09).
Menu and Moves keep their headers in view. One body scrolls to every row.
Close uses a framed 44 px button. Back names the parent sheet.
Coming names power coins by the king. Motion Off hides the pace note.
All eight required browser checks pass. `npm test`: 1514 tests and 50 scene tests pass.
W2 has 68 inspected renders and no faults. Landscape includes every Menu sheet.

## Batch 3 sheet fixes

Decision: decided by delegation (2026-10-09).
Menu keeps one height across its pages. Close stays in place.
Phone Menu rests at the bottom. Board help stays on one heading line.
The Resign question uses the heading size and ink colour.
Tests: 1,666 pass; 13 skip. All 50 scene tests pass.
Samples: 128 renders across W2, W4, W9, W11 and W12; zero faults. All are inspected.
All nine required browser checks pass. Typecheck and the doc checks pass.
