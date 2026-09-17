# Strength ladder — are the AI players smart enough? (2026-09-13)

Batch-2 run R1 (`docs/RUNS.md`): what does one more ply of search buy, and which balance conclusions
survive a change of depth? Machine: Apple Silicon, 16 cores, Node 26, `tsx`. **Two other 16-worker
runs shared the machine for most of this session**, so every wall-clock time below is an upper
bound, not a throughput figure. Total play: about 1 h 15 m over seven runs.

## 1. Commands

```
npm run sim -- --spec sim/specs/ladder-d2v3.json --workers 16       # 200 games, 0h00m13s
npm run sim -- --spec sim/specs/ladder-d3v4.json --workers 16       # 200 games, 0h01m09s
npm run sim -- --spec sim/specs/ladder-d4v5.json --workers 16       # 200 games, 0h08m40s
npm run sim -- --spec sim/specs/ladder-d5v6.json --workers 16       #  60 games, 0h23m55s
npm run sim -- --spec sim/specs/restricted-d2v4.json --workers 16   # 200 games, 0h02m51s
npm run sim -- --id white-d5 --games 200 --depth 5 --sample 50 --seed 1 --workers 16   # 0h15m06s
npm run sim -- --id values-d5 --experiment values --games 120 --depth 5 --seed 1 \
  --pieces AGS --eloPerPawn 65 --workers 16                                           # 0h21m48s
npm run sim:analyze -- --id smoke --confirm white-d5
npm run dashboard
```

Per-side depth has no CLI flag, so each ladder rung is a JSON spec in `sim/specs/`. Every rung draws
one random back rank per pair from the full pool at seed 21, so the rungs share their openings.

## 2. The ladder

Colour-swapped pairs, 4 random opening plies, ply cap 300. Score and Elo belong to the **deeper**
side, folded over the swap (`armStats`).

| rung | games | pairs | pentanomial | deep score | Elo ± 95% | nElo | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|
| depth 2 vs 3 | 200 | 100 | [1, 6, 19, 37, 37] | 0.757 | **+198 ± 32** | +268 | 25.0% | 4.5% | 132 |
| depth 3 vs 4 | 200 | 100 | [2, 6, 23, 32, 37] | 0.740 | **+182 ± 34** | +234 | 26.0% | 8.0% | 147 |
| depth 4 vs 5 | 200 | 100 | [1, 5, 23, 49, 22] | 0.715 | **+160 ± 29** | +249 | 31.0% | 10.0% | 146 |
| depth 5 vs 6 | 60 | 30 | [0, 0, 5, 20, 5] | 0.750 | **+191 ± 36** | +425 | 38.3% | 5.0% | 140 |

**Cumulative depth 2 to depth 6: +730 ± 66 Elo** (the four rungs added, errors in quadrature).

**The pair machinery switches on by itself.** `usePairs()` compares the two sides, so unequal depth
is enough: the runner prints `pairs on` and each rung returns complete pairs (100, 100, 100, 30).
The equal-depth control in §3 prints `pairs off` — one engine at one fixed depth replays the swap.

**Each ply still buys about 180 Elo** (+198, +182, +160, +191, intervals overlapping); a converged
engine shows a clear fall per ply. **The deeper side almost never loses**: at depth 5 against 6 no
pair went to the shallow side. **Draws rise with depth** — 25.0%, 26.0%, 31.0%, 38.3%, the AlphaZero
pattern (chess960.md §5). The last rung plays 60 games, not 100: 100 needed about 1 h 19 m, over the
40-minute budget in `docs/RUNS.md`.

## 3. Depth-5 confirmations

**White advantage — the same 50 back ranks at three depths.**

| depth | games | white score | white Elo ± | decisive | draws | capped | plies | guard use | archer use |
|---|---|---|---|---|---|---|---|---|---|
| 3 (`smoke`) | 200 | 0.542 | +30 ± 40 | 68.5% | 27.5% | 4.0% | 131 | 1.53 | 1.76 |
| 4 (`smoke-d4`) | 200 | 0.545 | +31 ± 38 | 63.0% | 32.5% | 4.5% | 147 | 1.96 | 1.65 |
| 5 (`white-d5`) | 200 | 0.535 | **+24 ± 34** | 50.0% | 43.5% | 6.5% | 144 | 1.66 | 1.96 |

