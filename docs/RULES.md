# King Down Chess — current rules and dated decisions

Starting source: *King Down Classic — Rules of Play* (Saar Shai, 2017), with the dated owner decisions below.
Sections 1–3 describe the current default. Kings' powers in §4 are optional lab rules; card/spell effects in §5 are built as lab cards (card mode), not in the playable game.

## 1. Base rules

Classic chess on 8×8 (check, checkmate, stalemate) with these deltas:

| Rule | King Down Classic | Our default |
|---|---|---|
| Castling | not official (optional) | off |
| En passant | not official (optional) | off |
| Promotion | any piece except a king, fairy pieces included | **Q, R, B or N — the chess set** (§6.13, revised 2026-09-17) |
| 50-move draw | not stated | on (100 plies) |
| Threefold repetition | not stated | on (3rd occurrence of the same board, side to move and spent-Strike state) |
| Insufficient material | not stated | on (conservative engine check; a live Strike power prevents this draw) |

## 2. Setup (Chess960-style)

- Rank 2 / 7: 8 pawns each.
- Rank 1 / 8: the king plus **7 pieces drawn at random** from the pool
  `1 queen, 1 ogre, 1 paladin, 2 rooks, 2 bishops, 2 knights, 2 archers, **1 guard**, 2 maesters, **1 beast**` (15 letters,
  `QOLRRBBNNAAGMMS`),
  in a random order that is **identical for both players**.
- Our extra constraint (Chess960 spirit): if both bishops are drawn they start on opposite colours.
- A drawn guard starts **next to its king**, wherever the king stands (`guardNextToKing`, §6 decision 21).
  There is no "king between rooks" rule because there is no castling.
- A setup is shared as its 8-letter back-rank string, e.g. `RSAKGQOB` (see letters below).

## 3. Pieces

Letters (FEN-style, uppercase = white): `P N B R Q K` standard, `A` archer, `L` paladin, `G` guard, `M` maester, `S` beast, `O` ogre.
The Paladin is back in the random pool (§6 decision 23). Catapult (`C`), Reaver (`V`) and Templar (`T`) remain lab pieces. The archived Squire/reserve experiment is not part of this engine.
Lab only: under `guardCaptures` + `guardCaptureLimit` (§6.9, never in a shipped game) a guard that has spent its one capture is written `H` (white) / `h` (black), so a position keeps that state through a FEN round-trip. Under `guardReserve` (§6.9) a guard waiting beside the board is FEN field 7 `g1.0` ([white.black]) and enters as `G@b1`.
King Down card-game names for the standard pieces: Pike = pawn, Steed = knight, Cross = bishop, Rock = rook, Thorn = queen.

| Piece | Move | Capture | Special |
|---|---|---|---|
| Pawn | 1 forward (2 from start rank) | 1 diagonal forward | promotes on last rank |
| Knight, Bishop, Rook, Queen, King | standard | standard | — |
| **Archer** | 1 square in any direction | **from a distance, without moving**: any enemy exactly 2 squares away orthogonally, or on either forward diagonal at distance 2 — blockers are ignored; never a neighbour (§6 decision 20) | gives check the same way |
| **Paladin** | like a queen; **jumps over friendly pieces**, blocked by enemies | by moving onto the enemy | **cannot capture a king** (so never gives check); **removes itself** after capturing anything but a pawn (§6.15) |
| **Guard** | 1 square any direction, empty squares only | **cannot capture** | **cannot be captured, except by a king**; blocks sliders like any piece |
| **Maester** | 1 square any direction | onto an adjacent enemy | onto an adjacent friend = **swap places**; if maester and own king are both on their first rank they may **swap at any distance** as a move |
| **Beast** | 1 square in any direction, empty only | any adjacent square, including straight ahead (§6.17) | after capturing it **may keep capturing** from its new square in the same turn, but never a king as a continuation |
| **Ogre** | 1 square in any direction | onto an adjacent enemy, except a Guard | may push an adjacent friend or enemy, never a king, one square straight away onto an empty square; the Ogre follows into the vacated square; a Guard can be pushed |

Interactions decided in code (`canCapture`): a guard is taken only by a king; a king is never taken by a paladin; a guard captures nothing at all.
The attacker set used for check = every piece's capture pattern, so an archer checks through blockers and a paladin never checks.
Design space by ability (arriving, shield, handicap, hopping, control, on-capture triggers) and by board zone (capital): `docs/MATRIX.md`.

