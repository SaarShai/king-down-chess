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

**Update 2026-10-03 (round 12):** a rematch on 12 new armies showed that a round measures balance
only on the armies it drew (12–20 per round), so single-round intervals were too narrow. Pooled over
two rounds (24 armies), with intervals resampled over armies, all twelve sit within 44–55%, and
no power is clearly off centre yet. Haste (55 ± 3) is borderline: tested together with the other
eleven, it sits right at the edge of the band. Mercy (55 ± 5) is high and Flight (45 ± 4) and
Darkness (44 ± 6) low on their own intervals, which with twelve powers can be chance. All four are
for the next round, on many more armies, to confirm. Details in Round 12, below.

**Update 2026-10-03 (round 13, 1,872 fresh armies):** over rounds 11–13, **Mercy (56) and Haste (56)
are high and Darkness (43) low**, all three clearly; Flight is fine (47). Spirit's powers now average
about 3 points above Shadow's. Details in Round 13, below.

**Update 2026-10-03 (owner decisions after rounds 14–15):** Mercy is now official as reading M2
(pawns may take in its shelter, and the Mercy king may take pawns; about 50% in rounds 14–15). Haste
and Death Touch stay as they are. Darkness stays as it is while simpler second parts are tested
(round 16). Details at the end of Round 15.

**Update 2026-10-04 (round 16):** of four one-sentence second parts for Darkness, **the king step**
(your king may also step two squares straight, over an empty square) brings Darkness from 43 to 47
and keeps Spirit and Shadow level. D1 and the pawn armour overshoot to 53, the pawn aura does
nothing. Haste (58) is now the one power clearly outside 50 ± 4. Details in Round 16, below.

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
  Wall mark for each side, a pending Haste second move, a free-mark move, and
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

**Caveat (found 2026-10-03).** A round draws one army per pair slot and every matchup reuses them,
so a round with 12 pairs measures 12 armies. A power's strength depends on the army, and the
intervals in rounds 1–11 are per game, so they leave out the army-to-army variation (Round 12).
Since 2026-10-03 the runner can draw a fresh army for every pair (`--armies perPair`: 936 armies in a
12-pair round instead of 12), and `report` prints intervals resampled over armies ("±95% armies"),
two lists of powers off 50% (each power on its own, a screen; and all of them tested together,
the verdict), each king's average, and Spirit − Shadow. With few armies (12 or 24) it uses t
quantiles, because a mean over few armies has heavier tails than a normal curve.

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
52.7, Shadow's 48.1 — level within this round's error. Mercy had measured 55–62 in every round
since its shelter, so it was the one power to watch, until round 12 on new armies read 48.7 (below).

## Round 12 — the official set again, on 12 new armies (2026-10-03)

The same rules as the final check, seed 2222, 12 pairs, depth 3: 1,872 games
(`sim/out/kp2-r12.report.md`). Against the other powers: Leap 57.6, Death Touch 55.7, Haste 55.7,
Sacrifice 55.5, Ice Wall 51.3, Strike 49.4, Mercy 48.7, Holy Light 47.9, Freeze 47.5, March 45.1,
Darkness 43.6, Flight 42.0; plain king 35.9. Mercy read 60.4 in the final check and 48.7 here; Leap
moved from 46.2 to 57.6.

**Why the two rounds disagree.** Both ran the same rules and the same engine: the code changes
between them only matter with the net evaluator, which tournaments do not use. The seed changed,
and the seed picks the armies. A round uses one random army per pair slot (`armies[p]` in
`src/sim/tournament.ts`), so 12 pairs means 12 armies, shared by all 78 matchups. A power's
strength depends on the army (Mercy takes only a guard; the shelters depend on what stands next to
the king), so a round measures balance on its 12 armies, and its per-game intervals (±5.5) leave
that out. Resampling the 12 armies gives intervals of ±4.9 to ±11 points per power in one round.
The colour-swapped pairs are not the cause: pair-level and game-level intervals agree (ratio 0.99).

