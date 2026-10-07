# How search scores taking the king (2026-09-24)

> Recovery status, 2026-09-24: Superseded: the adopted rules and search now score a missing king as a loss, including at the capture horizon; see src/ai/terminal.test.ts. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Context: Taking the king is legal. `status()` returns `checkmate` when the
side to move has no king. Search does not call `status()`. King material is
0. This note only reads `src/ai/search.ts` (and the eval it uses). It does
not change search, values, or the engine.

## What search does instead of `status()`

Search never asks the rules layer who won. It scores a finished branch in
two places only:

- **No legal moves** (`negamax`): if the side to move is in check → mate
  score (`-MATE + ply`); if not in check → **0** (stalemate / draw score).
- **No legal moves while in check** (`quiesce`): same mate score.
- Otherwise it falls through to **ordinary evaluation** (`evalBoard`).

"In check" here means `attacked(c)`: find that side's king, then ask whether
the enemy attacks its square. **If there is no king, `attacked` is false.**
A kingless side is therefore not treated as checked.

Legal-move generation still keeps any move that leaves "our king"
unattacked. With no king, that filter always passes, so leftover pieces may
still move under search even after the king is gone.

## Taking the king

Capturing a king is an ordinary capture whose victim is worth **0**
(`VALUES[K] === 0`). The capture itself adds no material. After it, the
opponent to move is not "in check" and often still has moves, so search does
**not** return a mate score and does **not** return the draw-on-no-moves
score. It keeps searching and scores the board with static eval: the king
had no material term anyway; only the missing king-safety / piece-square
bits drop out.

## Verdict

The computer does **not** treat taking the king as a win (mate), and does
**not** treat it as a draw. It treats it as capturing a **zero-point king**
and then judging the leftover position by ordinary eval.
