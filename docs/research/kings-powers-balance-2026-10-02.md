# Kings' powers, balanced against each other — 2026-10-02

Owner request (2026-10-02): start the kings' powers mode with the powers from the rulebook; run
playtests, balancing sessions and Monte Carlo to compare their balance against each other; adjust
any power's rules and iterate until they are fairly well balanced.

## Summary

**The twelve powers went from a 59-point spread to 15, and all twelve now sit within 42–57%**
against the other powers (confirmation round: depth 3, 3,744 games on armies and openings never
used for tuning). The game plays these readings whenever a king has a power (`POWERS_BALANCED`);
"No power" stays the default, and the rulebook as printed stays available behind `?rules=2017`.
Owner decision (2026-10-02): these are the official kings' powers rules.

| power | rulebook as printed | official reading | confirmation |
|---|---|---|---|
| Freeze | the whole turn, 2 a game — 41% | **free action, then your move; once a game** | 54% |
| Ice Wall | the whole turn — 46% | **free action, then your move** (2 a game) | 47% |
| Strike | any piece, takes — 78% | **pieces only, to an empty square** | 52% |
| Haste | two moves, may take — 80% | **neither move takes** | 57% |
| Flight | once — 44% | unchanged (a second use overshoots: 58%) | 46% |
| Sacrifice | 57% | unchanged | 57% |
| March | 3 a game — 46% | **always on** (shorter rule) | 48% |
| Leap | 3 a game — 49% | unchanged | 48% |
| Holy Light | pawns cannot take the king; it takes no pawns — 46% | **the king may take pawns, and the pieces beside, in front of and behind it cannot be taken** | 50% |
| Mercy | king steps 1–2, takes nothing — 21% | **as printed, and the pieces next to the king cannot be taken** | 56% |
| Death Touch | 56% | **also reaches two squares straight forward, back or sideways, over an empty square** (round 10) | 57% in round 10 (43% without the reach) |
| Darkness | 38% | **pawns also keep their straight steps**, still take only straight ahead | 42% |

**Still a little outside the target (50 ± 4):** Haste, Sacrifice and Mercy are high (56–57%);
Death Touch and Darkness are low (42–43%). A plain king scores 34% against any power. Every
power's level moves by several points between rounds on different armies (each ±4), so these are
small edges, not clear winners.

**Depth matters.** A depth-4 check of the round-4 set (936 games) kept the order but widened the
spread to 24 points: Mercy, Flight with two uses and Sacrifice near 59%, Holy Light 36%. Balance
measured by a computer player is a guide for people, not a guarantee.

**Next, if wanted:** the two lowest (Death Touch, Darkness) could get a small boost and Haste or
Sacrifice a small trim; the report lists the readings already measured for each.

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

## Round 4 — the round-3 winners together

Base: Freeze free with one use; Ice Wall free; Haste without captures; Strike pieces only without
captures; Flight twice; Mercy as written plus the shelter; March always on; Holy Light takes pawns;
Darkness pawns keep their straight steps but still take only straight ahead (`darknessMoves`).
Variants: Strike twice (`two`), Ice Wall three times (`three`), Holy Light also safe from knights
(`knight`), Death Touch keeping the ordinary capture (`move`). 4,224 games, 16 pairs.

| entrant | vs powers |
|---|---|
| Strike twice | 58.5 ± 4.2 |
| Mercy + shelter | 55.6 ± 4.2 |
| Flight twice | 55.5 ± 4.2 |
| Freeze, one free use | 54.1 ± 4.1 |
| Haste, no captures | 53.5 ± 4.1 |
| Leap | 52.3 ± 4.2 |
| Ice Wall | 51.9 ± 3.9 |
| Ice Wall three times | 51.2 ± 4.2 |
| Strike, pieces only, no captures | 49.6 ± 4.4 |
| Sacrifice | 47.7 ± 4.6 |
| Death Touch (either reading) | 47.1 / 47.0 |
| Darkness, straight steps kept | 46.6 ± 4.4 |
| March | 45.9 ± 4.1 |
| Holy Light (either reading) | 41.7 / 41.0 |
| *plain king* | 38.6 ± 3.7 |

