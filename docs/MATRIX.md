# King Down — ability matrix (started 2026-09-14)

Two grids: **pieces × abilities** and **board zones × rules**. Saar extends them; this is the first pass.
Five proposed pieces that fill the empty cells: `PIECES-PROPOSED.md`.

Legend: **●** shipped (default rules) · **◐** lab toggle, off by default (`name` in `src/rules/rules.ts`) ·
**○** designed but not built (kings' powers §4 / cards §5 of `RULES.md`) · **—** nothing · **?** to decide.

**Status 2026-09-16:** the six **tier-1** kings' powers — Holy Light, Mercy, Death Touch, Darkness,
March, Leap — are now **built as lab rules** (`kings` in `src/rules/rules.ts`, off by default; tests
in `src/rules/rules.test.ts`, measurements in `docs/research/sim-kings-2026-09-16.md`). The other six
powers and every card remain **○ designed, not built**. Q1–Q7 are all answered (`docs/QUEUE.md`);
`pb-ab-base24` is a recorded old-paladin control, not a current baseline.

Q1…Q6 point at `docs/QUEUE.md`. Piece letters: P N B R Q K standard · A archer · L paladin · G guard · M maester · S beast ·
**O ogre** is in the random pool with push as its default (RULES.md §6.18, 2026-09-24).
**C catapult · V reaver · T templar** remain lab pieces outside `POOL`. The recovered Squire/reserve
prototype is archived, not adopted; no arriving ability is active in this engine.
**Historical status 2026-09-17 (Ogre superseded by §6.18):** the **Ogre** is the only one still under exploration (work plan gated in `TASKS.md`); the
**Catapult** (both readings below 1.66 pawns, never fires in 38% of games), **Reaver** (safe reading neutral at
depth 4) and **Templar** (rejected) are **paused in the lab** (`docs/research/sim-catapult-explore-2026-09-17.md`).

## A. Pieces

### A.0 Basic patterns (context for the grid below)

|  | P | N | B | R | Q | K | A | L | G | M | S | O | C |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Move | forward 1 | leap 2+1 | diagonal slide | straight slide | slide | step 1 | step 1 ◐ straight only / forward-back | slide, jumps friends | step 1 ◐ step 2 | step 1 ◐ step 2 | step 1 ◐ forward only / diagonals | step 1 | straight slide, empty squares only |
| Capture | diagonal forward 1 | = move | = move | = move | = move | = move | **shot without moving**: diagonal-adjacent or 2 straight, blockers ignored ● **forward diagonal 2 adopted 2026-09-17** (`plusDiagFwd2`, mirrored for Black): decisive +8.8 ± 3.8 at depth 4, draws −8.2 ± 3.7; the archer re-prices 3.73 ± 0.42 → **5.05 ± 0.44 pawns** (`ARCHER_V` 505). ◐ +diagonal 2 / ring 2 / forward 3 remain lab readings (`docs/research/sim-piece-balance-2026-09-17.md`) | = move; dies after taking a non-pawn | none | = move (adjacent) | **every neighbour** (blind spot removed 2026-09-17; captures +29%, beast 4.34 ± 0.42 pawns, `BEAST_V` 434) ◐ the 7-neighbour blind spot, forward diagonals only, four diagonals; chains | = move, a guard excepted | **lob** over one enemy screen along a rank or file, first piece beyond it ◐ `catapultCapture` stay / land |

### A.1 Abilities × pieces

| Ability | P | N | B | R | Q | K | A | L | G | M | S | O | C | Designed (not built) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1a Arriving — home rank only** | — | — | — | — | — | — | — | — | — | — | — | — | — | ○ Salvation, ○ Sacrifice (Stratus) return a captured piece [1] |
| **1b Arriving — friendly half only** | — | — | — | — | — | — | — | — | — | — | — | — | — | ○ Flight (Stratus) relocates within own half [1] |
| **2 Shield — cannot be taken by X** | — | — | — | — | — | ● never taken (mated) | — | — | ● by all but a king ◐ off | — | — | — | — | ○ Ice Wall (1 turn, any own piece), ○ Shield card, ○ Holy Light (king vs pawns) |
| **3 Handicap — cannot take X** | — | — | — | — | — | — | ◐ a king | ● a king ◐ off | ● anything ◐ pawns / any | — | ● a king as a chain step | — | — | ○ Holy Light (king vs pawns), ○ Mercy (king takes nothing) |
| **4a Movement — special first move** | ● 2 forward from home rank | — | — | — | — | — | — | — | ◐ 2 from home rank, slide or leap (Q1) | — | — | — | — | ○ March (pawns 2 forward always), ○ Darkness (no double step) |
| **4b Taking = moving?** | differs | same | same | same | same | same | differs (shoots) | same | n/a | same | differs [2] | same | differs: it never takes by moving ◐ `land` makes the lob a displacement capture | ○ Death Touch (king shoots adjacent), ○ Darkness (pawns swap move/take) |
| **4c Hop — over any piece** | — | ● | — | — | — | — | — | — | ◐ leap, home rank only (Q1) | — | — | — | — | ○ Leap card (range not obstructed) |
| **4d Hop — over friends only** | — | — | — | — | — | — | — | ● ◐ off = blocked | — | — | — | — | — | ○ Mercy (king), ○ Mud Leap (over own pawns) |
| **4e Hop — over enemies only** | — | — | — | — | — | — | — | ◐ over enemies too (degenerate, `sim-lm-buffs`) | — | — | — | — | ◐ the lob hops exactly one enemy — the screen, which may not be a friend | — |
| **5a Control — move any adjacent piece** | — | — | — | — | — | — | — | — | — | — | — | ● pushes one non-king neighbour 1 square straight away onto an empty square and follows; ◐ repel stays put | — | ○ Earth Quake (shove), ○ Sky Lift (swap two units) |
| **5b Control — friends only** | — | — | — | — | — | — | — | — | — | ● swap with an adjacent friend; long swap with the king, both on home rank ◐ any friend anywhere (Q3) / king anywhere | — | ● a friend is pushable | — | ○ Control card, ○ Strike + Haste (Flame) |
| **5c Control — enemies only** | — | — | — | — | — | — | — | — | — | ◐ swap with an adjacent enemy (not the king) | — | ● so is an enemy, a Guard included | — | ○ Curse (take over), ○ Freeze (deny a move) |
| **5d Push — relocate a neighbour, then follow** | — | — | — | — | — | — | — | — | — | — | — | ● **default, 2026-09-24** (`ogreMode: 'push'`): the neighbour moves one square straight away and the Ogre follows. Value 318 adopted from the earlier 3.18 ± 0.44 pawn estimate. Historical depth-3/depth-4 results are in `sim-ogre-movement-2026-09-17.md` and `direct-campaign-phase-3-2026-09-22.md`; no run is active. | — | ○ Earth Quake, ○ Sky Lift |
| **5e Repel — relocate a neighbour, stay put** | — | — | — | — | — | — | — | — | — | — | — | ◐ **lab alternative** (`ogreMode: 'repel'`): the neighbour moves and the Ogre stays. Historical measured value **2.25 ± 0.43 pawns**; current evaluation value 318 is for the adopted push default. | — | ○ Freeze (deny a move), ○ Curse |
| **6a Trigger on capture** | — | — | — | — | — | — | — | ● dies after non-pawn captures; survives pawns ◐ always / never dies | ◐ spent after one capture (rejected) | — | ● may capture again ◐ off | — | — | ○ Rage (extra capture) |
| **6b Rule vs one specific piece** | — | — | — | — | — | — | ◐ cannot take a king | ● cannot take a king | ● only a king takes it | ● long swap only with the king | ● no king as a chain step | ● never pushes a king of either colour | ◐ a lob may take a king, so it checks through the screen | ○ Holy Light (king ↔ pawns) |

[1] No piece enters the adopted game from a reserve. The archived Squire experiment explored this; see the recovery assessment before treating those results as evidence.
[2] The Beast moves 1 to an empty neighbour or captures on any adjacent square; a capture may continue as a chain. The former straight-ahead blind spot was removed on September 17.

### A.2 Where each ability lives in the engine (`src/rules/engine.ts`)

| Ability group | Seam today |
|---|---|
| Move / capture patterns, hops | `genPiece`: one `case` per piece; `mode` `'all'` (moves) vs `'attacks'` (what gives check). A capture with `to === from` is "shoot in place" (archer; paladin's return) and every make/unmake path already handles it. The catapult's `stay` lob is the third user of that shape. |
| Shield, handicap, piece-vs-piece | `canCapture(attacker, victim)` — one function, both directions. A new pair is one line there. |
| Special first move | A test on `rank(from)` against the home rank (pawn, guard double step): positional, like the pawn, so no per-piece history and no FEN change. |
| Trigger on capture | `landed()` (what the mover becomes), `Move.selfRemove` (paladin), chain generation (beast). |
| Control | `Move.swap` (maester) and, since 2026-09-14, `Move.shove: { from, to }` (ogre) — the shoved piece is written before the mover, so `ogreMode: 'push'` needs no second path. |
| Arriving | Not present — see [1]. |
| Zones | No zone helper yet; ranks are compared inline. See B. |

## B. Board

### B.1 Zones × rules

| Zone | Squares | Shipped | Lab | Designed (not built) | Ideas |
|---|---|---|---|---|---|
| Home rank | 1 / 8 | maester–king long swap (both on it) | guard double step from it (Q1) | — | arriving 1a |
| Pawn rank | 2 / 7 | pawn double step | guard may not end a move on it (rejected: made the guard inert) | — | — |
| Own half | ranks 1–4 / 5–8 | — | — | ○ Flight (Stratus): move any own piece to any empty square in own half | arriving 1b |
| Last rank | 8 / 1 | promotion to Q R B N (the chess set, 2026-09-17) | promotion sets (`anyNonKingNoGuard`, `anyNonKing`, `anyNonKingNoFairy`) | — | — |
| **Capital** | d4 d5 e4 e5 | — | — | ○ Burn card: capture inside the capital zone | see B.2 |

### B.2 Capital — the four centre tiles

Each row is one kind of rule; each cell says whether it applies to that piece. All `?` until Saar fills them.

| Capital rule | P | N | B | R | Q | K | A | L | G | M | S | O | C | Expected effect on play |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 cannot enter | ? | ? | ? | ? | ? | ? | ? | ? | **◐ G** | ? | ? | ? | ? | Keeps the named piece out of the centre. For the guard: fewer central blockades → more decisive games (the anvil pattern moves to the flanks). **Built + measured 2026-09-17 (`guardNoCapital`, off): null** — decisive +0.3 ± 0.3; guards rarely enter the capital, so the ban changes nothing (`docs/research/sim-guard-2026-09-17.md`) |
| C2 cannot be taken while there | ? | ? | ? | ? | ? | ? | ? | ? | ◐ all | ? | ? | ? | ? | A sanctuary. Draw risk: an uncapturable centre piece is a second guard; expect longer games. **Built + CONFIRMED 2026-09-17** (`capitalSanctuary`, off by default): draws **−2.7 ± 2.6** at 1,600/arm depth 4, branching +1.6, capped 1.7% → 3.1%; white score cost vanished at depth 4 (`docs/research/sim-capital-c2-d4-2026-09-17.md`). **Without adjudication the gain shrinks to −1.3 ± 2.0 (not resolved) while the capped cost doubles** (2.75% → 4.75%) — leave off (`docs/research/sim-capital-c2-noadj-2026-09-17.md`) |
| C3 moves differently while there | ? | ? | ? | ? | ? | ? | ? | ? | ◐ G | ? | ? | ? | ? | A reward for holding the centre (e.g. 1-steppers step 2, pawns move sideways). Fight for the centre → sharper. **Guard instance built + null 2026-09-17** (`guardCapitalStep`); the package is outcome-null at depth 4. |
| C4 captures differently while there / into there | ◐ P | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ○ Burn (capture inside the capital). Sharpens if it adds captures; blunts if it forbids them. **Pawn instance built 2026-09-17** (`pawnCapitalCapture`, 0.50 straight captures/game) and **fails depth 4**: the depth-3 directions reverse (`docs/research/sim-capital-c4-d4-2026-09-17.md`). |
| C5 cannot be captured *by* a piece standing there | ? | ? | ? | ? | ? | ? | ? | ? | ◐ all | ? | ? | ? | ? | The mirror of C2 — a piece in the capital is a threat but not a hunter. **Built + measured 2026-09-17** (`capitalNoCapture`, off): **null** on outcomes (decisive −0.2 ± 3.0); structural: killer move +4.4, drama +2.0, maester survival 35% → 44% (`docs/research/sim-capital-c5-2026-09-17.md`) |

Engine seam: `const CAPITAL = new Set([27, 28, 35, 36])` (d4 e4 d5 e5) and (C1) a filter on `to` in `legalMoves`, (C2/C5) a square-aware `canCaptureAt(att, vic, from, to)`, (C3/C4) a branch on `CAPITAL.has(from)` in the piece's `case`. Every rule here is measurable in the lab as a toggle, like the piece rules.

## C. King powers and cards

Kings' powers are a shipped game mode (●, with the official readings of `POWERS_BALANCED`); card mode is lab only
(◐, `Rules.hands`). Sources: `src/rules/rules.ts`, `src/rules/engine.ts`, `cardText` in `src/powers-ui.ts`, `RULES.md` §4–§5.

### C.1 Schema: the properties of every power or card

| Property | Allowed values |
|---|---|
| Source | king power · card · both (a spendable king power is also dealt as a card) |
| Type | always-on (changes the rules while the king has it) · mark (binds the opponent's next turn) · extra move (a second move follows in the same turn) · special move (a move no piece has) · arrival (a piece comes onto the board) · copy (plays another card) · draw (takes a card from the pile) · promotion (a piece changes its type, D.3: ○ Morph) |
| Uses | n per game (king power) · 1 (every card) · — (always-on) |
| Turn cost | is the turn's move · then make the move (a free action, `markFree`) · extra move (the second move may be skipped) |
| Captures | may · must · never |
| Targets | own · enemy · either; which kings and pawns are excluded |
| Duration | instant · opponent's next turn (◐ `markTurns: 2`: two turns) · always |
| Has a condition | none · a zone (a rank, half, the capital) · tag team (next to a given piece) · turn N (`fromMove`) · a capture · a card played — see D.1. Example: "not before move 10" |
| Is a condition | no · yes: playing this card (or any card) triggers something else, for either side — see D.1. Example: Mirror answers the opponent's last card |
| Shackled | no · yes: weaker or off until a condition (`fromMove` is "off until move N") — see D.2 |
| Promotion | no · yes: a piece changes its type on a condition — see D.3 |
| fromMove | none (default) · N: not before the side's own move N (◐ `fromMove=Haste:10+Rage:8`; `Position.move`, the full-move number). Spendable powers and cards only; refused for an always-on power. A Mirror may not copy a card before its move. Every row below is none. |

### C.2 Each power and card

| Item | Source | Type | Uses (king) | Turn cost | Captures | Targets | Duration |
|---|---|---|---|---|---|---|---|
| Freeze | both ● / ◐ | mark | 1 (printed 2) | then make the move (printed: the turn's move) | never | an enemy piece or pawn, not the king | opponent's next turn |
| Ice Wall | both ● / ◐ | mark | 2 | then make the move (printed: the turn's move) | never | an own piece or pawn, not the king | opponent's next turn |
| Strike | both ● / ◐ | special move: as a queen | 1 | is the turn's move | never (printed: may) | an own piece, not the king or a pawn (printed: pawns too) | instant |
| Haste | both ● / ◐ | extra move: the same piece | 1 | extra move | never (printed: may) | an own piece, the king included | instant |
| Flight | both ● / ◐ | special move: to an empty square of the own half | 1 | is the turn's move | never | an own piece or pawn, not the king | instant |
| Sacrifice | both ● / ◐ | arrival: a pawn becomes a lost piece | 1 | is the turn's move | never | an own pawn; the piece not a pawn, guard or king | instant |
| March | both ● / ◐ | always-on (king) · special move (card): a pawn's double step from any rank | — (printed 3) | is the turn's move | never | own pawns | always (king) · instant (card) |
| Leap | both ● / ◐ | special move: a slider passes its own pawns | 3 | is the turn's move | may, not a king | an own rook, bishop or queen | instant |
| Holy Light | king power ● | always-on | — | — | the king may take pawns | own king: no enemy pawn takes it; own pieces beside, in front of or behind it cannot be taken | always |
| Mercy | king power ● | always-on: the king steps 1–2 and jumps own pieces | — | — | the king takes only a pawn or a guard | own pieces next to the king cannot be taken, except by pawns | always |
| Death Touch | king power ● | always-on | — | — | must: the king takes only without moving | an enemy next to the king, or 2 straight forward, back or sideways over an empty square | always |
| Darkness | king power ● | always-on: pawns step straight or diagonally; the king may step 2 straight | — | — | pawns take only straight ahead; the king's step never | own pawns and king | always |
| Mimic | card ◐ | special move: as another own type moves | — | is the turn's move | never | an own piece, not the king or a pawn; not as a king or pawn | instant |
| Vault | card ◐ | special move: a slider passes one piece | — | is the turn's move | may, not a king | an own rook, bishop or queen; it passes a piece of either side, a king included | instant |
| Curse | card ◐ | special move: an enemy steps 1 square | — | is the turn's move | never | an enemy piece or pawn, not the king | instant |
| Sky Lift | card ◐ | special move: two own pieces trade squares | — | is the turn's move | never | own pieces, not the king or pawns, not of one type | instant |
| Salvation | card ◐ | arrival: a lost piece to the own first rank | — | is the turn's move | never | an own lost piece, not a pawn, guard or king | instant |
| Rage | card ◐ | extra move: the same piece | — | extra move | may, on either move | an own piece, the king included | instant |
| RageB | card ◐ | extra move: the same piece | — | extra move | may on the first; the second must | an own piece, the king included | instant |
| Mirror | card ◐ | copy: the opponent's last card | — | the copied card's | the copied card's | the copied card's | the copied card's |
| MirrorB | card ◐ | copy: another card of the hand, which stays | — | the copied card's | the copied card's | the copied card's | the copied card's |
| Firewall | card ◐ | mark: every own piece | — | then make the move | never | all own pieces | opponent's next turn |
| FirewallB | card ◐ | special move: trade squares with an enemy next to it | — | is the turn's move | never | an own piece and an enemy piece, neither a king | instant |
| Earth Quake | card ◐ | special move: push the pieces next to a square | — | is the turn's move | never | pieces and pawns of either side, not kings | instant |
| Earth Quake B | card ◐ | special move: the same, a square next to an own piece | — | is the turn's move | never | pieces and pawns of either side, not kings | instant |
| Burn | card ◐ | special move: take in the capital as a queen | — | is the turn's move | must | an own piece, not a pawn or the king; an enemy on d4 e4 d5 e5, not the king | instant |
| Fire Starter | card ◐ | special move: the same on the enemy back rank | — | is the turn's move | must | as Burn, on the enemy back rank | instant |
| Control | card ◐ | special move: as a friendly neighbour moves and takes | — | is the turn's move | may | an own piece, not a pawn or the king; the neighbour not a pawn or king, nor of its type | instant |
| Rescue | card ◐ | mark: renews the own last mark | — | then make the move | never | the own Freeze, Ice Wall or Firewall | one more opponent turn |
| Growth | card ◐ | draw | — | is the turn's move | never | the own pile | instant |
| GrowthB | card ◐ | draw | — | then make the move | never | the own pile | instant |
| Rally | card ◐ | extra move: a different own piece | — | extra move | never, on either move | own pieces, the king included | instant |
| Morph (idea ○) | card | promotion: an own piece becomes another type | — | is the turn's move | never | an own piece, not the king or a pawn; the new type not a king or pawn, and never a second Beast (MorphB: not a queen either) | instant |

Every card is one use; "Uses (king)" is the official count of a king power (`POWERS_BALANCED` over the rule defaults).
"Then make the move" for the marks is `markFree`, official for the kings and used in every card measurement. Flight is
a special move here: it moves a piece already on the board (A.1 lists it under 1b, arriving, by its zone).

## D. Conditions, shackles and promotion (owner, 2026-10-06)

Three properties that any piece, king power or card can carry. A **condition** (trigger) is an event in the
game. It belongs to a piece ("when *this* pawn reaches the last rank") or to the game ("from turn N").

### D.1 Conditions (triggers)

| Condition | Scope | Today | Ideas |
|---|---|---|---|
| Reaches a zone (a rank, the own half, the capital) | piece | ● pawn on the last rank promotes · ● pawn double step from its start rank · ● Maester–king long swap, both on the home rank · ◐ guard double step from the home rank · ◐ capital rules C2–C5 (B.2) | stronger on the enemy half |
| Tag team: next to a given piece | piece | ● Mercy and Holy Light: pieces next to (beside, in front of, behind) the king cannot be taken · ● Maester swaps with a friend next to it · ◐ Control (moves as a friendly neighbour) · ◐ FirewallB (trades with an enemy next to it) | Archer next to a Beast also shoots 3 squares away |
| Turn N | game | ◐ `fromMove`: a spendable power or card not before the side's move N · ◐ Black's double first turn (`secondPlayerDoubleFirstTurn`) | a piece that wakes at turn N |
| A capture | piece | ● Paladin dies after taking a non-pawn · ● Beast may take again (a chain) · ◐ RageB's second move must take · ◐ a guard spent after one capture (rejected) | a piece that grows after its first capture |
| A piece lost | own side | ● Sacrifice and ◐ Salvation use the side's captured pieces | — |
| A card is played: any card or a given one, by either side | game | ◐ Mirror plays the card the opponent played last · ◐ Rescue answers the side's own last mark card | when the opponent plays any card, your guard may step; when you play Freeze, your next card is free |
| The own last mark | own side | ◐ Rescue renews the side's Freeze, Ice Wall or Firewall | — |

A card or power can be on **both sides** of a condition: it **has** a condition (it may be played only
when the condition holds: "not before move 10" is `fromMove`, "only in the capital" is Burn) and it **is** a
condition (playing it triggers something else: the opponent's Mirror copies it; an idea, "when any card is
played, …"). C.1 lists both as properties of every power and card.

### D.2 Shackled: nerfed until a condition

The piece, power or card keeps its type but is weaker, or off, until the condition happens.

| Item | Shackle | Released by | Status |
|---|---|---|---|
| Any spendable power or card | off | turn N | ◐ `fromMove` (the button shows "from move N") |
| Archer | shoots exactly 2 squares away | reaching the enemy back rank: also 3 squares away | idea |

### D.3 Promotion: a new type on a condition

| Piece / item | Becomes | Condition | Status |
|---|---|---|---|
| Pawn | queen, rook, bishop or knight | reaches the last rank | ● (◐ wider sets: `promotionSet` `anyNonKing`, `anyNonKingNoGuard`, `anyNonKingNoFairy`) |
| Sacrifice | an own pawn becomes one of the side's captured pieces | the power is used | ● (an arrival, C.2) |
| **Morph** (card idea, owner 2026-10-06) | one of your pieces becomes another piece type | the card is played | ○ to test: readings in C.2 |
| Promoted piece taken | returns (Salvation) as what it was when taken | — | ◐ |

### D.4 Powers and cards with a condition

Zone: Flight (own half), Burn (capital), Fire Starter (enemy back rank). Tag team: Mercy, Holy Light, Death Touch
(next to the king), Control, FirewallB, Earth Quake B (next to an own piece). Turn N: any item with `fromMove`.
Capture: RageB. Opponent's card: Mirror. Own last mark: Rescue. Lost pieces: Sacrifice, Salvation.
None is shackled today except through `fromMove`; none promotes except Sacrifice's pawn.

