# Ogre taking readings and the corrected push-vs-repel depth 4 (2026-09-17)

The Ogre (`O`) is the lab piece that relocates other pieces. Two questions were open: does it need
to **take** at all, and is **push** or **repel** the reading under today's rules? This route builds
the two taking rules (both off by default), tests them, and runs the depth-3 and depth-4 A/Bs on the
ogre spec. The headline is §3: **push is a confirmed sharpener at depth 4 under today's rules.**

## 0. Short version

- **Push vs repel, depth 4, today's rules** (`pb-ab-O-push-d4b`, 1,600 games an arm): decisive
  **+0.094 ± 0.034**, draws **−0.089 ± 0.034**, white score **+0.043 ± 0.029**. The depth-3 +0.021 ±
  0.029 (`sim-ogre-explore-2026-09-17.md` §2) was unresolved; at depth 4 the sharpening is about
  four times the depth-3 point estimate and clears its interval.
- **`ogreNoCapture`** (`pb-ab-O-nocap`, depth 3): decisive −0.013 ± 0.034, draws +0.015 ± 0.032,
  white +0.006 ± 0.034 — no gate metric fires, so no depth-4 arm was played. The Ogre's captures go
  to exactly zero and it lives longer (66.8% → 76.4%); the game shape does not move measurably. The
  pure relocator is a **taste reading, not a measured one**.
- **`ogreShoveFriends=enemies`** (`pb-ab-O-shoveen`): the depth-3 decisive dip (−0.031 ± 0.029) did
  not confirm at depth 4 (**+0.015 ± 0.032**). Friend shoves are 94% of all shoves, and removing
  them mostly removes the Ogre's mobility (branching −0.8, then −1.1). No confirmed gain.
- **`ogreShoveFriends=friends`** (`pb-ab-O-shovefr`): the only confirmed taking reading at depth 4 —
  decisive **+0.062 ± 0.021**, draws **−0.059 ± 0.019**, white **−0.001 ± 0.013**, plies +3.6 ± 1.6.
  Removing the rarely used enemy shove (0.17/game) sharpens the game more than the counter suggests.
- Counters cross-check exactly against the stored event totals in every file, and the earlier
  depth-4 attempt (`pb-ab-O-push2-d4`) is confirmed void: its control played **0 ogre shoves and 0
  ogre captures in 1,600 games** — no ogre was on the board.

## 1. What was built

### 1.1 `ogreNoCapture: boolean` (default `false`)

The Ogre can only capture by moving onto an enemy (a guard excepted). With the rule on, the Ogre
**cannot capture**: `canCapture` refuses it every victim, so no generator produces a capture move
and the shove is its only way to affect an enemy. Check and mate follow the ordinary rule of capture
— a piece that cannot take a king never attacks one — so with the rule on:

- a no-capture Ogre **can never give check or mate**; a king may stand on any of its 8 neighbours
  unharmed;
- `isAttacked` mirrors that exactly (`crossCheckAttacks` proves it), with one deliberate extra gate:
  `hit()` short-circuits an **empty** target, so the Ogre is gated explicitly there;
- `insufficientMaterial` drops it from the mating material, so **K+O vs K is `drawMaterial`** (exact,
  not the usual conservative direction: a mate needs a check, and this Ogre cannot check);
- it is still an ordinary piece for everything else — it blocks, it can be captured, and its shove
  (friend or enemy, never a king, guards included) is untouched.

### 1.2 `ogreShoveFriends: 'both' | 'enemies' | 'friends'` (default `'both'`)

Who may be shoved, alongside the existing "never a king":

- `'both'` — the shipped lab reading: friends and enemies alike;
- `'enemies'` — a pure crowd-control reading; friend shoves are not generated;
- `'friends'` — a pure support reading (reposition your own pieces); enemy shoves are not generated.

A guard is shovable under every value (that is the point of the piece) and a king never is. The
filter is a post-generation pass in `genPiece`, the same single seam as the capital rules C2/C5, so
`case O` keeps one shove loop, the search and the HUD see the same moves, and `isAttacked` is
untouched (a shove was never an attack).

### 1.3 Seams and tests

