# Paladin and maester buff candidates (2026-09-13)

Under the tuned engine the two pieces price at **paladin 2.21 ± 0.52** and **maester 2.18 ± 0.53** pawns against a
knight at 2.96 (`sim-tuning-2026-09-13.md` §6). The designer asked for buff options for both. This pass adds seven
toggles to the lab, prices nine candidates by odds against a knight, runs the designer's eight-cell paladin grid,
and diagnoses where the paladin's first-player edge comes from. Every buff toggle defaults to today's rule; the
three defaults that **did** change in this pass are the designer's own calls, recorded in `docs/RULES.md` §6.11–13
(one guard per army, no guard promotion, and the lab's first-move compensation rule).

## 1. What the lab gained

Ten new fields in `src/rules/rules.ts`, each defaulting to today's game, plus one that was already there.

| candidate | toggle | what it does |
|---|---|---|
| survives a pawn | `paladinKamikaze: 'nonPawn'` | it removes itself after capturing anything but a pawn |
| never dies | `paladinKamikaze: 'never'` | a friend-jumping queen that still cannot take a king |
| may check | `paladinChecks: true` | it may capture a king, so it checks and mates |
| the charge | `paladinReturn: true` | after capturing it goes back to the square it left |
| jumps enemies | `paladinBlockedByEnemies: false` | **already in the lab** — it jumps enemies as it jumps friends |
| swap anywhere | `maesterSwapAny: true` | it trades places with any friendly piece on the board |
| swap an enemy | `maesterSwapEnemy: true` | it trades places with an adjacent enemy instead of taking it, never a king |
| two steps | `maesterStep: 2` | the second square of each ray, move-only, through an empty square |
| king swap anywhere | `maesterKingSwapAnywhere: true` | the maester–king long swap stops asking for the first rank |
| blocked by friends | `paladinJumpsFriends: false` | a friendly piece stops the ray, like a normal slider |
| guard off rank 2 | `guardNoSecondRank: true` | a guard may not **end** a move on its own second rank, swaps included |
| Black opens twice | `secondPlayerDoubleFirstTurn: true` | Black's first turn is two moves; the first may not check |

`paladinKamikaze` widened from a boolean to `'always' | 'nonPawn' | 'never'`; `'never'` is the old `false`.
Two shapes are reused rather than invented: **the charge is the archer's rifle move** (`to === from`, the victim in
`captures`), so every make/unmake, the Zobrist key and the LAN round-trip already handle it and it prints
`Lf3*f6`; **`maesterStep: 2` is `guardStep: 2`**, move-only through an empty square, so no capture pattern moves and
`isAttacked` is untouched. Only `paladinChecks` changes an attack set, and it changes it in `canCapture`, which
`isAttacked` already consults — with `insufficientMaterial` taught that a paladin which may take a king can mate
with one. Eight new tests, one consequence each plus the `isAttacked`/`genPiece('attacks')` cross-check under every
toggle and under all of them at once. `paladinJumpsFriends` is the one that needed a second flag inside
`isAttacked`: with it off *and* `paladinBlockedByEnemies` off the paladin jumps enemies but not friends, so
"blocked for sliders" and "blocked for the paladin" stop being the same bit. `secondPlayerDoubleFirstTurn` is a ply
check (`pos.ply === 1`) rather than a flag on `Position`, so a FEN round-trip and the repetition key need nothing
new. **119 tests green** (102 before this pass).

## 2. Odds against a knight

300 games (150 colour-reversed pairs) an arm, depth 3, `--eloPerPawn 64`, the shipped (tuned) piece values, the
army `RNBQKBNR` with one knight replaced. The base rows are the stored `tuned-values` arms — same seed, same
openings — so the Δ column is a like-for-like comparison; its error adds the two bars in quadrature (conservative:
the arms share openings). Muller's linear band is ±1.5 pawns = **±96 Elo**; beyond it a number is a bound.

### 2.1 Paladin

