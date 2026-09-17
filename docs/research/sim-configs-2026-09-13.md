# Configuration runs — pool composition (R2) and placement patterns (R3), 2026-09-13

17 runs, 20 back ranks each, 160 games per rank, 3 200 games per run, **54 400 games**. Depth 3,
`timeMs: Infinity`, 4 random opening plies, ply cap 300, pairs auto (off: both sides are identical),
all rules at their defaults. Wall clock **2 h 36 m 47 s** on 16 workers, 3.8 to 9.0 games/s (another
agent shared the machine).

## 1. Commands

```
node tools/ranks.mjs --n 20 --seed 42 --constraint kingCorner --id cfg-kingCorner \
  --games 3200 --depth 3 --runseed 7 --out sim/specs/cfg-kingCorner.json     # R3 specs
npm run sim -- --spec sim/specs/cfg-kingCorner.json --workers 16
npm run sim:analyze -- --id cfg-kingCorner
```

R2 specs hold `{"backRanks": {"sample": 20, "pool": "QRRBBNN"}, "seed": 7}`; R3 specs hold an
explicit 20-rank list from `tools/ranks.mjs`, seed 42. Every run uses run seed 7, so game *i* gets
the same opening stream in every run.

## 2. How to read the numbers

Error bars cluster on the back rank: `sd(20 rank means) / √20`, because the ranks differ between
runs. That gives ±0.006 to ±0.009 on the white score, as §15 of `sim-results-2026-09-13.md`
predicts. **The flag rule is `|Δ| > 2 × √(se_a² + se_b²)`**, and only flagged rows are findings; the
bar is 0.024 on the score (17 Elo), 0.10 decisive, 0.07 draw, 0.033 capped, 15 plies. `xDec` and
`interest` are refitted over all 340 ranks, because the analyzer fits that line inside one run.
`interest−fairy` drops the fairy-use term, worth up to +0.2 free to a pool with one fairy type or
none. Interest is still mostly a decisiveness axis.

**Bishops on opposite colours, standard-only pool: confirmed.** The rule applies only when the draw
holds two bishops, and `QRRBBNN` has exactly 7 letters, so the sampler takes all of them and every
rank holds two. 20 000 samples: 20 000 with two bishops, 0 on the same colour. `tools/ranks.mjs`
clones `sampleBackRank` exactly, which makes each set like-for-like.

## 3. R2 — pool composition

| pool | letters | score ± | Elo ± | decisive | draw | capped | plies ± sd | s |
|---|---|---|---|---|---|---|---|---|
| (b) full **control** | QLRRBBNNAAGGMMSS | 0.517 ± 0.008 | +12 ± 12 | 62.2% | 31.9% | 5.9% | 138 ± 73 | 548 |
| (a) standard only | QRRBBNN | 0.533 ± 0.006 | +23 ± 9 | 86.8% | 13.1% | 0.2% | 87 ± 40 | 750 |
| (c) + AA | QRRBBNNAA | 0.516 ± 0.008 | +11 ± 11 | 76.6% | 21.8% | 1.6% | 112 ± 59 | 666 |
| (d) + GG | QRRBBNNGG | 0.525 ± 0.008 | +17 ± 11 | 75.1% | 23.1% | 1.8% | 107 ± 63 | 656 |
| (e) + MM | QRRBBNNMM | 0.509 ± 0.008 | +6 ± 11 | 77.1% | 22.2% | 0.6% | 109 ± 48 | 532 |
| (f) + SS | QRRBBNNSS | 0.519 ± 0.009 | +13 ± 12 | 78.9% | 20.3% | 0.8% | 101 ± 52 | 355 |
| (g) + L | QRRBBNNL | **0.548 ± 0.009** | **+33 ± 12** | 87.3% | 12.6% | 0.1% | 85 ± 38 | 550 |
| (h) fairy-heavy | LAAGGMMSSQ | 0.521 ± 0.008 | +15 ± 11 | 39.8% | 45.7% | 14.5% | 172 ± 86 | 638 |
| (i) no standard minor | QRRLAAGGMMSS | 0.515 ± 0.005 | +11 ± 7 | 47.3% | 42.6% | 10.0% | 155 ± 81 | 848 |

**Balance moves once.** Only (g) `+L` flags against the control: +0.030 on the score, +33 ± 12 Elo.
The paladin gives White the first strike, and White keeps it; every other pool sits inside the bar.
**Every pool flags on decisiveness, draws, capped share and length**, monotone in fairy density. (h)
caps 14.5 % of games and (i) 10.0 %, against the 5 % gate; the control caps 5.9 %, as in pass 2.

