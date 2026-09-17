# The Ogre and the Catapult — built and measured (2026-09-14)

Saar picked two of the five pieces in `docs/PIECES-PROPOSED.md` and asked for two readings of each:
the **Ogre** (letter `O`) may shove a neighbour instead of moving, and either stays put (`repel`) or
follows the piece it shoved (`push`); the **Catapult** (letter `C`) takes by lobbing over one enemy
screen, and either fires from where it stands (`stay`) or moves onto the square it cleared (`land`).

Both are **lab pieces**. They are not in the shipped pool `QLRRBBNNAAGMMSS`, no default changed, and
no shipped game can contain one. They reach a board only through `--pool`, an explicit back rank, or
a `?fen=` in the browser.

This pass built them, tested them, and played **13 600 games** at depth 3: an odds match for each of
the four variants, a piece-against-no-piece comparison on 40 mirrored back ranks, and a paired A/B
of each piece's two readings.

---

## 0. The short version, in plain words

Both pieces work. **The Ogre's useful reading is the pushing one**: as a self-play composition it
drags draws (−6.5 ± 2.7 decisive points against a knight control), but pushing gives back
+5.3 ± 3.0 decisive points and −5.9 ± 3.0 draw points against the shield-shape `repel` the engine
ships as the toggle default. The Catapult is **unresolved between its two readings**: `land` halves
how often it fires and the A/B's intervals (`+1.6 ± 2.8` score, `−0.9 ± 2.8` decisive) cover zero.
The shove that motivates the Ogre — moving a **guard** out of the way — happened in **1.95% of games**
in the composition run and **2.9%** with `push`: real, but rare, and it is not where the piece's value
comes from. Both pieces stay lab-only; the next decision is a re-seeded value pass and one depth-4
confirmation of `push` (about 25 minutes), scheduled after the Q6 chain. Details below.

---

## 1. What the lab gained

Two piece types (`O` = 12, `C` = 13) and two rule toggles, each defaulting to the reading Saar named
first. Nothing else moved: `DEFAULT_RULES` keeps every value it had, `POOL` is unchanged, and a pawn
still never promotes to either piece — the promotion list is the same nine letters as yesterday.

| toggle | values | what it does |
|---|---|---|
| `ogreMode` | **`repel`** \| `push` | after a shove the Ogre holds its square, or steps into the one the shoved piece left |
| `catapultCapture` | **`stay`** \| `land` | the lob is fired from the Catapult's square, or it moves onto the target's |

**The Ogre.** Moves and captures one square in any direction — an ordinary capturing piece, so it may
take a king and may not take a guard, both of which `canCapture` already decided for every piece.
Instead of moving it may shove one adjacent piece, friend or enemy, one square straight away from
itself onto an empty square on the board. Never a king of either colour; a guard very much included,
which is the point of the piece. A shove is not a capture and creates no attack, so `isAttacked` sees
only the eight neighbours. Ordinary legality applies: a shove that would leave your own king in check
is illegal, and a shove that opens a line onto the enemy king is a discovered check and is legal.

**The Catapult.** Moves like a rook through empty squares and never takes by moving. To take, it
walks a rank or file: the first piece it meets must be an **enemy** — the screen — and the first piece
beyond that, at any distance through empty squares, is the target if `canCapture` allows it. A king
yes, so it checks through a screen; a guard no. The enemy-screen clause is what keeps it silent at
the start, where every line begins with a friend.

### 1.1 What it cost in code