**The twelve base powers span 41.7–55.6, a spread of 14 points** (59 in round 1). Darkness's half
step lands at 46.6. The variants change nothing worth a longer rule: a third Ice Wall use, Death
Touch's second capture and Holy Light's knight cover each move their power less than a point; a
second Strike overshoots. Holy Light is the one power still clearly low.

The final check (below) plays the round-4 base on fresh armies and openings (seed 303, 24 pairs),
with two last readings beside it — Flight once again, now that the field has moved, and Holy Light
with Mercy's shelter — and a depth-4 run of the base set.

## Final check — fresh armies, and depth 4

The round-4 base (with Flight back to one use beside two, and Holy Light with Mercy's shelter as a
variant), seed 303 (armies and openings not used in rounds 1–4), 24 pairs, depth 3: 4,944 games.

| entrant | vs powers | decisive |
|---|---|---|
| Mercy + shelter | 61.9 ± 3.6 | 83.6% |
| Holy Light + shelter (variant) | 59.7 ± 3.5 | 81.4% |
| Flight twice | 58.3 ± 3.8 | 90.4% |
| Haste, no captures | 55.9 ± 3.7 | 87.6% |
| Freeze, one free use | 52.2 ± 3.7 | 89.6% |
| Strike, pieces only, no captures | 49.4 ± 3.7 | 87.2% |
| **Flight once (the rulebook)** | **49.0 ± 3.7** | 84.8% |
| Leap | 48.2 ± 3.8 | 86.2% |
| March | 46.7 ± 3.7 | 88.1% |
| Sacrifice | 46.6 ± 3.7 | 87.8% |
| Ice Wall | 44.6 ± 3.5 | 86.5% |
| Death Touch | 43.6 ± 3.5 | 82.3% |
| Holy Light, takes pawns | 42.3 ± 3.5 | 84.5% |
| Darkness, straight steps kept | 42.2 ± 3.7 | 93.8% |
| *plain king* | 38.5 ± 3.2 | 84.8% |

White's first-move edge: −1 ± 10 Elo. Games stay sharp: 82–94% decisive, about 95 plies.

On fresh positions **Flight goes back to the rulebook's one use** (49%); two uses overshoot. Mercy's
shelter is stronger here than in round 4 (62 against 56). The depth-4 run (round-4 set, seed 404, 6
pairs, 936 games) ordered the powers the same way with a wider spread: Mercy 60, Flight twice 59,
Sacrifice 59, Haste 56, Strike 56, Freeze 55, Leap 51, Ice Wall 44, March 42, Death Touch 41,
Darkness 41, Holy Light 36 (each ±6–8).

## Round 6 — Mercy and Holy Light variations

Owner (2026-10-02): adopt the balanced readings as the official rules, and "experiment with
different variations and combinations" of Mercy and Holy Light. The official set plus five
variants, seed 505, 16 pairs, depth 3: 4,608 games (`sim/out/kp2-r6.report.md`).

| entrant | vs powers |
|---|---|
| Holy Light, all 8 neighbours sheltered | 63.6 ± 4.4 |
| the same, and the king takes no pawns | 62.6 ± 4.3 |
| Sacrifice | 56.5 ± 3.7 |
| Haste | 56.5 ± 4.0 |
| **Mercy, neighbours sheltered (official)** | **54.6 ± 4.2** |
| March | 54.4 ± 4.0 |
| Freeze | 53.0 ± 4.1 |
| **Holy Light, pieces beside, in front of and behind sheltered** | **52.8 ± 4.6** |
| Leap | 51.8 ± 4.0 |
| Flight | 50.3 ± 4.1 |
| Strike | 48.8 ± 4.1 |
| Ice Wall | 47.6 ± 4.0 |
| Darkness | 47.0 ± 4.1 |
| Death Touch | 44.3 ± 3.9 |
| Holy Light, no shelter (previous) | 42.7 ± 4.2 |
| *plain king* | 39.6 ± 3.6 |
| Mercy, only beside/front/behind sheltered | 36.9 ± 4.0 |
| Mercy, sheltered only from pawns | 26.7 ± 3.7 |

**Chosen:** Mercy keeps its shelter of all eight neighbours; Holy Light gets the four-square
shelter (beside, in front of, behind), which brings it to 53%. One idea, two shapes, easy to tell
apart. Mercy is sensitive to its shelter's shape: with four squares it falls below the plain
king, so it stays at eight. (Mercy measured 62 in the final check and 55 here: the field
and armies differ, so its true level is likely in between.)

