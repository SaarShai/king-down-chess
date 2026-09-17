# Sim report — b3-val-f3

2000 games. White score **0.537** (95% 0.518–0.556),
white advantage **+26 ± 14 Elo**.
Decisive 79.7% · draws 19.1% · capped 1.2% (counted apart, never as draws).
Plies: mean 109.5 ± 55.5, median 99. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4448 · normalized Elo +29 · LOS 100.0% ·
SPRT LLR 1.77 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 871 | 406 | 723 | 0.537 | 0.518–0.556 | +26 ±14 | 79.7% | 19.1% | 1.2% | 109.5±55.5 | 0.35 | 0.028 | 0.636 | 0.15 | 0.97 | 0.41 | 1.70 | 0.003 | 0.495 | 0.495 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | B | Q | K | S | R | P |
|---|---|---|---|---|---|---|---|
| use | 1.93 | 1.34 | 1.63 | 2.17 | 1.46 | 1.36 | 0.41 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1590 | 79.5% |
| adjudicatedDraw | 296 | 14.8% |
| drawRepetition | 57 | 2.9% |
| plyCap | 24 | 1.2% |
| draw50 | 20 | 1.0% |
| drawMaterial | 8 | 0.4% |
| checkmate | 4 | 0.2% |
| stalemate | 1 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 44881 | 8893 | 19324 | 32000 | 12320 | 38.5% |
| S | 40105 | 5273 | 3994 | 8000 | 4006 | 50.1% |
| R | 37154 | 6237 | 4409 | 8000 | 3592 | 44.9% |
| K | 29707 | 1762 | 0 | 4000 | 4000 | 100.0% |
| A | 26485 | 4701 | 2108 | 4000 | 1892 | 47.3% |
| Q | 22307 | 4528 | 2825 | 4000 | 1503 | 37.6% |
| B | 18284 | 4128 | 2862 | 4000 | 1138 | 28.4% |
| G | 100 | 9 | 7 | 0 | 15 | 0.0% |
| L | 4 | 0 | 0 | 0 | 2 | 0.0% |
| N | 0 | 0 | 2 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4701 | 2.35 |
| beastChainMoves | 4151 | 2.08 |
| beastChainCaptures | 5273 | 2.64 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 356 | 0.18 |
| checks | 13318 | 6.66 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.004 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 28 (1.4%) |
| games where a king never moved | 461 (23.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KQSBRRSA | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 20.0% | 3.0% | 115.2±54.5 | 0.36 | 0.022 | 0.658 | 0.15 | 0.97 | 0.43 | 1.81 | -0.017 | 0.498 | 0.498 | - |
| SSQBARKR | 100 | 41 | 19 | 40 | 0.505 | 0.417–0.593 | +3 ±61 | 81.0% | 18.0% | 1.0% | 102.6±57.2 | 0.38 | 0.023 | 0.638 | 0.15 | 0.96 | 0.42 | 1.71 | 0.023 | 0.502 | 0.502 | - |
| KRBASSRQ | 100 | 38 | 27 | 35 | 0.515 | 0.431–0.599 | +10 ±58 | 73.0% | 26.0% | 1.0% | 107.0±54.3 | 0.34 | 0.026 | 0.641 | 0.14 | 0.97 | 0.41 | 1.71 | -0.059 | 0.489 | 0.489 | - |
| BSARQKSR | 100 | 42 | 12 | 46 | 0.480 | 0.388–0.572 | -14 ±64 | 88.0% | 12.0% | 0.0% | 109.7±50.3 | 0.38 | 0.028 | 0.630 | 0.21 | 0.96 | 0.42 | 1.78 | 0.089 | 0.512 | 0.512 | - |
| SBRAKQRS | 100 | 37 | 21 | 42 | 0.475 | 0.388–0.562 | -17 ±60 | 79.0% | 21.0% | 0.0% | 110.7±44.2 | 0.36 | 0.023 | 0.628 | 0.16 | 0.97 | 0.42 | 1.69 | -0.002 | 0.497 | 0.497 | - |
| QBSSKRAR | 100 | 45 | 16 | 39 | 0.530 | 0.440–0.620 | +21 ±62 | 84.0% | 15.0% | 1.0% | 111.9±50.9 | 0.38 | 0.032 | 0.622 | 0.18 | 0.97 | 0.41 | 1.59 | 0.047 | 0.504 | 0.504 | balance |
| QSRABRSK | 100 | 35 | 23 | 42 | 0.465 | 0.379–0.551 | -24 ±60 | 77.0% | 23.0% | 0.0% | 102.5±44.5 | 0.31 | 0.024 | 0.645 | 0.13 | 0.97 | 0.44 | 1.80 | -0.024 | 0.484 | 0.484 | balance |
| ASQKRBRS | 100 | 43 | 21 | 36 | 0.535 | 0.448–0.622 | +24 ±60 | 79.0% | 19.0% | 2.0% | 112.1±58.5 | 0.36 | 0.031 | 0.644 | 0.14 | 0.97 | 0.41 | 1.67 | -0.004 | 0.495 | 0.495 | balance |
| KSBRQSAR | 100 | 35 | 21 | 44 | 0.455 | 0.368–0.542 | -31 ±60 | 79.0% | 18.0% | 3.0% | 113.3±58.0 | 0.39 | 0.022 | 0.645 | 0.16 | 0.97 | 0.39 | 1.66 | -0.006 | 0.505 | 0.505 | balance |
| ABQKSRRS | 100 | 45 | 19 | 36 | 0.545 | 0.457–0.633 | +31 ±61 | 81.0% | 19.0% | 0.0% | 113.7±59.2 | 0.34 | 0.033 | 0.637 | 0.14 | 0.97 | 0.40 | 1.65 | 0.014 | 0.491 | 0.491 | balance |
| AKSQRSRB | 100 | 44 | 21 | 35 | 0.545 | 0.458–0.632 | +31 ±60 | 79.0% | 19.0% | 2.0% | 115.7±60.2 | 0.37 | 0.032 | 0.640 | 0.17 | 0.97 | 0.40 | 1.58 | -0.006 | 0.500 | 0.500 | balance |
| SKRASBRQ | 100 | 41 | 27 | 32 | 0.545 | 0.462–0.628 | +31 ±58 | 73.0% | 26.0% | 1.0% | 107.8±52.7 | 0.32 | 0.034 | 0.640 | 0.14 | 0.97 | 0.42 | 1.65 | -0.066 | 0.483 | 0.483 | balance |
| RQSASKRB | 100 | 39 | 32 | 29 | 0.550 | 0.470–0.630 | +35 ±56 | 68.0% | 31.0% | 1.0% | 114.1±53.7 | 0.32 | 0.032 | 0.650 | 0.16 | 0.97 | 0.39 | 1.73 | -0.117 | 0.482 | 0.482 | balance,drawRate |
| ASRQKBSR | 100 | 45 | 20 | 35 | 0.550 | 0.463–0.637 | +35 ±61 | 80.0% | 17.0% | 3.0% | 116.0±57.7 | 0.36 | 0.030 | 0.640 | 0.15 | 0.97 | 0.39 | 1.73 | 0.003 | 0.496 | 0.496 | balance |
| AKRSSRBQ | 100 | 48 | 15 | 37 | 0.555 | 0.465–0.645 | +38 ±62 | 85.0% | 14.0% | 1.0% | 105.8±60.5 | 0.35 | 0.027 | 0.628 | 0.15 | 0.96 | 0.42 | 1.55 | 0.052 | 0.496 | 0.496 | balance |
| KRQBRASS | 100 | 50 | 12 | 38 | 0.560 | 0.469–0.651 | +42 ±63 | 88.0% | 10.0% | 2.0% | 109.1±62.6 | 0.42 | 0.023 | 0.636 | 0.16 | 0.96 | 0.41 | 1.58 | 0.081 | 0.514 | 0.514 | balance |
| RABSKQSR | 100 | 49 | 17 | 34 | 0.575 | 0.487–0.663 | +53 ±61 | 83.0% | 17.0% | 0.0% | 110.6±53.5 | 0.33 | 0.026 | 0.633 | 0.15 | 0.97 | 0.39 | 1.71 | 0.027 | 0.492 | 0.492 | balance |
| RBKARSSQ | 100 | 50 | 18 | 32 | 0.590 | 0.503–0.677 | +63 ±60 | 82.0% | 16.0% | 2.0% | 101.6±54.2 | 0.29 | 0.026 | 0.616 | 0.14 | 0.97 | 0.41 | 1.88 | 0.014 | 0.480 | 0.480 | balance |
| SRBASKRQ | 100 | 47 | 28 | 25 | 0.610 | 0.530–0.690 | +78 ±56 | 72.0% | 27.0% | 1.0% | 104.5±55.7 | 0.33 | 0.029 | 0.634 | 0.14 | 0.97 | 0.41 | 1.75 | -0.090 | 0.482 | 0.482 | balance |
| KQRSSARB | 100 | 58 | 14 | 28 | 0.650 | 0.564–0.736 | +108 ±60 | 86.0% | 14.0% | 0.0% | 106.4±59.1 | 0.39 | 0.027 | 0.611 | 0.16 | 0.96 | 0.42 | 1.77 | 0.041 | 0.503 | 0.503 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KRQBRASS | 100 | 50 | 12 | 38 | 0.560 | 0.469–0.651 | +42 ±63 | 88.0% | 10.0% | 2.0% | 109.1±62.6 | 0.42 | 0.023 | 0.636 | 0.16 | 0.96 | 0.41 | 1.58 | 0.081 | 0.514 | 0.514 | balance |
| BSARQKSR | 100 | 42 | 12 | 46 | 0.480 | 0.388–0.572 | -14 ±64 | 88.0% | 12.0% | 0.0% | 109.7±50.3 | 0.38 | 0.028 | 0.630 | 0.21 | 0.96 | 0.42 | 1.78 | 0.089 | 0.512 | 0.512 | - |
| KSBRQSAR | 100 | 35 | 21 | 44 | 0.455 | 0.368–0.542 | -31 ±60 | 79.0% | 18.0% | 3.0% | 113.3±58.0 | 0.39 | 0.022 | 0.645 | 0.16 | 0.97 | 0.39 | 1.66 | -0.006 | 0.505 | 0.505 | balance |
| QBSSKRAR | 100 | 45 | 16 | 39 | 0.530 | 0.440–0.620 | +21 ±62 | 84.0% | 15.0% | 1.0% | 111.9±50.9 | 0.38 | 0.032 | 0.622 | 0.18 | 0.97 | 0.41 | 1.59 | 0.047 | 0.504 | 0.504 | balance |
| KQRSSARB | 100 | 58 | 14 | 28 | 0.650 | 0.564–0.736 | +108 ±60 | 86.0% | 14.0% | 0.0% | 106.4±59.1 | 0.39 | 0.027 | 0.611 | 0.16 | 0.96 | 0.42 | 1.77 | 0.041 | 0.503 | 0.503 | balance |
| SSQBARKR | 100 | 41 | 19 | 40 | 0.505 | 0.417–0.593 | +3 ±61 | 81.0% | 18.0% | 1.0% | 102.6±57.2 | 0.38 | 0.023 | 0.638 | 0.15 | 0.96 | 0.42 | 1.71 | 0.023 | 0.502 | 0.502 | - |
| AKSQRSRB | 100 | 44 | 21 | 35 | 0.545 | 0.458–0.632 | +31 ±60 | 79.0% | 19.0% | 2.0% | 115.7±60.2 | 0.37 | 0.032 | 0.640 | 0.17 | 0.97 | 0.40 | 1.58 | -0.006 | 0.500 | 0.500 | balance |
| KQSBRRSA | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 20.0% | 3.0% | 115.2±54.5 | 0.36 | 0.022 | 0.658 | 0.15 | 0.97 | 0.43 | 1.81 | -0.017 | 0.498 | 0.498 | - |
| SBRAKQRS | 100 | 37 | 21 | 42 | 0.475 | 0.388–0.562 | -17 ±60 | 79.0% | 21.0% | 0.0% | 110.7±44.2 | 0.36 | 0.023 | 0.628 | 0.16 | 0.97 | 0.42 | 1.69 | -0.002 | 0.497 | 0.497 | - |
| AKRSSRBQ | 100 | 48 | 15 | 37 | 0.555 | 0.465–0.645 | +38 ±62 | 85.0% | 14.0% | 1.0% | 105.8±60.5 | 0.35 | 0.027 | 0.628 | 0.15 | 0.96 | 0.42 | 1.55 | 0.052 | 0.496 | 0.496 | balance |
| ASRQKBSR | 100 | 45 | 20 | 35 | 0.550 | 0.463–0.637 | +35 ±61 | 80.0% | 17.0% | 3.0% | 116.0±57.7 | 0.36 | 0.030 | 0.640 | 0.15 | 0.97 | 0.39 | 1.73 | 0.003 | 0.496 | 0.496 | balance |
| ASQKRBRS | 100 | 43 | 21 | 36 | 0.535 | 0.448–0.622 | +24 ±60 | 79.0% | 19.0% | 2.0% | 112.1±58.5 | 0.36 | 0.031 | 0.644 | 0.14 | 0.97 | 0.41 | 1.67 | -0.004 | 0.495 | 0.495 | balance |
| RABSKQSR | 100 | 49 | 17 | 34 | 0.575 | 0.487–0.663 | +53 ±61 | 83.0% | 17.0% | 0.0% | 110.6±53.5 | 0.33 | 0.026 | 0.633 | 0.15 | 0.97 | 0.39 | 1.71 | 0.027 | 0.492 | 0.492 | balance |
| ABQKSRRS | 100 | 45 | 19 | 36 | 0.545 | 0.457–0.633 | +31 ±61 | 81.0% | 19.0% | 0.0% | 113.7±59.2 | 0.34 | 0.033 | 0.637 | 0.14 | 0.97 | 0.40 | 1.65 | 0.014 | 0.491 | 0.491 | balance |
| KRBASSRQ | 100 | 38 | 27 | 35 | 0.515 | 0.431–0.599 | +10 ±58 | 73.0% | 26.0% | 1.0% | 107.0±54.3 | 0.34 | 0.026 | 0.641 | 0.14 | 0.97 | 0.41 | 1.71 | -0.059 | 0.489 | 0.489 | - |
| QSRABRSK | 100 | 35 | 23 | 42 | 0.465 | 0.379–0.551 | -24 ±60 | 77.0% | 23.0% | 0.0% | 102.5±44.5 | 0.31 | 0.024 | 0.645 | 0.13 | 0.97 | 0.44 | 1.80 | -0.024 | 0.484 | 0.484 | balance |
| SKRASBRQ | 100 | 41 | 27 | 32 | 0.545 | 0.462–0.628 | +31 ±58 | 73.0% | 26.0% | 1.0% | 107.8±52.7 | 0.32 | 0.034 | 0.640 | 0.14 | 0.97 | 0.42 | 1.65 | -0.066 | 0.483 | 0.483 | balance |
| RQSASKRB | 100 | 39 | 32 | 29 | 0.550 | 0.470–0.630 | +35 ±56 | 68.0% | 31.0% | 1.0% | 114.1±53.7 | 0.32 | 0.032 | 0.650 | 0.16 | 0.97 | 0.39 | 1.73 | -0.117 | 0.482 | 0.482 | balance,drawRate |
| SRBASKRQ | 100 | 47 | 28 | 25 | 0.610 | 0.530–0.690 | +78 ±56 | 72.0% | 27.0% | 1.0% | 104.5±55.7 | 0.33 | 0.029 | 0.634 | 0.14 | 0.97 | 0.41 | 1.75 | -0.090 | 0.482 | 0.482 | balance |
| RBKARSSQ | 100 | 50 | 18 | 32 | 0.590 | 0.503–0.677 | +63 ±60 | 82.0% | 16.0% | 2.0% | 101.6±54.2 | 0.29 | 0.026 | 0.616 | 0.14 | 0.97 | 0.41 | 1.88 | 0.014 | 0.480 | 0.480 | balance |

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
