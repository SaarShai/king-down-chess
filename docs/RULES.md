# King Down Chess — rules spec (v0.1)

Source of truth: *King Down Classic — Rules of Play* (Saar Shai, 2017). This is the playable scope for v0.1.
Kings' powers and card/spell effects are documented in §4–5 for later versions; they are **not** in the game yet.

## 1. Base rules

Classic chess on 8×8 (check, checkmate, stalemate) with these deltas:

| Rule | King Down Classic | Our default |
|---|---|---|
| Castling | not official (optional) | off |
| En passant | not official (optional) | off |
| Promotion | any piece except a king, fairy pieces included | **any piece except a king or a guard** (§6.13), UI picker |
| 50-move draw | not stated | on (100 plies) |
| Threefold repetition | not stated | on (3rd time the same board + side to move appears) |
| Insufficient material | not stated | on (conservative: neither side has P/R/Q/A/M/S and each has at most one minor) |

## 2. Setup (Chess960-style)

- Rank 2 / 7: 8 pawns each.
- Rank 1 / 8: the king plus **7 pieces drawn at random** from the pool
  `1 queen, 1 paladin, 2 rooks, 2 bishops, 2 knights, 2 archers, **1 guard**, 2 maesters, 2 beasts` (15 letters,
  `QLRRBBNNAAGMMSS`),
  in a random order that is **identical for both players**.
- Our extra constraint (Chess960 spirit): if both bishops are drawn they start on opposite colours.
  There is no "king between rooks" rule because there is no castling.
- A setup is shared as its 8-letter back-rank string, e.g. `RSAKGQLB` (see letters below).

## 3. Pieces

Letters (FEN-style, uppercase = white): `P N B R Q K` standard, `A` archer, `L` paladin, `G` guard, `M` maester, `S` beast.
Lab only: under `guardCaptures` + `guardCaptureLimit` (§6.9, never in a shipped game) a guard that has spent its one capture is written `H` (white) / `h` (black), so a position keeps that state through a FEN round-trip.
King Down card-game names for the standard pieces: Pike = pawn, Steed = knight, Cross = bishop, Rock = rook, Thorn = queen.

| Piece | Move | Capture | Special |
|---|---|---|---|
| Pawn | 1 forward (2 from start rank) | 1 diagonal forward | promotes on last rank |
| Knight, Bishop, Rook, Queen, King | standard | standard | — |
| **Archer** | 1 square in any direction | **from a distance, without moving**: any enemy on a diagonally adjacent square, or exactly 2 squares away orthogonally — blockers are ignored | gives check the same way |
| **Paladin** | like a queen; **jumps over friendly pieces**, blocked by enemies | by moving onto the enemy | **cannot capture a king** (so never gives check); **removes itself** after capturing anything but a pawn (§6.15) |
| **Guard** | 1 square any direction, empty squares only | **cannot capture** | **cannot be captured, except by a king**; blocks sliders like any piece |
| **Maester** | 1 square any direction | onto an adjacent enemy | onto an adjacent friend = **swap places**; if maester and own king are both on their first rank they may **swap at any distance** as a move |
| **Beast** | 1 square in any direction, empty only | any of the **7 adjacent squares that are not straight ahead** | after capturing it **may keep capturing** from its new square in the same turn, but never a king as a continuation |

Interactions decided in code (`canCapture`): a guard is taken only by a king; a king is never taken by a paladin; a guard captures nothing at all.
The attacker set used for check = every piece's capture pattern, so an archer checks through blockers and a paladin never checks.
Design space by ability (arriving, shield, handicap, hopping, control, on-capture triggers) and by board zone (capital): `docs/MATRIX.md`.

## 4. Kings' powers (six tier-1 powers built as lab rules, off by default)

Each army has a king with two candidate powers; the player picks one after setup. Token-spending mechanics are ignored per project scope;
when we enable powers we will decide per power whether it is "always on" or "N uses" — the six built
powers are currently **always on** with no charge counter. Powers cannot capture a king nor give check/mate.

**Implemented (lab, off by default; `?kings=<king>:<power>`):** the stateless tier-1 powers **Holy
Light, Mercy, Death Touch, Darkness, March and Leap**. `parseKing` refuses the other six (they need
per-side state or a reserve). The exact implemented semantics, the guide text, 21 targeted tests and
the measured (or queued) campaign are in `docs/research/sim-kings-2026-09-16.md`; the material
unresolved owner choices (Mercy vs guard immunity, the Death Touch verb, always-on vs charged
March/Leap, adjacent Mercy kings, the Darkness evaluation confound) are listed there too.