**Both rounds together** (24 armies, 3,744 games, `sim/out/kp2-r11+kp2-r12.report.md`), with 95%
intervals from resampling the armies: Haste 55.2 ± 3.4, Mercy 54.5 ± 5.4, Death Touch 54.0 ± 4.7,
Strike 52.0 ± 3.8, Leap 51.9 ± 6.5, Sacrifice 51.8 ± 5.5, Freeze 49.2 ± 4.3, Ice Wall 48.5 ± 4.9,
March 47.3 ± 4.1, Holy Light 46.4 ± 4.7, Flight 45.4 ± 4.0, Darkness 43.8 ± 6.0; plain king 34.9.
All twelve within 43.8–55.2, spread 11.5. Spirit's two powers average 50.5, Shadow's 48.9. (These
are `report`'s numbers: 10,000 resamples, a small-sample correction, and t with 23 degrees of
freedom instead of the normal 1.96, which together widen each interval by about 8%. The handoff's
first script used 2,000 resamples and neither correction.)

**Reading.** No power is clearly off centre on these 24 armies. Haste is the nearest: 5.2 points
above 50, exactly the width of the band that allows for testing all twelve (±5.2; the band uses t
with 23 degrees of freedom, because a mean over 24 armies has heavier tails than a normal curve).
Mercy (about 49–60), Flight (about 41–49) and Darkness (about 38–50) are off 50 on their own
intervals, or nearly so, but twelve such tests flag one power in about two rounds by chance. Mercy
is not shown to be off 50, nor inside the 50 ± 4 target; rounds 7 and 10 read it at 56 and 55 on
other armies, so round 12's 49 looks like the outlier. Tested together, neither round alone flags any
power. Spirit − Shadow is +1.6 ± 4.9 points (about −3 to +6.5): no clear gap between the light and
dark kings, but a gap of up to about 6 points in Spirit's favour is not ruled out (round 11 alone
read +4.5, round 12 −1.3). Earlier single-round verdicts in this report (for example "all twelve within 44–60") carry
the same caveat: each describes 12–20 armies.

**For the next round:** a fresh army for every pair (`--armies perPair`), so one round of 1,872
games covers 936 armies instead of 12; `report` gives the intervals resampled over armies (done
2026-10-03). On rounds 11–12 the armies add about a third to the variance of a power's score, so
at the same number of games the intervals come out about 15% narrower, and no longer rest on a
dozen armies. Each pair's army depends only on the seed, the pair number and the two powers, so a
variant entrant (`Haste~v<name>`) plays the same armies its base power plays against each opponent
in the same round.

## Round 13 — the official set on 1,872 fresh armies (2026-10-03)

The same rules as rounds 11 and 12, seed 3333, 24 pairs, a fresh army for every pair
(`--armies perPair`), depth 3: 3,744 games in 37 minutes on the owner's Mac
(`sim/out/kp2-r13.report.md`). Against the other powers (95%, armies resampled): Mercy 58.0 ± 4.1,
Haste 55.9 ± 3.7, Death Touch 53.5 ± 3.9, Freeze 51.3 ± 4.0, Leap 50.6 ± 3.8, Strike 50.5 ± 3.8,
Sacrifice 50.1 ± 4.0, Flight 49.5 ± 3.9, Holy Light 48.2 ± 3.7, March 45.7 ± 4.0, Ice Wall 43.7 ± 4.0,
Darkness 43.0 ± 3.9; plain king 35.8. Tested together, four are off centre: Mercy and Haste high,
Ice Wall and Darkness low. Spirit − Shadow +4.9 ± 4.1.

**All three rounds** (1,896 armies, 7,488 games, `sim/out/kp2-r11+kp2-r12+kp2-r13.report.md`):
Mercy 56.3 ± 3.3, Haste 55.5 ± 2.4, Death Touch 53.7 ± 2.9, Strike 51.2 ± 2.6, Leap 51.2 ± 3.6,
Sacrifice 50.9 ± 3.2, Freeze 50.3 ± 2.8, Flight 47.4 ± 2.8, Holy Light 47.3 ± 2.9, March 46.5 ± 2.8,
Ice Wall 46.1 ± 3.0, Darkness 43.4 ± 3.4; plain king 35.3. Tested together, three are off centre:
**Mercy and Haste high, Darkness low**. Ice Wall, March (low) and Death Touch (high) are off 50 on
their own intervals only. Spirit − Shadow **+3.2 ± 3.1** (0.2 to 6.3).