| pool | killer | leadΔ | uncLate | drama | perm | minFairyUse | xDec | interest | interest−fairy |
|---|---|---|---|---|---|---|---|---|---|
| (b) full | 0.312 | 0.034 | 0.639 | 0.118 | 0.967 | 0.586 | −0.024 | 0.398 | **0.281** |
| (a) standard | 0.399 | 0.040 | 0.630 | 0.170 | 0.954 | 1.000 (none) | +0.214 | 0.515 | 0.315 |
| (c) + AA | 0.361 | 0.036 | 0.634 | 0.152 | 0.961 | 0.994 | +0.128 | 0.501 | 0.302 |
| (d) + GG | 0.368 | 0.035 | 0.628 | 0.142 | 0.960 | 1.000 | +0.098 | 0.500 | 0.300 |
| (e) + MM | 0.371 | 0.039 | 0.647 | 0.159 | 0.964 | 1.000 | +0.133 | 0.507 | 0.307 |
| (f) + SS | 0.376 | 0.038 | 0.635 | 0.154 | 0.959 | 0.441 | +0.142 | 0.394 | 0.306 |
| (g) + L | 0.378 | 0.033 | 0.613 | 0.157 | 0.957 | 0.985 | +0.199 | 0.505 | 0.308 |
| (h) fairy | 0.247 | 0.041 | 0.641 | 0.071 | 0.966 | 0.416 | −0.248 | 0.331 | 0.248 |
| (i) no minor | 0.272 | 0.037 | 0.647 | 0.085 | 0.968 | 0.503 | −0.157 | 0.362 | 0.261 |

Every small pool beats the control on `interest−fairy` by 0.019 to 0.035 and both dense pools lose
by 0.019 to 0.033, all flagged. Late uncertainty and lead change hardly move, so the spread comes
from killer move, drama and residual decisiveness — from getting decided.

Activity, as moves / captures per starting piece / survival. The other 15 runs, and the full
interest terms of every R3 set, are in `sim/out/*.report.md`.

| pool | pawn | queen | rook | bishop | knight | paladin | archer | guard | maester | beast |
|---|---|---|---|---|---|---|---|---|---|---|
| (b) full | 1.8/0.37/28% | 5.5/1.16/39% | 7.2/1.16/32% | 5.4/1.04/22% | 5.1/0.95/14% | 3.1/0.66/5% | 7.4/1.32/74% | 9.9/0.00/98% | 9.8/0.62/50% | 2.1/0.32/69% |
| (h) fairy | 1.9/0.38/23% | 5.0/0.93/20% | — | — | — | 5.2/0.66/9% | 8.9/1.61/81% | 10.1/0.00/99% | 18.2/0.63/66% | 2.2/0.27/70% |

Fairy events per game, control: 2.24 archer shots, 6.43 maester swaps (1.65 long), 0.44 beast chain
moves, 0.59 paladin sacrifices, 0.34 promotions, 7.04 checks. Pool (h) raises maester swaps to
**25.10** and drops checks to 2.88; pool (i) reads 16.11. The **guard never trades** (0.00 captures,
97–99 % survival: `guardCaptures` is `none`), the **beast barely moves** (1.4 to 2.2 moves per
starting piece against 5–10), and the **maester shuffles** (9.8 moves per piece, 18.2 in pool (h),
most of them swaps). A cheap reversible move is what a draw is made of.

## 4. R3 — placement patterns

Raw comparison against the same unconstrained control, 20 ranks each:

| set | score ± | Elo ± | decisive | draw | capped | plies | interest | s |
|---|---|---|---|---|---|---|---|---|
| control (b) | 0.517 ± 0.008 | +12 ± 12 | 62.2% | 31.9% | 5.9% | 138 | 0.398 | 548 |
| king in a corner | 0.527 ± 0.005 | +19 ± 7 | 61.8% | 32.2% | 6.0% | 139 | 0.395 | 575 |
| king on d/e | 0.513 ± 0.006 | +9 ± 9 | 56.3% | 35.9% | 7.8% | 145 | 0.392 | 485 |
| queen in a corner | 0.532 ± 0.006 | +22 ± 8 | 64.4% | 29.8% | 5.8% | 130 | 0.411 | 422 |
| bishops in corners | 0.525 ± 0.007 | +17 ± 9 | 65.2% | 29.9% | 5.0% | 131 | 0.433 | 431 |
| guard beside king | 0.532 ± 0.007 | +23 ± 9 | 54.3% | **38.4%** | 7.2% | 146 | 0.406 | 581 |
| maester beside king | 0.510 ± 0.007 | +7 ± 10 | 59.6% | 34.0% | 6.4% | 141 | 0.427 | 498 |
| archers adjacent | 0.522 ± 0.006 | +15 ± 9 | **50.8%** | **38.5%** | **10.7%** | **157** | 0.390 | 435 |
| beasts on a/h | 0.519 ± 0.007 | +13 ± 10 | 54.5% | **39.1%** | 6.4% | 142 | 0.348 | 392 |

**No set flags on balance**; king corner against king d/e, the one contrast free of any composition
change, reads Δ +0.014 ± 0.009 and nothing else in that pair flags. **The raw draw and length
effects are mostly composition, not placement.** A constraint forces a piece into the rank: "guard
beside the king" carries 1.60 guards per rank against the control's 0.75, "archers adjacent" 2.00
archers against 0.85, "beasts on a/h" 2.00 against 0.75. So the 180 full-pool ranks get one OLS per
metric, over the eight piece counts and the eight placement flags together. The knight is the
baseline; `**` marks `|t| > 2`.

