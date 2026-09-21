# Capital C5: a piece standing in the capital cannot capture (2026-09-17)

`docs/MATRIX.md` §B.2 cell C5 ("cannot be captured *by* a piece standing there") has its first built
entry: `capitalNoCapture`, a lab rule that disarms a piece standing on one of the four centre tiles
d4 e4 d5 e5. This report states the rule's exact semantics, where it lives, the measured result,
the replay counter that shows the rule bites, and the one intentional inconsistency (check
detection).

## The rule

- **Name / default:** `capitalNoCapture: boolean`, `false` (`src/rules/rules.ts:167`; default at
  `src/rules/rules.ts:316`). `parseRule('capitalNoCapture=true')` works like every other boolean,
  and `ruleDiff` carries it in a run header.
- **Semantics:** when on, every generated move whose **`from` square** is in the capital
  (`CAPITAL = [27, 28, 35, 36]`, `src/rules/engine.ts:103`) and whose `captures` array is non-empty
  is dropped — for both colours and every piece. The same piece's quiet moves are untouched, and a
  move onto an *empty* capital square is untouched. The test is `captures.length > 0`, not `to`, so
  it catches displacement captures, archer shots, catapult `stay` lobs, Death Touch shots, paladin
  charges and beast chains alike; a beast chain that continues out of the capital is dropped as a
  whole, because its `from` is the capital square.
- **Engine seam:** the same `genPiece` wrapper that holds the C2 filter. `genPiece` is split into
  the unfiltered `genPieceRaw` (`src/rules/engine.ts:234`) and the wrapper
  (`src/rules/engine.ts:557`); after the raw switch fills `out`, the wrapper drops the C5 moves at
  `src/rules/engine.ts:570-572` (`if (RULES.capitalNoCapture && CAPITAL.includes(from))`, splice
  every move with a non-empty `captures`). This is the one choke point: `pseudoMoves`, `legalMoves`
  **and** the search's own `genLegal` all reach the board through `genPiece`
  (`src/ai/search.ts:169`), so the search plays the same rule the engine states. There is no
  search-vs-engine gap.
- **Composition with C2:** the wrapper runs both filters in sequence — C2 looks at victims
  (`captures` naming a capital square), C5 at the mover (`from` in the capital) — and each drops
  only the moves it names. With both on, a capital square both protects its occupant and disarms
  it. The `'attacks'` mode is skipped before either filter (`src/rules/engine.ts:560`), so the
  documented mirror (`isAttacked` returns exactly what `genPiece('attacks')` generates) stays true.
- **Check and mate:** `isAttacked` is deliberately unchanged. A capital piece therefore still
  counts as attacking every square it would capture on, and it can still **give check and mate**
  even though it can never *take* the king — the mirror inconsistency of C2 and C4. Detection
  over-reports the threat instead of missing it (a king may be forced to answer a "check" that
  cannot be executed), and that is the conservative direction; the measurement below is the check
  on whether it matters in play. The only capture generator outside the filter is the Strike branch
  in `pseudoMoves` / `search.genLegal` (Flame A king power, inactive under the default
  `kings: [null, null]`); in a Flame game a capital piece with a live Strike could still capture.
  The measurement plays no king power.
- **Test:** `capitalNoCapture=true (lab): a piece in the capital generates no captures but keeps
  its quiet moves` (`src/rules/rules.test.ts:602`). White rook d4 (a capital square), black pawn
  d5: off, `Rd4xd5` exists; on, it is gone while `Rd4-d3`, `Rd4-h4` and the other 8 quiet moves
  remain (10 total). A rook on a4 still takes a5 (mover outside the capital). The composite block
  separates the rules: `Rd4xd6` is C5 (mover in the capital, victim outside), `Rh4xe4` is C2
  (victim in it, mover outside); `capitalSanctuary` alone keeps `Rd4xd6` and drops `Rh4xe4`,
  `capitalNoCapture` alone does the reverse, both drop both. `crossCheckAttacks(136)` and
  `(137)` prove `isAttacked` still agrees with `genPiece('attacks')`.
  `npx tsc --noEmit` clean; `npx vitest run src/rules/rules.test.ts` 121 passed.

## Measurement

