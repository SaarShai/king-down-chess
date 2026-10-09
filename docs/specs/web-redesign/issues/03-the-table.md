# 03 · The table: player strips, the bar, the context line and one Moves line

Status: built (the separate W2 review and sample review wait)
Blocked by: 05

## Scope

- Owner choices: the Quiet Table layout; the game controls Undo · End turn · Menu; the move history at rest as one line; levels in words (the level word in the opponent strip). The read words and the reach come in ticket 04; the coin comes in ticket 10, the next step.
- Demos: `proto` (game grid, strips, context line, Moves line, bar: `proto.css` 118–231 and 322–347; `renderContext`, `app.js` 946–986), `dir-quiet-table` (floor and hairlines).
- Files: `index.html` (the game screen), `src/style.css` (split the game screen into its own file), `src/main.ts` (`refresh`, `showInfo`, `onSquareHover`, the `$('panel').scrollTop` calls), a pure `src/context-line.ts` (the ranked list of spec §4.9) and its test, `tools/app-ui.mjs` (helper bodies only), new `tools/verify-game-screen.mjs`, `docs/specs/web-redesign/samples/03.mjs`.

## Plan

1. [ ] One grid: the opponent strip; `#board`; your strip; the context line; the Moves line; the bar (Undo · End turn · Menu). The Menu button of ticket 05 moves into the bar. Remove `#top` and `#panel`. Keep `#board`, `#board-marks`, `#announce`, `#cursor-say`, `#hover`, `#moves`, `#setup` and `window.view`.
2. [ ] Sizes by shape: a phone column (board width from the free height and the canvas ratio 1024/960; 4 px beside the board, 12 px beside text); two columns at 900 px wide or more, or in landscape at 500 px high or less; a 360 px column on desktop; a phone column up to 760 px wide on a tablet. Fixed row heights: context line 64 px on a phone, 72 px on desktop; Moves line 48 px; bar 60 px plus the safe area. `100dvh` with a `100vh` fallback. No sideways scroll.
3. [ ] Strips: the king's portrait, the name (You, Computer, White, Black, Your friend), the level word under the computer's name, "thinking…" after 1 s. A gold edge marks the active side. No power shows in a strip until ticket 10: until then, your power control is the context line's action at your turn, with today's words; their strip shows no power name.
4. [ ] The context line: one live region, two lines at most (clamped), one optional action (a choice of ticket 09 and a lesson hold up to three). `src/context-line.ts` gives the line from the ranked list of spec §4.9; this ticket builds the ranks that exist now. The check row shows only when the side in check is the active side and nothing is staged; a staged check reads "Check. Your turn is ready. Tap End turn." The line takes the texts of `#move-help`, `#moment`, `#status`, `#power-status`, `#asset-status`. Its action takes Stop here (`#stop-chain`), Cancel (an armed power), and Next lesson, Return to game and Show me in a lesson. `#cancel-selection` goes: a second tap or Esc cancels. The line never repeats `#announce`.
5. [ ] A tap follows spec §4.10. Until ticket 04, a read shows today's piece text (`pieceText`) in the context line; the long `#info` card goes, and `kingsInfo` leaves it. A hover reads nothing; the hover move preview stays.
6. [ ] The Moves line: a button with the last move's piece icon, its `describeMove` sentence on one line, "Moves" and a chevron; "No moves yet." before the first move. A tap opens the list over the other parts (a sheet on a phone, a fold in the column on desktop); the board does not move. The open list keeps the `#moves [data-ply]` buttons, review by row and by the arrow keys, and the captured rows at its end.
7. [ ] Scope the new styles under their containers. Leave the global button rule as it is (the Workshop and the dialogs use it).
8. [ ] Change only the helper bodies in `tools/app-ui.mjs` (`contextText`, `endTurn`, `openMenu`); the checks do not change.

## Verification

- [ ] `src/context-line.test.ts`: the rank order of spec §4.9 for each pair of states that can be true together (for example check and a staged turn, a read and a mid-way turn); every first line has 8 words or fewer.
- [ ] New check `game-screen` at 1440×900, 1280×720, 820×1180 (touch), 390×844 (touch), 390×664, 375×550 and 844×390 (touch): no sideways scroll; Menu, Undo and End turn inside the screen; 44 px targets on touch; the `#board` box, Undo and End turn do not move between rest, a piece selected, a piece read, a power armed, a chain open, check, a staged check, a staged turn, a staged end and the Moves list open; squares at 390×844 no smaller than today (44.3 px); no `#hint`; at most one crimson control; the off controls stay in the Tab order.
- [ ] The checks, `npm test` and `npm run check:browser` pass. `plugin-ui` is not touched (no render file changes).
- [ ] Rendered sample at the five layout sizes: rest; an enemy piece read; a piece selected; a chain with Stop here; a power armed; check; a staged check; the turn ready; the Moves list open; the Menu open; review. Main and the branch side by side. The owner's yes, with the date, in Comments.

## Risks

- The largest CSS change of the redesign: test short phones and landscape with care.
- The Clay look must still fit the frame (`playable-clay`).
- Long texts (refusals, power texts such as Darkness) need short copy; the clamp must not hide the cause of a refusal.
- The power control sits in the context line for one step only; ticket 10 must follow at once.

## Does not do

- No read words or reach (04), no coin (10), no story sentence (11), no Ceremony (the result dialog `#over` stays until 14).

## Comments

W2 follows [the fast plan](../fast-plan.md), §2.
- Build the fixed table, player strips, bar and ranked context.
- Use native Menu and Moves sheets. Keep the settings nodes.
- Keep today's power button in your strip until W3.
- Cut the desktop fold, previews, vibration and new story words.
- Test the four rank collisions, selected help and lesson turns first.
- `npm test`: 81 files pass; 1,490 tests pass; 13 skip. All 50 scene tests pass.
- All 19 browser checks pass. The two new checks pass again; both plugin checks pass.
- Render 30 states at three sizes; no faults. Sheets and the phone pair: `/tmp/w2-samples/`.
- Merge W1 at `43c4e30`. Plugin page: 4,291,968 bytes, the same as W1. The separate review and sample review wait.
