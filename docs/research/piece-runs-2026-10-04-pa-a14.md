# Piece activity: pa-a14

Files: `sim/out/pa-a14.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 5.95 | 1.18 [1.15, 1.20] | 1.16 | 1.17 [1.14, 1.19] | 7.9% | 96.9% | 30.0 |
| O ogre | 4633 | 9266 | 4.85 | 0.96 [0.93, 0.98] | 0.54 | 0.54 [0.53, 0.56] | 11.4% | 95.5% | 23.0 |
| R rook | 7014 | 18348 | 4.21 | 0.83 [0.82, 0.85] | 0.88 | 0.88 [0.87, 0.90] | 16.4% | 94.5% | 39.0 |
| B bishop | 6741 | 16112 | 3.52 | 0.70 [0.68, 0.71] | 0.81 | 0.81 [0.80, 0.82] | 6.5% | 98.3% | 20.0 |
| N knight | 6983 | 18256 | 3.85 | 0.76 [0.75, 0.77] | 0.71 | 0.71 [0.70, 0.73] | 1.5% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 8.53 | 1.68 [1.67, 1.70] | 2.07 | 2.08 [2.06, 2.11] | 2.5% | 99.4% | 16.0 |
| G guard | 4714 | 9428 | 2.73 | 0.54 [0.51, 0.56] | 0.00 | cannot capture | 27.6% | 82.9% | 33.0 |
| M maester | 6926 | 18052 | 5.72 | 1.13 [1.12, 1.14] | 0.58 | 0.58 [0.57, 0.60] | 6.0% | 98.4% | 20.0 |
| S beast | 4593 | 9186 | 5.44 | 1.07 [1.06, 1.09] | 1.10 | 1.10 [1.07, 1.14] | 4.0% | 98.7% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.071 | 0.59 | 0.215 | 1.15 | 0.434 | 1.62 | 0.198 | 2.19 |
| O ogre | 0.077 | 0.64 | 0.139 | 0.75 | 0.265 | 0.99 | 0.143 | 1.86 |
| R rook | 0.037 | 0.31 | 0.169 | 0.91 | 0.388 | 1.44 | 0.153 | 2.53 |
| B bishop | 0.109 | 0.91 | 0.175 | 0.94 | 0.240 | 0.89 | 0.155 | 1.55 |
| N knight | 0.227 | 1.88 | 0.213 | 1.15 | 0.248 | 0.92 | 0.223 | 1.11 |
| A archer | 0.208 | 1.73 | 0.290 | 1.56 | 0.318 | 1.18 | 0.269 | 1.18 |
| G guard | 0.027 | 0.23 | 0.032 | 0.17 | 0.101 | 0.38 | 0.053 | 1.90 |
| M maester | 0.111 | 0.92 | 0.196 | 1.05 | 0.289 | 1.07 | 0.180 | 1.60 |
| S beast | 0.150 | 1.25 | 0.191 | 1.03 | 0.252 | 0.94 | 0.187 | 1.35 |
| average piece | 0.120 | 1.00 | 0.186 | 1.00 | 0.269 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -2.8 [-4.4, -1.2] | +0.3 [-1.5, +2.2] | -8.1% [-9.8%, -6.2%] |
| O ogre | 4633 | 4367 | -0.7 [-2.3, +1.0] | +0.7 [-1.1, +2.4] | 1.5% [-0.5%, 3.5%] |
| R rook | 7014 | 1986 | -1.6 [-3.6, +0.4] | +0.7 [-1.6, +2.8] | -0.1% [-2.4%, 2.1%] |
| B bishop | 6741 | 2259 | +1.9 [+0.1, +4.0] | -1.3 [-3.4, +0.8] | -1.3% [-3.5%, 0.8%] |
| N knight | 6983 | 2017 | +1.2 [-0.7, +3.1] | +1.7 [-0.4, +3.7] | -0.5% [-2.8%, 1.9%] |
| A archer | 6988 | 2012 | -5.9 [-7.9, -3.9] | +0.7 [-1.5, +3.0] | -4.8% [-6.9%, -2.7%] |
| G guard | 4714 | 4286 | +2.9 [+1.4, +4.6] | -0.1 [-1.9, +1.7] | 6.8% [4.9%, 8.8%] |
| M maester | 6926 | 2074 | +3.3 [+1.5, +5.3] | -1.1 [-3.3, +1.0] | 8.4% [5.8%, 11.1%] |
| S beast | 4593 | 4407 | -3.2 [-4.8, -1.5] | -1.1 [-3.0, +0.7] | -6.2% [-7.9%, -4.5%] |
| all games | 9000 | | draws 18.9% | White 51.6% | 103.7 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.17 [1.14, 1.19] | PASS 1.18 [1.15, 1.20] | PASS 2.19 | PASS 1.62 [1.58, 1.65] | PASS 92.1% [91.5%, 92.7%] | pass? |
| O ogre | PASS 0.54 [0.53, 0.56] | PASS 0.96 [0.93, 0.98] | PASS 1.86 | fail? 0.99 [0.95, 1.02] | PASS 88.6% [87.9%, 89.4%] | pass? |
| R rook | PASS 0.88 [0.87, 0.90] | PASS 0.83 [0.82, 0.85] | PASS 2.53 | PASS 1.44 [1.42, 1.47] | FAIL 83.6% [83.0%, 84.3%] | pass? |
| B bishop | PASS 0.81 [0.80, 0.82] | PASS 0.70 [0.68, 0.71] | PASS 1.55 | FAIL 0.94 [0.93, 0.95] | PASS 93.5% [93.1%, 93.9%] | pass? |
| N knight | PASS 0.71 [0.70, 0.73] | PASS 0.76 [0.75, 0.77] | PASS 1.11 | PASS 1.88 [1.86, 1.91] | PASS 98.5% [98.3%, 98.7%] | pass? |
| A archer | FAIL 2.08 [2.06, 2.11] | PASS 1.68 [1.67, 1.70] | PASS 1.18 | PASS 1.73 [1.70, 1.75] | PASS 97.5% [97.1%, 97.8%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.54 [0.51, 0.56] | PASS 1.90 | FAIL 0.38 [0.36, 0.40] | FAIL 72.4% [71.3%, 73.4%] | pass? |
| M maester | PASS 0.58 [0.57, 0.60] | PASS 1.13 [1.12, 1.14] | PASS 1.60 | PASS 1.07 [1.06, 1.09] | PASS 94.0% [93.6%, 94.4%] | fail? (draws) |
| S beast | PASS 1.10 [1.07, 1.14] | PASS 1.07 [1.06, 1.09] | PASS 1.35 | PASS 1.25 [1.22, 1.27] | PASS 96.0% [95.5%, 96.4%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