| paladin rule | pentanomial | score | Elo vs knight | implied pawns | Δ vs today | draws | plies |
|---|---|---|---|---|---|---|---|
| base — today's kamikaze | [31, 25, 65, 12, 17] | 0.432 | −48 ± 33 | 2.21 ± 0.52 | — | 18.3% | 92 |
| `paladinKamikaze=nonPawn` | [29, 20, 52, 25, 24] | 0.492 | **−6 ± 36** | **2.87 ± 0.57** | +42 ± 49 | 17.7% | 93 |
| `paladinKamikaze=never` | [18, 14, 73, 16, 29] | 0.540 | +28 ± 33 | 3.40 ± 0.52 | **+76 ± 47** | 12.0% | 86 |
| `paladinChecks` | [28, 17, 52, 19, 34] | 0.523 | +16 ± 38 | 3.21 ± 0.60 | **+64 ± 51** | 12.3% | 87 |
| `paladinReturn` (the charge) | [3, 2, 38, 11, 96] | 0.825 | +269 ± 28 | **> 4.46** | **+317 ± 44** | 4.3% | 51 |
| `paladinBlockedByEnemies=false` | [14, 9, 51, 23, 53] | 0.653 | +110 ± 35 | **> 4.46** | **+158 ± 49** | 10.7% | 73 |

**`nonPawn` lands nearest a knight** (0.13 pawns under it) and is the only row whose score brackets 0.500.
`never` (3.40) and `paladinChecks` (3.21) overshoot by less than their own error bars and sit inside each other's,
so the two cannot be ranked apart on 300 games. The last two rows are off the scale: both leave the linear band, so
"> 4.46 pawns" is all the method can say, and both shorten the game by 20–40 plies.

### 2.2 Maester

| maester rule | pentanomial | score | Elo vs knight | implied pawns | Δ vs today | draws | plies |
|---|---|---|---|---|---|---|---|
| base — today's maester | [31, 30, 55, 19, 15] | 0.428 | −50 ± 34 | 2.18 ± 0.53 | — | 19.0% | 108 |
| `maesterSwapAny` | [25, 20, 56, 19, 30] | 0.515 | **+10 ± 36** | **3.12 ± 0.57** | **+61 ± 50** | 18.0% | 95 |
| `maesterSwapEnemy` | [33, 30, 52, 19, 16] | 0.425 | −53 ± 35 | 2.14 ± 0.54 | −2 ± 48 | 19.0% | 109 |
| `maesterStep=2` | [20, 20, 40, 34, 36] | 0.577 | +54 ± 37 | 3.80 ± 0.58 | **+104 ± 50** | 21.3% | 104 |
| `maesterKingSwapAnywhere` | [33, 23, 49, 27, 18] | 0.457 | −30 ± 36 | 2.49 ± 0.56 | +20 ± 49 | 21.7% | 108 |

**`maesterSwapAny` lands nearest a knight** (0.12 pawns over it). `maesterStep=2` overshoots by 0.8 — the swap is
the piece's job, but the thing that was holding it down is the single step. The other two do nothing worth the
name: `maesterKingSwapAnywhere` is +20 ± 49, and `maesterSwapEnemy` is **−2 ± 48**, which is the measurement
saying "this rule is not played".

## 2A. The paladin grid (designer request): jumps-friends x kamikaze x checks

Eight cells, the same odds match (300 games, depth 3, `--eloPerPawn 64`, knight 2.96). `J`/`B` = jumps friends
(shipped) / blocked by friends; `a`/`n` = kamikaze always (shipped) / never; `F`/`C` = cannot take a king (shipped)
/ may check. Cell **JaF is today's paladin**. Ordered by implied value.

