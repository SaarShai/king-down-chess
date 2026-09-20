# Draw rules off: fifty-move and dead-material draws measured (2026-09-17)

The two game-rule draw toggles are `fiftyMove` (default `true`, `src/rules/rules.ts:271`) and
`insufficientMaterial` (default `true`, `src/rules/rules.ts:275`). The corpus census found current
draws end mostly by the lab's own adjudication (~80%) and repetition (~13%), while the game-rule
draws are small. These two paired A/Bs measure whether turning each toggle off changes the
decisive share at all.

## Method

- Exact commands, from the repo root, one after the other, 4 workers each:
  - `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-D-50 --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "fiftyMove=false"`
  - `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-D-mat --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "insufficientMaterial=false"`
- Control arm in both: today's defaults. 1,600 games per population, depth 3, ply cap 300, 40
  sampled arrangements (40 games each), 4 random opening plies, seed 71, common random numbers. The
  two sides play the same rules, so pairs are off and there is no SPRT: this is a paired
  two-population comparison.
- The third column is the mean over the 40 shared arrangements of (rule − base), with a 95% normal
  approximation interval. Pre-registered trigger: consequential if |difference| > its interval on
  **decisive, draw rate or white score**. Neither variant cleared that trigger, so no depth-4 arm
  was run for either (the reserved arm was
  `--id <id>-d4 --games 400 --depth 4 --seed 72 --workers 4` plus the same rule).
- Masking to keep in mind: the lab itself ends games before the board does (`ADJUDICATE`,
  `src/sim/spec.ts:15`) — resignation at ±6.00 for 3 plies, a draw at |eval| ≤ 0.20 for 8 plies
  after ply 68, and the 300-ply cap. A game-rule ending can therefore be replaced by a lab
  adjudication without moving the draw column.
- Cost: D-50 base 1,600 games in 11m35s and variant in 11m55s; D-mat base 9m04s and variant 8m34s;
  about 41 minutes total.

## Variant 1 — `fiftyMove=false` (`pb-ab-D-50`)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.561 | -0.000 ± 0.001 | no |
| decisive | 0.792 | 0.792 | +0.001 ± 0.001 | no |
| draw rate | 0.198 | 0.198 | -0.001 ± 0.001 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.000 | no |
| mean plies | 110.3 | 110.3 | +0.0 ± 0.0 | no |
| interest | 0.483 | 0.484 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.483 | 0.484 | +0.000 ± 0.000 | no |

The only other flagged row in the full 23-row table is the `excessDecisiveness` residual
(0.001 → 0.000, −0.001 ± 0.000), a diagnostic among 18 residual metrics and not one of the three
trigger metrics.

## Variant 2 — `insufficientMaterial=false` (`pb-ab-D-mat`)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.561 | +0.000 ± 0.000 | no |
| decisive | 0.792 | 0.792 | +0.000 ± 0.000 | no |
| draw rate | 0.198 | 0.198 | -0.001 ± 0.001 | no |
| capped | 0.010 | 0.011 | +0.001 ± 0.001 | no |
| mean plies | 110.3 | 110.5 | +0.2 ± 0.2 | yes |
| interest | 0.483 | 0.483 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.483 | 0.483 | -0.000 ± 0.000 | no |

Two more diagnostics are flagged at the rounding resolution: branching factor 32.7 → 32.7
(−0.0 ± 0.0) and permanence 0.959 → 0.959 (+0.000 ± 0.000). None of the three is an outcome
metric; the +0.2 ± 0.2 ply shift is the visible trace of games that continue past a dead-material
position.

## Draw-reason breakdown

Counts and share of the 1,600 games from each `sim/out/<id>.{base,var}.summary.json`. The base arm
is the same 1,600-game default population in both experiments, and its numbers repeat exactly.
`adjudicatedResign` ends a game decisively (the lab awards a win); `plyCap` is a 0.5 at 300 plies;
`draw50` and `drawMaterial` are the two toggles.

| reason | D-50 base | D-50 var | D-mat base | D-mat var |
|---|---|---|---|---|
| adjudicatedResign | 1267 (79.19%) | 1268 (79.25%) | 1267 (79.19%) | 1267 (79.19%) |
| adjudicatedDraw | 255 (15.94%) | 257 (16.06%) | 255 (15.94%) | 263 (16.44%) |
| drawRepetition | 46 (2.88%) | 47 (2.94%) | 46 (2.88%) | 46 (2.88%) |
| plyCap | 16 (1.00%) | 16 (1.00%) | 16 (1.00%) | 17 (1.06%) |
| drawMaterial | 10 (0.62%) | 10 (0.62%) | 10 (0.62%) | **0** |
| draw50 | 4 (0.25%) | **0** | 4 (0.25%) | 5 (0.31%) |
| stalemate | 2 (0.12%) | 2 (0.12%) | 2 (0.12%) | 2 (0.12%) |
| draws excl. plyCap | 317 (19.81%) | 316 (19.75%) | 317 (19.81%) | 316 (19.75%) |

**Which ending changed.**

- `fiftyMove=false` removes the 4 `draw50` endings (0.25%). They reappear elsewhere as
  +2 `adjudicatedDraw`, +1 `adjudicatedResign` and +1 `drawRepetition`. Draws excluding the cap
  move 317 → 316.
- `insufficientMaterial=false` removes the 10 `drawMaterial` endings (0.62%). They do **not**
  become decisive: +8 reappear as `adjudicatedDraw`, +1 as `draw50` and +1 as `plyCap`. Draws
  excluding the cap again move 317 → 316.

## Verdict

**`fiftyMove=false` — null.** Decisive share 79.2% → 79.2% (+0.1 ± 0.1 points), draw rate 19.8% →
19.8% (−0.1 ± 0.1 points), white score 56.1% → 56.1% (−0.0 ± 0.1 points); mean plies, capped and
interest are flat too. The rule removes 4 endings in 1,600 games and the lab's adjudication absorbs
them. The toggle is not contradicted and not supported: it changes nothing at this sample.

**`insufficientMaterial=false` — null.** Decisive share 79.2% → 79.2% (+0.0 ± 0.0 points), draw
rate 19.8% → 19.8% (−0.1 ± 0.1 points), white score 56.1% → 56.1% (+0.0 ± 0.0 points); capped rises
by one game (0.010 → 0.011, +0.1 ± 0.1 points) and mean plies by +0.2 ± 0.2. The 10 dead-material
draws it removes stay draws: 8 are re-declared by the lab's own draw adjudication, 1 reaches the
50-move rule and 1 hits the ply cap. The lab's adjudication therefore masks this game-rule change,
exactly as the census suggested it might.

No depth-4 arm was run for either variant, because the pre-registered trigger (decisive, draws or
white score) did not fire. The base-column identity across the two experiments is the expected
determinism of the same spec, not a reused run.

Data: `sim/out/pb-ab-D-50.experiment.md`, `sim/out/pb-ab-D-50.base.summary.json`,
`sim/out/pb-ab-D-50.var.summary.json`, `sim/out/pb-ab-D-mat.experiment.md`,
`sim/out/pb-ab-D-mat.base.summary.json`, `sim/out/pb-ab-D-mat.var.summary.json` and the four
`.jsonl` game files beside them.