## 4. Kings' powers mode (all twelve built; the balanced readings are the official rules)

Kings' powers is a game mode: each player may pick one power for their king before the game (New game,
or `?kings=frost:freeze,mud:march`). **No power is the default**, and either side may play without one. Token-spending mechanics are dropped; the rulebook's per-game use
counts are plain counters (§6.5). Powers never capture a king and add no attacked square.

**Balanced on 2026-10-02** (`docs/research/kings-powers-balance-2026-10-02.md`): head-to-head
round-robins of all twelve, at depth 3, over five rounds. As printed, the powers spread from 21% to
80% against each other; the readings below bring all twelve within 42–57% (a 15-point spread).
**Owner decision (2026-10-02): the balanced readings are the official kings' powers rules.** The game
applies them whenever a king has a power (`POWERS_BALANCED` in `src/rules/rules.ts`); the
rule defaults, `?rules=2017` and the lab keep the rulebook as printed. Every reading is one toggle.

| King | Power | As printed (2017 rulebook) | Balanced reading |
|---|---|---|---|
| Frost | **Freeze** (2 uses) | pick an enemy piece (not king); it cannot move during the opponent's next turn | a free action, then your move; **once** a game (`markFree`, `freezeUses: 1`) |
| Frost | **Ice Wall** (2 uses) | pick a friendly piece (not king); it cannot be captured during the opponent's next turn | a free action, then your move (`markFree`) |
| Flame | **Strike** (1 use) | move any own piece (not king) as if it were a queen; counts as a turn | pieces only (no pawns), to an empty square (`strikePawns: false`, `strikeCaptures: false`) |
| Flame | **Haste** (1 use) | move one piece twice in a single turn | neither move captures (`hasteCaptures: false`) |
| Stratus | **Flight** (1 use) | move any own piece (not king) to any empty square in own half; counts as a turn | as printed |
| Stratus | **Sacrifice** (1 use) | swap any own pawn with any own piece captured earlier; counts as a turn | as printed |
| Mud | **March** (3 uses) | any pawn may move two forward (if unblocked) | always on (`marchUses: 0`) |
| Mud | **Leap** (3 uses) | own pieces may jump over own pawns when moving several squares | as printed |
| Spirit | **Holy Light** (always on) | king cannot be captured by enemy pawns and cannot capture pawns | the king may take pawns, and **no piece beside, in front of or behind the Holy Light king can be captured** (`holyLightTakesPawns`, `holyLightShelter`, `holyLightShelterOrtho`) |
| Spirit | **Mercy** (always on) | king moves 1 or 2 squares in any direction, cannot capture, jumps friendly pieces | as printed, but the king may take pawns; and **no piece next to the Mercy king can be captured, except by a pawn** (`mercyAura`, `mercyAuraPawnsTake`, `mercyTakesPawns`: reading M2, owner 2026-10-03) |
| Shadow | **Death Touch** (always on) | king captures adjacent enemies without moving | as printed, and **it also reaches two squares straight forward or back (never sideways), over an empty square** (`deathTouchReach`, `deathTouchReachForwardBack`; §6 decision 24) |
| Shadow | **Darkness** (always on) | own pawns move 1 diagonally and capture 1 straight forward; no double first move | pawns also keep their straight steps (double from the start); they still capture only straight ahead (`darknessMoves`); **the king may also step two squares in a straight line, over an empty square** (`darknessKingStep2`, owner 2026-10-04) |

Holy Light's shelter was added after round 6 (owner asked for Mercy and Holy Light variations to be
tested): it lifted Holy Light from 43% to 53%; sheltering all eight neighbours overshot to 64%, and
narrower Mercy shelters (beside/front/behind only, or only against pawns) fell to 37% and 27%.
Confirmation round (3,744 games on fresh armies): all twelve within 42–57% against the other
powers; Haste, Sacrifice and Mercy 56–57% (high), Death Touch 43% and Darkness 42% (low). The other readings measured, and why they were not chosen, are in
the report; the toggles stay in the lab. Earlier single-power measurements of the six always-on
powers: `docs/research/sim-kings-2026-09-16.md`.