| seam | file:line |
|---|---|
| `OgreShoveFriends` type | `src/rules/rules.ts:51` |
| `ogreNoCapture` / `ogreShoveFriends` fields | `src/rules/rules.ts:300`, `:307` |
| defaults (`false`, `'both'`) | `src/rules/rules.ts:397-398` |
| `CHOICES` entry for the parser | `src/rules/rules.ts:465` |
| the no-capture clause (one place for generation and attack) | `src/rules/engine.ts:180` |
| the empty-target gate in `isAttacked` | `src/rules/engine.ts:701` |
| the shove-side filter in `genPiece` | `src/rules/engine.ts:608-613` |
| `insufficientMaterial` under the reading | `src/rules/engine.ts:817` |

Tests, `describe('ogre taking readings (lab)')` at `src/rules/rules.test.ts:1014`:

- `ogreNoCapture: every capture goes, every shove stays, and it attacks nothing` (`:1020`)
- `ogreShoveFriends: both (default) shoves either side; enemies only enemies; friends only friends` (`:1053`)

`npx tsc --noEmit` is clean and `npx vitest run src/rules/rules.test.ts` passes **128/128** at this
source (the file also carries the separate `ogreHop`/`ogreStep2` movement tests).

## 2. Method

Every A/B plays `sim/specs/newpieces/ab-O-push.json`: 40 mirrored back ranks, each army holding
exactly one `O`, 1,600 games per population, seed 41, 4 random opening plies, ply cap 300, default
adjudication, common random numbers. All runs used exactly 4 workers, sequentially. Depth 3 unless
`--depth 4`; the two depth-4 follow-ups reuse the depth-4 default control of run 4a through
`--baseId pb-ab-O-push-d4b.base` (same arrangements, seed, depth and rules — the control was played
once). All games carry `src=4be3ddab3232`; `sourceId()` of the committed source reproduces it
exactly. Rule keys: control `ee0a45ad`, push `f221cdd2`, no-capture `e6ba7915`, enemies `07157208`,
friends `3e0d3b4c`.

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/newpieces/ab-O-push.json --experiment ab \
  --rule "…" --id pb-ab-O-… --workers 4
