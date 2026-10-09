# 05 · Menu and Extra: one sheet, Board help, Feel, and Resign in place

Status: built (the separate W2 review and sample review wait)
Blocked by: 02c

## Scope

- Owner choices: Menu and Extra C (the index part; Tricks come in ticket 19), Board help beside Guide (our pick), Warm joy with no dial (Sound, Vibration and Motion). Decision D6 (option 2: the designer tools stay visible).
- This step comes before the table (03), in today's layout. One Menu button takes the place of the four buttons New game, Guide, Workshop and Settings in the panel. Ticket 03 then only moves the Menu button into the bar.
- Demo: `feat-menu-extra` (`PAGES` 227–271, the index 274–296, the Coming group 303–305, the live previews 333 and on, navigation 359–410).
- Files: `index.html` (the Settings dialog goes; the four nav buttons, `#resign`, `#share`, `#account`, `#setup` and `#copy` move); new `src/ui/menu.ts`; `src/main.ts` (settings handlers, Resign, the Workshop and Guide openers); new `src/haptic.ts`; `src/account/sync.ts` and test; `tools/app-ui.mjs` (the helper bodies: `openMenu`, `menuItem`, `openExtra`, `setPace`); new `tools/verify-menu-extra.mjs`; `docs/specs/web-redesign/samples/05.mjs`.

## Plan

1. [ ] Menu rows: New game › (a page with "Play again" and "Change setup"; the lead line "A new game ends this game."); Guide ("Pieces, powers and lessons."); Board help ›; Feel (Sound, Vibration, Motion: Normal · Fast · Off); Extra ›; a gap; Resign › (the page "Lay your king down?", one line on who wins, Resign and Keep playing; off when no side can resign). "Send the game link" is a Menu row in a two-player game. Resign leaves the action row: Undo · End turn.
2. [ ] One `<dialog>` holds the pages. ‹ goes back one page. Esc goes back one page, and closes on the first page. × and a tap outside close it. Game keys stay off while it is open. The focus goes back to the Menu button.
3. [ ] No dialog over the Menu: Guide, the Workshop, New game and the account's `#delete-account` close the Menu first, then open. The focus goes back to the Menu button when they close.
4. [ ] Board help: Show threats, Coordinates, Piece letters, Always promote to a queen. Each switch acts at once and saves, as today. Each switch has a small live preview: a window on the real board, cropped to three squares, as in the demo.
5. [ ] Extra index. Play and make: Today's army (opens New game with Today's army), Workshop (the fox figure, "Make your own piece."). Board and game: This game (the army code `#setup`, Copy moves `#copy`), Account (the `#account` section moves as one node), Look (Painted, Clay) and Reset view (D6, option 2: no lab switch). Coming: Card mode ("A hand of power cards."), a static row with no action.
6. [ ] Motion: the label "Animations" becomes "Motion". The id `#pace`, the values and `data-pace` do not change.
7. [ ] Vibration: a new setting `vibration`, written only when off, in `SETTINGS`. `src/haptic.ts` calls `navigator.vibrate` in `try`/`catch`, with short pulses only. The row hides where the device has no vibration. This ticket pulses on a capture; tickets 07 and 09 add check and refusal.
8. [ ] Remove the Settings dialog and the four nav buttons. Keep `#setup` in the page (the `qa` check waits for it).
9. [ ] Change the helper bodies in `tools/app-ui.mjs`; the checks do not change.

## Verification

- [ ] `src/account/sync.test.ts`: `vibration` travels with the settings; an old save reads as on.
- [ ] New check `menu-extra`: the rows; ‹, Esc and × at each page; the focus goes back; Guide, the Workshop, New game and the delete question open with the Menu closed; Sound, Vibration and Motion change the save; Board help switches change the board and the preview at once; Look and Reset view work with no lab switch; Resign asks in the sheet, with no `window.confirm`; a stubbed `navigator.vibrate` counts one pulse on a capture, and the row hides with no API.
- [ ] `account` signs in and out through Extra › Account.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: the Menu, Board help with its previews, Extra, This game, Account, the Resign page. The owner's yes, with the date, in Comments.

## Risks

- `account.ts` finds its nodes by id once; rebuild no page with `innerHTML`.
- iOS has no vibration; Chrome allows it only after the first tap.
- The previews draw a second small board: keep them still, and draw them only while Board help is open.

## Does not do

- No Tricks (19), no new New game sheet (06), no `?lab=1` switch (D6), no new layout (03).

## Comments

W2 builds this ticket with 03 under [the fast plan](../fast-plan.md), §2.
- Build stable Menu pages, Board help, Feel, Extra and the Resign question.
- Cut the live previews and vibration. Keep the current controls and account node.
- Close checks wait for the Menu focus return before typing starts.
- All checks pass; see 03 for test results and samples. The separate review and sample review wait.
