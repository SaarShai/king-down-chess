# Piece values — buffv-p1

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `A=270 G=180 S=210 L=320 M=350` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [101, 35, 81, 14, 19] | 0.315 | -135 ± 27 | -145 | 0.0% | -2.07 | continue | 10.4% | 0.2% | 93 |
| L | 500 | 250 | [52, 25, 104, 22, 47] | 0.487 | -9 ± 29 | -10 | 26.8% | -0.19 | continue | 10.2% | 0.0% | 88 |
| G | 500 | 250 | [133, 24, 77, 4, 12] | 0.238 | -202 ± 25 | -223 | 0.0% | -2.63 | continue | 6.0% | 0.8% | 88 |
| M | 500 | 250 | [44, 33, 85, 49, 39] | 0.506 | +4 ± 28 | +5 | 61.6% | 0.04 | continue | 18.8% | 0.4% | 96 |
| S | 500 | 250 | [127, 42, 60, 9, 12] | 0.237 | -203 ± 25 | -225 | 0.0% | -2.64 | continue | 10.4% | 0.2% | 88 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -135 ± 27 | -2.11 ± 0.42 ** | < 1.70 ** | 2.70 | 3.50 | 109 |
| L (paladin) | -9 ± 29 | -0.14 ± 0.45 | 3.06 ± 0.45 | 3.20 | 4.00 | 306 |
| G (guard) | -202 ± 25 | -3.16 ± 0.39 ** | < 1.70 ** | 1.80 | 2.00 | 50 |
| M (maester) | +4 ± 28 | +0.07 ± 0.43 | 3.27 ± 0.43 | 3.50 | 3.50 | 327 |
| S (beast) | -203 ± 25 | -3.17 ± 0.39 ** | < 1.70 ** | 2.10 | 2.20 | 50 |

Implied value = knight (3.20) + Elo / 64.

** 3 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 109;
export const PALADIN_V = 306;
export const GUARD_V = 50;
export const MAESTER_V = 327;
export const BEAST_V = 50;
```
