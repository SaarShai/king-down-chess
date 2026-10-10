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

1. [x] **`src/workshop/scene.ts`, pure:**
   - `stir(board, from, rnd)`: the enemy placement of `reset` (`sandbox.ts:49-61`, the shuffle at `:55-59`) with its `ENEMIES` list (`:19`), moved here; `sandbox.ts` calls it until ticket 11, so one copy stays. `clear(board, from)`: the piece alone. The mockup's die steps through hand-made boards (`proving-ground.html:1995-2005`); a design has no such boards, so the die places random enemies, as Shuffle does today.
   - `wakeSquare(d, board, from, rule)`: for "Show on <square>", the nearest empty square where that rule's When holds (`holds`, `moves.ts:27-42`), the same file first; null when none (then no button). The mockup shows e2 because it has a hand-made e2 board; the rule gives d2.
   - `threatsOf(d, board, from, st)`: for each enemy piece, `genPiece(board, s, 'attacks', out)` (`src/rules/engine.ts:928`) and keep the moves that take the design's square; a threat is "stopped" when a `cannotBeTaken` rule of the design holds (`holds`, `moves.ts:27-42`) and refuses that attacker's type. Each stopped arrow carries the rule's stamp.
2. [x] **Moves with the engine, not a new apply function.** "Move here" plays the move with `makeMove({ board, turn: WHITE, halfmove: 0, ply: 0 }, m).board` (`engine.ts:985-1061`; `landed()` at `:965-969` makes a promotion; `boardAfter`, `:1788`, uses the same call). Each call passes `turn: WHITE` again, because the other side never moves. `st.move` and `st.captured` change as in `play` (`sandbox.ts:66-87`). A promotion opens the "becomes" choice; the design becomes that piece (`presetOf`, as `sandbox.ts:76`).
3. [x] **`src/workshop/ground.ts`:**
   - The tray at the foot of the right column (desktop) and a fifth ledge tab, "Board", on the phone. On the desktop it shows from the second item that the player opens, or after an edit (`proving-ground.html:1372`, `S.opened` at `:1559`).
   - Lift and place: drag the figure, or tap it and then a square; Esc puts it back. With the keys, Enter on the piece's square lifts it, the arrows move, and Enter places it; so on that one square Enter lifts and does not open the Why tag. The scene is made again for the new square.
   - Tokens: arm the Friend or Enemy token, then tap a square; a tap on a token piece removes it.
   - The die stirs, the broom clears.
   - The Why tag's foot: "Move here" or "Take from here", "Put an enemy here" on an empty take square, "Take back" after a move (a small stack of boards). A square with two actions asks which one (`tap` and `pick`, `sandbox.ts:88-101`). A chain shows its next takes, with Finish. On an asleep mark, "Show on <square>" places the piece on `wakeSquare` and opens the tag on the woken mark (the Pawn's d6 shows on d2).
   - The eye switches the threat arrows on and off.
   - "+5 moves" and "Pretend your opponent played a card" (the words of `sandbox.ts:152-153`) show only when a rule's When is `fromMove`, `beforeMove` or `afterCard`.
   - The plaque (port `plaque`, `marks.js:809`): "Try board", with the title "An example board. No check test. The other side does not move." It shows after the first tap on a square, or from the second item that the player opens (`proving-ground.html:1179`, `:1663`). On the phone, a lock icon in the plinth strip.
4. [x] **Tests** (`scene.test.ts`): `stir` keeps the piece and its neighbours free; `threatsOf` on the `guard` scene (`scenes.js:241`) stops the pawn's threat; Move here on the Paladin's d7 removes both pieces (`selfRemove`); `wakeSquare` gives d2 for the Pawn's step 2 from d4 and null for a `fromMove` rule (no square wakes it).
5. [x] **Check group `tryWith`:** lift the Pawn to b4 (the double step sleeps) and to e2 (it wakes), by drag, by tap and by keys; "Show on d2" from the Pawn's d6; tokens; Move here and Take back; the Beast's chain with Finish; the Pawn's promotion choice; a two-action square; the Guard's threats; "+5 moves" only on a `fromMove` design; stir and clear; the plaque and the tray hidden on the first open of a pool piece.
6. [x] **W14 states:** `asleep-b4`, `awake-e2`, `moved`, `guard-threats`, `tray`, `phone-board-tab`.

## Verification

- [x] `npm test` passes, with the new `scene.test.ts` cases.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `asleep-b4`, `awake-e2` and `guard` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- `makeMove` reads `RULES` (for example `keepsLost`); the open game shares `RULES`. Try with reads it and never sets it.
- A drag on a phone must not scroll the page.

## Does not do

