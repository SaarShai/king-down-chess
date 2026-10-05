# Piece activity: pa-grs12

Files: `sim/out/pa-grs12.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.10 | 1.19 [1.16, 1.21] | 1.19 | 1.19 [1.17, 1.21] | 7.7% | 97.1% | 30.0 |
| O ogre | 4633 | 9266 | 4.93 | 0.96 [0.93, 0.99] | 0.55 | 0.55 [0.54, 0.57] | 11.4% | 95.8% | 23.0 |
| R rook | 7014 | 18348 | 4.30 | 0.84 [0.82, 0.85] | 0.89 | 0.89 [0.88, 0.91] | 15.6% | 94.8% | 39.0 |
| B bishop | 6741 | 16112 | 3.51 | 0.68 [0.67, 0.69] | 0.79 | 0.79 [0.78, 0.81] | 6.3% | 98.4% | 20.0 |
| N knight | 6983 | 18256 | 3.86 | 0.75 [0.74, 0.76] | 0.72 | 0.72 [0.71, 0.73] | 1.4% | 100.0% | 7.0 |
| A archer | 6988 | 18188 | 8.52 | 1.66 [1.64, 1.68] | 2.07 | 2.08 [2.05, 2.10] | 2.6% | 99.4% | 17.0 |
| G guard | 4714 | 9428 | 3.46 | 0.67 [0.65, 0.70] | 0.00 | cannot capture | 4.6% | 99.0% | 15.0 |
| M maester | 6926 | 18052 | 5.64 | 1.10 [1.08, 1.11] | 0.58 | 0.58 [0.56, 0.59] | 6.2% | 98.4% | 22.0 |
| S beast | 4593 | 9186 | 5.43 | 1.06 [1.04, 1.08] | 1.10 | 1.10 [1.07, 1.14] | 3.9% | 98.8% | 19.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.067 | 0.57 | 0.219 | 1.18 | 0.441 | 1.64 | 0.201 | 2.19 |
| O ogre | 0.076 | 0.64 | 0.139 | 0.75 | 0.271 | 1.01 | 0.144 | 1.88 |
| R rook | 0.036 | 0.30 | 0.168 | 0.90 | 0.385 | 1.43 | 0.153 | 2.51 |
| B bishop | 0.105 | 0.88 | 0.171 | 0.92 | 0.235 | 0.87 | 0.151 | 1.55 |
| N knight | 0.225 | 1.90 | 0.215 | 1.16 | 0.252 | 0.94 | 0.223 | 1.13 |
| A archer | 0.199 | 1.68 | 0.292 | 1.57 | 0.315 | 1.17 | 0.267 | 1.18 |
| G guard | 0.062 | 0.52 | 0.033 | 0.18 | 0.112 | 0.42 | 0.067 | 1.69 |
| M maester | 0.102 | 0.86 | 0.193 | 1.04 | 0.284 | 1.05 | 0.176 | 1.62 |
| S beast | 0.140 | 1.18 | 0.190 | 1.02 | 0.246 | 0.91 | 0.183 | 1.35 |
| average piece | 0.118 | 1.00 | 0.186 | 1.00 | 0.269 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -2.9 [-4.5, -1.2] | +0.1 [-1.7, +2.1] | -7.7% [-9.5%, -6.1%] |
| O ogre | 4633 | 4367 | -0.5 [-2.1, +1.1] | +0.7 [-1.2, +2.5] | 0.8% [-1.0%, 2.7%] |
| R rook | 7014 | 1986 | -0.6 [-2.8, +1.4] | +0.2 [-2.0, +2.6] | 0.3% [-2.0%, 2.5%] |
| B bishop | 6741 | 2259 | -0.8 [-2.8, +1.0] | +0.9 [-1.2, +3.0] | -1.0% [-3.1%, 1.2%] |
| N knight | 6983 | 2017 | +1.1 [-0.9, +3.0] | +0.1 [-2.2, +2.3] | 0.3% [-1.9%, 2.7%] |
| A archer | 6988 | 2012 | -5.8 [-7.9, -3.9] | -0.2 [-2.3, +1.9] | -3.8% [-5.9%, -1.6%] |
| G guard | 4714 | 4286 | +3.0 [+1.4, +4.5] | -0.3 [-2.2, +1.7] | 8.7% [6.8%, 10.8%] |
| M maester | 6926 | 2074 | +2.9 [+1.0, +4.7] | -1.0 [-3.3, +1.4] | 6.7% [4.3%, 9.2%] |
| S beast | 4593 | 4407 | -2.7 [-4.1, -1.0] | -0.5 [-2.4, +1.4] | -5.8% [-7.5%, -4.1%] |
| all games | 9000 | | draws 18.9% | White 51.5% | 104.7 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.19 [1.17, 1.21] | PASS 1.19 [1.16, 1.21] | PASS 2.19 | PASS 1.64 [1.60, 1.67] | PASS 92.3% [91.6%, 92.9%] | pass? |
| O ogre | PASS 0.55 [0.54, 0.57] | PASS 0.96 [0.93, 0.99] | PASS 1.88 | pass? 1.01 [0.97, 1.05] | PASS 88.6% [87.9%, 89.3%] | pass? |
| R rook | PASS 0.89 [0.88, 0.91] | PASS 0.84 [0.82, 0.85] | PASS 2.51 | PASS 1.43 [1.41, 1.45] | fail? 84.4% [83.8%, 85.1%] | pass? |
| B bishop | PASS 0.79 [0.78, 0.81] | PASS 0.68 [0.67, 0.69] | PASS 1.55 | FAIL 0.92 [0.90, 0.93] | PASS 93.7% [93.2%, 94.1%] | pass? |
| N knight | PASS 0.72 [0.71, 0.73] | PASS 0.75 [0.74, 0.76] | PASS 1.13 | PASS 1.90 [1.88, 1.92] | PASS 98.6% [98.4%, 98.7%] | pass? |
| A archer | FAIL 2.08 [2.05, 2.10] | PASS 1.66 [1.64, 1.68] | PASS 1.18 | PASS 1.68 [1.66, 1.70] | PASS 97.4% [97.1%, 97.7%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.67 [0.65, 0.70] | PASS 1.69 | FAIL 0.52 [0.52, 0.53] | PASS 95.4% [94.9%, 95.8%] | fail? (draws) |
| M maester | PASS 0.58 [0.56, 0.59] | PASS 1.10 [1.08, 1.11] | PASS 1.62 | PASS 1.05 [1.04, 1.07] | PASS 93.8% [93.3%, 94.2%] | pass? |
| S beast | PASS 1.10 [1.07, 1.14] | PASS 1.06 [1.04, 1.08] | PASS 1.35 | PASS 1.18 [1.16, 1.21] | PASS 96.1% [95.7%, 96.6%] | pass? |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