**Reading.** Round 13 settles what rounds 11–12 left open. Mercy, Haste and Darkness are off centre,
by 5–7 points each. Flight is not (47.4): its lows in rounds 11–12 came from their armies. Ice Wall
read low here (43.7) but less so over all three rounds (46.1): a candidate to watch. The light and
dark kings are no longer level: Spirit's two powers average about 3 points above Shadow's, from Mercy
high and Darkness low. Any fix for Mercy or Darkness moves that gap too.

**A mark bug, and a re-check.** After round 13, a review of card mode found that a position held
only one Freeze or Ice Wall mark. The side a mark bound could set its own mark, which erased the
first, and then (under the free-mark reading) make the move the first mark forbade. The fix
(`dcb9d1f`) keeps one mark per side. Under the official set only the Freeze–Ice Wall matchup has a
mark on both sides, so it alone was replayed on the fixed engine with the same armies (`fi-r11`,
`fi-r12`, `fi-r13`; 96 games). Freeze scored 62.0 of 96 against Ice Wall, against 59.5 before. Each
power plays 1,152 games over the three rounds, so either power's score moves by about 0.2 points.
No conclusion above changes.

**Options for the three off-centre powers (sent to the owner 2026-10-03, not chosen yet).** From a
read-only review of the engine and the stored games, with an adversarial check. The sizes are
rough; only a measurement decides.

- **Haste** (55.5). Without captures, its two moves still set up a threat that the opponent has
  one move to answer: the hasted piece took something on its next turn after 45% of the Haste turns
  that the game went on from (147 of 328; 123 of 451 ended the game at once, 105 of them won by
  the Haste side; `cards-a1`, one-use Haste against a plain king). Trims, each on Haste's own moves only:
  H1 the second move may not end next to an enemy piece (about −2 to −9); H2 the second move may
  not end where the piece attacks an enemy piece; H3 the second move may not go forward (70% of
  second moves did); H4 neither move may give check (about −1 to −4, a companion to the others).
  Not proposed: "the hasted piece may not take on the next turn", which limits an ordinary move.
- **Mercy** (56.3). M1 enemy pawns may still take pieces next to the Mercy king (about −6, range
  −3 to −12); M2 M1, and the Mercy king may take pawns, as Holy Light does (a smaller cut); M3 the
  Mercy king no longer jumps over its own pieces (unmeasured, about −1 to −5).
- **Darkness** (43.4). Open question for the owner: may Darkness gain a second part that leaves its
  pawns as they are? If so: D1 no piece diagonally next to the Darkness king can be taken, the
  diagonal twin of Holy Light's shelter (about +4.5, range +2 to +9); D2 the same, except by
  pawns (smaller). If not: first check how much of the 43.4 comes from the computer player, whose
  evaluation was never tuned for Darkness pawns (no rule change).
- **Spirit and Shadow level.** With m the change of Mercy and k that of Darkness (each against the
  other powers), the gap is about 3.25 + (6/11)(m − k), so the kings are level when k − m ≈ 6: for
  example Mercy −3 and Darkness +3.
- **Measuring.** One round with the variants as `~v` entrants beside their base powers, on
  `--armies perPair`: a variant plays the same armies as its base power against each opponent, so
  variant − base is paired within the round. At 24 pairs that difference is about ±4.5; 48 pairs
  narrow it. The Haste and Spirit/Shadow variants share the round (a Haste trim raises every other
  power a little). A new seed, not round 13's: the same seed would replay round 13's 3,744 games of
  the official set exactly, and pooling the two rounds would count them twice.
- **Owner (2026-10-03):** "test all. let's get all of the information to judge. and yes, darkness
  can get a second part." All nine readings are built as lab toggles (`src/rules/power-fixes.test.ts`)
  and screened together in round 14 (`docs/QUEUE.md`).

Raw games (`sim/out/*.jsonl` is not versioned on `main`): branch `claude/kp2-results`, every round so far in one place; reports and specs in `sim/out/`.

## Round 14 — all nine readings screened (2026-10-03)

Owner: "test all. let's get all of the information to judge." The twelve official powers, the plain
king and the nine readings as variant entrants, on seed 1414 (fresh armies), 48 pairs, `--armies
perPair`, depth 3: 20,352 games on the Mac and 5 Kaggle notebooks (`sim/out/kp2-r14.report.md`). A
variant plays the same armies as its base power against each opponent, so each line below is a
paired difference against the 11 other official powers (528 pairs, 95%).

