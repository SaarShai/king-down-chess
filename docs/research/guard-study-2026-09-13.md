# The immortal guard — what it does, and what it costs (2026-09-13)

The guard stays immortal — the designer's decision and the piece's identity (`docs/RULES.md` §6.9): a
wall that never captures, and that only a king can remove. This asks **A.** which strategies use that
wall and **B.** whether it hurts fun. It reads **76 000 recorded games**, plays **9 new runs, 16 000
games**, and proposes no change to the guard's identity.

## 1. Method

`tools/guard-study.ts` replays each stored game's LAN list on a plain 64-byte board: every LAN string
holds the from square, the to square and each victim, so the replay needs no move generator and no
import from `src/`. `--verify` checks it against the runner's own survival census — 2 004 games, **0
piece-count mismatches**.

**Which runs qualify is read from the moves, not the stored spec.** A spec that records `rules: {}`
played whatever `DEFAULT_RULES` held on the day, and the guard defaults changed twice.
Every `b3-*` run records an empty diff and its guards still capture 1.1 to 2.6 pawns a game, so batch
3 measured the lab's capturing guard and **none of it belongs here**. `--list` classifies a run by
four LAN signatures: a guard capture, a guard step of 2, a guard taken by a non-king, an archer's
diagonal step. **Pool A** — shipped guard, v0.6 archer and beast: 6 runs, 24 000 games, 31 800 of
48 000 side-games hold a guard (`abb-base`, `ab-buffed40.var`, four `ab-r4-*` arms with one unrelated
rule off each). **Pool B** — shipped guard, 2017 pieces: 16 runs, 52 000 games, 76 880 of 104 000
(`cfg-*`, `sweep-p2/d3`). A result counts only when both pools agree on its sign.

The unit is the **side-game**: one side of one game, sampled every 8th ply and every ply of the last
20. **The control is always a side that holds a guard and does not show the pattern**, never a side
with no guard — otherwise every row would re-measure what a guard costs.

## 2. What the guard does — pool A / pool B in each cell

| pattern | what the tool counts | share of guard sides | score with | score without | draw with | draw without |
|---|---|---|---|---|---|---|
| **shield** | guard next to its own king while the enemy holds attackers | **86.3% / 82.0%** | 0.493 / 0.491 | 0.544 / 0.542 | 33.2% / 46.7% | 29.0% / 32.0% |
| **blocker** | guard on an enemy slider's ray with a friendly piece behind it | 30.4% / 28.9% | **0.448 / 0.447** | 0.523 / 0.522 | 32.6% / 39.8% | 32.6% / 45.8% |
| **gSwap** | a maester swaps with a guard (the wall shifts one square) | 23.3% / 26.3% | 0.481 / 0.489 | 0.506 / 0.504 | 38.3% / 55.5% | 30.9% / 39.9% |
| **promoDeny** | guard on the enemy's promotion rank, enemy pawn ≤ 3 ranks away | 20.2% / 20.9% | 0.485 / 0.487 | 0.504 / 0.503 | 33.2% / 43.3% | 32.5% / 44.2% |
| **wall** | two guards side by side, both within 2 squares of the king | 15.9% / 18.7% | 0.460 / 0.475 | 0.508 / 0.506 | **39.5% / 55.6%** | 31.3% / 41.4% |
| **lastThree** | a guard among a side's last 3 pieces | 11.5% / 7.8% | **0.269 / 0.286** | 0.530 / 0.518 | 35.1% / 42.7% | 32.3% / 44.1% |
| **anvilArcher** | a friendly archer shoots a piece that stands next to the guard | 8.3% / 8.6% | **0.528 / 0.511** | 0.497 / 0.499 | 33.1% / 52.5% | 32.6% / 43.2% |
| **anvilBeast** | a beast chain takes a piece that stands next to the guard | 1.0% / 0.3% | **0.606 / 0.595** | 0.499 / 0.500 | 27.1% / 44.8% | 32.7% / 44.0% |
| **escort** | guard next to a friendly pawn past the half-way line | 0.6% / 1.2% | 0.505 / 0.522 | 0.500 / 0.500 | 28.0% / 51.1% | 32.6% / 43.9% |
| **escortPromo** | an escorted pawn later promotes | 0.2% / 0.2% | **0.673 / 0.879** | 0.500 / 0.499 | 8.2% / 14.5% | 32.6% / 44.1% |