| term | score | decisive | draw | capped | plies | killer | drama | xDec |
|---|---|---|---|---|---|---|---|---|
| + queen | −0.002 | −0.001 | +0.000 | +0.001 | −7.5 ** | +0.010 | −0.005 | +0.006 |
| + rook | −0.006 | −0.024 ** | +0.016 | +0.009 ** | +2.0 | −0.017 ** | −0.010 ** | −0.023 ** |
| + paladin | **+0.020** ** | +0.018 | −0.028 ** | +0.010 ** | −0.8 | −0.015 ** | −0.016 ** | +0.004 |
| + archer | −0.010 | −0.114 ** | +0.061 ** | +0.053 ** | +21.4 ** | −0.041 ** | −0.022 ** | −0.106 ** |
| + guard | −0.000 | −0.141 ** | +0.093 ** | +0.047 ** | +18.5 ** | −0.032 ** | −0.029 ** | −0.141 ** |
| + maester | −0.013 ** | −0.090 ** | +0.064 ** | +0.027 ** | +13.8 ** | −0.019 ** | −0.015 ** | −0.081 ** |
| + beast | −0.004 | −0.102 ** | +0.064 ** | +0.038 ** | +15.3 ** | −0.029 ** | −0.020 ** | −0.099 ** |
| king in a corner | +0.014 ** | +0.004 | +0.004 | −0.007 | −1.6 | +0.000 | +0.001 | +0.000 |
| king on d/e | +0.008 | −0.002 | −0.001 | +0.004 | −0.5 | −0.009 | −0.005 | −0.009 |
| queen in a corner | +0.004 | +0.026 | −0.026 ** | +0.000 | −1.8 | −0.002 | +0.003 | +0.018 |
| bishops in corners | +0.001 | −0.024 | +0.017 | +0.008 | +4.3 | +0.009 | −0.001 | −0.026 |
| guard beside king | +0.012 ** | +0.011 | −0.009 | −0.002 | −4.8 ** | −0.001 | −0.003 | +0.004 |
| maester beside king | +0.006 | +0.007 | −0.005 | −0.003 | −2.5 | −0.002 | −0.001 | +0.002 |
| archers adjacent | +0.012 | −0.032 ** | +0.031 ** | +0.001 | +2.7 | +0.003 | −0.008 | −0.040 ** |
| beasts on a/h | +0.002 | −0.007 | +0.028 | −0.021 ** | −4.9 | −0.029 ** | −0.011 ** | −0.008 |

Composition rows carry 4 to 6 times the size of the placement rows. **Which pieces the rank holds
decides the game; where they stand hardly does.** Four placement effects survive, all small.
**Archers adjacent** stays real (−0.032 decisive, +0.031 draw, −0.040 xDec at a fixed archer count):
the two cover each other's squares and lock the file. **A queen in a corner** cuts the draw rate by
2.6 points. **Beasts on a/h** cut the capped share by 2.1 points and the killer move by 0.029.
**A guard beside the king** shortens the game by 4.8 plies and adds +0.012 to the White score; its
raw +6.5 draw points were the extra guard, not the square.

`chess960.md` §7 transfers badly. **§7.4, bishops in the corners make dull, fair games**: nothing
flags (−0.024 decisive, +0.017 draw), although cornered bishops do lose activity (3.6 moves per
piece against 5.4, survival 14 % against 22 %). **§7.6, adjacency of like pieces does not matter**:
it does here, and it is the largest placement effect. **§7.9, king placement matters more for us**:
it does not. **§7.5, a corner queen** half transfers: the −3 draw points do, the +0.015 White
points do not.

## 5. What this suggests for the pool and setup rules

1. **Tune the pool, not the squares.** Composition beats placement by 4 to 6 times on every metric.
2. **The guard, the archer and the beast are the draw engine.** Each one costs 9 to 14 points of
   decisiveness and adds 5 to 9 points of draws, 14 to 21 plies and 3 to 5 points of capped games.
   The pool holds six in 16 letters. Cutting `GG`, or letting the guard capture, is the cheapest way
   under the 5 % timeout gate.
3. **The paladin is the only piece that moves balance**: +0.020 White score each, and pool (g) reads
   +33 ± 12 Elo against the control's +12 ± 12. Keep it at one, and re-price it against the
   no-castling rook before any buff.
4. **Watch the maester swap**: 6.4 per game, 25.1 in pool (h). Test `maesterLongSwap=false` in R4.
5. **Add no placement rule**: no constraint changes balance beyond the noise.
6. **Confirm at depth 5.** Every number is depth 3, and balance follows the agent (`SIM-PLAN` §9).

Limits. 160 games per rank gives ±0.060 on one rank's score, so these runs rank a pool and do not
certify one. The constrained sets change composition as well as placement, so trust the adjusted
coefficient. Pools (c) to (g) draw 7 of 8 or 9 letters, so the added type is in 90 % of ranks for
`+L` and 98 % for the doubled types.