| cell | jumps friends | kamikaze | checks | pentanomial | Elo vs knight | implied pawns | Δ vs today | identity |
|---|---|---|---|---|---|---|---|---|
| JaF | yes | always | no | [31, 25, 65, 12, 17] | −48 ± 33 | **2.21 ± 0.52** | — | **today's paladin** |
| JaC | yes | always | **yes** | [28, 17, 52, 19, 34] | +16 ± 38 | 3.21 ± 0.60 | +64 ± 51 | kamikaze charger that also mates |
| JnF | yes | **never** | no | [18, 14, 73, 16, 29] | +28 ± 33 | 3.40 ± 0.52 | +76 ± 47 | a second queen (jumps friends, no check) |
| **BaF** | **no** | always | no | [13, 19, 62, 25, 31] | +49 ± 33 | 3.73 ± 0.51 | +97 ± 47 | kamikaze charger, no jump |
| BaC | **no** | always | **yes** | [19, 13, 51, 27, 40] | +66 ± 36 | 3.99 ± 0.57 | +113 ± 49 | kamikaze charger that mates, no jump |
| JnC | yes | **never** | **yes** | [13, 7, 57, 15, 58] | +118 ± 35 | > 4.46 | +166 ± 49 | a queen that jumps its own men |
| BnF | **no** | **never** | no | [9, 10, 52, 22, 57] | +131 ± 34 | > 4.46 | +179 ± 47 | a queen that cannot check |
| BnC | **no** | **never** | **yes** | [3, 13, 45, 19, 70] | +176 ± 32 | > 4.46 | +224 ± 46 | **exactly a queen** |

**The grid's own sanity check is its last row.** `BnC` — blocked by friends, blocked by enemies, never removes
itself, may take a king — *is* a queen, and it reads the furthest above a knight of any cell. Every cell between
today's paladin and that row is a step along one of the three axes towards it.

**The surprise is the jump.** Taking it away makes the paladin **stronger**, not weaker: JaF −48 → BaF +49, a swing
of +97 ± 47 Elo, and the same +97/+113 swing shows up on the `C` column. Under kamikaze the jump is a liability, not
a gift, and the timing table below says exactly why.

| cell | first paladin move (ply) | first capture (ply) | first move crosses its own pawn rank | captures a game | survives the game |
|---|---|---|---|---|---|
| JaF (today) | 11.7 | 38.0 | 69.0% | 0.60 | 8.7% |
| JaC | 11.1 | 33.7 | 71.7% | 0.55 | 11.3% |
| JnF | 8.0 | 20.9 | 78.0% | 1.32 | 13.7% |
| JnC | 7.7 | 21.8 | 83.0% | 1.27 | 20.3% |
| BaF | **31.8** | **63.6** | **29.7%** | 0.51 | 23.3% |
| BaC | 29.6 | 54.6 | 33.3% | 0.48 | 25.7% |
| BnF | 24.5 | 42.6 | 43.7% | 1.50 | 28.0% |
| BnC | 23.6 | 38.3 | 45.3% | 1.12 | 36.7% |

**The jump is an early-development rule**: it moves the paladin's first move from ply 31.8 to ply 11.7 and its first
capture from ply 63.6 to ply 38.0, and 69% of those first moves step straight over the pawn rank. Paired with
kamikaze, moving early means **dying early**: the shipped paladin is off the board in 91% of games, the blocked one
in 77%. That is the whole −48 → +49.

### Identity across the grid

A "kamikaze charger" needs two things: it has to be able to reach something worth its own life, and losing itself
has to be the price. On that reading the cells split three ways.

- **Still a charger:** `JaF` (today), `JaC`, `BaF`, `BaC` — all keep `kamikaze: always`. `BaF`/`BaC` are a *slower*
  charger: it must be developed like a queen before it can charge, which is why it lives longer and scores better.
- **A second queen:** `JnF`, `JnC`, `BnF`, `BnC` — all `kamikaze: never`. The self-sacrifice is what makes the piece
  a paladin, and without it the army simply has two queens, one of which may or may not jump and may or may not
  check. `BnC` is a queen with no asterisk at all.
- **`paladinChecks` is orthogonal to both** and costs about +64 Elo wherever it is switched on (+64 JaF→JaC,
  +64 BaF→BaC, +90 JnF→JnC). It is the one axis that changes a *printed* rule of the piece rather than its feel.

## 3. What the counters say, and where the abuse is

Per-arm counters over the same 300 games. `L survives` / `M survives` is the share of games the piece is still on
the board at the end.

| paladin arm | captures a game | most in one game | survives |
|---|---|---|---|
| base | 0.60 | 1 (it always dies) | 8.7% |
| `nonPawn` | 1.06 | 5 | 10.3% |
| `never` | 1.32 | 5 | 13.7% |
| `paladinChecks` | 0.55 | 1 | 11.3% |
| **`paladinReturn`** | **2.80** | **7** | **51.3%** |
| jumps enemies | 0.91 | 1 | **1.7%** |