| reading | power today → with it | change | draws | game length (plies) |
|---|---|---|---|---|
| H1 Haste: second move not next to an enemy | 56.8 → 48.2 | −8.6 ± 3.4 | +1.0 ± 2.6 | +3.7 ± 3.4 |
| H2 Haste: second move not threatening | 56.8 → 44.6 | −12.2 ± 3.5 | +2.1 ± 2.7 | +5.7 ± 3.6 |
| H3 Haste: second move not forward | 56.8 → 48.8 | −8.0 ± 3.4 | +2.4 ± 2.5 | +3.3 ± 3.3 |
| H4 Haste: no check | 56.8 → 54.2 | −2.6 ± 2.3 | +0.9 ± 1.8 | +2.5 ± 2.3 |
| M1 Mercy: pawns may take in the shelter | 56.2 → 49.1 | −7.1 ± 2.7 | +0.7 ± 2.4 | +2.2 ± 2.8 |
| M2 Mercy: M1 and the king takes pawns | 56.2 → 50.0 | −6.1 ± 2.7 | +0.5 ± 2.5 | +2.3 ± 2.9 |
| M3 Mercy: no jump | 56.2 → 47.0 | −9.1 ± 3.7 | −0.5 ± 3.0 | −5.5 ± 3.7 |
| D1 Darkness: diagonal shelter | 42.8 → 52.3 | +9.5 ± 3.1 | −0.1 ± 2.3 | +1.1 ± 3.0 |
| D2 Darkness: diagonal shelter, pawns may take | 42.8 → 50.2 | +7.4 ± 3.0 | +1.1 ± 2.2 | +0.4 ± 2.8 |

Official powers in this round, against the other eleven: Haste 56.8, Mercy 56.2, Death Touch 54.0,
Strike 52.4, Leap 51.6, Sacrifice 50.0, Freeze 48.4, Holy Light 48.2, March 46.6, Flight 46.6, Ice
Wall 46.5, Darkness 42.8 (each ±2.7–2.8): round 13's picture again, on new armies.

**Reading.** Each of the three has a reading that lands near 50: Haste H1 or H3 (48–49), Mercy M2
(50.0) and Darkness D2 (50.2). None changes the draw rate clearly. Taken together (each change
spread over the field, as above), every power then sits inside 50 ± 4 except **Death Touch (about
54.6)**, and **Shadow leads Spirit by about 3.6** (Spirit 49.5, Shadow 53.1), because Death Touch
is the high one of Shadow's two powers. Fixing Mercy alone levels the kings but leaves Darkness at
44; fixing Darkness alone levels them but leaves Mercy at 56. So the package H1/H3 + M2 + D2 needs a
small Death Touch trim of about 3–4 points to be level; that trim is not measured yet.

## Round 15 — the package, with H3 and five Death Touch trims (2026-10-03)

Owner: "plan and execute the next runs" (overnight). Round 14's package is the round's rules:
Haste H1, Mercy M2, Darkness D2 (`hasteApart`, `mercyAuraPawnsTake`, `mercyTakesPawns`,
`darknessShelter`, `darknessShelterPawnsTake`). Variants: Haste H3 in place of H1, and five Death
Touch trims of the two-square reach (round 10's reading: straight forward, back or sideways over an
empty square). Seed 1515 (fresh armies), 64 pairs, `--armies perPair`, depth 3: 19,840 games on this
Mac (`sim/out/kp2-r15.report.md`). Every variant meets every power but its own, so each choice
below is put in place from games played, not predicted.

**Each variant against its base on the same armies** (against the 11 other powers, 704 pairs, 95%):

