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

## Workshop (build 1a, 2026-10-06)

The Workshop's rule blocks live in one table, `src/workshop/vocab.ts`. Each block names its row in this file, and a unit test finds that row here (docs/WORKSHOP.md §3.3, §8.4). Two rows for sections D.1 and D.2 (on `claude/power-schema`, not on this line yet); move them there when it merges:

| Section | Row | State |
|---|---|---|
| D.1 | Material behind (own side) | ◐ Sacrifice with `sacrificeBehind` |
| D.2 | Any piece: off until move N (Workshop `cannotMove`, build 1b); it still attacks, like a frozen piece | idea |
