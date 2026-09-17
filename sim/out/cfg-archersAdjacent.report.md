# Sim report — cfg-archersAdjacent

3200 games. White score **0.522** (95% 0.510–0.534),
white advantage **+15 ± 9 Elo**.
Decisive 50.8% · draws 38.5% · capped 10.7% (counted apart, never as draws).
Plies: mean 156.6 ± 81.3, median 134. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3556 · normalized Elo +22 · LOS 100.0% ·
SPRT LLR 2.06 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 883 | 1575 | 742 | 0.522 | 0.510–0.534 | +15 ±9 | 50.8% | 38.5% | 10.7% | 156.6±81.3 | 0.28 | 0.034 | 0.641 | 0.10 | 0.97 | 0.38 | 1.65 | 0.008 | 0.474 | 0.364 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | N | R | S | K | B | Q | A | P | M | G | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.19 | 1.43 | 0.45 | 2.68 | 1.32 | 1.04 | 1.44 | 0.38 | 2.89 | 2.55 | 0.94 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1622 | 50.7% |
| adjudicatedDraw | 698 | 21.8% |
| draw50 | 420 | 13.1% |
| plyCap | 343 | 10.7% |
| drawRepetition | 106 | 3.3% |
| drawMaterial | 7 | 0.2% |
| checkmate | 3 | 0.1% |
| stalemate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 94646 | 19428 | 39259 | 51200 | 11201 | 21.9% |
| A | 90208 | 14742 | 2731 | 12800 | 10069 | 78.7% |
| K | 83913 | 3240 | 0 | 6400 | 6400 | 100.0% |
| G | 55982 | 0 | 136 | 4480 | 4407 | 98.4% |
| M | 49760 | 1953 | 1385 | 3520 | 2135 | 60.7% |
| R | 35775 | 5391 | 3864 | 5120 | 1256 | 24.5% |
| B | 28950 | 4790 | 3376 | 4480 | 1104 | 24.6% |
| N | 26194 | 4214 | 3883 | 4480 | 599 | 13.4% |
| Q | 16304 | 3458 | 2966 | 3200 | 908 | 28.4% |
| S | 10522 | 1220 | 1560 | 4800 | 3240 | 67.5% |
| L | 8797 | 1252 | 528 | 1920 | 141 | 7.3% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 14742 | 4.61 |
| beastChainMoves | 1125 | 0.35 |
| beastChainCaptures | 1220 | 0.38 |
| maesterSwaps | 18594 | 5.81 |
| maesterLongSwaps | 3876 | 1.21 |
| paladinSacrifices | 1252 | 0.39 |
| promotions | 740 | 0.23 |
| checks | 24250 | 7.58 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 427 (13.3%) |
| games where a king never moved | 494 (15.4%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | 0.004 | 0.008 | 0.001 | -0.034 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SQSAAMKL | 160 | 35 | 90 | 35 | 0.500 | 0.449–0.551 | +0 ±36 | 43.8% | 40.6% | 15.6% | 168.8±84.0 | 0.27 | 0.038 | 0.632 | 0.09 | 0.97 | 0.35 | 1.69 | -0.043 | 0.467 | 0.351 | timeouts |
| NSAAGKRB | 160 | 34 | 94 | 32 | 0.506 | 0.457–0.556 | +4 ±35 | 41.3% | 46.3% | 12.5% | 179.2±80.1 | 0.27 | 0.033 | 0.641 | 0.10 | 0.97 | 0.34 | 1.56 | -0.073 | 0.467 | 0.351 | timeouts |
| QKBGMAAN | 160 | 43 | 78 | 39 | 0.512 | 0.457–0.568 | +9 ±39 | 51.2% | 38.1% | 10.6% | 159.1±78.7 | 0.29 | 0.038 | 0.646 | 0.11 | 0.97 | 0.38 | 2.01 | 0.021 | 0.478 | 0.478 | timeouts |
| GAAQKGBN | 160 | 50 | 65 | 45 | 0.516 | 0.456–0.575 | +11 ±41 | 59.4% | 28.1% | 12.5% | 137.3±86.5 | 0.33 | 0.033 | 0.631 | 0.12 | 0.96 | 0.39 | 1.58 | 0.100 | 0.492 | 0.492 | timeouts |
| MGKMRAAN | 160 | 21 | 112 | 27 | 0.481 | 0.439–0.524 | -13 ±29 | 30.0% | 53.1% | 16.9% | 178.1±84.0 | 0.25 | 0.044 | 0.666 | 0.06 | 0.97 | 0.35 | 1.87 | -0.197 | 0.452 | 0.452 | timeouts,drawRate |
| NRSKBQAA | 160 | 53 | 60 | 47 | 0.519 | 0.458–0.580 | +13 ±43 | 62.5% | 31.3% | 6.3% | 132.1±76.0 | 0.36 | 0.033 | 0.633 | 0.12 | 0.96 | 0.42 | 0.92 | 0.128 | 0.483 | 0.402 | timeouts |
| BRAALSNK | 160 | 48 | 71 | 41 | 0.522 | 0.464–0.580 | +15 ±40 | 55.6% | 37.5% | 6.9% | 155.2±72.4 | 0.28 | 0.028 | 0.629 | 0.12 | 0.97 | 0.39 | 1.04 | 0.057 | 0.478 | 0.370 | timeouts |
| MKAALRBQ | 160 | 58 | 51 | 51 | 0.522 | 0.458–0.586 | +15 ±44 | 68.1% | 25.0% | 6.9% | 133.7±75.3 | 0.31 | 0.026 | 0.623 | 0.11 | 0.97 | 0.41 | 1.50 | 0.182 | 0.492 | 0.466 | timeouts |
| NKRAAQSG | 160 | 34 | 81 | 45 | 0.466 | 0.411–0.520 | -24 ±38 | 49.4% | 40.6% | 10.0% | 160.9±81.8 | 0.31 | 0.030 | 0.649 | 0.12 | 0.97 | 0.36 | 1.86 | -0.017 | 0.483 | 0.369 | balance,timeouts |
| RRSKAAQG | 160 | 37 | 97 | 26 | 0.534 | 0.486–0.583 | +24 ±34 | 39.4% | 51.9% | 8.8% | 148.6±86.0 | 0.27 | 0.033 | 0.657 | 0.08 | 0.97 | 0.38 | 1.80 | -0.117 | 0.466 | 0.364 | balance,timeouts |
| AAKRMGML | 160 | 40 | 91 | 29 | 0.534 | 0.484–0.585 | +24 ±35 | 43.1% | 43.8% | 13.1% | 176.4±78.4 | 0.28 | 0.032 | 0.646 | 0.08 | 0.97 | 0.35 | 1.59 | -0.079 | 0.469 | 0.421 | balance,timeouts |
| MKRNMSAA | 160 | 45 | 81 | 34 | 0.534 | 0.480–0.589 | +24 ±38 | 49.4% | 39.4% | 11.3% | 179.0±73.0 | 0.25 | 0.043 | 0.650 | 0.10 | 0.97 | 0.36 | 1.51 | -0.017 | 0.466 | 0.356 | balance,timeouts |
| SAAKRNMQ | 160 | 40 | 68 | 52 | 0.463 | 0.404–0.521 | -26 ±41 | 57.5% | 35.6% | 6.9% | 136.2±73.8 | 0.29 | 0.040 | 0.660 | 0.11 | 0.97 | 0.38 | 1.66 | 0.061 | 0.482 | 0.359 | balance,timeouts |
| KBBNRGAA | 160 | 57 | 58 | 45 | 0.537 | 0.476–0.599 | +26 ±43 | 63.7% | 28.7% | 7.5% | 140.6±75.3 | 0.31 | 0.031 | 0.641 | 0.11 | 0.97 | 0.43 | 1.81 | 0.124 | 0.489 | 0.489 | balance,timeouts |
| AAGKRNLS | 160 | 47 | 78 | 35 | 0.537 | 0.482–0.593 | +26 ±38 | 51.2% | 37.5% | 11.3% | 148.8±81.8 | 0.25 | 0.033 | 0.625 | 0.08 | 0.97 | 0.38 | 1.39 | -0.001 | 0.463 | 0.339 | balance,timeouts |
| GGBAABRK | 160 | 42 | 88 | 30 | 0.537 | 0.486–0.589 | +26 ±36 | 45.0% | 44.4% | 10.6% | 158.1±80.9 | 0.25 | 0.031 | 0.656 | 0.09 | 0.97 | 0.38 | 1.86 | -0.064 | 0.464 | 0.464 | balance,timeouts |
| AANRGKBS | 160 | 40 | 92 | 28 | 0.537 | 0.487–0.588 | +26 ±35 | 42.5% | 42.5% | 15.0% | 173.7±81.4 | 0.23 | 0.037 | 0.640 | 0.08 | 0.97 | 0.36 | 1.63 | -0.089 | 0.455 | 0.338 | balance,timeouts |
| AASBKLGQ | 160 | 52 | 74 | 34 | 0.556 | 0.500–0.612 | +39 ±39 | 53.8% | 30.0% | 16.3% | 148.2±90.6 | 0.28 | 0.030 | 0.611 | 0.08 | 0.97 | 0.39 | 1.44 | 0.007 | 0.468 | 0.350 | balance,timeouts |
| SBAAQKMS | 160 | 41 | 98 | 21 | 0.563 | 0.515–0.610 | +44 ±33 | 38.8% | 51.2% | 10.0% | 174.5±80.5 | 0.23 | 0.034 | 0.650 | 0.07 | 0.97 | 0.34 | 1.70 | -0.148 | 0.453 | 0.342 | balance,timeouts |
| NAAKRSBN | 160 | 66 | 48 | 46 | 0.563 | 0.498–0.627 | +44 ±45 | 70.0% | 24.4% | 5.6% | 143.0±69.0 | 0.32 | 0.037 | 0.641 | 0.14 | 0.97 | 0.43 | 1.03 | 0.164 | 0.496 | 0.404 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NAAKRSBN | 160 | 66 | 48 | 46 | 0.563 | 0.498–0.627 | +44 ±45 | 70.0% | 24.4% | 5.6% | 143.0±69.0 | 0.32 | 0.037 | 0.641 | 0.14 | 0.97 | 0.43 | 1.03 | 0.164 | 0.496 | 0.404 | balance,timeouts |
| MKAALRBQ | 160 | 58 | 51 | 51 | 0.522 | 0.458–0.586 | +15 ±44 | 68.1% | 25.0% | 6.9% | 133.7±75.3 | 0.31 | 0.026 | 0.623 | 0.11 | 0.97 | 0.41 | 1.50 | 0.182 | 0.492 | 0.466 | timeouts |
| GAAQKGBN | 160 | 50 | 65 | 45 | 0.516 | 0.456–0.575 | +11 ±41 | 59.4% | 28.1% | 12.5% | 137.3±86.5 | 0.33 | 0.033 | 0.631 | 0.12 | 0.96 | 0.39 | 1.58 | 0.100 | 0.492 | 0.492 | timeouts |
| KBBNRGAA | 160 | 57 | 58 | 45 | 0.537 | 0.476–0.599 | +26 ±43 | 63.7% | 28.7% | 7.5% | 140.6±75.3 | 0.31 | 0.031 | 0.641 | 0.11 | 0.97 | 0.43 | 1.81 | 0.124 | 0.489 | 0.489 | balance,timeouts |
| NRSKBQAA | 160 | 53 | 60 | 47 | 0.519 | 0.458–0.580 | +13 ±43 | 62.5% | 31.3% | 6.3% | 132.1±76.0 | 0.36 | 0.033 | 0.633 | 0.12 | 0.96 | 0.42 | 0.92 | 0.128 | 0.483 | 0.402 | timeouts |
| NKRAAQSG | 160 | 34 | 81 | 45 | 0.466 | 0.411–0.520 | -24 ±38 | 49.4% | 40.6% | 10.0% | 160.9±81.8 | 0.31 | 0.030 | 0.649 | 0.12 | 0.97 | 0.36 | 1.86 | -0.017 | 0.483 | 0.369 | balance,timeouts |
| SAAKRNMQ | 160 | 40 | 68 | 52 | 0.463 | 0.404–0.521 | -26 ±41 | 57.5% | 35.6% | 6.9% | 136.2±73.8 | 0.29 | 0.040 | 0.660 | 0.11 | 0.97 | 0.38 | 1.66 | 0.061 | 0.482 | 0.359 | balance,timeouts |
| BRAALSNK | 160 | 48 | 71 | 41 | 0.522 | 0.464–0.580 | +15 ±40 | 55.6% | 37.5% | 6.9% | 155.2±72.4 | 0.28 | 0.028 | 0.629 | 0.12 | 0.97 | 0.39 | 1.04 | 0.057 | 0.478 | 0.370 | timeouts |
| QKBGMAAN | 160 | 43 | 78 | 39 | 0.512 | 0.457–0.568 | +9 ±39 | 51.2% | 38.1% | 10.6% | 159.1±78.7 | 0.29 | 0.038 | 0.646 | 0.11 | 0.97 | 0.38 | 2.01 | 0.021 | 0.478 | 0.478 | timeouts |
| AAKRMGML | 160 | 40 | 91 | 29 | 0.534 | 0.484–0.585 | +24 ±35 | 43.1% | 43.8% | 13.1% | 176.4±78.4 | 0.28 | 0.032 | 0.646 | 0.08 | 0.97 | 0.35 | 1.59 | -0.079 | 0.469 | 0.421 | balance,timeouts |
| AASBKLGQ | 160 | 52 | 74 | 34 | 0.556 | 0.500–0.612 | +39 ±39 | 53.8% | 30.0% | 16.3% | 148.2±90.6 | 0.28 | 0.030 | 0.611 | 0.08 | 0.97 | 0.39 | 1.44 | 0.007 | 0.468 | 0.350 | balance,timeouts |
| NSAAGKRB | 160 | 34 | 94 | 32 | 0.506 | 0.457–0.556 | +4 ±35 | 41.3% | 46.3% | 12.5% | 179.2±80.1 | 0.27 | 0.033 | 0.641 | 0.10 | 0.97 | 0.34 | 1.56 | -0.073 | 0.467 | 0.351 | timeouts |
| SQSAAMKL | 160 | 35 | 90 | 35 | 0.500 | 0.449–0.551 | +0 ±36 | 43.8% | 40.6% | 15.6% | 168.8±84.0 | 0.27 | 0.038 | 0.632 | 0.09 | 0.97 | 0.35 | 1.69 | -0.043 | 0.467 | 0.351 | timeouts |
| MKRNMSAA | 160 | 45 | 81 | 34 | 0.534 | 0.480–0.589 | +24 ±38 | 49.4% | 39.4% | 11.3% | 179.0±73.0 | 0.25 | 0.043 | 0.650 | 0.10 | 0.97 | 0.36 | 1.51 | -0.017 | 0.466 | 0.356 | balance,timeouts |
| RRSKAAQG | 160 | 37 | 97 | 26 | 0.534 | 0.486–0.583 | +24 ±34 | 39.4% | 51.9% | 8.8% | 148.6±86.0 | 0.27 | 0.033 | 0.657 | 0.08 | 0.97 | 0.38 | 1.80 | -0.117 | 0.466 | 0.364 | balance,timeouts |
| GGBAABRK | 160 | 42 | 88 | 30 | 0.537 | 0.486–0.589 | +26 ±36 | 45.0% | 44.4% | 10.6% | 158.1±80.9 | 0.25 | 0.031 | 0.656 | 0.09 | 0.97 | 0.38 | 1.86 | -0.064 | 0.464 | 0.464 | balance,timeouts |
| AAGKRNLS | 160 | 47 | 78 | 35 | 0.537 | 0.482–0.593 | +26 ±38 | 51.2% | 37.5% | 11.3% | 148.8±81.8 | 0.25 | 0.033 | 0.625 | 0.08 | 0.97 | 0.38 | 1.39 | -0.001 | 0.463 | 0.339 | balance,timeouts |
| AANRGKBS | 160 | 40 | 92 | 28 | 0.537 | 0.487–0.588 | +26 ±35 | 42.5% | 42.5% | 15.0% | 173.7±81.4 | 0.23 | 0.037 | 0.640 | 0.08 | 0.97 | 0.36 | 1.63 | -0.089 | 0.455 | 0.338 | balance,timeouts |
| SBAAQKMS | 160 | 41 | 98 | 21 | 0.563 | 0.515–0.610 | +44 ±33 | 38.8% | 51.2% | 10.0% | 174.5±80.5 | 0.23 | 0.034 | 0.650 | 0.07 | 0.97 | 0.34 | 1.70 | -0.148 | 0.453 | 0.342 | balance,timeouts |
| MGKMRAAN | 160 | 21 | 112 | 27 | 0.481 | 0.439–0.524 | -13 ±29 | 30.0% | 53.1% | 16.9% | 178.1±84.0 | 0.25 | 0.044 | 0.666 | 0.06 | 0.97 | 0.35 | 1.87 | -0.197 | 0.452 | 0.452 | timeouts,drawRate |

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