One new move shape, `Move.shove: { from, to }`, and one new branch in each of the three places a move
is applied (`makeMove`, and the search's `apply` / `applyQuiet`). The shoved piece is written *before*
the mover, which is the whole trick: under `push` the Ogre lands on the square the piece just left, so
writing the mover first would undo the shove. Nothing else in make/unmake had to learn the rule.

Three shapes were reused rather than invented:

- The Catapult's `stay` lob is **the archer's rifle move** (`to === from`, the victim in `captures`),
  so every make/unmake path, the Zobrist key, the undo log and the notation already handled it. It
  prints `Cc1*c5`. Its `land` reading is a plain displacement capture and prints `Cc1xc5`.
- The Ogre's own square is always `Move.to` — equal to `from` under `repel`, equal to the shoved
  piece's square under `push` — so no code outside `genPiece` reads `ogreMode` at all.
- `zIndex` in `src/ai/zobrist.ts` now sizes its table from the type count instead of a literal 12.
  The keys are drawn in the **old** order — the eleven original types, the turn key, the spent-guard
  half, and only then the two new types — so every key a board without an Ogre, a Catapult or a spent
  guard uses is bit-identical to yesterday's. Checked directly: 2 816 keys, zero mismatches. A stored
  run still replays move for move.

The notation is `Oe4>f5-f6` — "the Ogre on e4 shoves the piece on f5 to f6". It names where the
*shoved* piece went, and the Ogre's own square follows from `ogreMode`, exactly the way a paladin's
`selfRemove` follows from `paladinKamikaze` in the same parser. **Design decisions taken here, one
sentence each**, because they were not in the brief:

1. A pawn never promotes to an Ogre or a Catapult (they stay out of `PROMOTIONS`), because adding
   them would hand every shipped game two promotion choices it does not have today.
2. A shove ignores the shoved piece's own movement restrictions — the Ogre moves it, it does not move
   itself — which matters only under the rejected `guardNoSecondRank` toggle.
3. Both pieces count as mating material for the dead-draw test. The Catapult needs a screen it cannot
   make for itself, but one enemy piece is screen enough, and declaring a live game drawn is the
   expensive direction to be wrong in.
4. The NNUE net has eleven piece types and cannot see these two. `nnueEval` now throws a named error
   instead of silently aliasing type 12 onto "their pawn". The default evaluator is linear, which is
   what every run below played.

`isAttacked` is the hottest function in the project, so the lob detection rides **inside** the ray
walk the sliders already make: the screen is by definition the first piece on the ray, so only the
leg past the screen is new work, and a one-pass `board.includes` skips even that on a board with no
Catapult. Four rays of its own measured several times more expensive.

**Tests: 149 green** (130 before this pass), `npx tsc --noEmit` clean. Nineteen new ones: move
generation for both pieces in all four variants, shoving a guard, refusing a king, an off-board
target and an occupied one, the legality of a shove that pins and one that discovers a check, the
four catapult screen cases (friendly screen, friend beyond an enemy screen, enemy beyond, a guard
beyond), check through a screen and the king's inability to step along the lobbed line, FEN
round-trips, LAN round-trips over all four variants with a count of the shoves and lobs actually
seen, and the `isAttacked` / `genPiece('attacks')` cross-check — whose random boards now contain
Ogres and Catapults, so **every** rule toggle in the file is cross-checked against them.

---

## 2. What each variant is worth

Muller's odds match (`docs/SIM-PLAN.md` §7): `RNBQKBNR` with one knight replaced by the piece, on one
side only, 300 games (150 colour-reversed pairs) an arm, depth 3, and the stored calibration
`--eloPerPawn 64`. A knight is **3.16 pawns** in today's evaluation.

| variant | pentanomial | score | Elo vs knight | implied pawns | draws | plies |
|---|---|---|---|---|---|---|
| Ogre, `repel` (default) | [35, 28, 65, 12, 10] | 0.390 | −78 ± 31 | **1.95 ± 0.49** | 19.7% | 96 |
| Ogre, `push` | [28, 18, 63, 16, 25] | 0.487 | −9 ± 36 | **3.02 ± 0.56** | 14.3% | 92 |
| Catapult, `stay` (default) | [49, 17, 61, 7, 16] | 0.373 | −90 ± 36 | **1.75 ± 0.56** | 9.7% | 89 |
| Catapult, `land` | [55, 23, 54, 5, 13] | 0.330 | −123 ± 34 | **< 1.66** | 9.7% | 89 |

Differences between the two readings of a piece, errors added in quadrature (conservative — the arms
share openings):

| comparison | Elo | pawns |
|---|---|---|
| Ogre `push` − `repel` | **+69 ± 48** | +1.08 ± 0.74 |
| Catapult `land` − `stay` | −33 ± 50 | −0.52 ± 0.77 |

`land` leaves Muller's linear band of ±1.5 pawns, so "< 1.66" is a direction, not a number.

**Both pieces price well under the guesses in `PIECES-PROPOSED.md`** (Ogre "about 3 pawns", Catapult
"3.5–4.5 while the board is full"). Only the pushing Ogre reaches its guess. Two honest caveats sit
on these rows and both point the same way: the engine was seeded at O = 300 and C = 400 centipawns,
which **over**-prices both, so a search that owns one refuses trades it should take — a re-seed at
the numbers above and a second pass is the standard Muller step and has not been run.

### 2.1 What the pieces actually did in those games

`RNBQKBNR` has no guard, so the shove that motivates the Ogre never appears here; §4 is where it does.

| arm | shoves/game | of which friendly | enemy | games with a shove | first shove (ply) | lobs/game | games with a lob | first lob (ply) | lob checks/game | survival |
|---|---|---|---|---|---|---|---|---|---|---|
| Ogre `repel` | 1.36 | 1.26 | 0.10 | 70.0% | 26 | — | — | — | — | 61.0% |
| Ogre `push` | 1.93 | 1.90 | 0.03 | 91.0% | 18 | — | — | — | — | 44.3% |
| Catapult `stay` | — | — | — | — | — | 0.43 | 33.0% | 49 | 0.16 | 56.3% |
| Catapult `land` | — | — | — | — | — | 0.18 | 17.3% | 66 | 0.12 | 52.7% |

Three things jump out. **The search shoves its own pieces, not the enemy's** — nine of every ten
shoves move a friend. **`push` turns the shove into a way of travelling**: nearly twice as many
shoves, eight plies earlier, and the Ogre dies far more often (survival 61% → 44%) because it walks
itself forward into the enemy. **The Catapult is a late piece exactly as designed**: its first lob
lands around ply 49, two thirds of games never see one, and `land` roughly halves the rate again and
delays it to ply 66 — landing in front of the enemy army is a way to die.

---

## 3. The composition runs (`np-*`): the piece against a knight

Three 2 000-game runs on the **same 40 mirrored ranks and the same opening seeds**; the only
difference is the piece that replaces a knight in both armies. Each game in `np-O` is therefore
matched with the same game in `np-N`. Differences are paired game-by-game, ±95%.

| comparison | white score | decisive | draws | mean plies |
|---|---|---|---|---|
| `np-N` control (two knights) | 0.522 | 74.3% | 25.2% | 113.8 |
| `np-O` (two Ogres) | 0.535 (+0.013 ± 0.026) | **66.9% (−6.5 ± 2.7 pts)** | **31.7%** | 120.5 (+6.7 ± 3.0) |
| `np-C` (two Catapults) | 0.536 (+0.015 ± 0.026) | 74.7% (+1.4 ± 2.6 pts) | 23.8% | 112.7 (−1.1 ± 3.1) |

**The Ogre, as `repel`, is a draw machine**: it costs 6.5 decisive points and six plies. The Catapult
is balance-neutral on this design and slightly sharper.

## 4. The shove that motivates the Ogre is rare

| arm | shoves/game | friendly | games with a guard shove | guard shoves/game |
|---|---|---|---|---|
| `np-O` (`repel`) | 3.33 | 3.12 | **39 / 2000 (1.95%)** | 0.023 |
| `ab-O-push.base` (`repel`) | 3.31 | 3.08 | 31 / 1600 (1.94%) | 0.024 |
| `ab-O-push.var` (`push`) | 3.97 | 3.94 | 47 / 1600 (2.94%) | 0.035 |

The piece is designed to move a guard out of the way, and it does — in **about one game in fifty**.
The frequency roughly doubles under `push`. That is not "solves guard blockades", and the report does
not say it: the measured effect of the Ogre is a more open, longer, drawish game, with the guard shove
as a highlight rather than the engine of the result.

## 5. The two readings, head to head

Both A/Bs are matched over the same 40 arrangements and opening seeds, 1 600 games an arm, depth 3.

| metric | `push − repel` | `land − stay` |
|---|---|---|
| white score | −0.011 ± 0.027 | +0.016 ± 0.028 |
| decisive | **+0.053 ± 0.030 (yes)** | −0.009 ± 0.028 |
| draw rate | **−0.059 ± 0.030 (yes)** | +0.007 ± 0.026 |
| mean plies | −1.0 ± 3.5 | +3.1 ± 3.7 |
| killer move | +0.017 ± 0.016 | −0.006 ± 0.014 |
| drama | +0.011 ± 0.011 | −0.010 ± 0.010 |
| interest (min-use) | +0.016 ± 0.014 | +0.006 ± 0.008 |
| lobs/game | — | **1.15 → 0.57** |
| games with a lob | — | **62.3% → 45.3%** |

**`push` wins its comparison**: it returns the decisiveness the composition run lost and cuts draws by
almost six points, without moving balance, length or branching. **`land` is unresolved**: every
interval covers zero, and its only clear effect is to halve how often the Catapult fires at all.
"Unresolved" is the finding; a larger run is not obviously worth its machine time for a piece that is
not being adopted.

## 6. Validation of this campaign (2026-09-16 audit)

The takeover review mistrusted this chain because the authoring agent failed and its scripts were
stopped once for a half-edited engine. The audit is in `tools/q6-audit.ts` / `tools/newpieces-stats.ts`;
the findings:

- **Every expected game is present**: `np-*` 3 × 2 000, A/Bs 4 × 1 600, odds 4 × 300 = **13 600**.
- **All compared arms used compatible conditions**: the same ranks, seeds, depth and pool; each
  record carries the run's own rule stamp (`{}` for controls, `{ogreMode:'push'}`,
  `{catapultCapture:'land'}`) on the one-guard pool `QLRRBBNNAAGMMSS`.
