# Threefold repetition off measured; beast C priced (2026-09-17)

Two loose ends. (1) The `threefold` draw toggle had never been turned off in a lab run, unlike
`fiftyMove` and `insufficientMaterial` (both null, `sim-drawrules-2026-09-17.md`). (2) The beast's
candidate C, `beastCapture=diagForward`, had a depth-4 balance read
(`sim-beast-diagfwd-2026-09-17.md`) but no price under that reading.

## 1. `threefold=false` — the lab adjudication absorbs it too

### Method

- Exact command, from the repo root, 4 workers:
  `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-D-3fold --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "threefold=false"`
- 1,600 games per population; base = today's defaults (arm `pb-ab-D-3fold.base`), variant =
  `threefold=false` (arm `pb-ab-D-3fold.var`). Depth 3, ply cap 300, 4 random opening plies, the
  same 40 arrangements and opening seeds in both arms (common random numbers), seed 71.
- The toggle is `Rules.threefold` (default `true`, `src/rules/rules.ts:303`, `src/rules/rules.ts:357`).
  `Game` always applies the repetition draw, so the runner recomputes the status without it
  (`src/sim/game.ts:122`).
- The third column is the mean over the 40 shared arrangements of (variant − base) with a 95% normal
  approximation interval. Pre-registered trigger: consequential if |difference| > its interval on
  **decisive, draw rate or white score**; then a depth-4 arm (400 games/arm, seed 72) was reserved.
- Cost: base 838.2 s (13m58s), variant 864.4 s (14m24s).

