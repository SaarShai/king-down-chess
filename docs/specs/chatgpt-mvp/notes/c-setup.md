# C · Game setup: piece pool, arrangement, classic chess, cards, kings and powers

Explorer note for the ChatGPT plugin MVP. Read-only survey of `main` at e73f8061 (2026-10-11), plus the
branch `claude/arrange-mode` and the card branches. Line numbers are for `main` unless the text names a branch.

## 0. Summary for the planner

- The engine plays every setup feature the MVP needs **except one combination**: cards together with a
  *spendable* king power. `setRules` refuses it (`src/rules/rules.ts:823-826`). The default kings (Spirit,
  Shadow) and every always-on power work with cards today.
- The random back rank comes from one function, `randomBackRank(rng, pool)` (`src/rules/setup.ts:29`). It
  takes any pool string. It needs **at least 7 letters** and no `K`. Both sides get the **same** rank.
- Classic chess is a supported army: `CLASSIC_CHESS = 'RNBQKBNR'` (`setup.ts:14`), army value `classic`.
  It is chess **without castling and without en passant**.
- Arrangement by players: built on `claude/arrange-mode` (2 commits, 2026-10-07, not merged, based on the
  old 1,348-line `main.ts`). The engine part (`startPosition(white, black)`, `arrangementError`,
  `randomArrangement`) is small and ports cleanly. The UI part conflicts with today's `main.ts`/`screen/play.ts`.
- Cards: 36 card names exist in the engine (`ALL_CARDS`, `rules.ts:190`); all are built and tested. Card mode is
  **lab only**: no web UI plays it, and the match module (`src/match/worker.ts:57`) refuses it. The deal is
  not decided: the owner fixed **4 cards** (2026-10-09) but not the card list (TASKS.md "Card deal", `needs-info`).
- Kings: 6 kings × 2 powers = 12 powers, all built. "Light" king = **Spirit**, "Dark" king = **Shadow**
  (`PLAIN_KINGS = ['Spirit','Shadow']`, `rules.ts:167`). The engine reads only the power; the king name is
  cosmetic.
- The match module (plugin) takes `{ backRank?, fen?, preset?, kings? }` and fixes the whole setup at create
  time. No field for a pool, a deal, or a per-side arrangement (a FEN can carry an asymmetric start).
- Crowns and unlocks: a design proposal only (`docs/PROGRESSION.md`). No code in `src/`.
- Settings "Piece letters" draws letter chips over the figures. No icon-only mode exists. Round SVG icons
  exist for 12 piece types (`src/piece-icons.ts`, `public/ui/icons/*.svg`).

## 1. Pieces

Engine type ids and letters: `src/rules/engine.ts:21-25`.
`LETTERS = ' PNBRQKALGMSOCVT'`, `NAMES = ['', pawn, knight, bishop, rook, queen, king, archer, paladin, guard, maester, beast, ogre, catapult, reaver, templar]`.

### 1.1 Every piece, with the shipped rule (`DEFAULT_RULES`, `rules.ts:646-758`)

| Letter | Name | Kind | In random pool | Move | Capture | Special / constraint |
|---|---|---|---|---|---|---|
| P | Pawn | orthodox | never (pawns fill rank 2/7) | 1 forward, 2 from start rank | 1 diagonal forward | promotes to Q R B N (`promotionSet: 'standard'`); no en passant |
| N | Knight | orthodox | 2 in pool | chess | chess | — |
| B | Bishop | orthodox | 2 in pool | chess | chess | two bishops must stand on opposite colours (`bishopsOppositeColours`) |
| R | Rook | orthodox | 2 in pool | chess | chess | no castling |
| Q | Queen | orthodox | 1 in pool | chess | chess | at most 1 in a random draw |
| K | King | orthodox | always, exactly 1 | chess | chess | no castling; may carry a power (§4) |
| A | Archer | fairy | 2 in pool | 1 square any direction (`archerMove: 'any'`), never captures by moving | **shoots without moving**: an enemy exactly 2 squares away straight, or 2 on a forward diagonal, through blockers; not a neighbour (`archerShots: 'far2'`, owner 2026-10-09) | gives check the same way |
| L | Paladin | fairy | 1 in pool (back since 2026-10-09) | like a queen; jumps friends; stopped by enemies | by moving onto the enemy | never takes a king (never checks); removes itself after taking anything but a pawn (`paladinKamikaze: 'nonPawn'`) |
| G | Guard | fairy | 1 in pool | 1 square any direction, empty only | **none** (`guardCaptures: 'none'`) | only a king may take it (`guardImmune`); starts next to its own king (`guardNextToKing`); **one guard per army** |
| M | Maester | fairy | 2 in pool | 1 square any direction | onto an adjacent enemy | onto an adjacent friend = swap; maester and own king both on rank 1 may swap at any distance (`maesterLongSwap`) |
| S | Beast | fairy | 1 in pool | 1 square any direction, empty only | every adjacent square (`beastCaptureForward: true`) | may keep capturing from the new square (chain), never a king as a continuation; **one beast per army** |
| O | Ogre | fairy | 1 in pool | 1 square any direction | onto an adjacent enemy, not a guard | pushes an adjacent friend or enemy (never a king) one square straight away onto an empty square and follows (`ogreMode: 'push'`) |
| C | Catapult | lab | no | straight slide, empty squares only | lob over one enemy screen | paused, no art, no icon |
| V | Reaver | lab | no | — | one capture, then a step | paused, no art, no icon |
| T | Templar | lab | no | — | — | rejected, no art, no icon |

