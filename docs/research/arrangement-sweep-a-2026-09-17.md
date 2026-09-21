# Arrangement sweep A — 400 first rows ranked by the pre-registered criteria (2026-09-17)

Sweep A of the arrangement benchmark: 400 sampled first rows, 5 successive-halving rounds at depth 3,
seed 91, 8,000 games per round (40,000 in all), ranked after the fact by the rule pre-registered in
`docs/research/arrangement-benchmark-2026-09-17.md`. The headline: **14 of the 25 finalists pass the
fairness and capped-share gates**, and among those the top row is `RMSQNAAK`. No back-rank placement
feature separates the top from the bottom at this sample size; the event-diversity differences track
which fairy pieces the draw put in the row.

## Method

400 arrangements sampled from the pool `QLRRBBNNAAGMMSS` (7 pieces plus the king; both sides mirror
the row), seed 91, successive halving over 5 rounds at depth 3 with common random numbers inside each
round:

| round | arrangements | games each | games |
|---|---|---|---|
| 1 | 400 | 20 | 8,000 |
| 2 | 200 | 40 | 8,000 |
| 3 | 100 | 80 | 8,000 |
| 4 | 50 | 160 | 8,000 |
| 5 | 25 | 320 | 8,000 |

40,000 games in all, 6 workers, 4 random opening plies, ply cap 300, adjudication on; about 4.6 hours
of wall clock. Command:

```
node_modules/.bin/tsx src/sim/run.ts --id arr-a --experiment sweep --games 20 \
  --arrangements 400 --rounds 5 --depth 3 --seed 91 --workers 6
```

