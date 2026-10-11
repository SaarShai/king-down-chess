# 13 · Kings tab and powers (later)

Status: ready-for-agent
Size: M
Blocked by: 06, 11
Later: not needed for v1; a designed piece cannot use a power until ticket 16, so this is a preview on pool pieces only.

## Scope

- The ledge's Kings tab: six kings; an open king shows his two powers as coins with their words.
- Try with gets the King socket: seat a king, arm one power, see and play its marks on an unchanged pool piece (decision 31).
- Echo: a power that adds nothing shows "=".
- Mockup states `kings`, `rook-leap`, `frost-power`, `echo`; functions `kingWalk` (`proving-ground.html:1879`), `tapPower` (`:1889`).

## Plan

1. [x] **`src/workshop/powers.ts` (new), in the Workshop chunk** (not in `rules.ts`, so the plugin page does not change):
   - `withRules(over, fn)`: copy `RULES` (`src/rules/rules.ts:761`), `setRules(over)` (`:820`), run `fn`, then `Object.assign(RULES, copy)` in `finally`, in one turn (decision 32).
   - `powerMarks(pos, king, power)`: in `withRules({ ...POWERS_BALANCED, kings: [{ king, power }, null] }, …)`, `legalMoves(pos)` (`engine.ts:1862`) filtered by `m.power === POWER_TAG[power]` (`src/powers-ui.ts:109-112`). An always-on power has no tagged move: its marks are the diff of the moves with and without it (the method of `why.ts`). No diff is an echo.
2. [x] **`src/workshop/ground.ts`:**
   - Kings tab: the six `KINGS` (`rules.ts:154`) with their art (`public/ui/kings/`); the open king: "<NAME> KING", the figure on the plinth, and in the info column his two powers, each with the game coin (`src/ui/coin.ts:5`) and `powerText` (`powers-ui.ts:17`). No mini boards (decision 29).
   - King socket in the tray: "SEAT A KING" with the six kings; the king stands on b1 (as the scenes). The socket shows his two coins with notches (`coinState`, `powers-ui.ts:163`; `usesLeft`, `:196`). A tap arms one power (one power per king). Power marks have the power edge colour and the emblem stamp. A tap on a power mark plays it with `makeMove` and spends a notch; with none left, "No <Power> uses left." Freeze shows frost with a turn count (`Position.marks`).
   - On a copy or a new piece, the socket says "Powers work on the pool pieces for now." with `aria-disabled`.
   - Echo: the coin shows "=" and "<Power> adds nothing to the <Piece>. No mark changes."
3. [x] **Tests:** `src/workshop/powers.test.ts` (new): `RULES` is the same before and after `withRules`, also when `fn` throws; the `rook-leap` marks equal G22 (`scenes.js:367`); Leap on the Paladin is an echo; Freeze on the `frost-power` board.
4. [x] **Check group `kings`;** W14 states `kings`, `rook-leap`, `frost-power`, `echo`.

## Verification

- [x] `npm test` passes, with `powers.test.ts`.
- [x] `npm run check:browser workshop powers` passes (`workshop` three times).
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- The open game shares `RULES`; each preview must put it back in the same turn.

## Does not do

- No powers on designed pieces (16). No "Also changed by" row (spec, "Later").

## Comments

### 2026-10-11 · built on `claude/pg-kings`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/13-kings/`):

