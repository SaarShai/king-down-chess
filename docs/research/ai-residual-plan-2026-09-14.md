# Material + residual: the plan for Q6 (2026-09-14)

Prep only. **Nothing here has been run.** `ai-nnue-2026-09-13.md` §7 lists four next steps in the
order that pays; this covers the first two — ten times the data, and a net that predicts a bounded
**residual** on top of the shipped linear evaluation instead of replacing it.

The code is in the tree, off by default, and the unit tests hold it. The machine time waits for
`sim/out/queue-2026-09-14.done`.

## 1. What the first net got wrong, and what changes

The 2026-09-13 net predicted the whole evaluation and lost **−129 ± 29 Elo**. §5 of that report
names the mechanism: a net fitted on quiet self-play positions meets few large material imbalances
and regresses them to the middle, so it read a missing queen as 549 cp instead of 931. Inside
alpha-beta that is fatal — every capture is under-rewarded.

The cure is to take material out of the net's job:

```
evalBoard = evaluateBoard(board, turn) + clip(nnueEval(board, turn), ±150 cp)
```

The linear evaluation is unchanged and still prices the queen at 933. The net only says what the
hand evaluation got wrong, and it may say it by at most 1.5 pawns. Two leaves can therefore differ
by at most 300 cp on the net's account, so **every piece above the pawn keeps its ordering by
construction**. The 150 is the span of the *whole* positional part of the hand evaluation (tables,
mobility, shield, king), so the net can add as much judgement as every hand-written term together
and no more.

The trainer reads the same constant, so the target it fits is one the engine can express: the label
is the search score **pulled to within 150 cp of that position's linear evaluation**, and the net's
output is added to the linear evaluation *before* the sigmoid. The loss shape is unchanged — the
sigmoid target measured 58 Elo better than plain centipawns, and the reason it beat centipawns
(it spends the parameters in the ±100 cp band where moves are chosen) is the reason to keep it.

On the existing 863k-position corpus the clip binds on **2.3% of positions**. The bound is a rail,
not a filter.

### Files

| file | change |
|---|---|
| `src/ai/nnue/net.ts` | `RESIDUAL_MAX = 150`; `NetKind`; `loadNet(b64, kind)`; `netKind()` |
| `src/ai/nnue/weights.ts` | `NET_KIND` beside `NET_B64` (today: `'full'`, the 2026-09-13 net) |
| `src/ai/eval.ts` | `Evaluator` gains `'residual'`; `evalBoard` adds the clipped net to the linear evaluation; `setEvaluator` refuses the wrong kind of net |
| `src/sim/gen.ts` | `train --loss res`; `linearBases()`; `arms` also writes `eval-residual.json`; `bench` benches whichever kind is loaded; `sample` now **requires** `--runs` |
| `src/ai/nnue/net.test.ts` | six new tests (below) |

The Int16 blob format, the quantisation, the feature layout and the shape (`1408 -> 32x2 -> 1`) are
untouched, so `weights.ts` stays one base64 line of about 118 kB. **The default evaluator is still
`linear`**; nothing the browser plays changes.

`sample` requiring `--runs` is the 2026-09-13 lesson made mechanical: a stored `rules: {}` means
"the defaults on the day the run played", not today's, so no filter over stored specs can tell a
run of today's game from a run of an older one. The runs are now named by hand. (`todayRuns()`,
which did exactly that filtering, is deleted.)

### What was not done

**No incremental accumulator.** It is step 4 of the report's own list, behind this one, and it buys
nodes per second and no strength at fixed depth — which is how every match here is scored. Add it
when a residual net has won a match and the browser needs the speed back.

### Tests (`npx vitest run`: 128 passed, 6 files; `npx tsc --noEmit` clean)

Five of the six load a deliberately hostile residual net — weights spread over the whole Int16
range, raw output in the thousands of centipawns — so the clip is the only thing between it and the
material term:

- the residual never moves the linear evaluation by more than `RESIDUAL_MAX`, **and the clip fires**
  (a net that returned zero would pass the bound and prove nothing);
- `setEvaluator` throws on the wrong kind of net, both ways;
- mirror symmetry within 1 cp (the net half is exact; the linear half rounds a fractional king
  phase, the same tolerance `search.test.ts` allows);
- the search still takes a free rook, and still mates in one, with that hostile net loaded;
- the trainer fits the **gap** to the linear evaluation and not the score: on a corpus labelled
  `linear + 60 cp`, `--loss res` reaches a held-out loss nearly three times lower than `--loss wdl`
  on the same data. Remove the base from both target and gradient and the two fits become identical.

## 2. Generate — about 2.3 hours on 16 cores

Ten times the data, from the shipped engine, at today's defaults. The previous corpus came from
7,622 games at 113 positions a game; 80,000 games is **about 9.0M positions**, 10.5x.

```
npm run sim -- --id nnue-g1 --games 80000 --depth 3 --sample 4000 --seed 914 --workers 16 \
  --rule archerMove=any --rule beastMove=any --rule guardCaptures=none --rule guardStep=1 \
  --rule guardCaptureLimit=0 --rule promotionSet=anyNonKingNoGuard
```

Every named rule is already the default. They are on the command line so the run describes itself
and can be classified later without trusting a stored spec. The pool is `src/rules/setup.ts`'s
`QLRRBBNNAAGMMSS` — at most one guard per army, today's game — and needs no flag. 4,000 distinct
back ranks, about 19 games each, each with its own opening seed.