Score and draw rate belong to the side that shows the pattern. First occurrence by phase (pool A):
the shield starts in the **opening** (16 238 before ply 30, 9 649 by ply 90, 1 547 later), the
blocker and the wall in the **middle**, the escort and the salvage at the **end**. **6.5% of 9 541
promotions choose a guard** (8.6% in pool B), so the engine pays a queen's worth of promotion for a
blocker nothing can take. **The maester can never teleport the wall far**: 21 412 maester-guard swaps,
**0 of them long**, because the long swap is maester-with-own-king only. **A guard never blocks its
own archer**: `genPiece` case A builds the shot list with `step()` and never walks the ray, and in
`abb-base` 2 276 of 10 437 shots fly over a **friendly** blocker.

Three confounds sit under every row. **Length**: a side that shows the shield plays 138 plies against
98, and long games draw — but in a length-matched band (80–220 plies) every sign holds and the shield
gap widens, 0.493 against 0.557. **Trouble**: `lastThree` and `promoDeny` mark a side that already
loses. **Selection**: `escortPromo` scores 0.673 because a side that promotes wins, not because a
guard walked with it; §4 tests that link directly, and it does not hold.

## 3. Examples

Each LAN line starts two plies before the marked ply. `--examples 4` prints four games per pattern;
`--fen <run>:<id>:<ply>` prints any position.

**Wall** — `ab-buffed40.var` #5, ply 40. White's guards stand on d2 and e2, in front of Kd1; no black
piece can ever remove either. `Gf1-e2 h7-h5 Rh1-f1 Rh8-h6 Sf3-e3`
`1k1pggsr/p2m2p1/8/1b2p2p/4P3/1PL2SP1/2PGG2P/3KM2R w - - 0 21`

**Anvil, archer** — #115, ply 48. Black's guard on e7 holds the square the white rook needs, and the
archer on g7 shoots the rook on f8. `Rf1xf8 Ag7*f8 d3-d4 c5xd4 Ae3*d4`
`k6s/p3g1a1/3m4/2pP2pp/1pP1L1b1/3PA3/PPM1G1SP/1K6 w - - 0 25`

**Anvil, beast** — #475, ply 80. The beast eats six pieces in one turn along a rank the guards froze:
`Se6xd6xe5xf4xg3xh2` `1k6/pmga2p1/1p1Ps3/2p1Pb1p/2P2P2/rR1M2P1/P3AG1S/4K3 w - - 0 41`

**Dead end** — `abb-base` #223, drawn on material after 136 plies. King and guard face king and
guard. `8/2g2k2/8/8/8/K7/4G3/8 w - - 0 69`

## 4. Targeted runs

Depth 3, `commonSeeds: true`, so a pair's arms play the same openings; each placement pair holds **one
army** and moves only the guard, the escort pair holds **one position set** and moves one guard
square. The error bar belongs to the rank or position (`se = sd(arm means)/sqrt(40)`); a row is a
finding when `|Δ| > 2 × sqrt(se_a² + se_b²)`.

| pair, arm − control | Δ score | Δ decisive | Δ draw | Δ capped | Δ dead | Δ plies |
|---|---|---|---|---|---|---|
| **guard ≥ 4 files from the king − guard beside it** (`QRRBAGM`, 40 ranks × 60) | +0.011 | **+0.097 \*** | **−0.097 \*** | **−0.030 \*** | −0.006 | **−17.3 \*** |
| **guard escorting a passer − guard at home** (40 endgame positions × 60) | −0.029 | −0.014 | +0.013 | +0.001 | **+0.033 \*** | +3.3 |
| **`guardStep=2` − `guardStep=1`** (40 full-pool ranks × 50) | +0.002 | −0.042 | +0.042 | **+0.016 \*** | **+0.016 \*** | **+10.3 \*** |

