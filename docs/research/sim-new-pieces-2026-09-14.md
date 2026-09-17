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

PLACEHOLDER-SHORT

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