The halving key inside the sweep is `|white score − 0.5|` with raw interest as the tie-break (the
tool's own key). The ranking below is the **pre-registered rule applied to the round-5 report**
(`sim/out/arr-a.r5.report.json`): drop arrangements with `|score − 0.5| > 0.03` or capped share
> 0.05; rank the rest by the draw-rate residual of interest (`interestResiduals.interest`); break
ties by min utilisation, then by event diversity. Raw `interest` is printed beside the ranking key in
every table. Only **14 of the 25 finalists survive the gates**, so:

- the **ranked list** is those 14;
- the **top 20** of the ordering is ranks 1–20 and the **bottom 20** is ranks 6–25 (the two sets
  overlap in 6–20, because round 5 holds 25 rows); the disjoint extremes are ranks 1–5 and 21–25;
- the criteria table prints all 25 in ranking order with a `passes` column, so the discards and their
  failed gates stay visible.

The round-5 overall: white score 0.517, decisive 82.0%, draws 17.3%, capped 0.8%.

## Definitions

**Events per game** (from each stored record's `events` object, both sides summed; means are over the
320 games of the arrangement): archer shots = `archerShots`; beast chain moves = the total length of
the two `beastChains` lists; maester swaps = `maesterSwaps` (the long swaps to a king are a subset and
are not added); paladin sacrifices = `paladinSacrifices` (self-removing captures); promotions =
`promotions`; checks = `checks`. "Mechanics" = how many of those six counters are non-zero in a game,
averaged per arrangement.

**Features from the back rank string** (files a–h = 0–7):

- **queen present** — the row contains `Q`. The pool holds one queen, so this is a composition
  feature, not a placement one.
- **guard present** — the row contains `G` (one guard in the pool).
- **guard file distance to the king** — `abs(file(G) − file(K))`; "no guard" when absent.
- **archers adjacent** — the pool holds two archers; *adjacent* = both present with file distance 1,
  *apart* = both present with distance > 1, *incomplete* = fewer than two archers in the row.
- **maester adjacent to the king** — at least one `M` with `abs(file(M) − file(K)) = 1` (the pool
  holds two maesters).
- **number of distinct piece types** — distinct letters in the 8-letter row (8 = no duplicate,
  7 = one duplicated pool piece, and so on).
- **pawn-row contact** — the pre-registration's wording is "any piece on file of the king". Pawns
  start on every file (`src/rules/setup.ts`), so both readings are constants: the king's file always
  carries a pawn in front of the king, and no non-king piece can share the king's file in a valid
  row. The feature cannot separate anything in this pool; it is reported for completeness.

## Ranking outcome

`RMSQNAAK` (interest residual +0.006, 84.4% decisive, 15.6% draws, minUse 0.39) leads the 14 that
pass. Ranks 1 and 2 of the ordering, `KGBMSSMB` and `KSGLRMSB`, have the highest residuals (+0.015
and +0.007) but are **discarded by the fairness gate** (white scores 0.537 and 0.563). Every one of
the 11 discards fails on balance alone; the most white-favouring finalist is `KNQARMMS` at 0.570.
Two of the 14 ranked rows carry a non-fatal `drawRate` mark (`GMNKQBSR`, `BAKRGMAN`).

### Pre-registered ranked list — the 14 that pass the gates
| rank | set | back rank | games | white score | interest (resid.) | interest | interest(min) | decisive | draws | capped | xDec | fairyUse | minUse | passes | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | ranked | RMSQNAAK | 320 | 0.519 | 0.006 | 0.505 | 0.505 | 84.4% | 15.6% | 0.0% | 0.025 | 1.85 | 0.39 | yes | - |
| 4 | ranked | QNKMNRSG | 320 | 0.517 | 0.005 | 0.498 | 0.429 | 79.1% | 20.9% | 0.0% | -0.027 | 1.44 | 0.47 | yes | - |
| 5 | ranked | BKNSQAMB | 320 | 0.503 | 0.005 | 0.511 | 0.511 | 90.0% | 10.0% | 0.0% | 0.084 | 2.11 | 0.44 | yes | - |
| 6 | ranked | MRGNBSNK | 320 | 0.481 | 0.004 | 0.496 | 0.496 | 76.9% | 21.6% | 1.6% | -0.050 | 1.62 | 0.49 | yes | - |
| 9 | ranked | SRKRANMS | 320 | 0.489 | 0.003 | 0.503 | 0.503 | 84.1% | 15.3% | 0.6% | 0.024 | 2.10 | 0.41 | yes | - |
| 10 | ranked | SNRBGSNK | 320 | 0.494 | 0.002 | 0.502 | 0.502 | 83.8% | 15.3% | 0.9% | 0.021 | 1.59 | 0.45 | yes | - |
| 11 | ranked | GMNKQBSR | 320 | 0.486 | 0.001 | 0.486 | 0.472 | 70.3% | 27.8% | 1.9% | -0.114 | 1.60 | 0.47 | yes | drawRate |
| 12 | ranked | KNRMMRSA | 320 | 0.492 | 0.001 | 0.504 | 0.504 | 86.6% | 12.8% | 0.6% | 0.049 | 2.06 | 0.38 | yes | - |
| 13 | ranked | ASMMKNNB | 320 | 0.495 | 0.001 | 0.498 | 0.498 | 82.2% | 17.5% | 0.3% | 0.006 | 2.13 | 0.42 | yes | - |
| 15 | ranked | RNQSGKRB | 320 | 0.472 | -0.002 | 0.494 | 0.494 | 80.6% | 18.4% | 0.9% | -0.014 | 1.39 | 0.50 | yes | - |
| 22 | ranked | MQMKNABR | 320 | 0.492 | -0.007 | 0.490 | 0.490 | 82.2% | 17.8% | 0.0% | 0.005 | 2.25 | 0.39 | yes | - |
| 23 | ranked | MARNBBRK | 320 | 0.494 | -0.007 | 0.486 | 0.486 | 78.1% | 21.6% | 0.3% | -0.035 | 2.17 | 0.47 | yes | - |
| 24 | ranked | BAKRGMAN | 320 | 0.527 | -0.008 | 0.481 | 0.477 | 74.7% | 24.1% | 1.3% | -0.073 | 1.81 | 0.37 | yes | drawRate |
| 25 | ranked | GAMBRMAK | 320 | 0.491 | -0.010 | 0.487 | 0.370 | 82.5% | 17.5% | 0.0% | 0.008 | 1.65 | 0.35 | yes | - |

## Criteria — all 25 finalists in ranking order

`top 20` = ranks 1–20, `bottom 20` = ranks 6–25; `top+bottom` marks the overlap. The `passes` column
is the pre-registered gate; `gates` prints every failed viability gate (only `balance` and capped
share discard; `drawRate`, `duration` and `utilisation` are reported, not disqualifying).

### Round 5 criteria — all 25 arrangements in ranking order (top 20 = ranks 1–20, bottom 20 = ranks 6–25)
| rank | set | back rank | games | white score | interest (resid.) | interest | interest(min) | decisive | draws | capped | xDec | fairyUse | minUse | passes | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | top 20 | KGBMSSMB | 320 | 0.537 | 0.015 | 0.510 | 0.510 | 79.4% | 18.8% | 1.9% | -0.028 | 1.61 | 0.42 | no | balance |
| 2 | top 20 | KSGLRMSB | 320 | 0.563 | 0.007 | 0.503 | 0.503 | 80.0% | 18.1% | 1.9% | -0.026 | 1.50 | 0.45 | no | balance |
| 3 | top 20 | RMSQNAAK | 320 | 0.519 | 0.006 | 0.505 | 0.505 | 84.4% | 15.6% | 0.0% | 0.025 | 1.85 | 0.39 | yes | - |
| 4 | top 20 | QNKMNRSG | 320 | 0.517 | 0.005 | 0.498 | 0.429 | 79.1% | 20.9% | 0.0% | -0.027 | 1.44 | 0.47 | yes | - |
| 5 | top 20 | BKNSQAMB | 320 | 0.503 | 0.005 | 0.511 | 0.511 | 90.0% | 10.0% | 0.0% | 0.084 | 2.11 | 0.44 | yes | - |
| 6 | top+bottom | MRGNBSNK | 320 | 0.481 | 0.004 | 0.496 | 0.496 | 76.9% | 21.6% | 1.6% | -0.050 | 1.62 | 0.49 | yes | - |
| 7 | top+bottom | ASMQBGRK | 320 | 0.534 | 0.003 | 0.504 | 0.487 | 84.4% | 14.7% | 0.9% | 0.023 | 1.84 | 0.39 | no | balance |
| 8 | top+bottom | NKBBMGQS | 320 | 0.533 | 0.003 | 0.493 | 0.444 | 75.3% | 23.1% | 1.6% | -0.068 | 1.68 | 0.46 | no | balance |
| 9 | top+bottom | SRKRANMS | 320 | 0.489 | 0.003 | 0.503 | 0.503 | 84.1% | 15.3% | 0.6% | 0.024 | 2.10 | 0.41 | yes | - |
| 10 | top+bottom | SNRBGSNK | 320 | 0.494 | 0.002 | 0.502 | 0.502 | 83.8% | 15.3% | 0.9% | 0.021 | 1.59 | 0.45 | yes | - |
| 11 | top+bottom | GMNKQBSR | 320 | 0.486 | 0.001 | 0.486 | 0.472 | 70.3% | 27.8% | 1.9% | -0.114 | 1.60 | 0.47 | yes | drawRate |
| 12 | top+bottom | KNRMMRSA | 320 | 0.492 | 0.001 | 0.504 | 0.504 | 86.6% | 12.8% | 0.6% | 0.049 | 2.06 | 0.38 | yes | - |
| 13 | top+bottom | ASMMKNNB | 320 | 0.495 | 0.001 | 0.498 | 0.498 | 82.2% | 17.5% | 0.3% | 0.006 | 2.13 | 0.42 | yes | - |
| 14 | top+bottom | KNQARMMS | 320 | 0.570 | 0.000 | 0.501 | 0.501 | 84.7% | 15.0% | 0.3% | 0.020 | 2.03 | 0.39 | no | balance |
| 15 | top+bottom | RNQSGKRB | 320 | 0.472 | -0.002 | 0.494 | 0.494 | 80.6% | 18.4% | 0.9% | -0.014 | 1.39 | 0.50 | yes | - |
| 16 | top+bottom | KMNRBQAS | 320 | 0.539 | -0.003 | 0.499 | 0.499 | 85.9% | 13.8% | 0.3% | 0.038 | 2.01 | 0.44 | no | balance |
| 17 | top+bottom | BNKRMSAS | 320 | 0.533 | -0.003 | 0.500 | 0.500 | 86.6% | 13.1% | 0.3% | 0.045 | 2.07 | 0.39 | no | balance |
| 18 | top+bottom | LKQABSNR | 320 | 0.536 | -0.004 | 0.500 | 0.500 | 87.8% | 12.2% | 0.0% | 0.057 | 1.74 | 0.46 | no | balance |
| 19 | top+bottom | BRGNSRKA | 320 | 0.534 | -0.004 | 0.493 | 0.493 | 80.6% | 17.5% | 1.9% | -0.015 | 1.64 | 0.46 | no | balance |
| 20 | top+bottom | BBSKNMQR | 320 | 0.537 | -0.004 | 0.497 | 0.497 | 84.4% | 14.7% | 0.9% | 0.022 | 1.91 | 0.49 | no | balance |
| 21 | bottom 20 | AKLRRSGN | 320 | 0.561 | -0.004 | 0.496 | 0.496 | 84.7% | 14.7% | 0.6% | 0.021 | 1.54 | 0.48 | no | balance |
| 22 | bottom 20 | MQMKNABR | 320 | 0.492 | -0.007 | 0.490 | 0.490 | 82.2% | 17.8% | 0.0% | 0.005 | 2.25 | 0.39 | yes | - |
| 23 | bottom 20 | MARNBBRK | 320 | 0.494 | -0.007 | 0.486 | 0.486 | 78.1% | 21.6% | 0.3% | -0.035 | 2.17 | 0.47 | yes | - |
| 24 | bottom 20 | BAKRGMAN | 320 | 0.527 | -0.008 | 0.481 | 0.477 | 74.7% | 24.1% | 1.3% | -0.073 | 1.81 | 0.37 | yes | drawRate |
| 25 | bottom 20 | GAMBRMAK | 320 | 0.491 | -0.010 | 0.487 | 0.370 | 82.5% | 17.5% | 0.0% | 0.008 | 1.65 | 0.35 | yes | - |

## Event diversity (criterion 9)

Per-arrangement means over the 320 games of each finalist, from `sim/out/arr-a.r5.jsonl`. The
top-20/bottom-20 contrasts follow **which pieces the row contains**, not how many mechanics the games
use: beast chain moves are 1.72 per game in the top 20 against 1.29 in the bottom 20, and beasts
(`S`) are in 100% of the top-20 rows against 80% of the bottom-20 rows; archer shots are 2.27 against
3.18, with archers (`A`) in 55% of the top-20 rows against 70% of the bottom-20 rows. The sharp
disjoint extremes (top 5 vs bottom 5) repeat the pattern: archer shots 2.05 vs 5.70, beast chains
1.96 vs 0.28, checks 3.19 vs 4.63. "Mechanics engaged" is flat: 3.09 of 6 in the top 20, 3.05 in the
bottom 20 (top quartile 3.20, bottom quartile 3.06).

### Events per game — all 25 arrangements in ranking order
| rank | set | back rank | archer shots | beast chain moves | maester swaps | paladin sacrifices | promotions | checks | mechanics |
|---|---|---|---|---|---|---|---|---|---|
| 1 | top 20 | KGBMSSMB | 0.00 | 3.23 | 15.06 | 0.00 | 0.18 | 1.37 | 2.62 |
| 2 | top 20 | KSGLRMSB | 0.00 | 2.55 | 7.21 | 1.34 | 0.31 | 2.37 | 3.80 |
| 3 | top 20 | RMSQNAAK | 5.88 | 1.02 | 5.34 | 0.00 | 0.11 | 3.43 | 3.39 |
| 4 | top 20 | QNKMNRSG | 0.00 | 1.62 | 4.88 | 0.00 | 0.24 | 4.40 | 2.85 |
| 5 | top 20 | BKNSQAMB | 4.39 | 1.39 | 5.46 | 0.00 | 0.19 | 4.38 | 3.65 |
| 6 | top+bottom | MRGNBSNK | 0.00 | 1.99 | 5.38 | 0.00 | 0.34 | 3.37 | 2.87 |
| 7 | top+bottom | ASMQBGRK | 4.40 | 1.31 | 5.85 | 0.00 | 0.18 | 3.94 | 3.54 |
| 8 | top+bottom | NKBBMGQS | 0.00 | 1.57 | 6.82 | 0.00 | 0.19 | 3.95 | 2.76 |
| 9 | top+bottom | SRKRANMS | 3.99 | 2.13 | 6.36 | 0.00 | 0.21 | 3.42 | 3.66 |
| 10 | top+bottom | SNRBGSNK | 0.00 | 2.90 | 0.00 | 0.00 | 0.22 | 2.30 | 1.76 |
| 11 | top+bottom | GMNKQBSR | 0.00 | 1.43 | 7.60 | 0.00 | 0.23 | 3.21 | 2.67 |
| 12 | top+bottom | KNRMMRSA | 4.13 | 1.51 | 9.26 | 0.00 | 0.21 | 4.01 | 3.63 |
| 13 | top+bottom | ASMMKNNB | 4.61 | 1.72 | 8.56 | 0.00 | 0.23 | 3.38 | 3.72 |
| 14 | top+bottom | KNQARMMS | 4.24 | 1.27 | 9.73 | 0.00 | 0.20 | 3.88 | 3.55 |
| 15 | top+bottom | RNQSGKRB | 0.00 | 1.36 | 0.00 | 0.00 | 0.22 | 4.40 | 1.69 |
| 16 | top+bottom | KMNRBQAS | 3.76 | 1.18 | 4.74 | 0.00 | 0.15 | 3.33 | 3.41 |
| 17 | top+bottom | BNKRMSAS | 4.20 | 2.25 | 5.30 | 0.00 | 0.16 | 3.21 | 3.66 |
| 18 | top+bottom | LKQABSNR | 2.62 | 0.92 | 0.00 | 1.15 | 0.13 | 3.61 | 3.17 |
| 19 | top+bottom | BRGNSRKA | 3.10 | 1.41 | 0.00 | 0.00 | 0.22 | 3.67 | 2.59 |
| 20 | top+bottom | BBSKNMQR | 0.00 | 1.54 | 6.80 | 0.00 | 0.26 | 4.90 | 2.81 |
| 21 | bottom 20 | AKLRRSGN | 2.74 | 1.38 | 0.00 | 1.33 | 0.24 | 4.43 | 3.51 |
| 22 | bottom 20 | MQMKNABR | 4.73 | 0.00 | 11.13 | 0.00 | 0.30 | 5.38 | 3.02 |
| 23 | bottom 20 | MARNBBRK | 4.18 | 0.00 | 5.17 | 0.00 | 0.30 | 5.07 | 3.08 |
| 24 | bottom 20 | BAKRGMAN | 8.10 | 0.00 | 6.34 | 0.00 | 0.20 | 4.78 | 3.00 |
| 25 | bottom 20 | GAMBRMAK | 8.75 | 0.00 | 10.76 | 0.00 | 0.16 | 3.50 | 2.94 |

### Events — means and the piece that produces them
| event | piece | top 20 | bottom 20 | top 5 | bottom 5 | top quartile | bottom quartile | piece in top 20 | piece in bottom 20 |
|---|---|---|---|---|---|---|---|---|---|
| archer shots | A | 2.27 | 3.18 | 2.05 | 5.70 | 1.71 | 4.75 | 55.0% | 70.0% |
| beast chain moves | S | 1.72 | 1.29 | 1.96 | 0.28 | 1.97 | 0.49 | 100.0% | 80.0% |
| maester swaps | M | 5.72 | 5.49 | 7.59 | 6.68 | 7.22 | 6.70 | 80.0% | 75.0% |
| paladin sacrifices | L | 0.12 | 0.12 | 0.27 | 0.27 | 0.22 | 0.22 | 10.0% | 10.0% |
| promotions | - | 0.21 | 0.22 | 0.21 | 0.24 | 0.23 | 0.24 | - | - |
| checks | - | 3.53 | 3.89 | 3.19 | 4.63 | 3.22 | 4.68 | - | - |

Mechanics engaged per game (of the six, top/bottom): top 20 3.09, bottom 20 3.05, top 5 3.26, bottom 5 3.11, top quartile 3.20, bottom quartile 3.06.

## Feature splits (criterion 4 of the ranking rule)

Simple splits over all 25 finalists; no regression. The table gives the mean draw-rate-residualised
interest, the mean raw interest and the decisive share of each feature level, plus how many
arrangements of that level fall in the top 20, bottom 20, top/bottom quartile (6 each) and top/bottom
5.

**No feature separates the top from the bottom in this sample.** No feature is over-represented in
the top quartile; the largest lean is `distinctTypes = 6` (0 of 6 top-quartile rows, 2 of 6
bottom-quartile rows). The largest cell-level differences sit on 1–2 arrangements: archers adjacent
(n = 1, mean residual +0.006) against archers apart (n = 2, −0.009); `distinctTypes = 5` (n = 1,
+0.015) against the rest (≈ 0.000). The widest difference on a usable cell is **guard absent vs
present**: decisive 84.7% (n = 12) against 79.4% (n = 13), with mean interest −0.001 against +0.001.
Queen presence moves decisiveness by +0.9 points and nothing else. Maester-adjacent and
guard-distance cells show no monotone pattern. The two pawn-row features are constant by
construction, as defined above.

### Feature splits
| feature | level | n | mean interest (resid.) | mean interest | decisive | top 20 | bottom 20 | top quartile | bottom quartile | top 5 | bottom 5 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| queen | 0 | 13 | -0.000 | 0.497 | 81.5% | 9 | 11 | 3 | 4 | 2 | 4 |
| queen | 1 | 12 | 0.000 | 0.498 | 82.4% | 11 | 9 | 3 | 2 | 3 | 1 |
| guard | 0 | 12 | -0.001 | 0.499 | 84.7% | 10 | 10 | 2 | 3 | 2 | 2 |
| guard | 1 | 13 | 0.001 | 0.496 | 79.4% | 10 | 10 | 4 | 3 | 3 | 3 |
| guardKingDist | no guard | 12 | -0.001 | 0.499 | 84.7% | 10 | 10 | 2 | 3 | 2 | 2 |
| guardKingDist | 1 | 2 | 0.006 | 0.502 | 80.0% | 2 | 1 | 1 | 0 | 1 | 0 |
| guardKingDist | 2 | 3 | 0.001 | 0.496 | 79.7% | 2 | 2 | 1 | 1 | 1 | 1 |
| guardKingDist | 3 | 2 | 0.002 | 0.494 | 77.0% | 2 | 2 | 0 | 0 | 0 | 0 |
| guardKingDist | 4 | 2 | -0.000 | 0.493 | 78.0% | 2 | 2 | 0 | 0 | 0 | 0 |
| guardKingDist | 5 | 3 | 0.001 | 0.497 | 80.2% | 2 | 2 | 2 | 1 | 1 | 1 |
| guardKingDist | 6 | 0 | - | - | - | 0 | 0 | 0 | 0 | 0 | 0 |
| guardKingDist | 7 | 1 | -0.010 | 0.487 | 82.5% | 0 | 1 | 0 | 1 | 0 | 1 |
| archers | adjacent | 1 | 0.006 | 0.505 | 84.4% | 1 | 0 | 1 | 0 | 1 | 0 |
| archers | apart | 2 | -0.009 | 0.484 | 78.6% | 0 | 2 | 0 | 2 | 0 | 2 |
| archers | incomplete | 22 | 0.001 | 0.498 | 82.2% | 19 | 18 | 5 | 4 | 4 | 3 |
| maesterNearKing | 0 | 21 | 0.000 | 0.498 | 81.9% | 17 | 17 | 5 | 5 | 4 | 4 |
| maesterNearKing | 1 | 4 | -0.001 | 0.496 | 82.3% | 3 | 3 | 1 | 1 | 1 | 1 |
| distinctTypes | 5 | 1 | 0.015 | 0.510 | 79.4% | 1 | 0 | 1 | 0 | 1 | 0 |
| distinctTypes | 6 | 6 | -0.002 | 0.497 | 82.9% | 4 | 6 | 0 | 2 | 0 | 2 |
| distinctTypes | 7 | 14 | -0.000 | 0.497 | 81.7% | 11 | 10 | 5 | 4 | 4 | 3 |
| distinctTypes | 8 | 4 | -0.000 | 0.497 | 82.1% | 4 | 4 | 0 | 0 | 0 | 0 |
| pawnRowContact | 0 | 0 | - | - | - | 0 | 0 | 0 | 0 | 0 | 0 |
| pawnRowContact | 1 | 25 | -0.000 | 0.498 | 82.0% | 20 | 20 | 6 | 6 | 5 | 5 |
| nonKingOnKingFile | 0 | 25 | -0.000 | 0.498 | 82.0% | 20 | 20 | 6 | 6 | 5 | 5 |
| nonKingOnKingFile | 1 | 0 | - | - | - | 0 | 0 | 0 | 0 | 0 | 0 |

The ranking key matters in the middle: ordering by the residual instead of raw interest moves
`NKBBMGQS` and `GMNKQBSR` up 12 places and `MRGNBSNK` and `QNKMNRSG` up 11, while the top three of
the residual list (`RMSQNAAK`, `KGBMSSMB`, `BKNSQAMB`) move at most 4 places. The full shift table
is in `sim/specs/arrangement-2026-09-17/sweep-a-tables.md`.

## What this suggests

- **The fairness gate bites harder than the halving.** The sweep kept the 25 most balanced rows at
  160 games, yet 11 of 25 still sit beyond ±0.03 white score at 320 games (0.472–0.570). A first-row
  screen that only enforces the gate at the final sample size would need more arrangements per
  round, or a wider gate.
- **Placement is not the lever in this pool.** With 25 rows, no back-rank feature (queen, guard,
  guard distance, archers, maester, distinct-type count) separates the top from the bottom beyond
  noise. The two strongest directional hints — archers adjacent over apart, and the single
  five-type row — rest on 1–2 arrangements and need a larger sweep to test.
- **Event diversity is composition, not liveliness.** The top set's games show more beast chains and
  fewer archer shots because more of those rows contain a beast and fewer contain archers; the mean
  number of mechanics engaged is the same (3.09 vs 3.05). Read criterion 9 next to the row's
  composition, or it measures the pool draw.
- **Interest residuals are small.** The whole ranked list spans −0.010…+0.006 in the residual (raw
  0.481–0.511), so the order is fragile in the middle; the top three by the residual all sit in the
  top five of both keys, but the middle moves by up to 12 places when raw interest is used.
- **Next step (pre-registered rule 5):** re-run the top 10 of the ranked list at depth 4 and keep
  only those whose interest stays in the top half. That is a separate arm.

## Appendix — ranked top 50

The 50 rows are: the 14 ranked round-5 rows, then the 11 round-5 rows the gates discard, then the 25
round-4 non-finalists (all of which fail the gates on their round-4 data; no gated round-4 row missed
the final). Rows after the first 14 are marked with their failed gates.

### Ranked top 50
| rank | round | back rank | interest (resid.) | interest | decisive | draws | minUse | gates |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 (finalist) | RMSQNAAK | 0.006 | 0.505 | 84.4% | 15.6% | 0.39 | - |
| 2 | 5 (finalist) | QNKMNRSG | 0.005 | 0.498 | 79.1% | 20.9% | 0.47 | - |
| 3 | 5 (finalist) | BKNSQAMB | 0.005 | 0.511 | 90.0% | 10.0% | 0.44 | - |
| 4 | 5 (finalist) | MRGNBSNK | 0.004 | 0.496 | 76.9% | 21.6% | 0.49 | - |
| 5 | 5 (finalist) | SRKRANMS | 0.003 | 0.503 | 84.1% | 15.3% | 0.41 | - |
| 6 | 5 (finalist) | SNRBGSNK | 0.002 | 0.502 | 83.8% | 15.3% | 0.45 | - |
| 7 | 5 (finalist) | GMNKQBSR | 0.001 | 0.486 | 70.3% | 27.8% | 0.47 | drawRate |
| 8 | 5 (finalist) | KNRMMRSA | 0.001 | 0.504 | 86.6% | 12.8% | 0.38 | - |
| 9 | 5 (finalist) | ASMMKNNB | 0.001 | 0.498 | 82.2% | 17.5% | 0.42 | - |
| 10 | 5 (finalist) | RNQSGKRB | -0.002 | 0.494 | 80.6% | 18.4% | 0.50 | - |
| 11 | 5 (finalist) | MQMKNABR | -0.007 | 0.490 | 82.2% | 17.8% | 0.39 | - |
| 12 | 5 (finalist) | MARNBBRK | -0.007 | 0.486 | 78.1% | 21.6% | 0.47 | - |
| 13 | 5 (finalist) | BAKRGMAN | -0.008 | 0.481 | 74.7% | 24.1% | 0.37 | drawRate |
| 14 | 5 (finalist) | GAMBRMAK | -0.010 | 0.487 | 82.5% | 17.5% | 0.35 | - |
| 15 | 5 (finalist) | KGBMSSMB | 0.015 | 0.510 | 79.4% | 18.8% | 0.42 | balance |
| 16 | 5 (finalist) | KSGLRMSB | 0.007 | 0.503 | 80.0% | 18.1% | 0.45 | balance |
| 17 | 5 (finalist) | ASMQBGRK | 0.003 | 0.504 | 84.4% | 14.7% | 0.39 | balance |
| 18 | 5 (finalist) | NKBBMGQS | 0.003 | 0.493 | 75.3% | 23.1% | 0.46 | balance |
| 19 | 5 (finalist) | KNQARMMS | 0.000 | 0.501 | 84.7% | 15.0% | 0.39 | balance |
| 20 | 5 (finalist) | KMNRBQAS | -0.003 | 0.499 | 85.9% | 13.8% | 0.44 | balance |
| 21 | 5 (finalist) | BNKRMSAS | -0.003 | 0.500 | 86.6% | 13.1% | 0.39 | balance |
| 22 | 5 (finalist) | LKQABSNR | -0.004 | 0.500 | 87.8% | 12.2% | 0.46 | balance |
| 23 | 5 (finalist) | BRGNSRKA | -0.004 | 0.493 | 80.6% | 17.5% | 0.46 | balance |
| 24 | 5 (finalist) | BBSKNMQR | -0.004 | 0.497 | 84.4% | 14.7% | 0.49 | balance |
| 25 | 5 (finalist) | AKLRRSGN | -0.004 | 0.496 | 84.7% | 14.7% | 0.48 | balance |
| 26 | 4 (non-finalist) | RKMNSQMB | 0.011 | 0.508 | 83.8% | 15.6% | 0.46 | balance |
| 27 | 4 (non-finalist) | NKSSARRG | 0.009 | 0.501 | 79.4% | 18.8% | 0.44 | balance |
| 28 | 4 (non-finalist) | RNQSMMGK | 0.008 | 0.482 | 68.1% | 31.9% | 0.42 | balance,drawRate |
| 29 | 4 (non-finalist) | ASNNKQSR | 0.007 | 0.504 | 83.8% | 15.6% | 0.45 | balance |
| 30 | 4 (non-finalist) | MSKBARSM | 0.007 | 0.512 | 89.4% | 10.0% | 0.39 | balance |
| 31 | 4 (non-finalist) | LKRQSRBS | 0.006 | 0.512 | 90.6% | 9.4% | 0.51 | balance |
| 32 | 4 (non-finalist) | ARNSNLSK | 0.003 | 0.503 | 86.9% | 13.1% | 0.44 | balance |
| 33 | 4 (non-finalist) | BKANNMSM | 0.002 | 0.495 | 81.3% | 18.8% | 0.41 | balance |
| 34 | 4 (non-finalist) | NSLBNKMG | -0.001 | 0.494 | 81.9% | 17.5% | 0.51 | balance |
| 35 | 4 (non-finalist) | KLRSNAAN | -0.001 | 0.496 | 84.4% | 15.6% | 0.41 | balance |
| 36 | 4 (non-finalist) | KGRASBMR | -0.002 | 0.496 | 83.1% | 15.0% | 0.42 | balance |
| 37 | 4 (non-finalist) | RRALBQAK | -0.004 | 0.504 | 91.3% | 8.1% | 0.45 | balance |
| 38 | 4 (non-finalist) | NRKARMQB | -0.004 | 0.499 | 88.1% | 11.3% | 0.44 | balance |
| 39 | 4 (non-finalist) | SBQMAKBG | -0.005 | 0.485 | 79.4% | 20.6% | 0.40 | balance |
| 40 | 4 (non-finalist) | AKASMQNS | -0.005 | 0.494 | 85.6% | 14.4% | 0.34 | balance |
| 41 | 4 (non-finalist) | AKSBNGMR | -0.006 | 0.487 | 80.0% | 18.8% | 0.43 | balance |
| 42 | 4 (non-finalist) | KAMNLSMG | -0.007 | 0.480 | 76.3% | 22.5% | 0.34 | balance,drawRate |
| 43 | 4 (non-finalist) | AALKBSRN | -0.008 | 0.495 | 88.1% | 11.9% | 0.39 | balance |
| 44 | 4 (non-finalist) | SMANBAKR | -0.008 | 0.488 | 83.8% | 16.3% | 0.38 | balance |
| 45 | 4 (non-finalist) | SNLMGKMA | -0.009 | 0.483 | 80.0% | 19.4% | 0.42 | balance |
| 46 | 4 (non-finalist) | LABNSBAK | -0.010 | 0.485 | 81.3% | 17.5% | 0.42 | balance |
| 47 | 4 (non-finalist) | LKGRSANN | -0.010 | 0.483 | 79.4% | 18.1% | 0.43 | balance |
| 48 | 4 (non-finalist) | KRMMLQAN | -0.011 | 0.479 | 78.1% | 20.6% | 0.42 | balance |
| 49 | 4 (non-finalist) | MNKAARBN | -0.012 | 0.488 | 86.9% | 13.1% | 0.41 | balance |
| 50 | 4 (non-finalist) | SNLAKMBA | -0.015 | 0.488 | 88.8% | 11.3% | 0.39 | balance |

---

Files: `sim/out/arr-a.r1..r5.{jsonl,summary.json,report.json,report.md}`, `sim/out/arr-a.experiment.md`
(not committed); spec and analysis tool in `sim/specs/arrangement-2026-09-17/` (`sweep-a.json`,
`analyze-sweep-a.ts`, `sweep-a-results.json`, `sweep-a-tables.md`).
