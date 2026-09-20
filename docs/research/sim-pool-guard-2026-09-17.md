# Pool composition: with vs without the guard under current rules (2026-09-17)

The shipped pool `QLRRBBNNAAGMMSS` holds **one** `G` (15 letters; `POOL.split('G')` has length 2,
`src/rules/rules.test.ts:563`). The guard was the project's known draw engine in older measurements,
but that evidence is void under today's rules. Its levers were just re-measured — `guardCaptures=pawns`,
`guardStep=2`, `guardImmune=false` and the capital bonuses are null or rejected — so today's guard is
the shipped wall (`guardImmune=true`, `guardCaptures='none'`, `guardStep=1`; `src/rules/rules.ts:278-280`),
and a corpus census finds a guard on the board at the end of 47.3% of drawn games. This asks the pool
question directly: what does the army lose or gain when the guard is removed from the pool entirely?
Two sampled-pool arms, 2,000 games each, 40 back ranks each, one seed.

## Method

- **Specs.** `sim/specs/pool-guard-2026-09-17/guard.json` and `noguard.json`. Both carry `games: 2000`,
  `backRanks: { sample: 40, pool: ... }`, `ai: { depth: 3 }`, `seed: 85`, `commonSeeds: true`. `guard`
  uses the shipped pool `QLRRBBNNAAGMMSS` (15 letters, one `G`); `noguard` uses `QLRRBBNNAAMMSS`
  (14 letters, the same pool with the one `G` removed) and is otherwise identical. The JSON object
  form of `backRanks` is read directly by `loadSpec` (`src/sim/spec.ts:208-214`), `buildJobs` consumes
  it (`src/sim/spec.ts:267-274`), and `sampleBackRank` draws 7 letters from the pool plus the king
  (`src/sim/spec.ts:165-174`). No CLI `--pool`/`--sample` flags were needed, so the spec files are the
  whole experiment.
- **Rules.** Neither spec sets `rules` or `values`; each run logged `rules {}, values {}`, so both arms
  play today's shipped defaults. `promotionSet` is `anyNonKingNoGuard` (`src/rules/rules.ts:323`), so no
  pawn can promote to a guard: the no-guard arm has zero `G` for the whole game, and the guard arm's
  only guards come from the sampled rank.
- **Runs.** Sequential from the repo root, 4 workers on a shared machine:

  ```
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-guard-2026-09-17/guard.json --workers 4
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-guard-2026-09-17/noguard.json --workers 4
  ```

  `guard`: 2,000 games in 883.8 s (2.3 games/s) -> `sim/out/pool-guard.jsonl` +
  `pool-guard.summary.json`. `noguard`: 2,000 games in 926.8 s (2.2 games/s) ->
  `sim/out/pool-noguard.jsonl` + `pool-noguard.summary.json`. Each file holds 2,000 complete lines.
- **What the pools actually sample.** `sampleBackRank` draws 7 letters, so the guard is picked with
  probability 7/15. The realized `guard` sample has **17 ranks with the guard and 23 without**, so
  850 of 2,000 games (42.5%) start with a guard in each army (both sides mirror the sampled rank) and
  1,150 (57.5%) do not; the `noguard` sample realized 0 ranks with a `G`. The arms compare the shipped
  pool with the same pool minus its one guard, not a fixed one-versus-zero guard count.
- **Pairing.** `commonSeeds: true` gives game *i* the same per-game RNG seed in both files (2,000/2,000
  match on `gameId` 0-1,999). The pools differ, so **0 of 2,000 games share a back rank** (the 40 ranks
  of the two arms are disjoint). Pair correlation is +0.0088 (decisive), +0.0131 (white score) and
  −0.0307 (plies): game *i* is a same-opening-seed game, not the same opening. Paired and unpaired
  intervals are both reported; they agree.
- **Analysis.** A throwaway script read both JSONL files. Paired interval: 1.96 · sd(per-game Δ) / √2000
  over the 2,000 common `gameId`s. Unpaired interval: 1.96 · √(se₁² + se₂²), each se from the arm's
  binomial (rates) or sample sd (white score, plies).

## Pooled result

| arm | pool | games | decisive | draw rate | white score | mean plies |
|---|---|---|---|---|---|---|
| guard | `QLRRBBNNAAGMMSS` | 2,000 | 0.8120 (1,624) | 0.1880 (376) | 0.53200 (876 W / 376 D / 748 B) | 108.07 |
| noguard | `QLRRBBNNAAMMSS` | 2,000 | 0.8235 (1,647) | 0.1765 (353) | 0.53375 (891 W / 353 D / 756 B) | 104.95 |
| guard − noguard | | | −0.0115 ± 0.0239 | +0.0115 ± 0.0239 | −0.00175 ± 0.0280 | +3.12 ± 2.81 |

