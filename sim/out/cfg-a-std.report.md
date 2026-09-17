# Sim report — cfg-a-std

3200 games. White score **0.533** (95% 0.517–0.550),
white advantage **+23 ± 11 Elo**.
Decisive 86.8% · draws 13.1% · capped 0.2% (counted apart, never as draws).
Plies: mean 86.6 ± 39.5, median 81. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4645 · normalized Elo +25 · LOS 100.0% ·
SPRT LLR 2.43 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1495 | 424 | 1281 | 0.533 | 0.517–0.550 | +23 ±11 | 86.8% | 13.1% | 0.2% | 86.6±39.5 | 0.40 | 0.040 | 0.630 | 0.17 | 0.95 | 0.53 | -0.001 | 0.503 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | K | Q | N | R | P |
|---|---|---|---|---|---|---|
| use | 1.07 | 2.15 | 1.78 | 1.32 | 1.51 | 0.53 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2776 | 86.8% |
| adjudicatedDraw | 266 | 8.3% |
| drawRepetition | 94 | 2.9% |
| drawMaterial | 42 | 1.3% |
| draw50 | 13 | 0.4% |
| plyCap | 5 | 0.2% |
| stalemate | 4 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 73497 | 15614 | 28075 | 51200 | 22074 | 43.1% |
| R | 52351 | 12379 | 7128 | 12800 | 5675 | 44.3% |
| N | 45627 | 9992 | 10247 | 12800 | 2566 | 20.0% |
| K | 37304 | 3514 | 0 | 6400 | 6400 | 100.0% |
| B | 37072 | 10006 | 9429 | 12800 | 3371 | 26.3% |
| Q | 30843 | 8183 | 4792 | 6400 | 2551 | 39.9% |
| G | 344 | 0 | 18 | 0 | 67 | 0.0% |
| L | 7 | 2 | 0 | 0 | 3 | 0.0% |
| A | 0 | 0 | 1 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 2 | 0.00 |
| promotions | 1051 | 0.33 |
| checks | 22093 | 6.90 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 55 (1.7%) |
| games where a king never moved | 929 (29.0%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest |
|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.000 | -0.001 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BKQNRRNB | 160 | 70 | 21 | 69 | 0.503 | 0.431–0.575 | +2 ±50 | 86.9% | 13.1% | 0.0% | 91.2±40.2 | 0.40 | 0.042 | 0.634 | 0.18 | 0.96 | 0.53 | -0.008 | 0.504 | - |
| NNQBBKRR | 160 | 66 | 26 | 68 | 0.494 | 0.423–0.565 | -4 ±49 | 83.8% | 16.3% | 0.0% | 89.3±34.2 | 0.40 | 0.040 | 0.639 | 0.17 | 0.95 | 0.54 | -0.039 | 0.501 | - |
| KNRQBBRN | 160 | 67 | 28 | 65 | 0.506 | 0.436–0.577 | +4 ±49 | 82.5% | 17.5% | 0.0% | 82.7±31.2 | 0.40 | 0.049 | 0.642 | 0.17 | 0.95 | 0.54 | -0.051 | 0.499 | - |
| RNQKNRBB | 160 | 71 | 15 | 74 | 0.491 | 0.417–0.564 | -7 ±51 | 90.6% | 9.4% | 0.0% | 83.7±37.5 | 0.39 | 0.037 | 0.626 | 0.18 | 0.95 | 0.55 | 0.031 | 0.504 | - |
| RNQBBNRK | 160 | 70 | 17 | 73 | 0.491 | 0.417–0.564 | -7 ±51 | 89.4% | 10.6% | 0.0% | 87.4±38.2 | 0.39 | 0.036 | 0.638 | 0.14 | 0.96 | 0.53 | 0.019 | 0.501 | - |
| NRNQRKBB | 160 | 71 | 23 | 66 | 0.516 | 0.444–0.587 | +11 ±50 | 85.6% | 13.8% | 0.6% | 88.4±40.8 | 0.38 | 0.041 | 0.624 | 0.19 | 0.95 | 0.51 | -0.017 | 0.499 | - |
| RRNKQNBB | 160 | 73 | 20 | 67 | 0.519 | 0.446–0.591 | +13 ±50 | 87.5% | 12.5% | 0.0% | 81.5±38.5 | 0.39 | 0.045 | 0.638 | 0.16 | 0.95 | 0.55 | 0.003 | 0.501 | - |
| RBBQNKNR | 160 | 71 | 26 | 63 | 0.525 | 0.454–0.596 | +17 ±49 | 83.8% | 16.3% | 0.0% | 80.8±34.9 | 0.40 | 0.040 | 0.641 | 0.16 | 0.95 | 0.57 | -0.033 | 0.500 | - |
| NRRQNBBK | 160 | 75 | 20 | 65 | 0.531 | 0.459–0.604 | +22 ±50 | 87.5% | 12.5% | 0.0% | 88.5±36.2 | 0.41 | 0.037 | 0.621 | 0.19 | 0.95 | 0.54 | 0.006 | 0.507 | balance |
| KBNQBRNR | 160 | 76 | 19 | 65 | 0.534 | 0.462–0.607 | +24 ±50 | 88.1% | 11.9% | 0.0% | 86.3±34.5 | 0.42 | 0.040 | 0.636 | 0.16 | 0.96 | 0.53 | 0.013 | 0.507 | balance |
| RQRKNNBB | 160 | 78 | 16 | 66 | 0.537 | 0.464–0.611 | +26 ±51 | 90.0% | 10.0% | 0.0% | 83.8±40.5 | 0.38 | 0.036 | 0.618 | 0.16 | 0.96 | 0.54 | 0.033 | 0.498 | balance |
| KQBBNNRR | 160 | 81 | 11 | 68 | 0.541 | 0.466–0.615 | +28 ±52 | 93.1% | 6.9% | 0.0% | 87.0±38.4 | 0.39 | 0.037 | 0.626 | 0.17 | 0.96 | 0.52 | 0.065 | 0.505 | balance |
| RNBBKQRN | 160 | 77 | 19 | 64 | 0.541 | 0.468–0.613 | +28 ±50 | 88.1% | 11.3% | 0.6% | 90.0±44.7 | 0.40 | 0.045 | 0.622 | 0.19 | 0.95 | 0.50 | 0.015 | 0.504 | balance |
| KNNRBRQB | 160 | 80 | 15 | 65 | 0.547 | 0.473–0.620 | +33 ±51 | 90.6% | 9.4% | 0.0% | 76.5±43.7 | 0.47 | 0.038 | 0.623 | 0.19 | 0.94 | 0.53 | 0.042 | 0.519 | balance |
| BQRNRNKB | 160 | 75 | 25 | 60 | 0.547 | 0.476–0.618 | +33 ±49 | 84.4% | 15.6% | 0.0% | 87.5±37.4 | 0.42 | 0.041 | 0.636 | 0.17 | 0.95 | 0.54 | -0.021 | 0.505 | balance |
| RRBNQBNK | 160 | 76 | 25 | 59 | 0.553 | 0.482–0.624 | +37 ±49 | 84.4% | 15.6% | 0.0% | 82.5±36.3 | 0.40 | 0.039 | 0.637 | 0.18 | 0.95 | 0.56 | -0.019 | 0.503 | balance |
| BNRBKQNR | 160 | 81 | 17 | 62 | 0.559 | 0.487–0.632 | +41 ±50 | 89.4% | 10.0% | 0.6% | 93.4±46.2 | 0.39 | 0.037 | 0.614 | 0.18 | 0.96 | 0.51 | 0.033 | 0.503 | balance |
| NKRNQBBR | 160 | 78 | 26 | 56 | 0.569 | 0.499–0.639 | +48 ±49 | 83.8% | 15.6% | 0.6% | 90.2±41.8 | 0.40 | 0.041 | 0.634 | 0.15 | 0.96 | 0.52 | -0.021 | 0.500 | balance |
| BKQRNNRB | 160 | 81 | 23 | 56 | 0.578 | 0.507–0.649 | +55 ±49 | 85.6% | 14.4% | 0.0% | 92.5±41.9 | 0.38 | 0.044 | 0.628 | 0.16 | 0.96 | 0.51 | 0.001 | 0.497 | balance |
| RNNQBKRB | 160 | 78 | 32 | 50 | 0.588 | 0.520–0.655 | +61 ±47 | 80.0% | 19.4% | 0.6% | 88.3±43.8 | 0.38 | 0.042 | 0.631 | 0.16 | 0.96 | 0.50 | -0.053 | 0.495 | balance,drawRate |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KNNRBRQB | 160 | 80 | 15 | 65 | 0.547 | 0.473–0.620 | +33 ±51 | 90.6% | 9.4% | 0.0% | 76.5±43.7 | 0.47 | 0.038 | 0.623 | 0.19 | 0.94 | 0.53 | 0.042 | 0.519 | balance |
| NRRQNBBK | 160 | 75 | 20 | 65 | 0.531 | 0.459–0.604 | +22 ±50 | 87.5% | 12.5% | 0.0% | 88.5±36.2 | 0.41 | 0.037 | 0.621 | 0.19 | 0.95 | 0.54 | 0.006 | 0.507 | balance |
| KBNQBRNR | 160 | 76 | 19 | 65 | 0.534 | 0.462–0.607 | +24 ±50 | 88.1% | 11.9% | 0.0% | 86.3±34.5 | 0.42 | 0.040 | 0.636 | 0.16 | 0.96 | 0.53 | 0.013 | 0.507 | balance |
| KQBBNNRR | 160 | 81 | 11 | 68 | 0.541 | 0.466–0.615 | +28 ±52 | 93.1% | 6.9% | 0.0% | 87.0±38.4 | 0.39 | 0.037 | 0.626 | 0.17 | 0.96 | 0.52 | 0.065 | 0.505 | balance |
| BQRNRNKB | 160 | 75 | 25 | 60 | 0.547 | 0.476–0.618 | +33 ±49 | 84.4% | 15.6% | 0.0% | 87.5±37.4 | 0.42 | 0.041 | 0.636 | 0.17 | 0.95 | 0.54 | -0.021 | 0.505 | balance |
| RNBBKQRN | 160 | 77 | 19 | 64 | 0.541 | 0.468–0.613 | +28 ±50 | 88.1% | 11.3% | 0.6% | 90.0±44.7 | 0.40 | 0.045 | 0.622 | 0.19 | 0.95 | 0.50 | 0.015 | 0.504 | balance |
| RNQKNRBB | 160 | 71 | 15 | 74 | 0.491 | 0.417–0.564 | -7 ±51 | 90.6% | 9.4% | 0.0% | 83.7±37.5 | 0.39 | 0.037 | 0.626 | 0.18 | 0.95 | 0.55 | 0.031 | 0.504 | - |
| BKQNRRNB | 160 | 70 | 21 | 69 | 0.503 | 0.431–0.575 | +2 ±50 | 86.9% | 13.1% | 0.0% | 91.2±40.2 | 0.40 | 0.042 | 0.634 | 0.18 | 0.96 | 0.53 | -0.008 | 0.504 | - |
| BNRBKQNR | 160 | 81 | 17 | 62 | 0.559 | 0.487–0.632 | +41 ±50 | 89.4% | 10.0% | 0.6% | 93.4±46.2 | 0.39 | 0.037 | 0.614 | 0.18 | 0.96 | 0.51 | 0.033 | 0.503 | balance |
| RRBNQBNK | 160 | 76 | 25 | 59 | 0.553 | 0.482–0.624 | +37 ±49 | 84.4% | 15.6% | 0.0% | 82.5±36.3 | 0.40 | 0.039 | 0.637 | 0.18 | 0.95 | 0.56 | -0.019 | 0.503 | balance |
| NNQBBKRR | 160 | 66 | 26 | 68 | 0.494 | 0.423–0.565 | -4 ±49 | 83.8% | 16.3% | 0.0% | 89.3±34.2 | 0.40 | 0.040 | 0.639 | 0.17 | 0.95 | 0.54 | -0.039 | 0.501 | - |
| RNQBBNRK | 160 | 70 | 17 | 73 | 0.491 | 0.417–0.564 | -7 ±51 | 89.4% | 10.6% | 0.0% | 87.4±38.2 | 0.39 | 0.036 | 0.638 | 0.14 | 0.96 | 0.53 | 0.019 | 0.501 | - |
| RRNKQNBB | 160 | 73 | 20 | 67 | 0.519 | 0.446–0.591 | +13 ±50 | 87.5% | 12.5% | 0.0% | 81.5±38.5 | 0.39 | 0.045 | 0.638 | 0.16 | 0.95 | 0.55 | 0.003 | 0.501 | - |
| NKRNQBBR | 160 | 78 | 26 | 56 | 0.569 | 0.499–0.639 | +48 ±49 | 83.8% | 15.6% | 0.6% | 90.2±41.8 | 0.40 | 0.041 | 0.634 | 0.15 | 0.96 | 0.52 | -0.021 | 0.500 | balance |
| RBBQNKNR | 160 | 71 | 26 | 63 | 0.525 | 0.454–0.596 | +17 ±49 | 83.8% | 16.3% | 0.0% | 80.8±34.9 | 0.40 | 0.040 | 0.641 | 0.16 | 0.95 | 0.57 | -0.033 | 0.500 | - |
| NRNQRKBB | 160 | 71 | 23 | 66 | 0.516 | 0.444–0.587 | +11 ±50 | 85.6% | 13.8% | 0.6% | 88.4±40.8 | 0.38 | 0.041 | 0.624 | 0.19 | 0.95 | 0.51 | -0.017 | 0.499 | - |
| KNRQBBRN | 160 | 67 | 28 | 65 | 0.506 | 0.436–0.577 | +4 ±49 | 82.5% | 17.5% | 0.0% | 82.7±31.2 | 0.40 | 0.049 | 0.642 | 0.17 | 0.95 | 0.54 | -0.051 | 0.499 | - |
| RQRKNNBB | 160 | 78 | 16 | 66 | 0.537 | 0.464–0.611 | +26 ±51 | 90.0% | 10.0% | 0.0% | 83.8±40.5 | 0.38 | 0.036 | 0.618 | 0.16 | 0.96 | 0.54 | 0.033 | 0.498 | balance |
| BKQRNNRB | 160 | 81 | 23 | 56 | 0.578 | 0.507–0.649 | +55 ±49 | 85.6% | 14.4% | 0.0% | 92.5±41.9 | 0.38 | 0.044 | 0.628 | 0.16 | 0.96 | 0.51 | 0.001 | 0.497 | balance |
| RNNQBKRB | 160 | 78 | 32 | 50 | 0.588 | 0.520–0.655 | +61 ±47 | 80.0% | 19.4% | 0.6% | 88.3±43.8 | 0.38 | 0.042 | 0.631 | 0.16 | 0.96 | 0.50 | -0.053 | 0.495 | balance,drawRate |

---
**Two axes, reported apart.** Balance = |white score − 0.5|; interest = the Browne-fitted sum below.
Never merge them: the research shows the two objectives fight (variant-balance.md §7).

interest = +0.2·killerMove −0.16·leadChange +0.13·uncertaintyLate +0.12·drama +0.07·permanence +0.2·fairyUse +0.12·excessDecisiveness
— Browne's fitted signs (docs/research/variant-balance.md §7). **Lead change is negative**: churn
reads as chaos, not tension. "xDec" = decisiveness minus what |white score − 0.5| predicts for it,
fitted over the configurations of this run; raw decisiveness is never a reward term, because
corr(draw rate, white points) = −0.92 in Chess960.
"gates" lists failed viability gates (balance 0.03, timeouts 0.05, duration 0.5, utilisation 0.25, draw-rate worst decile); a gated
arrangement is rejected, not scored down.
"killer", "unc", "drama", "perm" use the squashed lead L = 2·σ(cp/350) − 1 (variant-balance.md §3.0).
"capped" games hit the ply cap: their own class, never counted as draws (cutechess counts them as draws).
Survival counts pieces on the board at the end, so a promotion target can exceed 100%.
Statistics follow docs/research/sim-methodology.md §2.