**Owner decisions (2026-10-03), after rounds 14 and 15.** Mercy: "yes": reading M2 is official (in
rounds 14 and 15 it moved Mercy from about 56% to 50%). Haste and Death Touch stay as they are: the
trims are "too cumbersome and not worth the gain". Darkness stays as it is for now: the diagonal
shelter that pawns may break (D2) is "too cumbersome", but Darkness at about 42% is not accepted, so
round 16 tests simple second parts, one short sentence each, as lab toggles: enemy pawns cannot take
your pawns (`darknessPawnArmor`); enemy pawns cannot take your pieces next to your king
(`darknessAuraPawns`); your king may also step two squares in a straight line, over an empty square,
to an empty square (`darknessKingStep2`); and D1, your pieces diagonally next to your king cannot be
taken (`darknessShelter`). No king-power reading changes how other pieces move.

**Owner decision (2026-10-04), after rounds 16 and 17:** "1. B", the king step as tested: your king
may also step two squares in a straight line, over an empty square (`darknessKingStep2`). The middle
square may be attacked; the step never takes and adds no attacked square. Over rounds 16 and 17 it
moved Darkness from about 44% to 48%, with Spirit and Shadow level. The safe step
(`darknessKingStepSafe`) and the taking step (`darknessKingStepTakes`) stay lab toggles, off.
`?rules=2017` and `?rules=2021` still play the printed Darkness.

## 5. Card / spell effects (documented, not yet enabled)

