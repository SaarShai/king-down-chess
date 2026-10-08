# King Down: today's UI, the roadmap, and the three earlier menu designs

Date: 2026-10-08. Research track: King Down itself. The rules and numbers are in [king-down-facts.md](king-down-facts.md).

Links go from this folder: `../../../../X.md` is `docs/X.md`; `../../../../../src/` is the source.

## How often: the labels

The labels come from the inventory of ticket 03 ([screens/sources/inventory.md](../../screens/sources/inventory.md)) and its spec ([screens/spec.md §2.2](../../screens/spec.md)). They are design judgements, not measured use. The app has no analytics.

- **Turn**: in most turns of a game.
- **Every**: in every game, once or a few times.
- **Some**: some players, or some games (powers, links, review).
- **New**: a new player, in the first sessions.
- **Rare**: a few times, or once.
- **Lab**: the designer and the tests only.

## 1. Today's UI, feature by feature

Source: [index.html](../../../../../index.html), `src/main.ts`, [new-game.ts](../../../../../src/new-game.ts), [WORKSHOP.md](../../../../WORKSHOP.md), the inventory and [review.md](../../review.md). "Pain" quotes the problem that the reviews found.

### 1.1 Title

| Feature | What it does | How often | Pain |
|---|---|---|---|
| Stage: six kings in an arc, each with a resting effect | The first picture of the game | Every visit | — |
| Lineup of all 12 pieces with names and icons | Shows the cast | New | Not interactive |
| Continue · move N | Opens the saved game | Every (returning) | Does not say against whom |
| Learn the pieces | Starts lesson 1 (main on a first visit) | New | — |
| Play | Opens New game | Every | — |
| Workshop | Opens the Workshop | Rare | Same weight as Play |

### 1.2 Game screen: board and play