Sources: `docs/RULES.md` §3 (table at lines 37-46), `docs/MATRIX.md` A.0 and A.3.
Card-game names of the chess pieces (RULES.md §3): Pike = pawn, Steed = knight, Cross = bishop, Rock = rook, Thorn = queen.

### 1.2 Art and icons per piece

- Painted board sprites (`src/render/sprites.ts:14-17`, `FILE`): P N B R Q K A L G M S. The Ogre has no
  board sprite; the board draws it as a 3D model (`renderer.ts:575`, `ogreModel`). Flat UI art for all 11
  non-king pieces, the Ogre included, is in `public/ui/pieces/<name>-w|b.webp`. Lab pieces fall back to a
  voxel box.
- Round icons (`src/piece-icons.ts:10`, `ICON_PIECES`): pawn knight bishop rook queen king archer paladin guard
  maester beast ogre. Files: `public/ui/icons/<name>.svg`, root `<svg id="icon">`, coloured by CSS
  (`.pi`, `.pi-w`, `.pi-b`). `pieceIcon(t, army?)` returns `''` for C, V, T.
- These icons are the obvious source for the MVP "symbols only" graphic mode (§9).

## 2. The random back rank

### 2.1 The pool

`src/rules/setup.ts:9`: `POOL = 'QOLRRBBNNAAGMMS'` (15 letters).
Counts: Q×1, O×1, L×1, R×2, B×2, N×2, A×2, G×1, M×2, S×1.
Orthodox letters: Q R R B B N N (7). Fairy letters: O L A A G M M S (8).

Older pools, kept for replay of recorded runs:
- `POOL_NO_PALADIN = 'QORRBBNNAAGMMS'` (2026-10-04 to 2026-10-09).
- `POOL_2BEASTS = 'QORRBBNNAAGMMSS'` (before 2026-10-04).

The caps "one queen, one guard, one beast, one ogre, one paladin per army" hold **only because the pool holds
one of each**. No code checks them in `randomBackRank`.

### 2.2 The draw (`randomBackRank`, `setup.ts:29-43`)

1. Shuffle the pool letters; take the first 7.
2. Add `K`; shuffle the 8.
3. If `RULES.guardNextToKing` and a `G` is not next to `K`: swap the `G` with a neighbour of the king (random
   side when both exist). Only the first `G` (`indexOf`) moves.
4. If `RULES.bishopsOppositeColours` and exactly two `B` share a colour: draw again (loop).
5. Return the 8-letter string, for example `RSAKGQOB`.

`startPosition(backRank)` (`setup.ts:63-75`) mirrors the **same** rank for Black on rank 8 and fills ranks 2
and 7 with pawns. So **both sides get the same draw, in the same order**. It throws on a rank that is not 8
capital letters with exactly one `K`, or on an unknown letter.

Seeds: `rng` is a parameter. The daily army uses `randomBackRank(mulberry32(YYYYMMDD))`
(`src/new-game.ts:181`, `src/main.ts:124`). The first visit uses `FIRST_DEAL = 'QRNAKBBS'` (`src/first-deal.ts:2`).

### 2.3 An arbitrary pool subset (MVP "all" sub-menu)

The engine supports any pool string through the `pool` parameter. The web game never passes one (it always
uses `POOL`). The simulator passes one with `--pool`. Rules for a safe subset:

| Condition | What happens if broken |
|---|---|
| At least 7 letters (counting duplicates) | `slice(0, 7)` returns fewer; the rank is shorter than 8; `startPosition` throws `bad back rank` |
| No `K` in the pool | two kings; `startPosition` throws |
| No `P` | a pawn on rank 1 is accepted by `startPosition` but is nonsense (no double step; it moves from rank 1) |
| At most one `G` | the second guard is not moved next to the king; "one guard per army" breaks |
| At most one `S` | "one beast per army" breaks (owner: "that should always be the case") |
| Lab letters C, V, T | play, but have no art and no icon |

