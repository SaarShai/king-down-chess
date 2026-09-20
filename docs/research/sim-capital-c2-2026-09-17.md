# Capital C2: a piece standing in the capital cannot be captured (2026-09-17)

`docs/MATRIX.md` §B.2 cell C2 ("cannot be taken while there") has its first built entry:
`capitalSanctuary`, a lab rule that makes the four centre tiles d4 e4 d5 e5 a sanctuary. This
report states the rule's exact semantics, where it lives, the measured result, and the one
intentional inconsistency (check detection).

## The rule

- **Name / default:** `capitalSanctuary: boolean`, `false` (`src/rules/rules.ts:156`; default at
  `src/rules/rules.ts:293`). `parseRule('capitalSanctuary=true')` works like every other boolean,
  and `ruleDiff` carries it in a run header.
- **Semantics:** when on, no capture is generated whose **victim** stands on a capital square
  (`CAPITAL = [27, 28, 35, 36]`, `src/rules/engine.ts:103`) — for either colour and every piece.
  A move onto an *empty* capital square is untouched, and so is a piece that stands in the capital
  and captures out of it (the mirror reading, C5, is not this rule). The four tiles are a
  sanctuary, not a wall: pieces may enter, leave and pass through.
- **Engine seam:** `genPiece` is split into the unfiltered `genPieceRaw` (`src/rules/engine.ts:234`)
  and a thin wrapper (`src/rules/engine.ts:536`). After the raw switch fills `out`, the wrapper
  drops every move whose `m.captures` names a capital square when the rule is on
  (`src/rules/engine.ts:539`). This is the one choke point: `pseudoMoves`, `legalMoves` **and** the
  search's own `genLegal` all reach the board through `genPiece` (`src/ai/search.ts:169`), so the
  search plays the same rule the engine states. There is no search-vs-engine gap and no under-use
  limitation. The test reads `m.captures` and not `m.to` because an archer shot, a catapult `stay`
  lob and a Death Touch capture keep `to === from`; a beast chain lists every victim, so a chain
  that would swallow a capital piece loses that extension while the shorter chain that stops before
  it stays.
- **One intentional inconsistency:** `isAttacked` is unchanged. Check and mate detection therefore
  stay standard chess: a king standing in the capital can be checked and can be mated, it can just
  never be *captured*, because no generator offers the move. The `'attacks'` generation mode is
  deliberately left unfiltered so the documented mirror (`isAttacked` returns exactly what
  `genPiece('attacks')` generates) stays true; the new test's `crossCheckAttacks(134)` proves it.
  The only capture generator outside the filter is the Strike branch in `pseudoMoves` /
  `search.genLegal` (Flame A king power, inactive under the default `kings: [null, null]`); a
  strike capture of a capital piece would still be offered in a Flame game. This is a lab rule, and
  the measurement below plays no king power.
- **Test:** `capitalSanctuary=true (lab): a capture whose victim stands in the capital is not
  generated` (`src/rules/rules.test.ts:561`). Off: `Ra4xd4` (rook takes on a capital square),
  `Rf3xf2` (not one) and `Ac3*d4` (archer shot) are all generated. On: both d4 captures are gone,
  `Rf3xf2` stays, `Rd1-d4` (a move onto an empty capital square) stays, and
  `crossCheckAttacks(134)` passes. `npx tsc --noEmit` clean; `npx vitest run` 196 passed (119 in
  `src/rules/rules.test.ts`).

## Measurement