| Feature | What it does | How often | Pain |
|---|---|---|---|
| Painted board (tap, drag, keyboard cursor) | The game | Turn | — |
| Move marks, selection, last move, check | Shows legal moves and state | Turn | — |
| Header: "KING DOWN CHESS", turn line, status, "Loading pieces…" | Whose turn, check, thinking | Turn | Takes space; 9 text areas in all |
| Help line and moment caption | A tip, or a caption the first time a special move happens in the game | New, Some | Text jumps; the board moves |
| Hint | Marks one move that the computer likes | Some | Boxes only, no reason |
| Undo | Takes back to your last turn | Some | — |
| Resign | Ends the game (a browser box) | Rare | Next to Undo; a browser box |
| Cancel selection | Drops the selected piece | Rare | Not needed: a second tap does it |
| Finish chain | Ends a Beast chain | Some | — |
| Use power (button with count) and power status line | Arms a spent power; says the step | Some (powers games) | The full rule text shows all the time |
| End turn | Skips the second Haste move | Rare | — |
| Send the game link | Copies or shares the link in two-player games | Some | Shows on every turn of a one-device game too |
| Move list (LAN, for example `Ae3*c5`) | Each move is a button to review it | Some | Dominant; reads as code (the owner's words) |
| "White took", "Black took" | Taken pieces by name | Some | — |
| Menu tiles: New game, Guide, Workshop, Settings | Doors to other screens | Every (New game), Rare (others) | 7 tiles of equal weight |
| Review (← →, a tap on a move) | Shows an earlier position | Some | No touch buttons |
| Lesson strip, Next lesson, Return to game | Lesson mode inside the game screen | New | The full game panel shows in a lesson |

### 1.3 New game

| Feature | How often | Pain |
|---|---|---|
| Three mode cards: Play the computer, Kings' powers, Two players | Every | — |
| Level: Beginner, Casual, Club, Strong | Every | Club is the default; Club = Strong at 0.8 s |
| Kings' powers box (two players) | Some | — |
| Two king pickers: 6 emblems, 2 power pictures and No power each, a rule line | Some | 28 controls; Start is out of view |
| More options: You play White or Black | Some | — |
| More options: Army (14 entries: Random, Today's army, Chess, Custom…, codes, Catapult lab armies, Ogre practice) | Every (Random), Some (Today's), Lab (the rest) | Codes and lab armies in a player list |
| Cancel, Start game | Every | — |

### 1.4 Settings (one dialog, about 1100 px tall)

| Feature | How often |
|---|---|
| Sound | Rare |
| Always promote to queen | Rare |
| Show threats (red rings and dots) | Some |
| Animations: Normal, Fast, Off | Rare |
| Look: Painted 2D, Clay 3D | Lab |
| Piece letters, Coordinates | Rare |
| Thinking time (0.2 to 4 s) | Lab |
| Reset view (R) | Lab |
| This game: the army code, Copy moves | Lab, Rare |
| Account: sign in with Google or GitHub; signed in: name, picture, Sign out, Delete my account | Rare |

### 1.5 Guide, lessons, choices, result

| Feature | How often | Pain |
|---|---|---|
| Guide: Learn button, 12 piece cards, draw pool, notation key, the twelve powers | New, Some | 881 words; 4085 px on a phone |
| Six lessons (Archer, Guard, Maester, Beast, Ogre, Paladin) | New | Lesson 1 marks 8 squares; 24 taps to the first game |
| Capture or push? (Ogre) | Some | A paragraph, no picture |
| Promote the pawn; Sacrifice (which piece comes back) | Some | A centred dialog away from the square |
| Result: two kings, title, detail with army code, key moments (up to 3), Copy today's result, Rematch, New game, Close | Every | 29 words; the card hides the king's fall; no Rematch after Close |

### 1.6 Workshop (its own full-screen dialog)

| Feature | How often |
|---|---|
| Home: New piece, Surprise me, the shelf (up to 50 designs, this device) | Rare |
| New piece: 34 figures | Rare |
| Editor: card with figure, worth thermometer and band word; Moves and Takes boards; slide directions; up to 3 properties; Undo, Why this estimate?, Try it | Rare (but deep: a Workshop user uses all of it) |
| Share: Send link, Copy link, Copy as text, Make a copy, Delete | Rare |
| Try it: test board, Reset, Shuffle, +5 moves, "Pretend your opponent played a card" | Rare |

### 1.7 Hidden: keys, addresses, accessibility

| Feature | How often |
|---|---|
| Keys: Z (undo), R (reset view), Esc, ← → (review); board arrows, Enter, Space | Some |
| Screen-reader announcements of each move and of the cursor square | Some |
| Address switches: `rules`, `kings`, `look`, `labels`, `title`, `fen`, `army`, `moves`, `players`, `design`, `facebook` | Lab (a game link uses `army` and `moves`) |
| Browser boxes (`confirm`, `prompt`, `alert`) in player paths: 9 | — (the spec removes all) |
| Installable web app (manifest, icons) | Rare |

**Today in one line:** 7 tiles + up to 24 move buttons on the idle game screen; 9 text areas; 14 army entries; 14 Settings controls; 9 browser boxes. Source: [inventory §1](../../screens/sources/inventory.md).

## 2. The roadmap, and the UI each feature needs

Status words: **decided** (the owner said yes), **open** (an owner question), **lab** (built in the engine, not in the app), **idea** (written down, no decision).

### 2.1 Near

| Feature | Status | Source | The UI it needs |
|---|---|---|---|
| **Card mode in the game**: each side gets a hand of one-use cards (the deal of six; hands of 2, 3, 4 and 6 under test; at most 8 with draws). The cards: spendable king powers plus card-only cards (Rally, MorphP, MirrorB, Firewall, Control, Mimic, Vault, Curse, Sky Lift, Salvation, Burn, Earth Quake, Growth and more). One card a turn. | open (which six), then ready-for-agent | [TASKS.md](../../../../../TASKS.md) "Card deal", "Card mode in the game"; [MATRIX.md C.1–C.2](../../../../MATRIX.md); [RULES.md §5](../../../../RULES.md) | A hand area that does not cover the board; a card face (name, picture, one line); arm a card, then the board lights its targets (same pattern as a power); a used card leaves; the opponent's hand as a count only (hands are private, `snapshot()` hides them); a deal moment at the start; card names in the move story |
| **Legendary Rage**: dealt rarely, with "legendary graphic effects" | decided (look waits for the owner's yes) | [tasks archive 2026-10](../../../../tasks-archive/2026-10.md) line 111; MATRIX C.1 "Rarity" | A rarity treatment on the card and at the deal, cosmetic only. No art exists yet |
| **MirrorB** (play another card of your hand, which stays), **Growth** (draw from your pile) | decided (MirrorB in, Mirror and Rescue out) | tasks archive 2026-10 line 334 | A "copy" gesture between two cards; a pile with a count |
| **Turn countdown**: a power or card that waits until a move number shows a ring with the turns left | open (screenshots wait for approval) | branch `claude/turn-countdown` (83f442f); MATRIX C.1 `fromMove` | A ring with a digit on the power or card; "Rage in 4 turns" on the turn line; one announcement for screen readers |
| **Archer far2** (only the two-square shots) may replace today's shot set | open (when to merge) | TASKS.md "Archer reading" | Guide line, lesson, diagrams and hold-to-see reach must read the shot squares from the engine, not from text |
| **Piece icons on the figures** (Settings → Piece letters) | open | TASKS.md "Piece-letter icons" | A board option; the 12 SVG icons exist |
| **King with no power drawn as that king** | open | TASKS.md | The picker keeps the chosen king's art with "No power" |
| **Clay king effects** (six) | ready-for-agent | TASKS.md | Clay look only (Lab today) |
| **Death Touch trim** | open | TASKS.md | Only the rule line changes |
| **Workshop finish**: one reaction per edit, a short-landscape layout, checks | ready-for-agent | [workshop-finish spec](../../../workshop-finish/spec.md) | Already designed; the showcase must not undo it |
| **Web UX picks W1–W12** and 10 defects | picks made; build waits | [review.md](../../review.md) | The base for every direction |

### 2.2 Planned

| Feature | Status | Source | The UI it needs |
|---|---|---|---|
| **Piece unlocks with crowns**: start with Archer and Beast; a win against Casual or stronger earns a crown; Maester at 2, Ogre at 5, Guard at 9 crowns; the unlock shows the figure, then a one-minute lesson; a link game uses the union of both players' pieces; sandboxes and the daily board stay open | proposal; 4 owner decisions open | [PROGRESSION.md](../../../../PROGRESSION.md) | A crown count; the next piece as a silhouette; an unlock moment; a lesson offer; a note in New game on which pieces your random army draws; an export code for progress (no account in the proposal). Later tier: kings' powers, then cards |
| **Online play**: today a private ChatGPT plugin plays the computer, invites a friend and resumes a game on a server (seats, revisions, retries). Public online play, ratings and matchmaking are outside that task | private service live; public: not started | [match-foundation spec](../../../match-foundation/spec.md); [match-foundation.md](../../../../match-foundation.md); tasks archive 2026-09 "Phase 2" | Invite, seat and "your turn" states; waiting without a spinner; reconnect and stale-board recovery; a profile (name, picture; the database already holds a rating); result for both players |
| **Stronger computer**: power-aware network done (+89 / +68 Elo); next: move ordering, a faster network, an opening book, endgame tables, human-like skill levels; a powers-mode player | partly done; runs need the owner's go | TASKS.md "Powers-mode computer player"; tasks archive 2026-09 line 605 | A level picker that can grow; honest level names (not ratings); "thinking" shown on the opponent, not as a spinner |
| **Workshop sharing**: today a link and text. A design does not play in a game | built (link); more: idea | [WORKSHOP.md](../../../../WORKSHOP.md) | A share card with figure, name and worth; a received design opens read-only with "Keep a copy". (unsure) Whether designs may ever join a game |
| **More pieces**: Catapult, Reaver, Templar paused in the lab; Squire archived; four set aside. An idea: six kings, six armies, each army with one signature piece | lab / idea | [PIECES-PROPOSED.md](../../../../PIECES-PROPOSED.md); [MATRIX.md A.3](../../../../MATRIX.md) | Room in the lineup, Guide and lessons for more than 6 new pieces; per-king army identity |
| **Guard drop**: the Guard waits beside the board and drops on any empty square | lab rule to build; runs need a go | TASKS.md "Guard drop"; tasks archive 2026-10 line 346 | A reserve slot beside the board; a drop gesture; the same slot can hold Sacrifice and Salvation pieces |
| **Morph, Spawn and conditions** (a piece becomes another; new pawns appear; "not before move N"; zone rules on d4 e4 d5 e5) | lab; owner questions open | [MATRIX.md D](../../../../MATRIX.md); TASKS.md "Morph and the Guard" | A change-of-type moment on the square; a spawn moment; zone overlays; piece state badges (frozen, walled, waiting, changed) |

### 2.3 Ideas from the market review, not built

Source: [market-review-2026-09-27.md §4](../../../../research/market-review-2026-09-27.md). Built from it already: the game link (#2), today's army (#3), lessons (#4), key moments (#8), kings' powers (#9), animation speed (#10).

| Idea | The UI it needs |
|---|---|
| #5 King Down puzzles from the lab's games, and a timed streak mode | A puzzle screen; a "find the shot" task line; no streak guilt (brief rule) |
| #6 Opponents with faces (named computer characters) | A portrait picker; the 34 Workshop figures and 6 kings are real art |
| #7 Handicap ladder (stronger army for you at low ranks) | A ladder screen; the army balance shown in words |
| #10 Save a capture as a clip | A share action on a move in the story |
| A weekly board; a daily number | A small daily card on the title |

### 2.4 What every direction must leave room for

1. **A hand or tray** at the board edge (cards; later a reserve for the Guard drop, Sacrifice and Salvation).
2. **Badges on a piece**: frozen, walled, sheltered, waiting (countdown), changed (Morph), new (unlock).
3. **Two power kinds**: spent (button, count) and always on (no button, a passive mark).
4. **A collection**: the pieces (locked and open), the kings, later the cards.
5. **A second person**: a friend by link today; online later (presence, turn, result for both).
6. **Share objects**: the daily result, a Workshop design, later a clip.

## 3. The three earlier menu designs: the best ideas

Three designs of 2026-10-08 for menus, screens and journeys: the lead's [screens spec](../../screens/spec.md), outside report S and outside report A (both in the round-2 scratch folder; renders beside them).

### 3.1 Where all three agree (the foundation)

- The game screen at rest: the board, the player strips, Hint, Undo and one Menu. The Moves section is **closed by default** and shows only the last move.
- Resign moves into the Menu and asks in the app, not in a browser box. No browser boxes in player paths.
- An "Extra(s)" place for optional things; designer tools behind `?lab=1`. The army list shows only Random, Today's and Chess.
- Thinking time goes. Beginner for the first game. Strong thinks longer.
- One Menu at every size. Sheets on a phone, popovers or dialogs on a desktop; a sheet never opens over a sheet.
- Lessons on their own screen, five plus a Paladin bonus, with Play after any lesson.
- Choices (take or push, promotion, Sacrifice) as pictures. Result: board first, then the card; Rematch is main; up to 3 "Moves to look at again".
- Moves as plain words with piece icons and an event icon; notation only on request or in Copy moves.

### 3.2 The screens spec (lead, ticket 03): best ideas

- **4 controls** on the idle game screen at every size (Menu, Hint, Undo, the Moves line). Score table: base C (declutter) with grafts from A (new player) and B (chess player).
- **A context area of fixed height** for all text: piece cards, hints, steps, the resign question, link steps. The board never moves.
- **Story rows with one verb per piece** ("shoots", "bites 2 pieces", "shoves", "trades for") and **marker-shape icons** that match the board marks; "Your" and "Their".
- **"New pieces in your army"** before move 1 in the first 3 games: an icon for each, a tap rings those pieces.
- **Extras inside the Menu's container** (shared-axis slide), groups Board, Play, Moves, More; Sound stays in the Menu; no Settings screen.
- **The tap on a lineup figure** on the title opens its card with Try it.
- **Motion table** with a job and an end frame for each transition; the "2-second test" for the Moves line.
- **"More options · You play Black · Today's army"**: the folded label names what is not default.

### 3.3 Outside report S: best ideas

- **Desktop keeps 6 controls** (New game and Guide stay in view) for speed; phone has 4.
- **Settings stays** as a small sheet (Sound, Motion, Account) inside the Menu; Extra holds "Play another way" (Daily game, Workshop), "Board help" and "This game".
- **Extra from New game is contextual**: the same sheet serves the draft, with "For your next game" and "Back to New game".
- **Clear link-play copy**: "Send your turn", "Turn sent. Open your friend's reply link.", and the warning that Undo after a send needs a new link.
- **"Review last game"** on the title when the save is finished; Flip board for one device.
- **Haste rows as 8a and 8b**; a quiet "New move" link when the reader scrolls up; the result never blocks Rematch while key moments load.
- **Honest copy**: no promise of a live room, no "Club" or "Strong" as a rating; the daily Rematch is practice.

### 3.4 Outside report A: best ideas

- **Extra with five task rows**: Daily game, Workshop, Play aids, Copy moves, Account; and "Not in Extra": level, powers, side, Undo, Resign, because they belong to their task.
- **First-run lesson copy with a reward line**: "Take your first shot", then "A clean shot." and **Play Beginner** at once.
- **Same device: Flip board replaces Hint; by link: Send move replaces Hint** when your move is ready (the bar slot changes by mode, not by more buttons).
- **Daily copy that promises nothing false**: "The same army for this date on each device. Your level and powers still apply." No streak, no shared table.
- **Moves row with two lines**: the event in words on line 1, side and squares in soft ink on line 2.
- **A power spent stays readable** as a quiet state, not a dead button; "Freeze is ready" in words when armed.
- **Large text**: test at 200% text and 320 px width; let the page scroll rather than shrink type.

### 3.5 Where they differ (the open choices)

| Question | Screens spec | Report S | Report A |
|---|---|---|---|
| Name | Extras | Extra | Extra |
| Settings screen | gone (Sound in Menu, rest in Extras) | small Settings sheet in Menu | small Settings sheet in Menu |
| Desktop controls at rest | 4 | 6 (New game, Guide in view) | 4 (Hint, Undo, Menu) + Moves |
| Daily game | an army segment in More options | a row in Extra and an army choice | a row in Extra |
| Account | Extras › More | Menu › Settings › Account | Extra |
| Moves line | a sentence with no squares | "Last: Queen h6 to e6" (squares kept) | "Black: Queen to e6", squares on line 2 |
| Review controls | ◀ ▶ in the Moves header | Previous, Next in the action slot | its own controls in the action slot |
| Workshop door | title link and Extras | title link and Extra | title link and Extra |
| Resign question | in the context area | a short sheet | a short sheet |

None of the three uses the genre ideas of the brief (card-battler stage, reveals, collection, characters). They fix the structure; the showcase adds the mindset and the joy on top.
