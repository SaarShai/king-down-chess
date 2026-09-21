# Arrangement sweeps A and B (2026-09-17)

Pre-registered criteria and ranking rule: `docs/research/arrangement-benchmark-2026-09-17.md`.

Sweep B is the independent-sample stability check: a second sample of 200 arrangements from a
different seed. Exact command (repo root, 6 workers):

```
node_modules/.bin/tsx src/sim/run.ts --id arr-b --experiment sweep --games 20 \
  --arrangements 200 --rounds 4 --depth 3 --seed 92 --workers 6
```

Successive halving, eta = 2, common random numbers inside each round:
r1 200 arrangements x 20 games, r2 100 x 40, r3 50 x 80, r4 25 x 160 (4,000 games/round).
Outputs `sim/out/arr-b.r1.*` … `arr-b.r4.*`; the last round's report is the ranked list.

Sweep A (run by another agent) is 400 arrangements, 5 rounds, depth 3, seed 91, same halving:
its last round keeps 25 arrangements.

`analyze.ts` applies the pre-registered ranking rule to a report JSON and runs the cross-sweep
comparison (shared arrangements + Spearman, or the feature-split fallback):

```
node_modules/.bin/tsx sim/specs/arrangement-2026-09-17/analyze.ts rank sim/out/arr-b.r4.report.json
node_modules/.bin/tsx sim/specs/arrangement-2026-09-17/analyze.ts compare \
  sim/out/arr-a.r5.report.json sim/out/arr-b.r4.report.json
```

Ranking rule as executed: drop `|score − 0.5| > 0.03` or `timeouts > 0.05`; sort by `interest`
descending, ties by `minUse` descending, then event diversity (read from the JSONL only if an
exact interest tie exists). The report JSON's `interest` field is the criterion-1 composite; the
residualised reading (`interestResiduals.interest`, fitted per pool) is reported as a robustness
check in the write-up.

Verdict and numbers: `docs/research/arrangement-sweep-b-2026-09-17.md`.

Result in one line: the sweeps share 0 arrangements (12,752,640 valid ranks; expected overlap
0.00005), the ±0.03 fairness gate leaves 13 of B's 25 finalists, the metric's split-half
reliability is rho = 0.52 at 80 games, and on the pre-registered residualised metric no feature
association survives both sweeps — the ranking is noise-dominated at this budget.
