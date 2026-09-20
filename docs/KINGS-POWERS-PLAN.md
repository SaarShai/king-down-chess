# Kings' powers — implementation plan (2026-09-14)

The twelve powers of `docs/RULES.md` §4, stated as the engine would state them, with the seam, the
state, the traps, the UI and the lab measurement for each. **This is a plan. No code here, and no
file under `src/` is touched by it.** TASKS.md "Phase 2 — Later" points at this document.

Read with: `docs/RULES.md` §4 (the powers), §5 (cards), §6.5 (the use counts), §6.6 (army colour
follows the king), `docs/MATRIX.md` §A.2 (where each ability lives in the engine),
`docs/PIECES-PROPOSED.md` (the Squire shares the tier-3 seam), `LESSONS.md`.

---

## 0. Three decisions that shape everything below

### 0.1 A power activation is a `Move`

Every power that the player *fires* — Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice — is
generated as an ordinary `Move` object by `genPiece`, not as a second kind of turn.

This is not a style choice. `Move` is the one thing the whole project already carries end to end:
`legalMoves` filters it for king safety, `makeMove` applies it, `Game.history` stores the position
before it (so undo is free), `toLan` prints it, `playLan` replays it, the search's `apply`/`undo`
mirror it, `sim/game.ts` counts it, and `main.ts` clicks it. A power expressed any other way needs
all of that again.

Consequences that fall out for free:

- **Usable while in check?** Yes, and only when it resolves the check — because `legalMoves` makes
  the move and looks at the mover's own king, like every other move.
- **Undo.** `Game.undo()` restores `history[i].pos`, so any state a power writes into `Position` is
  restored with it. Nothing new.
- **Repetition.** `Game.key()` is the first two FEN fields. See §0.3.
- **The AI.** The power move is in the root move list, so the search plays it when it scores well.

### 0.2 The "powers never take a king, never give check or mate" invariant

§4 says powers cannot capture a king nor give check/mate. Enforce it **on the power's own action**,
not on the consequences:

1. No power move ever carries a king square in `captures`. One guard clause per generator.
2. No power adds a square to `isAttacked`. Every power move is either move-only, or its capture
   geometry is already in the attack tables.

A freeze that leaves the opponent with no legal reply is still mate, and a Haste whose second move
checks is still check — those are the *pieces* checking, not the power. The alternative reading
("a power may not lead to mate") needs a legality clause that inspects the position after the
opponent's reply. It is unimplementable at a sane cost and nobody at the table could apply it.

Test shape: extend `crossCheckAttacks()` in `src/rules/rules.test.ts` (it already proves
`isAttacked` equals `genPiece('attacks')` on random boards) to run with every power switched on,
and add one test per power asserting no generated move captures a king.

### 0.3 State that changes legal moves must reach the repetition key

`Game.key()` is `toFen(pos).split(' ', 2).join(' ')` — **board and side to move only**. A live
freeze mark, a pending Haste, or a charge counter all change which moves are legal, so two
positions that differ in them are not the same position. If the power state lands in a trailing FEN
field, `key()` must be widened to include it. This is the single easiest bug to ship in tier 2.

`fromFen` destructures the first six fields and ignores the rest, so appending a seventh field is
backwards compatible with every stored FEN in the repo.

---

## 1. The twelve powers

Each entry: the engine's sentence · open questions · seam and state · position plumbing · traps ·
UI · lab.

Piece letters: P N B R Q K, A archer, L paladin, G guard, M maester, S beast, O ogre, C catapult.

---

### 1.1 Frost A — Freeze (2 uses)

**Rule.** As its whole turn, a side with an unspent Freeze charge marks one enemy piece that is not
a king; until that side moves again, the marked piece generates no move and no other move may
displace it.

**Open questions.** (a) Does the mark cost the turn, or ride alongside a normal move? (b) May a
maester swap or an ogre shove move a frozen piece? (c) Is a freeze that produces stalemate a draw?

**Seam.** New `Move` shape `{ from: kingSq, to: targetSq, captures: [], power: 'freeze' }`,
generated in `genPiece` `case K`. Application in `makeMove`. One filter in `pseudoMoves`:
skip square `frozen[c]`, and drop any move whose `swap` or `shove.from` names it.

**State.** Per side: a charge count (2 bits) and a frozen square + the ply it expires on. Six small
numbers on `Position`, or one packed `Int32Array(2)`.

**Plumbing.** FEN: a seventh field. Zobrist: 64 new keys for "frozen square", appended *after* the
existing blocks so no historic key moves (`src/ai/zobrist.ts` says why the draw order is history).
Repetition: must include the mark — see §0.3. Undo: free (§0.1). Search: the mark is not on the
board, so `apply`/`undo` need their own save/restore stack beside `undoSq`/`undoPc`; save the whole
packed word per ply and restore it.

**Traps.** A frozen **guard** is a wall that cannot even shuffle — the most draw-ish thing in the
game. A frozen **paladin** is the cheapest way to survive a paladin. A frozen **beast** cannot
chain. Freeze does not stop an **archer** being captured, and it does stop the archer shooting
(the shot is the archer's move). Freeze + Ice Wall on the same turn is impossible (each is a whole
turn), which is what keeps Frost from locking a piece down entirely.

