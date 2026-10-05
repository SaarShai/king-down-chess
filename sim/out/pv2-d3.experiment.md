# Piece values — pv2-d3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `O=293 R=365 B=299 M=321 S=414 A=463` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O | 1000 | 500 | [122, 59, 196, 56, 67] | 0.444 | -39 ± 20 | -43 | 0.0% | -1.46 | continue | 14.3% | 0.0% | 93 |
| R | 1000 | 500 | [59, 53, 199, 71, 118] | 0.568 | +48 ± 19 | +53 | 100.0% | 1.65 | continue | 14.0% | 0.2% | 93 |
| B | 1000 | 500 | [77, 82, 186, 72, 83] | 0.501 | +1 ± 19 | +1 | 52.8% | -0.04 | continue | 18.3% | 0.3% | 92 |
| G | 1000 | 500 | [245, 72, 139, 24, 20] | 0.251 | -190 ± 17 | -213 | 0.0% | -5.15 | H0 | 9.3% | 0.7% | 93 |
| M | 1000 | 500 | [74, 74, 197, 63, 92] | 0.512 | +9 ± 19 | +10 | 81.2% | 0.26 | continue | 16.6% | 0.1% | 99 |
| S | 1000 | 500 | [60, 33, 189, 62, 156] | 0.611 | +78 ± 20 | +83 | 100.0% | 2.54 | continue | 10.4% | 0.1% | 86 |
| pawn | 3000 | 1500 | [415, 219, 578, 124, 164] | 0.401 | -70 ± 11 | -77 | 0.0% | -7.46 | H0 | 12.5% | 0.1% | 87 |

**One pawn = 70 ± 11 Elo** at this depth
(the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| O (ogre) | -39 ± 20 | -0.56 ± 0.28 | 2.60 ± 0.28 | 2.93 | 3.00 | 260 |
| R (rook) | +48 ± 19 | +0.68 ± 0.27 | 3.84 ± 0.27 | 3.65 | 5.00 | 384 |
| B (bishop) | +1 ± 19 | +0.01 ± 0.27 | 3.17 ± 0.27 | 2.99 | 3.00 | 317 |
| G (guard) | -190 ± 17 | -2.71 ± 0.25 ** | < 1.66 ** | 0.96 | 2.00 | 50 |
| M (maester) | +9 ± 19 | +0.12 ± 0.27 | 3.28 ± 0.27 | 3.21 | 3.50 | 328 |
| S (beast) | +78 ± 20 | +1.11 ± 0.29 | 4.27 ± 0.29 | 4.14 | 2.20 | 427 |

Implied value = n (3.16) + Elo / 70.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const OGRE_V = 260;
export const ROOK_V = 384;
export const BISHOP_V = 317;
export const GUARD_V = 50;
export const MAESTER_V = 328;
export const BEAST_V = 427;
```