- **Replay confirms the rules**: 64 sampled games per arm replay clean under their stamp, and 15–21 of
  them distinguish `paladinKamakaze=nonPawn` from the old `always` — the campaign played the shipped
  paladin rule. The faulty first `np-N` (played during a live engine edit) is not part of these files;
  `chain2.sh` replayed it.
- **Browser path** (`tools/qa.mjs`, 8/8 against the dev server): Ogre selection, friend shove,
  capture-vs-shove by plain vs shift-click, animation end state, undo, Catapult lob, an AI reply in an
  Ogre position, and rule restore from the autosave. The shove needed real UI work: without it a
  `repel` shove (`to === from`, no captures) could never be selected, and the renderer had no shove
  animation. `push` and `land` are deliberately URL-unreachable — the lab toggle is the only way in.

## 7. Limitations and the bounded next decision

- **Depth 3 only, and guessed seeds.** O = 300 and C = 400 centipawns over-price both default
  readings (measured 1.95 and 1.75 pawns), so the search refuses trades it should take. The A/B
  *differences* are robust to that (both arms carry the same seed); the absolute values are not.
- **The re-seed pass and one depth-4 confirmation are the only follow-up worth running** (Muller's
  standard step): re-seed `O=195`, `C=175`, re-measure the two default readings, and repeat
  `push vs repel` at depth 4 with fresh seeds. `tools/newpieces-followup.sh` waits for the Q6 chain to
  free the cores, refuses a dirty tree, and runs exactly those three experiments (~25 minutes).
- **Recommendation.** Keep both pieces lab-only, outside `POOL` and `PROMOTIONS` (they are). If either
  is ever promoted: choose **`push`**, and only after the re-seed pass. Do not adopt the Catapult on
  this evidence.