| variant | change | draws | game length (plies) |
|---|---|---|---|
| H3 Haste: second move not forward (instead of H1) | +3.1 ± 2.3 | −1.0 ± 1.9 | −2.1 ± 2.4 |
| T1 Death Touch: no backward reach | −1.2 ± 0.7 | +0.2 ± 0.9 | +0.5 ± 0.8 |
| T2 Death Touch: no sideways reach | −5.9 ± 2.0 | −1.4 ± 1.9 | +0.1 ± 2.1 |
| T3 Death Touch: the reach takes pieces only | −2.3 ± 1.4 | +0.1 ± 1.4 | −0.4 ± 1.5 |
| T4 Death Touch: forward reach only | −6.7 ± 2.0 | −1.4 ± 1.9 | −0.9 ± 2.1 |
| T5 Death Touch: no reach (as printed) | −12.4 ± 2.3 | −1.6 ± 2.1 | −1.5 ± 2.4 |

**The field with each choice in place** (each power against the other 11; ± about 2.4 for each
power; Spirit = Holy Light and Mercy, Shadow = Death Touch and Darkness; the Spirit − Shadow
interval combines the two kings' pairs):

| Haste | Death Touch | powers in 50 ± 4 | spread | Death Touch | Haste | Spirit − Shadow |
|---|---|---|---|---|---|---|
| H1 | reach as today | 11 | 7.9 | 54.5 | 46.6 | −3.6 ± 2.4 |
| H1 | T2 no sideways reach | 12 | 6.0 | 48.6 | 47.7 | −0.1 ± 2.4 |
| H1 | T4 forward reach only | 12 | 5.9 | 47.8 | 47.8 | +0.2 ± 2.4 |
| H3 | reach as today | 11 | 7.6 | 54.3 | 49.6 | −4.0 ± 2.4 |
| H3 | T1 no backward reach | 12 | 6.5 | 53.3 | 49.8 | −3.2 ± 2.4 |
| H3 | T3 pieces only | 12 | 5.8 | 52.2 | 50.1 | −2.7 ± 2.4 |
| **H3** | **T2 no sideways reach** | **12** | **5.7** | **49.0** | **50.2** | **−0.7 ± 2.4** |
| H3 | T4 forward reach only | 12 | 5.9 | 48.2 | 50.2 | −0.5 ± 2.5 |
| H3 | T5 no reach | 11 | 11.4 | 42.0 | 50.9 | +3.1 ± 2.5 |

With H3 and T2, all twelve powers: Darkness 53.1, Sacrifice 52.5, Leap 51.6, Strike 51.4, Mercy
50.5, Haste 50.2, Holy Light 50.1, Freeze 49.1, Death Touch 49.0, Flight 47.6, Ice Wall 47.5, March
47.4.

**Reading.** Round 14's package holds on new armies: Mercy (M2) and Darkness (D2) land near 50, and
Death Touch is again the high one (54.5) with Shadow ahead of Spirit (the report's own kings line
for the round's rules: Spirit − Shadow −3.0 ± 2.8). **T2, no sideways reach, fixes both**: Death
Touch 49.0 and Spirit − Shadow −0.7 ± 2.4, with every power between 47.4 and 53.1 (a spread of 5.7;
rounds 11–13 had 12.9). It was picked as the best of twelve combinations on these games, so it
reads a little better than it is. T4 (forward only) does the same with one more cut; T1 and T3 are too
small (Shadow still ahead), T5 too large (Death Touch 42). **H3 over H1**: Haste 50.2 against 47.7,
and no clear change in draws (−1.0 ± 1.9). No trim changes the draw rate clearly. Games of the
official set drew 13.6% (round 14: 13.4%), White scored 52.1% (+13 ± 5 Elo).

Suggested package for the owner: **Haste H3, Mercy M2, Darkness D2, Death Touch T2**. Not adopted:
the owner decides. A confirmation round with the package as the rules, on fresh armies, would check
it without that selection.

**Owner decisions (2026-10-03).** Haste ("flame"): "the change is too cumbersome and not worth the
gain"; Mercy: "yes"; Darkness: "change too cumbersome but i don't like the 42% score, we must find a
different change to bring close to 50%"; Death Touch: "too cumbersome". So Mercy M2 is official
(`POWERS_BALANCED`), Haste and Death Touch keep today's readings, and Darkness keeps today's reading
until a simpler second part is found. Limits for that part: one short sentence, no exceptions, and
no reading that changes how other pieces move (a shelter is allowed). Built as lab toggles for
round 16 (`src/rules/power-fixes.test.ts`):

- `darknessPawnArmor`: enemy pawns cannot take your pawns.
- `darknessAuraPawns`: enemy pawns cannot take your pieces next to your king (all 8 neighbours,
  pawns too; not the king).
- `darknessKingStep2`: your king may also step two squares in a straight line, over an empty
  square, to an empty square (never a capture; it must not end in check).
- D1 (`darknessShelter`, built for round 14): your pieces diagonally next to your king cannot be
  taken. Round 14 measured +9.5 ± 3.1 (42.8 → 52.3).

Measured in round 16, below.

## Round 16 — four second parts for Darkness (2026-10-04)

The round's rules are the official set: round 14's readings with Mercy M2. Variants: the four
Darkness second parts above, as `Darkness~vd1` (D1), `~vpa` (pawn armour), `~vau` (pawn aura) and
`~vks` (king step). Seed 1616 (fresh armies), 64 pairs, `--armies perPair`, depth 3: 126 matchups,
16,128 games, 13 shards: 0–7 on this Mac (2 workers each, 95 min), 8–12 on 5 Kaggle notebooks
(150–165 min) (`sim/out/kp2-r16.report.md`). Every variant meets every power but its own, so each
candidate below is put in place from games played.

**Each candidate against today's Darkness on the same armies** (against the 11 other powers, 704
pairs, 95%):

| candidate | change | draws | game length (plies) |
|---|---|---|---|
| D1 shelter: your pieces diagonally next to your king cannot be taken | +10.1 ± 2.9 | +0.1 ± 1.8 | +4.4 ± 2.6 |
| Pawn armour: enemy pawns cannot take your pawns | +9.3 ± 3.3 | −0.8 ± 2.1 | −4.8 ± 2.8 |
| Pawn aura: enemy pawns cannot take your pieces next to your king | +0.5 ± 1.9 | −0.5 ± 1.3 | +0.7 ± 1.6 |
| King step: your king may also step two squares straight, over an empty square | +3.5 ± 2.3 | +1.1 ± 1.7 | +2.7 ± 2.1 |

**The field with each candidate in place** (each power against the other 11; ± about 2.5 for each
power; Spirit − Shadow as in round 15):

| Darkness | Darkness score | Spirit − Shadow | powers in 50 ± 4 | spread |
|---|---|---|---|---|
| today | 43.4 ± 2.5 | +1.7 ± 2.4 | 9 | 14.3 |
| D1 shelter | 53.5 ± 2.6 | −4.4 ± 2.4 | 10 | 13.0 |
| pawn armour | 52.7 ± 2.6 | −3.6 ± 2.4 | 10 | 13.2 |
| pawn aura | 43.9 ± 2.5 | +1.3 ± 2.4 | 9 | 13.6 |
| **king step** | **46.9 ± 2.5** | **−0.7 ± 2.4** | **10** | **11.9** |

With the king step, all twelve powers: Haste 57.6, Death Touch 52.9, Strike 51.8, Freeze 51.5,
Sacrifice 50.3, Mercy 49.5, Holy Light 49.0, March 48.9, Flight 48.0, Leap 47.9, Darkness 46.9,
Ice Wall 45.7.

**Reading.** No candidate puts Darkness at 50 with Spirit and Shadow level, because Death Touch
(52.9) is already above 50: with Darkness at 50, Shadow is about 1.5 points ahead of Spirit, and
both candidates that get there go past it. **The king step** brings Darkness from 43.4 to 46.9
(inside 50 ± 4) and keeps Spirit and Shadow level (−0.7 ± 2.4); it also gives the smallest spread.
**D1 and the pawn armour** overshoot (53.5 and 52.7) and put Shadow clearly ahead of Spirit (−4.4
and −3.6, both intervals below 0). **The pawn aura** does nothing measurable (+0.5 ± 1.9). No
candidate changes draws clearly. The official set's games drew 12.8%, White scored 50.8% (+10 ± 5
Elo for the first move), 97.0 plies.

**Outside Darkness.** Haste (today's reading, owner 2026-10-03) is the one power clearly outside the
band: 57.6 (round 13: 55.5; round 15 with H1: 46.6). Ice Wall is at its lower edge (45.7).

Suggested: **Darkness king step**. Not adopted: the owner decides. Open question for the owner: the
step may pass over a square an enemy attacks (only the landing square must not be in check), as
built; plain chess forbids castling through an attacked square.
