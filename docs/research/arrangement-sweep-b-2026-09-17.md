# Arrangement sweep B — independent sample and stability check (2026-09-17)

**Method.** From the repo root:

```
node_modules/.bin/tsx src/sim/run.ts --id arr-b --experiment sweep --games 20 \
  --arrangements 200 --rounds 4 --depth 3 --seed 92 --workers 6
```

200 arrangements sampled from the project pool under seed 92, successive halving (eta = 2) with
common random numbers inside each round: r1 200 × 20, r2 100 × 40, r3 50 × 80, r4 25 × 160 —
16,000 games at depth 3. Wall clock 04:37–06:43 (2 h 06 min), sharing the machine with Sweep A's
8,000-game rounds. The ranked list is the r4 report (`sim/out/arr-b.r4.report.json`): 25
arrangements × 160 games = 4,000 games, overall draw rate 15.9%, decisiveness 83.5%, capped share
(`timeouts`) 0.5%, white score 0.516.

**Ranking rule as applied** (pre-registered in `docs/research/arrangement-benchmark-2026-09-17.md`):
drop `|score − 0.5| > 0.03` or `timeouts > 0.05`; rank the rest by interest, ties by min
utilisation, then event diversity. No exact interest ties occurred, so event diversity was never
read. The benchmark doc's criterion 1 names the metric **interest (residualised on draw rate)**
(`interestResiduals.interest`, fitted over the round's own pool); the task restated it as
"interest". Both were computed: the residualised order is primary here and the raw composite is
shown alongside. The two orders correlate at Spearman rho = 0.682 over the 25 arrangements, so the
choice is material, not cosmetic.

**Gate arithmetic (why the tables below are short).** At 160 games the white score has binomial
SE 0.5/√160 = 0.0395, so an arrangement whose true score is 0.5 passes the ±0.03 fairness gate
with probability 55.2%; observed 13/25 = 52%. At 40 games (A r2) the same gate passes 29.5% by
chance; observed 63/200 = 31.5%. The gate is close to a coin flip on score noise.

## Top 20 and bottom 20

Only **13 of the 25** arrangements survive the drop — 12 fail the balance gate and none fail on
`timeouts > 0.05`. The pre-registered "top 20" is therefore those 13 rows, and the "bottom 20" is
the same 13 rows; the two tables coincide and are printed once. Ranks are the pre-registered
residualised order; the raw-interest order of the same 13 is given as a column (with its rank
among all 25, before the gate).

| # | back rank | interest (resid.) | interest (raw) | raw rank /25 | decisive | draws | minUse | fairness |score−0.5| |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KSGLBMSR | 0.014 | 0.500 | 8 | 77.5% | 21.3% | 0.46 | 0.025 |
| 2 | KQMNGASR | 0.008 | 0.508 | 5 | 86.9% | 13.1% | 0.40 | 0.022 |
| 3 | ASRSQBKM | 0.006 | 0.510 | 3 | 89.4% | 10.6% | 0.43 | 0.022 |
| 4 | MKSRMGBA | 0.006 | 0.495 | 14 | 79.4% | 19.4% | 0.39 | 0.003 |
| 5 | RGMKSSRN | 0.005 | 0.493 | 16 | 78.1% | 20.0% | 0.43 | 0.016 |
| 6 | SAMKMARN | −0.001 | 0.490 | 18 | 81.9% | 18.1% | 0.34 | 0.003 |
| 7 | RNAAKSBS | −0.002 | 0.496 | 12 | 85.6% | 14.4% | 0.41 | 0.003 |
| 8 | ASKQNNSB | −0.002 | 0.499 | 9 | 87.5% | 12.5% | 0.46 | 0.025 |
| 9 | AKGBNRMR | −0.005 | 0.481 | 23 | 78.8% | 21.3% | 0.44 | 0.000 |
| 10 | NBAGKASN | −0.005 | 0.485 | 20 | 80.0% | 18.8% | 0.40 | 0.000 |
| 11 | RKSBBNGA | −0.006 | 0.485 | 19 | 81.3% | 18.1% | 0.46 | 0.025 |
| 12 | NASKBMRB | −0.007 | 0.498 | 10 | 90.0% | 10.0% | 0.45 | 0.019 |
| 13 | SAKMBNNA | −0.007 | 0.481 | 24 | 80.0% | 20.0% | 0.35 | 0.025 |

The 12 dropped arrangements, with their raw-interest rank among the 25 and their gate failure:

| raw rank /25 | back rank | interest (raw) | fairness |score−0.5| | gate |
| --- | --- | --- | --- | --- |
| 1 | BSRMNKSB | 0.511 | 0.059 | balance |
| 2 | KGMSBQAS | 0.510 | 0.056 | balance |
| 4 | SQBKRSML | 0.508 | 0.100 | balance |
| 6 | MMSSNBNK | 0.507 | 0.050 | balance |
| 7 | SGNRKAMQ | 0.501 | 0.031 | balance |
| 11 | SNSKBANR | 0.497 | 0.053 | balance |
| 13 | KARQAMBM | 0.495 | 0.069 | balance |
| 15 | MKABRNLS | 0.493 | 0.034 | balance |
| 17 | RNMAKNMS | 0.492 | 0.034 | balance |
| 21 | GARBRNKM | 0.484 | 0.034 | balance |
| 22 | LASNBBRK | 0.482 | 0.094 | balance |
| 25 | LBKRBGNN | 0.474 | 0.116 | balance |

Note that three of the raw top 5 are dropped: the raw composite puts unbalanced, decisive
arrangements on top (raw #1 BSRMNKSB scores 0.441), which is exactly the failure the pre-registered
gate is for. The residualised ranking reorders the survivors by 0.68-correlated ranks: the top raw
survivor ASRSQBKM (raw #3 overall) is residualised #3, while KSGLBMSR (raw #8 overall) is
residualised #1.

## Stability comparison with Sweep A

**Which A data.** When B's r4 completed (06:43), Sweep A had r1 (400 arrangements × 20 games) and
r2 (200 × 40) on disk; A's r3 was ~1,600/8,000 games in progress. The comparison therefore uses
**A r2 as the last completed A round**, with A r1 as a larger-n robustness check. A's final round
was not going to be available in this session.

**Shared arrangements: 0.** A r2's 200 rank strings and B r4's 25 share none, and A r1's 400 share
none with B r4 either. The space of valid back ranks is **12,752,640** rows (7 of the 15-letter
pool plus the king, with opposite-coloured bishops), so two independent 25-arrangement final rounds
are expected to share 25 × 25 / 12,752,640 ≈ 0.00005 ranks, and a 25 vs 200 pair 0.0004. The
pre-registered Spearman over shared arrangements is structurally untestable at these sample sizes;
the task's fallback — feature splits and the top-set feature profile — was run instead, and is
reported below.

### Feature splits (top vs bottom of each ranked list)

The metric here is the raw composite, matching the task's restatement. A r2 keeps 63 arrangements,
so its top 20 and bottom 20 are disjoint; B r4 keeps 13, so its top 20 and bottom 20 coincide and
the split is only meaningful at the extremes (top 5 vs bottom 5). No feature separates top from
bottom in either sweep.

| feature | A r2 top 20 | A r2 bottom 20 | Fisher p | B r4 top 5 | B r4 bottom 5 | Fisher p |
| --- | --- | --- | --- | --- | --- | --- |
| queen present | 11/20 | 9/20 | 0.752 | 3/5 | 0/5 | 0.167 |
| guard present | 7/20 | 11/20 | 0.341 | 2/5 | 3/5 | 1.000 |
| guard–king file distance (mean) | 2.71 (n=7) | 3.09 (n=11) | 0.701 | 3.00 (n=2) | 2.33 (n=3) | 0.797 |
| archers: 2 adjacent (of 2-archer ranks) | 0/4 | 1/5 | 1.000 | 0/0 | 0/3 | 1.000 |
| maester adjacent to king | 3/20 | 5/20 | 0.695 | 1/5 | 2/5 | 1.000 |
| distinct types (mean) | 6.80 | 6.80 | 1.000 | 7.00 | 6.40 | 0.372 |

Under the pre-registered residualised metric the splits are even flatter: A r2 top/bottom queen
9/20 vs 9/20 (p = 1.000), guard 9/20 vs 6/20 (p = 0.514), maester 4/20 vs 5/20 (p = 1.000); B r4
top5/bottom5 queen 2/5 vs 0/5 (p = 0.444), guard 4/5 vs 3/5 (p = 1.000).

### Top-set feature profile

A r2 top 20 vs B r4's kept 13 (its "top set" after the gate):

| feature | A r2 top 20 | B r4 kept 13 | Fisher p (raw) | Fisher p (resid.) |
| --- | --- | --- | --- | --- |
| queen present | 11/20 | 3/13 | 0.087 | 0.278 |
| guard present | 7/20 | 7/13 | 0.472 | 0.728 |
| guard–king file distance (mean) | 2.71 (n=7) | 2.71 (n=7) | 1.000 | 0.614 |
| archers: 2 adjacent (of 2-archer ranks) | 0/4 | 1/4 | 1.000 | 1.000 |
| maester adjacent to king | 3/20 | 5/13 | 0.213 | 0.425 |
| distinct types (mean) | 6.80 | 6.62 | 0.589 | 0.380 |

Nothing is significant; the largest gap (queen present, 11/20 vs 3/13) is p = 0.087 raw and
weakens under the pre-registered metric (p = 0.278).

### Feature–interest association over every arrangement

This is the quantitative form of the fallback: a feature "separates" only if its association with
interest has the same sign in both sweeps. Standard errors are ≈ 1/√n, i.e. 0.050 (A r1, n = 400),
0.071 (A r2, n = 200), 0.204 (B r4, n = 25).

| feature | A r1 rho | A r2 rho | B r4 rho | signs agree (A r2 vs B) |
| --- | --- | --- | --- | --- |
| queen present | +0.184 | +0.109 | +0.576 | yes |
| guard present | −0.156 | −0.193 | −0.225 | yes |
| guard–king file distance | −0.013 (n=184) | +0.174 (n=93) | −0.060 (n=11) | no |
| archers: 2 adjacent | +0.080 | +0.058 | +0.015 | yes |
| maester adjacent to king | −0.112 | −0.033 | −0.168 | yes |
| distinct types | −0.172 | −0.119 | +0.170 | no |

Raw composite: 4 of 6 features agree in sign between the two sweeps, and queen/guard agree across
all three estimates. But the raw composite tracks draw rate, and so do these features:

| feature | vs drawRate, A r2 | vs drawRate, B r4 | resid. rho, A r1 | resid. rho, A r2 | resid. rho, B r4 |
| --- | --- | --- | --- | --- | --- |
| queen present | −0.165 | −0.608 | +0.085 | +0.002 | +0.193 |
| guard present | +0.144 | +0.508 | −0.066 | −0.131 | +0.217 |
| guard–king file distance | +0.007 | −0.035 | −0.011 | +0.280 | +0.014 |
| archers: 2 adjacent | −0.037 | −0.071 | +0.056 | +0.045 | −0.054 |
| maester adjacent to king | +0.056 | +0.197 | −0.049 | +0.005 | −0.035 |
| distinct types | −0.083 | −0.152 | −0.221 | −0.196 | +0.035 |

The raw queen/guard signals are draw-rate effects in disguise: queen present goes with fewer draws
(rho = −0.61 in B r4) and the raw interest association (+0.58) collapses to +0.19 once the
draw-rate line is removed; guard present goes with more draws (+0.51) and its raw association
(−0.23) even flips sign (+0.22) after residualising. On the pre-registered residualised metric only
**2 of 6** features agree in sign between A r2 and B r4, and no feature has a sizeable association
in both sweeps. The one feature with large-sample support on the residualised metric, distinct
types (A r1 −0.221, A r2 −0.196), is +0.035 in B r4 — B's n = 25 cannot confirm or refute it
(SE ≈ 0.20).

### Split-half reliability of the metric (B r4, no cross-sweep data needed)

Splitting each arrangement's 160 games by gameId into two 80-game halves and re-analysing with the
same analyzer: Spearman between the halves is **rho = 0.516** (raw) and **0.514** (residualised),
n = 25. The mean half-to-half change in an arrangement's interest is 0.010, which equals the full
spread of interest across the 25 arrangements (SD = 0.0102 raw, 0.0070 residualised). At 80 games
an arrangement's rank is about half signal; Spearman–Brown puts the 160-game reliability at
2(0.516)/(1 + 0.516) ≈ 0.68.

## Verdict

**The "interesting arrangement" ranking is not reproducible across independent samples in this
campaign; at this budget it is noise-dominated.**

1. **The pre-registered stability test could not be run.** The two sweeps share 0 arrangements
   (25 × 25 draws from 12,752,640 valid ranks; expected overlap 0.00005). The criterion "Spearman
   over the shared arrangements" is structurally untestable at these sample sizes, not merely
   underpowered, so the fallback was used.
2. **On the fallback, the pre-registered metric shows no stable feature signal.** Under
   interest (resid.), 2 of 6 features agree in sign between A r2 and B r4, no feature separates
   top from bottom in either sweep (all p ≥ 0.34 in A r2; B r4's gated list has 13 rows, so its
   top 20 and bottom 20 are the same rows), and the top-set profile differs on nothing
   (smallest p = 0.278). The only association with large-sample support in A (distinct types,
   −0.20) is +0.04 in B, where n = 25 leaves ±0.20 of uncertainty.
3. **The associations that do replicate use the raw composite, and they are draw-rate effects.**
   Queen present (+0.18/+0.11/+0.58) and guard present (−0.16/−0.19/−0.23) agree in sign across
   A r1, A r2 and B r4, but queen present lowers the draw rate (rho = −0.61 in B r4) and guard
   present raises it (+0.51); residualising removes both (queen +0.19 or less; guard flips sign).
   Criterion 1 residualises precisely to exclude this channel, so these are not evidence for the
   ranking.
4. **The metric itself is only about two-thirds reliable at the r4 budget.** Split-half rho =
   0.52 at 80 games, mean half-to-half interest change 0.010 against a cross-arrangement spread of
   0.010. A 25-arrangement final round cannot resolve a top-10, let alone a top-1.
5. **Two design fixes for the finalists step.** The ±0.03 fairness gate discards ~45% of balanced
   arrangements by score noise at 160 games (observed 12/25 = 48% dropped; the binomial expects
   44.8%) — the gate needs
   a confidence interval on the score, not a point-estimate cut. And the shared-arrangement
   Spearman needs the two sweeps to play the *same* arrangements (paired seeds or a fixed
   subsample), because independent sampling from 12.75M ranks will never produce the n ≥ 20 the
   criterion assumed.

In short: B's top list (KSGLBMSR, KQMNGASR, ASRSQBKM, MKSRMGBA, RGMKSSRN …) should not be treated
as a finding. The depth-4 finalist re-run can still be run, but it tests arrangements whose
selection this report shows to be noise, and it should be paired with the gate and overlap fixes
above before the campaign draws conclusions.
