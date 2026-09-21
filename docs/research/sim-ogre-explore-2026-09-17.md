# Ogre exploration: push vs repel and pricing under current rules (2026-09-17)

The Ogre (`O`) is a lab piece: it is not in the shipped pool `QLRRBBNNAAGMMSS`, and no promotion
reaches it. It moves and captures one square in any direction except onto a guard; instead of moving
it may shove one adjacent piece, friend or enemy, one square straight away onto an empty square. A
king is never shoved. `ogreMode: 'repel'` (the shipped default) keeps the Ogre on its square after a
shove; `'push'` follows it onto the square the shoved piece left, Sokoban-style.

The earlier campaign (`docs/research/sim-new-pieces-2026-09-14.md` §5, §7) measured push against
repel at 1,600 games an arm under the **pre-adoption rules**: decisive **+0.053 ± 0.029**, draws
**−0.059 ± 0.030** at depth 3, and **+0.090 ± 0.049** decisive at depth 4 with the White shift inside
noise once both arms were seeded at O=195. Since then the archer was re-priced (`ARCHER_V` 505) and
widened (`archerShots: plusDiagFwd2`). This route re-measures the A/B on a **fresh control of today's
rules** and prices the Ogre under each reading.

## 0. Short version

- **Push is not a resolved sharpener under today's rules.** At depth 3 (1,600 games an arm, seed 71):
  decisive **+0.021 ± 0.029**, draws **−0.021 ± 0.029**, white score **+0.001 ± 0.029**, plies
  −1.4 ± 3.2, interest (min-use) +0.007 ± 0.010. None of the three gate metrics clears its interval,
  so the pre-set depth-4 confirmation was **not run**. Today's point estimate is about 40% of the old
  depth-3 effect and the two are compatible (difference 3.2 ± 4.1 points), so the pass neither
  confirms nor excludes the old result at depth 3.
- **Pricing** at the shipped seed O=300: **push 3.18 ± 0.44 pawns** (+1 ± 28 Elo vs a knight, next
  Muller seed 318 — at its fixed point within error); **repel 2.25 ± 0.43 pawns** (−58 ± 27 Elo, next
  seed 225 — the shipped 300 overprices repel by 0.75 ± 0.43). The readings differ by
  **+0.93 ± 0.62 pawns** in push's favour.
- **Shove counters** (LAN, cross-checked against the `ogreShoves` event counter — exact in every
  file): push 3.62 shoves/game in 94.7% of games, repel 3.01 in 90.6%. Nearly all shoves move a
  **friend** (3.59 of 3.62 under push); the guard shove stays rare (42 games, 2.6%).
- **Shipping** is a **roster decision**: `O` is not in `POOL` and would need a pool slot, a default
  mode choice, and a price (`OGRE_V` 318 for push, 225 for repel, against 300 today).