```

The earlier depth-4 attempt is void for a measured reason, not a suspected one: `pb-ab-O-push2-d4`
(seed 72) recorded `backRanks: { sample: 40 }` from the default `POOL`, and the counter finds **0
ogre shoves and 0 ogre captures in its 1,600-game control** (table §7). It measured
`ogreMode=push` over zero ogres and is not used here. The corrected run below uses the spec's
explicit 40 ogre ranks.

Ogre counters were counted from the stored LAN with a throwaway script under `/tmp`
(`/tmp/ogre-taking/count.mjs`): shoves `/^O[a-h][1-8]>[a-h][1-8]-[a-h][1-8]$/`, captures
`/^O[a-h][1-8]x[a-h][1-8]$/`. The LAN shove counts equal the records' own `events.ogreShoves` **in
every file** (table §7), and the capture counts match the reports' per-piece `O` capture column.

## 3. Push vs repel at depth 4 — the headline

`pb-ab-O-push-d4b`: `ogreMode=push` against today's defaults, depth 4, 1,600 games per population.
Base arm 1 h 42 m, variant arm 1 h 06 m on the shared machine.

| metric | repel (base) | push | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.552 | **+0.043 ± 0.029** | yes |
| decisive | 0.676 | 0.770 | **+0.094 ± 0.034** | yes |
| draw rate | 0.306 | 0.217 | **−0.089 ± 0.034** | yes |
| mean plies | 111.9 | 112.6 | +0.6 ± 3.2 | no |
| branching factor | 30.9 | 30.6 | −0.3 ± 0.7 | no |
| interest (min-use) | 0.449 | 0.465 | +0.005 ± 0.008 | no |
| excessDecisiveness (resid.) | 0.054 | −0.032 | −0.070 ± 0.012 | yes |

The rule bites: the Ogre moves 11.35 → 10.99 times, captures **0.97 → 1.43** per game, survives
**65.3% → 48.9%** of games, and shoves **2.58 → 3.34** per game (friend shoves 2.36 → 3.31, enemy
shoves 0.22 → 0.03; LAN, §7). The decisive gain is larger than the draw fall predicts — the
residual is −0.070 ± 0.012 — so this is not only "fewer draws": games are more often decided.

**The depth-3 story, for comparison.** Under today's rules the depth-3 A/B (seed 71, `pb-ab-O-push2`)
read decisive +0.021 ± 0.029, draws −0.021 ± 0.029, white +0.001 ± 0.029 — every interval covered
zero, and that route correctly did not run depth 4. This run is the depth-4 arm that route said was
needed. The point estimate grew ~4× and now clears its interval on all three gate metrics.

**The fairness caveat.** Push raises White's score +4.3 ± 2.9 points at the shipped `OGRE_V = 300`.
The same pattern appeared at the old rules: the depth-4 A/B at 300 read white +4.9 ± 3.1 points and
the re-price at O=195 read white +0.5 ± 2.8 points with decisive still +9.0 ± 4.9. That is evidence
the White shift is the over-priced Ogre, not push, but the re-price belongs to the pre-archer game
and was not re-run here. Under today's rules the fairness question stays open.

## 4. `ogreNoCapture` at depth 3

`pb-ab-O-nocap`: `ogreNoCapture=true` against today's defaults, 1,600 games per population, depth 3
(836 s control, 1,037 s variant).

| metric | capture (base) | no capture | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.539 | +0.006 ± 0.034 | no |
| decisive | 0.795 | 0.782 | −0.013 ± 0.034 | no |
| draw rate | 0.198 | 0.213 | +0.015 ± 0.032 | no |
| capped | 0.007 | 0.004 | −0.003 ± 0.004 | no |
| mean plies | 105.0 | 99.4 | −5.6 ± 3.4 | yes |
| branching factor | 32.2 | 32.5 | +0.3 ± 0.3 | no |
| interest (min-use) | 0.449 | 0.433 | −0.007 ± 0.012 | no |

The rule is exact in the data: the Ogre's captures fall **0.81 → 0.00** per game (1,298 LAN captures
→ 0) while its shoves rise **2.84 → 3.01** (enemy shoves 0.17 → 0.50; friend shoves 2.67 → 2.51).
It survives far more games (66.8% → 76.4%) and is less used (11.57 → 9.71 moves/game); games shorten
5.6 ± 3.4 plies and kings move less often (never-moved 26.9% → 31.9%).

**Verdict.** No gate metric fires, so no depth-4 arm was played: at this size the pure relocator is
**game-shape neutral** — it neither sharpens nor deadens detectably (−1.3 ± 3.4 decisive points). It
is a clean identity reading (a piece that only moves other pieces, never removes one), and tests
hold the check/mate consequences together, but nothing in the measurement argues for it over the
shipped capture. Taste call.

## 5. `ogreShoveFriends=enemies` — depth 3 and depth 4

Depth 3 (`pb-ab-O-shoveen`, 916 s; control 976 s): decisive **−0.031 ± 0.029** clears its interval,
so a depth-4 arm was run. Depth 4 reuses run 4a's control; the variant played 1600 games in 49 m 39 s.

| metric | base depth 3 | enemies d3 | paired ±95% (d3) | base depth 4 | enemies d4 | paired ±95% (d4) |
|---|---|---|---|---|---|---|
| decisive | 0.795 | 0.764 | **−0.031 ± 0.029** | 0.676 | 0.691 | +0.015 ± 0.032 |
| draw rate | 0.198 | 0.221 | +0.023 ± 0.027 | 0.306 | 0.290 | −0.016 ± 0.031 |
| white score | 0.532 | 0.552 | +0.019 ± 0.028 | 0.509 | 0.544 | +0.036 ± 0.027 |
| capped | 0.007 | 0.016 | +0.009 ± 0.008 | 0.018 | 0.019 | +0.001 ± 0.011 |
| branching factor | 32.2 | 31.3 | −0.8 ± 0.4 | 30.9 | 29.8 | −1.1 ± 0.7 |

The counters show why the reading is mostly a mobility cut: friend shoves 2.67 → 0 per game, total
shoves 2.84 → 0.17 (d3) and 0.24 (d4), while captures stay near the base (0.81 → 0.72 d3, 0.97 →
0.92 d4) and survival rises (66.8% → 70.7% d3, 65.3% → 68.1% d4).

**Verdict.** The depth-3 decisive dip (3.1 ± 2.9 points) **does not confirm at depth 4** (+1.5 ±
3.2). What repeats is a smaller game: branching −0.8 then −1.1, and a White score shift of the same
sign and size as push's (+3.6 ± 2.7 at depth 4). A crowd-control-only Ogre is a weaker, less mobile
piece with no confirmed sharpening — not a supported reading.

## 6. `ogreShoveFriends=friends` — depth 3 and depth 4

Depth 3 (`pb-ab-O-shovefr`, 913 s; control 1,003 s) fired on two gate metrics (decisive and draws),
so the depth-4 arm ran (variant 1600 games in 48 m 41 s, shared control).

| metric | base depth 3 | friends d3 | paired ±95% (d3) | base depth 4 | friends d4 | paired ±95% (d4) |
|---|---|---|---|---|---|---|
| decisive | 0.795 | 0.818 | **+0.023 ± 0.012** | 0.676 | 0.738 | **+0.062 ± 0.021** |
| draw rate | 0.198 | 0.175 | **−0.023 ± 0.011** | 0.306 | 0.247 | **−0.059 ± 0.019** |
| white score | 0.532 | 0.535 | +0.002 ± 0.011 | 0.509 | 0.508 | −0.001 ± 0.013 |
| mean plies | 105.0 | 106.4 | +1.3 ± 1.0 | 111.9 | 115.6 | +3.6 ± 1.6 |
| branching factor | 32.2 | 32.0 | −0.1 ± 0.1 | 30.9 | 30.6 | −0.3 ± 0.1 |
| interest (min-use) | 0.449 | 0.464 | +0.006 ± 0.004 | 0.449 | 0.456 | +0.005 ± 0.005 |
| excessDecisiveness (resid.) | 0.036 | 0.000 | −0.022 ± 0.007 | 0.045 | 0.002 | −0.052 ± 0.008 |

Counters: friend shoves 2.67 → 2.68 (d3) and 2.37 (d4) — *all* shoves are friend shoves now; enemy
shoves 0.17 → 0. The Ogre captures slightly more (0.81 → 0.84 d3, 0.97 → 1.05 d4), moves slightly
more, survives a little less (66.8% → 64.7% d3, 65.3% → 60.8% d4).

**Verdict.** The only taking reading **confirmed at depth 4**: decisive +6.2 ± 2.1 points, draws
−5.9 ± 1.9, with fairness untouched (−0.1 ± 1.3 white). The residual −0.052 ± 0.008 says the
sharpening is beyond the draw drop. The mechanism is not visible in the counters — only ~0.2 enemy
shoves per game are removed — so the rule changes what the search can plan, not how often the Ogre
shoves: the shipped `both` reading already spends 92% of its shoves on friends, and *barring* the
enemy shove sharpens anyway. If the designer wants a taking-side rule, this is the measured one.

## 7. Ogre counters per arm (LAN, all stored games)

`O<from>><shovedFrom>-<shovedTo>` = shove, `O<from>x<to>` = capture. `eventShoves` is the record's
own `events.ogreShoves` — exact in every row.

| arm | games | shoves | per game | games ≥ 1 shove | max | captures | per game | eventShoves | friend shoves | enemy shoves |
|---|---|---|---|---|---|---|---|---|---|---|
| push-d4 control | 1600 | 4125 | 2.58 | 1396 (87.3%) | 12 | 1559 | 0.97 | 4125 | 3776 | 349 |
| push, depth 4 | 1600 | 5344 | 3.34 | 1482 (92.6%) | 13 | 2283 | 1.43 | 5344 | 5294 | 50 |
| no-capture control (d3) | 1600 | 4550 | 2.84 | 1415 (88.4%) | 11 | 1298 | 0.81 | 4550 | 4274 | 276 |
| no-capture, d3 | 1600 | 4816 | 3.01 | 1408 (88.0%) | 20 | 0 | 0.00 | 4816 | 4017 | 799 |
| enemies control (d3) | 1600 | 4550 | 2.84 | 1415 (88.4%) | 11 | 1298 | 0.81 | 4550 | 4274 | 276 |
| enemies, d3 | 1600 | 268 | 0.17 | 189 (11.8%) | 3 | 1155 | 0.72 | 268 | 0 | 268 |
| friends control (d3) | 1600 | 4550 | 2.84 | 1415 (88.4%) | 11 | 1298 | 0.81 | 4550 | 4274 | 276 |
| friends, d3 | 1600 | 4283 | 2.68 | 1404 (87.8%) | 10 | 1343 | 0.84 | 4283 | 4283 | 0 |
| enemies, depth 4 | 1600 | 391 | 0.24 | 235 (14.7%) | 5 | 1471 | 0.92 | 391 | 0 | 391 |
| friends, depth 4 | 1600 | 3795 | 2.37 | 1385 (86.6%) | 12 | 1685 | 1.05 | 3795 | 3795 | 0 |
| **void** `pb-ab-O-push2-d4` control | 1600 | 0 | 0.00 | 0 (0.0%) | 0 | 0 | 0.00 | 0 | 0 | 0 |

The three depth-3 controls are separate 1,600-game runs with byte-identical pooled results
(0.532 white, 0.795 decisive, 2.84 shoves), because the games are deterministic at fixed depth, seed
and arrangements — the runs are clean.

## 8. Verdicts

| reading | depth-3 gate | depth-4 confirmation | verdict |
|---|---|---|---|
| `ogreMode=push` | not resolved (from the earlier route) | decisive **+9.4 ± 3.4**, draws **−8.9 ± 3.4**, white +4.3 ± 2.9 | **confirmed sharpener**; fairness shift likely the O=300 price, not re-tested today |
| `ogreNoCapture=true` | no gate metric fires | not run (gate closed) | **neutral**; pure relocator is a taste call |
| `ogreShoveFriends=enemies` | decisive −3.1 ± 2.9 (fires) | decisive +1.5 ± 3.2 (does not confirm) | **not supported**; a weaker, smaller-branching reading |
| `ogreShoveFriends=friends` | decisive +2.3 ± 1.2, draws −2.3 ± 1.1 | decisive **+6.2 ± 2.1**, draws **−5.9 ± 1.9**, white −0.1 ± 1.3 | **confirmed sharpener** |
| `ogreShoveFriends=both` (default) | — | — | unchanged; shipped lab behaviour |

**The designer's headline question, answered:** under today's rules at depth 4, **push beats repel on
game shape** — it raises the decisive share by 9.4 ± 3.4 points and cuts draws by 8.9 ± 3.4, with the
Ogre walking into the enemy army (survival 65.3% → 48.9%) and capturing more than it did while
repelling (0.97 → 1.43). The open cost is fairness at the shipped price (+4.3 ± 2.9 to White), which
the old-rules re-price at O=195 suggests is the Ogre's price rather than the rule; that re-price was
not repeated here.

The taking rules stay lab-only, off by default; nothing in the shipped game changes. The four
depth-3 runs each played their control arm; the two depth-4 follow-ups reused run 4a's control
(same ranks, seed, depth and rules) through `--baseId`.

Data: `sim/out/pb-ab-O-push-d4b.experiment.md`, `pb-ab-O-nocap.experiment.md`,
`pb-ab-O-shoveen.experiment.md`, `pb-ab-O-shovefr.experiment.md`, `pb-ab-O-shoveen-d4.experiment.md`,
`pb-ab-O-shovefr-d4.experiment.md`, the matching `.{base,var}.report.md` and summaries, raw games in
the matching `.jsonl` files; counters `/tmp/ogre-taking/count.mjs`.

## 9. Claims checked

Every sentence above quotes a number that appears in the named report, summary or JSONL. The
rule-identity claim (`src=4be3ddab3232` for all ten arms + the void control) was re-verified by
recomputing `sourceId()` on the committed source. The LAN/event equality is exact in every row of
§7. The void run's zero-ogre claim is the 0/0/0 row, not an inference.
