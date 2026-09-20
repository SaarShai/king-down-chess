# Piece values — ov-V-ortho

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 300 games per arm, 4 random opening plies.
Rules: `{"reaverStep":"ortho"}`.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| V | 300 | 150 | [12, 13, 55, 18, 52] | 0.642 | +101 ± 35 | +110 | 100.0% | 0.98 | continue | 11.7% | 0.0% | 88 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| V (reaver) | +101 ± 35 | +1.58 ± 0.55 ** | > 4.66 ** | 3.50 | 3.75 | 474 |

Implied value = knight (3.16) + Elo / 64.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const REAVER_V = 474;
```
