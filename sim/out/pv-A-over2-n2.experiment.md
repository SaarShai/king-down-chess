# Piece values — pv-A-over2-n2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over2"}`.
Engine values: `A=194` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [188, 82, 178, 22, 30] | 0.312 | -137 ± 18 | -157 | 0.0% | -4.35 | H0 | 10.8% | 0.4% | 91 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -137 ± 18 | -1.78 ± 0.23 ** | < 1.66 ** | 1.94 | 3.50 | 138 |

Implied value = n (3.16) + Elo / 77.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 138;
```