`node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-nocap --experiment ab --games 1600 --sample 40
--depth 3 --seed 71 --workers 4 --rule "capitalNoCapture=true"`. Control arm
`pb-ab-cap-nocap.base` with `rules {}` (today's defaults); 1,600 games per population, depth 3, the
same 40 arrangements and the same opening seeds (common random numbers). The difference column is
the mean of (rule − base) over the 40 shared arrangements with a 95% normal interval. Raw table:
`sim/out/pb-ab-cap-nocap.experiment.md`.

### Depth 3 (1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.543 | −0.018 ± 0.031 | no |
| decisive | 0.792 | 0.790 | −0.002 ± 0.030 | no |
| draw rate | 0.198 | 0.201 | +0.002 ± 0.028 | no |
| capped | 0.010 | 0.009 | −0.001 ± 0.006 | no |
| mean plies | 110.3 | 113.7 | +3.4 ± 4.4 | no |
| branching factor | 32.7 | 33.3 | +0.6 ± 0.3 | yes |
| killer move | 0.331 | 0.376 | +0.044 ± 0.020 | yes |
| lead change | 0.059 | 0.066 | +0.007 ± 0.005 | yes |
| uncertainty late | 0.631 | 0.633 | +0.001 ± 0.004 | no |
| drama | 0.145 | 0.164 | +0.020 ± 0.012 | yes |
| permanence | 0.959 | 0.954 | −0.005 ± 0.003 | yes |
| min utilisation | 0.43 | 0.40 | −0.02 ± 0.01 | yes |
| interest | 0.483 | 0.493 | +0.010 ± 0.006 | yes |
| interest (min-use) | 0.483 | 0.481 | +0.011 ± 0.010 | yes |
| killerMove (resid.) | −0.023 | 0.023 | +0.045 ± 0.018 | yes |
| leadChange (resid.) | −0.004 | 0.004 | +0.007 ± 0.005 | yes |
| drama (resid.) | −0.010 | 0.010 | +0.020 ± 0.010 | yes |
| permanence (resid.) | 0.002 | −0.002 | −0.005 ± 0.002 | yes |
| interest (resid.) | −0.005 | 0.005 | +0.010 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.006 | 0.004 | +0.011 ± 0.009 | yes |
| excessDecisiveness (resid.) | −0.001 | 0.001 | +0.003 ± 0.006 | no |

None of the three deciding metrics is outside its interval (white score −0.018 ± 0.031, decisive
−0.002 ± 0.030, draw rate +0.002 ± 0.028), so the protocol runs **no depth-4 arm**.

Rule context, pooled: pawn captures fall 3.84 → 3.13 and pawn survival rises 41.3% → 43.4%; knight
captures 1.44 → 1.32 with survival 13.2% → 19.2%; rook 1.67 → 1.58, survival 37.3% → 41.8%; maester
survival 35.0% → 44.1% and swaps 6.38 → 6.87; queen survival 70.6% → 76.3%; paladin survival 7.1%
→ 10.8%. Beast captures rise 1.43 → 1.74 while beast survival is flat (43.0% → 44.0%) and archer
captures barely move (3.38 → 3.33): the beast that stands in the capital loses its chain, elsewhere
it is unchanged. Checks stay 3.89 → 3.90 and promotions 0.24 → 0.24. Kings that never moved rise
423 (26.4%) → 473 (29.6%); dead-material endings rise 14 (0.9%) → 18 (1.1%); capped falls 1.0% →
0.9%.

### The counter: the rule is used, not a dead toggle

Counted by **replaying** both arms' 1,600 games through `parseLan`/`makeMove` (variant: 181,908
plies; base: 176,433 plies; **0 LAN mismatches** in either), and at every position asking the
generator, with `capitalNoCapture` turned back **off**, which moves from a capital square would
have carried a capture. The other rules stay as recorded.

- Variant arm: **272,355 would-be captures from a capital square** = 170.2 per game, 149.7 per 100
  plies, over **43,750 plies (24.1%; 27.3 per game)** and **1,580 of 1,600 games (98.8%)**. The
  move count is dominated by beast-chain enumerations — 215,846 (79.2%) are beast moves, and the
  largest single ply offers 2,781 of them. Counting each capital **piece** once per ply instead:
  **48,000 piece-plies = 30.0 per game**. By piece: beast 215,846, pawn 27,183, knight 13,444,
  maester 6,634, bishop 3,492, archer 2,633, paladin 1,344, queen 823, rook 645, king 311. Played
  captures from a capital square in the variant arm: **0** — the rule held across every ply.
- Base arm (control): **4,527 captures from a capital square were actually played** = 2.83 per
  game, and 28,903 would-be candidates = 18.1 per game over 19,578 plies (11.1%; 12.2 per game),
  in 1,573 games (98.3%); 20,304 piece-plies = 12.7 per game. Largest single ply: 66.

So the rule bites at least once in 98.8% of games and removes 2.8 playable captures per game
compared with the base rate, while a capital piece with a capture available is present more than
twice as often as in control play (30.0 vs 12.7 piece-plies per game) — the rule keeps such
positions on the board instead of resolving them.

## Verdict: null (the rule bites, the outcome does not move)

The rule is live: 0 played capital captures against 4,527 in the base arm, 30.0 capital-piece
suppression plies per game, branching factor +0.6 ± 0.3, killer move +0.044 ± 0.020, drama +0.020
± 0.012, interest +0.010 ± 0.006, min utilisation −0.02 ± 0.01. The outcome is flat: decisive
−0.002 ± 0.030, draw rate +0.002 ± 0.028, white score −0.018 ± 0.031 — all three deciding metrics
inside their intervals, a narrower miss than C2's depth-3 run, so by the protocol no depth-4 arm
runs and the verdict is **null**, not adopt and not reject. The confirmed moves are on the interest
axis and on game texture: capital pieces survive more (maester 35.0% → 44.1%, knight 13.2% →
19.2%, rook 37.3% → 41.8%, queen 70.6% → 76.3%), pawn captures fall 3.84 → 3.13, more kings never
move (26.4% → 29.6%) and mean plies rise +3.4 ± 4.4. Dead-material endings move 0.9% → 1.1%
(14 → 18 games), far below the capped rate, so the rule is not a draw engine.

The one inconsistency to remember: a capital piece still checks and mates by `isAttacked` even
though it can never capture the king. Checks per game are unchanged (3.89 → 3.90) and across these
3,200 games no stall or anomaly appeared — games still end by adjudication, mate, stalemate,
repetition, the 50-move rule, material or the ply cap (capped 0.9% variant, 1.0% base) — so the
reading above is usable as it stands.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
