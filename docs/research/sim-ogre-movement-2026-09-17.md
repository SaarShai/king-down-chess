# Ogre movement: hop and step-2 lab readings (2026-09-17)

The Ogre (`O`) is a lab piece: it is not in the shipped pool `QLRRBBNNAAGMMSS`, and no promotion
reaches it. It moves and captures one square in any direction except onto a guard; instead of moving
it may shove one adjacent piece, friend or enemy, one square straight away onto an empty square. A
king is never shoved. `ogreMode: 'repel'` (the shipped default) keeps the Ogre on its square after a
shove; `'push'` follows it onto the square the shoved piece left
(`docs/research/sim-ogre-explore-2026-09-17.md`).

This route covers the designer's **movement** questions (TASKS.md, "OGRE exploration" (a)): the plain
mobility reading (**1 step vs 2**) and whether the Ogre may **hop over pieces** to reach the far side
of a shove. Two rules, both lab-only and off by default:

- `ogreHop: boolean` — the Ogre may hop over one adjacent piece, friend or enemy, and land on the
  empty square directly beyond it, in all 8 directions. A hop is a **move**: it is neither a capture
  nor a shove, the jumped piece stays where it stands, and the landing square must be empty, so a hop
  never lands on a second piece. A king may be jumped — nothing is displaced — unlike a shove.
- `ogreStep2: boolean` — the Ogre may step **2 squares** in any direction, through an empty middle
  square onto an empty landing square: the plain mobility reading, the same second-square shape as
  `guardStep: 2` and `maesterStep: 2`.

Both are move-only, so `isAttacked` is deliberately unchanged: the Ogre still attacks only its 8
neighbours by its capture rule and a hop adds no attack. `crossCheckAttacks` runs against
`genPiece('attacks')` with each reading on (the new test at `src/rules/rules.test.ts:998`; the
cross-check itself is `src/rules/rules.test.ts:195`).

## 0. Short version

- **Hop is null at depth 3 on the game-shape gate and it bites.** Decisive **+0.013 ± 0.030**, draws
  **−0.009 ± 0.029**, white score **+0.008 ± 0.041**: no gate metric clears its interval. The rule is
  played **1.67 times a game in 74.6% of games** (max 12 in one game), branching rises **+1.7 ± 0.6**,
  games shorten **−3.3 ± 3.1** plies, the Ogre captures more (0.81 → 1.03 a game) and dies more
  (survival 66.8% → 54.3%). The pre-set depth-4 gate did not fire, so no depth-4 arm was played.
- **Step 2 is null too and it bites.** Decisive **−0.010 ± 0.028**, draws **+0.012 ± 0.028**, white
  score **+0.004 ± 0.029**; **2.46 step-2s a game in 74.9% of games** (max 47), branching **+1.1 ± 0.3**,
  plies **−3.6 ± 2.5**, captures 0.81 → 1.11, survival 66.8% → 52.0%. Gate not cleared; no depth-4.
- Neither reading makes the Ogre relocate more **enemy** pieces: enemy shoves sit at ~0.17/game in
  both controls and ~0.20/game under both rules (+0.03 each), while total shoves *fall* (2.84 → 2.58
  hop, 2.84 → 2.73 step 2). Both readings walk the Ogre further into the enemy army and it dies there.
