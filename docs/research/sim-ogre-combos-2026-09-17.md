# Ogre combinations: push+friends, re-priced push, and hop at depth 4 (2026-09-17)

Three runs close the Ogre's measured route: the **combination** of the two confirmed readings
(`ogreMode=push` + `ogreShoveFriends=friends`), the **re-pricing** of push at its measured value
(`--values O=318`), and **hop** at depth 4 (the movement reading the depth-3 pass recommended to
pursue). All three play `sim/specs/newpieces/ab-O-push.json` (40 mirrored back ranks, one `O` per
army), 1,600 games per population, seed 41, 4 random opening plies, ply cap 300, 4 workers,
sequentially. Rule keys: defaults `ee0a45ad`, push `f221cdd2`, push+friends `ab36e423`, hop
`93f1ea77`; every arm carries source `4be3ddab3232`, the committed tree.

## 0. Short version

- **Push+friends ≈ push alone.** At depth 4 the combination reads decisive **+8.2 ± 3.2**, draws
  **−7.6 ± 3.1**, white **+3.4 ± 3.1** against push alone's +9.4 ± 3.4, −8.9 ± 3.4 and +4.3 ± 2.9
  (`pb-ab-O-push-d4b`); the three differences are −1.2 ± 4.7, +1.3 ± 4.6 and −0.9 ± 4.2, none
  resolved. The friends filter removes 0.03 enemy shoves per game and changes nothing else
  (captures 1.43/game in both).
- **Re-pricing push at O=318 fixes its fairness.** `pb-ab-O-push-d4-v318` (both arms at
  `--values O=318`) reads decisive **+7.1 ± 2.5**, draws **−7.1 ± 2.4**, white **+0.4 ± 2.4**;
  the White shift at the shipped O=300 (+4.3 ± 2.9) is gone and the sharpening holds. This repeats
  the old-rules result (white +4.9 ± 3.1 at O=300 → +0.5 ± 2.8 at O=195) on today's game.
- **Hop does not survive depth 4.** Decisive **+1.6 ± 3.6**, draws **−0.8 ± 3.4**, white
  **+1.7 ± 2.4**: the depth-3 point estimate (+1.3 ± 3.0) did not grow, every gate interval covers
  zero, and the draw-adjusted residual is −0.007 ± 0.012. The rule bites (1.81 hops/game in 79.5%
  of games, branching +0.8 ± 0.6, Ogre captures 0.97 → 1.28, survival 65.3% → 52.1%) without
  moving the game shape.
- **Shipping candidate: push at OGRE_V 318** — the only reading confirmed at depth 4 under two
  prices with fairness at the measured price (3.18 ± 0.44 pawns, next Muller seed 318). The
  friends-only reading is the fair alternative at the shipped 300 (decisive +6.2 ± 2.1, white
  −0.1 ± 1.3) but is a smaller effect with an unmeasured value; adding friends on top of push is
  not supported by any measured gain.
- **One arm lost one game to a search explosion.** `pb-ab-O-push-d4-v318.base` holds 1,599 of
  1,600 games: game 884 (`GSRBNQKO`, seed 41174341) hits a state-dependent depth-4 search blow-up
  (§2). All other arms are complete.

