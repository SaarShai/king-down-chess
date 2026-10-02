# Kings' powers, balanced against each other — 2026-10-02

Owner request (2026-10-02): start the kings' powers mode with the powers from the rulebook; run
playtests, balancing sessions and Monte Carlo to compare their balance against each other; adjust
any power's rules and iterate until they are fairly well balanced.

## Summary

*(Filled in when the last round is in.)*

## What was built

- **All twelve powers** of `docs/RULES.md` §4 play in the engine, the computer opponent and the
  game: Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, March, Leap, Holy Light, Mercy, Death
  Touch and Darkness. Seven were built before (six always-on, plus Strike); Freeze, Ice Wall, Haste,
  Flight and Sacrifice are new, and March and Leap now default to the rulebook's 3 uses.
- **Game state for spent powers** travels with the position: uses spent per side, a Freeze or Ice
  Wall mark (with the side that set it), a pending Haste second move, a free-mark move, and
  Sacrifice's reserve of lost pieces. FEN field 7, the move notation, undo, repetition and the
  search's hash all carry it.
- **The computer plays every power.** Power moves are offered at the first three plies of the
  search; Haste's second move is searched as part of the same turn; an unspent use is worth a
  per-power holding price at the leaves, so a one-use power is not spent on the first small gain.
- **The search got 4–5× faster with identical play** (same node counts before and after): the attack
  test uses precomputed board geometry and makes no closures, and king safety is tested only for
  moves that could expose the king. This is what made a twelve-power round-robin affordable on a
  4-core cloud machine.
- **In the game:** New game picks a power for each king; a Use button arms the side to move's power;
  End turn closes a Haste turn early; the Guide lists the twelve powers.

## Method

**Head-to-head round-robins.** Every power plays every other power. A matchup is played as
colour-swapped pairs on the same army and opening, so the two games of a pair cancel the first-move
edge, and every matchup plays the same armies and openings (common random numbers). A plain king
("none") plays too, as a reference. Ratings come from a Bradley–Terry fit with a first-move term;
"score vs field" is a power's average score over all its games, which the balanced schedule makes
fair. Intervals are 95%.