Draw rate is the exact mirror of decisive share (0.1765 = 1 − 0.8235), so their intervals are equal.
The point estimates say the guard adds 1.15 points of draws and 3.12 plies; every unpaired interval
except mean plies contains zero.

## Draw-reason breakdown

| reason | guard | share of guard draws | noguard | share of noguard draws | Δ |
|---|---|---|---|---|---|
| adjudicatedResign (decisive) | 1,624 | — | 1,647 | — | −23 |
| adjudicatedDraw | 284 | 75.53% | 282 | 79.89% | +2 |
| drawRepetition | 54 | 14.36% | 51 | 14.45% | +3 |
| drawMaterial | 18 | 4.79% | 9 | 2.55% | +9 |
| plyCap | 11 | 2.93% | 8 | 2.27% | +3 |
| draw50 | 9 | 2.39% | 3 | 0.85% | +6 |
| draw total | 376 | | 353 | | +23 |

Every draw reason is non-zero and slightly larger with the guard; material (+9) and the fifty-move
rule (+6) carry most of the 23-game draw gap, which is exactly the 23-game decisive gap. Neither arm
had a checkmate or a stalemate: all 1,624 / 1,647 decisive games ended in adjudicated resign.

## Paired-by-gameId result

| metric | mean Δ guard − noguard | paired 95% interval | paired sd | guard>noguard / guard<noguard / tie |
|---|---|---|---|---|
| decisive | −0.0115 | ± 0.0241 [−0.0356, +0.0126] | 0.5509 | 292 / 315 / 1,393 |
| draw rate | +0.0115 | ± 0.0241 [−0.0126, +0.0356] | 0.5509 | 315 / 292 / 1,393 |
| white score | −0.00175 | ± 0.0277 [−0.0295, +0.0260] | 0.6333 | 616 / 641 / 743 |
| mean plies | +3.12 | ± 2.80 [+0.32, +5.91] | 63.78 | 1,002 / 988 / 10 |

Pairing does not shrink the interval: the paired half-width for decisive (0.0241) is marginally larger
than the unpaired one (0.0239), because the two games of a pair share only the opening seed. The draw
discordance is 315 guard-only draws against 292 no-guard-only draws (McNemar z = +0.93), and 61 games
drew in both arms. Mean plies is the one metric whose interval excludes zero: games with the guard in
the pool run 3.12 plies longer.

## The guard in the ranks (descriptive)

| arm | guard in rank | ranks | games | draw rate | decisive | white score | mean plies |
|---|---|---|---|---|---|---|---|
| guard | yes | 17 | 850 | 0.2141 | 0.7859 | 0.5271 | 112.37 |
| guard | no | 23 | 1,150 | 0.1687 | 0.8313 | 0.5357 | 104.89 |
| noguard | none by construction | 40 | 2,000 | 0.1765 | 0.8235 | 0.53375 | 104.95 |

Within the guard arm, ranks that drew the guard drew 4.54 points more often than ranks that did not
(21.41% vs 16.87%) and lasted 7.5 plies longer. This is rank-level selection, not the controlled
removal — a guard rank spends one of its 7 picks on the guard — but it is consistent with a mild guard
draw effect, and it is the same direction as the pooled point estimate. Guard survival is near-total:
846 of the 850 games that started with a guard still had it at the end (the shipped `guardImmune=true`
leaves only a king able to capture it), and 181 of the 376 guard-arm draws (48.14%) ended with a guard
on the board — essentially the 47.3% corpus census. That end-of-game share therefore tracks survival
and game length as much as it tracks causation.

## Verdict

**Removing the guard from the pool is not a measurable draw drag under today's rules.** The pooled
numbers point the other way: with the guard pooled in, draws are 1.15 points *higher* (18.80% vs
17.65%) and decisive share 1.15 points lower, and the paired interval [−1.26, +3.56] points contains
zero (McNemar z = +0.93: 315 guard-only draws against 292 no-guard-only draws). White score moves by
−0.00175 (paired 95% CI [−0.0295, +0.0260]). The only metric whose interval excludes zero is game
length: the guard lengthens games by **+3.12 plies** (paired 95% CI [+0.32, +5.91]), which fits a wall
that survives to the end in 846 of the 850 games it starts. At 2,000 games per arm the design bounds a
rate effect near ±2.4 points and a score effect near ±2.8 points, so a true effect of the size that
would make the pool change worthwhile is not visible. The 47-48% guard-at-end share in drawn games is
real, but this test says it is not a lever: deleting the guard does not convert those draws into wins.
The re-measured guard levers (captures, step, immunity, capital bonuses) were each null or rejected,
and this pool test concurs at its resolution.

Data: `sim/out/pool-guard.jsonl`, `sim/out/pool-noguard.jsonl`, `sim/out/pool-guard.summary.json`,
`sim/out/pool-noguard.summary.json`. Specs: `sim/specs/pool-guard-2026-09-17/guard.json`,
`sim/specs/pool-guard-2026-09-17/noguard.json`.
