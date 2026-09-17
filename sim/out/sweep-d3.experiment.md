# Arrangement sweep — sweep-d3

Successive halving, eta = 2, 2 rounds, common random numbers inside every round
(docs/SIM-PLAN.md §8). Depth 3. Round 1 starts with 100 random back ranks and
20 games each; every round doubles the games and keeps the better half.

The ranking key is **imbalance = |white score − 0.5|**, ties broken by the interest score. Balance and interest
stay two axes; the table prints both, and the gate column prints the rejects.

## Round 1 — 100 arrangements x 20 games
| back rank | games | score | imbalance | decisive | draws | xDec | interest | minUse | gates |
|---|---|---|---|---|---|---|---|---|---|
| KLBRANQN | 20 | 0.500 | 0.000 | 80.0% | 15.0% | 0.194 | 0.504 | 0.45 | - |
| MGKRGRNB | 20 | 0.500 | 0.000 | 60.0% | 35.0% | -0.006 | 0.480 | 0.41 | - |
| ARKAGNML | 20 | 0.500 | 0.000 | 60.0% | 25.0% | -0.006 | 0.455 | 0.39 | timeouts |
| LABKRSQN | 20 | 0.500 | 0.000 | 90.0% | 10.0% | 0.294 | 0.408 | 0.49 | - |
| QNKGRSRS | 20 | 0.500 | 0.000 | 80.0% | 20.0% | 0.194 | 0.390 | 0.34 | - |
| KRQAMSBG | 20 | 0.500 | 0.000 | 50.0% | 45.0% | -0.106 | 0.378 | 0.40 | - |
| MKBGRQRS | 20 | 0.500 | 0.000 | 70.0% | 25.0% | 0.094 | 0.370 | 0.34 | - |
| LMBNQKSR | 20 | 0.500 | 0.000 | 70.0% | 30.0% | 0.094 | 0.367 | 0.44 | - |
| MSNGGAKN | 20 | 0.500 | 0.000 | 50.0% | 45.0% | -0.106 | 0.367 | 0.39 | - |
| KARSNGQS | 20 | 0.500 | 0.000 | 60.0% | 35.0% | -0.006 | 0.365 | 0.42 | - |
| LQSGNKGR | 20 | 0.500 | 0.000 | 80.0% | 20.0% | 0.194 | 0.363 | 0.42 | - |
| SNLMMGRK | 20 | 0.500 | 0.000 | 60.0% | 40.0% | -0.006 | 0.359 | 0.41 | - |
| NSGQKGBM | 20 | 0.500 | 0.000 | 60.0% | 40.0% | -0.006 | 0.345 | 0.32 | - |
| SNKSGLQR | 20 | 0.500 | 0.000 | 50.0% | 45.0% | -0.106 | 0.340 | 0.36 | - |
| QNAMBKRA | 20 | 0.525 | 0.025 | 55.0% | 45.0% | -0.070 | 0.490 | 0.38 | - |
| AKNNARLQ | 20 | 0.475 | 0.025 | 55.0% | 45.0% | -0.070 | 0.483 | 0.51 | - |
| KQMNGLAB | 20 | 0.525 | 0.025 | 65.0% | 30.0% | 0.030 | 0.479 | 0.45 | - |
| MMBGARLK | 20 | 0.525 | 0.025 | 75.0% | 15.0% | 0.130 | 0.478 | 0.41 | timeouts |
| GRMGKNBB | 20 | 0.475 | 0.025 | 75.0% | 25.0% | 0.130 | 0.444 | 0.57 | - |
| NSBBQNKG | 20 | 0.525 | 0.025 | 85.0% | 15.0% | 0.230 | 0.381 | 0.24 | utilisation |
| GMQRSGAK | 20 | 0.525 | 0.025 | 55.0% | 30.0% | -0.070 | 0.373 | 0.43 | timeouts |
| NSBNQGKM | 20 | 0.475 | 0.025 | 75.0% | 25.0% | 0.130 | 0.366 | 0.29 | - |
| RSKRBQML | 20 | 0.475 | 0.025 | 65.0% | 35.0% | 0.030 | 0.365 | 0.42 | - |
| AGLSAKSN | 20 | 0.525 | 0.025 | 55.0% | 40.0% | -0.070 | 0.361 | 0.37 | - |
| GSNKBMAB | 20 | 0.475 | 0.025 | 55.0% | 35.0% | -0.070 | 0.359 | 0.40 | timeouts |
| BARGLSKG | 20 | 0.525 | 0.025 | 65.0% | 30.0% | 0.030 | 0.348 | 0.32 | - |
| ASGKBMSN | 20 | 0.475 | 0.025 | 55.0% | 30.0% | -0.070 | 0.334 | 0.37 | timeouts |
| AGSMRSMK | 20 | 0.525 | 0.025 | 25.0% | 60.0% | -0.370 | 0.331 | 0.38 | timeouts,drawRate |
| GAKGQRAS | 20 | 0.475 | 0.025 | 15.0% | 75.0% | -0.470 | 0.317 | 0.37 | timeouts,drawRate |
| BGLNKARB | 20 | 0.450 | 0.050 | 70.0% | 25.0% | 0.067 | 0.442 | 0.48 | balance |
| RNRKSBAG | 20 | 0.450 | 0.050 | 80.0% | 20.0% | 0.167 | 0.419 | 0.53 | balance |
| SAMNGBKR | 20 | 0.450 | 0.050 | 50.0% | 45.0% | -0.133 | 0.388 | 0.44 | balance |
| ANRQNSGK | 20 | 0.450 | 0.050 | 80.0% | 20.0% | 0.167 | 0.383 | 0.35 | balance |
| ARNAKSNG | 20 | 0.450 | 0.050 | 30.0% | 65.0% | -0.333 | 0.298 | 0.27 | balance,drawRate |
| GRRANNBK | 20 | 0.550 | 0.050 | 70.0% | 20.0% | 0.067 | 0.491 | 0.37 | balance,timeouts |
| NRKQLARS | 20 | 0.550 | 0.050 | 80.0% | 20.0% | 0.167 | 0.415 | 0.50 | balance |
| MKANRQSB | 20 | 0.550 | 0.050 | 70.0% | 30.0% | 0.067 | 0.407 | 0.45 | balance |
| NKGSRANQ | 20 | 0.550 | 0.050 | 80.0% | 10.0% | 0.167 | 0.392 | 0.34 | balance,timeouts |
| RKNSAARB | 20 | 0.550 | 0.050 | 70.0% | 20.0% | 0.067 | 0.383 | 0.42 | balance,timeouts |
| NKSRGRBQ | 20 | 0.550 | 0.050 | 70.0% | 30.0% | 0.067 | 0.381 | 0.43 | balance |

