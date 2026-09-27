# Arrangement finalists — 1,000 games per rank and a depth-4 check (2026-09-17)

The two arrangement sweeps share no arrangements: sweep A's round 5 holds 25 back ranks
(`sim/out/arr-a.r5.report.json`) and sweep B's round 4 holds 25 (`sim/out/arr-b.r4.report.json`),
with **zero overlap**. This route unions both lists into 50 ranks, plays every rank **1,000 games at
depth 3** (50,000 games), applies the pre-registered rule, and re-runs the top 5 with **400 games
each at depth 4**.

Result in one line: at 1,000 games the interest metric is now about **0.87–0.90 reliable**
(split-half; 0.68 at the sweeps' 160 games), the top and bottom tens separate by ~0.013 interest
residual (~15 standard errors of the gap) while adjacent ranks do not (median gap 0.0003), and the
top 5 keep their interest order at depth 4 exactly (rho = 1.000) — but **4 of the 5 fail the
pre-registered fairness gate at 400 games**, all on the White side, against a depth-4 run that is
itself White-shifted (overall 0.544 against 0.518 at depth 3). By the pre-registered rule only
`KGBMSSMB` survives.

## Method

**Finalists.** `sim/out/arr-a.r5.report.json` `byConfig` keys (25) plus
`sim/out/arr-b.r4.report.json` `byConfig` keys (25), deduplicated, in report order → 50 ranks
(A and B share no keys, so all 50 union entries are distinct). Both files were present; no fallback
round was needed.

**Runs.**

| run | spec | ranks | games per rank | games | depth | seed | wall clock | rate | workers |
|---|---|---|---|---|---|---|---|---|---|
| depth 3 | `sim/specs/arr-final-2026-09-17/finalists.json` | 50 | 1,000 | 50,000 | 3 | 95 | 4 h 45 m 38 s | 2.9 games/s | 6 |
| depth 4 | `sim/specs/arr-final-2026-09-17/d4.json` | 5 (top 5) | 400 | 2,000 | 4 | 95 | 1 h 01 m 14 s | 0.5 games/s | 6 |

`games` in this repo's runner is the **total over back ranks**, not per rank: `buildJobs`
(`src/sim/spec.ts:275`) assigns config `i % configs.length` to game `i`, so `finalists.json` carries
`games: 50000` (50 × 1,000) and `d4.json` carries `games: 2000` (5 × 400). The task's literal
`--games 400` would have overridden the spec total and left 80 games per rank, so the depth-4 run
used the spec's 2,000 instead. `commonSeeds: true` in both specs, as in the sweeps: every rank sees
the same opening streams, and depth 3 and depth 4 share seed 95, so the two depths are paired by
opening. Defaults otherwise (4 random opening plies, 300-ply cap, adjudication on, rules and values
all defaults — the runner's start line printed `rules {}`, `values {}`).

**Commands.**

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/arr-final-2026-09-17/finalists.json --workers 6
node_modules/.bin/tsx src/sim/analyze.ts --id finalists
node_modules/.bin/tsx src/sim/run.ts --id arr-final-d4 --spec sim/specs/arr-final-2026-09-17/d4.json --depth 4 --workers 6
node_modules/.bin/tsx src/sim/analyze.ts --id arr-final-d4
```

Run overalls: depth 3 — White score 0.518, decisive 82.8%, draws 16.5%, capped 0.7%, mean 101 plies.
Depth 4 — White score 0.544, decisive 73.2%, draws 25.0%, capped 1.8%, mean 114 plies.

**Ranking rule (pre-registered).** Drop `|score − 0.5| > 0.03` or `timeouts > 0.05`; rank the rest
by **interest (residualised on draw rate)** (`interestResiduals.interest`); ties by min utilisation,
then interest (min-use), then key. 42 of 50 survive; the 8 dropped, all on balance and none on
timeouts:

| back rank | score | \|score−0.5\| | timeouts |
|---|---|---|---|
| RNQSGKRB | 0.555 | 0.055 | 1.3% |
| LKQABSNR | 0.542 | 0.042 | 0.0% |
| KSGLRMSB | 0.536 | 0.036 | 1.7% |
| AKLRRSGN | 0.571 | 0.071 | 0.7% |
| KSGLBMSR | 0.546 | 0.046 | 1.9% |
| MKABRNLS | 0.592 | 0.092 | 0.2% |
| LBKRBGNN | 0.587 | 0.087 | 1.6% |
| LASNBBRK | 0.566 | 0.066 | 0.4% |

At 1,000 games the score SE is 0.0158, so the ±0.03 gate is ±1.9σ and a truly balanced rank passes
with probability ≈94%: 8 drops against 2.9 expected means several of the eight are genuinely
White-favouring, and the gate is no longer a coin flip as it was at 160 games (sweep B dropped
12/25 = 48% there, 44.8% expected). No exact interest-residual ties occurred.

`interest (min-use)` is the report's `interestMinFairy` (the composite with the superseded
minimum-fairy-use term) — the same column the sweep reports printed. The decisive-share interval is
the normal approximation `1.96·sqrt(p(1−p)/n)` on each row's game count.

## Top 10 and bottom 10 at 1,000 games

Cross-arrangement interest (resid.): SD 0.005, range **−0.009 to +0.010** over the 42 kept; raw
interest SD 0.008, range **0.483 to 0.515**.

### Top 10

| # | back rank | games | score | fairness \|s−0.5\| | decisive | decisive 95% | draws | capped | minUse | fairyUse | interest (resid.) | interest | interest (min-use) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | MMSSNBNK | 1000 | 0.516 | 0.016 | 82.0% | ±2.4 | 17.5% | 0.5% | 0.47 | 1.75 | 0.010 | 0.504 | 0.504 |
| 2 | KGBMSSMB | 1000 | 0.510 | 0.010 | 80.1% | ±2.5 | 17.4% | 2.5% | 0.43 | 1.63 | 0.009 | 0.504 | 0.504 |
| 3 | NKBBMGQS | 1000 | 0.494 | 0.006 | 77.9% | ±2.6 | 21.7% | 0.4% | 0.48 | 1.59 | 0.009 | 0.497 | 0.423 |
| 4 | QNKMNRSG | 1000 | 0.524 | 0.024 | 79.5% | ±2.5 | 19.5% | 1.0% | 0.46 | 1.45 | 0.009 | 0.500 | 0.426 |
| 5 | SQBKRSML | 1000 | 0.526 | 0.026 | 85.8% | ±2.2 | 13.8% | 0.4% | 0.44 | 1.80 | 0.009 | 0.509 | 0.509 |
| 6 | ASRSQBKM | 1000 | 0.525 | 0.025 | 90.0% | ±1.9 | 9.7% | 0.3% | 0.44 | 1.98 | 0.008 | 0.515 | 0.515 |
| 7 | BSRMNKSB | 1000 | 0.527 | 0.027 | 82.7% | ±2.3 | 17.0% | 0.3% | 0.48 | 1.94 | 0.006 | 0.501 | 0.501 |
| 8 | KQMNGASR | 1000 | 0.502 | 0.002 | 85.0% | ±2.2 | 14.8% | 0.2% | 0.41 | 1.79 | 0.006 | 0.505 | 0.488 |
| 9 | GMNKQBSR | 1000 | 0.496 | 0.004 | 74.9% | ±2.7 | 24.1% | 1.0% | 0.45 | 1.64 | 0.005 | 0.490 | 0.481 |
| 10 | ASMQBGRK | 1000 | 0.497 | 0.003 | 84.5% | ±2.2 | 15.1% | 0.4% | 0.40 | 1.84 | 0.004 | 0.502 | 0.465 |

### Bottom 10 (rows 33–42 of the ranked list)

| # | back rank | games | score | fairness \|s−0.5\| | decisive | decisive 95% | draws | capped | minUse | fairyUse | interest (resid.) | interest | interest (min-use) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 33 | MQMKNABR | 1000 | 0.524 | 0.024 | 78.8% | ±2.5 | 21.0% | 0.2% | 0.40 | 2.29 | −0.003 | 0.486 | 0.486 |
| 34 | GARBRNKM | 1000 | 0.501 | 0.001 | 77.9% | ±2.6 | 21.3% | 0.8% | 0.46 | 1.66 | −0.004 | 0.485 | 0.410 |
| 35 | SAMKMARN | 1000 | 0.516 | 0.016 | 83.6% | ±2.3 | 16.0% | 0.4% | 0.34 | 1.87 | −0.004 | 0.493 | 0.493 |
| 36 | MKSRMGBA | 1000 | 0.524 | 0.024 | 85.1% | ±2.2 | 14.4% | 0.5% | 0.40 | 1.83 | −0.004 | 0.495 | 0.399 |
| 37 | BAKRGMAN | 1000 | 0.509 | 0.009 | 80.4% | ±2.5 | 19.1% | 0.5% | 0.37 | 1.79 | −0.005 | 0.487 | 0.483 |
| 38 | RNAAKSBS | 1000 | 0.490 | 0.010 | 87.5% | ±2.0 | 11.9% | 0.6% | 0.41 | 1.85 | −0.005 | 0.498 | 0.498 |
| 39 | SAKMBNNA | 1000 | 0.502 | 0.002 | 84.8% | ±2.2 | 14.8% | 0.4% | 0.37 | 1.94 | −0.006 | 0.493 | 0.493 |
| 40 | AKGBNRMR | 1000 | 0.515 | 0.015 | 80.9% | ±2.4 | 18.4% | 0.7% | 0.45 | 1.82 | −0.007 | 0.487 | 0.469 |
| 41 | NBAGKASN | 1000 | 0.497 | 0.003 | 80.7% | ±2.4 | 17.6% | 1.7% | 0.40 | 1.78 | −0.008 | 0.487 | 0.487 |
| 42 | GAMBRMAK | 1000 | 0.501 | 0.001 | 79.7% | ±2.5 | 19.4% | 0.9% | 0.34 | 1.68 | −0.009 | 0.483 | 0.390 |

The top-10 mean interest (resid.) is +0.0072 against the bottom-10 mean −0.0055: a gap of
**0.0128** (raw interest: 0.5028 against 0.4895, gap 0.0133). The 41 adjacent gaps in the kept list
have median **0.0003** and maximum 0.0021; **40 of 41 are ≤ 0.002**. The full ranked table of all
42 kept rows is in `sim/specs/arr-final-2026-09-17/finalists-tables.md`.

## Split-half reliability at 1,000 games

Each rank's 1,000 games were split by gameId parity into two 500-game halves and re-analysed with
the same analyzer (`sim/specs/arr-final-2026-09-17/finalists-splithalf-{raw,resid}.txt`).

| metric | Spearman, 500-game halves | mean \|half A − half B\| | half SDs | cross-rank SD (full run) | Spearman–Brown at 1,000 games |
|---|---|---|---|---|---|
| interest (raw) | **0.813** | 0.004 | 0.009 / 0.007 | 0.008 | **0.897** |
| interest (resid.) | **0.767** | 0.003 | 0.006 / 0.005 | 0.005 | **0.868** |

For comparison, sweep B measured rho = 0.516 on 80-game halves (Spearman–Brown ≈ 0.68 at 160
games). Going from 80-game halves to 500-game halves raised raw reliability from ~0.68 to ~0.90. The implied
per-rank noise at 1,000 games is ≈0.0018–0.0019 (from `mean |Δ| / 1.128 / sqrt(2)`), and the
top-10-vs-bottom-10 gap's standard error is ≈0.00085, so the **0.0128 gap is ~15 SE** — the
extremes are real — while the median adjacent gap (0.0003) and 40 of 41 adjacent gaps (≤0.002) sit
at or below one rank's own noise: the **middle of the list is not rankable**.

## Depth-4 comparison of the top 5

The depth-4 arm re-ran the top five (400 games each, paired openings via seed 95 and common seeds).

| rank at depth 3 | back rank | depth-3 interest (resid.) | depth-4 interest (resid.) | depth-4 rank (all five) | depth-4 decisive | depth-4 fairness \|s−0.5\| | depth-4 gate |
|---|---|---|---|---|---|---|---|
| 1 | MMSSNBNK | 0.010 | 0.005 | 1 | 80.8% | 0.054 | balance |
| 2 | KGBMSSMB | 0.009 | 0.001 | 2 | 66.3% | 0.026 | pass |
| 3 | NKBBMGQS | 0.009 | 0.000 | 3 | 70.3% | 0.034 | balance |
| 4 | QNKMNRSG | 0.009 | −0.002 | 4 | 67.0% | 0.042 | balance |
| 5 | SQBKRSML | 0.009 | −0.004 | 5 | 81.5% | 0.065 | balance |

**The interest order is preserved exactly.** Ranked by the pre-registered metric on all five rows
(without the gate), the depth-4 order is identical to the depth-3 order: `MMSSNBNK > KGBMSSMB >
NKBBMGQS > QNKMNRSG > SQBKRSML`, Spearman **rho = 1.000** (plain ordering — n = 5 is too small for
the correlation to mean more than that). On raw interest the depth-4 order is
`MMSSNBNK > SQBKRSML > KGBMSSMB > NKBBMGQS > QNKMNRSG`, rho = 0.800 against depth-3 raw: the metric
choice still matters in the middle, where `SQBKRSML` is 5th residualised and 2nd raw (it has the
lowest draw rate of the five, 17.5%, and residualising removes exactly that channel).

**The fairness gate does not survive the depth change.** Only `KGBMSSMB` (|s−0.5| = 0.026) passes
±0.03 at depth 4; the other four score 0.534–0.565, all on the White side. That is not arrangement
identity: the depth-4 arm's overall White score is **0.544** against 0.518 at depth 3, and the four
flagged rows sit within ±0.021 of the depth-4 run's own mean. At 400 games the score SE is 0.025, so
the gate has ~77% power to pass a balanced rank — and applied around 0.5 while the whole field
shifted +0.026, it discards four rows whose depth-3 scores were 0.494–0.526. By pre-registered rule
5 (keep only those whose interest stays in the top half), only `KGBMSSMB` is scoreable, and it is
trivially in the top half of one.

## Verdict

1. **At 1,000 games the ranking is readable; at 160 it was not.** Split-half rho = 0.813 raw /
   0.767 residualised on 500-game halves (Spearman–Brown 0.90 / 0.87 at 1,000 games), against 0.516
   (≈0.68 at 160 games) in sweep B. The two sweeps' rankings were noise-dominated; this one is not:
   a replayed half recovers the other half's order at rho ≈ 0.8.
2. **The readable part is the extremes, not the middle.** The top-10/bottom-10 residual gap is
   0.0128 (~15 SE) and the top 5 hold their exact order at depth 4; but the median adjacent gap is
   0.0003 and 40 of 41 adjacent gaps are ≤0.002, at or under one rank's 1,000-game noise (≈0.0019).
   The whole kept list spans 0.019 residual / 0.032 raw — about 3% of the raw interest scale. So:
   the best and worst ~10 of these 50 are separable; individual middle ranks are not, even at this
   budget.
3. **The top arrangements survive depth 4 on interest and not on fairness.** The ordering on the
   ranking metric is identical at rho = 1.000 (raw rho 0.800), but 4 of 5 fail the ±0.03 balance
   gate at 400 games against a depth-4 field that is itself +0.026 White. The depth-3 depth-4 sign
   check therefore says: the interest signal is depth-stable; the fairness gate at 400 games cannot
   separate an arrangement from the depth-wide White shift (its power to pass a balanced rank is
   ~77% before any shift). If the top 5 are to be narrowed by the pre-registered rule, the gate
   needs a score confidence interval rather than a point cut — the same fix sweep B asked for.
4. **The lever is composition, not placement.** Within these 50 sweep finalists the interest spread
   is small (0.483–0.515 raw) and is produced by what the draw puts in the row — the sweeps found no
   placement feature (queen, guard, guard distance, archers, maester adjacency, type count)
   separating top from bottom, while composition features move the draw rate and raw interest. A
   better first row is not found by choosing among these 50; it is found by changing the pool's
   composition, which is a rules/pool decision, not an ordering decision. For that work the
   extremes here are usable as anchors; ordering the middle of this list should not be attempted.

## Files

- Specs and scripts: `sim/specs/arr-final-2026-09-17/{finalists.json,d4.json,rank-finalists.ts}`.
- Tables: `sim/specs/arr-final-2026-09-17/finalists-tables.md`; split-half transcripts
  `finalists-splithalf-raw.txt`, `finalists-splithalf-resid.txt`.
- Runs and reports (not committed): `sim/out/finalists.{jsonl,summary.json,report.json,report.md,log}`,
  `sim/out/arr-final-d4.{jsonl,summary.json,report.json,report.md,log}`.
