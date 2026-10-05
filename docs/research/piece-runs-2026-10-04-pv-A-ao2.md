# Piece values — pv-A-ao2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **rook** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over2"}`.
Engine values: `O=293 R=365 B=299 M=321 S=414 A=463` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [200, 78, 178, 20, 24] | 0.295 | -151 ± 17 | -176 | 0.0% | -4.67 | H0 | 11.4% | 0.0% | 88 |

**One pawn = 70 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs r | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -151 ± 17 | -2.16 ± 0.25 ** | < 2.15 ** | 4.63 | 3.50 | 149 |

Implied value = r (3.65) + Elo / 70.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 149;
```