- No King socket (13) and no card slot (14). No check, no mate, no moves for the other side.

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/06-try-with/`):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,883 tests pass (21 skipped), with the four new `scene.test.ts` cases ("Try with (ticket 06)") and the hand scenes `mypawn-queen-b4` and `mypawn-queen-e2` in the My Pawn test. Log: `logs/npm-test-2.log` (`logs/npm-test-1.log` is the run before the last three small fixes, also exit 0).
- `npm run check:browser proving-ground`: passes three times, with the new group `tryWith`. Logs: `logs/check-1.log` to `logs/check-3.log`, and each run's `check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders: `check-shots/try-b4-1440.png`, `try-e2-1440.png`, `try-guard-1440.png`, `try-promotion-1440.png`, `try-board-390x844.png`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/06-try-with/w14` makes 66 renders with 0 faults (`logs/w14-capture.log`), with the new states `asleep-b4`, `awake-e2`, `moved`, `guard-threats`, `tray` and `phone-board-tab`.
- Beside the mockup, at 1440 × 900 and 390 × 844 (the mockup on the left, the W14 render on the right): `side-asleep-b4-1440.png`, `side-asleep-b4-390.png`, `side-awake-e2-1440.png`, `side-awake-e2-390.png`, `side-guard-1440.png` and `side-guard-390.png` (W14 `guard-threats`), `side-rook-leap-1440.png` and `side-rook-leap-390.png` (the tray; W14 `tray`), `side-guard-x-1440.png` and `side-guard-x-390.png` (the phone's Board tab; W14 `phone-board-tab`). The single renders: `mock-<state>-<width>.png` and `w14/<state>-<size>.png`.

Changes from the ticket, each with its reason:

1. `wakeSquare(board, from, rule, st)` has no design parameter: the rule's When alone decides. It takes the move state `st`, because a `fromMove` rule reads it. "Nearest" is the king-step distance; on a tie the same file comes first.
2. `stir` takes the old enemies away and keeps the friends. With no random source the six enemies stand on the first board of Try it. `actOf` and `tapOf` moved from `sandbox.ts` to `scene.ts`, so that one copy serves Try it and Try with. The new `piecesOf` gives the pieces of a board (`sceneOf` uses it too).
3. `threatsOf` gives scene effects of kind `threat`, with `stopped` and `by` as in the hand `guard` scene. A threat is a red arrow, with a red glow under the threatened piece; a stopped threat is a grey arrow with a bar and the rule's stamp. The key row names "Threat" and "Stopped".
4. Asleep lines show first in this ticket (My Pawn on b4 and e2). The scene builder drew an asleep tile with a moon on each square of an asleep queen line. The hand scenes `mypawn-queen-b4` and `mypawn-queen-e2` and the mockup's states show only faint rails to the edge, with no arrow. Now `sceneOf` gives an asleep line as a rail with the new end `edge` and no asleep marks on its squares, and `scene.test.ts` compares both hand scenes. The Why tag of such a square says "Out of reach.", as the mockup's tag does.
5. After Move here the scene is made again for the new square, and the tag stays on its square (the mockup keeps `S.why`). The other side never moves, so the player can play more moves. A chain in progress shows only its next takes; a removed piece shows no marks; after a "becomes", the marks are those of the new piece.
6. Take back uses a stack of the boards before each move. A new set-up (a lift, a token, the die, the broom, "Show on", "Put an enemy here") or an edit empties it. An edit also ends a chain and brings a removed or changed piece back as the design.
7. The tag's foot has one button for each action of the square: "Move here" (a move or a take), "Take from here" (a shot), "Push" and "Swap". A square with two actions shows both buttons (the Ogre's d5: Move here and Push); this is the question. A "becomes" asks "It becomes which piece?" with one button for each piece.
8. An armed token puts a pawn (white for Friend, black for Enemy) on an empty square, and takes away any other piece that a tap hits. It stays armed until a second tap on it, Esc, a lift or a brush. In the mockup, Friend shows a toast only.
9. The lifted piece stays on its square, raised and faint, in the frame; a drag shows its figure under the pointer. It goes only to an empty square; else the toast says "Place it on an empty square.". The mockup hides the piece and floats an image.
10. The eye starts on for each design with a "cannot be taken" rule (the mockup: the Guard only).
11. The desktop tray follows the mockup's rule (`proving-ground.html:1372`): in look mode, but not on the first open of a pool piece before an edit. A design on the shelf shows it at once. On a short screen (1024 × 768, 1280 × 800) the tray waits while the Why tag is open, so that it does not go under the ledge; the check tests this.
12. The phone's ledge has two tabs, Pieces and Board; Kings, Cards and Rules wait for their tickets. Both tabs are in the Tab order. The phone's lock icon shows at all times, as the mockup's CSS shows `.plock` on the phone.
13. The plaque shows in brush mode too, as in the mockup.
14. "Move N" and "+5 moves" stand at the end of the tray's second row; the card box is under it.
15. W14: `moved` is the Beast's e5 by Move here (the chain goes on: Finish and Take back); `guard-threats` puts an enemy pawn on c5 with the Enemy token (two stopped threats); `tray` is the Archer with the eye on (two red threats).

Open problems:

- The owner has not seen the renders (the last Verification box).
- No King socket (13) and no card slot (14), so the tray has two tokens where the mockup has four.
- The arrow keys do not move between the ledge tabs; Tab does.
- During the work, one run of bare `vitest` on `scene.test.ts` broke the test rule. The evidence above comes only from `npm test` through the lock script.

### Reviews

The first review (an independent reader, read only) gave three must-fix and two should-fix findings. Each is confirmed: it fails before the fix, and the failure shows in a log. The logs, the probes and the renders are in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/06-review/`. `probe/probe.mjs` shows findings 1 to 4 on the dev server (`logs/probe-before.log`, `logs/probe-after.log`); `probe/chain.ts` shows finding 1 in the scene alone; `probe/touch.mjs` and `probe/touch-se.mjs` show finding 5 (`logs/probe-touch-before.log`, `logs/probe-touch-se-before.log`).

