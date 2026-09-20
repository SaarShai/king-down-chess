# Piece values — pb-values-refresh

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [12, 8, 91, 25, 114] | 0.721 | +165 ± 25 | +186 | 100.0% | 2.38 | continue | 7.0% | 0.4% | 83 |
| L | 500 | 250 | [44, 17, 93, 34, 62] | 0.553 | +37 ± 29 | +38 | 99.3% | 0.59 | continue | 10.6% | 0.0% | 90 |
| G | 500 | 250 | [128, 36, 73, 7, 6] | 0.227 | -213 ± 23 | -253 | 0.0% | -2.75 | continue | 10.0% | 0.2% | 94 |
| M | 500 | 250 | [41, 35, 119, 24, 31] | 0.469 | -22 ± 25 | -26 | 4.7% | -0.46 | continue | 18.0% | 0.2% | 96 |
| S | 500 | 250 | [40, 29, 78, 49, 54] | 0.548 | +33 ± 29 | +35 | 98.9% | 0.55 | continue | 16.2% | 0.2% | 90 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +165 ± 25 | +2.58 ± 0.39 ** | > 4.66 ** | 5.05 | 3.50 | 574 |
| L (paladin) | +37 ± 29 | +0.58 ± 0.46 | 3.74 ± 0.46 | 3.26 | 4.00 | 374 |
| G (guard) | -213 ± 23 | -3.33 ± 0.36 ** | < 1.66 ** | 0.96 | 2.00 | 50 |
| M (maester) | -22 ± 25 | -0.34 ± 0.39 | 2.82 ± 0.39 | 3.20 | 3.50 | 282 |
| S (beast) | +33 ± 29 | +0.52 ± 0.45 | 3.68 ± 0.45 | 3.08 | 2.20 | 368 |

Implied value = n (3.16) + Elo / 64.

** 2 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 574;
export const PALADIN_V = 374;
export const GUARD_V = 50;
export const MAESTER_V = 282;
export const BEAST_V = 368;
```