- `npm test`: exit 0, with `powers.test.ts` (4 tests). Log: `logs/npm-test-2.log` (116 test files pass, 1 skipped; `powers.test.ts` is the one new file). `logs/npm-test-1.log` is the run before the last small fix (the scroll of a new ledge tab), also exit 0; `logs/npm-test-3.log` is the run after the W14 fix below.
- `npm run check:browser workshop`: passes three times after the last fix, with the new group `kings`. Logs: `logs/check-4.log` to `logs/check-6.log` (and `logs/check-1.log` to `logs/check-3.log` before that fix).
- `npm run check:browser powers`: passes. Log: `logs/check-powers2.log`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5184/ <out>/w14full`: 100 renders; 98 pass and `beast-cancel` (2 renders) could not render (`logs/w14-capture.log`). Its steps did not wait for the dialog after the menu press, and the larger Workshop chunk now loads after the step reads the ledge. With the wait (W14 change below) both render with no fault (`logs/w14-beast-cancel.log`), with the new states `kings`, `rook-leap`, `frost-power` and `echo`.
- Beside the mockup at 1440 × 900 and 390 × 844 (the mockup on the left): `side-kings-1440.png`, `side-kings-390.png`, `side-rook-leap-1440.png`, `side-rook-leap-390.png`, `side-frost-power-1440.png`, `side-frost-power-390.png`, `side-echo-1440.png`, `side-echo-390.png`. The single renders: `mock-<state>-<width>.png` and `w14/<state>-<size>.png`.

Changes from the ticket, each with its reason:

1. `powerMarks(pos, from, king, power)` has the parameter `from`: it keeps the moves of the open piece, and for Freeze and Ice Wall the marks on any piece. Without it, Strike, Haste and Flight would mark the moves of every white piece. An always-on power (or March at 0 uses) is the diff of the moves with and without the king's power; a power with no move is an echo.
2. `powers.ts` also holds `seated` (the king stays where a white king stands, else b1, else the first empty square), `enginePos` (the Try board with the pool piece as its own engine type), `kingRules` (the rules of the coin) and `playPower` (`makeMove` in `withRules`), so that `ground.ts` does not touch `RULES`. `powerLayer` makes the scene parts: each target with the legend's power frame (the two blue frames, `legend.ts` `power`), the king's emblem stamp at the end of each line, a blue arch with the emblem over each passed piece, and the line on from the last passed piece. The arch takes the place of the line that the pawn stopped. The mockup's leap tiles have no blue frame; the ticket asks for the power edge colour, so the tiles have it.
3. A tap on a mark of the armed power plays it at once (the ticket's words). The mockup's `rook-leap` opens the Why tag on d5 instead; W14 `rook-leap` shows the marks with no tag. Move here and Take back keep working: Take back gives the move and the use back.
4. The board under an open king is the open piece: opening a king seats him and does not change the piece (the mockup moves to the Rook or the Paladin, which are its only two scenes). W14 `kings` opens the Rook first.
5. The socket with a king shows his figure (a button that opens SEAT A KING again) and his two coins. The mockup has no way to change the seated king from the tray.
6. The coins are the game's coins (`coinRow` of `src/ui/coin.ts`, read inside a button of ours; `coinState` for the uses; `coinWords` for the label), so they show the emblem and the notches, not the mockup's glyph coins. An unlimited power shows no ∞ notch, as in the game.
7. On the phone an open king shows his name, figure and the board, with no power lines, as the mockup's phone state does. His powers are armed from the coins in the Board tab.
8. Freeze leaves a frost (a new scene effect `frost`, ported from `frostOverlay`, `baseRing` and `ringPips`, marks.js:573-595) with one moon pip for each turn left (`Position.marks`). A frozen piece does not stop a threat on the eye: the mockup's stopped threat with the power stamp waits for the "Also changed by" work (spec, "Later"). W14 `frost-power` uses the Paladin's own example board, so it has no threat arrows; the mockup uses a hand board.
9. A power mark keeps the Why tag out: while a power is armed, a tap on its mark plays it. The other squares open the tag as before.
10. The Kings tab is on the desktop, in short landscape and on the phone. A new tab starts at the left of its row.
11. W14 `beast-cancel` waits for the open dialog before it reads the ledge, as the other states do (see the evidence).
12. `docs/WORKSHOP.md` gets a "Kings" bullet, `powers.test.ts` in the unit tests, and "the kings" in the `workshop` check.

Open problems:

- The owner has not seen the renders (the last Verification box).
- No Cards or Rules tab here: tickets 12 and 14. The tabs list in `renderLedge` is the merge point with ticket 12.

### Reviews

The review of the first build (`review-13.md` in the scratchpad), each finding checked against the code:

1. Should-fix, confirmed: the two powers of one king shared one use count (`pos.game.used[WHITE]`), so after Freeze the Ice Wall coin showed "1 left". Fix: the Try state keeps the uses of each power (`game.uses`); `kingPos(p)` gives the engine the uses of power `p` only. Browser check: after Freeze, "Ice Wall, 2 left".
2. Should-fix, confirmed: `echo()` did not have the guards of `powerNow()`, so after a "becomes", a removal or during a chain the tray said "<Power> adds nothing". Fix: one predicate `powerLive()` for both.
3. Should-fix, confirmed: the die and the broom kept the old Freeze marks, and the broom removed the seated king. Fix: the die and the broom keep the uses but not the marks, and seat the king again on a pool piece's board. Browser check: after the broom, no frost and the Frost king stays.
4. Should-fix, confirmed: on a copy the power lines of an open king armed a power with no marks, and `kingPos()` put `piece(-1)` on the board. Fix: the lines get `aria-disabled`, `tapPower` gives the "Powers work on the pool pieces for now." toast, and `kingPos()` uses the design type `T` on a non-pool item. On a non-pool item a line is also never pressed (before, a power armed on the pool piece stayed pressed on the copy). Browser check: on My Paladin, a tap on Leap gives the toast and the line stays not pressed.
5. Nit, refuted: no scene has a move mark with no power on an enemy square, so no failure shows. No change.
6. Nit, confirmed but not fixed: G22 is a local of `check()` in `scenes.js` and is not exported; to read it needs more than one line.
7. Nit, not fixed: a missing test, not a failure; the test needs more than one line.
8. Nit, confirmed: `kings()` stood under the doc comment of `motionRun`. Fix: `kings()` moves above that comment.
9. Nit, confirmed: after a king is chosen in SEAT A KING, the focus went to the first brush. Fix: the focus goes to the king figure (`[data-act="seat"]`), as with Esc. Browser check added.

Evidence after the review fixes (logs in `13-kings/logs/`): `npm test` exit 0, 116 test files pass, 1 skipped (`npm-test-review.log`). `npm run check:browser workshop` passes three times (`review-check-2.log` to `review-check-4.log`); `review-check-1.log` failed because Playwright does not click an `aria-disabled` line, so the check now clicks it with `force`. `npm run check:browser powers` passes (`review-check-powers.log`).
