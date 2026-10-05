# Piece activity: pa-acl

Files: `sim/out/pa-acl.shard0of3.jsonl`, `sim/out/pa-acl.shard1of3.jsonl`, `sim/out/pa-acl.shard2of3.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMSS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4293 | 8586 | 6.32 | 1.21 [1.19, 1.25] | 1.16 | 1.29 [1.26, 1.32] | 8.4% | 96.0% | 29.0 |
| O ogre | 4293 | 8586 | 5.61 | 1.08 [1.05, 1.11] | 0.53 | 0.60 [0.58, 0.62] | 11.3% | 95.2% | 22.0 |
| R rook | 6666 | 17078 | 4.32 | 0.83 [0.81, 0.85] | 0.85 | 0.95 [0.93, 0.97] | 16.9% | 93.4% | 38.0 |
| B bishop | 6358 | 14822 | 3.87 | 0.74 [0.73, 0.76] | 0.82 | 0.92 [0.90, 0.93] | 5.9% | 98.4% | 19.0 |
| N knight | 6663 | 17112 | 4.09 | 0.79 [0.78, 0.80] | 0.74 | 0.82 [0.81, 0.83] | 1.4% | 99.9% | 7.0 |
| A archer | 6675 | 17184 | 7.39 | 1.42 [1.41, 1.44] | 1.19 | 1.33 [1.31, 1.36] | 3.2% | 98.9% | 16.0 |
| G guard | 4305 | 8610 | 3.10 | 0.60 [0.57, 0.63] | 0.00 | cannot capture | 25.9% | 83.5% | 32.0 |
| M maester | 6698 | 17080 | 6.22 | 1.20 [1.18, 1.21] | 0.57 | 0.64 [0.63, 0.65] | 5.9% | 98.1% | 19.0 |
| S beast | 6613 | 16942 | 5.41 | 1.04 [1.03, 1.05] | 1.24 | 1.38 [1.35, 1.41] | 3.7% | 99.5% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.069 | 0.60 | 0.210 | 1.23 | 0.411 | 1.68 | 0.200 | 2.06 |
| O ogre | 0.079 | 0.68 | 0.140 | 0.82 | 0.280 | 1.14 | 0.154 | 1.82 |
| R rook | 0.037 | 0.31 | 0.160 | 0.94 | 0.371 | 1.51 | 0.151 | 2.46 |
| B bishop | 0.114 | 0.98 | 0.177 | 1.04 | 0.249 | 1.02 | 0.162 | 1.54 |
| N knight | 0.229 | 1.97 | 0.221 | 1.30 | 0.255 | 1.04 | 0.228 | 1.12 |
| A archer | 0.146 | 1.25 | 0.199 | 1.17 | 0.242 | 0.99 | 0.195 | 1.24 |
| G guard | 0.029 | 0.25 | 0.034 | 0.20 | 0.106 | 0.43 | 0.059 | 1.81 |
| M maester | 0.115 | 0.99 | 0.201 | 1.18 | 0.277 | 1.13 | 0.186 | 1.49 |
| S beast | 0.156 | 1.34 | 0.171 | 1.00 | 0.202 | 0.82 | 0.173 | 1.17 |
| average piece | 0.117 | 1.00 | 0.170 | 1.00 | 0.245 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4293 | 4707 | -3.0 [-4.9, -1.3] | +0.8 [-1.1, +2.6] | -8.0% [-9.9%, -6.1%] |
| O ogre | 4293 | 4707 | +0.6 [-1.2, +2.3] | +1.6 [-0.3, +3.4] | 0.9% [-1.3%, 3.1%] |
| R rook | 6666 | 2334 | -2.0 [-3.9, +0.0] | +0.4 [-1.7, +2.3] | -3.2% [-5.5%, -0.9%] |
| B bishop | 6358 | 2642 | +0.2 [-1.8, +2.2] | +0.7 [-1.2, +2.8] | -1.2% [-3.4%, 1.2%] |
| N knight | 6663 | 2337 | +3.1 [+1.0, +5.0] | -1.1 [-3.1, +1.0] | -2.5% [-4.9%, 0.0%] |
| A archer | 6675 | 2325 | +1.0 [-0.8, +3.0] | -1.8 [-4.1, +0.4] | 7.9% [5.3%, 10.7%] |
| G guard | 4305 | 4695 | +1.7 [-0.1, +3.5] | +1.2 [-0.6, +3.0] | 5.9% [3.6%, 8.1%] |
| M maester | 6698 | 2302 | +3.6 [+1.7, +5.6] | -0.0 [-2.2, +2.2] | 6.9% [4.3%, 9.7%] |
| S beast | 6613 | 2387 | -7.5 [-9.6, -5.4] | -1.7 [-3.7, +0.3] | -7.7% [-9.6%, -5.9%] |
| all games | 9000 | | draws 22.3% | White 51.3% | 107.0 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.29 [1.26, 1.32] | PASS 1.21 [1.19, 1.25] | PASS 2.06 | PASS 1.68 [1.64, 1.71] | PASS 91.6% [90.9%, 92.3%] | pass? |
| O ogre | PASS 0.60 [0.58, 0.62] | PASS 1.08 [1.05, 1.11] | PASS 1.82 | PASS 1.14 [1.10, 1.19] | PASS 88.7% [87.9%, 89.5%] | pass? |
| R rook | PASS 0.95 [0.93, 0.97] | PASS 0.83 [0.81, 0.85] | PASS 2.46 | PASS 1.51 [1.49, 1.54] | FAIL 83.1% [82.4%, 83.8%] | pass? |
| B bishop | PASS 0.92 [0.90, 0.93] | PASS 0.74 [0.73, 0.76] | PASS 1.54 | PASS 1.04 [1.02, 1.05] | PASS 94.1% [93.7%, 94.6%] | pass? |
| N knight | PASS 0.82 [0.81, 0.83] | PASS 0.79 [0.78, 0.80] | PASS 1.12 | PASS 1.97 [1.94, 1.99] | PASS 98.6% [98.4%, 98.8%] | fail? (draws) |
| A archer | PASS 1.33 [1.31, 1.36] | PASS 1.42 [1.41, 1.44] | PASS 1.24 | PASS 1.25 [1.23, 1.27] | PASS 96.8% [96.5%, 97.1%] | pass? |
| G guard | n/a (cannot capture; flagged) | PASS 0.60 [0.57, 0.63] | PASS 1.81 | FAIL 0.43 [0.41, 0.46] | FAIL 74.1% [73.1%, 75.4%] | pass? |
| M maester | PASS 0.64 [0.63, 0.65] | PASS 1.20 [1.18, 1.21] | PASS 1.49 | PASS 1.18 [1.17, 1.20] | PASS 94.1% [93.6%, 94.6%] | fail? (draws) |
| S beast | PASS 1.38 [1.35, 1.41] | PASS 1.04 [1.03, 1.05] | PASS 1.17 | PASS 1.34 [1.32, 1.36] | PASS 96.3% [95.9%, 96.7%] | FAIL (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