From the card-game rulebook drafts (temp 2.0 / 4.0), stripped of toll/action-point costs. Candidate effects to port later as timed modifiers:
Flight (move to any square once), Salvation (return a captured piece), Strike (capture without moving), Haste (copy another piece's range),
Mirror (copy a spell), Rage (extra capture), Curse (control an enemy piece of the same type / ignore a card's text), Shield (harder to capture),
Growth (draw), Burn (capture inside the capital zone), Control (control a friendly piece in range), Sacrifice (swap with a captured piece),
Rescue (keep an effect for another turn), Leap (range not obstructed); elemental: Fire Starter, Frost Bite (freeze in range), Sky Lift (swap two units), Earth Quake (shove adjacent units).
Unit "has X" cards: Archer has Strike, Guard has Shield, Paladin has Leap, Maester has Control, Beast has Rage.

Card mode (lab only, not in the playable game; `docs/research/cards-2026-10-03.md`) deals one-use cards: the
spendable king powers and the card-only cards, Mimic, Vault, Curse, Sky Lift and **Salvation** (2026-10-04: "Return
one of your captured pieces to an empty square of your back rank"; a pawn, a guard or the king never returns), and
(2026-10-04, owner: "cards - let's add all") the 2014 cards **Rage**, **Mirror**, **Firewall**, **Earth Quake**,
**Burn**, **Fire Starter**, **Control**, **Rescue** and **Growth**, with softer `B` readings of Rage, Mirror, Firewall,
Earth Quake and Growth; their texts and readings are in that report ("The 2014 cards"). Not measured yet.
**Rally** (2026-10-05; card only): one of your pieces moves, then a different one may move; neither
move captures (Haste's shape with two pieces). Not measured.
**Morph** (2026-10-06, owner idea; card only): as your move, one of your pieces (not a pawn or the king) becomes another kind of piece of the draw pool where it stands (not a pawn or a king, never a second Beast; a second queen may come). Measured (`morph-a1`): 98% against no card, more than a queen's worth.
**MorphB** (2026-10-06; card only): the same, but never a queen. Measured (`morph-a1`): 77% against no card, about +3.3 pawns.
**Spawn** (2026-10-06, owner; card only): as your move, a new pawn of yours appears on an empty square of your pawns' start rank (rank 2 for White, 7 for Black). It is an ordinary pawn from then on (it may double-step from there); it may block a check. Not measured.
**SpawnK** (2026-10-06; card only): the same, on an empty square next to your king, never on rank 1 or 8. Not measured.
**Spawn2** (2026-10-06; card only): as Spawn, two new pawns on two different squares. Not measured.
**SpawnK2** (2026-10-06; card only): as SpawnK, two new pawns on two different squares. Not measured.
**MorphP** (2026-10-06, owner; card only): as your move, one of your pawns becomes a knight or a bishop where it stands. It is an ordinary knight or bishop from then on (taken, it counts as one). Measured (`morph-b1`): 70% against no card, about +2.3 pawns.
**MorphS** (2026-10-06, owner; card only): as your move, two of your pieces (not pawns or the king, not of one kind) swap places. The same move as Sky Lift. Measured (`morph-b1`): 59% against no card, about +1.0 pawn.

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
   now exactly three fields (`archerMove`, `archerShots`, `beastMove`; it pins the classic shot set so the older game
   stays the older game). `?rules=2021` plays the designer's 2021 "Chess Expansion
   Concept" archer and beast instead.
9. **Guard stays the immortal wall (designer decision 2026-09-13).** The per-lifetime capture was measured
   (+54 Elo, no harvester) but rejected on identity grounds: the guard is a wall that never captures. `guardStep=2`
   measured neutral (+1 ± 45 Elo) and is not adopted either. The toggles `guardCaptures`, `guardCaptureLimit` and
   `guardStep`, `guardDoubleFirst` (a pawn-like double step from the home rank; queued, docs/QUEUE.md Q1), the `SPENT` bit and the FEN `H`/`h` marker stay in the code for the balance lab; they are inert
   under the defaults, because a guard that cannot capture can never become spent.
   Lab (2026-10-04, owner: "guard - do the testing"): `guardReserve=rank1` — "Your Guard starts beside the board; as
   a move, place it on any empty square of your first rank" (`rank12`: first two ranks). Off by default; the rules and
   the queued runs are in `docs/research/piece-balance-criteria-2026-10-03.md` ("Guard reserve").

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
16. **The archer's shots widen to the forward diagonal-2 squares (designer, 2026-09-17).** `archerShots`
    defaults to `'plusDiagFwd2'`: classic (diagonal-adjacent, two straight, blockers ignored) plus the two
    two-square diagonals facing the enemy, mirrored for Black. Measured at depth 4 (1,600 games an arm,
    fresh control): decisive **+8.8 ± 3.8**, draws **−8.2 ± 3.7**, plies −14.2 ± 4.8, white score +2.6 ± 2.6
    (fair). The cost is the piece's value: **3.73 ± 0.42 → 5.05 ± 0.44 pawns** (odds match vs a rook),
    so `ARCHER_V` moves 337 → 505 with it. The other sweep levers were rejected or null
    (`docs/research/sim-piece-balance-2026-09-17.md`). Three lab sets between it and `classic` wait for
    measurement (owner, 2026-10-04: "archer - test and measure first"): `plusDiagFwd2Clear` (a forward
    diagonal-2 shot needs the square between empty), `fwd2NoBack` (no shot 2 straight back) and
    `fwd2NoSide` (no shots 2 to the side).
17. **The beast's blind spot goes (designer, 2026-09-17).** `beastCaptureForward` defaults to `true`: the beast
    captures on **every** adjacent square (the "seven except straight ahead" rule cost more to remember than it
    earned). All three simplifications were measured at 1,600 games an arm, depth 4: removing the blind spot is the
    only **price-neutral** one (beast 4.34 ± 0.42 pawns, captures +29%, decisive +1.4 ± 2.1, plies −6.6 ± 4.0);
    the diagonal readings halve the piece's value (1.81 / 1.99 pawns) and are lab readings only
    (`docs/research/sim-beast-all8-2026-09-17.md`, `sim-beast-diagonal-d4-2026-09-17.md`, `sim-beast-diagfwd-2026-09-17.md`).

18. **Paladin leaves the random pool; Ogre push takes that slot (designer, 2026-09-24).** `POOL` is
    `QORRBBNNAAGMMSS` (the single `L` becomes `O`). The Paladin stays legal for custom setups, FEN, and
    promotion under historical sets that already include it. Default `ogreMode` is `push`; `repel` stays
    a lab reading. Promotion stays `standard` (Q R B N). Ogre's evaluation value is 318; other values
    are unchanged. Earlier evidence: `docs/research/sim-paladin-pool-2026-09-17.md`,
    `direct-campaign-phase-2-2026-09-22.md`, `sim-ogre-movement-2026-09-17.md`,
    `direct-campaign-phase-3-2026-09-22.md`. Selectively implemented on the accepted clay base:
    adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`). The new 24-game traffic sketch
    does not establish a balance improvement or a precise first-move advantage.
19. **The over-a-piece Archer is held; today's Archer stays (owner, 2026-10-05: "option B").** The owner
    first approved `archerShots: 'over2'` (the Archer takes an enemy exactly 2 squares away straight or on
    a forward diagonal, only over a piece of either side, and no longer its diagonal neighbours; built on
    `claude/archer-over2`). Re-pricing it for the computer then measured its worth at **0.83 ± 0.25 pawns**
    (four Muller passes against the Knight at depth 3, the last two with the Knight army a pawn down:
    `ARCHER_V` would fall 505 → 83; `docs/research/piece-runs-2026-10-05-pv-A-over2.md` on that branch),
    far under criterion 1's 2.5–5.5 pawns. So this release keeps Decision 16: `archerShots`
    `'plusDiagFwd2'`, `ARCHER_V` 505, the Archer lesson and the Guide text unchanged. Next: on the M1, an
    over-a-piece Archer with more reach, aiming at a worth of at least 2.5 pawns with few draws.
20. **The far2 Archer replaces Decision 16 (owner, 2026-10-09: "merge far2").** `archerShots` defaults to
    `'far2'`: the Archer takes, without moving, an enemy exactly 2 squares away straight, or on either forward
    diagonal at distance 2, through blockers. It no longer takes its diagonal neighbours. `plusDiagFwd2` and the
    other readings stay lab readings. One depth-3 Muller pass put its worth at **2.83 ± 0.28 pawns**
    (`docs/research/piece-runs-2026-10-04-pv-A-af2.md`); `ARCHER_V` stays 505 until a full re-pricing.
21. **The guard starts next to its king (owner, 2026-10-09: "approve start next to a king, wherever the king is
    positioned in the randomized arrangement").** `guardNextToKing` (default on): when the drawn back rank holds a
    guard that is not next to the king, it swaps with a neighbour of the king; when both neighbours exist, the
    shuffle picks one. Both sides mirror one back rank, so both guards stand on the same side. The bishops
    stay on opposite colours. The 2017 preset turns it off, and tournaments recorded before this date keep
    their old draws.
22. **Guard drop anywhere, lab only (owner, 2026-10-09: "queue guard drop for testing anyway - i want the
    data").** `guardReserve: 'any'`: the guard starts beside the board and, as a move, enters on any empty
    square. Default off; its A/B against Decision 21 waits for a run go.
23. **The Paladin returns to the random pool (owner, 2026-10-09: "paladin - add the approved version to the
    random pool. we might tweak its rules later to reduce white's advantage.").** `POOL` is
    `QOLRRBBNNAAGMMS` (15 letters, 7 drawn); the Ogre stays. The Paladin keeps `paladinKamikaze: 'nonPawn'`
    (Decision 15). Morph may make a Paladin too. Decision 18's White-edge evidence still stands.
24. **Death Touch reaches forward and back only (owner, 2026-10-09: "go with T2 for death touch").**
    `POWERS_BALANCED` adds `deathTouchReachForwardBack`: the two-square touch goes straight forward or back,
    never sideways; the touch next to the king is unchanged. Measured: **49.3%** at depth 3 and **51.1%** at
    depth 4 (round 18 had 55.1% ± 2.9).
25. **Morph and the Guard (owner, 2026-10-09).** "morph can definitely make a guard. second guard - not yet." A
    Morph card may turn a piece into a Guard, but an army has at most one Guard (a spent guard counts). On a
    second Beast the owner said "allow it": the one-Beast rule applies to the starting army only, so a second
    Beast that comes from cards (Morph into a Beast, then Salvation or Sacrifice returns a taken Beast) is
    allowed. Morph itself still makes no Beast while the side has one.

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

13. **Promotion is the chess set (designer, 2026-09-17).** `promotionSet` defaults to `standard` (Q R B N). The
    earlier `anyNonKingNoGuard` reading (Q R B N A L M S, never G) measured **null on every outcome metric** and the
    fairy targets were only **1.3% of all promotions** (5 of 378 in 1,600 games), so by the "do not keep a rule that
    adds nothing measurable" guideline it was reverted. The HUD picker builds its buttons from the legal moves, so it
    follows on its own. `anyNonKingNoGuard` and `anyNonKing` stay selectable lab readings; `?rules=2017` plays
    `anyNonKing`.

**One beast per army (designer, 2026-10-04).** "There should never be 2 beasts in one game." `POOL` is now
`QORRBBNNAAGMMS` (14 letters): an army draws 7 of them, so it holds at most one beast. Earlier pool runs (rounds up to 17, `pa-*`) drew from the 15-letter pool.
Custom armies too (designer, 2026-10-04: "one beast per army - that should always be the case"): New game refuses a custom back rank with two beasts.