Recommendation for the toggle UI: keep the **counts** of `POOL` and let the player remove whole piece kinds.
If the kept letters number fewer than 7, the UI must stop Start (or the build must add a fill rule; the owner
has not decided one). Examples:
- Orthodox only: `QRRBBNN` = exactly 7 → always the chess pieces in a random order (Chess960 without castling).
- Remove Q, R and B: `OLNNAAGMMS` = 10 letters → fine.
- Remove all orthodox pieces: `OLAAGMMS` = 8 letters → fine.
- Keep only N, A, M, S: `NNAAMMS` = 7 letters → fine; one more removal → too few.

Other places that assume the full pool:
- **Morph cards** pick new types from a fixed list, `MORPH_TYPES = [Q, O, L, R, B, N, A, G, M, S]`
  (`engine.ts:1321`), not from the game's pool. With a custom pool a Morph can still make an excluded piece.
- The computer's evaluation has values for every pool piece; no change needed.
- The New game army strip shows `[...new Set(POOL)]` for "random" (`new-game.ts:183`).

### 2.4 Custom and example armies (web)

- `army: 'custom'`: a `prompt()` for 8 letters (`src/main.ts:117-120`); it refuses two `S`. No other checks
  (no guard-next-to-king, no bishop colour, no one-guard check). `startPosition` checks one `K` and letters.
- Example armies in `index.html:179-181`: `MMSSNBNK`, `KGBMSSMB`, `NKBBMGQS`, `QNKMNRSG`, `SQBKRSML` — **three of
  them hold two beasts**, against the one-beast rule. `TRY_THESE` (`src/try-these.ts`) adds catapult armies
  (`COAQNRBK`, `CSAQNRBK`, `CGAQNRBK`) and `QOGNRKBA`.
- `army: 'ogre'`: the Ogre practice FEN `7k/8/6o1/8/2OP4/8/8/K7 w - - 0 1` (`main.ts:106`).

## 3. Classic chess

- Supported: army value `classic` → `play.newGame(CLASSIC_CHESS)` (`src/main.ts:125`). Label "Chess starting
  army" (`index.html:176`).
- Rules in force: the same engine rules. No castling, no en passant (`engine.ts:4`, RULES.md §1). Promotion is
  Q R B N. 50-move, threefold and insufficient-material draws are on.
- Kings' powers apply on top if chosen (the setup and the powers are independent). Cards would too, once the
  web plays them.
- **The match module defaults to classic**: `new Game(s.backRank ?? 'RNBQKBNR')` (`src/match/worker.ts:58`).
- The plugin today always sends `DEFAULT_SETUP = { backRank: 'RAGQKMSO', kings: 'Flame:Haste,Frost:Freeze' }`
  (`src/plugin/server.ts:8`): one fixed army, fixed kings, no choice.
- Risk: players who pick "classic chess" may expect castling and en passant. The engine has neither, and adding
  them is engine work (not a toggle). Say so in the UI ("Chess pieces, King Down rules: no castling").

## 4. Arrangement by players

### 4.1 What `claude/arrange-mode` built

Commits (`git log main..claude/arrange-mode`): `ceb69fe6` "Arrange mode: each side orders its own back rank
before the game", `641a5021` "Arrange mode on the real board". Both 2026-10-07. Merge base `c0675c1c`
(2026-10-07). The worktree `.claude/worktrees/agent-a5e322e52260a6391` is on that branch with no local changes.

Files: `src/arrange.ts` (+97), `src/arrange.test.ts` (+36), `src/rules/setup.ts` (+33/−?), `src/main.ts` (+22),
`src/new-game.ts` (+8), `index.html` (+12), `src/style.css` (+11), `docs/RULES.md` (+3).

Engine part (`src/rules/setup.ts` on the branch):
- `startPosition(backRank = randomBackRank(), black = backRank)`: Black may get its own rank. Each rank is
  checked (8 capitals, one `K`, known letters). Pawns as usual.
