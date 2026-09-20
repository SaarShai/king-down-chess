# Pool composition: two archers vs one under the re-priced archer (2026-09-17)

The archer was re-priced from 3.73 to 5.05 pawns when its shots widened to `plusDiagFwd2`
(`docs/research/piece-balance-status-2026-09-17.md`). The shipped pool `QLRRBBNNAAGMMSS` holds
**two** `A`, and the archer is now the second-most valuable piece, so this asks whether the pool
should still offer two. Two sampled-pool arms, 2,000 games each, 40 back ranks each, one seed.

## Method

- **Specs.** `sim/specs/pool-arch-2026-09-17/two.json` and `one.json`. Both carry
  `games: 2000`, `backRanks: { sample: 40, pool: ... }`, `ai: { depth: 3 }`, `seed: 84`,
  `commonSeeds: true`. `two` uses the shipped pool `QLRRBBNNAAGMMSS` (15 letters, 2 `A`); `one`
  uses `QLRRBBNNAGMSS` (14 letters, 1 `A`) and is otherwise identical. The JSON object form of
  `backRanks` is read directly by `loadSpec`; the `--pool`/`--sample` CLI flags only override it
  (`src/sim/spec.ts:208`), `buildJobs` consumes `{ sample, pool }` at `src/sim/spec.ts:269`, and
  `sampleBackRank` draws 7 letters from the pool plus the king (`src/sim/spec.ts:165`). No CLI
  pool flag was needed, so the spec files are the whole experiment.
- **Runs.** Sequential from the repo root, 4 workers, on a shared machine:

  ```
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-arch-2026-09-17/two.json --workers 4
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-arch-2026-09-17/one.json --workers 4
  ```

  `two`: 2,000 games in 892.5 s (2.2 games/s), `sim/out/two.jsonl` + `two.summary.json`. `one`:
  2,000 games in 960.1 s (2.1 games/s), `sim/out/one.jsonl` + `one.summary.json`. Each file has
  2,000 complete lines and no torn record.
- **What the pools actually sample.** `sampleBackRank` draws 7 letters, so the number of archers
  per rank is random, not fixed. The `two` sample of 40 ranks realized 8 ranks with zero `A`, 27
  with one and 5 with two; the `one` sample realized 20 and 20. Mean archers per army is
  **0.925** (`two`) against **0.500** (`one`), not 2 against 1. The arms therefore differ in how
  *often* an archer is offered, not in a fixed archer count.
- **Pairing.** `commonSeeds: true` gives game *i* the same per-game RNG seed in both files
  (2,000/2,000 match). Because the two pools have different lengths, sampling consumes the RNG
  differently: **0 of 2,000 games share a back rank**. Game *i* in the two files is a same-seed
  game, not the same opening. The paired estimate is reported, but the pair correlation is
  −0.034 (decisive) and −0.031 (white score), and the unpaired binomial interval is the
  appropriate one; both are given below.
- **Analysis.** A throwaway script read both JSONL files. Paired interval:
  1.96 · sd(per-game Δ) / √2000 over the 2,000 common `gameId`s. Unpaired interval:
  1.96 · √(se² + se²), each se from the arm's binomial (rates) or sample sd (white score).

## Pooled result

| arm | pool | games | decisive | draw rate | white score | mean plies |
|---|---|---|---|---|---|---|
| two | `QLRRBBNNAAGMMSS` | 2,000 | 0.8050 (1,610) | 0.1950 (390) | 0.5450 (895 W / 390 D / 715 B) | 107.6 |
| one | `QLRRBBNNAGMSS` | 2,000 | 0.7975 (1,595) | 0.2025 (405) | 0.5503 (898 W / 405 D / 697 B) | 108.2 |
| one − two | | | −0.0075 ± 0.0248 | +0.0075 ± 0.0248 | +0.0053 ± 0.0276 | +0.6 ± 3.1 |

Draw rate is the exact mirror of decisive share (0.2025 = 1 − 0.7975), so their intervals are
equal. Every unpaired interval contains zero. End reasons for `two`: 1,610 adjudicated resign,
304 adjudicated draw, 47 repetition, 14 fifty-move, 12 material, 12 ply cap, 1 stalemate; for
`one`: 1,595 / 307 / 50 / 14 / 23 / 11 / 0.

## Paired-by-gameId result

| metric | mean Δ one − two | paired 95% interval | paired sd | one>two / one<two / tie |
|---|---|---|---|---|
| decisive | −0.0075 | ± 0.0252 [−0.0327, +0.0177] | 0.5741 | 322 / 337 / 1,341 |
| draw rate | +0.0075 | ± 0.0252 [−0.0177, +0.0327] | 0.5741 | 337 / 322 / 1,341 |
| white score | +0.0053 | ± 0.0280 [−0.0228, +0.0333] | 0.6392 | 657 / 654 / 689 |
| mean plies | +0.58 | ± 3.12 [−2.53, +3.70] | 71.1 | 1,002 / 989 / 9 |

Pairing does not shrink the interval: the paired half-width for decisive (0.0252) is marginally
larger than the unpaired one (0.0248), and 0.0280 versus 0.0276 for white score, because the two
games of a pair share only the opening seed. The null holds under either treatment.

## Archers in the rank (descriptive)

| arm | archers in rank | games | decisive | draw rate | white score | mean plies |
|---|---|---|---|---|---|---|
| two | 0 | 400 | 0.7275 | 0.2725 | 0.5513 | 118.9 |
| two | 1 | 1,350 | 0.8237 | 0.1763 | 0.5430 | 105.0 |
| two | 2 | 250 | 0.8280 | 0.1720 | 0.5460 | 103.9 |
| one | 0 | 1,000 | 0.7680 | 0.2320 | 0.5530 | 112.5 |
| one | 1 | 1,000 | 0.8270 | 0.1730 | 0.5475 | 103.8 |

Ranks that draw an archer are about 5 to 10 points more decisive than ranks that do not, and
ranks with one archer behave the same in both arms (0.8237 versus 0.8270). The `two` arm's five
two-archer ranks (0.8280) are not more decisive than its one-archer ranks. This is rank-level
selection, not a controlled removal, but it says the archer count above one is not what moves
the arm differences; presence does.

## Verdict

**Dropping the second archer from the pool does not measurably change decisiveness, draws,
fairness or pace.** One − two is −0.0075 ± 0.0248 decisive and +0.0075 ± 0.0248 draws unpaired
(−0.0075 ± 0.0252 paired), +0.0053 ± 0.0276 white score and +0.6 ± 3.1 plies; all four intervals
span zero. The largest point movement, 0.75 points of decisive share, is a third of the interval
half-width. At 2,000 games per arm the design bounds any rate effect near ±2.5 points and any
score effect near ±2.8 points, so a true effect of the size that would change army composition
is not visible. The one real signal is positive for archers, not negative: ranks with an archer
are more decisive than ranks without (0.82–0.83 versus 0.73–0.77), and the re-priced archer does
not make the second copy harmful. The honest limit of this test is that it changed archer
*availability* (0.93 versus 0.50 per army), not a fixed two-versus-one count; a same-opening,
fixed-count test would need explicit `backRanks` pairs with one `A` swapped out, which is a
different design.

Data: `sim/out/two.jsonl`, `sim/out/one.jsonl`, `sim/out/two.summary.json`,
`sim/out/one.summary.json`. Specs: `sim/specs/pool-arch-2026-09-17/two.json`,
`sim/specs/pool-arch-2026-09-17/one.json`.
