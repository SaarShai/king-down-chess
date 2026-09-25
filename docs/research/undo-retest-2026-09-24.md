# Undo retest — 2026-09-24

> Recovery status, 2026-09-24: Historical retest using board callbacks. Fresh production pointer/touch, save and cancellation checks are in the adoption record. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Browser check of the restored `undo()` in `src/main.ts` at `http://localhost:5199/` (Vite). No source changes. Rules, pool, squire, search, and eval not touched.

**Setup:** Classic chess (`RNBQKBNR`), clock off, Skill Club. Board moves via `view.onSquareClick` (canvas click coords were unreliable under the browser tool’s screenshot→viewport scale); Undo via `#undo.click()` (same handler as the Undo button).

## Cases

### 1. White Human, Black Computer — Undo after computer reply

1. New Classic chess; White Human, Black Computer.
2. Played `e2-e4`. Status showed thinking; move list `1. e2-e4`.
3. Waited until Black’s reply was on the board and in the list: `1. e2-e4 h7-h6`, White to move.
4. Clicked Undo.

**Result: pass.** Move list empty, pawn back on e2, White to move, Undo disabled. Both plies gone in one click.

### 2. Human vs Human — Undo after White’s move

1. Set Black to Human; New Classic chess.
2. Played `e2-e4`. Move list `1. e2-e4`, Black to move.
3. Clicked Undo.

**Result: pass.** Move list empty, White to move, Undo disabled.

## Final `undo()` behaviour

`undo()` always takes back one ply with `game.undo()`. If after that it is still the computer’s turn and at least one side is human, it undoes a second ply so a Human vs Computer player gets their move and the reply back in one press. Caption state is cleared (`said = ''`, `#moment` emptied). Against Human vs Human (or when the side to move after the first undo is human), only one ply is taken back — which matches the player-facing expectation for that pairing.