## 1. Method

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --id pb-ab-O-pushfr     --rule "ogreMode=push" --rule "ogreShoveFriends=friends" --depth 3 --workers 4 \
  --baseId pb-ab-O-shovefr.base
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --id pb-ab-O-pushfr-d4  --rule "ogreMode=push" --rule "ogreShoveFriends=friends" --depth 4 --workers 4 \
  --baseId pb-ab-O-push-d4b.base
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --id pb-ab-O-push-d4-v318 --rule "ogreMode=push" --depth 4 --values O=318 --baseValues O=318 --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --id pb-ab-O-hop-d4     --rule "ogreHop=true" --depth 4 --workers 4 --baseId pb-ab-O-push-d4b.base
```

**Controls are shared, not replayed.** `runAb` writes the base arm under its own id and skips stored
games whose stamp matches, so the depth-3 control is the existing `pb-ab-O-shovefr.base` (defaults,
depth 3, seed 41, the same 40 ranks; specKey `5db7866de7dc`) and every depth-4 run here uses
`pb-ab-O-push-d4b.base` (defaults, depth 4, seed 41, the same ranks; specKey `e0c43bc64632`) as its
control. Today's source hashes to `4be3ddab3232` and those files carry it, so the resumes are
identity-checked, not assumed.

**Re-pricing both arms needs `--baseValues`.** In an `ab` run the control plays `baseRules` /
`baseValues` and the variant adds `rules` / `values` (`src/sim/experiments.ts:298-300`), so
`--values O=318` alone would price only the variant. Passing `--baseValues O=318` too — the same form
the old-rules re-price used (`ab-O-push-d4-reprice`, header "both arms at `--values O=195`") — prices
both arms at 318, which is what "does the White edge shrink when the Ogre is priced correctly?"
requires. The header of §3's page prints `both arms at --values O=318`.

**The comparison target named for §3 is void.** `pb-ab-O-push2-d4` (O=300, seed 72) is the run whose
control played **0 ogre shoves and 0 ogre captures in 1,600 games** — its `backRanks` came from the
default pool, so no Ogre was on the board (`sim-ogre-taking-2026-09-17.md` §2, §7). The valid
O=300 depth-4 push A/B is `pb-ab-O-push-d4b` (decisive +0.094 ± 0.034, draws −0.089 ± 0.034, white
+0.043 ± 0.029), and that is the run §3 compares against.

**The one incomplete arm.** Game 884 of the O=318 **base** arm (`GSRBNQKO`, seed 41174341) did not
finish: its depth-4 search after 103 plies, in `g7/6k1/2q3pp/3o4/1p1p1P2/pQ1O2PP/6K1/2G5 w`,
sustained ~0.1M nodes/s for 25+ minutes with no end in sight. The identical position under a fresh
search state completes in **0.3 s / 25,447 nodes** (`/tmp/ogre-combos/pos104.mts`), and the same job
under O=300 completed in 191 plies (`draw50`), so the blow-up is **state-dependent** (the game's
accumulated transposition table and history heuristic send this search into a pathologically large
tree, plausibly the quiescence in-check branch, which has no `qdepth` cutoff and no repetition
detection). With `src/` untouchable, the base arm stands at 1,599 games. The paired analysis still
pairs 40 arrangements (39 base games in one); the largest possible shift in a single arrangement's
mean is 1/39 ≈ 0.026, so the mean paired difference is perturbed by ≤ 0.07 points, an order of
magnitude below every interval quoted below. Run 2's page was regenerated from the stored JSONL with
`--noReplay`; per-arm reports `pb-ab-O-push-d4-v318.{base,var}.report.md` were rebuilt the same way.
The variant arm was then finished by a scratch launcher on the identical spec
(`/tmp/ogre-combos/run-variant.mts`, `run()` with 4 workers; the ab runner's `baseValues` field only
prices the control, and the launcher omits it, so the variant records carry specKey `3f9e9fd993c9`
where the ab form would stamp `38245a6cb2f6` — rules, values, seed, arrangements, depth and common
seeds, the fields that decide a game, are the same; the base records carry `dd2974a15b8f` from the ab
runner).

Counters were counted from the stored LAN with `/tmp/ogre-combos/count.mjs`:
`/^O[a-h][1-8]>[a-h][1-8]-[a-h][1-8]$/` = shove, `/^O[a-h][1-8]x[a-h][1-8]$/` = capture. For the hop
arm, any plain two-square Ogre move is a hop: the arm has `ogreStep2` off, so the only generator that
produces a two-square move is the hop (it crosses the occupied middle square by definition). In the
other arms no two-square Ogre move exists (0 in every control and every non-hop arm). The LAN shove
count equals the records' own `events.ogreShoves` **exactly in every file**, and the hop count equals
the movement route's (`2671` at depth 3) within rounding.

## 2. Run 1 — push + friends (`pb-ab-O-pushfr`)

### 2.1 Depth 3 (gate: draws fires)

| metric | base (defaults) | push+friends | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.538 | +0.006 ± 0.033 | no |
| decisive | 0.795 | 0.824 | +0.029 ± 0.030 | no |
| draw rate | 0.198 | 0.169 | **−0.029 ± 0.029** | yes |
| mean plies | 105.0 | 103.8 | −1.3 ± 3.1 | no |
| branching factor | 32.2 | 32.6 | +0.4 ± 0.3 | yes |
| interest | 0.492 | 0.497 | +0.006 ± 0.006 | yes |
| interest (min-use) | 0.449 | 0.493 | +0.015 ± 0.014 | yes |
| excessDecisiveness (resid.) | 0.039 | −0.002 | −0.027 ± 0.009 | yes |

The draw interval fires by the table's rule (|−0.029| > half-width), so the pre-set depth-4 arm was
played (1,600 games, 871.6 s for the variant; control shared). The decisive point estimate (+2.9
points) sits one tenth of a point inside its interval (3.0), so on this pass the combination is
**unresolved at depth 3** and the depth-4 arm is what decides it.

### 2.2 Depth 4 (the combination is push, not more)

| metric | base (repel) | push+friends | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.543 | **+0.034 ± 0.031** | yes |
| decisive | 0.676 | 0.758 | **+0.082 ± 0.032** | yes |
| draw rate | 0.306 | 0.230 | **−0.076 ± 0.031** | yes |
| mean plies | 111.9 | 112.3 | +0.4 ± 3.3 | no |
| branching factor | 30.9 | 30.6 | −0.3 ± 0.7 | no |
| interest | 0.463 | 0.467 | +0.004 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.456 | +0.004 ± 0.010 | no |
| excessDecisiveness (resid.) | 0.050 | −0.024 | −0.062 ± 0.012 | yes |

**Against push alone at the same depth and price** (`pb-ab-O-push-d4b`: decisive +0.094 ± 0.034,
draws −0.089 ± 0.034, white +0.043 ± 0.029, plies +0.6 ± 3.2, interest (min-use) +0.005 ± 0.008,
residual −0.070 ± 0.012) the combination is a point estimate or so weaker on every gate metric, with
errors in quadrature: decisive −1.2 ± 4.7, draws +1.3 ± 4.6, white −0.9 ± 4.2. **No difference is
resolved, and no counter shows an added mechanism**: shoves 3.29 vs 3.34 per game, captures 1.43 vs
1.43, Ogre survival 49.6% vs 48.9%, enemy shoves 0 vs 0.03. The friends rule removes 0.03 enemy
shoves a game (31 in 1,600) and buys nothing measurable on top of push.

### 2.3 Verdict

The combination is **a confirmed sharpener at depth 4** (+8.2 ± 3.2 decisive, −7.6 ± 3.1 draws,
residual −0.062 ± 0.012) that behaves like **push alone**: every comparison against
`pb-ab-O-push-d4b` is inside noise, the counters are the same to two decimals, and it inherits push's
White shift at O=300 (+3.4 ± 3.1). It is not a better reading than push and it is a second rule to
remember; the data does not argue for adding `ogreShoveFriends=friends` on top of `ogreMode=push`.

## 3. Run 2 — push re-priced at O=318 (`pb-ab-O-push-d4-v318`)

Both arms at `--values O=318` (the push value measured at 3.18 ± 0.44 pawns, next Muller seed 318;
`sim-ogre-explore-2026-09-17.md` §4). Base arm 1,599 games (game 884, §1), variant 1,600 in 1 h 01 m.

| metric | base (repel, O=318) | push, O=318 | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.522 | 0.526 | +0.004 ± 0.024 | no |
| decisive | 0.690 | 0.761 | **+0.071 ± 0.025** | yes |
| draw rate | 0.300 | 0.229 | **−0.071 ± 0.024** | yes |
| mean plies | 110.5 | 113.1 | +2.7 ± 3.3 | no |
| branching factor | 30.6 | 30.5 | −0.1 ± 0.3 | no |
| interest | 0.463 | 0.467 | +0.003 ± 0.004 | no |
| interest (min-use) | 0.443 | 0.460 | +0.008 ± 0.008 | no |
| excessDecisiveness (resid.) | 0.036 | −0.010 | −0.058 ± 0.012 | yes |

**The White edge shrinks toward zero.** Push at O=300 raised White's score **+0.043 ± 0.029**; push
at O=318 raises it **+0.004 ± 0.024** (in the pooled columns 0.509 → 0.552 at 300, 0.522 → 0.526 at
318). The two shifts differ by 3.9 ± 3.8 points (errors in quadrature): the shrink is directional,
not resolved by this pair alone — but the 318 interval covers zero, the 300 interval did not, and the
sign and size repeat the old-rules re-price for push (**+4.9 ± 3.1** at O=300, **+0.5 ± 2.8** at
O=195, `sim-ogre-explore-2026-09-17.md`). The sharpening holds at the higher price: decisive
**+7.1 ± 2.5** and draws **−7.1 ± 2.4** (vs +9.4 ± 3.4 / −8.9 ± 3.4 at 300; the two runs differ by
−2.3 ± 4.2 / +1.8 ± 4.2, inside noise), with Ogre captures 0.93 → 1.33 a game, shoves 2.54 → 3.24,
survival 63.7% → 45.9%.

### Verdict

**Re-pricing push at its measured value removes the adoption blocker and keeps the sharpening.**
At O=318 the run is decisive +7.1 ± 2.5, draws −7.1 ± 2.4 and **fair** (+0.4 ± 2.4 white), with the
draw-adjusted residual −0.058 ± 0.012 still beyond the draw drop. This is the strongest Ogre result
in the route: a confirmed game-shape effect at a price the value pass itself measured.

## 4. Run 3 — hop at depth 4 (`pb-ab-O-hop-d4`)

| metric | base (defaults) | hop | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.525 | +0.017 ± 0.024 | no |
| decisive | 0.676 | 0.692 | +0.016 ± 0.036 | no |
| draw rate | 0.306 | 0.299 | −0.008 ± 0.034 | no |
| mean plies | 111.9 | 108.6 | −3.4 ± 3.8 | no |
| branching factor | 30.9 | 31.7 | +0.8 ± 0.6 | yes |
| interest | 0.463 | 0.462 | −0.001 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.430 | −0.007 ± 0.011 | no |
| excessDecisiveness (resid.) | 0.023 | −0.003 | −0.007 ± 0.012 | no |

**The depth-3 point estimate does not hold up.** At depth 3 hop read decisive +0.013 ± 0.030 with a
positive 1.3-point point estimate (`sim-ogre-movement-2026-09-17.md` §3); at depth 4 the point
estimate is **+1.6 ± 3.6** — still positive, still inside an interval that now covers it, and the
draw-adjusted residual is −0.007 ± 0.012, i.e. no sharpening beyond the (null) draw change. The rule
nonetheless bites and bites more at depth 4 than at depth 3: hops 1.81 a game in 79.5% of games
(depth 3: 1.67 / 74.6%), branching +0.8 ± 0.6, plies −3.4 ± 3.8, Ogre captures 0.97 → 1.28 (depth 3:
0.81 → 1.03) and survival 65.3% → 52.1%. Interest moves the wrong way on the min-use reading
(0.449 → 0.430, −0.007 ± 0.011). Nothing gate-level is negative, but nothing is positive beyond
noise either.

### Verdict

**Hop is null at depth 4 and is not a supported reading.** Two passes (depth 3 and depth 4) now put
its decisive effect inside ±3 points of zero, its draw effect inside ±3.4, and its draw-adjusted
sharpening inside ±0.012. It is a well-defined verb that the search uses often, but the game shape
does not move measurably. If the movement route is ever reopened it needs a different design, not a
third confirmation of this one.

## 5. Counters (LAN, all stored games; `/tmp/ogre-combos/count.mjs`)

`O<from>><shovedFrom>-<shovedTo>` shove, `O<from>x<to>` capture; `records` = plain moves + captures +
shoves (the per-piece-table convention). For hop, `hops` = two-square plain moves (`ogreStep2` off in
that arm; shapes 1,713 diagonal / 728 vertical / 452 horizontal). `LAN = events` compares the LAN
shove count with the records' own `events.ogreShoves`.

| arm | games | shoves | per game | games ≥ 1 | max | captures | per game | records/game | friend/game | enemy/game | guard | hops | per game | games ≥ 1 hop | max hop | LAN = events |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d3 control | 1600 | 4550 | 2.84 | 88.4% | 11 | 1298 | 0.81 | 11.57 | 2.67 | 0.17 | 38 | 0 | 0 | 0% | 0 | yes |
| push+friends d3 | 1600 | 5464 | 3.42 | 93.7% | 13 | 1786 | 1.12 | 10.44 | 3.42 | 0.00 | 35 | 0 | 0 | 0% | 0 | yes |
| d4 control | 1600 | 4125 | 2.58 | 87.3% | 12 | 1559 | 0.97 | 11.35 | 2.36 | 0.22 | 38 | 0 | 0 | 0% | 0 | yes |
| push+friends d4 | 1600 | 5267 | 3.29 | 92.4% | 13 | 2290 | 1.43 | 10.88 | 3.29 | 0.00 | 34 | 0 | 0 | 0% | 0 | yes |
| O=318 control | 1599 | 4067 | 2.54 | 86.7% | 15 | 1483 | 0.93 | 10.77 | 2.34 | 0.20 | 44 | 0 | 0 | 0% | 0 | yes |
| push, O=318 | 1600 | 5185 | 3.24 | 90.8% | 12 | 2123 | 1.33 | 10.57 | 3.22 | 0.03 | 45 | 0 | 0 | 0% | 0 | yes |
| hop, depth 4 | 1600 | 3614 | 2.26 | 85.4% | 12 | 2042 | 1.28 | 11.11 | 2.00 | 0.26 | 24 | 2893 | 1.81 | 79.5% | 12 | yes |

Reading the table: push moves the Ogre into the enemy army (captures 0.97 → 1.43 at O=300, 0.93 →
1.33 at O=318; survival 65% → 46–50%) and converts those trips into shoves (3.34 and 3.24 a game vs
2.58); the friends filter removes exactly the enemy-shove residue (0.22 → 0.03 at O=300; 0.20 → 0.03
at O=318) and nothing else. Hop replaces some shoves with hops (2.58 → 2.26 shoves, 1.81 hops) and
raises enemy shoves 0.22 → 0.26 — the Ogre relocates about as many enemies either way and the game
shape does not follow.

## 6. Verdicts, one line each

| reading | depth 3 | depth 4 at O=300 | depth 4 at O=318 | verdict |
|---|---|---|---|---|
| `ogreMode=push` | unresolved (earlier route) | decisive **+9.4 ± 3.4**, draws **−8.9 ± 3.4**, white **+4.3 ± 2.9** | decisive **+7.1 ± 2.5**, draws **−7.1 ± 2.4**, white **+0.4 ± 2.4** | **confirmed sharpener; fairness fixed by the measured price** |
| `push` + `shoveFriends=friends` | decisive +2.9 ± 3.0, draws **−2.9 ± 2.9** (gate) | decisive **+8.2 ± 3.2**, draws **−7.6 ± 3.1**, white **+3.4 ± 3.1** | not run | confirmed, but **within noise of push alone**; adds no mechanism |
| `ogreShoveFriends=friends` alone (repel) | — | decisive **+6.2 ± 2.1**, draws **−5.9 ± 1.9**, white −0.1 ± 1.3 (taking route) | not run | confirmed sharpener, fair at 300; value/price unmeasured |
| `ogreHop=true` | decisive +1.3 ± 3.0 | decisive **+1.6 ± 3.6**, draws −0.8 ± 3.4, white +1.7 ± 2.4 | not run | **null at both depths**; not supported |

## 7. Synthesis for the designer

**The best-supported shipping candidate is push at OGRE_V 318.** It is the only reading with a
game-shape effect confirmed at depth 4 under two prices: decisive +9.4 ± 3.4 and +7.1 ± 2.5, draws
−8.9 ± 3.4 and −7.1 ± 2.4, with the 318 run also fair (+0.4 ± 2.4 white, vs +4.3 ± 2.9 at 300), and
the price is the value the odds match measured for the push reading itself (3.18 ± 0.44 pawns, next
Muller seed 318). It is one rule change (a default mode) plus one constant (`OGRE_V` 300 → 318).

**Do not add the friends restriction on these numbers.** Push+friends at depth 4 is decisive
+8.2 ± 3.2 / white +3.4 ± 3.1 against push alone's +9.4 ± 3.4 / +4.3 ± 2.9 — every paired comparison
against push is inside its interval (≤ 1.3 points of difference against ≥ 4.2-point intervals), the
counters are identical to two decimals, and the only thing it removes is 0.03 enemy shoves a game.
The owner's rule ("all things being equal or near equal, do not add rules") applies exactly.

**The friendly alternative is friends-only at the shipped 300.** `ogreShoveFriends=friends` alone
(repel, O=300) is a confirmed sharpener (+6.2 ± 2.1 decisive, −5.9 ± 1.9 draws) with White untouched
(−0.1 ± 1.3), and it needs no re-pricing. Its sharpening is a point estimate smaller than re-priced
push's (+6.2 vs +7.1, difference 0.9 ± 3.3 — unresolved), and its value was never measured, so 300 is
an assumed price for it, not a measured one. If the designer prefers not to move `OGRE_V`, this is
the reading that was fair at the price already shipped.

**What is still open.**
- **Hop is closed on measurement**: null at depth 3 (+1.3 ± 3.0) and depth 4 (+1.6 ± 3.6), residual
  −0.007 ± 0.012, interest (min-use) trending down. It is a taste call only.
- **The combination at O=318 was not run** (push+friends at 300 shows the same White shift push has
  at 300: +3.4 ± 3.1); since friends adds nothing at 300, this is a low-value run.
- **The friends-only value**: an odds match under `ogreShoveFriends=friends` would give its price
  the way the push pass did (3.18 ± 0.44).
- **The roster question is the designer's**: `O` is outside the 15-letter `POOL` (at most one guard)
  and no promotion reaches it, so shipping any reading needs a pool slot, a default `ogreMode`, and
  the matching `OGRE_V` (318 for push).
- **Lab caveat (not a shipping question)**: under O=318 one game in 1,600 (~0.06%) hit a
  state-dependent search blow-up at depth 4 (game 884, §1); under O=300 the same job finished in 191
  plies. No stored run observed it before. It cost one base game and is recorded here for the engine
  workstream.

## 8. Data

`sim/out/pb-ab-O-pushfr.experiment.md`, `sim/out/pb-ab-O-pushfr-d4.experiment.md`,
`sim/out/pb-ab-O-push-d4-v318.experiment.md`, `sim/out/pb-ab-O-hop-d4.experiment.md`, the matching
`*.{base,var}.{report.md,report.json,summary.json}` and raw `.jsonl` files; comparators
`pb-ab-O-push-d4b.experiment.md` (O=300 push), `pb-ab-O-shovefr-d4.experiment.md` (friends alone),
`pb-ab-O-hop.experiment.md` (depth 3). Counters and the search replication:
`/tmp/ogre-combos/count.mjs`, `/tmp/ogre-combos/pos104.mts`, `/tmp/ogre-combos/search-instr.mts`.
