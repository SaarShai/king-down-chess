# 02b · The turn button in every mode, and Undo before the press

Status: built (the separate W1 review and the owner's sample review wait)
Blocked by: 01, 02a

## Scope

- Owner choices: a button plays the turn and gives the other player their turn; Undo works only before the press; it applies in all modes (the computer, two players on one device, online). The full rules are in [spec §4](../spec.md#4-the-turn-button). Decisions D2, D3, D4.
- This step gives every mode the turn rule. In a link game, End turn hands the turn over on this device, and "Send the game link" sends the handed-over plies, as today. Ticket 02c makes the press itself the send. No mode ships without the turn rule.
- Demo: `future-online` (`setSend`, Undo on only when ready, the `.is-ready` cue).
- Files: new `src/turn.ts` and `src/turn.test.ts`; `src/main.ts` (`myTurn`, `resigner`, `refresh`, `refreshPowers`, `commit`, `maybeAi`, `undo`, the `#end-haste` handler, `Save`, `save`, `openSaved`, `replay`, start-up, the link open, keys); `src/game.ts` (`resigningSide`); `src/move-text.ts` (the free-pass sentence; plugin page, spec rule 5); `index.html` (action row, `#end-haste`); `src/style.css`; `src/account/sync.ts` and its test; new `tools/verify-turn.mjs`; `tools/app-ui.mjs` (the `endTurn` body); the checks below.

## Plan

1. [ ] `src/turn.ts` (pure): from the history, the position, `turnStart` and the open chain or choice, give `activeSide`, `staged`, `midWay`, `ready`, `waits` and the Undo floor (spec §4.2).
2. [ ] `main.ts` keeps `turnStart`. A computer ply moves it at once. New game, Rematch and a lesson start set it to 0; `lessonReturn` keeps it. An opened link sets it to the link's ply count. A link that ends in the middle of a turn (made before this change): play the pass for the sender, then set `linkSide` to the receiver's side.
3. [ ] `myTurn()` is false only while the turn waits. While the turn is mid-way, the board takes the follow-up move that the engine offers. While the turn waits, a tap follows spec §4.10: a tap on a piece reads it (today's info card until ticket 04) and selects nothing; a tap on an empty square or your own piece says "Tap End turn, or Undo." (one device: "White: tap End turn."). Show threats draws the threats against the active side in the staged position.
4. [ ] `commit()`: after a person's ply, do not call `maybeAi()`. After a staged ply that ends the game, do not call `showOver()`; the line uses the words of spec §4.9. A computer ply works as today.
5. [ ] Add `#end-turn` in the place of Hint: Undo · End turn · Resign. Primary style only when ready; ink-soft at 75 % when off (`aria-disabled`). The ready cue and the first-games line of spec §4.1. The press: a `busy` guard; when the turn is mid-way, commit the pass first; set `turnStart`; save; then the end (`showOver()`), the computer (`maybeAi()`) or a refresh.
6. [ ] Remove `#end-haste` and its handler. The mid-way words of spec §4.9 replace its texts.
7. [ ] Follow-up moves from the engine (spec §4.5): Haste and Rage select the same piece again; RageB marks only takes; Rally selects nothing and the first piece cannot move; GrowthB and the free marks act as a free mark. In `describeMove`, the pass after a free mark says "<Side> ends the turn after the mark." (`move-text.ts` runs in the plugin page: rule 5).
8. [ ] `undo()`: acts only above `turnStart` or with an open Beast chain (it then puts the Beast back). One ply for each press. Remove the loop and the `maybeAi()` call. Do not clear `resigned`. After it takes back a Haste or Rage second move, select that piece again. The Undo button and Z use the same guard. The screen reader hears "Move taken back." The refusal after the end: "The game is over. Start a new game." Lessons show no Undo.
9. [ ] `ended()` = finished and handed over. The result words, the refusal, the start-up result and Return to game read it. A staged end: `#announce` says "Checkmate. End turn, or Undo."
10. [ ] Resign during a staged turn: drop the staged plies, then give up the active side. `resigningSide()` takes the active side.
11. [ ] The status line and the strips name the active side until the press (two players on one device).
12. [ ] Save (spec §4.8): the field `staged`, written only when more than 0, in `Save`, `save()` and `GAME` in `sync.ts`. On restore, check the count and set `turnStart` to the smaller of the stored boundary and the replayed plies, at start-up, in `openSaved()` and in `replay()`. The `maybeAi()` calls at start-up, Return to game, `openSaved()` and after the New game dialog do nothing while a person's turn is staged.
13. [ ] Keyboard (spec §4.4): the focus goes to End turn when the turn starts to wait, not when it is mid-way. After the press, the focus goes to the board and the cursor shows. Z and R act only while the board or the action row has the focus.
14. [ ] Lessons: no End turn and no Undo; the lesson judges each move at once, as today.
15. [ ] A check-only switch `?turn=auto` for isolated rule probes: it presses only when the turn waits. It never plays the pass of a mid-way turn and never sends a link. Every check of the player's flow presses the real button through `endTurn(page)`.
16. [ ] Update the checks that use Undo, `#end-haste` or an automatic reply, through the helpers of ticket 00: `qa`, `painted-game`, `special-moves`, `powers`, `cursor-adoption`, `playable-clay`, `king-effects`, `account`, `ux-defects` (d1, d3, d4, d6, d10).

## Verification

- [ ] `src/turn.test.ts`: for a plain move, `ready` and `waits` and the floor. A Haste first move: ready, not waiting, `myTurn()` true; then a second move: waits; or the pass: waits. A free Freeze: ready, not waiting; then a move: waits. Rage, RageB and Rally follow-ups. `secondPlayerDoubleFirstTurn`: not ready. A computer ply moves `turnStart`. Undo never goes below `turnStart`.
- [ ] `src/game.test.ts`: `resigningSide` gives the active side for a staged turn on one device.
- [ ] `src/account/sync.test.ts`: `staged` travels in the saved game; a save without it reads as all handed over; a bad count reads as 0; a short replay keeps the boundary; a staged end restores as staged.
- [ ] `src/move-text.test.ts`: the free-pass sentence; the Haste pass sentence does not change.
- [ ] New check `turn` (in the registry), with the real button, in each of the three modes: stage, follow up or pass, Undo, press, reload; after each step it compares the board, the history, the power uses and the Undo floor. The cases: against the computer, no reply before the press; Undo works before the press and is off after it; one Undo press takes back one ply; on one device the next side cannot move or arm before the press but can read; a Haste first move, then a second move; a Haste first move and a press record `--`; a free Freeze, then a move; a free Freeze and a press record the pass; Ice Wall; a promotion and its cancel; an open Beast chain and Undo; a staged mate, a staged stalemate and a staged repetition show the result only on the press, and Undo before the press removes it; Resign with a staged turn; a reload keeps the staged turn and the computer stays still; Return to game from a lesson; an account change during a staged turn; an old link that ends mid-turn opens with the pass; the keyboard path of spec §4.4 (the focus never drops to the page); the ready cue; no `#end-haste`.
- [ ] The updated checks pass; `npm test` and `npm run check:browser` pass; `plugin-ui` passes (the `describeMove` change). Record the plugin page size.
- [ ] Main and the branch compared: on main the computer replies at once and Undo takes back two plies; on the branch the reply waits for the press and Undo stops at the turn start.
- [ ] Rendered sample, 390×844 and 1440×900, in today's layout: your move (End turn off); the turn ready; the computer plays; Haste mid-turn; a free Freeze mid-turn; a staged mate; a staged stalemate; two players before and after the press; a promotion choice; a keyboard run that shows the focus path. The owner's yes, with the date, in Comments.

## Risks

- A guard that still reads `game.pos.turn` lets the wrong side act or blocks the computer for ever. Search every reader of `game.pos.turn`, `myTurn()` and `sides[...]`.
- Each turn costs one more tap. Ticket 13 makes the reply come soon after the press.
- An older app on another device ignores `staged` and can start the computer on a staged turn. This is acceptable.
- For one step, a link game has two actions (End turn, then Send the game link). Ticket 02c joins them.

## Does not do

- No send by the press (02c), no rewind (12), no search before the press (13), no second look (20), no Previously (21), no new layout (03). The plugin board does not change (D14).

## Comments

Finish plan: check Undo during a free-mark choice, then fix the refresh order.
Check real turn lines, merge the integration branch, and pass the local tests and named M1 checks.
Render the seven W1 states at both sizes. Record the results and commit.

W1 build: one press hands over the turn. Undo takes back one staged ply.
Keep the turn state and candidate link moves in `src/turn.ts`; connect the press in `src/turn-controls.ts`.
Cuts: no staged save field, ready pulse, four-second line, auto mode or search before the press.
Tests: 80 files pass, 1 skips; 1477 tests pass, 13 skip; all 50 scene tests pass. Type checking passes.
Checks: all 17 pass. The final named run has all 4 pass. Turn and link-game pass twice on the final code.
Plugin checks pass. Page size: 4,291,968 bytes (base 4,291,869; change +99). The default words stay.
Samples: `SAMPLE=02b` gives 14 renders, no fault. Sheets: `/tmp/kingdown-w1-samples/w1-phone.png` and `w1-desktop.png`.
The separate W1 review and the owner's sample review wait. Stop at the build commit.