**Move the guard away from the king and the game decides itself.** At one army and one set of
openings, a guard that starts four files or more from its king turns 65.4% decisive into 75.1%, cuts
the capped share 4.5% → 1.5%, and ends the game 17 plies sooner; **balance does not move**
(+0.011 ± 0.024). **The escort does not work**: the mine says an escorted pawn that promotes scores
0.673, the causal test says the formation is worth −0.029 ± 0.035 to the side with the passer and
**doubles** the dead endings, 4.8% → 8.2%. The guard walks up the board, cannot be traded, and the
ending dies.

## 5. Does immortality hurt fun?

### 5.1 Guards at a matched army value

`b3-guard0/1/2` cannot answer this: those runs played the capturing guard (§1). **`gs-g0/1/2`** replays
their ranks, seeds and openings with the shipped guard spelled out — 800 games an arm, A → G at about
27 pawns.

| guards | score | decisive | draw | capped | dead endings | plies |
|---|---|---|---|---|---|---|
| 0 | 0.528 ± 0.014 | 0.723 ± 0.012 | 0.278 ± 0.012 | 0.003 ± 0.002 | 0.010 ± 0.004 | 112 ± 1.6 |
| 1 | 0.535 ± 0.013 | 0.735 ± 0.016 | 0.265 ± 0.016 | 0.011 ± 0.004 | 0.025 ± 0.004 | 116 ± 2.5 |
| 2 | 0.500 ± 0.016 | 0.635 ± 0.017 | 0.365 ± 0.017 | 0.031 ± 0.005 | 0.040 ± 0.008 | 123 ± 3.2 |

Two immortal guards cost **8.8 points of decisiveness**, add **8.8 draw points**, **2.9 capped
points**, **3.0 points of dead endings** and **11 plies**; every one flags, balance does not move, and
**the capped share stops at 3.1%, inside the 5% gate.**

**Immortality is not what drags the game.** The same ranks and openings under batch 3's guard
(`guardCaptures=pawns`, `guardStep=2`, `guardCaptureLimit=1`) read 0.371 decisive, 62.9% draws,
**17.0% capped**, 165 plies. The shipped wall is **+26.4 decisiveness points**, **−13.9 capped
points** and 42 plies shorter, at the same balance. Reach and a taste for pawns drag; immunity does
not. Two older sources price a guard three times higher (`sim-configs` §4 at +9.3 draw points each,
`sim-mining` §3 at +5.0) and both measured the **2017** archer and beast: **the v0.6 buffs already
paid most of the guard's draw debt.**

### 5.2 The interest score cannot see the guard

Each term's contribution (weight × value) over the ladder's 800 shared games; `fairyUse` and
`excessDecisiveness` are flat here and folded into the total.

| term | 0 guards | 2 guards | batch 3's capturing guard | Δ (0 → 2) |
|---|---|---|---|---|
| killer move | 0.0736 | 0.0681 | 0.0503 | **−0.0055** |
| drama | 0.0187 | 0.0138 | 0.0081 | **−0.0048** |
| uncertainty (late) | 0.0852 | 0.0855 | 0.0843 | +0.0003 |
| permanence, lead change | 0.0548 | 0.0552 | 0.0640 | +0.0004 |
| **total interest** | **0.4931** | **0.4834** | **0.4675** | **−0.0097** |

Interest falls 0.010 where decisiveness falls 8.8 points, and 0.016 over a 26-point gap; §4's shield
pair moves it +0.005 over a 9.7-point gap. The loss sits in the **killer move** and the **comeback**,
and **uncertainty (late) does not move**, because a frozen ending reads as an open one. **Judge the
guard on decisiveness and the capped share, not on the interest score.**

### 5.3 Guard drag