- `arrangementError(row, army): string | null`: same multiset of letters as `army` ("Use the same pieces as the
  army."), exactly one king ("Exactly one king."), bishops on opposite colours when `bishopsOppositeColours`
  ("Bishops must stand on opposite colours.").
- `randomArrangement(army, rng)`: `randomBackRank(rng, army.replace('K',''))` — the 7 non-king letters are
  exactly 7, so it is a legal random order of the same pieces.

UI part (`src/arrange.ts`):
- `arrangeMode(view)` returns `{ active, open(army, sides, start, cancel), click(sq), pick(sq) }`.
- On the real board: tap one back-rank piece, then another of the same rank, to swap (`swapAt`); drag also
  works. Pawns stay. Per side: **Randomize** and **Ready**; **Start game** opens when both are ready;
  **Cancel** returns to the old game. A computer side randomizes and is ready at once.
- New game → More options: checkbox `#arrange-on` "Arrange your pieces"; `Setup.arrange: boolean`.
- Start: the army (random, daily, classic, custom or example) gives the pieces; if both orders match it calls
  `newGame(w)`, else `newGame(undefined, toFen(startPosition(w, b)))` — an asymmetric start travels as a FEN.

### 4.2 Gaps and risks of the branch

- **Stale base.** It edits the old `main.ts` (1,348 lines). Today `main.ts` is 210 lines and the game logic is
  in `src/screen/play.ts`; the New game sheet changed too (redesign ticket 06). The UI part needs a re-do; the
  engine part is a clean port.
- `arrangementError` does **not** check `guardNextToKing` (adopted 2026-10-09, after the branch). A player can
  put the guard away from the king. Owner question: does "guard next to king" bind a player's own arrangement?
  (Recommend: yes, as a check with a clear message, because the rule exists to fix the guard's start.)
- No check for "one guard / one beast" — not needed while the army comes from the pool draw.
- Both sides arrange the **same** drawn pieces (same multiset). The MVP wording fits: "the piece draw stays
  random from the approved pool, but players arrange the pieces themselves".
- Two people on one device see each other's arrangement (no hiding). Online, the joiner arranges on their own
  device; whether White sees Black's rank before Black is ready is a product choice. Nothing hides it today.
- Not merged, no owner sample yes recorded in a ticket.

### 4.3 How the engine carries an arrangement

- Symmetric: the 8-letter back rank (`Game.newGame(backRank)`, `MatchSetup.backRank`).
- Asymmetric: a FEN only (`Game.load(fromFen(fen))`, `MatchSetup.fen`). `Game.backRank` is then `''`.
  The match worker accepts a canonical FEN (`worker.ts:39-48`).
- No engine state depends on the two ranks being equal (no castling, Chess960-free). Threefold and Zobrist keys
  work on the board. Safe.

## 5. Kings and powers

### 5.1 Kings (`src/rules/rules.ts:82, 154-161`)

| King (engine) | Power A | Power B | Painted board sprite (`sprites.ts:23`) | Clay/cast art name (`CastCatalog.ts`) | Portrait / emblem files | Army colour (RULES.md §6.6) |
|---|---|---|---|---|---|---|
| Frost | Freeze | Ice Wall | `king-frost` | Frost King | `public/ui/kings/frost(-b).webp`, `public/ui/emblems/frost.webp` | blue |
| Flame | Strike | Haste | `king-ember` | **Ember** King | `kings/flame(-b).webp`, `emblems/flame.webp` | red |
| Stratus | Flight | Sacrifice | `king-celestial` | **Celestial** King | `kings/stratus(-b).webp`, `emblems/stratus.webp` | purple |
| Mud | March | Leap | `king-gaya` | **Gaya** King | `kings/mud(-b).webp`, `emblems/mud.webp` | green |
| **Spirit** (the Light king) | Holy Light | Mercy | none: plain `king-w`/`king-b` | Spirit King | `kings/spirit(-b).webp`, `emblems/spirit.webp` | white |
| **Shadow** (the Dark king) | Death Touch | Darkness | none: plain `king-w`/`king-b` | Shadow King | `kings/shadow(-b).webp`, `emblems/shadow.webp` | black |

- "Light and Dark kings" = Spirit and Shadow (AGENTS.md:53; `kings-powers-balance-2026-10-02.md` rounds 9+).
  They "may be stronger than the other four, but must balance each other".
- `PLAIN_KINGS = ['Spirit', 'Shadow']` (`rules.ts:167`): the king each side **shows** with no power — White
  Spirit, Black Shadow (owner, 2026-10-03). For the rules a king with no power is `null`.
- Open owner item (TASKS.md "King with no power", `needs-info`): draw a king picked with No power *as that
  king*? Today the board draws the plain king when the power is null.
- Painted Spirit and Shadow board sprites do not exist yet; the portraits and emblems do.
- Card art in `public/ui/cards/`: back, freeze, icewall, leap, march, mimic, rescue, sacrifice, salvation,
  skylift, vault (10 faces). Most cards have no art.

### 5.2 Powers (official = `POWERS_BALANCED`, `rules.ts:799-817`, applied whenever a king has a power)

| Power | King | Kind | Official effect (player words from `powerText`, `src/powers-ui.ts:17`) | Uses |
|---|---|---|---|---|
| Freeze | Frost | spendable, mark | freeze an enemy piece (not the king), then make your move: it cannot move on its next turn (`markFree`) | 1 (`freezeUses: 1`) |
| Ice Wall | Frost | spendable, mark | wall one of your pieces (not the king), then make your move: it cannot be captured on the next turn | 2 |
| Strike | Flame | spendable | move any piece except a pawn or the king as if it were a queen, to an empty square | 1 |
| Haste | Flame | spendable | move one piece twice in one turn (second optional); neither move captures | 1 |
| Flight | Stratus | spendable | move any piece except the king to any empty square in your half | 1 |
| Sacrifice | Stratus | spendable | turn one of your pawns into one of your pieces captured earlier (not a pawn, guard or king) | 1 |
| March | Mud | always on (`marchUses: 0`) | any pawn may step two squares from any rank | always |
| Leap | Mud | spendable | a rook, bishop or queen passes over your own pawns | 3 |
| Holy Light | Spirit | always on | enemy pawns cannot take your king; it may take pawns; your pieces beside, in front of or behind it cannot be taken | always |
| Mercy | Spirit | always on | king steps 1–2 squares and jumps your pieces, takes only a pawn or a guard; pieces next to it cannot be taken except by pawns | always |
| Death Touch | Shadow | always on | king takes an enemy next to it, or 2 squares straight forward or back over an empty square, without moving — its only way to take | always |
| Darkness | Shadow | always on | pawns may also step diagonally, take only straight ahead; the king may also step two squares in a straight line over an empty square | always |

`BUILT` (`rules.ts:173`): all twelve. `TIER1` (stateless): HolyLight, Mercy, DeathTouch, Darkness, March, Leap.
Power state on `Position`: `used` (uses spent), `marks` (Freeze/Ice Wall), `free`, `haste`, `lost` (Sacrifice
reserve); FEN field 7 carries them (`setup.ts:77-130`).

### 5.3 Can a king take any power? "No power"?

- **Engine: yes.** The engine reads only `RULES.kings[c]?.power` (`powerOf`, `engine.ts:294`); `king` is never
  read by the rules or the search. A `{ king: 'Frost', power: 'Mercy' }` would play.
- **Validation: no.** `parseKing` (`rules.ts:193-202`, used by `?kings=` and the match worker) and
  `parseSetup` (`new-game.ts:85-94`) refuse a power that is not one of that king's two. The New game picker
  offers only the king's two powers plus **No power**.
- **No power**: `power: null` in `Pick` (`new-game.ts:24`); `kingsOf` maps it to `null` in `Rules.kings`. A
  side with no power plays a plain chess king. Text: "No power: a plain chess king." (`new-game.ts:171`).
- Both sides may pick the same king and power. Kings are per side (`[white, black]`).
- `POWERS_BALANCED` applies to the whole game when **either** king has a power (`withPowers`, `main.ts:39`,
  `screen/play.ts:655`, `match/worker.ts:56`).

### 5.4 The web New game sheet today (`src/new-game.ts`)

- `Mode = 'computer' | 'powers' | 'two'`. `Setup = { mode, level, side, twoPowers, picks: [Pick, Pick], army }`.
- `defaultSetup()`: computer, level `club`, White, no powers, picks White Spirit / Black Shadow with
  `power: null`, army `random`.
- `withMode`: turning powers on gives each king with no power its **first** power (Spirit → Holy Light,
  Shadow → Death Touch). `withKing`: pressing an emblem picks that king with its first power.
- King picker per side: six emblem buttons (`./ui/emblems/<king>.webp`), two power buttons, a "No power"
  button, and one line of power text. The picker shows only when powers are on.
- Army choice: random, daily, classic, custom, examples, ogre practice.
- This maps well onto the MVP "king's coin opens a sub-menu to pick a king and power" — the data model
  (`Pick`) and the texts (`powerOptions`, `POWER_NAME`, `newGamePowerLine`) are reusable.

## 6. Cards

### 6.1 Every card (`CardName`, `rules.ts:91-94`; `ALL_CARDS`, `rules.ts:190`)

`ALL_CARDS` order (append only; it is the hash slot): the 8 spendable powers, then `CARD_ONLY` (28).
All 36 are **built in the engine** with tests (`src/rules/cards.test.ts`, `cards-2014.test.ts`, `morph*.test.ts`,
`spawn.test.ts`, `rally.test.ts`, `from-move.test.ts`). Player text: `cardText` (`powers-ui.ts:72-106`).
"Status" is the deal status from TASKS.md, the tasks archive 2026-10 and MATRIX C.2.

| Card | Effect (short) | Measured worth vs no card | Deal status |
|---|---|---|---|
| Freeze | power card: freeze an enemy piece (free action under `markFree`) | — | candidate |
| IceWall | power card: wall an own piece | +0.55 (below 0.7 floor) | candidate, weak |
| Strike | power card: a piece moves as a queen | — | candidate |
| Haste | power card: one piece moves twice | +2.59 | candidate |
| Flight | power card: a piece to any empty square of own half | — | candidate |
| Sacrifice | power card: a pawn becomes a lost piece | — | candidate |
| March | power card: a pawn's double step from any rank | +0.56 (below floor) | open: "Keep March?" |
| Leap | power card: a slider passes own pawns | — | candidate |
| Mimic | a piece moves to an empty square as another own type moves | — | open (one of "the four new cards") |
| Vault | a rook/bishop/queen passes one piece on its line | — | open (four new cards) |
| Curse | an enemy piece or pawn (not king) steps 1 square | +0.31 (below floor) | open (four new cards) |
| SkyLift | two own pieces (not pawns/king, different types) trade squares | +1.2 | open (four new cards) |
| Salvation | a captured piece returns to an empty square of own back rank (no pawn/guard/king) | — | candidate |
| Rage | one piece moves twice, may take on either move | +4.06 | **legendary** (dealt rarely; rarity not built) |
| RageB | one piece moves twice; second move must take | — | lab |
| Mirror | play the opponent's last card | ~0 | **dropped** (owner 2026-10-07) |
| MirrorB | play another card of your hand; it stays | +2.2 | **chosen** (owner 2026-10-07) |
| Firewall | none of your pieces can be taken on the opponent's next turn | +2.21 | candidate |
| FirewallB | swap an own piece with an adjacent enemy (no kings) | — | lab |
| EarthQuake | push the pieces next to a square one square away | — | candidate |
| EarthQuakeB | the same, on a square next to an own piece | — | lab |
| Burn | a piece takes an enemy on d4/e4/d5/e5 as a queen | — | candidate |
| FireStarter | the same on the enemy back rank | — | candidate |
| Control | a piece moves/takes as an adjacent friend does | +2.22 | candidate |
| Rescue | your last Freeze/Ice Wall/Firewall lasts one more turn | +0.4 | **dropped** (owner 2026-10-07) |
| Growth | as your move, draw the next card | — | needs a pile |
| GrowthB | draw, then move | raises draws (+3.6) | needs a pile |
| Rally | move one piece, then a different one; no captures | +2.60 / +2.90 | candidate ("deal candidate") |
| Morph | a piece becomes another pool type (no 2nd beast/guard) | ≈ a free queen (98%) | lab |
| MorphB | the same, never a queen | +3.3 (above 3 ceiling) | lab |
| Spawn | a new pawn on own start rank | +0.36 | set aside |
| SpawnK | a new pawn next to own king | +0.80 | lab |
| Spawn2 | two new pawns on own start rank | +0.50 | lab ("the start-rank Spawn card") |
| SpawnK2 | two new pawns next to own king | +1.55 | lab |
| MorphP | a pawn becomes a knight or bishop | +2.3 / +2.65 | **in the deal** (owner 2026-10-06: "add MorphP to the deal") |
| MorphS | two own pieces of different types swap places | +1.0 | lab (same as SkyLift) |

Unbuilt 2014 ideas (MATRIX C.3): Frost Bite, Shield, Pawn, Siege, Skirmish, Spirit Guide, Shadow Cover.

### 6.2 The deal

- **Decided**: 4 cards a hand (owner 2026-10-09: "yes. 4 cards."); MirrorB in, Mirror and Rescue out; Rage
  legendary; MorphP in.
- **Not decided** (TASKS.md "Card deal", `needs-info`): the card list; keep March; whether Mimic, Vault, Curse,
  Sky Lift join. So "random from all cards" in the MVP brief needs the owner's list. Recommend: the MVP's
  "all" sub-menu default = the candidate set above minus dropped and lab cards, and the owner confirms.
- **How the lab deals** (`src/sim/tournament.ts:65-89`): `dealOrder` shuffles the card pool with a seed;
  `cards<k>` takes the first k. **Both sides hold the same hand** (a mirror deal) — matches the MVP brief
  ("the same for both players"). `pileFor` gives each side the rest of the pool in the same order (Growth).
  The default sim pool `CARD_POOL` is only the 8 power cards; runs name their own `cardPool`.
- No deal code exists in the web game. No rarity code exists (Rage "legendary" is a doc label and a balance
  schema field, `src/balance/schema.ts:10`).

### 6.3 Card mode in the engine

- Hands are a rule: `Rules.hands: [white[], black[]]`, `Rules.piles`, `Rules.fromMove` (`rules.ts:604-627`).
  `HAND_MAX = 8` (`engine.ts:314`). One card a turn. Played cards are bits of `Position.used[c]`.
- Card states in FEN field 7: marks with `i`/`a`, `hd4r/t/o`, `yX.Y` (last card), `dN.M` (drawn).
- The search plays card mode (`src/ai/search.ts:163`); the simulator measured it at scale.
- **Blocker for "cards + king powers"**: `setRules` throws when a side has a hand **and** a spendable power
  (`rules.ts:823-826`), because `Position.used` is either a use count (power) or card bits (hand), not both
  (`spend`, `engine.ts:343`). Under `POWERS_BALANCED`:
  - Works with cards: **Holy Light, Mercy, Death Touch, Darkness, March** (always on). So both default kings
    (Spirit, Shadow) with any of their powers, and Mud:March, are fine.
  - Refused with cards: **Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, Leap**.
  - Fix options: (a) split `used` into a power count and a card mask (engine + FEN + hash + search change;
    redesign ticket 24 names it); (b) treat the king's power as one more card in the hand (simplest; uses
    counts >1 for Ice Wall and Leap need care). Either needs the owner's yes and a measured run (ticket 24).

### 6.4 Card mode in the web UI

- **Not playable.** No screen sets `hands`. Menu → Extra shows "Coming: Card mode: power coins by the king"
  (`index.html:222`). Redesign ticket 24 (`docs/specs/web-redesign/issues/24-card-coins.md`) is `needs-info`:
  owner design "card mode C, coins by the king, the power coin first", blocked by the deal, the engine rule
  above, card art and the Rage look.
- Missing UI pieces (ticket 24 plan): `needsArming`/`offered` for card tags (today only
  freeze/ward/strike/haste/flight/sacrifice, `powers-ui.ts:119`), move words for every card tag, a
  `usesLeft`/`coinState` that read hand bits, the coin row.
- The Workshop / Proving Ground (`src/workshop/ground.ts`, `src/workshop/powers.ts`) shows card text and plays
  single lab cards in a sandbox (`hands: [[card], []]`). Reusable for card reads, not a game mode.

### 6.5 Card mode in the match module (plugin)

- **Refused**: `create` throws `'Private card data unsupported'` if any hand or pile is set
  (`src/match/worker.ts:57`); `MatchService.create` maps it to `INVALID_INPUT` "Invalid game setup"
  (`service.ts:21`). `PublicMatchRules` omits `hands`, `piles` (`index.ts:8`); `snapshot` strips them.
- `MatchSetup` has no field to pass a deal anyway.
- The worker's FEN input check (`worker.ts:43`) accepts only `u`, `m..` (no `i`/`a`), `f`, `h..` (no `r/t/o`),
  `l`, `g` tokens — card states would fail as input FEN.
- Note: the MVP deal is the **same and public** for both sides. The privacy reason for the refusal does not
  apply; the hand can travel in the snapshot. A build can lift the refusal for a public mirror deal.

## 7. The match module and setup (what the plugin can pass today)

`src/match/index.ts:6`: `MatchSetup { backRank?: string; fen?: string; preset?: 'current'|'2017'|'2021'; kings?: string }`.

- `backRank`: 8 letters of `PNBRQKALGMSOCVT` (regex only; one-`K` check in `startPosition`). Both sides mirror it.
  Default `'RNBQKBNR'`.
- `fen`: a canonical FEN (exclusive with `backRank`). This is the only way to give each side its own rank.
- `kings`: `"King:Power,King:Power"` or `none` per side; must be two parts; parsed by `parseKings`.
- `preset`: older rule sets.
- Rules per match live in one worker thread (`setRules` is module state, one per thread: safe).
- The whole setup is fixed in `create` (by White). `join` only fills `black_id` (`service.ts:80-95`). **No
  phase lets the joiner pick a king, a power or an arrangement.** The MVP needs either (a) a "setup pending"
  state: create the engine match after the joiner's choices, or (b) a create-then-recreate when the joiner
  submits choices before move 1.
- No pool, deal, toggles or level in `MatchSetup`. The computer move uses fixed `maxTimeMs: 250, maxDepth: 6`
  (`service.ts:63`); no skill levels.
- Saves bind to an engine hash of all `src/rules` and `src/ai` sources (`worker.ts:13-29`): any engine change
  makes old saves `MATCH_INCOMPATIBLE`.

## 8. Computer levels (web)

`src/ai/skill.ts`, `LEVELS` in `new-game.ts:37`: `beginner`, `casual`, `club` (default), `strong`.

| Level | Time cap | Temperature | Random-move chance | Sheet text (`new-game.ts:155`) |
|---|---|---|---|---|
| beginner | 700 ms | 200 | 10% | "New to King Down? Start here." |
| casual | 800 ms | 80 | 4% | "Makes some mistakes." |
| club | 800 ms | 15 in the first 6 plies, then 0 | 0 | "Plays well. Keep your pieces safe." |
| strong | 2,500 ms | 15 first 6 plies, then 0 | 0 | "Thinks longer. Plays stronger." |

The web computer runs in a Web Worker (`Engine`, `src/game.ts:101-146`) and gets the rules by value per search.
The plugin's server computer has no levels (§7). Open item: "Powers-mode computer player" (better move
ordering) is `ready-for-agent`, runs need the owner's go.

