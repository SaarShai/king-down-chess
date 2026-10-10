# 06 · Try with

Status: ready-for-agent
Size: M
Blocked by: 05

## Scope

- The board is also the test. The Try with tray: Friend and Enemy tokens, the eye (threats), the die (stir) and the broom (clear).
- Lift and place the piece, so the player can wake or put to sleep a zone rule. A tap on the open piece lifts it (`proving-ground.html:1660`); the keys do the same.
- Why tag actions: Move here, Take from here (a shot), Put an enemy here, Take back, and "Show on <square>" on an asleep mark (`:1352`, `:1991`). Chains, "becomes" and two-action squares ask, as Try it does today.
- "Move N" and "card played" show only when a rule reads them (decision 24).
- The "Try board" plaque.
- Mockup states `asleep-b4`, `awake-e2`, `guard`, `rook-leap` (the tray only); functions `renderTray` (`proving-ground.html:1369-1396`), `placeLifted` (`:1681`), the drag (`:2062`), `placeEnemy` (`:1695`), `doMoveHere` (`:1700`), `takeBack` (`:1735`).

## Plan

1. [ ] **`src/workshop/scene.ts`, pure:**
   - `stir(board, from, rnd)`: the enemy placement of `reset` (`sandbox.ts:49-61`, the shuffle at `:55-59`) with its `ENEMIES` list (`:19`), moved here; `sandbox.ts` calls it until ticket 11, so one copy stays. `clear(board, from)`: the piece alone. The mockup's die steps through hand-made boards (`proving-ground.html:1995-2005`); a design has no such boards, so the die places random enemies, as Shuffle does today.
   - `wakeSquare(d, board, from, rule)`: for "Show on <square>", the nearest empty square where that rule's When holds (`holds`, `moves.ts:27-42`), the same file first; null when none (then no button). The mockup shows e2 because it has a hand-made e2 board; the rule gives d2.
   - `threatsOf(d, board, from, st)`: for each enemy piece, `genPiece(board, s, 'attacks', out)` (`src/rules/engine.ts:928`) and keep the moves that take the design's square; a threat is "stopped" when a `cannotBeTaken` rule of the design holds (`holds`, `moves.ts:27-42`) and refuses that attacker's type. Each stopped arrow carries the rule's stamp.
2. [ ] **Moves with the engine, not a new apply function.** "Move here" plays the move with `makeMove({ board, turn: WHITE, halfmove: 0, ply: 0 }, m).board` (`engine.ts:985-1061`; `landed()` at `:965-969` makes a promotion; `boardAfter`, `:1788`, uses the same call). Each call passes `turn: WHITE` again, because the other side never moves. `st.move` and `st.captured` change as in `play` (`sandbox.ts:66-87`). A promotion opens the "becomes" choice; the design becomes that piece (`presetOf`, as `sandbox.ts:76`).
3. [ ] **`src/workshop/ground.ts`:**
   - The tray at the foot of the right column (desktop) and a fifth ledge tab, "Board", on the phone. On the desktop it shows from the second item that the player opens, or after an edit (`proving-ground.html:1372`, `S.opened` at `:1559`).
   - Lift and place: drag the figure, or tap it and then a square; Esc puts it back. With the keys, Enter on the piece's square lifts it, the arrows move, and Enter places it; so on that one square Enter lifts and does not open the Why tag. The scene is made again for the new square.
   - Tokens: arm the Friend or Enemy token, then tap a square; a tap on a token piece removes it.
   - The die stirs, the broom clears.
   - The Why tag's foot: "Move here" or "Take from here", "Put an enemy here" on an empty take square, "Take back" after a move (a small stack of boards). A square with two actions asks which one (`tap` and `pick`, `sandbox.ts:88-101`). A chain shows its next takes, with Finish. On an asleep mark, "Show on <square>" places the piece on `wakeSquare` and opens the tag on the woken mark (the Pawn's d6 shows on d2).
   - The eye switches the threat arrows on and off.
   - "+5 moves" and "Pretend your opponent played a card" (the words of `sandbox.ts:152-153`) show only when a rule's When is `fromMove`, `beforeMove` or `afterCard`.
   - The plaque (port `plaque`, `marks.js:809`): "Try board", with the title "An example board. No check test. The other side does not move." It shows after the first tap on a square, or from the second item that the player opens (`proving-ground.html:1179`, `:1663`). On the phone, a lock icon in the plinth strip.
4. [ ] **Tests** (`scene.test.ts`): `stir` keeps the piece and its neighbours free; `threatsOf` on the `guard` scene (`scenes.js:241`) stops the pawn's threat; Move here on the Paladin's d7 removes both pieces (`selfRemove`); `wakeSquare` gives d2 for the Pawn's step 2 from d4 and null for a `fromMove` rule (no square wakes it).
5. [ ] **Check group `tryWith`:** lift the Pawn to b4 (the double step sleeps) and to e2 (it wakes), by drag, by tap and by keys; "Show on d2" from the Pawn's d6; tokens; Move here and Take back; the Beast's chain with Finish; the Pawn's promotion choice; a two-action square; the Guard's threats; "+5 moves" only on a `fromMove` design; stir and clear; the plaque and the tray hidden on the first open of a pool piece.
6. [ ] **W14 states:** `asleep-b4`, `awake-e2`, `moved`, `guard-threats`, `tray`, `phone-board-tab`.

## Verification

- [ ] `npm test` passes, with the new `scene.test.ts` cases.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `asleep-b4`, `awake-e2` and `guard` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- `makeMove` reads `RULES` (for example `keepsLost`); the open game shares `RULES`. Try with reads it and never sets it.
- A drag on a phone must not scroll the page.

## Does not do

- No King socket (13) and no card slot (14). No check, no mate, no moves for the other side.
