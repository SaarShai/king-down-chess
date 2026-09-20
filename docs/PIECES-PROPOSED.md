# Five proposed fairy pieces (2026-09-14)

Drawn from the balance lab (about 330,000 games), the guard study, the paladin and maester work, and
the ability matrix in `MATRIX.md`. **Four of the five are now built as lab pieces**, all outside the pool and promotion list:
the Ogre and Catapult (`docs/research/sim-new-pieces-2026-09-14.md`), the **Reaver**
(`docs/research/sim-reaver-2026-09-17.md`: full step overpowered and rejected; orthogonal reading is
the measured default at ~4.0 pawns, +7.1 decisive, neutral balance) and the **Templar**
(`docs/research/sim-templar-2026-09-17.md`: rejected — only 4–8% of its moves come from a capital, it
plays as a weak king-stepper and drags draws). Only the **Squire** is unbuilt.
Each piece below names the matrix cells it fills, what it is for, what to expect, what to watch, and
how to measure it.

## What the lab taught, as design rules

1. **Capturable.** Immunity is what drags games: the immortal guard with reach was the worst piece we
   measured, the one-step wall is tolerable only because it is slow. A new piece may be hard to take;
   it may not be impossible to take.
2. **A sharp job.** Decisive share and stuck endings are the first numbers Saar reads. Every piece
   below exists to break something — a pawn shield, a blockade, a second line — not to hold something.
