# Same-colour bishops: the Chess960 arrangement rule measured (2026-09-17)

`bishopsOppositeColours` (default `true`, `src/rules/rules.ts:266`, default at `:322`) is a setup rule,
not a game rule: when on, `randomBackRank` rejects a draw whose two bishops share a square colour
(`src/rules/setup.ts:24`; the pool-aware `sampleBackRank` at `src/sim/spec.ts:171`). Chess960 uses the
same convention. The batch-2 measurement (`docs/research/sim-rules-2026-09-13.md` §3) left a two-sample reading of
White +0.001 ± 0.018 and draws −0.008 ± 0.031, and predates today's pieces. This run re-measures the
toggle under the shipped 2026-09-17 rules: the archer's `plusDiagFwd2` shots, the re-priced values,
and every other default unchanged in both arms.

## Method

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-bishops --experiment ab --games 1600 --sample 40 \
  --depth 3 --seed 71 --workers 4 --rule "bishopsOppositeColours=false"
```

Control arm `pb-ab-bishops.base` plays today's defaults (`rules {}`); the variant differs only in the
arrangement rule. 1,600 games per arm, 40 sampled arrangements per arm, four random opening plies.
Raw tables: `sim/out/pb-ab-bishops.experiment.md`; per-arm reports `sim/out/pb-ab-bishops.base.report.md`
and `sim/out/pb-ab-bishops.var.report.md`.

The rule decides which back ranks *exist*, so the two arms draw different 40-rank lists and the
automated paired column is degenerate (`runAb`, `src/sim/experiments.ts:321`). The paired column reads
`+0.000 ± 0.000` on every outcome metric, exactly as batch 2 warned: 34 of the 40 ranks are shared and
replay identically, so the interval collapses, not the effect. This report therefore reads the pooled
columns and a two-sample difference over each arm's own 40 arrangements — the same method batch 2 used.

## The bishop-pair parity check (run valid)

The toggle reaches the sampler. Checking every record's `startFen` (white back rank = the last row of
the board field, bishop square parity `(file + rank) % 2`):

| arm | ranks | 2-bishop ranks | same-colour | opposite | games on same-colour ranks |
|---|---|---|---|---|---|
| base (rule on) | 40 | 3 | 0 | 3 | 0 |
| variant (rule off) | 40 | 7 | 6 | 1 | 240 (15.0%) |

The six same-colour ranks and their bishop squares: `MGBNRKBA` c1/g1, `QRNKABLB` f1/h1, `BKBMNMRL`
a1/c1, `BNAKBSRA` a1/e1, `KMBSBMRA` c1/e1, `AKGQABRB` f1/h1. The one opposite pair in the variant,
`RMNBBNKA` d1/e1, is shared with the base arm. All 3,200 records' `startFen` back ranks match their
`backRankWhite`/`backRankBlack` fields (0 mismatches), so the ranks were played as sampled. The base
arm admits 0 same-colour ranks, the variant 6 — the rule is the only difference. The unit test at
`src/rules/rules.test.ts:605` checks the same behaviour directly.

A free draw produces two bishops 20% of the time and, of those, a same-colour pair 3/7 of the time
(12 of the 28 position pairs) — 8.6% of ranks in expectation. This run drew 6 in 40 (15.0%); the
excess is 1.5 standard deviations, within noise. The rule bites on a minority of arrangements, as
designed.

A second, structural fact drives the statistics: for the 34 shared ranks the two arms play from the
same start position with the same 40 opening seeds, and the toggle is invisible to play. Comparing all
1,360 shared-rank games (34 × 40) move list by move list: 0 result mismatches, 0 plies mismatches,
0 move-list mismatches. The experiment therefore changes 240 games per arm (15%) and leaves 85% of
the population byte-identical.

## Depth 3 (1,600 games per arm, seed 71)

Two-sample difference over each arm's own 40 arrangements, 95% normal interval:

| metric | base (rule on) | rule off | difference ±95% | consequential |
|---|---|---|---|---|
| white score | 0.561 | 0.564 | +0.003 ± 0.035 | no |
| decisive | 0.792 | 0.784 | −0.008 ± 0.032 | no |
| draw rate | 0.198 | 0.206 | +0.007 ± 0.031 | no |
| capped | 0.010 | 0.011 | +0.001 ± 0.006 | no |
| mean plies | 110.3 | 110.8 | +0.5 ± 5.8 | no |
| interest | 0.483 | 0.484 | +0.000 ± 0.006 | no |
| interest (min-use) | 0.483 | 0.484 | +0.001 ± 0.014 | no |

Every interval covers zero. The point estimates move 0.8 decisive points per 100 games, seven tenths of
a draw point, and half a ply; the fairness check (White) moves 0.003. No metric crosses the reading
rule. For `interest (min-use)` the pooled columns are population minima, not means of per-arrangement
values, which is the one row where the pooled pair and the difference column measure slightly
different aggregates (per-arrangement means 0.472 vs 0.472, +0.001 ± 0.014).

The automated paired table's only nonzero outcome-adjacent row is `excessDecisiveness (resid.)`
(+0.008 ± 0.001); that quantity is fitted inside each arm, so per-arm normalisation, not play, moves
it. The `yes` flags on the collapsed rows are rounding artifacts of a zero-width interval.

## The six swapped ranks

The substitution itself, base-only six ranks (2 of them carry two opposite bishops; 4 carry 0–1) against
the variant's six same-colour ranks:

| metric | base-only 6 ranks | same-colour 6 ranks | difference ±95% |
|---|---|---|---|
| white score | 0.519 | 0.538 | +0.019 ± 0.094 |
| decisive | 0.854 | 0.800 | −0.054 ± 0.084 |
| draw rate | 0.137 | 0.188 | +0.050 ± 0.084 |
| capped | 0.008 | 0.013 | +0.004 ± 0.020 |
| mean plies | 106.6 | 109.8 | +3.2 ± 14.0 |
| interest | 0.486 | 0.485 | −0.001 ± 0.012 |
| interest (min-use) | 0.482 | 0.483 | +0.001 ± 0.017 |

The direction matches the Chess960 rationale — same-colour pairs are 5.0 ± 8.4 draw points more
drawish and 5.4 ± 8.4 decisive points less decisive than the ranks they replace — but no interval
excludes zero, and the comparison is confounded because only 2 of the 6 replaced ranks have two
bishops. With 1,600 games/arm the draw-rate point estimate sits 1.2 standard errors from zero; the
arrangement, not the game count, is the binding constraint.

Outcome context over the whole populations: dead-material endings rise 14 (0.9%) to 18 (1.1%) and
games where a king never moved rise 423 (26.4%) to 432 (27.0%). Both are inside noise and point the
same weak way as the draw-rate estimate. Bishop counters pooled (moves 5.93 → 7.24 a game, captures
1.30 → 1.50, survival 30.2% → 33.9%) are diluted by 6/40 against all other rank differences; they are
not separately interpretable here.

## Depth-4 decision

No depth-4 arm was run. The trigger is |difference| > its interval on decisive, draws or White score.
The automated paired column is exactly `0.000 ± 0.000` on all three, and the honest two-sample reads
White +0.003 ± 0.035, decisive −0.008 ± 0.032, draws +0.007 ± 0.031. Nothing is consequential, so the
protocol does not call for confirmation. A depth-4 arm would keep the same 34 shared ranks (still
byte-identical) and shrink the changed population from 240 to 60 games per arm, so it cannot resolve
the one open signal; a wider sample of same-colour ranks is the arm that would.

## Verdict: cosmetic for fairness and decisiveness

The Chess960 convention does not earn its place on measured fairness or decisiveness. Removing it
moves White by +0.003 ± 0.035 (0.561 → 0.564), decisiveness by −0.008 ± 0.032 (0.792 → 0.784) and the
draw rate by +0.007 ± 0.031 (0.198 → 0.206): all three intervals cover zero, and 1,360 of the 1,600
games per arm are unchanged by construction because both arms share 34 ranks. Interest is flat
(0.483 → 0.484, ±0.006). The 240 games that do change play only 15% of the population, and their
point estimate — same-colour pairs a touch more drawish — is the direction the convention predicts but
sits 1.2 standard errors from zero, and the pre-buff 2026-09-13 run did not reproduce even its sign
(draws −0.008 ± 0.031 then against +0.007 ± 0.031 now). On this evidence the rule neither improves nor
harms balance and decisiveness; it is cosmetic. Keep it as an identity choice (Chess960 consistency,
and a drawn pair of bishops covers both colour complexes), not as a measured fairness fix.