| metric | base (pooled) | with `threefold=false` (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.561 | +0.000 ± 0.001 | no |
| decisive | 0.792 | 0.792 | +0.001 ± 0.001 | no |
| draw rate | 0.198 | 0.197 | -0.001 ± 0.002 | no |
| capped | 0.010 | 0.011 | +0.001 ± 0.001 | no |
| mean plies | 110.3 | 110.7 | +0.5 ± 0.3 | yes |
| interest | 0.483 | 0.484 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.483 | 0.484 | +0.000 ± 0.001 | no |

No trigger metric clears its interval, so no depth-4 arm was run — the same gate that stopped the
`fiftyMove` and `insufficientMaterial` routes at depth 3.

### Draw-reason breakdown (from the two `.summary.json` files)

| reason | base | `threefold=false` | change |
|---|---|---|---|
| adjudicatedResign | 1,267 (79.19%) | 1,268 (79.25%) | +1 |
| adjudicatedDraw | 255 (15.94%) | 299 (18.69%) | +44 |
| drawRepetition | 46 (2.88%) | **0 (0.00%)** | **−46** |
| plyCap | 16 (1.00%) | 17 (1.06%) | +1 |
| drawMaterial | 10 (0.62%) | 10 (0.62%) | 0 |
| draw50 | 4 (0.25%) | 4 (0.25%) | 0 |
| stalemate | 2 (0.12%) | 2 (0.12%) | 0 |
| draws excl. plyCap | 317 (19.81%) | 315 (19.69%) | −2 |

**All 46 repetition draws are removed, and 44 of them (95.7%) stay draws: the lab re-declares them
`adjudicatedDraw`.** One becomes `adjudicatedResign` and one reaches the 300-ply cap. Non-capped
draws fall only 317 → 315. Decisive games move 1,267 → 1,268 (79.19% → 79.25%, +0.06 points;
paired +0.001 ± 0.001), white score 0.5609 → 0.5613 and the draw rate 0.198 → 0.197. Mean plies
+0.5 ± 0.3 is the only significant headline row and is the trace of the 44 absorbed games running
on to the draw adjudicator (|eval| ≤ 0.20 for 8 plies after ply 68).

The base arm reproduces `pb-ab-D-50.base` and `pb-ab-D-mat.base` exactly (0.5609 white, 0.7919
decisive, 0.198 draw rate, 110.3 plies, identical reason counts): same spec, seed and sample, not a
reused run.

### Verdict

**Null. Turning repetition draws off changes nothing at this sample; the lab adjudication absorbs
them exactly as it absorbed the other two draw rules.** `fiftyMove=false` removed 4 endings (2
returned as `adjudicatedDraw`, 1 decisive, 1 repetition), `insufficientMaterial=false` removed 10
(8 returned as `adjudicatedDraw`, 1 `draw50`, 1 cap), and `threefold=false` removes the largest
count yet — 46, 2.88% of games — with 44 back as `adjudicatedDraw` and 1 each decisive and capped.
All three leave decisive, the draw rate and white score inside their intervals. Repetition is the
biggest of the three ruled-out toggles, and it is still invisible to the outcome metrics.

## 2. Beast candidate C (`beastCapture=diagForward`) — priced at 1.99 ± 0.43

### Method

- Exact command, from the repo root, 4 workers:
  `node_modules/.bin/tsx src/sim/run.ts --id pb-S-diagfwd-value --experiment values --pieces S --games 500 --eloPerPawn 64 --depth 3 --seed 77 --workers 4 --rule "beastCapture=diagForward"`
- Muller's asymmetric-material method: the arm replaces one knight (3.16) of `RNBQKBNR` with a beast
  under C, on one side only, and plays 250 colour-reversed pairs (500 games), depth 3. Elo converts
  to pawns at the carried calibration 64 Elo/pawn (no calibration arm was played).
- S arm: pentanomial [70, 42, 88, 24, 26], score 0.394, Elo −75 ± 27, draws 14.6%, capped 0.2%,
  mean 96.9 plies.

| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| S (beast) | -75 ± 27 | -1.17 ± 0.43 | 1.99 ± 0.43 | 3.77 | 2.20 | 199 |

### Comparison

| beast reading | implied value (pawns) | source |
|---|---|---|
| shipped default `beastCapture='adjacent'`, seed `BEAST_V` | 3.77 (constant) | `src/ai/eval.ts:68` |
| default rules, current measured | 3.77 ± 0.43 | `pb-values-refresh2` (engine seed 3.68, next seed 377) |
| all 8 neighbours, `beastCaptureForward=true` | 4.34 ± 0.42 | `sim-beast-all8-2026-09-17.md` (`pb-S-all8-value`) |
| **C, `beastCapture=diagForward`** | **1.99 ± 0.43** | **this run** (`pb-S-diagfwd-value`) |
| `beastCapture='diagonal'` (four diagonals) | no price | `sim-beast-diagonal-2026-09-17.md` is a balance A/B only; no value pass was run |

`docs/research/sim-beast-diagonal-d4-2026-09-17.md` did not exist when this note was written, so
the diagonal reading has no depth-4/price pair to quote.

### Verdict

**C is balance-neutral but not price-neutral: at the shipped seed the engine overprices it by about
1.8 pawns.** The implied value falls 3.77 ± 0.43 → 1.99 ± 0.43, a move of −1.78 with a combined 95%
error of ±0.61 (√(0.43² + 0.43²)) — outside the noise, unlike the all-8 route (+0.57 ± 0.60 vs the
same 3.77). Muller's next seed is **199 cp**, and the run's own rule says to confirm it with a
second pass before writing it into `src/ai/eval.ts`.

The balance read behind the C candidate stays null (depth 4: decisive +0.013 ± 0.023, draws
−0.009 ± 0.021, white score +0.005 ± 0.020; `sim-beast-diagfwd-2026-09-17.md`), and the rule more
than halves the beast's captures (1.206 → 0.533 steps per game) and shortens games by 4.8 ± 4.0
plies. Both populations play the same rule, so that A/B measures character, not strength — the
value pass above is the strength reading, and it says the pawn-style beast is worth roughly half
the shipped constant.

Data: `sim/out/pb-ab-D-3fold.experiment.md`, `sim/out/pb-ab-D-3fold.base.summary.json`,
`sim/out/pb-ab-D-3fold.var.summary.json`, `sim/out/pb-S-diagfwd-value.experiment.md`,
`sim/out/pb-S-diagfwd-value.S.summary.json` and the `.jsonl` game files beside them.