- **Recommendation.** Neither is adoptable on this evidence. If the designer continues the movement
  route, **hop is the reading to pursue**: it is the only one of the two with a positive decisive
  point estimate (+1.3 points against step 2's −1.0), it holds the draw-adjusted game shape flat
  (interest (min-use) −0.001 ± 0.010 against step 2's −0.006 ± 0.011), it adds more branching
  (+1.7 ± 0.6 against +1.1 ± 0.3), and it is the distinctive verb — the Ogre crosses a wall of pieces
  to shove from the far side — where step 2 is plain mobility a rider already gives. Any pursuit
  needs the depth-4 confirmation; on these intervals neither result is resolved.

## 1. Semantics, seams and tests

| rule | semantics | default | generation seam | attack seam |
|---|---|---|---|---|
| `ogreHop` | hop over **one** adjacent piece (friend, enemy or king) onto the empty square straight beyond, all 8 directions; a move, never a capture or shove; jumped piece stays put | `false` (`src/rules/rules.ts:394`) | `src/rules/engine.ts:511` (docs `src/rules/rules.ts:266`) | none — `hit(s, O)` at `src/rules/engine.ts:701` keeps the 8-neighbour attack |
| `ogreStep2` | second square of each ray through an empty middle square, all 8 directions; a move only | `false` (`src/rules/rules.ts:395`) | `src/rules/engine.ts:501` (docs `src/rules/rules.ts:276`) | none — same branch |

The interface fields are `src/rules/rules.ts:274` (`ogreHop`) and `src/rules/rules.ts:282`
(`ogreStep2`); the shove loop that both readings leave untouched is `src/rules/engine.ts:517`. The
two rules are inert with no Ogre on the board (the shipped pool has none), and a hop and a step-2 can
never produce the same move: a hop needs an occupied middle square, a step-2 an empty one.

Four tests in `src/rules/rules.test.ts` (`npx vitest run src/rules/rules.test.ts`: 128 passed; full
suite 205 passed; `npx tsc --noEmit` clean):

| line | test |
|---|---|
| 966 | `ogreHop: off, a piece blocks; on, the ogre jumps exactly one and lands beyond it` |
| 978 | `a hop may not land on an occupied square or carry the ogre over two pieces` |
| 988 | `ogreStep2: off one step, on the second square through an empty middle` |
| 998 | `neither reading changes a shove, a capture or the attack set` |

The tests pin the documented king choice (a hop may jump one, `rules.test.ts:974`), the
empty-landing rule and the one-piece cap (`rules.test.ts:984`–`985`), and the unchanged tips: the
shove/capture LAN set is identical with both rules on, and `crossCheckAttacks(149)` still passes.

## 2. Method

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --rule "ogreHop=true"  --id pb-ab-O-hop   --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --rule "ogreStep2=true" --id pb-ab-O-step2 --workers 4
```

The spec carries the 40 mirrored ogre back ranks (`sim/specs/newpieces/ab-O-push.json`): 1,600 games
per population, depth 3, seed 41, 4 random opening plies, ply cap 300, one `O` per army. The base arm
is a fresh run of today's defaults (`ogreMode: repel`, both new fields off); the variant adds the
one toggle. Both arms share the 40 arrangements and the opening seeds (common random numbers). Four
workers, the two A/Bs strictly sequentially; per-arm times 1,155.1 s / 1,348.0 s (hop) and 1,692.4 s
/ 1,241.6 s (step 2).

**Control check.** A parallel route's rule fields landed mid-route, so the hop base arm carries
source `64864615bf63` and the other three arms `4be3ddab3232`. Both base arms were replayed
**game for game identically** (1,600/1,600 games match on result, reason, plies and every LAN), so
the source change played the same game under the defaults: the comparison is like for like.

**Gate.** The route's pre-set depth-4 trigger is |difference| > its interval on decisive, draws or
white score. For hop the three are +0.013 ± 0.030, −0.009 ± 0.029, +0.008 ± 0.041; for step 2 they
are −0.010 ± 0.028, +0.012 ± 0.028, +0.004 ± 0.029. **No metric clears its interval, so no depth-4
arm was run** and the depth-4 numbers do not exist for either rule.

## 3. Hop — `ogreHop=true` against defaults (1,600 games an arm, depth 3, seed 41)

| metric | base (pooled) | hop (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.541 | +0.008 ± 0.041 | no |
| decisive | 0.795 | 0.808 | +0.013 ± 0.030 | no |
| draw rate | 0.198 | 0.189 | −0.009 ± 0.029 | no |
| capped | 0.007 | 0.003 | −0.004 ± 0.005 | no |
| mean plies | 105.0 | 101.8 | −3.3 ± 3.1 | yes |
| branching factor | 32.2 | 33.9 | +1.7 ± 0.6 | yes |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | yes |
| interest | 0.492 | 0.492 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.449 | 0.445 | −0.001 ± 0.010 | no |
| excessDecisiveness (resid.) | 0.030 | 0.002 | −0.008 ± 0.009 | no |

The Ogre row (`sim/out/pb-ab-O-hop.var.report.md`): moves 11.57 → 11.18, captures 0.81 → 1.03,
survival 66.8% → 54.3%. Dead-material endings 8 (0.5%) → 20 (1.3%); games where a king never moved
26.9% → 28.9%. Interest and its min-use variant are flat, and the draw-adjusted excess-decisiveness
residual is −0.008 ± 0.009, so the +1.3-point decisive point estimate is no more than the draw drop
predicts.

## 4. Step 2 — `ogreStep2=true` against defaults (1,600 games an arm, depth 3, seed 41)

| metric | base (pooled) | step 2 (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.537 | +0.004 ± 0.029 | no |
| decisive | 0.795 | 0.785 | −0.010 ± 0.028 | no |
| draw rate | 0.198 | 0.210 | +0.012 ± 0.028 | no |
| capped | 0.007 | 0.005 | −0.002 ± 0.005 | no |
| mean plies | 105.0 | 101.4 | −3.6 ± 2.5 | yes |
| branching factor | 32.2 | 33.2 | +1.1 ± 0.3 | yes |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | no |
| interest | 0.492 | 0.490 | −0.001 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.437 | −0.006 ± 0.011 | no |
| excessDecisiveness (resid.) | 0.020 | −0.001 | +0.011 ± 0.012 | no |

The Ogre row (`sim/out/pb-ab-O-step2.var.report.md`): moves 11.57 → 11.51, captures 0.81 → 1.11,
survival 66.8% → 52.0%. Dead-material endings 8 (0.5%) → 12 (0.8%); games where a king never moved
26.9% → 27.1%. The decisive point estimate is **negative** (−1.0 point) and the draw point estimate
positive (+1.2 points), both inside noise.

## 5. Counters (LAN, all 6,400 stored games; throwaway `/tmp/ogre-movement-count.mjs`)

LAN shapes: `O<from>-<to>` moves, `O<from>><shovedFrom>-<shovedTo>` shoves. A hop prints as an
ordinary move. In these arms the new move is still identifiable: the hop arm has `ogreStep2` off, so
every plain two-square Ogre move is a hop, and the step-2 arm has `ogreHop` off, so every plain
two-square move is a step-2. (With both toggles on in one arm the LAN cannot tell them apart; no such
arm was run.)

| file | games | Ogre moves/game (plain + captures) | shoves/game | two-square moves/game | games with ≥1 | max in a game |
|---|---|---|---|---|---|---|
| hop base (defaults) | 1,600 | 8.73 (7.92 + 0.81) | 2.84 | 0 | 0% | 0 |
| hop on | 1,600 | 8.60 (7.57 + 1.03) | 2.58 | **1.67 hops** | 74.6% | 12 |
| step-2 base (defaults) | 1,600 | 8.73 (7.92 + 0.81) | 2.84 | 0 | 0% | 0 |
| step 2 on | 1,600 | 8.78 (7.66 + 1.11) | 2.73 | **2.46 step-2s** | 74.9% | 47 |

Checks: the LAN shove count equals the records' own `events.ogreShoves` **exactly** in all four
files (4,550 / 4,128 / 4,550 / 4,371); the report's per-piece `O` "moves" figure equals plain moves
plus shoves (base 11.57 = 8.73 + 2.84; hop 11.18 = 8.60 + 2.58; step 2 11.51 = 8.78 + 2.73). The Ogre
moved at all in 87.3% of base games, 93.1% (hop) and 91.0% (step 2).

Enemy relocation, the designer's goal, does not increase: `ogreShoves` minus `ogreShovesFriend` is
~0.17/game in the controls and ~0.20/game under both rules (+0.03 a game each, about one extra
enemy shove per 33 games). Friend shoves fall 2.67 → 2.38 (hop) and 2.67 → 2.53 (step 2); a
forward-moving Ogre shoves less overall because it now walks and hops into the shove square instead.

## 6. Verdicts

**`ogreHop` — null at depth 3; not rejected, not confirmed; no depth-4 arm (gate).** The rule does
what it says (1.67 hops a game, 74.6% of games, zero two-square moves in the control) and it changes
the game shape measurably — branching +1.7 ± 0.6, plies −3.3 ± 3.1, Ogre captures 0.81 → 1.03 and
survival 66.8% → 54.3% — but the three gate metrics all sit inside their intervals (decisive
+0.013 ± 0.030, draws −0.009 ± 0.029, white +0.008 ± 0.041), and the decisive point estimate is fully
explained by the draw drop (residual −0.008 ± 0.009). A hop verdict needs the depth-4 run the gate
did not trigger.

**`ogreStep2` — null at depth 3.** 2.46 step-2s a game in 74.9% of games, branching +1.1 ± 0.3,
plies −3.6 ± 2.5, captures 0.81 → 1.11, survival 66.8% → 52.0%; decisive **−0.010 ± 0.028**, draws
**+0.012 ± 0.028**, white **+0.004 ± 0.029**. The point estimates lean the wrong way for sharpening
(more draws, fewer decisive games) and every interval covers zero. Nothing here is rejected — the
reading is simply unresolved, and no depth-4 arm was played.

## 7. Recommendation

For the designer's goal — the Ogre **relocating enemy pieces in interesting ways** — **hop is the
movement reading to pursue, and step 2 can be set aside.** Grounds: hop is the only one of the two
with a positive decisive point estimate (+1.3 points, against step 2's −1.0); it keeps the
draw-adjusted game shape flat where step 2 leans draw-ward (interest (min-use) −0.001 ± 0.010 against
−0.006 ± 0.011; excess-decisiveness residual −0.008 ± 0.009 against +0.011 ± 0.012); it adds more
branching per new move (+1.7 ± 0.6 against +1.1 ± 0.3); and semantically it is the verb that changes
*which shoves exist* — the Ogre can cross a line of pieces and shove from the far side — where step 2
is the same mobility a rider already delivers. Both readings leave enemy shoves at ~0.2 a game
(0.17 → 0.20), so "promising" here means "the reading worth a depth-4 confirmation", not "adopt": the
depth-3 intervals contain zero, and until that run exists the movement route has no measurable effect
on balance, draws or decisiveness.

Data: `sim/out/pb-ab-O-hop.experiment.md`, `sim/out/pb-ab-O-step2.experiment.md`, per-arm
`report.md` / `summary.json` and raw `.jsonl` beside them; counters from
`/tmp/ogre-movement-count.mjs`. Source stamps: hop base `64864615bf63`, the other three arms
`4be3ddab3232`.