## Confirmation round — the official set on fresh armies

The twelve official readings and a plain king, seed 707 (armies and openings not used before), 24
pairs, depth 3: 3,744 games (`sim/out/kp2-r7.report.md`). Against the other powers: Haste 56.9,
Sacrifice 56.9, Mercy 55.9, Freeze 53.9, Strike 51.5, Holy Light 50.3, Leap 48.4, March 48.0, Ice
Wall 47.4, Flight 46.0, Death Touch 43.0, Darkness 41.8 (each ±4); plain king 34.4. Seven of
twelve inside 50 ± 4; spread 15 points. White's first-move edge +10 ± 11 Elo; 84–92% of games
decisive.

## Round 8 — boosts for Death Touch and Darkness, a trim for Sacrifice

The official set plus four lab readings, seed 808, 16 pairs, depth 3: 4,192 games
(`sim/out/kp2-r8.report.md`). Against the other powers: Death Touch reaching two squares in a
straight line over an empty square 63.5; Darkness "pawns also take straight ahead" 58.9; Darkness
"pawns also step diagonally" 58.7; Mercy 57.7; Sacrifice only while behind in pieces 44.0 (plain
Sacrifice 51.2); Darkness 43.4; Death Touch 40.1; plain king 35.0.

Owner (2026-10-02): the light and dark kings may be somewhat stronger than the other four if they
are balanced with each other, and **no reading may change how other pieces move**, so the two new
Darkness readings are out and today's Darkness stays. Sacrifice stays as printed (the comeback rule
over-trims). Death Touch's reach is the king's own ability; a files-and-ranks-only reach is next.

## Round 9 — a stronger tier for the light and dark kings

Owner: the light (Spirit) and dark (Shadow) kings may be somewhat stronger than the other four if
they are balanced with each other. The eight other powers, Mercy, both Holy Light shelters, Death
Touch with the full two-square reach and the two Darkness pawn readings; seed 909, 16 pairs: 3,296
games (`sim/out/kp2-r9.report.md`). Against the other powers: Death Touch with full reach 60.9,
Holy Light sheltering all eight neighbours 57.4, Mercy 52.8, Holy Light (four squares) 47.5. Head
to head the three strong ones are even (Death Touch 52 against the eight-square Holy Light, 50
against Mercy). But Darkness, which stays as it is (no reading may change how other pieces move),
is about 45, so a full-reach Death Touch would split the Shadow king's two powers by 15 points.

## Round 10 — Death Touch reaching along files and ranks only

The twelve official powers and Death Touch whose extra reach is straight forward, back or sideways
only; seed 1010, 16 pairs: 2,880 games (`sim/out/kp2-r10.report.md`). Against the other powers:
Death Touch with this reach 56.7 (plain Death Touch 42.3), Mercy 55.3, Holy Light 48.2, Darkness
46.6; the other eight 47.0–55.7. **Adopted:** the Spirit king's two powers average 51.8 and the
Shadow king's 51.7, so the light and dark kings are level with each other and just above the
field, and with this Death Touch nine of twelve powers sit inside 50 ± 4 (spread 14 points).

## Final check — the official set with the new Death Touch

All twelve official readings (Death Touch with the files-and-ranks reach) and a plain king, seed
1111, 12 pairs, depth 3, run in this one session: 1,872 games (`sim/out/kp2-r11.report.md`; each
±5.5). Against the other powers: Mercy 60.4, Haste 54.7, Strike 54.5, Death Touch 52.3, Freeze
50.9, March 49.6, Flight 48.7, Sacrifice 48.1, Leap 46.2, Ice Wall 45.6, Holy Light 44.9,
Darkness 43.9; plain king 33.9. All twelve within 44–60, spread 16.5. Spirit's two powers average
52.7, Shadow's 48.1 — level within this round's error. Mercy has measured 55–62 in every round
since its shelter, so it is the one power to watch in play.

Raw games: `claude/kp2-results-*` branches (rounds 1–10); `sim/out/kp2-r11.jsonl` locally (`sim/out/*.jsonl`); reports and specs in `sim/out/`.