Of pool A's 7 023 drawn games, **63.9%** hold a guard on a key square in the last 20 plies (68.6% in
pool B), **12.3%** keep a guard among a side's last 3 pieces (8.6%), and **4.1%** end with a bare
king and guard (2.6%). The sharpest number is the salvage — every side two pawns or more behind, 20
plies before the end. In pool A it scores 0.130 and draws **8.7%** of the time without a guard
(n 3 718) and 0.167 and **18.5%** with one (n 7 081); pool B reads 0.169 / 18.8% against 0.216 /
28.1%. **+9.8 and +9.3 draw points for the losing side** — draw insurance it can always buy.

### 5.4 `guardStep=2`

`gs-step2` against `gs-step2-base`: one seed, one list of 40 ranks, 2 000 games an arm. **Balance does
not move** (+0.002 ± 0.027, which repeats `RULES.md` §6.9's +1 ± 45 Elo) and decisiveness does not
flag (−0.042 ± 0.044). The drag does: **the capped share doubles, 1.65% → 3.25%**, dead endings
double, 1.75% → 3.30%, the game runs 10 plies longer, and interest falls 0.003. **A wall with reach is
a better wall**, so the two-step guard makes the game slower, not sharper. §5.1 agrees from the other
side. Do not adopt it.

### 5.5 `guardNoKingShield` — a proposal, not a run

The runner cannot express "a guard may not stand next to its own king": `Rules` holds no such field,
`parseRule` rejects an unknown key, and this task must not touch `src/`. The rule needs one field in
`rules.ts` and one line in `genPiece` case G. The case is strong: the shield is the **most common**
guard pattern (86.3% of guard sides), it starts in the opening, and the two-guard wall is the
**drawiest** row in §2. §4's `gs-shield-*` pair is only a proxy — a guard that starts far from its king
may still walk back.

## 6. Recommendations

1. **Leave `GG` in the pool, and do not buy batch 3's cure.** Two immortal guards cost 8.8
   decisiveness points and cap 3.1% of games, inside the 5% gate (§5.1). "The guard is the draw engine"
   was measured on the 2017 pieces and on the capturing guard — the same ranks read 17.0% capped with
   that guard against 3.1% with the wall. Re-check if the archer or the beast is ever trimmed.
2. **Re-fit `SHIELD_GUARD`.** `src/ai/eval.ts` pays **25 cp** for a guard in front of the king, against
   9 for a pawn and 5 for any other piece, and the Texel fit that set it ran on `tune-data` — 24 000
   games with `guardCaptures=pawns`, `guardStep=2`, `guardCaptureLimit=1`. **The engine's largest guard
   term was fitted on a different piece**, and it buys §4's drawiest setup.
3. **Add three guard terms**, in order of measured payoff: a penalty for a guard beside its own king
   after the opening; a bonus for a guard beside an enemy piece a friendly archer or beast attacks
   (+0.03 to +0.11 score); a penalty for a guard among a side's last three pieces (0.27 score), lifted
   when that side is behind, where the wall is the right draw try.
4. **Test `guardNoKingShield` next** (§5.5); §4 wins +9.7 decisiveness points from the start square
   alone, and the rule holds that square shut all game. **Reject `guardStep=2`** (§5.4), and never
   pair it with `guardCaptures` — `LESSONS.md` records that pair as a pawn harvester in 44% of games.
5. **Say in the UI what the wall is for.** Three hints, each from a row above: "only a king takes a
   guard"; "a guard beside your own king makes a draw more likely"; "a guard beside an enemy piece
   helps your archer shoot it". Warn on a guard promotion: 6.5% take one, and a guard cannot mate.

## 7. Files and commands

```
npx tsx tools/guard-study.ts   # the mine; --list --specs --verify --shots <run> --fen <run>:<id>:<ply>
npm run sim -- --spec sim/specs/guard/<id>.json --workers 8 && npm run sim:analyze -- --id <id>
```
Specs `sim/specs/guard/*.json`, games `sim/out/gs-*.jsonl`. `gs-wall-front/split` (two guards side by
side against two on opposite wings) are written and unplayed — two other campaigns held the machine
at 1 to 2 games/s. **Limits**: every number is depth 3; the mined patterns are correlations inside
one engine's play, not a human's; §4 is the only causal test, and it reaches three of ten patterns.