**UI.** King picker at setup. No activate button needed: select the king, and the enemy pieces you
may freeze light up in a new "power target" colour (not the capture colour — a freeze takes
nothing). A charge badge, "Freeze 2". LAN `Kd1!Fe5`.

**Lab.** Paired A/B, both kings Frost:Freeze, against `pb-ab-base24`. Counters: freezes used per
game, ply of first freeze, what got frozen by letter. **Risk: denial raises draws** — the same
family as immunity (LESSONS, guard study).

---

### 1.2 Frost B — Ice Wall (2 uses)

**Rule.** As its whole turn, a side with an unspent Ice Wall charge marks one friendly piece that
is not a king; until that side moves again, no enemy move may include that square in `captures`.

**Open questions.** (a) Turn cost, as above. (b) May a warded piece be shoved by an ogre, or
swapped by an enemy maester under `maesterSwapEnemy`? (c) May the ward go on a guard, which is
already immune to everything but a king?

**Seam.** Same `Move` shape as Freeze. The block is **one filter in `pseudoMoves`**: drop any move
whose `captures` include the warded square. That is cheaper and safer than a square-aware
`canCaptureAt`, because `canCapture(att, vic)` sees no squares and is called from eight places.

**`isAttacked` needs no change.** It is only ever asked about a king square (`inCheck` in
`engine.ts`, `attacked()` in `search.ts`) and a king can never be warded. Worth a comment in the
code so nobody "fixes" it later.

**State, plumbing.** Identical to Freeze: a charge count and a warded square + expiry. Same FEN
field, same 64 Zobrist keys reused with a second block, same search save/restore.

**Traps.** A warded **guard** is immune to the king as well — briefly immortal. A warded piece
still blocks sliders and still gives check. A ward does **not** stop a beast chain from passing
*around* it, but a chain that names the warded square dies whole. Ice Wall answers a paladin the
turn it charges, which is the power's best moment.

**UI.** As Freeze, with friendly targets. Badge "Ice Wall 2". LAN `Kd1!We2`.

**Lab.** Paired A/B. Counters: wards used, what got warded, captures prevented (count the moves the
filter dropped). **Risk: the highest draw risk of the twelve.** Immunity is the measured draw
engine; two turns of it per game is a small dose, but read `deadMaterial` and `capped` first.

---

### 1.3 Flame A — Strike (1 use)