## 1. Method

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --id pb-ab-O-push2 --games 1600 --depth 3 --seed 71 --workers 4 --rule "ogreMode=push"
```

The spec carries the 40 mirrored back ranks of the earlier ogre campaign (`np-O`); every rank holds
exactly one `O` per army. The **base arm is a fresh run of today's defaults** (`rules {}`; the
resolved set includes `archerShots=plusDiagFwd2`), the variant adds `ogreMode=push`; both arms share
the 40 arrangements and the opening seeds (common random numbers). 1,600 games per population,
4 workers, depth 3, 4 random opening plies, ply cap 300, default adjudication, source stamp
`ac3b992db865`. Machine time: 874.9 s (base) + 845.9 s (push). Output:
`sim/out/pb-ab-O-push2.experiment.md`, per-arm reports `sim/out/pb-ab-O-push2.{base,var}.report.md`.

The route's pre-set gate for a depth-4 confirmation (seed 72, same size) is: |difference| > its
interval on decisive, draws or white score. **It did not fire** (§2), so no depth-4 run was played.

Value passes, Muller's asymmetric-material method (`--pieces O`: one knight of `RNBQKBNR` replaced by
`O` on one side only, colour-reversed pairs, 500 games an arm, depth 3, seed 78, 4 workers, no
calibration arm so every implied value carries the stored 64 ± 16 Elo/pawn conversion, 239.1 s and
237.6 s):

```
node_modules/.bin/tsx src/sim/run.ts --id pb-O-push-value  --experiment values --pieces O --games 500 --eloPerPawn 64 --depth 3 --seed 78 --workers 4 --rule "ogreMode=push"
node_modules/.bin/tsx src/sim/run.ts --id pb-O-repel-value --experiment values --pieces O --games 500 --eloPerPawn 64 --depth 3 --seed 78 --workers 4
```

Shove counters come from a throwaway script under `/tmp`: it streams the stored JSONL, matches the
shove LAN with `/^O[a-h][1-8]>[a-h][1-8]-[a-h][1-8]$/` (`O<from>><shovedFrom>-<shovedTo>`), and
counts per game; it also sums the records' own `events.ogreShoves` for a cross-check. The two agree
**exactly** in all four files (§5).

## 2. Depth 3 — push vs repel (1,600 games per population, seed 71)

| metric | repel (base, pooled) | push (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.542 | 0.543 | +0.001 ± 0.029 | no |
| decisive | 0.773 | 0.794 | +0.021 ± 0.029 | no |
| draw rate | 0.219 | 0.198 | −0.021 ± 0.029 | no |
| capped | 0.008 | 0.007 | −0.001 ± 0.007 | no |
| mean plies | 113.1 | 111.7 | −1.4 ± 3.2 | no |
| branching factor | 31.8 | 32.2 | +0.4 ± 0.2 | yes |
| interest | 0.486 | 0.487 | +0.002 ± 0.006 | no |
| interest (min-use) | 0.447 | 0.474 | +0.007 ± 0.010 | no |
| excessDecisiveness (resid.) | 0.021 | −0.009 | −0.020 ± 0.011 | yes |

**The gate stays closed.** Decisive +0.021 against a 0.029 half-width, draws −0.021 against 0.029,
white +0.001 against 0.029: no gate metric clears its interval. The old depth-3 run (same ranks,
seed 41, old archer rules) read decisive +0.053 ± 0.029 and draws −0.059 ± 0.030. The new estimate is
lower by 3.2 ± 4.1 points (errors in quadrature), so the two overlap: this pass neither reproduces
the old sharpening as significant nor contradicts it. The base itself is more decisive today
(68.1% under the old rules → 77.3% now), consistent with the adopted wider archer (its own A/B read
+8.8 ± 3.8 decisive); the pass cannot separate that ceiling from arrangement and seed noise.

The rule bites. `ogreShoves` 3.01 → 3.62 per game; the Ogre itself moves 13.69 → 11.46 times and
captures 0.90 → 1.25 per game, and its survival falls 65.4% → 49.4%: under push the ogre travels
into the enemy army and dies there. Interest is flat (+0.002 ± 0.006; min-use +0.007 ± 0.010), and
the draw-adjusted excess-decisiveness residual is −0.020 ± 0.011, so the raw decisive gain is no
more than the draw drop predicts.

## 3. Depth 4 — not run

| gate metric | depth-3 difference ± interval | gate |
|---|---|---|
| decisive | +0.021 ± 0.029 | not cleared |
| draws | −0.021 ± 0.029 | not cleared |
| white score | +0.001 ± 0.029 | not cleared |

The only depth-4 evidence for push remains the 2026-09-17 re-price at the old rules and O=195:
decisive **+0.090 ± 0.049**, draws **−0.069 ± 0.048**, white +0.005 ± 0.028 (800 games an arm). That
run belongs to the pre-archer game. A later route that wants a push verdict under today's rules must
run seed 72 depth 4 (1,600 games an arm) regardless of this gate.

## 4. What the Ogre is worth (500 games, depth 3, seed 78)

| reading | pentanomial | score | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | next seed (cp) |
|---|---|---|---|---|---|---|---|
| repel (shipped default) | [57, 54, 84, 25, 30] | 0.417 | −58 ± 27 | −0.91 ± 0.43 | **2.25 ± 0.43** | 3.00 | 225 |
| push | [46, 28, 98, 34, 44] | 0.502 | +1 ± 28 | +0.02 ± 0.44 | **3.18 ± 0.44** | 3.00 | 318 |

`OGRE_V = 300` (`src/ai/eval.ts:77`). **Push sits at the shipped price**: 3.18 ± 0.44 against 3.00,
and the next Muller seed 318 is inside the error bar, so the push reading is at its fixed point
within this sample's resolution. **Repel is overpriced by the shipped constant**: 2.25 ± 0.43
against 3.00, a move of 0.75 ± 0.43 beyond its interval, next seed 225; do not write 225 into the
engine after one pass. The two readings differ by **+0.93 ± 0.62 pawns** in push's favour (errors in
quadrature, the arms share the classic ranks and seed); that interval does not cover zero, so the
value method favours push by roughly a pawn even where the depth-3 A/B cannot resolve the game
shape. The earlier seed-300 pass under the old rules read repel 1.95 ± 0.49 and push 3.02 ± 0.56;
today's numbers are inside those intervals, so the archer change did not move the Ogre's price.

## 5. Shove counters (LAN, all stored games per arm)

| arm | games | shoves | per game | games with ≥ 1 shove | most in a game | mean first shove (ply) | LAN = events |
|---|---|---|---|---|---|---|---|
| push, depth-3 A/B | 1,600 | 5,787 | 3.62 | 1,515 (94.7%) | 16 | 18 | yes |
| repel, depth-3 A/B | 1,600 | 4,813 | 3.01 | 1,450 (90.6%) | 13 | 20 | yes |
| push, value arm | 500 | 1,014 | 2.03 | 443 (88.6%) | 7 | 18 | yes |
| repel, value arm | 500 | 681 | 1.36 | 371 (74.2%) | 7 | 27 | yes |

The shove remains a way of **travelling with a friend**: in the depth-3 A/B, 3.59 of the push arm's
3.62 shoves per game and 2.83 of the repel arm's 3.01 move a friendly piece; enemy shoves are
0.03/game under push and 0.17 under repel. The guard shove that motivates the piece stays rare —
42 games (2.6%) under push and 32 (2.0%) under repel — and the value arms see none (RNBQKBNR has no
guard). So the 2026-09-14 finding holds: the Ogre does not break guard blockades. Push shoves
earlier (first shove around ply 18 against 20; 18 against 27 in the value arms) and, per §2, walks
itself into danger. The LAN counts match the report event row for row (`ogreShoves` 3.01 → 3.62,
`ogreShovesFriend` 2.83 → 3.59, `ogreShovesGuard` 0.02 → 0.04), which validates both counters.

## 6. Verdict

**Is push a genuine sharpener under today's rules? Not resolved, and weaker than the old reading.**
Under today's controls the depth-3 push − repel difference is decisive +0.021 ± 0.029, draws
−0.021 ± 0.029, white +0.001 ± 0.029: every interval covers zero, and the depth-4 confirmation the
route reserved for a gate-clearing result was, correctly, not played. The old depth-3 (+0.053 ± 0.029)
and depth-4 (+0.090 ± 0.049) results were measured under the pre-archer rules; today's higher, more
decisive base (77.3% against the old 68.1%) leaves less room for push, but this pass cannot separate
that from seed noise. A push verdict under today's rules needs the seed-72 depth-4 run.

**Cost and earnings in pawns.** Against a knight, the push reading earns **3.18 ± 0.44 pawns** and
the repel reading **2.25 ± 0.43 pawns**; push is ahead by +0.93 ± 0.62. The shipped `OGRE_V` 300
prices push at its fixed point (next seed 318) and overprices repel by 0.75 ± 0.43 (next seed 225).
The price gap is the strongest pro-push number in this route, and it is a strength measurement, not
a game-shape one.

**What shipping would require.** The Ogre is a lab piece — not in `POOL`, never a promotion. Shipping
it means a **roster decision by the designer**: a slot in the 15-letter pool (which today carries at
most one guard), a default `ogreMode` (`repel` is shipped; this route prices `push` about a pawn
higher), and the matching `OGRE_V` (318 for push; 225 for repel if repel ships alone). On this route's
evidence the case for shipping push is a pawn of strength and a rarely used guard shove — not a
confirmed sharpening of the game.

Data: `sim/out/pb-ab-O-push2.experiment.md`, `sim/out/pb-ab-O-push2.{base,var}.{report.md,summary.json}`,
`sim/out/pb-O-push-value.experiment.md`, `sim/out/pb-O-repel-value.experiment.md`; raw games in the
matching `.jsonl` files; shove counting script `/tmp/ogre-route/shove-count.mjs`.
