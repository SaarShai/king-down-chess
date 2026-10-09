# 02b · The turn button in every mode, and Undo before the press

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 01, 02a

## Scope

- Owner choices: a button plays the turn and gives the other player their turn; Undo works only before the press; it applies in all modes (the computer, two players on one device, online). The full rules are in [spec §4](../spec.md#4-the-turn-button). Decisions D2, D3, D4.
- This step gives every mode the turn rule. In a link game, End turn hands the turn over on this device, and "Send the game link" sends the handed-over plies, as today. Ticket 02c makes the press itself the send. No mode ships without the turn rule.
- Demo: `future-online` (`setSend`, Undo on only when ready, the `.is-ready` cue).
- Files: new `src/turn.ts` and `src/turn.test.ts`; `src/main.ts` (`myTurn`, `resigner`, `refresh`, `refreshPowers`, `commit`, `maybeAi`, `undo`, the `#end-haste` handler, `Save`, `save`, `openSaved`, `replay`, start-up, the link open, keys); `src/game.ts` (`resigningSide`); `src/move-text.ts` (the free-pass sentence; plugin page, spec rule 5); `index.html` (action row, `#end-haste`); `src/style.css`; `src/account/sync.ts` and its test; new `tools/verify-turn.mjs`; `tools/app-ui.mjs` (the `endTurn` body); the checks below.

## Plan

1. [x] `src/turn.ts` (pure): from the history, the position, `turnStart` and the open chain or choice, give `activeSide`, `staged`, `midWay`, `ready`, `waits` and the Undo floor (spec §4.2).
2. [x] `main.ts` keeps `turnStart`. A computer ply moves it at once. New game, Rematch and a lesson start set it to 0; `lessonReturn` keeps it. An opened link sets it to the link's ply count. A link that ends in the middle of a turn (made before this change): play the pass for the sender, then set `linkSide` to the receiver's side.
3. [x] `myTurn()` is false only while the turn waits. While the turn is mid-way, the board takes the follow-up move that the engine offers. While the turn waits, a tap follows spec §4.10: a tap on a piece reads it (today's info card until ticket 04) and selects nothing; a tap on an empty square or your own piece says "Tap End turn, or Undo." (one device: "White: tap End turn."). Show threats draws the threats against the active side in the staged position.
4. [x] `commit()`: after a person's ply, the `maybeAi()` guard keeps the computer still until the press. After a staged ply that ends the game, do not call `showOver()`; the line uses the words of spec §4.9. A computer ply works as today.
5. [x] Add `#end-turn` in the place of Hint: Undo · End turn · Resign. Primary style only when ready; ink-soft at 75 % when off (`aria-disabled`). The press: a `busy` guard; when the turn is mid-way, commit the pass first; set `turnStart`; save; then the end (`showOver()`), the computer (`maybeAi()`) or a refresh.
6. [x] Remove `#end-haste` and its handler. The mid-way words of spec §4.9 replace its texts.
7. [x] Follow-up moves from the engine (spec §4.5): Haste and Rage select the same piece again; RageB marks only takes; Rally selects nothing and the first piece cannot move; GrowthB and the free marks act as a free mark. In `describeMove`, the pass after a free mark says "<Side> ends the turn after the mark." (`move-text.ts` runs in the plugin page: rule 5).
8. [x] `undo()`: acts only above `turnStart` or with an open Beast chain (it then puts the Beast back). One ply for each press. Remove the loop and the `maybeAi()` call. Do not clear `resigned`. After it takes back a Haste or Rage second move, select that piece again. The Undo button and Z use the same guard. The screen reader hears "Move taken back." The refusal after the end: "The game is over. Start a new game." Lessons show no Undo.
9. [x] `ended()` = finished and handed over. The result words, the refusal, the start-up result and Return to game read it. A staged end: `#announce` says "Checkmate. End turn, or Undo."
10. [x] Resign during a staged turn: drop the staged plies, then give up the active side. `resigningSide()` takes the active side.
11. [x] The status line and the strips name the active side until the press (two players on one device).
12. [ ] Cut by the fast plan: no staged save field or account sync. A reload hands the turn over.
13. [x] Keyboard (spec §4.4): the focus goes to End turn when the turn starts to wait, not when it is mid-way. After the press, the focus goes to the board and the cursor shows. Z and R keep their current scope (fast plan).
14. [x] Lessons: no End turn and no Undo; the lesson judges each move at once, as today.
15. [ ] Cut by the fast plan: no `?turn=auto`. Checks use the real button through `endTurn(page)`.
16. [x] Update the checks that use Undo, `#end-haste` or an automatic reply, through the helpers of ticket 00: `qa`, `painted-game`, `special-moves`, `powers`, `cursor-adoption`, `playable-clay`, `king-effects`, `account`, `ux-defects` (d1, d3, d4, d6, d10).

## Verification

- [x] `src/turn.test.ts`: plain turns, Haste, free Freeze, Rage, RageB, Rally, the double first turn, staged ends and the Undo floor. Resign uses the active side. Real turn lines meet the word limit.
- [x] `src/move-text.test.ts`: the web free-pass words; the Haste words and the plugin default stay.
- [x] Turn checks: the computer waits, one-ply Undo and its floor, Haste pass, free Freeze, staged mate, staged Resign and the next side waits. The review's choice and Cancel cases pass.
- [x] After the merge, `npm test` passes. All 14 named M1 checks pass. Turn and link-game pass twice. Plugin-ui passes; its page size is recorded below.
- [x] Sample W1: End turn off, the turn ready, Haste and staged mate at 390×844 and 1440×900. Capture reports no fault; both sheets are checked.
- [ ] The owner's yes on the sample.

## Risks

- A guard that still reads `game.pos.turn` lets the wrong side act or blocks the computer for ever. Search every reader of `game.pos.turn`, `myTurn()` and `sides[...]`.
- Each turn costs one more tap. Ticket 13 makes the reply come soon after the press.
- A reload hands a staged turn over. Undo stops there (fast plan).
- The first send has two actions: End turn, then Send the game link (fast plan).

## Does not do

- No send by the press (02c), no rewind (12), no search before the press (13), no second look (20), no Previously (21), no new layout (03). The plugin board does not change (D14).

## Comments

One press hands over the turn. Undo takes back one staged ply and stops at the press.
Fix both review findings: choice handlers precede the control refresh; the word test reads real turn lines.
Cuts: no staged save field, pulse, four-second line, auto mode, new key scope or search before the press.
Merge the integration branch with no conflict. Tests: 80 files pass, 1 skips; 1482 tests pass, 13 skip; 50 scene tests pass.
M1: all 14 named checks pass; turn and link-game pass twice; plugin-ui passes. No timeout occurs.
Plugin page: 4,291,968 bytes (base 4,291,869; +99). The default words stay.
Sample W1: 14 renders, no fault; phone sheet 2240 px, desktop sheet 2380 px. Both sheets are checked.
The owner's yes on the sample waits. Renders stay in the build scratch folder, outside Git.