**Time.** The median of the 81 recorded depth-3 runs is 9.7 games/s; the aggregate over 282,300
games is 7.5. At 9.7 games/s, 80,000 games is **2.3 h** (1.9 h at the 11.8 games/s the machine gave
when it was free, 3.0 h at the aggregate rate). The run resumes from its own JSONL, so an
interruption costs nothing but the games in flight.

**Disk.** About 825 MB of JSONL (10.3 kB a game, measured on `tune-g0`).

Two things this changes against the old corpus, both intended: the teacher is the **shipped**
evaluation (the old labels came from an engine 94 Elo weaker), and the games are played under the
one-guard pool and `promotionSet=anyNonKingNoGuard`, which the old ones were not.

## 3. Sample and train — about 27 minutes, one thread

```
npm run nnue -- sample --runs nnue-g1
npm run nnue -- train --loss res --lambda 0 --epochs 16 --batch 8192 --lr 0.015
```

**`--workers` does not apply to either**: `npm run sim` and `npm run tune -- fit` take workers,
the NNUE sampler and trainer do not. Neither is the bottleneck, so neither is worth a worker pool.

| step | measured rate | at 80,000 games |
|---|---|---|
| `sample` | 156 games/s, 1 thread, machine loaded | **9 min**, about 9.0M positions, 615 MB |
| `train` | 6.5 s an epoch on 863k positions (bases + train + validation) | **18 min** for 16 epochs |

Training peaks around 750 MB (615 MB corpus, 36 MB of linear bases, 72 MB of split indices). If
node complains, `NODE_OPTIONS=--max-old-space-size=8192`.

`--lambda 0` holds the game result out of the target. The report's §7.3 says to restore it only
when there are more games than feature weights; 80,000 games does clear 45,153 weights for the
first time, but that is a **second** experiment (`--lambda 0.1`), not a change to the first net.

One measured hint, worth exactly what it is worth: a single epoch of `--loss res` on the *old* 863k
corpus reaches a held-out loss of **0.000839**, against net B's best of **0.001593** after 16
epochs on the same split and the same loss. The linear evaluation is doing most of the work, as
intended. It is still only validation error, and **held-out error ranks fits, a match decides them**
— that sentence has now been true twice in this project.

## 4. Accept or reject — an Elo match at fixed depth

```
npm run nnue -- arms          # writes sim/nnue/eval-{linear,nnue,residual}.json
npm run tune -- match --id nnue-res-d3 --games 400 --depth 3 --seed 7103 --workers 16 \
  --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
```

Both sides keep the same material values, so move ordering and delta pruning are identical and only
the leaf evaluation differs. One process, evaluations swapped between plies with the transposition
table dropped, colour-swapped pairs, random back ranks. The printed line reads
`tuned score … Elo ±95% … nElo … LOS … draws … plies`, where "tuned" is the residual arm.

**Time.** `nnue-d3` played 400 games in 226 s — call it **4 min** for 400, **15 min** for 1,600.

**The bar.**

1. **Gate, 400 games (±30 Elo).** Reject and stop if the score is below 0.5. The first net read
   0.323 here; anything near that means the residual did not fix what §5 measured.
2. **Decide, 1,600 games (±15 Elo), seed 7104.** Adopt only if `Elo − err95 > 0` — a positive lower
   bound at 95%, the same bar stage 0 cleared at +94 ± 30.
3. **Confirm at depth 4, 200 games, seed 7105.** The first net's deficit narrowed from −129 to −98
   with one more ply, so a result that only holds at depth 3 is not a result. Expect a gain to
   shrink with depth too; it must not change sign.
4. **Speed.** `npm run nnue -- bench --depth 5 --positions 12`. The residual path runs both
   evaluations at every leaf, so expect about **1.19x** the time of linear — the same as the net
   alone, because the net is what costs — and a one-second search to reach depth 5.8. The browser
   gate is depth ≥ 5 in one second.

Only then: `npm run nnue -- pack` is already done by `train`, the blob is in `weights.ts`, and
making it the default is a one-word change in `src/ai/eval.ts` plus a rebuild and a republish.

## 5. Risks

- **The teacher is still a depth-3 search.** The residual fixes material compression, not the
  ceiling. A net distilling depth 3 cannot be better than depth 3 at the leaves; the gain, if any,
  comes from carrying that judgement to every leaf of a deeper search.
- **The clip could be wrong for the new corpus.** `train` prints the share of positions outside
  ±150 cp before the first epoch. It is 2.3% on the old corpus. If the new one reads much higher,
  stop and think before spending 18 minutes — either the bound is too tight or the sampler kept
  positions that are not quiet.
- **A re-tune of `src/ai/eval.ts` invalidates the net.** The residual is fitted to *this* linear
  evaluation. Any `npm run tune:apply` after training moves the base out from under it; retrain.
- **λ = 0 leaves the game result unused.** That is deliberate — the WDL term memorises back ranks —
  but it also means the net never sees what actually wins, only what the search thinks.
- **400 games cannot see 20 Elo.** Do not read the gate as the answer; it can only reject.
- **Contention.** Every figure above assumes 16 free cores. The old corpus was collected at 3–9
  games/s while two other campaigns shared the machine; the 6.5 s epoch was measured while the
  balance-lab chain held all 16.
- **Disk.** 825 MB of JSONL plus 615 MB of `positions.bin`. `sim/out` already holds 3.1 GB.
- **A residual net and a full net are not interchangeable.** Adding a full net to the linear
  evaluation counts every piece twice. `NET_KIND` and `setEvaluator` make that a loud error rather
  than a bad 400-game match, and `bench` follows whichever kind is loaded.