**Players.** Both sides are the same engine at fixed depth 3 (the balance lab's standard), with
four random opening moves for variety. A random opening move is always one of the pieces' own
moves: Flight alone adds about 200 moves to a position, and an early run that let the random
opening pick power moves spent most powers by chance (that run was discarded).

**Playtest review.** `tools/kings-playtest.ts` replays every game and reports how each power was
used: how often, when, on which pieces, and the material swing over the next six plies.

**What "balanced" means here.** Every power's score against the field inside 50% ± 4 points
(about ±28 Elo — larger than White's first-move edge would be a problem), with no matchup far
outside the noise. Game quality is reported beside it: decisive share, draws, length.

**Tools.** `src/sim/tournament.ts` (run, report, shard), `tools/kings-playtest.ts`. Raw games are
in `sim/out/*.jsonl` (not versioned); reports and tournament specs are.

## Round 1 — the rulebook as written

1,248 games (8 colour-swapped pairs per matchup), played twice: at depth 3 and at depth 2. Score
against the other powers, ±95%:

| power | depth 3 | depth 2 |
|---|---|---|
| Haste | 79.8 ± 5.0 | 79.8 ± 5.4 |
| Strike | 77.6 ± 5.8 | 65.6 ± 7.0 |
| Sacrifice | 56.8 ± 7.1 | 71.6 ± 6.5 |
| Death Touch | 55.7 ± 7.5 | 38.4 ± 6.2 |
| Leap | 49.4 ± 6.9 | 57.7 ± 6.7 |
| Ice Wall | 46.0 ± 6.6 | 40.9 ± 6.2 |
| March | 46.0 ± 7.2 | 44.3 ± 6.6 |
| Holy Light | 45.5 ± 7.5 | 39.2 ± 6.2 |
| *plain king* | 45.1 ± 6.9 | 36.7 ± 6.1 |
| Flight | 44.3 ± 7.7 | 46.0 ± 6.8 |
| Freeze | 40.6 ± 6.8 | 46.9 ± 7.3 |
| Darkness | 37.8 ± 6.9 | 40.1 ± 6.9 |
| Mercy | 20.5 ± 5.8 | 29.5 ± 6.5 |

**Three powers in the band, a spread of 59 points.** Haste and Strike win four games in five;
Mercy loses four in five — even a plain king beats it (72%).

**Depth changes the answer**, so every later round is at depth 3. From depth 2 to depth 3,
Sacrifice falls 15 points and Death Touch rises 17 — more than either interval. A balance measured
by a weak player does not carry to a stronger one, which is also why a final check at depth 4 is
worth its cost.

**How the powers were used** (`tools/kings-playtest.ts`, depth 3; the swing is the user's material
over the six plies after the use, in pawns):

- **Strike** is a pawn's power: pawns made 160 of 185 strikes, at a median ply 10, and the median
  swing was +2.3 — a pawn moves like a queen, takes a piece, and only a pawn can be lost back.
- **Haste** (+2.9 median) can take twice, or take and step back out of reach.
- **Sacrifice** (+3.3 median) is a free promotion: a pawn becomes a lost rook, bishop or queen.
- **Freeze and Ice Wall** as a whole turn are followed by a median loss of a pawn (−2.6 and −2.3
  on average). The computer reaches for them when it is already losing material, to push the loss
  past its horizon: as written they are worth less than a move.
- **Mercy**: a king that cannot capture cannot take a checking piece or a pawn in the ending.

## Round 2 — five first changes

Changes: Strike cannot capture; Haste's second move cannot capture; Freeze and Ice Wall are a free
action, then the ordinary move (the rulebook marks only Strike, Flight and Sacrifice "counts as a
turn"); Mercy's king captures; March is always on. 2,496 games, 16 pairs per matchup, same armies
and openings.

| power | round 1 | round 2 |
|---|---|---|
| Freeze | 40.6 ± 6.8 | **73.4 ± 4.7** |
| Haste | 79.8 ± 5.0 | 67.2 ± 4.6 |
| Strike | 77.6 ± 5.8 | 63.1 ± 4.8 |
| Leap | 49.4 ± 6.9 | 53.8 ± 5.2 |
| Sacrifice | 56.8 ± 7.1 | 48.3 ± 5.3 |
| Ice Wall | 46.0 ± 6.6 | 48.0 ± 5.2 |
| Death Touch | 55.7 ± 7.5 | 47.7 ± 5.1 |
| Flight | 44.3 ± 7.7 | 46.2 ± 5.1 |
| March | 46.0 ± 7.2 | 45.5 ± 4.5 |
| Mercy | 20.5 ± 5.8 | 39.1 ± 5.0 |
| *plain king* | 45.1 ± 6.9 | 38.9 ± 4.7 |
| Holy Light | 45.5 ± 7.5 | 37.8 ± 5.0 |
| Darkness | 37.8 ± 6.9 | 30.0 ± 4.7 |

**Five in the band, a spread of 44 points.** Mercy doubled its score. A free Freeze overshot: it
freezes the defender, then takes what the defender guarded (+1.0 median swing, 117 of 322 uses
gained two pawns or more). Haste still gains +3.2 a use by taking and running; a Strike that
cannot capture still lets a pawn run to the seventh rank and promote (pawns made 92 of 168
strikes). Darkness, Holy Light and Mercy stay at or below the plain king.

## Round 3 — several readings screened at once

Base changes: a free Freeze's move cannot capture; neither Haste move captures; Strike is pieces
only and cannot capture; Holy Light's king may take pawns; Darkness pawns keep their ordinary moves.
Variants played in the same field (a variant never meets its own power): Freeze with one use and no
quiet move (`once`); Strike pieces only but capturing (`take`); Holy Light also covering its king's
neighbours from pawns (`aura`); Mercy as written plus a shelter — no capture takes a piece next to
the Mercy king — with (`shelterx`) and without (`shelter`) the king's own capture; Flight twice
(`twice`). 5,248 games, 16 pairs.

| entrant | vs powers |
|---|---|
| Darkness (keeps ordinary moves) | 74.5 ± 3.8 |
| Mercy, shelter + captures | 68.6 ± 4.0 |
| Freeze, free, quiet move, 2 uses | 63.5 ± 4.2 |
| Strike, pieces only, captures | 59.1 ± 4.1 |
| **Mercy, as written + shelter** | **53.5 ± 4.2** |
| **Flight, 2 uses** | **51.9 ± 4.2** |
| **Freeze, free, 1 use** | **50.2 ± 4.2** |
| **Leap** | **49.3 ± 4.1** |
| **Haste, no captures** | **47.5 ± 4.0** |
| Strike, pieces only, no captures | 45.5 ± 4.3 |
| Death Touch | 44.9 ± 3.9 |
| Ice Wall | 44.8 ± 3.8 |
| Sacrifice | 44.0 ± 4.3 |
| Flight, 1 use | 43.3 ± 4.3 |
| March (always on) | 42.9 ± 3.9 |
| Holy Light + aura | 40.6 ± 4.0 |
| Holy Light, takes pawns | 39.4 ± 4.0 |
| Mercy, captures | 37.3 ± 4.1 |
| *plain king* | 35.9 ± 3.7 |

**Haste is fixed** (80 → 47.5), **Freeze with one free use lands at 50**, **Flight twice at 52**, and
**Mercy as written plus the shelter at 53.5** — the shelter keeps the name's meaning (the king
spares, and shields those beside it) where letting the king capture did not help (37). Darkness
overshot from 30 to 74.5; Strike sits between its two readings (45.5 and 59); Holy Light did not
move with either change.
