# Capital C4, pawn-only: a pawn in the capital captures straight ahead (2026-09-17)

`docs/MATRIX.md` §B.2 cell C4 ("captures differently while there") has its first built entry:
`pawnCapitalCapture`, a lab rule that lets a pawn standing in the capital d4 e4 d5 e5 capture the
square one rank ahead. This report states the rule's exact semantics, where it lives, the measured
result, the counter that shows the rule is used, and the one intentional inconsistency (check
detection).

## The rule

- **Name / default:** `pawnCapitalCapture: boolean`, `false` (`src/rules/rules.ts:174`; default at
  `src/rules/rules.ts:306`). `parseRule('pawnCapitalCapture=true')` works like every other boolean,
  and `ruleDiff` carries it in a run header.
- **Semantics:** when on, a pawn whose **own square** is one of the four capital squares
  (`CAPITAL = [27, 28, 35, 36]`, `src/rules/engine.ts:103`) may capture the square one rank
  forward — only when that square holds an enemy piece and `canCapture(p, typeOf(v))` allows it.
  The move is the ordinary displacement capture shape (`{from, to, captures: [to]}`), so its LAN is
  the ordinary `d4xd5` and every make/unmake path already handles it. Outside the capital nothing
  changes. Under Darkness (Shadow B) the pawn already captures straight ahead everywhere, so the
  rule adds nothing there (that branch returns before the new one).
- **Promotion:** the straight capture goes through the existing `push()` helper
  (`src/rules/engine.ts:240`), the same promotion-by-rank path the ordinary advance uses, so the two
  cannot drift. On these squares that path is unreachable in real play — a pawn in the capital is
  always 3 or 4 ranks from either last rank — but the shared path is a drift guard, not dead code:
  it is why the rule needs no promotion branch of its own.
- **Move-generation only:** `isAttacked` is deliberately untouched. A straight capture is a *move*,
  not a new attack, so a pawn keeps its ordinary two-diagonal attack pattern and a king standing
  straight in front of a capital pawn is **not in check** but **can be captured**. This is the same
  check-detection split as `capitalSanctuary` (C2), in the opposite direction.
- **Engine seam:** `case P` of `genPiece`, after the push/double-step block and before the two
  diagonals: `if (RULES.pawnCapitalCapture && mode !== 'attacks' && CAPITAL.includes(from))`
  (`src/rules/engine.ts:275`). The capture is generated for `all` and `captures` — so `pseudoMoves`,
  `legalMoves` **and** the search's quiescence generator (`src/ai/search.ts:291`) all see it — but
  never for `'attacks'`, which is what keeps `isAttacked` on the ordinary pawn pattern.
- **Test:** `pawnCapitalCapture=true (lab): a pawn in the capital takes straight ahead, move-only for check`
  (`src/rules/rules.test.ts:561`). Off: a white pawn on d4 facing a black knight on d5 has no move
  at all (`[]`). On: `d4xd5`, and `makeMove` leaves the pawn on d5 with d4 empty. Control: a pawn on
  c4 with black pawns on b5 and c5 keeps only the ordinary `c4xb5` with the rule on and off.
  `isAttacked(d5, WHITE)` stays `false`, and `crossCheckAttacks(135)` proves `isAttacked` still
  agrees with `genPiece('attacks')`. Promotion on the last rank is the ordinary push's: a pawn on a7
  still offers all eight targets. `npx tsc --noEmit` clean; `npx vitest run src/rules/rules.test.ts`
  120 passed.

## Measurement

