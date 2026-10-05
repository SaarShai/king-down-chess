# Piece values — pv2-A-vsR-d4

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **rook** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 4, 600 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `O=293 R=365 B=299 M=321 S=414 A=463` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 600 | 300 | [22, 39, 106, 60, 73] | 0.603 | +72 ± 23 | +84 | 100.0% | 1.55 | continue | 19.0% | 0.2% | 105 |
| pawn | 1800 | 900 | [236, 216, 288, 100, 60] | 0.370 | -92 ± 13 | -108 | 0.0% | -5.97 | H0 | 22.5% | 0.2% | 99 |

**One pawn = 92 ± 13 Elo** at this depth
(the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs r | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +72 ± 23 | +0.78 ± 0.25 | 4.43 ± 0.25 | 4.63 | 3.50 | 443 |

Implied value = r (3.65) + Elo / 92.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 443;
```
