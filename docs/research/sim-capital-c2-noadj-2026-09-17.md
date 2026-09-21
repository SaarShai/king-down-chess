# Capital C2 without adjudication: does the draw reduction survive? (2026-09-17)

The adjudicated C2 reading is draw rate −2.7 ± 2.6 points at depth 4 (22.7% → 20.0%) with capped
games rising 1.7% → 3.1% (`sim-capital-c2-d4-2026-09-17.md`). The no-adjudication landmark showed
that adjudication supplies most of the lab's draws: played out, the shipped rules are 87.2%
decisive against 79.1% adjudicated (`sim-no-adjudication-2026-09-17.md`). This route reruns the C2
A/B with adjudication off in both arms, to see whether the draw reduction survives when the games
reach their own end.

- **Run:** `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-sanct-noadj --experiment ab
  --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "capitalSanctuary=true"
  --noadjudicate`. The flag spelling `--noadjudicate` is confirmed at `src/sim/spec.ts:201`
  (`if (f.noadjudicate) base.adjudicate = false`); both arm specs carry `"adjudicate":false`.
  Same games, sample, seed, depth and rule as the adjudicated C2 depth-3 run
  (`pb-ab-cap-sanct`); the only change is adjudication off.
- Control arm `pb-ab-cap-sanct-noadj.base` with `rules {}`; treatment arm
  `pb-ab-cap-sanct-noadj.var` with `capitalSanctuary=true`. 1,600 games per arm, 4 workers, ply cap
  300, 4 random opening plies, the same 40 arrangements and opening seeds in both arms.
- **Gate:** |difference| > interval on decisive, draw rate or white score. Decisive −0.007 ± 0.022,
  draws −0.013 ± 0.020, white score −0.025 ± 0.032: all intervals cover zero. No depth-4 arm was
  triggered. Result below is depth 3 only.

## Headline table (1,600 games per arm, seed 71)

From `sim/out/pb-ab-cap-sanct-noadj.experiment.md`:

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.566 | 0.541 | −0.025 ± 0.032 | no |
| decisive | 0.879 | 0.871 | −0.007 ± 0.022 | no |
| draw rate | 0.094 | 0.081 | −0.013 ± 0.020 | no |
| capped | 0.028 | 0.048 | +0.020 ± 0.014 | yes |
| mean plies | 149.7 | 153.4 | +3.7 ± 4.8 | no |
| interest | 0.495 | 0.503 | +0.007 ± 0.004 | yes |
| interest (min-use) | 0.490 | 0.503 | +0.013 ± 0.006 | yes |
| branching factor | 30.1 | 31.5 | +1.4 ± 0.4 | yes |
| killer move | 0.398 | 0.440 | +0.042 ± 0.017 | yes |

The difference column is the mean of (rule − base) over the 40 shared arrangements with a 95%
normal interval. The pooled draw rate excludes the ply cap; the cap has its own row.

## End reasons (from the two `.summary.json` files)

| reason | base | with the rule |
|---|---|---|
| checkmate | 1,406 (87.88%) | 1,394 (87.13%) |
| drawRepetition | 105 (6.56%) | 98 (6.13%) |
| plyCap | 44 (2.75%) | 76 (4.75%) |
| drawMaterial | 28 (1.75%) | 3 (0.19%) |
| draw50 | 14 (0.88%) | 28 (1.75%) |
| stalemate | 3 (0.19%) | 1 (0.06%) |

No arm records a single `adjudicatedResign` or `adjudicatedDraw`: every decisive game is a
checkmate (1,406 base, 1,394 with the rule), and every draw is a game ending of its own
(repetition, fifty-move, dead
material, stalemate, or the 300-ply cap). The `.summary.json` `draws` field counts the cap as a
draw (194 base, 206 with the rule); the experiment table's draw rate excludes it (150, 130). The
stalemate count is new against the earlier no-adjudication baseline, which saw none.

## Comparison with the adjudicated C2

| metric | adjudicated C2 (d4, seed 72) | no adjudication (d3, seed 71) |
|---|---|---|
| decisive | 0.756 → 0.769, +0.013 ± 0.026 (no) | 0.879 → 0.871, −0.007 ± 0.022 (no) |
| draw rate | 0.227 → 0.200, −0.027 ± 0.026 (yes) | 0.094 → 0.081, −0.013 ± 0.020 (no) |
| capped | 0.017 → 0.031, +0.014 ± 0.011 (yes) | 0.028 → 0.048, +0.020 ± 0.014 (yes) |
| white score | 0.541 → 0.542, +0.001 ± 0.028 (no) | 0.566 → 0.541, −0.025 ± 0.032 (no) |
| mean plies | 116.3 → 112.5, −3.9 ± 4.8 (no) | 149.7 → 153.4, +3.7 ± 4.8 (no) |

The adjudicated depth-3 arm (`pb-ab-cap-sanct`, same seed 71 as this run) is the closest yardstick:
draws 0.198 → 0.160, −0.038 ± 0.031 (confirmed); capped 0.010 → 0.018, +0.008 ± 0.009 (no);
decisive +0.031 ± 0.033 (no); white score −0.034 ± 0.030 (confirmed). The no-adjudication run cuts
the draw level by half — 9.4% against 19.8% in the adjudicated reading — and the C2 draw-down point
estimate with it (−1.3 points against −3.8 at the same seed and depth; −2.7 at adjudicated depth 4).

## Verdict: the draw-down survives in sign but not in size; the ply-cap cost does survive

- **Adjudication off does not turn C2 into a draw engine; the draw floor just drops.** Played out,
  base draws are 9.4% (150/1,600) and rule draws 8.1% (130/1,600). C2 still reduces draws by 1.3
  points ± 2.0 — the same direction as the adjudicated −2.7 ± 2.6 at depth 4, but smaller and inside
  its interval here. The depth-4 gate is not met, so this route cannot confirm a draw reduction
  without adjudication. What it can say: the reduction is not an artifact of the adjudicator, and
  no draw reason rises with the rule except `draw50` (14 → 28); the capped count (44 → 76) is
  counted separately.
- **The ply-cap rate roughly doubles in both readings, and here it is confirmed.** Capped games
  rise 2.75% → 4.75% (+2.0 ± 1.4, significant), against the adjudicated 1.7% → 3.1%
  (+1.4 ± 1.1, confirmed at depth 4) and 1.0% → 1.8% (+0.8 ± 0.9, not confirmed at depth 3). Games
  run long when let go — mean 149.7 plies base, 153.4 with the rule — and the rule adds to that
  (+3.7 ± 4.8, not confirmed). The cap, not a new draw mechanism, absorbs the extra length.
- **Decisive is unchanged and white score moves only mildly.** Decisive 87.9% → 87.1%
  (−0.007 ± 0.022), and the 87% win share is all checkmate. White score falls 0.566 → 0.541
  (−0.025 ± 0.032, not confirmed); the adjudicated depth-3 move toward fairness (−0.034, confirmed)
  does not clear the bar without adjudication.
- **Dead-material endings nearly vanish with the rule:** `drawMaterial` 28 → 3. Together with the
  confirmed capped rise, the endings C2 leaves are longer games that hit the cap or the fifty-move
  rule, not games that run out of material.

Across the two readings the pattern is stable: C2 leans draw-reducing, and it pays in capped games
whenever it is measured. With adjudication the draw cut is confirmed at −2.7 points; without it the
cut is real in direction but this depth-3 sample (draws −1.3 ± 2.0) does not resolve it. The one
cost that does not depend on the adjudicator is the ply-cap rate, which roughly doubles:
2.75% → 4.75% here, 1.7% → 3.1% adjudicated.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