1. **Must-fix, confirmed, fixed: a legal next take of a chain had no mark (`ground.ts`, `drawScene`).** A design moves like a queen on a center square and takes again. It stands on d4, with enemies on f4 and h4. After it takes f4, the chain permits h4. But on f4 the queen lines sleep, so the scene of f4 has no h4 mark, and the filter kept only the marks of that scene. The board showed no mark, but the tag of h4 had "Move here" (`probe-before.log`; `chain.ts` gives the stored chain f4xh4 and no h4 mark). Fix: a chain in progress makes its marks from `movesNow()`, each a take. Browser check: `tryWith` takes f4 and sees "h4 take" (`chain-h4-1440.png`, `chain-h4-390.png`). The Beast's next take f6 is now a take, not "both": a chain's next take can only take, as the hover-only chain marks of `sceneOf` show.
2. **Must-fix, confirmed, fixed: Undo kept the Try board of the undone design (`ground.ts`, `undo`).** After a paint on the Pawn and a promotion to a Knight, Ctrl+Z gave the Pawn back, but the board kept the Knight's art, its moves and Take back (`probe-before.log`). Fix: `undo()` calls `setUp(restored())`, as `change()` does. The piece is the design again on its square, and the chain, the choice and the boards of Take back go. Browser check: `tryWith` paints b5, promotes, presses Ctrl or Cmd+Z, and sees the Pawn on d8 with no Knight, no marks and no Take back.
3. **Must-fix, confirmed, fixed: a token could become the removed design on the screen (`ground.ts`, `drawScene`).** After the Paladin took d7 and removed itself, an Enemy token on d7 showed the Paladin's art, and the label of the square said "black paladin" (`probe-before.log`): `piecesOf` makes the piece on `from` the open piece. Fix: the scene of a removed piece uses `piecesOf(board, -1)`, so no piece is open. Browser check: `tryWith` puts the enemy on d7 and reads "d7: black pawn.", the tag's "Black pawn" and no Paladin art (`removed-enemy-d7-1440.png`, `removed-enemy-d7-390.png`).
4. **Should-fix, confirmed, fixed: the card box lost the keyboard focus (`ground.ts`, `render`).** Space on the box called `render()`, which replaced the box. The focus list did not have `data-cardon`, and its value is empty, so a value test cannot find it. The focus went to the page body (`probe-before.log`). Fix: `render()` keeps the focus on `[data-cardon]` too, with a test for the attribute (`!== undefined`) in place of a test for its value. Browser check: `tryWith` presses Space on the box of a design that reads a card (the box is checked and keeps the focus, and the queen lines wake), then Tab (the focus goes to the Pieces tab of the ledge).
5. **Should-fix, confirmed, fixed: the phone part of the check sent no touch (`tools/verify-proving-ground.mjs`).** It read `touch-action` and then dragged with `p.mouse`. With `touch-action: auto` on the squares (put in the page by the probe), a mouse drag still placed the Pawn, but a real touch drag did not. On 375 × 667, where the dialog scrolls, the touch drag scrolled the dialog by 74 px (`probe-touch-before.log`, `probe-touch-se-before.log`). Fix: the check's `drag` can send real touch events (CDP `Input.dispatchTouchEvent`, as `verify-cursor-adoption.mjs` does). On the phone the Pawn goes to e2 by touch. Then on 375 × 667, where the dialog can scroll, a touch drag up the board from e2 to e5 places the Pawn, and the scroll stays at 0.

Evidence after the fixes (in the same `06-review/` folder):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,883 tests pass (21 skipped). Log: `logs/npm-test-1.log`; `logs/npm-test-2.log` is the run after this text.
- `npm run check:browser proving-ground`: passes three times, with the new `tryWith` steps. Logs: `logs/check-1.log` to `logs/check-3.log`, and each run's `check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders: `check-shots/`.
- W14: `logs/w14-capture.log`, 66 renders with 0 faults (`w14/`). Against the renders before the fixes (`logs/w14-pxdiff.log`, the count of pixels that differ): each desktop render is the same, pixel for pixel, but `moved`, where f6 is now a take (on the phone too). The other phone renders differ only by render noise; the largest, `phone-sentence`, is the same picture by eye (`side-phone-sentence.png`). So the states that this ticket compares with the mockup (`asleep-b4`, `awake-e2`, `guard`, the tray) do not change.