## 9. Settings (web) and the "symbols only" mode

- Menu → Board help (`index.html:206-211`): Show threats, Coordinates, **Piece letters** (`#labels`), Always
  promote to a queen. Feel: Sound, Motion (normal/fast/off). Extra: Look (painted/clay; clay is parked).
- Wiring: `src/screen/settings.ts` (`Controls`, `settingsOf`, `connectSettings`); saved in the local save and the
  account's settings; `?labels=1` forces letters on.
- **Piece letters** = letter chips (sprites) over every figure: `setLabels` in `src/render/renderer.ts:337-341`
  ("the last resort when two silhouettes still read alike"). It keeps the figures.
- **No icon-only mode exists.** Open owner item: TASKS.md "Piece-letter icons" (`needs-info`): "Should Settings →
  Piece letters draw icons on the figures?"
- For the plugin, `src/piece-icons.ts` (`pieceIcon(type, army)`) and the 12 SVGs give a ready symbol set. The
  three lab pieces have none (not in any MVP pool).

## 10. Crowns, unlocks, profile

- `docs/PROGRESSION.md` (2026-09-27, **proposal**, owner decisions open): start with Archer + Beast; crowns
  for wins against the computer at Casual or stronger; Maester at 2, Ogre at 5, Guard at 9 crowns; Paladin was
  out of the pool then (the multiplayer research proposes it last, about 14 crowns; D17). Sandboxes (classic,
  custom, examples) open to all. Storage local plus export code.
