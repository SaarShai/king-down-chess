# Piece activity: pa-gcs

Files: `sim/out/pa-gcs.shard0of2.jsonl`, `sim/out/pa-gcs.shard1of2.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMSS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4293 | 8586 | 5.71 | 1.15 [1.12, 1.18] | 1.09 | 1.13 [1.10, 1.16] | 10.7% | 95.2% | 31.0 |
| O ogre | 4293 | 8586 | 4.85 | 0.98 [0.95, 1.01] | 0.48 | 0.50 [0.48, 0.52] | 13.6% | 94.1% | 22.0 |
| R rook | 6666 | 17078 | 3.94 | 0.79 [0.78, 0.81] | 0.83 | 0.87 [0.85, 0.88] | 18.7% | 92.7% | 38.0 |
| B bishop | 6358 | 14822 | 3.49 | 0.70 [0.69, 0.72] | 0.79 | 0.82 [0.81, 0.84] | 7.2% | 98.2% | 19.0 |
| N knight | 6663 | 17112 | 3.87 | 0.78 [0.77, 0.79] | 0.71 | 0.74 [0.72, 0.75] | 1.6% | 99.9% | 7.0 |
| A archer | 6675 | 17184 | 8.27 | 1.67 [1.65, 1.69] | 2.02 | 2.10 [2.07, 2.12] | 3.3% | 99.0% | 16.0 |
| G guard | 4305 | 8610 | 2.76 | 0.56 [0.53, 0.58] | 0.00 | cannot capture | 29.6% | 80.5% | 33.0 |
| M maester | 6698 | 17080 | 5.68 | 1.15 [1.13, 1.16] | 0.52 | 0.54 [0.53, 0.56] | 7.5% | 98.0% | 20.0 |
| S beast | 6613 | 16942 | 5.06 | 1.02 [1.01, 1.03] | 1.05 | 1.09 [1.06, 1.11] | 5.0% | 99.1% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.065 | 0.54 | 0.211 | 1.15 | 0.431 | 1.66 | 0.194 | 2.22 |
| O ogre | 0.078 | 0.64 | 0.135 | 0.74 | 0.270 | 1.04 | 0.143 | 1.88 |
| R rook | 0.037 | 0.31 | 0.165 | 0.90 | 0.376 | 1.45 | 0.147 | 2.55 |
| B bishop | 0.109 | 0.90 | 0.172 | 0.94 | 0.238 | 0.92 | 0.154 | 1.55 |
| N knight | 0.226 | 1.87 | 0.211 | 1.15 | 0.247 | 0.95 | 0.222 | 1.12 |
| A archer | 0.202 | 1.67 | 0.286 | 1.56 | 0.305 | 1.18 | 0.263 | 1.16 |
| G guard | 0.027 | 0.22 | 0.032 | 0.18 | 0.106 | 0.41 | 0.055 | 1.93 |
| M maester | 0.110 | 0.91 | 0.192 | 1.05 | 0.280 | 1.08 | 0.177 | 1.58 |
| S beast | 0.147 | 1.22 | 0.181 | 0.99 | 0.222 | 0.85 | 0.176 | 1.26 |
| average piece | 0.121 | 1.00 | 0.183 | 1.00 | 0.260 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4293 | 4707 | -2.7 [-4.2, -1.3] | +0.9 [-1.0, +2.8] | -8.3% [-10.2%, -6.5%] |
| O ogre | 4293 | 4707 | +0.0 [-1.6, +1.5] | +0.8 [-1.2, +2.9] | -0.3% [-2.2%, 1.7%] |
| R rook | 6666 | 2334 | -0.6 [-2.4, +1.3] | -0.2 [-2.4, +2.0] | -0.9% [-3.4%, 1.3%] |
| B bishop | 6358 | 2642 | +0.1 [-1.7, +1.7] | +0.0 [-2.2, +2.2] | -1.3% [-3.3%, 1.0%] |
| N knight | 6663 | 2337 | +2.2 [+0.4, +4.0] | +1.6 [-0.7, +3.8] | 2.5% [-0.0%, 4.9%] |
| A archer | 6675 | 2325 | -5.4 [-7.3, -3.5] | -2.2 [-4.4, -0.1] | -0.1% [-2.6%, 2.3%] |
| G guard | 4305 | 4695 | +3.2 [+1.7, +4.8] | -1.6 [-3.6, +0.3] | 7.3% [5.2%, 9.5%] |
| M maester | 6698 | 2302 | +3.1 [+1.3, +4.9] | -1.3 [-3.5, +0.7] | 7.8% [5.2%, 10.3%] |
| S beast | 6613 | 2387 | -3.1 [-5.1, -1.3] | -0.3 [-2.6, +1.9] | -8.1% [-10.1%, -6.2%] |
| all games | 9000 | | draws 17.6% | White 51.2% | 100.9 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.13 [1.10, 1.16] | PASS 1.15 [1.12, 1.18] | PASS 2.22 | PASS 1.66 [1.62, 1.70] | PASS 89.3% [88.4%, 90.0%] | pass? |
| O ogre | pass? 0.50 [0.48, 0.52] | PASS 0.98 [0.95, 1.01] | PASS 1.88 | pass? 1.04 [0.99, 1.08] | PASS 86.4% [85.6%, 87.4%] | pass? |
| R rook | PASS 0.87 [0.85, 0.88] | PASS 0.79 [0.78, 0.81] | PASS 2.55 | PASS 1.45 [1.42, 1.48] | FAIL 81.3% [80.5%, 82.0%] | pass? |
| B bishop | PASS 0.82 [0.81, 0.84] | PASS 0.70 [0.69, 0.72] | PASS 1.55 | FAIL 0.94 [0.93, 0.95] | PASS 92.8% [92.4%, 93.3%] | pass? |
| N knight | PASS 0.74 [0.72, 0.75] | PASS 0.78 [0.77, 0.79] | PASS 1.12 | PASS 1.87 [1.84, 1.88] | PASS 98.4% [98.2%, 98.6%] | pass? |
| A archer | FAIL 2.10 [2.07, 2.12] | PASS 1.67 [1.65, 1.69] | PASS 1.16 | PASS 1.67 [1.65, 1.69] | PASS 96.7% [96.4%, 97.1%] | FAIL (draws, White) |
| G guard | n/a (cannot capture; flagged) | PASS 0.56 [0.53, 0.58] | PASS 1.93 | FAIL 0.41 [0.38, 0.43] | FAIL 70.4% [69.2%, 71.6%] | fail? (draws) |
| M maester | PASS 0.54 [0.53, 0.56] | PASS 1.15 [1.13, 1.16] | PASS 1.58 | PASS 1.08 [1.05, 1.10] | PASS 92.5% [92.1%, 93.0%] | fail? (draws) |
| S beast | PASS 1.09 [1.06, 1.11] | PASS 1.02 [1.01, 1.03] | PASS 1.26 | PASS 1.22 [1.20, 1.24] | PASS 95.0% [94.5%, 95.3%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