> **Status 2026-09-17: built** (`?kings=flame:strike`), with two readings under `strikeMode`:
> `move` (as written) and `capture` (the card game's verb, RULES.md §5). The `move` reading measured
> **decisive −20.2 ± 5.8 at depth 4** (a draw engine; `docs/research/sim-kings-2026-09-16.md`); the
> `capture` reading is under measurement. State lives on `Position.strike` + FEN field 7, not a
> charge word — the "plumbing" section below is what shipped, in that simpler shape.

**Rule.** As its whole turn, a side with an unspent Strike charge moves one of its own pieces that
is not a king along queen lines, capturing as that piece normally may capture.

**Open questions.** (a) Does the struck piece keep its own capture rules, or capture as a queen?
(b) Does a struck paladin remove itself? (c) May the struck piece be a guard, which never captures?

**Seam.** `genPiece`, a branch before the per-type `switch`: if the side has a charge, call the
existing `slider(board, from, c, p, DIRS8, mode, out)` with **the real piece byte as the attacker**
and tag the moves `power: 'strike'`. Passing the real byte is the whole answer to (a) and (c):
`canCapture` then keeps every piece-vs-piece rule — a struck guard still takes nothing, a struck
paladin still cannot take a king, a guard is still taken only by a king.

**State.** One charge bit per side.

**Plumbing.** Same FEN field and search save/restore as Freeze (the counter is the state). No new
Zobrist block beyond the charge word. `isAttacked` **does not change**: a Strike is only available
on the mover's own turn, so it can never be a standing threat, and §0.2 holds.

**Traps.** A struck **archer** moves by displacement, which it never otherwise does; a struck
**catapult** captures by moving, which it never otherwise does — both are fine, but both will look
like bugs to a player, so the highlight must say "power". A struck **beast** does not chain (the
chain lives in `case S`). Strike is the answer to a guard blockade only if the guard is not the
thing in the way.

**UI.** Select any own piece; queen rays appear in the power colour. Badge "Strike 1".
LAN `Nb1!Sb7`.

**Lab.** Paired A/B. Counters: strike used (share of games), ply of use, material won by it.
**Risk: low — one tempo, one shot, and it is sharp.** This is the family LESSONS calls "a sharp
job", so expect decisive share up.

---

### 1.4 Flame B — Haste (1 use)

**Rule.** A side with an unspent Haste charge may declare it on a move; the same piece may then
make one more move before the turn passes, and the second move is optional.

**Open questions.** (a) Is the second move optional? (b) May the first move leave the mover's own
king attacked? (c) Must it be the same piece? (d) Does a promotion, a paladin self-removal or a
beast chain end the Haste?

**Seam.** The turn flip in `makeMove`. The precedent is `secondPlayerDoubleFirstTurn`, which does
exactly this with `pos.ply === 1` and therefore needs no state. Haste is chosen, so it needs state:
a flag plus the square the piece now stands on.

**State.** Per side: one charge bit, plus `hasteSquare` (−1 = not mid-haste).

**Plumbing.** This is the power with the widest blast radius.

- **`moverAt(ply, rules)`** must learn Haste. LESSONS 2026-09-14: a rule that changes who moves
  when invalidates every metric that reads the side off ply parity, and that fault already cost one
  campaign (`killerMove`, `interest`, `decisionCost` in `src/sim/analyze.ts`, plus `tools/mine.ts`,
  `tools/guard-study.ts`, `tools/warden-report.ts`). Unlike `secondPlayerDoubleFirstTurn`, Haste
  fires at a ply nobody can compute from the index, so `moverAt` cannot answer from `rules` alone —
  the stored game must record it. **Cheapest fix: `PlyRecord` gains an optional `by` field, and
  `moverAt` keeps serving every rule that is positional.**
- FEN: the haste square goes in the seventh field.
- Repetition: a position mid-haste is not the same position — §0.3.
- Search: `apply`/`undo` restore the packed word; the side to move at a node is currently
  `rootTurn ^ (ply & 1)`, which is **wrong mid-haste**. That expression appears in `negamax` and
  `quiesce` and is the hottest line in the engine. Either store the colour per ply in a small array,
  or forbid Haste at the search root and accept that the AI never uses it (bad — then the lab
  measures nothing).

**Traps.** Haste + **beast** = two chains in one turn, the largest material swing in the game.
Haste + **paladin** = capture, die, and the second move is void — the charge is burned. Haste +
**archer** = two shots. Haste + **promotion** = a pawn that promotes and then moves as a queen.
Haste + **maester swap** = a swap then a move, which is a two-square relocation of a third piece.

**UI.** A real toggle is needed here, because Haste is declared *before* the first move: a "Haste"
button that arms the charge, then two ordinary moves. Badge "Haste 1". LAN: join the two halves,
`Nb1-c3!Hc3xe4`.

**Lab.** Paired A/B **after** `moverAt` is fixed, and strike every parity-derived metric from the
table until it is. Counters: haste used, material won on the double move, beast chains inside a
haste. **Risk: the biggest single-turn swing of the twelve; expect decisive share up and a first-
mover edge.**

---

### 1.5 Stratus A — Flight (1 use)

**Rule.** As its whole turn, a side with an unspent Flight charge moves one of its own pieces that
is not a king to any empty square in its own half (ranks 1–4 for White, ranks 5–8 for Black).

**Open questions.** (a) May a pawn fly backwards, and does that give it a double step again?
(b) May a pawn fly to its own first rank? (c) May it be used to block a check?

**Seam.** `genPiece`, a branch like Strike's: for each own non-king piece, every empty square in the
own half, tagged `power: 'flight'`. Move-only, so `isAttacked` does not change.

**State.** One charge bit per side.

**Plumbing.** Same as Strike. The one interaction: `guardMayLand` must be honoured under
`guardNoSecondRank`, so route the generated square through it — the maester's swap generator
already does exactly this and is the pattern to copy.

**Traps.** A pawn flown behind its start rank regains the double step, because the double step is a
**rank test, not history** — that is the existing design and it needs no new state, but say it in
the rule. A white pawn on rank 1 still moves; a black pawn on rank 1 has promoted already and
cannot be there. Flying a **guard** home rebuilds a blockade. Flying a **catapult** behind the
enemy's line is the piece's dream and should be watched.

**UI.** Select a piece, empty squares in your own half light up in the power colour. Badge
"Flight 1". LAN `Nb1!Fe1` (`!L` for Leap is taken — use `!V` if `!F` collides with Freeze; pick the
letters once, in `toLan`).

**Lab.** Paired A/B. Counters: flight used, what flew, rank flown from and to. **Risk: a defensive
power — it returns a piece home. Read draw rate and `kingNeverMoved` first.**

---

### 1.6 Stratus B — Sacrifice (1 use) — *the tier-3 seam*

**Rule.** As its whole turn, a side with an unspent Sacrifice charge removes one of its own pawns
from the board and puts one of its own pieces that left the board earlier on that square.

**Open questions.** (a) What enters the reserve — captures only, or any piece that left the board
(a self-removed paladin)? (b) May it return a guard? (c) Does the sacrificed pawn join the reserve?
(d) May the returned piece arrive giving check?

**Seam.** A captured-pieces reserve on `Position` — the one ability group `MATRIX.md` §A.1 marks
empty ("Arriving"), and footnote [1] names the seam: a hand on `Position` plus a drop move. The
Squire in `PIECES-PROPOSED.md` needs the same thing, so build it once.

**The move needs no new field.** A Sacrifice is `{ from: pawnSq, to: pawnSq, captures: [], promo: T }`:
`landed()` already returns `piece(m.promo, colorOf(mover))`, and `makeMove` zeroes `from` then
writes `to`, which for `to === from` is exactly right. The only new work is decrementing the
reserve. The archer's shot and the paladin's charge already use the `to === from` shape, so every
make/unmake path handles it.

**State.** `hand: Uint8Array(2 * 14)` on `Position` — a count per colour and type.

**Plumbing.**
- FEN: Crazyhouse-style, `[QRbn]` appended to the board field, as `PIECES-PROPOSED.md` proposes.
- Zobrist: one key per (colour, type, count index 0…7), appended after every existing block.
- **Repetition needs nothing new.** The reserve only grows on a capture, and a capture resets
  `halfmove`; a Sacrifice moves a pawn, which also resets it. Two positions with the same board and
  the same side to move *since the last irreversible move* therefore always carry the same reserve.
  Write this argument into the code comment or someone will add a field to `Game.key()`.
- Search: the reserve is not on the board, so `apply`/`undo` save and restore the counts. The TT is
  the one place that does need the hash: two lines can reach one board with different reserves when
  a promotion is involved.

**Traps.** Returning a **guard** puts immunity back on the board — the measured draw engine, and
§6.13 already bars a pawn from *becoming* a guard, which this would undo by another road.
Returning a **paladin** with `paladinKamikaze` gives the piece a second life. A returned piece may
arrive giving check, which is a normal piece checking and is allowed under §0.2. The reserve also
changes `insufficientMaterial`: a side with a pawn and a charge is not dead material.

**UI.** Select a pawn; a small tray of your captured pieces appears (the `#took-w` / `#took-b`
lists are already rendered and are the natural place to click). Badge "Sacrifice 1".
LAN `!Rd2=R`.

**Lab.** Paired A/B, and a second arm that bars the guard. Counters: sacrifice used, which piece
came back, ply of return. **Risk: material that returns lengthens games — `PIECES-PROPOSED.md` set
the Necromancer aside for exactly this.**

---

### 1.7 Mud A — March (3 uses, or always on)

**Rule.** A pawn of this side may step two squares forward from any rank, if both squares are empty.

**Open questions.** (a) Always on, or the rulebook's 3 uses (§6.5)? (b) With en passant off, is the
pawn race the intended effect?

**Seam.** `genPiece` `case P`: drop the `rank(from) === startRank` test. One line. Move-only, so
`isAttacked` does not change.

**State.** None, if always on. A charge counter, if counted.

**Plumbing.** None at all in the always-on reading. That is why it is tier 1.

**Traps.** **En passant is off** (§1 of RULES.md), so a marching pawn walks straight past an enemy
pawn with no answer. That is the power's real content and it is much larger than the rulebook's
sentence suggests: passed pawns arrive in half the moves, promotions rise, and the fairy pieces
that are slow (guard, maester, beast, archer, ogre) cannot come back to stop them. March + Leap on
one army is not possible (one power per king). March contradicts **Darkness**, which deletes the
double step — only a problem if a future variant hands one side two powers.

**UI.** Nothing. The move appears in the legal list and the existing click flow plays it.

**Lab.** Paired A/B, both kings Mud:March, against `pb-ab-base24`. Counters: double steps from a
non-home rank per game, promotions per game, plies. **Risk: promotions and speed up, draws down —
the good direction. Watch the first-mover edge.**

---

### 1.8 Mud B — Leap (3 uses, or always on)

**Rule.** A rook, bishop or queen of this side passes over its own pawns; every other blocker still
stops the ray.

**Open questions.** (a) Always on, or 3 uses? (b) Does it reach the catapult's move ray and lob
screen, and the guard's and maester's two-square lab steps? (c) Over *any* friendly piece, or only
pawns?

**Seam.** `slider()` — when the blocker is a friendly pawn, continue instead of break. **And the
matching branch in `isAttacked`'s ray walk**, which is a hand-written mirror of `genPiece` and the
one place in the engine where the two can drift. The `blockedForSliders` / `blockedForPaladin` pair
already there is the exact pattern to extend, and `crossCheckAttacks()` is the test that catches a
mistake.

**State.** None, if always on.

**Plumbing.** None beyond the rule fields.

**Traps.** For R/B/Q, move and capture are the same ray, so Leap **does** change the attack set —
unlike every other tier-1 power. The **paladin** already jumps friends, so Leap is a no-op for it.
The one-steppers (G M S O K) are unaffected. Keep the **archer's** shot table and the **catapult's**
lob out of it: those are separate tables, the lob's screen rule is the piece's identity, and the
simplest rule to state is "Leap changes rays, not shots". Reach that works from move one is the one
thing the lab found that moves balance (the paladin's +0.02 a piece), so expect a White edge.

**UI.** Nothing.

**Lab.** Paired A/B. Counters: slides over an own pawn per game, ply of the first one, white score.
**Risk: a first-mover edge, for the paladin's reason — reach on an open board.**

---

### 1.9 Spirit A — Holy Light (always on)

**Rule.** An enemy pawn may not capture this side's king, and this side's king may not capture a
pawn.

**Open questions.** (a) Does "cannot be captured by pawns" mean a pawn gives no check, so a pawn can
never mate this king? (b) Does the king keep its capture of everything else, a guard included?

**Seam.** `canCapture(att, vic)` — two lines, and **no signature change**. A capture is always
cross-colour, so the victim's colour is `colorOf(att) ^ 1`; the function has the attacker byte and
can decide both directions from it.

```
attacker P, victim K → false when the K side plays Holy Light
attacker K, victim P → false when the K side plays Holy Light
```

**State.** None.

**Plumbing.** None. `isAttacked` follows automatically: its `hit()` helper already calls
`canCapture(p, victim)` with the victim's type, so the pawn loop stops checking a Spirit king with
no change at all. This is the cleanest of the twelve.

**Traps.** A pawn can no longer mate or check this king, so **mating nets change**: a pawn on the
seventh is no longer a threat to the Spirit king itself. `insufficientMaterial` still counts a pawn
as mating material, correctly, because it promotes. A Spirit king still takes a **guard** (only a
king may), which matters — see Mercy. Holy Light + **Darkness** on the two sides is a good pairing
to test: Darkness pawns capture straight ahead, and a Spirit king is immune to them anyway.

**UI.** Nothing but the picker and a line in the piece guide (`#rules` dialog, `RULES[K]` in
`main.ts`).

**Lab.** Paired A/B. Counters: checks per game, pawn-delivered mates (should fall to zero), plies.
**Risk: a shield on the king raises draws — small, because it only covers pawns.**

---

### 1.10 Spirit B — Mercy (always on)

**Rule.** This side's king moves one or two squares in any direction, passing over its own pieces
and stopped by enemy pieces, and it captures nothing.

**Open questions.** (a) Is the two-square step blocked by an enemy on the middle square? (b) Does
"captures nothing" include a guard — which only a king may take? (c) May two kings stand adjacent,
since a Mercy king attacks nothing?

**Seam.** `genPiece` `case K`: replace the `leaper(DIRS8)` call with two-square rays that jump
friends and stop at enemies — the paladin's shape, capped at length 2 and move-only. In
`isAttacked`, the DIRS8 loop's `hit(s, K)` must **not** fire for a Mercy king.

**State.** None.

**Plumbing.** None. The attack change is one condition.

**Traps.**

- **A Mercy king attacks nothing, so the enemy king may walk up to it.** The Mercy king is then in
  check and must move; the enemy king can never be answered in kind. This is a real and interesting
  asymmetry, not a bug.
- **A Mercy king can never capture a guard, and only a king may.** An enemy guard becomes
  permanently uncapturable against a Spirit:Mercy army — the exact permanent-immunity pattern the
  lab calls the draw engine (`PIECES-PROPOSED.md` design rule 1). This is the sharpest interaction
  trap in the whole document and it needs a designer answer before a line is written.
- A Mercy king cannot take a **paladin** that lands next to it, cannot clear a pawn, and cannot
  take part in an ending. `insufficientMaterial` does not need changing (it counts material, not
  who may take it), but K+N vs Mercy-K is now much harder to win.

**UI.** Picker, piece guide line. The two-square jump is an ordinary destination click.

**Lab.** Paired A/B, plus a second arm on a guard-heavy pool. Counters: draw rate, `deadMaterial`,
guard survival, king moves per game. **Risk: high draw risk through the guard clause; low
otherwise.**

---

### 1.11 Shadow A — Death Touch (always on)

**Rule.** This side's king captures an adjacent enemy without leaving its square.

**Open questions.** (a) Does the king also still capture by moving onto the enemy? (b) May it eat a
piece that is defended, since it does not step into the defended square?

**Seam.** `genPiece` `case K`: add archer-style shots, `{ from, to: from, captures: [target] }`, for
the 8 neighbours. **`isAttacked` needs no change**: the king already attacks its 8 neighbours, and
the shot covers the same squares.

**State.** None.

**Plumbing.** None. The `to === from` shape is already handled by `makeMove`, `apply`/`undo`,
`toLan` (`Kd4*d5`) and — the pleasant surprise — by the UI: `clickPath(m)` in `main.ts` returns
`[captures[0]]` when `to === from`, so a Death Touch capture is already a single click on the
victim, with no UI change at all.

**Traps.**

- **A defended piece can be eaten for free.** A normal king may not capture into a defended square;
  a king that does not move is legal as long as *its own* square is safe afterwards. This is a much
  larger buff than the sentence suggests and it is the power's whole point.
- **The guard.** Only a king takes a guard, and this king takes it without stepping into the
  blockade. Death Touch is the best anti-draw power of the twelve.
- A Death Touch king may not shoot a **king** (kings never capture kings in a legal position) — the
  §0.2 invariant holds by construction.
- Whether the king *also* keeps the displacement capture decides whether it is a sniper or a
  brawler. One verb per piece is the archer precedent.

**UI.** Nothing. Piece guide line.

**Lab.** Paired A/B. Counters: king captures per game, guard captures per game, draw rate,
`kingNeverMoved`. **Risk: low and in the good direction — the sharpest job in the list. Watch king
safety: a king in the middlegame melee may just die.**

---

### 1.12 Shadow B — Darkness (always on)

**Rule.** This side's pawns step one square diagonally forward and capture one square straight
forward; they have no double first step.

**Open questions.** (a) Is the diagonal step forward only, or also backward? (b) Do both the step
and the capture promote on the last rank? (c) Is the double step gone even under March (a different
king, so only a future two-power variant)?

**Seam.** `genPiece` `case P`: swap the two delta sets and drop the double step. **And the pawn
branch of `isAttacked`**, which walks `[-1, 1]` files at `-fwd(by)` and must become the single
square straight ahead for a Darkness side.

**State.** None.

**Plumbing.** None. Promotion follows on its own: `case P`'s `push()` helper promotes by rank and is
already called from both the move and the capture path.

**Traps.**

- **Pawn structure inverts.** Doubled pawns now defend each other; pawn chains run up the file, not
  across; a piece directly in front of a pawn is *capturable*, where today it is a blockader. Pawn
  walls stop working, which is good for decisiveness.
- **The evaluation will be wrong.** `src/ai/eval.ts` carries fitted king-shield terms
  (`SHIELD_PAWN`, `SHIELD_GUARD`, `SHIELD_OTHER`, `SHIELD_OPEN`) that assume today's pawn. A
  Darkness game should be measured with those terms re-fitted, or at least with the caveat written
  into the report — otherwise the search misplays the side that has the power and the A/B reads the
  evaluation, not the rule. `src/sim/tune.ts` is the existing path for a re-fit.
- Darkness pawns never capture on the diagonal, so a **guard** standing diagonally in front of a
  pawn is untouchable by it, and a guard standing *directly* in front is not.
- En passant is off, so nothing there.

**UI.** Nothing. Piece guide line, and the pawn sprite could carry the army colour.

**Lab.** Paired A/B, and a second run with re-fitted shield weights if the first shows a large
swing. Counters: promotions, draws, plies, decisive share. **Risk: a large structural change; the
evaluation is the confound, not the rule.**

---

## 2. Implementation order

### Tier 1 — stateless rule modifiers (this week)

**Holy Light · Mercy · Death Touch · Darkness · March · Leap.**

All six are pure functions of the board plus the side's chosen power. No new `Position` field, no
FEN change, no Zobrist key, no repetition change, no undo work, no search state. The lab can A/B
them as soon as the rule fields exist.

| file | work |
|---|---|
| `src/rules/rules.ts` | `KingChoice` type, `kings: [KingChoice \| null, KingChoice \| null]` on `Rules`, a `CHOICES` entry, `parseRule` accepting `kings=Spirit:Mercy` / `kingWhite=…` |
| `src/rules/engine.ts` | `canCapture` +2 lines (Holy Light) · `case P` (March, Darkness) · `case K` (Mercy, Death Touch) · `slider` (Leap) · `isAttacked`: pawn branch, king branch, slider rays |
| `src/rules/rules.test.ts` | ~20 new `it()`s: one generation test per power, one `isAttacked` agreement test per power, `crossCheckAttacks()` re-run with each power on, and "no power move captures a king" |
| `src/main.ts`, `index.html` | the king picker (two selects) + `?kings=` · six lines in the `RULES[]` piece-guide table |
| `docs/RULES.md`, `docs/MATRIX.md` | §4 becomes shipped-with-a-toggle; the ○ cells in MATRIX A.1 become ◐ |

**Size: 5 files, roughly 120 lines of engine, ~20 tests. One day, one agent.**
The lab needs nothing new: a symmetric A/B (both kings the same) is `--rule kings=Mud:March`.

### Tier 2 — charges and timed marks

**Freeze · Ice Wall · Strike · Haste · Flight.**

All five need per-side state on `Position` and therefore every plumbing seam at once.

| file | work |
|---|---|
| `src/rules/engine.ts` | `Move.power` · `Position.powers` · generators in `case K` (Freeze, Ice Wall) and the pre-switch branches (Strike, Flight) · `makeMove` applies charges, marks and the Haste turn hold · `pseudoMoves` filters the frozen and warded squares |
| `src/rules/setup.ts` | the seventh FEN field, both directions · `toLan` / power notation |
| `src/ai/zobrist.ts` | one appended block for the marks and the charges — appended, so historic keys do not move |
| `src/game.ts` | **`key()` must include the power field** (§0.3) |
| `src/ai/search.ts` | a per-ply save/restore of the packed power word in `apply`/`undo`/`applyQuiet` · the side-to-move expression under Haste |
| `src/rules/engine.ts` (`moverAt`) + `src/sim/game.ts` | `PlyRecord.by`, so parity-derived metrics survive Haste (LESSONS 2026-09-14) |
| `src/sim/game.ts` | five new `Events` counters |
| `src/main.ts` | a power-target highlight, a charge badge, a Haste arm button |
| tests | `rules.test.ts` (+~25), `game.test.ts` undo and repetition across a mark (+4), `search.test.ts` make/unmake round-trip with power state (+3) |

**Size: 9 files, roughly 350 lines, ~32 tests. Two to three days.**
Do Freeze and Ice Wall first — they share one shape and prove the whole plumbing. Then Strike and
Flight (charge only, no mark). **Haste last, and only after `moverAt` is fixed**: it is the one
power that changes whose turn it is, and the project has already paid for that mistake once.

### Tier 3 — the captured-pieces reserve

**Sacrifice**, and with it the **Squire** of `PIECES-PROPOSED.md` (drop moves, `from = −1`).

| file | work |
|---|---|
| `src/rules/engine.ts` | `Position.hand` · `makeMove` appends every piece that leaves the board · the Sacrifice generator (reuses `Move.promo`, see §1.6) |
| `src/rules/setup.ts` | Crazyhouse-style `[…]` in FEN, both directions |
| `src/ai/zobrist.ts` | an appended block, (colour × type × count) |
| `src/ai/search.ts` | hand save/restore in `apply`/`undo` |
| `src/ai/eval.ts` | a reserve is material in hand; without a term the search returns pieces at random |
| `src/main.ts` | the captured tray becomes clickable |
| tests | `rules.test.ts` (+~12), FEN round-trip with a hand, a repetition test proving the §1.6 argument |

**Size: 7 files, roughly 200 lines, ~15 tests. One to two days.** Build it once; the Squire then
costs an afternoon.

---

## 3. Variant config: how a game declares its kings

### 3.1 The shape

Put the choice **in `Rules`**, as two fields:

```ts
export type KingName  = 'Frost' | 'Flame' | 'Stratus' | 'Mud' | 'Spirit' | 'Shadow';
export type PowerName = 'Freeze' | 'IceWall' | 'Strike' | 'Haste' | 'Flight'
                      | 'Sacrifice' | 'March' | 'Leap' | 'HolyLight' | 'Mercy'
                      | 'DeathTouch' | 'Darkness';
export interface KingChoice { king: KingName; power: PowerName }

// on Rules:
kings: readonly [KingChoice | null, KingChoice | null];   // [white, black]; null = no powers
```

Why in `Rules` and not a new module: everything already works. `setRules` keeps the object
identity, so `RULES.kings[c]` is one monomorphic array index on the hot path — the same cost as
`RULES.archerShots` today. `ruleDiff` prints it in every run header. `parseRule` gives the lab
`--rule kings=Mud:March` (both sides) and `--rule kingWhite=Frost:Freeze`. And, decisively,
`stampOf()` in `src/sim/run.ts` hashes the whole rule set — so a run that changes kings **cannot**
silently resume onto a run that played different ones. That trap has already voided one control run
in this project (`pb-ab-base`, LESSONS 2026-09-14); putting the kings anywhere else re-opens it.

A separate `POWERS` module object would be marginally faster to read and would need the stamp, the
diff, the CLI parser, the URL parser and the resume check all taught about it. Not worth it.

### 3.2 The three ways a game declares it

| where | syntax | who uses it |
|---|---|---|
| **`Rules`** | `setRules({ kings: [{king:'Frost',power:'Freeze'}, {king:'Mud',power:'March'}] })` | engine, tests, `sim/game.ts` |
| **CLI** | `--rule kings=Frost:Freeze` (both sides) · `--rule kingWhite=Frost:Freeze --rule kingBlack=Mud:March` | the lab |
| **URL** | `?kings=frost:freeze,mud:march` — first is White. `?kings=frost:freeze` gives both sides the same king. | the browser |
| **FEN** | **nothing.** | — |

**Kings stay out of FEN.** A king's power is a *rule*, and no rule is in FEN today — the one thing
in FEN that is not a square is the `H`/`h` spent-guard marker, which is per-piece state. Tier 2 and
tier 3 state (charges, marks, the reserve) **is** position state and does go in FEN, as a seventh
field and a Crazyhouse bracket. `fromFen` ignores trailing fields it does not know, so every stored
FEN in the repo stays valid.

The browser's existing `?rules=2017|2021` preset machinery in `src/main.ts` is the model: read the
parameter, call `setRules` **before** the first `new Game()`, because the constructor builds a
position and asks for its status.

### 3.3 The army colour follows the king (RULES.md §6.6)

§6.6: Frost blue, Flame red, Stratus purple, Mud green, Spirit white, Shadow black. `STYLES` in
`src/render/styles.ts` and the palette in `src/render/palette.ts` already drive the two armies, so
the change is a lookup from `RULES.kings[c]?.king` to a palette entry, with today's ivory / dark as
the `null` fallback. Ship it **with** the picker, not before: it is cosmetic and it only makes sense
once a player is choosing.

**Do not couple the pool to the king yet.** `PIECES-PROPOSED.md` ends with the idea that each king's
army carries a signature piece. That ties two unmeasured systems together, and a pool that differs
per side turns every A/B into an asymmetric match. Measure powers on the shared pool first; the
signature piece is a separate proposal with its own campaign.

### 3.4 One thing the lab cannot do yet

`runAb` plays **one rule set for both sides**. A symmetric A/B — both kings Mud:March against
today's game — answers "does this power make the game better", which is the question Saar reads
first (decisive share, stuck endings, draws, length). That needs nothing new.

The other question — "is Frost stronger than Mud" — is a **match** between two different rule sets,
and `RULES` is one object per thread. The existing asymmetric path (`RunSpec.asymmetric`) swaps back
ranks, not rules. Per-side fields (`kings[0]` / `kings[1]`) are the fix and they are in the shape
above from day one, so the match arm costs a colour-swapped pair and a spec field, not a rewrite.

**One more caution.** The search plays a power only if the evaluation likes the resulting position.
For the tier-1 modifiers that is automatic — they change move generation. For a *charge*, the AI
has no reason to hold it back and no reason to spend it: there is no term for "one Freeze left".
Count uses per game in the first run. If a power is used in under 10% of games it is inert, and the
lab is measuring nothing — the same failure mode as the pre-buff beast (3.6 moves a game).

---

## 4. Designer decisions to batch

Each with a recommended default and the one-line reason. Balance and fun first, per LESSONS and the
lab's findings: **immunity and returning material make draws; sharp jobs make decisive games.**

| # | Decision | Recommended default | Why |
|---|---|---|---|
| 1 | March and Leap: always on, or the rulebook's 3 uses (§6.5)? | **Always on, for the lab.** Ship the counted version only if the always-on one breaks. | Always-on is the ceiling of the counted rule: if the ceiling is balanced the counter is too, and it costs no state, so it is measurable this week. |
| 2 | Does firing Freeze or Ice Wall cost the whole turn? | **Yes.** | A free deny alongside a move is a two-for-one; and a power that is a turn is a `Move`, which hands us undo, repetition, king safety and the AI for nothing. |
| 3 | May a power be used while in check? | **Yes, subject to normal king safety** — legal only if it resolves the check. | One rule, zero code: `legalMoves` already makes the move and looks at the mover's king. |
| 4 | How is "powers never give check or mate" enforced? | **On the power's own action only**: no power move captures a king, no power adds an attacked square. A freeze that leads to mate next turn is fine. | The other reading needs a legality test that looks past the opponent's reply. No engine and no player can apply it. |
| 5 | May a maester swap or an ogre shove move a frozen piece? | **No. Frozen means it does not move, by any hand.** | Otherwise a friendly maester unfreezes it for one tempo and the power is dead. |
| 6 | May a warded (Ice Wall) piece be shoved or swapped? | **Yes — a shove is not a capture.** | Keeps the ward's sentence at "cannot be captured", and the ogre stays the answer to immunity. |
| 7 | Strike: does the struck piece capture as a queen, or by its own rules? | **Its own rules.** A struck guard still takes nothing; a struck paladin still cannot take a king. | One line — pass the real piece byte to the existing `slider` — and no piece loses its identity for a turn. |
| 8 | Strike: does a struck paladin remove itself? | **No.** | The kamikaze is the paladin's bargain for its own move, not the king's. |
| 9 | Haste: is the second move optional? | **Yes.** | Otherwise "no legal second move" becomes a new kind of stalemate, with its own bugs. |
| 10 | Haste: may the first move leave the mover's own king attacked? | **No.** | `secondPlayerDoubleFirstTurn` set the precedent of forbidding the awkward half; it keeps `legalMoves` untouched. |
| 11 | Flight: may a pawn fly backwards, regaining its double step? | **Yes to both.** | The double step is a rank test, not history, so this needs no new state — and a pawn that flies home is a real cost in tempo. |
| 12 | Death Touch: does the king *also* still capture by moving? | **No — the shot replaces it.** | One verb per piece (the archer precedent), it keeps the king home, and it makes the power legible. |
| 13 | Death Touch: may it eat a defended piece? | **Yes.** | It never enters the defended square. This is the power, and it is the best anti-blockade tool of the twelve. |
| 14 | Mercy: is the two-square king move blocked by an enemy on the middle square? | **Yes — it jumps friends, enemies stop it.** | The paladin's shape, already in the engine and already understood. |
| 15 | **Mercy: an enemy guard becomes uncapturable, because only a king may take a guard and this king takes nothing.** | **Give the Mercy king its guard capture back — one exception.** | Design rule 1 from the lab: a piece may be hard to take, never impossible. A permanently immortal guard is the measured draw engine. The purist reading is worth one A/B arm, not a shipped rule. |
| 16 | Sacrifice: what may return — anything that left the board, or captures only? | **Anything that left the board**, a self-removed paladin included. | One list, appended wherever a piece is cleared. The distinction is a clause nobody at the table would remember. |
| 17 | Sacrifice: may it return a guard? | **No.** | §6.13 already bars a pawn from becoming a guard; returning one through a pawn is the same move by another road, and it puts immunity back on the board. |
| 18 | Sacrifice: does the sacrificed pawn join the reserve? | **No, it leaves play.** | The power has one use. A returning pawn is bookkeeping with no game in it. |
| 19 | One power per king, chosen after setup (§4)? | **Yes, one, and both sides reveal before White's first move.** | Hidden choice doubles the UI and makes the AI model an unknown rule set. |
| 20 | Must both sides play a king with powers? | **Both, or neither.** "No powers" is the control arm. | The lab needs a control, and a one-sided power is a match, not an A/B. |
| 21 | What does the browser play by default? | **No powers.** Powers arrive behind `?kings=`, then behind the picker once a run has measured them. | Nothing ships un-measured — the project's standing rule. |
| 22 | Army colour follows the king (§6.6)? | **Yes, with the picker, not before.** | Cosmetic, and it only means anything once a player chooses. |
| 23 | Does each king's army carry a signature piece (PIECES-PROPOSED tail)? | **Not now.** | It couples two unmeasured systems and makes every A/B an asymmetric match. Measure powers on the shared pool first. |
| 24 | Which power ships first if only one ships? | **Death Touch.** | It is the only one whose expected effect is *fewer* draws with no new state: the king eats blockaders, the guard included, and the whole cost is one generator branch. |

---

## 5. Order of work, in one line each

1. **Rule fields + picker + `?kings=`** — the `KingChoice` shape, nothing else. Half a day.
2. **Tier 1, six powers, one agent, one day**, then six paired A/Bs against `pb-ab-base24`
   (`--experiment ab --games 1600 --sample 40 --depth 3 --seed 22 --workers 16`), about an hour of
   lab time each, queued in `docs/QUEUE.md` and launched by Saar.
3. **Read decisive share, draws, capped and plies first**; keep what sharpens, queue what drags.
4. **Tier 2**, Freeze and Ice Wall first (they prove the plumbing), Haste last and only after
   `moverAt` learns about it.
5. **Tier 3** once a power is worth the reserve — and take the Squire out of the same build.
