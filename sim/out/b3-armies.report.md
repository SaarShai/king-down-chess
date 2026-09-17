# Sim report — b3-armies

2000 games. White score **0.537** (95% 0.518–0.555),
white advantage **+26 ± 13 Elo**.
Decisive 71.0% · draws 22.1% · capped 7.0% (counted apart, never as draws).
Plies: mean 142.8 ± 74.0, median 128. Rules: all defaults.

Pentanomial over 1000 colour-swapped pairs: [88, 178, 301, 247, 186] (LL, LD, DD/WL, WD, WW).
σ_pg 0.4258 · normalized Elo +54 · LOS 100.0% ·
SPRT LLR 3.37 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 783 | 581 | 636 | 0.537 | 0.518–0.555 | +26 ±13 | 71.0% | 22.1% | 7.0% | 142.8±74.0 | 0.33 | 0.015 | 0.612 | 0.12 | 0.97 | 0.33 | 1.70 | 0.000 | 0.487 | 0.487 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | Q | M | K | N | G | P | B | L | S |
|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.52 | 1.78 | 1.80 | 2.26 | 0.95 | 2.43 | 0.33 | 0.84 | 1.09 | 1.68 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1419 | 71.0% |
| adjudicatedDraw | 366 | 18.3% |
| plyCap | 140 | 7.0% |
| drawRepetition | 41 | 2.1% |
| draw50 | 24 | 1.2% |
| drawMaterial | 10 | 0.5% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 47682 | 8674 | 19926 | 32000 | 11572 | 36.2% |
| G | 43405 | 2230 | 371 | 4000 | 3639 | 91.0% |
| K | 40270 | 2581 | 0 | 4000 | 4000 | 100.0% |
| M | 32091 | 3198 | 2385 | 4000 | 1615 | 40.4% |
| Q | 31817 | 5318 | 2998 | 4000 | 1485 | 37.1% |
| S | 30065 | 3294 | 2227 | 4000 | 1775 | 44.4% |
| A | 27091 | 4080 | 2736 | 4000 | 1264 | 31.6% |
| B | 15072 | 3936 | 3517 | 4000 | 483 | 12.1% |
| L | 9710 | 1409 | 328 | 2000 | 263 | 13.2% |
| N | 8461 | 1541 | 1772 | 2000 | 234 | 11.7% |
| R | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4080 | 2.04 |
| beastChainMoves | 2678 | 1.34 |
| beastChainCaptures | 3294 | 1.65 |
| maesterSwaps | 14147 | 7.07 |
| maesterLongSwaps | 3027 | 1.51 |
| paladinSacrifices | 1409 | 0.70 |
| promotions | 502 | 0.25 |
| checks | 14529 | 7.26 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.115 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 34 (1.7%) |
| games where a king never moved | 416 (20.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.000 | 0.000 | 0.008 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AQGMKMNA vs BBSQGSKL | 100 | 34 | 32 | 34 | 0.500 | 0.419–0.581 | +0 ±57 | 68.0% | 27.0% | 5.0% | 137.2±68.9 | 0.33 | 0.025 | 0.623 | 0.13 | 0.97 | 0.34 | 1.67 | -0.029 | 0.484 | 0.484 | - |
| MAKGAMQN vs KGSSBBQL | 100 | 35 | 30 | 35 | 0.500 | 0.418–0.582 | +0 ±61 | 70.0% | 23.0% | 7.0% | 151.6±73.7 | 0.35 | 0.015 | 0.611 | 0.12 | 0.97 | 0.32 | 1.73 | -0.009 | 0.489 | 0.462 | timeouts |
| NAGQKMAM vs SLKBSQBG | 100 | 32 | 36 | 32 | 0.500 | 0.422–0.578 | +0 ±47 | 64.0% | 25.0% | 11.0% | 148.7±81.6 | 0.28 | 0.016 | 0.607 | 0.10 | 0.98 | 0.32 | 1.77 | -0.069 | 0.469 | 0.469 | timeouts |
| KQAAMNMG vs KBSQBSLG | 100 | 37 | 27 | 36 | 0.505 | 0.421–0.589 | +3 ±54 | 73.0% | 21.0% | 6.0% | 135.1±74.9 | 0.34 | 0.016 | 0.612 | 0.11 | 0.97 | 0.34 | 1.77 | 0.021 | 0.488 | 0.488 | timeouts |
| QNKAMGMA vs SSKQLGBB | 100 | 35 | 27 | 38 | 0.485 | 0.401–0.569 | -10 ±64 | 73.0% | 16.0% | 11.0% | 153.5±77.9 | 0.35 | 0.015 | 0.613 | 0.13 | 0.98 | 0.33 | 1.68 | 0.021 | 0.492 | 0.492 | timeouts |
| KMQNMAAG vs GQBBSSLK | 100 | 37 | 30 | 33 | 0.520 | 0.438–0.602 | +14 ±63 | 70.0% | 21.0% | 9.0% | 143.3±80.1 | 0.36 | 0.014 | 0.615 | 0.12 | 0.97 | 0.32 | 1.76 | -0.009 | 0.491 | 0.491 | timeouts |
| GQMAKMAN vs BQSKGBLS | 100 | 36 | 33 | 31 | 0.525 | 0.445–0.605 | +17 ±55 | 67.0% | 24.0% | 9.0% | 141.8±79.4 | 0.33 | 0.013 | 0.596 | 0.09 | 0.97 | 0.32 | 1.65 | -0.039 | 0.479 | 0.448 | timeouts |
| NMQKAMAG vs SQBKGBSL | 100 | 41 | 23 | 36 | 0.525 | 0.439–0.611 | +17 ±60 | 77.0% | 17.0% | 6.0% | 143.8±75.6 | 0.34 | 0.012 | 0.603 | 0.11 | 0.97 | 0.33 | 1.70 | 0.061 | 0.489 | 0.474 | timeouts |
| MNAMAKQG vs QSBKLSGB | 100 | 39 | 27 | 34 | 0.525 | 0.441–0.609 | +17 ±57 | 73.0% | 22.0% | 5.0% | 138.4±70.4 | 0.31 | 0.011 | 0.607 | 0.12 | 0.98 | 0.34 | 1.72 | 0.021 | 0.483 | 0.479 | - |
| QAAMNGKM vs SQKSBLGB | 100 | 33 | 26 | 41 | 0.460 | 0.376–0.544 | -28 ±59 | 74.0% | 21.0% | 5.0% | 141.2±70.8 | 0.29 | 0.012 | 0.609 | 0.13 | 0.98 | 0.34 | 1.66 | 0.031 | 0.481 | 0.481 | balance |
| MKAAMNQG vs QKBGSSLB | 100 | 42 | 24 | 34 | 0.540 | 0.455–0.625 | +28 ±52 | 76.0% | 19.0% | 5.0% | 132.9±68.0 | 0.32 | 0.011 | 0.614 | 0.12 | 0.97 | 0.36 | 1.63 | 0.051 | 0.487 | 0.487 | balance |
| MQMAKANG vs SBKSBQGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±59 | 64.0% | 28.0% | 8.0% | 139.5±74.5 | 0.33 | 0.012 | 0.611 | 0.10 | 0.97 | 0.33 | 1.69 | -0.070 | 0.479 | 0.452 | balance,timeouts,drawRate |
| KMGAQAMN vs GKSSQLBB | 100 | 41 | 29 | 30 | 0.555 | 0.473–0.637 | +38 ±63 | 71.0% | 20.0% | 9.0% | 142.1±72.7 | 0.36 | 0.020 | 0.615 | 0.15 | 0.97 | 0.35 | 1.71 | 0.000 | 0.495 | 0.495 | balance,timeouts |
| AQMKNAMG vs BLGQSKSB | 100 | 43 | 27 | 30 | 0.565 | 0.482–0.648 | +45 ±60 | 73.0% | 22.0% | 5.0% | 150.7±69.3 | 0.35 | 0.012 | 0.611 | 0.13 | 0.98 | 0.34 | 1.69 | 0.020 | 0.492 | 0.492 | balance |
| MANAKGQM vs LQSSGKBB | 100 | 46 | 22 | 32 | 0.570 | 0.485–0.655 | +49 ±63 | 78.0% | 18.0% | 4.0% | 143.7±72.0 | 0.39 | 0.012 | 0.608 | 0.17 | 0.97 | 0.34 | 1.62 | 0.070 | 0.506 | 0.495 | balance |
| MAGAMQKN vs KGLBSSBQ | 100 | 42 | 31 | 27 | 0.575 | 0.495–0.655 | +53 ±51 | 69.0% | 25.0% | 6.0% | 145.8±71.6 | 0.33 | 0.017 | 0.624 | 0.13 | 0.97 | 0.33 | 1.70 | -0.020 | 0.488 | 0.488 | balance,timeouts |
| MQMANGKA vs SGBQKBSL | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±56 | 75.0% | 21.0% | 4.0% | 135.4±70.4 | 0.37 | 0.010 | 0.598 | 0.13 | 0.97 | 0.34 | 1.72 | 0.040 | 0.496 | 0.496 | balance |
| MGNAAMKQ vs LSKGBBQS | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±59 | 75.0% | 18.0% | 7.0% | 129.3±70.1 | 0.31 | 0.011 | 0.607 | 0.10 | 0.98 | 0.35 | 1.65 | 0.040 | 0.483 | 0.443 | balance,timeouts |
| AGQKAMNM vs BBQGSLKS | 100 | 40 | 37 | 23 | 0.585 | 0.509–0.661 | +60 ±52 | 63.0% | 26.0% | 11.0% | 153.1±76.5 | 0.31 | 0.016 | 0.623 | 0.13 | 0.98 | 0.32 | 1.75 | -0.080 | 0.480 | 0.480 | balance,timeouts |
| MNMQGKAA vs QSBLGKSB | 100 | 43 | 34 | 23 | 0.600 | 0.523–0.677 | +70 ±54 | 66.0% | 27.0% | 7.0% | 149.5±74.0 | 0.35 | 0.023 | 0.636 | 0.14 | 0.97 | 0.32 | 1.79 | -0.050 | 0.491 | 0.491 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MANAKGQM vs LQSSGKBB | 100 | 46 | 22 | 32 | 0.570 | 0.485–0.655 | +49 ±63 | 78.0% | 18.0% | 4.0% | 143.7±72.0 | 0.39 | 0.012 | 0.608 | 0.17 | 0.97 | 0.34 | 1.62 | 0.070 | 0.506 | 0.495 | balance |
| MQMANGKA vs SGBQKBSL | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±56 | 75.0% | 21.0% | 4.0% | 135.4±70.4 | 0.37 | 0.010 | 0.598 | 0.13 | 0.97 | 0.34 | 1.72 | 0.040 | 0.496 | 0.496 | balance |
| KMGAQAMN vs GKSSQLBB | 100 | 41 | 29 | 30 | 0.555 | 0.473–0.637 | +38 ±63 | 71.0% | 20.0% | 9.0% | 142.1±72.7 | 0.36 | 0.020 | 0.615 | 0.15 | 0.97 | 0.35 | 1.71 | 0.000 | 0.495 | 0.495 | balance,timeouts |
| QNKAMGMA vs SSKQLGBB | 100 | 35 | 27 | 38 | 0.485 | 0.401–0.569 | -10 ±64 | 73.0% | 16.0% | 11.0% | 153.5±77.9 | 0.35 | 0.015 | 0.613 | 0.13 | 0.98 | 0.33 | 1.68 | 0.021 | 0.492 | 0.492 | timeouts |
| AQMKNAMG vs BLGQSKSB | 100 | 43 | 27 | 30 | 0.565 | 0.482–0.648 | +45 ±60 | 73.0% | 22.0% | 5.0% | 150.7±69.3 | 0.35 | 0.012 | 0.611 | 0.13 | 0.98 | 0.34 | 1.69 | 0.020 | 0.492 | 0.492 | balance |
| MNMQGKAA vs QSBLGKSB | 100 | 43 | 34 | 23 | 0.600 | 0.523–0.677 | +70 ±54 | 66.0% | 27.0% | 7.0% | 149.5±74.0 | 0.35 | 0.023 | 0.636 | 0.14 | 0.97 | 0.32 | 1.79 | -0.050 | 0.491 | 0.491 | balance,timeouts |
| KMQNMAAG vs GQBBSSLK | 100 | 37 | 30 | 33 | 0.520 | 0.438–0.602 | +14 ±63 | 70.0% | 21.0% | 9.0% | 143.3±80.1 | 0.36 | 0.014 | 0.615 | 0.12 | 0.97 | 0.32 | 1.76 | -0.009 | 0.491 | 0.491 | timeouts |
| NMQKAMAG vs SQBKGBSL | 100 | 41 | 23 | 36 | 0.525 | 0.439–0.611 | +17 ±60 | 77.0% | 17.0% | 6.0% | 143.8±75.6 | 0.34 | 0.012 | 0.603 | 0.11 | 0.97 | 0.33 | 1.70 | 0.061 | 0.489 | 0.474 | timeouts |
| MAKGAMQN vs KGSSBBQL | 100 | 35 | 30 | 35 | 0.500 | 0.418–0.582 | +0 ±61 | 70.0% | 23.0% | 7.0% | 151.6±73.7 | 0.35 | 0.015 | 0.611 | 0.12 | 0.97 | 0.32 | 1.73 | -0.009 | 0.489 | 0.462 | timeouts |
| MAGAMQKN vs KGLBSSBQ | 100 | 42 | 31 | 27 | 0.575 | 0.495–0.655 | +53 ±51 | 69.0% | 25.0% | 6.0% | 145.8±71.6 | 0.33 | 0.017 | 0.624 | 0.13 | 0.97 | 0.33 | 1.70 | -0.020 | 0.488 | 0.488 | balance,timeouts |
| KQAAMNMG vs KBSQBSLG | 100 | 37 | 27 | 36 | 0.505 | 0.421–0.589 | +3 ±54 | 73.0% | 21.0% | 6.0% | 135.1±74.9 | 0.34 | 0.016 | 0.612 | 0.11 | 0.97 | 0.34 | 1.77 | 0.021 | 0.488 | 0.488 | timeouts |
| MKAAMNQG vs QKBGSSLB | 100 | 42 | 24 | 34 | 0.540 | 0.455–0.625 | +28 ±52 | 76.0% | 19.0% | 5.0% | 132.9±68.0 | 0.32 | 0.011 | 0.614 | 0.12 | 0.97 | 0.36 | 1.63 | 0.051 | 0.487 | 0.487 | balance |
| AQGMKMNA vs BBSQGSKL | 100 | 34 | 32 | 34 | 0.500 | 0.419–0.581 | +0 ±57 | 68.0% | 27.0% | 5.0% | 137.2±68.9 | 0.33 | 0.025 | 0.623 | 0.13 | 0.97 | 0.34 | 1.67 | -0.029 | 0.484 | 0.484 | - |
| MGNAAMKQ vs LSKGBBQS | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±59 | 75.0% | 18.0% | 7.0% | 129.3±70.1 | 0.31 | 0.011 | 0.607 | 0.10 | 0.98 | 0.35 | 1.65 | 0.040 | 0.483 | 0.443 | balance,timeouts |
| MNAMAKQG vs QSBKLSGB | 100 | 39 | 27 | 34 | 0.525 | 0.441–0.609 | +17 ±57 | 73.0% | 22.0% | 5.0% | 138.4±70.4 | 0.31 | 0.011 | 0.607 | 0.12 | 0.98 | 0.34 | 1.72 | 0.021 | 0.483 | 0.479 | - |
| QAAMNGKM vs SQKSBLGB | 100 | 33 | 26 | 41 | 0.460 | 0.376–0.544 | -28 ±59 | 74.0% | 21.0% | 5.0% | 141.2±70.8 | 0.29 | 0.012 | 0.609 | 0.13 | 0.98 | 0.34 | 1.66 | 0.031 | 0.481 | 0.481 | balance |
| AGQKAMNM vs BBQGSLKS | 100 | 40 | 37 | 23 | 0.585 | 0.509–0.661 | +60 ±52 | 63.0% | 26.0% | 11.0% | 153.1±76.5 | 0.31 | 0.016 | 0.623 | 0.13 | 0.98 | 0.32 | 1.75 | -0.080 | 0.480 | 0.480 | balance,timeouts |
| GQMAKMAN vs BQSKGBLS | 100 | 36 | 33 | 31 | 0.525 | 0.445–0.605 | +17 ±55 | 67.0% | 24.0% | 9.0% | 141.8±79.4 | 0.33 | 0.013 | 0.596 | 0.09 | 0.97 | 0.32 | 1.65 | -0.039 | 0.479 | 0.448 | timeouts |
| MQMAKANG vs SBKSBQGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±59 | 64.0% | 28.0% | 8.0% | 139.5±74.5 | 0.33 | 0.012 | 0.611 | 0.10 | 0.97 | 0.33 | 1.69 | -0.070 | 0.479 | 0.452 | balance,timeouts,drawRate |
| NAGQKMAM vs SLKBSQBG | 100 | 32 | 36 | 32 | 0.500 | 0.422–0.578 | +0 ±47 | 64.0% | 25.0% | 11.0% | 148.7±81.6 | 0.28 | 0.016 | 0.607 | 0.10 | 0.98 | 0.32 | 1.77 | -0.069 | 0.469 | 0.469 | timeouts |

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
