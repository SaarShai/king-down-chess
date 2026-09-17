# Piece values — buffv-a

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: `{"archerMove":"any","guardCaptures":"pawns","guardStep":2,"beastMove":"any"}`.
Engine values: `A=270 G=180 S=210 L=320 M=350` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [55, 30, 101, 23, 41] | 0.465 | -24 ± 28 | -26 | 4.6% | -0.46 | continue | 12.6% | 0.0% | 90 |
| L | 500 | 250 | [52, 25, 102, 22, 49] | 0.491 | -6 ± 29 | -7 | 33.6% | -0.14 | continue | 10.2% | 0.0% | 88 |
| G | 500 | 250 | [74, 54, 81, 20, 21] | 0.360 | -100 ± 26 | -112 | 0.0% | -1.71 | continue | 17.0% | 0.2% | 96 |
| M | 500 | 250 | [44, 34, 84, 47, 41] | 0.507 | +5 ± 28 | +5 | 63.4% | 0.05 | continue | 18.8% | 0.2% | 96 |
| S | 500 | 250 | [62, 41, 103, 17, 27] | 0.406 | -66 ± 27 | -75 | 0.0% | -1.22 | continue | 13.2% | 0.4% | 98 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -24 ± 28 | -0.38 ± 0.44 | 2.82 ± 0.44 | 2.70 | 3.50 | 282 |
| L (paladin) | -6 ± 29 | -0.10 ± 0.45 | 3.10 ± 0.45 | 3.20 | 4.00 | 310 |
| G (guard) | -100 ± 26 | -1.56 ± 0.41 ** | < 1.70 ** | 1.80 | 2.00 | 164 |
| M (maester) | +5 ± 28 | +0.08 ± 0.44 | 3.28 ± 0.44 | 3.50 | 3.50 | 328 |
| S (beast) | -66 ± 27 | -1.03 ± 0.41 | 2.17 ± 0.41 | 2.10 | 2.20 | 217 |

Implied value = knight (3.20) + Elo / 64.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 282;
export const PALADIN_V = 310;
export const GUARD_V = 164;
export const MAESTER_V = 328;
export const BEAST_V = 217;
```
