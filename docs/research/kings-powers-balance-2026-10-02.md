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

*(Filled in.)*