(60 more rows in `sim/out/sweep-d3.r1.report.md`)

## Round 2 — 50 arrangements x 40 games
| back rank | games | score | imbalance | decisive | draws | xDec | interest | minUse | gates |
|---|---|---|---|---|---|---|---|---|---|
| KLBRANQN | 40 | 0.500 | 0.000 | 90.0% | 7.5% | 0.290 | 0.498 | 0.49 | - |
| GRMGKNBB | 40 | 0.500 | 0.000 | 55.0% | 40.0% | -0.060 | 0.470 | 0.40 | - |
| RKNSAARB | 40 | 0.500 | 0.000 | 60.0% | 35.0% | -0.010 | 0.373 | 0.44 | - |
| AKLSNSMQ | 40 | 0.500 | 0.000 | 70.0% | 25.0% | 0.090 | 0.358 | 0.35 | - |
| ARKAGNML | 40 | 0.512 | 0.012 | 47.5% | 40.0% | -0.139 | 0.454 | 0.37 | timeouts |
| MMBGARLK | 40 | 0.512 | 0.012 | 57.5% | 42.5% | -0.039 | 0.424 | 0.45 | - |
| KARSNGQS | 40 | 0.512 | 0.012 | 67.5% | 27.5% | 0.061 | 0.382 | 0.47 | - |
| RSKRBQML | 40 | 0.512 | 0.012 | 72.5% | 27.5% | 0.111 | 0.369 | 0.50 | - |
| AGLSAKSN | 40 | 0.512 | 0.012 | 47.5% | 40.0% | -0.139 | 0.353 | 0.37 | timeouts |
| BLGKRSAG | 40 | 0.512 | 0.012 | 52.5% | 37.5% | -0.089 | 0.337 | 0.39 | timeouts |
| ASGKBMSN | 40 | 0.512 | 0.012 | 37.5% | 50.0% | -0.239 | 0.329 | 0.38 | timeouts,drawRate |
| LABKRSQN | 40 | 0.487 | 0.013 | 82.5% | 17.5% | 0.211 | 0.401 | 0.45 | - |
| NSBNQGKM | 40 | 0.487 | 0.013 | 82.5% | 17.5% | 0.211 | 0.397 | 0.47 | - |
| MKANRQSB | 40 | 0.487 | 0.013 | 72.5% | 25.0% | 0.111 | 0.391 | 0.47 | - |
| SAMNGBKR | 40 | 0.487 | 0.013 | 62.5% | 25.0% | 0.011 | 0.378 | 0.37 | timeouts |
| NAGQKGBM | 40 | 0.525 | 0.025 | 50.0% | 47.5% | -0.117 | 0.479 | 0.42 | - |
| NKSRGRBQ | 40 | 0.475 | 0.025 | 75.0% | 22.5% | 0.133 | 0.385 | 0.44 | - |
| LMBNQKSR | 40 | 0.525 | 0.025 | 75.0% | 25.0% | 0.133 | 0.383 | 0.43 | - |
| MNABAKSM | 40 | 0.525 | 0.025 | 55.0% | 45.0% | -0.067 | 0.383 | 0.46 | - |
| NKGSRANQ | 40 | 0.525 | 0.025 | 80.0% | 17.5% | 0.183 | 0.373 | 0.36 | - |
| NSGQKGBM | 40 | 0.475 | 0.025 | 45.0% | 42.5% | -0.167 | 0.342 | 0.36 | timeouts |
| KQGMBSGR | 40 | 0.525 | 0.025 | 40.0% | 52.5% | -0.217 | 0.330 | 0.36 | timeouts,drawRate |
| GSNKBMAB | 40 | 0.475 | 0.025 | 45.0% | 40.0% | -0.167 | 0.327 | 0.36 | timeouts |
| KQMNGLAB | 40 | 0.537 | 0.037 | 67.5% | 30.0% | 0.055 | 0.497 | 0.50 | balance |
| BGLNKARB | 40 | 0.463 | 0.037 | 62.5% | 32.5% | 0.005 | 0.443 | 0.39 | balance |
| SNLMMGRK | 40 | 0.463 | 0.037 | 62.5% | 35.0% | 0.005 | 0.385 | 0.47 | balance |
| QNKGRSRS | 40 | 0.537 | 0.037 | 72.5% | 27.5% | 0.105 | 0.375 | 0.38 | balance |
| GRSBQSKR | 40 | 0.537 | 0.037 | 67.5% | 27.5% | 0.055 | 0.372 | 0.40 | balance |
| LQSGNKGR | 40 | 0.537 | 0.037 | 72.5% | 17.5% | 0.105 | 0.348 | 0.31 | balance,timeouts |
| ARNAKSNG | 40 | 0.463 | 0.037 | 47.5% | 45.0% | -0.145 | 0.314 | 0.31 | balance,timeouts |
| KRQAMSBG | 40 | 0.450 | 0.050 | 60.0% | 32.5% | -0.023 | 0.370 | 0.43 | balance,timeouts |
| MKBGRQRS | 40 | 0.450 | 0.050 | 80.0% | 17.5% | 0.177 | 0.360 | 0.25 | balance,utilisation |
| AGSMRSMK | 40 | 0.450 | 0.050 | 45.0% | 40.0% | -0.173 | 0.339 | 0.42 | balance,timeouts |
| MGKRGRNB | 40 | 0.550 | 0.050 | 55.0% | 37.5% | -0.073 | 0.467 | 0.39 | balance,timeouts |
| NSBBQNKG | 40 | 0.438 | 0.063 | 72.5% | 25.0% | 0.099 | 0.377 | 0.34 | balance |
| RNRKSBAG | 40 | 0.563 | 0.063 | 52.5% | 47.5% | -0.101 | 0.341 | 0.41 | balance |
| GRKQAGSA | 40 | 0.438 | 0.063 | 37.5% | 50.0% | -0.251 | 0.325 | 0.35 | balance,timeouts,drawRate |
| GMRNBKNA | 40 | 0.575 | 0.075 | 70.0% | 20.0% | 0.070 | 0.499 | 0.41 | balance,timeouts |
| ANRQNSGK | 40 | 0.575 | 0.075 | 75.0% | 22.5% | 0.120 | 0.370 | 0.34 | balance |
| MSNGGAKN | 40 | 0.425 | 0.075 | 55.0% | 40.0% | -0.080 | 0.380 | 0.45 | balance |

(10 more rows in `sim/out/sweep-d3.r2.report.md`)

## Survivors
`KLBRANQN GRMGKNBB RKNSAARB AKLSNSMQ ARKAGNML MMBGARLK KARSNGQS RSKRBQML AGLSAKSN BLGKRSAG`

Round 1 numbers are noisy on purpose: at 20 games one arrangement's score carries about
±0.22. Halving spends the budget on the survivors, so trust the last round only,
and confirm it at a second depth before acting.