| King | Power A | Power B |
|---|---|---|
| Frost | **Freeze**: pick an enemy piece (not king); it cannot move during the opponent's next turn | **Ice Wall**: pick a friendly piece (not king); it cannot be captured during the opponent's next turn |
| Flame | **Strike**: move any own piece (not king) as if it were a queen; counts as a turn | **Haste**: move one piece twice in a single turn |
| Stratus | **Flight**: move any own piece (not king) to any empty square in own half (ranks 1–4); counts as a turn | **Sacrifice**: swap any own pawn with any own piece captured earlier; counts as a turn |
| Mud | **March**: any pawn may move two forward (if unblocked) | **Leap**: own pieces may jump over own pawns when moving several squares |
| Spirit | **Holy Light** (always on): king cannot be captured by enemy pawns and cannot capture pawns | **Mercy** (always on): king moves 1 or 2 squares in any direction, cannot capture, jumps friendly pieces |
| Shadow | **Death Touch** (always on): king captures adjacent enemies without moving | **Darkness** (always on): own pawns move 1 diagonally and capture 1 straight forward; no double first move |

## 5. Card / spell effects (documented, not yet enabled)

From the card-game rulebook drafts (temp 2.0 / 4.0), stripped of toll/action-point costs. Candidate effects to port later as timed modifiers:
Flight (move to any square once), Salvation (return a captured piece), Strike (capture without moving), Haste (copy another piece's range),
Mirror (copy a spell), Rage (extra capture), Curse (control an enemy piece of the same type / ignore a card's text), Shield (harder to capture),
Growth (draw), Burn (capture inside the capital zone), Control (control a friendly piece in range), Sacrifice (swap with a captured piece),
Rescue (keep an effect for another turn), Leap (range not obstructed); elemental: Fire Starter, Frost Bite (freeze in range), Sky Lift (swap two units), Earth Quake (shove adjacent units).
Unit "has X" cards: Archer has Strike, Guard has Shield, Paladin has Leap, Maester has Control, Beast has Rage.

## 6. Decisions (2026-09-13, chosen for balance and fun)

1. **Bishops on opposite colours: KEEP.** Same-colour bishops leave one colour complex undefended and dull; opposite colours give richer interactions (as in Chess960).
2. **Archer may shoot the king (gives check): YES.** A sniper that threatens through blockers is the archer's whole identity and creates fresh tactics; it is slow (1-step) so it stays balanced.
3. **Beast first capture: any of the 7 non-forward adjacent squares** (per the rulebook diagram) — more options and more chain setups; straight ahead stays move-only as its one blind spot.
4. **Draws: threefold repetition, 50-move rule and insufficient material are ON.** Needed because guards and paladins can create unwinnable endings.
5. **Kings' powers (later): keep the rulebook's per-game use counts** (Freeze 2, Ice Wall 2, Strike 1, Haste 1, Flight 1, Sacrifice 1, March 3, Leap 3) as plain counters — the designer tuned them; only the card game's toll/action-point economy is dropped. Always-on powers stay always-on.
6. **Armies: two armies for now** (ivory vs dark); when kings' powers arrive, the chosen king sets the army colour (Frost blue, Flame red, Stratus purple, Mud green, Spirit white, Shadow black).
7. **Maester–king swap is subject to normal king safety** (illegal if the king would be in check).
8. **Two measured changes to the 2017 pieces (2026-09-13).** Two self-play campaigns priced every fairy piece and
   A/B-tested the candidates (`docs/research/sim-buffed-2026-09-13.md`, `docs/research/sim-rules-2026-09-13.md`).
   These two paid and are adopted; the defaults in `src/rules/rules.ts` are now this set. A third candidate,
   the capturing guard, was measured and rejected — see §6.9.
   - **Archer steps 1 square in any direction** (was orthogonal only): **2.82 ± 0.44 pawns**, up from a bound under
     1.70. Its survival falls 73% → 50%, so it can be met in the open and traded.
   - **Beast steps 1 square in any direction** (was straight ahead only): **2.17 ± 0.41 pawns**, and 3.6 → 10.8
     moves a game. The piece stops being inert.
   - **Balance does not move.** White's score changes by **−0.002 ± 0.009** over 30 000 paired games, and less than
     half as many games reach the ply cap.

   The 2017 rulebook game is still playable: add `?rules=2017` to the URL — with the guard unchanged, that preset is
   now exactly two fields (`archerMove`, `beastMove`). `?rules=2021` plays the designer's 2021 "Chess Expansion
   Concept" archer and beast instead.
9. **Guard stays the immortal wall (designer decision 2026-09-13).** The per-lifetime capture was measured
   (+54 Elo, no harvester) but rejected on identity grounds: the guard is a wall that never captures. `guardStep=2`
   measured neutral (+1 ± 45 Elo) and is not adopted either. The toggles `guardCaptures`, `guardCaptureLimit` and
   `guardStep`, `guardDoubleFirst` (a pawn-like double step from the home rank; queued, docs/QUEUE.md Q1), the `SPENT` bit and the FEN `H`/`h` marker stay in the code for the balance lab; they are inert
   under the defaults, because a guard that cannot capture can never become spent.

14. **No double first turn for Black (designer, 2026-09-14).** Measured in `sim-queue-2026-09-14`: on the full pool the rule
    turns White's 0.533 into 0.472 (−0.062 ± 0.026), an edge for Black of the size White had; without the paladin it lands
    near even (0.490). The first-move edge stays as chess has it. `secondPlayerDoubleFirstTurn` remains a lab toggle.

15. **A paladin survives a pawn capture (designer, 2026-09-14).** `paladinKamikaze` defaults to `'nonPawn'`: the
    self-removal stays for every capture but a pawn's. Measured (`sim-lm-buffs`, `sim-queue-2026-09-14`): the piece
    goes from 2.2 to 2.9 pawns, nearest a knight, and the paired A/B moves nothing — balance, draws, stuck games and
    length all inside their intervals. A pawn can no longer buy a paladin; the sacrifice remains the price of every
    capture that matters. The 2017 preset keeps `'always'`. Depth-4 confirmation (800 games an arm, `pb-ab-L-nonPawn-d4`): decisive, draws, stuck endings and length again
    inside their intervals; white score +0.027 ± 0.025 there against −0.003 ± 0.018 at depth 3 — pooled +0.007 ± 0.015,
    so a White gain of up to two points is possible but not shown. Shipped in v0.7.0.

### First measured evidence (2026-09-13, provisional) — superseded by §6.8

*Read this pass as history: it priced the archer and the beast with the engine still valuing them at their
un-buffed numbers. §6.8 states what the re-priced, re-measured campaigns found.*

Reduced runs at depth 3: `docs/research/sim-results-2026-09-13.md`. The error bars are wide, so
**no decision above changes yet**. What the numbers say so far:

- **Decision 2 (archer checks) and 3 (beast captures on 7 squares).** Swapped in for a knight, both
  pieces *lose*: archer -85 +/- 45 Elo, beast -179 +/- 43 Elo over 100 colour-reversed pairs each.
  The engine's own values claim the opposite (archer 430, beast 350, knight 320), which is exactly
  the blind self-play Muller warns about. Re-price the eval and measure again before touching §3.
- **Decision 4 (draws on).** 27.5% draws and 4.0% capped games in the smoke run. Guards justify the
  rule: 6 guards captured out of 376 started, and guard survival is above 100% once promotions
  count. A guard-heavy ending needs the 50-move and repetition rules.
- **Beast chains are rare.** 113 beast capture moves carried 124 captures in 200 games, so about
  one capture in ten continued. The chain is flavour at this depth, not balance.
- **The maester long swap is used.** About one long swap per game, so the castling substitute is
  real play, not a dead rule.

10. **Paladin and maester buff candidates: measured (2026-09-13); paladin decided, maester not adopted.**
    Nine candidates priced by odds against a knight (300 games, depth 3, `--eloPerPawn 64`, knight = 2.96 pawns),
    then an eight-cell paladin grid on the designer's three axes. Full report:
    `docs/research/sim-lm-buffs-2026-09-13.md`. **Paladin `paladinKamakaze=nonPawn` shipped in v0.7.0**
    (the A/B measured nothing, the value rose 2.21 → 2.87 pawns; Q7 confirmed at depth 4 in
    `docs/research/sim-queue-2026-09-14.md`). `maesterSwapAny` was **measured free but not adopted**
    (Q3); the other maester candidates remain a later design choice. Every unselected toggle still
    defaults to the shipped rule.

    | candidate | toggle | implied pawns | Δ vs today (Elo) | identity | verdict |
    |---|---|---|---|---|---|
    | today's paladin | — | 2.21 ± 0.52 | — | — | the piece to beat |
    | survives a pawn | `paladinKamikaze='nonPawn'` | **2.87 ± 0.57** | +42 ± 49 | **intact** | **recommended** |
    | never dies | `paladinKamikaze='never'` | 3.40 ± 0.52 | +76 ± 47 | changed — a second queen | ceiling reference |
    | may take a king | `paladinChecks=true` | 3.21 ± 0.60 | +64 ± 51 | **changed** — it checks and mates | designer's call |
    | blocked by friends | `paladinJumpsFriends=false` | 3.73 ± 0.51 | +97 ± 47 | changed — no jump | overshoots |
    | the charge | `paladinReturn=true` | > 4.46 | +317 ± 44 | changed — a rifle queen | **degenerate** |
    | jumps enemies | `paladinBlockedByEnemies=false` | > 4.46 | +158 ± 49 | changed | **degenerate** |
    | today's maester | — | 2.18 ± 0.53 | — | — | the piece to beat |
    | swap anywhere | `maesterSwapAny=true` | **3.12 ± 0.57** | +61 ± 50 | **intact** | **recommended** |
    | two steps | `maesterStep=2` | 3.80 ± 0.58 | +104 ± 50 | changed — not a one-stepper | overshoots |
    | king swap anywhere | `maesterKingSwapAnywhere=true` | 2.49 ± 0.56 | +20 ± 49 | intact | moves nothing |
    | swap an enemy | `maesterSwapEnemy=true` | 2.14 ± 0.54 | −2 ± 48 | changed — a new verb | **never played** |

    **Recommended, one per piece:** `paladinKamikaze: 'nonPawn'` (2.87, nearest a knight, the self-sacrifice kept as
    the piece's bargain) and `maesterSwapAny: true` (3.12, the piece's own verb with the range limit dropped).
    **Degenerate, do not ship:** `paladinReturn` (2.80 captures a game, the paladin alive at the end of every second
    game, seven pieces shot off one square) and `paladinBlockedByEnemies=false` (a paladin-for-queen trade from the
    opening that nothing can prevent).

    **The paladin's jump is a liability, not a gift.** Blocking it with friendly pieces makes the piece *stronger*
    (−48 → +49 Elo): the jump moves its first move from ply 32 to ply 12 and its first capture from ply 64 to ply
    38, and under kamikaze moving early means dying early — the shipped paladin leaves the board in 91% of games,
    the blocked one in 77%. **And the paladin's first-player edge is not the jump either:** on the pool
    `QRRBBNNL`, the 35 ranks that hold a paladin give White 0.561 against 0.510 on the 5 that do not, and blocking
    the jump leaves it at 0.556 (paired −0.004 ± 0.045). The edge is the piece, not the way it develops.

11. **One guard per army (designer, 2026-09-13).** `POOL` is `QLRRBBNNAAGMMSS`, 15 letters. A back rank draws 7 of
    them plus the king, so at most one guard a side. The 2017 preset is unaffected: the pool is not part of it.
    Lab toggle `guardNoSecondRank` (default off) additionally forbids a guard from ending a move on its own second
    rank, maester swaps included.

12. **Compensation for the first move, in the lab only (2026-09-13).** `secondPlayerDoubleFirstTurn` (default off):
    Black's first turn is two moves, then normal alternation; the first of the two may not give check, so White
    never loses a king while it has no turn in between. Implemented as a ply check on `pos.ply === 1`, not as a flag
    on `Position`, so a FEN round-trip and the repetition key need nothing new. **Not yet measured** — see the
    report's "not run" list.

13. **A pawn is never promoted to a guard (designer, 2026-09-13).** `promotionSet` defaults to
    `anyNonKingNoGuard`: Q R B N A L M S, never G. The HUD picker builds its buttons from the legal moves, so it
    follows on its own. `anyNonKing` stays selectable and is what the `?rules=2017` preset plays.