White's edge holds near +30 Elo over three budgets, and no interval excludes zero. `--confirm
white-d5` flips 34 of the 50 ranks against depth 3 (the depth-4 run flipped 36) — at 4 games a rank
that measures noise. Decisiveness falls from 68.5% to 50.0% with the ply count flat: better defence,
not longer games.

**Odds matches: archer, guard and beast against a knight.** Each arm replaces one knight of `RNBQKBNR` with the fairy piece, on one side only, in colour-
reversed pairs. `--eloPerPawn 65` reuses the depth-3 pawn scale, so no calibration arm was played
and the rows stay in Elo. Engine seeds are today's: archer 170, guard 185, beast 195.

| arm | depth 3 (500 games) | depth 4 (120 games) | depth 5 (120 games) | pentanomial at depth 5 | sign holds |
|---|---|---|---|---|---|
| A archer | −139 ± 26 | −117 ± 51 | **−161 ± 48** | [25, 8, 23, 2, 2] | yes |
| G guard | −202 ± 26 | −241 ± 51 | **−260 ± 42** | [34, 11, 13, 1, 1] | yes |
| S beast | −220 ± 23 | −199 ± 49 | **−260 ± 43** | [35, 9, 14, 1, 1] | yes |

**The three bounds hold, and they get worse with depth.** Every depth-5 interval overlaps its
depth-3 and depth-4 partner, so no sign changes and the SIM-PLAN §9 test passes. All three deltas
stay outside Muller's ±1.5-pawn band, so the rows are bounds ("far below a knight"), not values.
Guard and beast move about 50 Elo further from the knight between depth 3 and depth 5 — one combined
error bar each, both the same way. A deeper search punishes the three pieces harder. The arms play
120 games, not 200: 200 per arm needed about 57 minutes, over this section's ~60-minute budget.

## 4. Restricted play (SIM-PLAN §5)

Depth 4 against depth 2 on the 10 arrangements that survived the pass-2 sweep, 20 games each,
common random numbers. The score belongs to the depth-4 side.

| back rank | pentanomial | deep score | Elo ± 95% | draws | capped | plies |
|---|---|---|---|---|---|---|
| QKNALSRM | [0, 0, 1, 1, 8] | 0.925 | +436 ± 69 | 5.0% | 0.0% | 100 |
| MNABAKSM | [0, 0, 0, 4, 6] | 0.900 | +381 ± 53 | 10.0% | 10.0% | 129 |
| NSBBQNKG | [0, 1, 0, 2, 7] | 0.875 | +338 ± 99 | 15.0% | 0.0% | 80 |
| LABKRSQN | [0, 0, 1, 3, 6] | 0.875 | +338 ± 72 | 15.0% | 0.0% | 108 |
| LGKBSMGR | [0, 0, 1, 5, 4] | 0.825 | +269 ± 69 | 20.0% | 5.0% | 137 |
| BSALNRKG | [0, 0, 2, 4, 4] | 0.800 | +241 ± 81 | 10.0% | 10.0% | 134 |
| ARKAGNML | [0, 0, 2, 5, 3] | 0.775 | +215 ± 75 | 25.0% | 10.0% | 154 |
| BNMKGMLA | [0, 0, 3, 3, 4] | 0.775 | +215 ± 90 | 25.0% | 0.0% | 128 |
| AGSMRSMK | [0, 0, 2, 5, 3] | 0.775 | +215 ± 75 | 25.0% | 20.0% | 174 |
| MSNGGAKN | [0, 1, 3, 1, 5] | 0.750 | +191 ± 118 | 25.0% | 5.0% | 137 |
| **pooled (200 games, 100 pairs)** | [0, 2, 15, 33, 50] | **0.827** | **+272 ± 27** | 17.5% | 6.0% | 128 |

**Every rank rewards skill**: the plan's gate is 65% for the deeper side, and the ranks read 75.0%
to 92.5%. **The skill trace does not separate them.** A one-way ANOVA over the 100 pair scores reads
**F(9, 90) = 0.95** — under 1, so the between-rank spread is not even as large as chance predicts
(rank means spread 0.059, noise on one mean 0.063). SIM-PLAN §5 asks for 100 games a rank; it is
right.

## 5. Verdict

**The players are not strong, and the balance conclusions do not need them to be.** Each ply still
buys about 180 Elo, so a depth-3 player is about 730 Elo below a depth-6 player: the engine is far
from converged. What matters is which conclusions move, and three do not — White's advantage (+30,
+31, +24 Elo at depths 3, 4, 5 on the same 50 ranks), the odds matches (archer, guard and beast far
below a knight at all three depths, the gap widening), and "the game rewards skill" (75% or more for
the deeper side on every surviving rank). Act on those from depth-3 runs with a depth-5 sign check.
Two classes of number are **not** depth-stable: every draw rate and decisiveness figure drifts hard
(draws 27.5% at depth 3, 43.5% at depth 5, ply count flat), and the interest score inherits that
drift through its draw-rate and lead terms; and no per-arrangement ranking survives, since 34 of 50
ranks flip the sign of their White edge and the skill trace reads F = 0.95. Rule for the rest of
batch 2: play the population at depth 3 for the sample size, confirm every headline sign at depth 5,
print the depth beside every draw rate, and give a per-arrangement claim 100 games a rank.
