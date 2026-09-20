# Promotion set variants under current rules (2026-09-17)

`promotionSet` decides what a pawn becomes on the last rank. The shipped default is
`anyNonKingNoGuard` (`src/rules/rules.ts:323`): Q R B N A L M S, never a guard. The other sets
(`src/rules/engine.ts:35-41`) are `standard` (Q R B N), `anyNonKing` (adds the guard: Q R B N A L
G M S), and `anyNonKingNoFairy` (the same four pieces as `standard`). This note measures the two
meaningful alternatives under today's rules: `standard` and `anyNonKing`. Each experiment ran its
own fresh control on today's defaults, so the comparison is against the game as shipped now.

## Method

- **Runs.** Sequential from the repo root, 4 workers on a shared machine, 1,600 games per arm,
  depth 3, seed 71, 40 sampled back ranks with the same opening seeds in both arms (common random
  numbers):

  ```
  node_modules/.bin/tsx src/sim/run.ts --id pb-ab-P-std   --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "promotionSet=standard"
  node_modules/.bin/tsx src/sim/run.ts --id pb-ab-P-guard --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "promotionSet=anyNonKing"
  ```

  Each run logged its rules: the control arms logged `rules {}` (today's defaults, therefore
  `promotionSet=anyNonKingNoGuard`) and the variant arms logged `rules {"promotionSet":"standard"}`
  and `rules {"promotionSet":"anyNonKing"}`. Wall times: `pb-ab-P-std` base 702.5 s, var 711.5 s;
  `pb-ab-P-guard` base 543.1 s, var 516.7 s. Each arm holds 1,600 complete lines.
- **Fresh control.** The two control arms reproduce each other exactly: 731 White wins, 333 draws,
  536 Black wins, 1,267 decisive games, 110.3 mean plies in both files. The same 40 arrangements
  and the same per-game seeds were used in both experiments.
- **Depth-4 gate.** The task gate is |paired difference| > its 95% interval on decisive, draw rate
  or white score. No variant passed it (tables below), so **no depth-4 arm was run**. The two
  depth-3 verdicts are therefore "null at this resolution", not "proven identical".
- **Promotion rates.** A throwaway script under `/tmp` streamed the four JSONL files and counted
  the `=X` suffix in every move's `lan` field (1,600 games per file). The experiment.md "promotions"
  event (a per-game mean, rounded to 2 decimals) agrees with the count.
- **Draw rate** excludes the 16 ply-cap games (1.0%), as the analyser counts a capped game as its
  own class; decisive + draw rate + capped sum to 1.

## Variant `standard` (Q R B N)

| metric | control `anyNonKingNoGuard` | `standard` | mean paired difference ±95% | consequential |
|---|---|---|---|---|
| white score | 0.5609 (897.5 / 1600) | 0.5619 (899 / 1600) | +0.001 ± 0.002 | no |
| decisive | 0.7919 (1,267) | 0.7913 (1,266) | −0.001 ± 0.001 | no |
| draw rate | 0.1981 (317) | 0.1988 (318) | +0.001 ± 0.001 | no |
| capped | 0.0100 (16) | 0.0100 (16) | +0.000 ± 0.000 | no |
| mean plies | 110.3 | 110.4 | +0.1 ± 0.2 | no |
| interest | 0.483 | 0.483 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.483 | 0.483 | +0.000 ± 0.001 | no |

The whole paired difference is one decisive game: 1,267 against 1,266. White score moves
+0.001 ± 0.002 and draw rate +0.001 ± 0.001; neither interval excludes zero. Interest is unchanged
at 0.483 and its interval is ±0.000. Deeper rows that the table flags (`branching factor`,
`excessDecisiveness (resid.)`) are ±0.0 and +0.001, outside the three consequential metrics.

**Promotion rate.** Control: **378 promotions in 1,600 games = 0.236 per game**, with at least one
promotion in 326 games (20.4%). Targets: Q 372, N 3, A 1, L 1, S 1. `standard`: **376 in 1,600 =
0.235 per game**, at least one in 324 games (20.3%). Targets: Q 373, N 3 — zero A, L, S, G. The
control's three fairy-target promotions (one each A, L, S) do not appear under `standard`; the
queen count rises by one and the total falls by two, because a changed promotion choice changes
the later line. Roughly one game in five contains a promotion either way; this rule moves the
target, not the rate.

## Variant `anyNonKing` (adds the guard)

| metric | control `anyNonKingNoGuard` | `anyNonKing` | mean paired difference ±95% | consequential |
|---|---|---|---|---|
| white score | 0.5609 (897.5 / 1600) | 0.5609 (897.5 / 1600) | +0.000 ± 0.002 | no |
| decisive | 0.7919 (1,267) | 0.7931 (1,269) | +0.001 ± 0.002 | no |
| draw rate | 0.1981 (317) | 0.1969 (315) | −0.001 ± 0.002 | no |
| capped | 0.0100 (16) | 0.0100 (16) | +0.000 ± 0.000 | no |
| mean plies | 110.3 | 110.5 | +0.2 ± 0.2 | no* |
| interest | 0.483 | 0.484 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.483 | 0.484 | +0.000 ± 0.000 | no |

\* Mean plies is the one row the experiment.md flags (+0.2 ± 0.2), but it is not one of the three
consequential metrics, and two-tenths of a ply is at the resolution limit. Everything else is two
decisive games (1,269 against 1,267), two draws fewer (315 against 317), and a white score that does
not move at 0.5609. Interest rises 0.483 → 0.484 with an interval of ±0.000.

**Promotion rate.** Control: **378 in 1,600 = 0.236 per game** (20.4% of games, same as above).
`anyNonKing`: **387 in 1,600 = 0.242 per game**, at least one in 330 games (20.6%). Targets: Q 373,
**G 8** (2.1% of the 387 promotions), N 3, A 1, L 1, S 1. A guard promotion appeared in 8 of 1,600
games — too rare to move the pooled metrics, and the per-piece table shows the guard's survival
rising only from 96.6% to 97.3%. The guard is a legal promotion target here, and the search almost
never wants it.

## Verdict

- **`standard` — null.** Decisive −0.001 ± 0.001, draws +0.001 ± 0.001, white score +0.001 ± 0.002:
  every consequential interval contains zero, and the raw gap is one game in 1,600. The only
  measured cost is that the pawn loses the A, L and S targets — used three times in the control
  and never chosen under `standard` because they are illegal. No balance gain pays for that loss.
- **`anyNonKing` — null.** Decisive +0.001 ± 0.002, draws −0.001 ± 0.002, white score +0.000 ± 0.002.
  The guard target is offered but chosen in 8 of 387 promotions (2.1%); mean plies +0.2 ± 0.2 is the
  only flagged row and is not one of the three consequential metrics. The shipped exclusion of the
  guard costs nothing measurable.
- **Keep the shipped `anyNonKingNoGuard`.** At 1,600 games per arm, the design resolves rate
  differences near ±0.1–0.2 points and score differences near ±0.2 points; both variants sit below
  that. Neither a depth-4 run nor a rules change is justified by these numbers.

Data: `sim/out/pb-ab-P-std.base.jsonl`, `sim/out/pb-ab-P-std.var.jsonl`,
`sim/out/pb-ab-P-guard.base.jsonl`, `sim/out/pb-ab-P-guard.var.jsonl`, and their summary and
experiment files.
