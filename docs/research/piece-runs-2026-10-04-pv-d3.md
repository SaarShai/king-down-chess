# Piece values — pv-d3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O | 1000 | 500 | [86, 69, 219, 61, 65] | 0.475 | -17 ± 18 | -20 | 3.2% | -0.74 | continue | 16.4% | 0.2% | 90 |
| R | 1000 | 500 | [69, 48, 203, 65, 115] | 0.554 | +38 ± 20 | +42 | 100.0% | 1.30 | continue | 12.3% | 0.2% | 93 |
| B | 1000 | 500 | [93, 76, 187, 63, 81] | 0.482 | -13 ± 20 | -14 | 10.0% | -0.53 | continue | 16.2% | 0.3% | 90 |
| G | 1000 | 500 | [253, 49, 163, 20, 15] | 0.247 | -193 ± 17 | -221 | 0.0% | -5.23 | H0 | 7.4% | 0.5% | 93 |
| M | 1000 | 500 | [77, 80, 184, 74, 85] | 0.505 | +3 ± 19 | +4 | 63.8% | 0.06 | continue | 17.1% | 0.3% | 96 |
| S | 1000 | 500 | [63, 39, 176, 64, 158] | 0.607 | +76 ± 20 | +79 | 100.0% | 2.43 | continue | 10.2% | 0.3% | 86 |
| pawn | 3000 | 1500 | [455, 187, 579, 116, 163] | 0.391 | -77 ± 11 | -83 | 0.0% | -8.00 | H0 | 11.4% | 0.2% | 86 |

**One pawn = 77 ± 11 Elo** at this depth
(the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| O (ogre) | -17 ± 18 | -0.23 ± 0.24 | 2.93 ± 0.24 | 3.18 | 3.00 | 293 |
| R (rook) | +38 ± 20 | +0.49 ± 0.25 | 3.65 ± 0.25 | 4.49 | 5.00 | 365 |
| B (bishop) | -13 ± 20 | -0.17 ± 0.25 | 2.99 ± 0.25 | 3.22 | 3.00 | 299 |
| G (guard) | -193 ± 17 | -2.51 ± 0.22 ** | < 1.66 ** | 0.96 | 2.00 | 65 |
| M (maester) | +3 ± 19 | +0.05 ± 0.25 | 3.21 ± 0.25 | 3.18 | 3.50 | 321 |
| S (beast) | +76 ± 20 | +0.98 ± 0.26 | 4.14 ± 0.26 | 4.34 | 2.20 | 414 |

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
export const OGRE_V = 293;
export const ROOK_V = 365;
export const BISHOP_V = 299;
export const GUARD_V = 65;
export const MAESTER_V = 321;
export const BEAST_V = 414;
```