`node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-pawn --experiment ab --games 1600 --sample 40
--depth 3 --seed 71 --workers 4 --rule "pawnCapitalCapture=true"`. Control arm `pb-ab-cap-pawn.base`
with `rules {}` (today's defaults); 1,600 games per population, depth 3, the same 40 arrangements
and the same opening seeds (common random numbers). The difference column is the mean of
(rule − base) over the 40 shared arrangements with a 95% normal interval. Raw table:
`sim/out/pb-ab-cap-pawn.experiment.md`.

### Depth 3 (1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.543 | −0.018 ± 0.034 | no |
| decisive | 0.792 | 0.816 | +0.024 ± 0.030 | no |
| draw rate | 0.198 | 0.179 | −0.019 ± 0.030 | no |
| capped | 0.010 | 0.006 | −0.004 ± 0.005 | no |
| mean plies | 110.3 | 112.3 | +2.0 ± 3.3 | no |
| branching factor | 32.7 | 32.6 | −0.1 ± 0.2 | no |
| killer move | 0.331 | 0.355 | +0.023 ± 0.014 | yes |
| drama | 0.145 | 0.160 | +0.015 ± 0.009 | yes |
| permanence | 0.959 | 0.958 | −0.001 ± 0.001 | yes |
| interest | 0.483 | 0.490 | +0.007 ± 0.004 | yes |
| excessDecisiveness (resid.) | 0.010 | −0.009 | −0.020 ± 0.005 | yes |

Rule context, pooled: pawn captures rise 3.84 → 4.25 per game, pawn survival falls 41.3% → 38.5%,
checks rise 3.89 → 4.32, promotions 0.24 → 0.28, dead-material endings 14 (0.9%) → 21 (1.3%), and
games where a king never moved 423 (26.4%) → 415 (25.9%). The branching factor does not move
(32.7 → 32.6): the extra capture belongs to a pawn that already stood in the capital, so no other
piece gains a move.

### The counter: the rule is used, not a dead toggle

Counted by **replaying** the variant arm's 1,600 games through `parseLan`/`makeMove` under the rule
(179,642 plies, 0 LAN mismatches), then reading each pawn capture's from/to squares — not by LAN
shape alone. A capital-straight capture is a pawn move (`^[a-h][1-8]x` LAN) whose from square is one
of d4 e4 d5 e5 and whose capture square is on the same file, one rank away.

- Variant arm: **792 capital-straight captures** = 0.50 per game, in **686 games (42.9%)**. They are
  11.6% of the arm's 6,806 pawn captures (4.25 per game).
- Base arm: 0 in 1,600 games (the rule is off), with 6,146 pawn captures (3.84 per game). The same
  replay finds none, which is the control.

The extra 660 pawn captures over the base arm (6,806 − 6,146) are of the same order as the 792
straight captures, which is the expected sign: some captures replace diagonal or quiet moves, so
the two counts need not match exactly.

## Verdict: null (the rule bites, the outcome does not move)

The rule is live: 0.50 capital-straight captures per game in 42.9% of games, pawn captures
+0.41 per game, checks +0.43 per game. The point estimates lean the same way as C2 — decisive up
(+0.024), draws down (−0.019) — but none of the three deciding metrics is outside its interval at
depth 3 (decisive +0.024 ± 0.030, draw rate −0.019 ± 0.030, white score −0.018 ± 0.034), so the
protocol runs **no depth-4 arm**. The confirmed moves are all on the interest axis: killer move
+0.023 ± 0.014, drama +0.015 ± 0.009, interest +0.007 ± 0.004 and the residualised excess
decisiveness −0.020 ± 0.005 — the games look less draw-driven to the analyser without a measurable
change in how they end. Dead-material endings rise 0.9% → 1.3% (14 → 21 games) and pawns survive
less (41.3% → 38.5%), so the centre bonus costs the pawn that uses it; that is a piece-value
effect, not an outcome effect at this sample.

The one inconsistency to remember: a king straight ahead of an enemy pawn in the capital is not in
check by `isAttacked` but is capturable by the generator. In these 3,200 games that produced no
stall or anomaly — games end by adjudication, stalemate, repetition, the 50-move rule, material or the ply cap
(capped 0.6% in the variant, 1.0% in the base) — so the reading above is usable as it stands. A
depth-4 confirmation is the way to settle the decisive/draw direction if the rule is ever
shortlisted; the protocol does not call for one here.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