- **No code**: no crown counter, no unlock store, no gating in `src/` (grep for crown/unlock finds only the
  wordmark icon). Nothing writes `user_data.unlocks` (multiplayer report part 02).
- MVP brief says "all unlocked in this build": no work needed beyond showing the registry.
- Achievements/badges: proposals only (`docs/research/multiplayer-2026-10-10/02-ranking-and-profiles.md`
  §5, e.g. "Full Court", "Long Reach").

## 11. Map from the MVP toggles to the code

| MVP toggle | Engine support | Web support | Match/plugin support | Work |
|---|---|---|---|---|
| Fairy pieces on (random from pool) | `randomBackRank(rng, POOL)` | yes (army `random`) | only a fixed `backRank` | server draws the rank; send `backRank` |
| "All" sub-menu (include/exclude kinds) | `randomBackRank(rng, pool)` with ≥7 letters, no K/P, ≤1 G/S | no | no | pool builder + validation; Morph ignores it |
| Arrangement on (players order own pieces) | `startPosition(w, b)` on branch; asymmetric via FEN | branch only, stale | FEN only; no joiner phase | port engine part; add setup phase; decide guard-next-to-king |
| Classic chess (fairy off) | `CLASSIC_CHESS` | yes (army `classic`) | default when no `backRank` | label "no castling, no en passant" |
| Cards on, 4-card mirror deal | `Rules.hands` (36 cards) | no | refused (`worker.ts:57`) | deal list (owner), deal code, UI, lift refusal |
| Cards + a spendable king power | **refused** by `setRules` | no | no | engine change + owner yes + run |
| King powers off → Spirit / Shadow art | `PLAIN_KINGS` | yes (picks default) | `kings: none` | Spirit/Shadow board sprites missing |
| King powers on → pick king and power | `Rules.kings` | yes (New game picker) | `kings` string, set by White only | joiner pick phase |
| Joiner picks own king/power | per-side `kings` | n/a | no phase | setup pending state |
| Symbols-only graphic mode | n/a | letters only | n/a | use `piece-icons` SVGs |

## 12. Risks

1. Cards with Frost, Flame, Stratus or Mud:Leap kings throw in `setRules` — a UI that allows the mix crashes
   game creation. Gate it in the UI until the engine change lands.
2. A pool under 7 letters throws in `startPosition`; a pool with two `G` or two `S` breaks the per-army caps.
3. Arrangement without a guard-next-to-king check contradicts decision 21 (owner question).
4. The match setup is fixed at create; the joiner cannot choose without a new state in `plugin_matches`.
5. Any engine change (e.g. the `used` split) invalidates all saved plugin matches (engine hash).
6. "Classic chess" lacks castling and en passant.
7. Three web example armies break the one-beast rule (`index.html:179-181`).
8. The card list for the deal is an open owner decision; Rage rarity is unbuilt; most cards have no art.
9. `setRules` is global module state. In the browser one game at a time is fine; on the server each match must
   keep its own worker (as today).