**The charge is a snowball, and the counters name it**: 2.80 captures a game against today's 0.60, up to seven in
one game, and the paladin is alive at the end of every second game. It never has to leave its square, so it cannot
be traded, chased or blocked — only screened by an enemy piece it would rather shoot.

```
# pb-L-return game 252, white paladin b1, black resigns on ply 20
5.Ld3*h7  7.Ld3*d6  9.Ld3-f3  11.Lf3*f6  13.Lf3*h1  15.Lf3*f7  17.Lf3*c6  19.Lf3*b7
# seven pieces removed from two squares; the paladin never moved after ply 9.
```

Jumping enemies is the opposite failure — the paladin still dies (1.7% survive), but it dies for a queen, from the
opening, through the whole wall:

```
# pb-L-jump game 2, from the start position; black resigns on ply 11
1.Lb1-d3  2.b7-b6  3.h2-h4  4.a7-a5  5.Ng1-f3  6.Ng8-f6  7.Ld3xd8  8.Nb8-c6
# d3-d8 crosses d7 and the whole pawn line: a paladin-for-queen trade nobody can prevent.
```

`nonPawn` snowballs mildly and legibly — it lives on pawns and dies on anything else, which is the same bargain the
piece makes today, priced one step cheaper:

```
# pb-L-nonPawn game 8: two pawns, then it is still a paladin
Lb1xb7 … Lb7xd7
```

