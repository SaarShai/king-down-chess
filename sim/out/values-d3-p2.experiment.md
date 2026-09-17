# Piece values — values-d3-p2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [100, 29, 92, 13, 16] | 0.316 | -134 ± 26 | -149 | 0.0% | -2.10 | continue | 8.8% | 0.4% | 93 |
| L | 500 | 250 | [51, 27, 97, 21, 54] | 0.500 | +0 ± 29 | +0 | 50.0% | -0.03 | continue | 11.2% | 0.0% | 88 |
| G | 500 | 250 | [136, 22, 74, 4, 14] | 0.238 | -202 ± 26 | -217 | 0.0% | -2.60 | continue | 5.6% | 0.8% | 88 |
| M | 500 | 250 | [45, 32, 84, 49, 40] | 0.507 | +5 ± 28 | +5 | 63.4% | 0.05 | continue | 18.8% | 0.2% | 96 |
| S | 500 | 250 | [131, 41, 64, 5, 9] | 0.220 | -220 ± 23 | -254 | 0.0% | -2.75 | continue | 10.4% | 0.0% | 89 |
| pawn | 1500 | 750 | [213, 91, 296, 58, 92] | 0.408 | -64 ± 16 | -69 | 0.0% | -3.40 | H0 | 11.0% | 0.1% | 82 |

**One pawn = 64 ± 16 Elo** at this depth (the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -134 ± 26 | -2.08 ± 0.41 ** | < 1.70 ** | 2.60 | 3.50 | 112 |
| L (paladin) | +0 ± 29 | +0.00 ± 0.46 | 3.20 ± 0.46 | 3.70 | 4.00 | 320 |
| G (guard) | -202 ± 26 | -3.14 ± 0.40 ** | < 1.70 ** | 1.85 | 2.00 | 50 |
| M (maester) | +5 ± 28 | +0.08 ± 0.43 | 3.28 ± 0.43 | 3.50 | 3.50 | 328 |
| S (beast) | -220 ± 23 | -3.41 ± 0.36 ** | < 1.70 ** | 1.95 | 2.20 | 50 |

Implied value = knight (3.20) + Elo / 64.

** 3 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far below a
knight", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 112;
export const PALADIN_V = 320;
export const GUARD_V = 50;
export const MAESTER_V = 328;
export const BEAST_V = 50;
```
