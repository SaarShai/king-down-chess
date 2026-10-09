# Piece activity: pa-af2

Files: `sim/out/pa-af2.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.01 | 1.21 [1.18, 1.23] | 1.30 | 1.33 [1.30, 1.36] | 7.6% | 97.2% | 29.0 |
| O ogre | 4633 | 9266 | 4.72 | 0.95 [0.93, 0.97] | 0.60 | 0.62 [0.60, 0.64] | 11.1% | 95.7% | 23.0 |
| R rook | 7014 | 18348 | 4.38 | 0.88 [0.86, 0.90] | 0.98 | 1.00 [0.98, 1.02] | 16.2% | 94.3% | 39.0 |
| B bishop | 6741 | 16112 | 3.66 | 0.73 [0.72, 0.75] | 0.87 | 0.89 [0.88, 0.91] | 6.3% | 98.4% | 19.0 |
| N knight | 6983 | 18256 | 4.01 | 0.80 [0.79, 0.82] | 0.78 | 0.80 [0.78, 0.81] | 1.5% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 7.65 | 1.54 [1.52, 1.56] | 1.50 | 1.54 [1.51, 1.56] | 3.2% | 99.3% | 16.0 |
| G guard | 4714 | 9428 | 2.64 | 0.53 [0.50, 0.56] | 0.00 | cannot capture | 29.6% | 81.2% | 33.0 |
| M maester | 6926 | 18052 | 5.61 | 1.13 [1.11, 1.14] | 0.66 | 0.67 [0.66, 0.69] | 6.1% | 98.4% | 19.0 |
| S beast | 4593 | 9186 | 5.52 | 1.11 [1.09, 1.13] | 1.21 | 1.23 [1.20, 1.27] | 3.3% | 99.1% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.078 | 0.66 | 0.228 | 1.23 | 0.464 | 1.65 | 0.208 | 2.23 |
| O ogre | 0.078 | 0.66 | 0.138 | 0.74 | 0.263 | 0.94 | 0.142 | 1.86 |
| R rook | 0.037 | 0.31 | 0.169 | 0.91 | 0.405 | 1.44 | 0.158 | 2.57 |
| B bishop | 0.113 | 0.96 | 0.186 | 1.00 | 0.263 | 0.93 | 0.164 | 1.60 |
| N knight | 0.233 | 1.97 | 0.238 | 1.28 | 0.299 | 1.06 | 0.239 | 1.25 |
| A archer | 0.177 | 1.50 | 0.279 | 1.50 | 0.356 | 1.26 | 0.256 | 1.39 |
| G guard | 0.027 | 0.23 | 0.028 | 0.15 | 0.100 | 0.36 | 0.051 | 1.95 |
| M maester | 0.113 | 0.96 | 0.186 | 1.00 | 0.299 | 1.06 | 0.178 | 1.68 |
| S beast | 0.154 | 1.30 | 0.206 | 1.11 | 0.274 | 0.97 | 0.198 | 1.39 |
| average piece | 0.118 | 1.00 | 0.186 | 1.00 | 0.282 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -3.4 [-5.0, -1.7] | +2.1 [+0.3, +3.9] | -8.2% [-9.9%, -6.5%] |
| O ogre | 4633 | 4367 | -0.3 [-2.0, +1.4] | +0.9 [-1.0, +2.7] | 1.2% [-0.7%, 3.0%] |
| R rook | 7014 | 1986 | -0.8 [-2.9, +1.1] | +1.1 [-1.1, +3.3] | 0.6% [-1.8%, 3.0%] |
| B bishop | 6741 | 2259 | +2.6 [+0.6, +4.5] | -1.0 [-3.3, +1.3] | -1.3% [-3.4%, 0.8%] |
| N knight | 6983 | 2017 | -1.7 [-3.7, +0.3] | -1.8 [-4.2, +0.6] | -1.7% [-3.9%, 0.7%] |
| A archer | 6988 | 2012 | -4.1 [-6.1, -2.0] | +1.3 [-0.8, +3.4] | -3.5% [-5.8%, -1.1%] |
| G guard | 4714 | 4286 | +3.3 [+1.7, +4.8] | +1.1 [-0.7, +2.9] | 6.1% [4.3%, 8.0%] |
| M maester | 6926 | 2074 | +3.6 [+1.8, +5.4] | -1.4 [-3.7, +0.7] | 10.4% [8.0%, 13.0%] |
| S beast | 4593 | 4407 | -4.2 [-5.9, -2.5] | -0.7 [-2.6, +1.1] | -7.0% [-8.8%, -5.3%] |
| all games | 9000 | | draws 20.3% | White 52.0% | 104.8 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.33 [1.30, 1.36] | PASS 1.21 [1.18, 1.23] | PASS 2.23 | PASS 1.65 [1.62, 1.68] | PASS 92.4% [91.8%, 93.0%] | fail? (draws, White) |
| O ogre | PASS 0.62 [0.60, 0.64] | PASS 0.95 [0.93, 0.97] | PASS 1.86 | FAIL 0.94 [0.91, 0.97] | PASS 88.9% [88.2%, 89.7%] | pass? |
| R rook | PASS 1.00 [0.98, 1.02] | PASS 0.88 [0.86, 0.90] | PASS 2.57 | PASS 1.44 [1.41, 1.46] | FAIL 83.8% [83.1%, 84.4%] | pass? |
| B bishop | PASS 0.89 [0.88, 0.91] | PASS 0.73 [0.72, 0.75] | PASS 1.60 | pass? 1.00 [0.99, 1.02] | PASS 93.7% [93.2%, 94.1%] | pass? |
| N knight | PASS 0.80 [0.78, 0.81] | PASS 0.80 [0.79, 0.82] | PASS 1.25 | PASS 1.97 [1.95, 1.99] | PASS 98.5% [98.3%, 98.7%] | pass? |
| A archer | FAIL 1.54 [1.51, 1.56] | PASS 1.54 [1.52, 1.56] | PASS 1.39 | PASS 1.50 [1.49, 1.52] | PASS 96.8% [96.5%, 97.1%] | fail? (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.53 [0.50, 0.56] | PASS 1.95 | FAIL 0.36 [0.33, 0.38] | FAIL 70.4% [69.2%, 71.5%] | fail? (draws) |
| M maester | PASS 0.67 [0.66, 0.69] | PASS 1.13 [1.11, 1.14] | PASS 1.68 | PASS 1.06 [1.04, 1.08] | PASS 93.9% [93.5%, 94.3%] | fail? (draws, length) |
| S beast | PASS 1.23 [1.20, 1.27] | PASS 1.11 [1.09, 1.13] | PASS 1.39 | PASS 1.30 [1.27, 1.33] | PASS 96.7% [96.3%, 97.1%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