3. **Reach must be earned.** Long reach that works from move one hands the first mover the edge (the
   paladin's +0.02 a piece is the only balance shift we found). Reach behind a condition — a screen,
   a zone, a capture first — arrives later and more evenly.
4. **One sentence to state.** The rules Saar rejected were the fiddly ones (one capture per lifetime).
5. **A new kind of move.** Four of the five shipped fairy pieces step one square. New pieces should
   move differently from each other and from those four.
6. **Fill an empty cell.** Arriving, control of any piece, hopping over enemies, and every capital
   rule are empty in `MATRIX.md`. Each piece below takes one.

## The five

| | Piece | Letter | Moves | Fills | One line |
|---|---|---|---|---|---|
| 1 | **Catapult** | C | rook slide; captures by lobbing over one enemy | hop over enemies only (4e), take ≠ move (4b) | siege engine: takes the piece *behind* the enemy's front line |
| 2 | **Squire** | E | in hand, then a one-step | arriving, home rank only (1a) | the reserve: a piece you place when you need it |
| 3 | **Ogre** | O | one-step; shoves | control any adjacent piece (5a) | the one answer to the immortal wall |
| 4 | **Templar** | T | one-step; queen on the capital | capital rule C3 | the centre becomes a prize |
| 5 | **Reaver** | V | knight; steps away after a kill | on-capture trigger (6a), a leaper | hit and run |

### 1. Catapult (C)

**Rule.** Moves like a rook through empty squares and never captures by moving. It captures by
lobbing along a rank or file: the first piece in the line must be an enemy (the screen); the
Catapult takes the first piece beyond the screen, at any distance, and lands on that square. It may
take a king this way, so it gives check through a screen.

**Why.** Kings behind pawn shields are what drawn endings are made of; the Catapult attacks the
second line, the piece *behind* the piece. It is the xiangqi cannon with one change — the screen must
be an enemy — which keeps it silent at move one: at the start, the first piece on every line is a
friend, so it has no shot until lines open.

**Expect.** 3.5–4.5 pawns while the board is full, bleeding as pieces vanish (fewer screens). A
self-limiting piece: strong in the middlegame, quiet in the ending, which is the profile we want.
**Watch.** The first-strike edge once files open; shots per game and the ply of the first shot tell
whether it is a siege weapon or a sniper. If it snipes, shorten it to three squares beyond the screen.
**Engine.** A paladin-style ray with one state bit ("passed the screen"); a normal displacement
capture, `captures: [target]`. Attack detection for check uses the same walk.

### 2. Squire (E)

**Rule.** Begins in hand: its home-rank square is empty at the start. Instead of moving, its owner may
place it on any empty square of their home rank, and may do so to block a check. Once placed it moves
and captures one square in any direction.

**Why.** Arriving is the one ability group with no piece, and Shogi shows what a drop does: a defender
that appears exactly when needed, and a real decision about when to spend it. The empty square is a
cost the army pays from move one — a hole in the back rank — so the reserve is not free.

**Expect.** About 3 pawns once placed (a non-royal king) plus the tempo of choosing the moment.
Draws: one drop is a small dose; Shogi's drops raise mates, not draws.
**Watch.** A dropped block can save a lost game. If decisive share falls, the fix is one clause: it may
not be placed to block a check.
**Engine.** A hand (one byte a side) on `Position`, a drop move (`from = −1`), a hand field in FEN as
Crazyhouse writes it (`[E]`), one Zobrist key for the hand. The largest of the five to build.

### 3. Ogre (O)

**Rule.** Moves and captures one square in any direction. Instead of moving, it may shove one
adjacent piece — friend or enemy, never a king — one square straight away from itself onto an empty
square. A shoved guard moves like any other piece.

**Why.** The guard's immortality is its identity and Saar keeps it; guard blockades are the game's
draw engine. The Ogre is the only piece that moves an enemy guard without breaking the rule that
nothing captures it. It also breaks pawn chains and pushes pieces into archer lines and beast reach.

**Expect.** About 3 pawns; decisive share up in guard games; a piece that makes tactics rather than
winning material. **Watch.** Shove-and-shove-back loops (threefold repetition already covers them);
a shove that unmasks a check is a discovered attack and should stay legal.
**Engine.** One new move shape, `push: [from, to]`, through make/unmake, LAN and the AI's quiet-move
ordering. Cheap.

### 4. Templar (T)

**Rule.** Moves and captures one square in any direction. While it stands on one of the four capital
squares (d4, d5, e4, e5) it moves and captures like a queen.

**Why.** Saar's capital as a piece. The centre becomes a prize worth fighting for and a target worth
dislodging — the Ogre shoves it out, the Catapult lobs at what stands behind it. It proves the zone
machinery every other capital rule will need.

**Built 2026-09-17; rejected on measurement.** The search almost never parks the piece on a capital
(4% of its moves; 8% with a 120 cp location bonus), so it plays as a weak king-stepper: implied value
2.15–2.39 pawns, decisive share −5.4 ± 2.7 points, draws +5. Full record:
`docs/research/sim-templar-2026-09-17.md`. A zone mechanic needs the zone to be worth holding for
someone besides the zone's own piece.

### 5. Reaver (V)

**Rule.** Moves and captures like a knight. After a capture it may immediately step one square in any
direction onto an empty square as part of the same move. The step never captures.

**Why.** The mirror of the paladin's bargain: the paladin pays with its life, the Reaver keeps its
winnings. It strikes and slips out of the recapture, so it trades up rather than off. It is also the
only leaper among the fairy pieces, and a knight is the shape every player already knows.

**Built 2026-09-17; the watch note fired.** The full eight-direction step **does not converge** —
even priced at 5.04 pawns the Reaver army beat a knight army by +188 ± 32 Elo — so it is rejected as
overpowered. The orthogonal-only step is the lab default: **4.04 ± 0.56 pawns**, +7.1 ± 2.5 decisive
points at depth 3, balance neutral — but the sharpening **does not survive depth 4** (+0.5 ± 6.5) and
a pair of Reavers does not interact (−2.3 ± 3.9), so the piece is **not confirmed** and not a pool
candidate. Full record: `docs/research/sim-reaver-2026-09-17.md`.

## Set aside

- **Shieldbearer** (immune to shots, shields its neighbours): immunity drags — the guard study.
- **Necromancer** (returns a captured piece): material that comes back lengthens games.
- **Wraith** (moves through pieces): the paladin-through-enemies test was degenerate.
- **Immobiliser** (freezes adjacent enemies): Ultima's experience — fortresses and draws.

## How to measure, one piece at a time

Each piece takes about an hour of lab time at depth 3: the odds match for its value (300 games,
`--experiment values --pieces X --eloPerPawn 64`), then a paired A/B on 40 arrangements with the
piece dealt to both sides (1,600 games) for balance, decisive share, stuck endings and length,
plus the piece's own counters (shots, drops, shoves, capital moves, escapes). Build order by cost
and by what they prove: **Ogre** and **Templar** first (an afternoon each, and they attack the draw
engine and the capital directly), then **Reaver**, then **Catapult**, then **Squire**.

The pool is 15 letters and fairy density at equal value raises draws, so new pieces should replace
or rotate rather than pile on. One idea for later: six kings, six armies — each king's army carries
one signature piece, so the choice of king is also a choice of piece.
