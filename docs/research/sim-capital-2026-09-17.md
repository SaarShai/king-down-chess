# Capital C3, guard-only: 2-square step while standing in the capital (2026-09-17)

`docs/MATRIX.md` §B.2 cell C3 ("moves differently while there") has its first built entry: a guard
that stands in the capital d4 e4 d5 e5 may step 2 squares. This report states the rule's exact
semantics, where it lives, and the measured result.

## The rule

- **Name / default:** `guardCapitalStep: boolean`, `false` (`src/rules/rules.ts:154`; default at
  `src/rules/rules.ts:284`). `parseRule('guardCapitalStep=true')` works like every other boolean, and
  `ruleDiff` carries it in a run header.
- **Semantics:** when on, a guard whose **own square** is one of the four capital squares
  (`CAPITAL = [27, 28, 35, 36]`, `src/rules/engine.ts:103`) gains the second square of each of the
  8 rays: 2 squares in any direction, the landing square empty, the intermediate square empty (the
  `guardStep: 2` walk, `src/rules/engine.ts:329`). Move-only: a guard takes nothing under the
  default `guardCaptures: 'none'`, and the bonus adds no capture, so `isAttacked` is unchanged —
  exactly like the ordinary guard step (`isAttacked`'s guard branch, `src/rules/engine.ts:597`,
  reads adjacent captures only). Outside the capital nothing changes.
- **Engine seam:** `case G` of `genPiece`, the shared second-square loop —
  `const fromCapital = RULES.guardCapitalStep && CAPITAL.includes(from)` (`src/rules/engine.ts:328`)
  joins `guardStep === 2 || fromHome` at `src/rules/engine.ts:329`. The existing landing filter
  (`guardNoSecondRank` / `guardNoCapital`, `src/rules/engine.ts:336`) applies to these moves like
  every other guard move.
- **Test:** `guardCapitalStep=true (lab): a guard standing in the capital gains the second square of each ray`
  (`src/rules/rules.test.ts:546`). A white guard on d4 has no `Gd4-b2` under the defaults; with the
  rule on it has 16 moves (8 neighbours + the far end of all 8 clear rays, `Gd4-b2` and `Gd4-f6`
  among them), every one a non-capture, and `isAttacked` on the far square stays false. A guard on
  d3 gets no second square even with the rule on. `npx tsc --noEmit` clean;
  `npx vitest run src/rules/rules.test.ts` 118 passed.

## Measurement

`node_modules/.bin/tsx src/sim/run.ts --id pb-ab-G-capstep --experiment ab --games 1600 --sample 40
--depth 3 --seed 71 --workers 4 --rule "guardCapitalStep=true"`. Both arms ran with today's
defaults (control arm `pb-ab-G-capstep.base`); 1,600 games per population, depth 3, the same 40
arrangements and the same opening seeds (common random numbers). The difference column is the mean
of (rule − base) over the 40 shared arrangements with a 95% normal interval. Raw table:
`sim/out/pb-ab-G-capstep.experiment.md`.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.562 | +0.001 ± 0.001 | no |
| decisive | 0.792 | 0.794 | +0.002 ± 0.004 | no |
| draw rate | 0.198 | 0.196 | -0.002 ± 0.003 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.002 | no |
| mean plies | 110.3 | 110.2 | -0.1 ± 0.2 | no |
| branching factor | 32.7 | 32.7 | -0.0 ± 0.0 | no |
| interest | 0.483 | 0.484 | +0.000 ± 0.001 | no |
| interest (min-use) | 0.483 | 0.479 | -0.000 ± 0.001 | no |

Guard context, pooled: guard moves 2.93 → 2.87 per game, guard survival 96.6% → 96.6%, guard
captures 0.000 → 0.000, dead-material endings 14 (0.9%) → 13 (0.8%).

## Verdict: null

Decisive +0.002 ± 0.004, draw rate −0.002 ± 0.003 and white score +0.001 ± 0.001 all sit inside
their intervals, so the rule changes no outcome. The guard's move count does not rise (2.93 → 2.87)
and its captures stay at 0.000: the guard rarely stands in the capital, so the bonus changes nothing
measurable. The C1 sibling measured null too — `guardNoCapital` moved decisive by +0.3 ± 0.3
(`docs/research/sim-guard-2026-09-17.md`) — for the same reason. No depth-4 arm: the protocol runs
one only when a deciding metric moves outside its interval.