`paladinChecks` leaves the counters alone (0.55 captures a game against today's 0.60 — it still dies) and changes
the *endings* instead. The base arm reaches **no checkmate at all** in 300 games, 245 adjudicated resignations and
9 repetitions; the `paladinChecks` arm has **two mates, both delivered by a paladin**, and one repetition. Both are
the same picture, and it is a Fool's-mate analogue — the first two black moves below are random opening plies:

```
# pb-L-checks game 216, mate on ply 5
1.Ng1-f3  2.f7-f5  3.Lb1-g1  4.h7-h5  5.Lg1-g6#
# g1-g6 jumps White's own g2 pawn; f7 is empty, so g6 hits e8 down the diagonal and f7 with it.
# d7/e7/f8/d8 are Black's own men: no flight, no capture of g6, no block on f7.
```

It is the rulebook's own reason for the rule, seen from the other side: the paladin never checking is what lets a
king shelter behind its own pieces while a queen-ranged jumper is on the board.

| maester arm | swaps a game | long swaps a game | survives | repetition / 50-move / ply cap |
|---|---|---|---|---|
| base | 3.67 | 0.68 | 28.7% | 5.0% |
| `maesterSwapAny` | 6.10 | 0.44 | 22.0% | 3.0% |
| `maesterSwapEnemy` | 3.67 | 0.67 | 27.7% | 4.7% |
| `maesterStep=2` | 2.83 | 0.44 | 24.3% | 3.0% |
| `maesterKingSwapAnywhere` | 3.89 | 0.88 | 26.3% | 4.3% |

**No swap loop.** The draw-by-repetition, 50-move and ply-cap share *falls* under both swaps (5.0% → 3.0%), and the
longest run of consecutive maester moves by one side drops from 15 (base) to 10. A swap that moves a friendly piece
to a useful square is a developing move, not a shuffle; the engine spends it and moves on.

**`maesterSwapEnemy` is inert at this depth, and the replay proves it**: replaying all 300 games under the rule
finds **one** enemy swap in 300 games — and its victim was a **guard**, the one enemy a maester may not capture.
Only 16 of 300 games diverge from the base at all, and the first divergence in each is a knight move, i.e. a search
artefact and not a played swap. Trading places with an enemy you could simply take is a material loss; the only
position where it pays is the immortal wall.

```
# pb-M-swapEnemy game 118 — the single enemy swap in 300 games
Me6<>e5   # e5 held a guard: the one enemy the maester cannot remove
```

`maesterSwapAny` is played hard: **1363 swaps at distance > 1 over 300 games** (4.5 a game) against the base's 0.68
king swaps. The king long swap itself falls (0.68 → 0.44) because the maester now has 15 other pieces to trade with.

## 4. A/B against today's game — what was and was not run

The campaign's compute budget was ~2.5 hours on a machine two other campaigns were already running on: the load
average sat between 50 and 85 on 16 cores, and the throughput was **1.2–2.3 games/s on 8 workers**, against the
10–11 games/s the same runs got on an idle box. The brief's 40 ranks × 100 games (4 000 a variant) was therefore
re-sized to **40 ranks × 40 (1 600 a variant)**, and then three later designer requests arrived mid-campaign and
re-ordered the queue. What actually ran, and what did not:

| planned | ran | why |
|---|---|---|
| A/B control, today's game, 40 ranks | **1 544 of 1 600 games** (`pb-ab-base`) | stopped to free the machine for the paladin grid |
| A/B `paladinKamikaze=nonPawn` | **not run** | the grid took priority |
| A/B `maesterSwapAny` | **not run** | the grid took priority |
| A/B `paladinChecks`, `maesterStep=2` | **not run** | cut when the grid arrived |
| paladin grid, 8 cells × 300 odds games | **ran, all 8 complete** | §2A |
| `QRRBBNNL` White-score diagnostic, 8 cells × 4 000 | **1 cell pair, 800 a side** (§4.1) | 32 000 games needs ~7 h at this throughput |
| `secondPlayerDoubleFirstTurn`, two pools × 4 000 | **not run** (rule implemented and tested) | no budget left |

**Every recommendation below therefore rests on the odds matches and the per-arm counters, not on an A/B.** The
degeneracy evidence in §3 comes from replaying the odds games themselves, which is weaker than a 40-rank A/B for
draw rates and interest, and just as strong for "does this rule create a tactic nobody can answer".

### 4.1 Why the paladin favours White

The designer's hypothesis was that the paladin's first-player edge comes from **jumping over friendly pieces** — it
can attack before the pawns are developed. The timing table in §2A says the first half of that is exactly right and
the second half is backwards.

**The jump is unambiguously an early-attack rule.** With it, the paladin's first move comes on ply **11.7** and
crosses its own pawn rank **69%** of the time; without it, ply **31.8** and **29.7%**. Nothing else in the grid
moves those numbers as far — `paladinChecks` moves the first move by 0.6 of a ply.

**But early attack is a cost, not a benefit, while the piece is a kamikaze.** The same swing that halves the
paladin's development time also halves its life: it captures once (0.60 a game) and is gone in 91% of games,
against 77% when blocked. Priced against a knight the blocked paladin is **+97 ± 47 Elo stronger** than today's.
So if the paladin hands White an edge, it is not because the jump makes it strong — the jump makes it weak. The
mechanism has to be *tempo*: White jumps first, and the first favourable kamikaze trade is White's to take.

That is the reading the paired run below tests directly, on the pool `QRRBBNNL` where every drawn rank carries a
paladin.

**The paired run: `QRRBBNNL`, 40 ranks, 800 games an arm, common random numbers, depth 3.** The sampler draws 7 of
the 8 letters plus the king, so 35 of the 40 ranks carry the paladin and 5 do not — which turns out to be the most
useful column in the table, because those 5 are a built-in control.

| | today's paladin | `paladinJumpsFriends=false` | paired difference ±95% |
|---|---|---|---|
| White score, all 40 ranks | 0.554 | 0.551 | −0.004 ± 0.039 |
| **White score, the 35 ranks with a paladin** | **0.561** | **0.556** | **−0.004 ± 0.045** |
| White score, the 5 ranks without one | 0.510 | 0.510 | (identical games) |
| decisive | 0.846 | 0.816 | −0.030 ± 0.037 |
| draw rate | 0.149 | 0.179 | +0.030 ± 0.038 |
| capped | 0.005 | 0.005 | +0.000 ± 0.008 |
| mean plies | 90.8 | 99.2 | **+8.4 ± 3.6** |
| branching factor | 31.4 | 29.4 | **−2.0 ± 0.5** |
| interest (resid.) | 0.002 | 0.011 | −0.002 ± 0.006 |

**The paladin's edge is real and it is not the jump.** A rank with a paladin gives White **0.561**; the same run's
five paladin-free ranks give **0.510**, so the piece is worth about **+0.05 of White's score** (~35 Elo), which
reproduces the designer's +25–30. Taking the jump away leaves it at **0.556**: the paired difference is
**−0.004 ± 0.045**, nowhere near the ~0.05 fall to the no-paladin level the hypothesis predicts. What the jump does
change is the *shape* of the game — 8.4 plies longer and 2.0 fewer legal moves a position without it.

**Honest limit on this row.** ±0.045 cannot resolve a 0.03 shift; it can only reject the full one. Answering
"is it the jump or the first kamikaze trade?" to the precision the designer quoted (±0.009) needs about 10 000
games an arm per cell — roughly four hours a cell at this campaign's throughput, and eight cells were asked for.
**The `paladinKamikaze='never'` half of the diagnostic was not run at all.** What the grid already settles is that
the jump does not make the paladin *strong*: blocked, it is +97 ± 47 Elo stronger. So if the edge is a tempo, it is
the tempo of the first favourable trade, and the kamikaze cell is the one to run next.

## 5. Recommendation

**Paladin — `paladinKamikaze: 'nonPawn'`.** It lands at **2.87 ± 0.57** pawns, nearest a knight of any candidate
(0.13 under it) and the only arm whose score brackets 0.500. It keeps the piece's identity exactly: the paladin
still buys everything worth buying with its own life, and a pawn stops being worth a paladin. Its snowball is
mild and legible (1.06 captures a game against today's 0.60, survival 8.7% → 10.3%) and no new tactic appears.

**Maester — `maesterSwapAny: true`.** It lands at **3.12 ± 0.57** pawns (0.12 over a knight) and generalises the
verb the piece already owns; the king keeps today's first-rank condition, so the castling echo survives. No swap
loop appeared — the repetition/50-move/ply-cap share *falls* from 5.0% to 3.0% and the longest run of consecutive
maester moves drops from 15 to 10.

**Identity changes the designer must rule on, not me:** `paladinChecks` (3.21) deletes a printed rule and adds mate
by paladin; `paladinKamikaze='never'` (3.40) and `paladinJumpsFriends=false` (3.73) each delete one of the piece's
two defining clauses; `maesterStep=2` (3.80) stops the maester being a one-stepper. All four are inside or just
outside a knight, so they are live options if the designer wants the identity moved — they are not rejected on
strength.

**Do not ship, on the evidence here:** `paladinReturn` and `paladinBlockedByEnemies=false` (both > 4.46 pawns, both
with a named abuse pattern in §3) and `maesterSwapEnemy` (one enemy swap in 300 games).

## 6. Which candidates change the piece's identity

The rulebook paladin is "a queen that jumps friends, is stopped by enemies, cannot take a king, and removes itself
after capturing". The rulebook maester is "a one-step piece that captures adjacent, swaps with an adjacent friend,
and swaps with its own king along the first rank".

| candidate | identity |
|---|---|
| `paladinKamikaze=nonPawn` | **intact.** The self-sacrifice is still the price of every capture that matters; a pawn stops being worth a paladin. |
| `paladinKamikaze=never` | **changed.** Deletes the sacrifice, which is the piece's whole bargain. It becomes a friend-jumping queen. |
| `paladinChecks` | **changed**, and the designer was told so in the brief: "cannot take a king, so never gives check" is a printed rule, and mate by paladin is a new ending. |
| `paladinReturn` | **changed.** Replaces the sacrifice with immunity; on the board it is an archer with a queen's range. |
| `paladinBlockedByEnemies=false` | **changed.** "Blocked by enemies" is the counterplay the jump over friends is priced against. |
| `maesterSwapAny` | **intact.** The swap is the piece's verb and the long swap already exists; this drops the range limit on it. The king keeps today's first-rank condition. |
| `maesterSwapEnemy` | **changed** (a new verb: moving enemy pieces), and unmeasurable besides. |
| `maesterStep=2` | **changed.** The maester stops being a one-stepper, which is what it shares with the king and what the swap is priced against. |
| `maesterKingSwapAnywhere` | **intact but weakened flavour.** "Both at home" is the castling echo; without it the swap is a rescue at any moment. |

## 7. Commands

```
npm run sim -- --id pb-L-nonPawn --experiment values --pieces L --games 300 --depth 3 --seed 1 \
  --workers 5 --eloPerPawn 64 --rule paladinKamikaze=nonPawn
#  same line, --rule tail only: pb-L-never paladinKamikaze=never · pb-L-checks paladinChecks ·
#  pb-L-return paladinReturn · pb-L-jump paladinBlockedByEnemies=false · and with --pieces M:
#  pb-M-swapAny maesterSwapAny · pb-M-swapEnemy maesterSwapEnemy · pb-M-step2 maesterStep=2 ·
#  pb-M-kingAny maesterKingSwapAnywhere.  Base rows: the stored tuned-values.L / .M arms (seed 1).
npm run sim -- --id pb-ab-L-nonPawn --experiment ab --games 1600 --sample 40 --depth 3 --seed 21 \
  --workers 8 --baseId pb-ab-base --rule paladinKamikaze=nonPawn
#  same line, --rule tail only: pb-ab-M-swapAny maesterSwapAny · pb-ab-L-checks paladinChecks ·
#  pb-ab-M-step2 maesterStep=2.  The control pb-ab-base is played once and resumed by the rest.
npm run sim -- --id pb-g-Baf --experiment values --pieces L --games 300 --depth 3 --seed 1 \
  --workers 8 --eloPerPawn 64 --rule paladinJumpsFriends=false
#  the grid's other new cells, --rule tail only: pb-g-JnC paladinKamikaze=never paladinChecks ·
#  pb-g-Bnf paladinJumpsFriends=false paladinKamikaze=never · pb-g-BaC paladinJumpsFriends=false
#  paladinChecks · pb-g-BnC all three.  Cells JaF/JnF/JaC are the runs above.
npm run sim -- --id pb-lp-nojump --experiment ab --games 800 --sample 40 --pool QRRBBNNL --depth 3 \
  --seed 41 --workers 8 --baseId pb-lp-base --baseRule promotionSet=anyNonKing \
  --rule paladinJumpsFriends=false
npx tsc --noEmit && npx vitest run && npm run dashboard
```

`--baseRule promotionSet=anyNonKing` on the last line is not cosmetic: the guard promotion ban (`docs/RULES.md`
§6.13) landed **mid-campaign**, so that run pins both of its arms to the promotion set its control had already
played. Every other run in this document predates the ban and predates the one-guard pool (§6.11) — none of them
draws from `POOL` anyway: the odds arms use `RNBQKBNR` and the diagnostic uses `--pool QRRBBNNL`.

## 8. What this does not show

- **The engine prices a buffed piece at its old value.** Both odds arms use the shipped `src/ai/eval.ts`
  (L = 318, M = 291 cp), so a search that owns a buffed paladin trades it away too cheaply. Every buff row is
  therefore a **lower bound** on the buff. Re-seeding the values and re-measuring is the next pass, and it matters
  most for the rows that moved most.
- **Depth 3, one ply.** `maesterSwapEnemy` reads as inert; a deeper search that can see two moves further might
  find the positional swap this one cannot. The guard displacement it did find is the pattern to look for.
- **The odds army is `RNBQKBNR` with one knight replaced**, so a buffed paladin never meets a second fairy piece.
  The A/B is what adds them back.
- **Two code paths outside this campaign's ownership have not caught up.** `src/sim/tune.ts` reads
  `RULES.paladinKamikaze` as a truthiness test (`parseLan`, line ~291): now that the field is a string, `'never'`
  reads as true, so a tuning sample replayed under that rule would mark a surviving paladin as removed. Its owner
  needs `=== 'always'` (plus the `nonPawn` and `paladinReturn` cases). And `src/ai/search.ts` alternates colours
  inside its own tree, so it cannot search `secondPlayerDoubleFirstTurn`'s double move; with the default four
  random opening plies the double falls inside the random opening, which makes any measurement of that rule a
  **lower bound** on the compensation (a chosen extra move is worth more than a random one). Neither file was
  touched: they belong to other campaigns.
- **The two out-of-band rows are not priced.** `paladinReturn` and jumping enemies both left Muller's linear band;
  "> 4.46 pawns" is a direction, not a value, and neither was A/B-ed because neither is a candidate.
