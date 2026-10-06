# Piece values — pv-A-ao3-n1

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over23"}`.
Engine values: `A=505` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [96, 45, 216, 41, 102] | 0.504 | +3 ± 20 | +3 | 60.6% | 0.03 | continue | 9.2% | 0.0% | 86 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +3 ± 20 | +0.04 ± 0.26 | 3.20 ± 0.26 | 5.05 | 3.50 | 320 |

Implied value = n (3.16) + Elo / 77.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 320;
```