- **Depth 3:** `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-sanct --experiment ab --games
  1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "capitalSanctuary=true"`. Control arm
  `pb-ab-cap-sanct.base` with `rules {}` (today's defaults); 1,600 games per population, the same
  40 arrangements and opening seeds (common random numbers).
- **Depth 4 confirmation:** `--id pb-ab-cap-sanct-d4 --games 400 --depth 4 --seed 72 --workers 4`
  with the same `--experiment ab --sample 40 --rule "capitalSanctuary=true"`. The depth-3 run was
  consequential on the deciding metrics (draw rate and white score outside their intervals), which
  is what triggers this arm.
- The difference column is the mean of (rule − base) over the 40 shared arrangements with a 95%
  normal interval. Raw tables: `sim/out/pb-ab-cap-sanct.experiment.md`,
  `sim/out/pb-ab-cap-sanct-d4.experiment.md`.

### Depth 3 (1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.527 | −0.034 ± 0.030 | yes |
| decisive | 0.792 | 0.823 | +0.031 ± 0.033 | no |
| draw rate | 0.198 | 0.160 | −0.038 ± 0.031 | yes |
| capped | 0.010 | 0.018 | +0.008 ± 0.009 | no |
| mean plies | 110.3 | 105.7 | −4.6 ± 4.6 | yes |
| branching factor | 32.7 | 34.3 | +1.6 ± 0.5 | yes |
| killer move | 0.331 | 0.369 | +0.038 ± 0.019 | yes |
| lead change | 0.059 | 0.072 | +0.014 ± 0.005 | yes |
| drama | 0.145 | 0.159 | +0.014 ± 0.012 | yes |
| permanence | 0.959 | 0.950 | −0.008 ± 0.003 | yes |
| excessDecisiveness (resid.) | 0.019 | −0.017 | −0.038 ± 0.009 | yes |

Rule context, pooled: captures fall and survival rises for every piece — pawn captures 3.84 → 2.88
and survival 41.3% → 50.5%; maester 1.37 → 0.93 and 35.0% → 53.0%; archer 3.38 → 2.51 and
51.6% → 65.5%; knight 13.2% → 27.3%; paladin 7.1% → 16.0%. Maester swaps rise 6.38 → 8.35, which is
the substitute for the lost captures. Kings that never moved rise 423 (26.4%) → 575 (35.9%).
Dead-material endings stay 14 (0.9%) in both arms.

### Depth 4 (400 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.545 | +0.005 ± 0.058 | no |
| decisive | 0.760 | 0.805 | +0.045 ± 0.067 | no |
| draw rate | 0.212 | 0.155 | −0.058 ± 0.064 | no |
| capped | 0.028 | 0.040 | +0.013 ± 0.024 | no |
| mean plies | 117.2 | 107.4 | −9.8 ± 8.7 | yes |
| branching factor | 30.6 | 32.4 | +1.8 ± 0.7 | yes |
| excessDecisiveness (resid.) | 0.066 | −0.021 | −0.050 ± 0.029 | yes |

Rule context, pooled: dead-material endings fall 18 (4.5%) → 6 (1.5%); kings that never moved rise
106 (26.5%) → 150 (37.5%); pawn captures 3.67 → 2.94, rook 1.60 → 1.09, archer 4.43 → 3.75;
maester survival 35.1% → 51.3%, knight 12.6% → 27.4%.

## Verdict: null (no confirmed outcome change; not a draw engine)

The rule bites: branching factor +1.8 ± 0.7 and mean plies −9.8 ± 8.7 at depth 4 (both confirmed),
captures down and survival up for every piece, maester swaps up, kings moving less. The matrix's
fear — "an uncapturable centre piece is a second guard, expect longer games" — does not come true.
Games get *shorter* and draws *fall*: draw rate 0.198 → 0.160 at depth 3 and 0.212 → 0.155 at depth
4, with dead-material endings falling at depth 4 (4.5% → 1.5%). Capped rises only slightly (1.0% →
1.8%, then 2.8% → 4.0%) and stays inside its interval at both depths. This is not a draw engine.

The depth-3 run was consequential on draw rate (−0.038 ± 0.031) and white score (−0.034 ± 0.030),
so the protocol ran the depth-4 confirmation. There, none of the three deciding metrics is outside
its interval (decisive +0.045 ± 0.067, draw rate −0.058 ± 0.064, white score +0.005 ± 0.058). The
point estimates keep the depth-3 direction — decisive up, draws down — but the 400-game depth-4
sample cannot confirm it, and the depth-3 white-score move (toward fairness) did not reproduce
(+0.005). By the lab's threshold the outcome effect is unconfirmed, so the verdict is **null**, not
adopt and not reject. A larger depth-4 sample (1,600 games) would be the way to settle the draw-down
signal; the protocol does not call for it here.

The one inconsistency to remember: a king in the capital is checked and mated by the ordinary rules
but can never be captured. In these 4,000 games that produced no stall or anomaly — games still end
by adjudication, mate, repetition or the ply cap — so the reading above is usable as it stands.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
