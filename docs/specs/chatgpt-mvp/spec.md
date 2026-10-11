# ChatGPT plugin MVP

Status: ready-for-agent. The owner approved the spec on 2026-10-11: "i approve the spec".

Owner, 2026-10-11: "i'd like you to develop an MVP version of the game as a chatgpt plugin." "build the simplest version of each feature/option." "for this build, all of the cards and pieces and powers will be unlocked from the start."
Owner, 2026-10-11: another session ("Codex rules framework visualization review") changes the game; "these changes should apply to what you will be building ... fold/merge those changes."

The decisions below come from three rounds of questions on 2026-10-11 (Q1 to Q31). Each row gives the owner's answer. "Pick" means the agent's recommendation, which the owner accepted.

Sources: the explorer notes of 2026-10-11 (the live plugin, the multiplayer branch, the game setup, the rules session, the art, the ChatGPT host), the [multiplayer research](../../research/multiplayer-2026-10-10/README.md), the [plugin guide](../../plugin-preparation.md), [RULES.md](../../RULES.md), [MATRIX.md](../../MATRIX.md).

## Problem Statement

King Down has a private ChatGPT plugin. It plays one fixed army: the same back rank and the same two kings (Flame with Haste, Frost with Freeze) in every game. A player cannot choose pieces, cards, kings or powers. A friend game needs a raw 43-character token. There is no way to find a random opponent, no list of finished games, no score, no badges and no settings. The board takes 98% of its page size limit, so no new art fits.

## Solution

A King Down app inside ChatGPT where the game is the main feature:

- **Play** against the computer (four levels), a friend (a 6-character code) or a random player (a list of open games and a "Find an opponent" button).
- **Choose the game.** The player who starts the game (the initiator) sets five toggles: fairy pieces (with an "all" sub-menu of piece kinds), arrangement, classic chess, cards (with an "all" sub-menu of cards) and king powers. The player who joins (the joiner) picks their own king and power and arranges their own pieces, when those toggles are on.
- **Profile:** a games registry on a scroll, a rating, 10 badges, and a Collection page with every piece, king, power and card, all unlocked.
- **Settings:** a symbols-only piece look, and Show threats.

The app runs as one page. A chat request shows a small inline card. Setup, the board, the profile and the settings open in fullscreen. The player can also open King Down in the ChatGPT side panel or from the sidebar.

## Decisions

| # | Topic | Decision (owner's answer, 2026-10-11) |
|---|---|---|
| Q1 | Audience | Private testers only, through a custom connection. No public listing and no OpenAI review in this build. |
| Q2 | Website | ChatGPT only. The server keeps one account and one game pool, so kingdown.dev can join later. |
| Q3 | Pace | No clocks. Up to 3 days for each move; after that, the other player may claim the win. Before each side's first move, either player may abort with no result. No email or push alerts. |
| Q4 | Random opponent | "Find an opponent" shows the open games of other players, each with its features and **Accept**; one button takes the oldest. With no open game, it opens your game with your features. After 25 s it offers "Play the computer while you wait"; the open game stays. When a player joins: "Opponent found. Switch now?"; the computer game then ends with no result. An open game stays open for 24 hours, also after ChatGPT closes, and shows in Your games as "Waiting for an opponent". "N players online" shows only when N is 10 or more. (Research part 01, §3.2 and §3.4.) |
| Q5 | Colours | The initiator is White by default and may pick White, Black or Random. In a random-opponent game, the player who opened the game is the initiator. Against the computer, the player is the initiator. |
| Q6 | Joiner | When those toggles are on, the joiner picks a king and power and arranges their pieces. The joiner sees the features first and may decline. Both players press Ready. |
| Q7 | Toggle logic | Fairy on: the Arrangement toggle shows, on by default. The "all" sub-menu has one box for each piece kind: archer, paladin, guard, maester, beast, ogre, rook, bishop, knight, queen. The king and the pawns are always in. The pool keeps at least 7 pieces, so the last boxes lock. Fairy off and Classic off: the chess pieces in a random order, the same for both sides. Fairy off and Classic on: real chess (below). |
| Q7, Q30, Q31 | Classic chess | Classic means the most accepted rules of chess: the normal start position, castling, en passant, promotion to queen, rook, bishop or knight, and the usual draws. Real chess rules apply only when Classic is on; every other setup keeps the King Down rules (no castling, no en passant). In Classic with king powers or cards, castling and en passant stay on. En passant follows the normal pawn capture: a pawn that takes straight ahead (Darkness) or that moved two squares away from its start (March) gives or takes no en passant. |
| Q8 | Arrangement | Both players arrange the same 8 back-rank pieces (the 7 drawn pieces and the king) at the same time and hidden, until both press Ready. A Shuffle button gives a random legal order. Two setup rules hold: bishops on opposite colours, and the guard next to the king. The computer uses a random legal order. |
| Q9 | Kings and powers | Six kings, two powers each. Tap the coin: pick a king, then one of its two powers. Both players may pick the same king. With the toggle on, there is no "No power". Defaults: White Spirit with Mercy, Black Shadow with Darkness. The computer takes the default for its colour. With the toggle off: White shows the Spirit King and Black the Shadow King, with no powers. |
| Q19 | Cards and powers | With Cards on, the king picker offers only the powers that are always on: Holy Light, Mercy, Death Touch, Darkness and March. (The engine refuses a hand together with a power that has uses.) |
| Q20 | Cards in "all" | 21 cards: Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, March, Leap, Salvation, Mirror B, Firewall, Earth Quake, Burn, Fire Starter, Control, Rally, Morph P, Mimic, Vault, Curse, Sky Lift. Out: Rage, Mirror, Rescue, the lab cards and the Spawn cards. |
| Q20 | The deal | 4 cards, random from the checked cards, the same 4 for both players. The "all" sub-menu keeps at least 4 cards checked. |
| Q21 | Open cards | Both players see both hands. A played card is gone only for the player who played it. |
| Q22 | Card look | A simple face: the name, one line of rule, and the art where art exists (10 of the 21). |
| Q10 | Score | A Glicko-2 rating (start 1500, "?" while the rating deviation is 110 or more). Only games against people change it; every such game counts. |
| Q11 | Registry | One scroll: open games first (with a "your turn" mark; tap to resume), then finished games, each with the date, the opponent (a handle, or "Computer · Club"), your colour, the result and how the game ended, and icons for its features. Totals at the top: played, won, drawn, lost. No replay. |
| Q12 | Badges | First Win; Friend Match (finish a game with a friend); Stranger Match (finish a game with a random player); Purist (win Classic); Fairy Tale (win with fairy pieces); Architect (win with your own arrangement); Card Sharp (win a game with cards); Crowned (win with a king power); Royal Collection (win with all six kings); Giant Slayer (beat the Strong computer). |
| Q13, Q13b | Identity | A unique handle, picked at the first game against a person. A picture from 17 presets (six kings, eleven pieces). ChatGPT does not give apps the user's picture, and no provider photo is shown. No chat. No Report or Block button in this build (both come before a public release). |
| Q14 | Game actions | Resign, offer a draw, Rematch (the same features, colours swapped). No undo, no hints. |
| Q15 | Computer levels | Beginner, Casual, Club (default), Strong: the website's four levels. |
| Q16, Q29b | Settings | Symbols-only piece look; Show threats. |
| Q17 | Unlocks | A Collection page shows every piece, king, power and card with a one-line rule, all marked "unlocked". |
| Q18 | Look | The game's own design: the tokens, fonts and components of the web game (`src/style.css`, the web-redesign screens), with the painted pieces and board. OpenAI's style advice (system fonts, plain cards) does not set the look; the host rules stay only as limits (at most 2 actions in the inline card, room for the composer). The owner, on the first sample: "the GUI look doesn't seem like it is based on our design for the game." New art (scroll, king coins, badges) from Codex image_gen. The owner approves one rendered sample of the home, setup and profile screens before the visual build. The logic is built at the same time. |
| Q23 | Base | Build on `claude/multiplayer-foundation` (accounts, handles, invites, 3-day turns, game list, rating maths). The release ends the old plugin test games. |
| Q24 | Address | The plugin moves to `https://kingdown.dev/mcp` at this release. Testers add the new connection. |
| Q25, Q25b | Display | As OpenAI recommends: a small inline card in the chat (at most 2 actions); setup, board, profile and settings in fullscreen. No picture-in-picture (ChatGPT does not support it). Q25b (the owner delegated the choice, then agreed: "Q25b - agreed."): the page also declares a side-panel entry and a sidebar entry, which open the same fullscreen home. Only the chat path must work for the release; if the two entries do not show for the private plugin, the release goes without them. One layout serves fullscreen, the side panel and a phone. |
| Q26 | Defaults | A new game starts with Fairy on (all pieces), Arrangement on, Classic off, Cards off, King powers off. The setup screen then remembers the player's last choices. |
| Q27 | Setup time | In a game against a person, each player has 3 days to pick a king and arrange; a player who does not finish ends the game with no result. |
| Q28 | Friend invite | A 6-character code with a Copy button. The friend says "Join King Down game K7QX2M" in ChatGPT, or types it in Play → Join. The friend needs the plugin connection. |
| — | Agent decisions | Art loads from the plugin's own site, not inside the page. A move shows at once, before the server confirms it. In games against people, ChatGPT gets no position and no opponent name, only a short line such as "Your move, move 14". The look is painted only (clay is parked). No "Bring a design" in the plugin: plugin games keep `design` empty. |

## User Stories

Play menu and the computer
1. As a player, I want to say "play King Down" in ChatGPT and see a small card with Play and Your games, so that I can start in one tap.
2. As a player, I want the app to open in fullscreen when I tap Play, so that the board and the menus have room.
3. As a player, I want to open King Down from the ChatGPT side panel or sidebar, so that I can play beside a conversation.
4. As a player, I want to choose the computer, a friend or a random player, so that I can play the way I like.
5. As a player, I want to pick the computer's level (Beginner, Casual, Club, Strong), so that the game fits my skill.
6. As a player, I want the computer to reply on its own after my move, so that I need no extra button.
7. As a player, I want my move to show at once, so that the board does not feel slow.
8. As a player, I want to choose White, Black or Random, so that I can play either side.

Game features (toggles)
9. As an initiator, I want a Fairy pieces toggle that is on by default, so that the random army uses the King Down pieces.
10. As an initiator, I want an "all" button that opens a list of piece kinds with check boxes, the chess pieces included, so that I can leave pieces out of the draw.
11. As an initiator, I want the last boxes to lock when only 7 pieces remain in the pool, so that a draw is always possible.
12. As an initiator, I want an Arrangement toggle (shown with Fairy on, on by default), so that each player orders their own back rank from the same drawn pieces.
13. As an initiator, I want a Classic toggle in the same place when Fairy is off, so that I can play real chess with the normal start position, castling and en passant.
14. As an initiator, I want Fairy off and Classic off to give the chess pieces in a random order, so that I can play a Chess960-style game with King Down rules.
15. As an initiator, I want a Cards toggle, so that both players get the same 4 random cards.
16. As an initiator, I want an "all" button for cards, so that I can leave cards out of the deal, with at least 4 checked.
17. As an initiator, I want a King powers toggle, so that each king can carry a power.
18. As a player, I want the Spirit King for White and the Shadow King for Black when powers are off, so that the kings always look right.
19. As a player, I want to tap my king's coin and pick a king and then one of its two powers, so that I play the power I like.
20. As a player, I want the picker to offer only the always-on powers when Cards are on, so that I never start a game the engine refuses.
21. As a player, I want the setup screen to remember my last choices, so that a rematch-style next game needs no taps.
22. As a player, I want each toggle and sub-menu to say in one line what it does, so that I understand the choice.

Arrangement and the joiner
23. As a joiner, I want to see the game's features before I join, and to decline, so that I play only games I want.
24. As a joiner, I want to pick my own king and power when powers are on, so that the choice is mine, not the initiator's.
25. As a player, I want to arrange my back rank by tapping two pieces to swap them, so that I set my own start.
26. As a player, I want a Shuffle button for a random legal order, so that I can start fast.
27. As a player, I want the arrangement to refuse bishops on the same colour and a guard away from the king, with a clear message, so that the start stays legal.
28. As a player, I want my arrangement hidden from my opponent until both press Ready, so that neither side can react to the other.
29. As a player, I want 3 days for the setup step, after which the game ends with no result, so that a game cannot hang forever.

Friends and random players
30. As an initiator, I want a 6-character code with a Copy button, so that I can send it to a friend in any messenger.
31. As a friend, I want to say "Join King Down game K7QX2M" or type the code in Play → Join, so that I can join the game.
32. As a player, I want a list of open games of other players, each with its features and Accept, so that I can choose a game I like.
33. As a player, I want a Find an opponent button that takes the oldest open game, or opens mine when there is none, so that I get a game with one tap.
34. As a waiting player, I want to play the computer after 25 seconds while my open game stays, so that waiting is not boring.
35. As a waiting player, I want "Opponent found. Switch now?" when someone joins, so that I can move to the real game.
36. As a waiting player, I want my open game to stay open for 24 hours, also after I close ChatGPT, so that someone can join later.
37. As a player, I want to pick a unique handle and a preset picture at my first game against a person, so that my opponent sees who I am without my real name or photo.

In the game
38. As a player, I want to see the cards of both hands, which ones are spent, and a coin for my king's power, so that I know what each side can still do.
39. As a player, I want to play a card from my hand on my turn, so that I can use its effect.
40. As a player, I want to resign, so that I can end a lost game.
41. As a player, I want to offer a draw, and to accept or decline my opponent's offer, so that a level game can end.
42. As a player, I want to abort before each side's first move, with no result, so that a mistaken game leaves no trace on my record.
43. As a player, I want to claim the win when my opponent misses the 3-day limit, so that a game cannot stall.
44. As a player, I want a Rematch with the same features and the colours swapped, so that each side plays both colours.
45. As a player, I want the board to update on its own while I wait for my opponent's move, so that I do not need to reload.
46. As a player, I want the owner's move legend and the rules session's board marks, so that the board looks the same as on the website.
47. As a player in classic chess, I want castling and en passant, so that it plays like the chess I know.

Profile, collection and settings
48. As a player, I want a scroll with my open and finished games, so that I can see my record and resume a game.
49. As a player, I want totals (played, won, drawn, lost) at the top of the scroll, so that I see my record at a glance.
50. As a player, I want a rating that only games against people change, with "?" while it is new, so that I know my strength.
51. As a player, I want 10 badges that I earn by playing, so that I have goals.
52. As a player, I want a Collection page with every piece, king, power and card and its rule, all unlocked, so that I can learn the game.
53. As a player, I want a symbols-only piece look, so that I can read the board fast.
54. As a player, I want Show threats, so that I see which of my pieces the opponent can take.
55. As a player, I want my settings and my record on any device and in any chat, so that nothing is lost.

ChatGPT and privacy
56. As a player, I want ChatGPT to know only short summaries (whose turn, my score), so that it cannot act as an engine helper in a game against a person.
57. As a player, I want to ask ChatGPT "is it my turn in King Down?", so that I can check without opening the app.
58. As the owner, I want old saved games to keep their engine, so that a release does not break open games.
59. As the owner, I want the plugin at `kingdown.dev/mcp`, so that the address never changes after an OpenAI review.

## Implementation Decisions

### Architecture
- One write path: the game service of the multiplayer branch (one transaction for each command, retries that apply once, revisions). The ChatGPT tools call it; the website API stays unused in this build.
- Game states: `waiting` (for an opponent) → `setup` (the seat choices; new) → `playing` → `finished` or `aborted`. A game with no seat choice to make skips `setup`. A computer seat chooses at once.
- The engine match starts only when both seats are ready, from one built setup. The setup is fixed from then on.

### Modules
- **Game setup (new, pure, deep).** Input: the initiator's options. It validates the options (pool of at least 7 pieces, no king or pawn in the pool, at most one guard and one beast; at least 4 cards; Classic only with Fairy off; the cards-and-powers rule), draws the army (7 pieces from the pool, the same for both sides, through the engine's random back rank) and deals the cards (4 from the card pool, the same for both). It says which seat choices a game needs, validates a seat choice (the same 8 letters, one king, bishops on opposite colours, guard next to the king; a king's own power; only always-on powers with cards), makes a default seat choice (defaults, or a random legal order for the computer), and builds the engine setup from the options, the draw and both choices: a back rank (same order) or a FEN (different orders), the kings string, the rule flags (Classic, the hands).
- **Engine: classic chess.** A rule flag, off by default, adds castling and en passant, with castling rights and the en-passant square in the FEN, the position hash and the repetition test. Only Classic sets it. With the flag off, every existing test and perft number stays the same.
- **Match worker.** It accepts a public mirror card deal (the same hand for both sides), the classic flag and the computer level, and keeps the hands in the snapshot. It still refuses private hands and piles.
- **Computer levels.** The server's computer move takes the website's four skill settings (time cap, temperature, random-move chance), within the 30-second function limit.
- **Game service.** `create` takes the options and the colour (default White for the initiator); `join` and `accept` move a game to `setup`; a new `choose` command takes one seat's choice and `ready`; when both seats are ready, the service builds the engine match. A setup deadline of 3 days ends the game with no result. A `rematch` command offers a new game with the same options and swapped colours; the opponent accepts or declines.
- **Matchmaking.** An open game of the kind `random` is listed for everyone except its creator and blocked players, with its features and the creator's handle and picture. `accept` takes the seat under a row lock (one winner). `find` accepts the oldest or creates one. An open game expires after 24 hours. The creator can cancel it.
- **Results.** At the end of a game the service writes the result and, for games between people, updates both ratings (Glicko-2 module of the branch; a new ratings table) in the same transaction. A history query gives finished games, newest first, with totals.
- **Badges.** A fixed list of 10. A pure function reads a finished game and the player's earlier record and returns the badges earned; the service writes each badge once.
- **Profile and settings.** Handle and preset picture (the branch's rules and 17 icons). Settings (symbols-only look, Show threats, the last setup choices) are stored on the server for each account.
- **ChatGPT tool surface.** Only `kingdown_open` carries the app page. It takes an optional screen (`home`, `play`, `board`, `profile`) and game. All board actions are app-only tools. Model tools give short summaries; the position, the legal moves, the opponent's handle and picture go in `_meta`. The page declares the side-panel and sidebar entries. The page's CSP allows images from the plugin's own origin.
- **App page.** One page with a router: an inline home card; fullscreen screens for play, setup (with the two "all" sheets and the king-coin sheet), the lobby, the seat setup, the board, the end card, the profile scroll, the collection and the settings. Widget state holds only the screen, the open sheet, the board ID and a pending command. One layout fits 360 px to desktop width and keeps the main controls away from the ChatGPT composer.
- **Art.** The board art and the new art load as hashed files from the plugin's origin. The page stays far under the 4.4 MB limit. New art: scroll, king-coin frame, 10 badges, toggle icons; made with Codex image_gen; masters and prompts in `art-src/`.
- **Rules-session changes.** The plugin board shares the website's board drawing, so the move legend (merged) and the game-marks branch (gold glow, rails, threat arrows) arrive with each merge of main. Show threats fills the board's threat marks from the shared threat list. Clay stays out.

### Schema changes (new migration after 0009)
- `games`: kind `random`; status `setup`; columns for the options, the draw, the deal and the level; the setup deadline.
- `game_players`: the seat's choice (king, power, order) and a ready mark; the choice stays hidden from the other seat until both are ready.
- New tables: player ratings and rating history; badges earned; player settings.
- Runtime role grants for each new column and table.

### API contract (tools, all app-only unless noted)
- `kingdown_open` (model + app): opens the app page.
- `kingdown_create` (model + app): options, colour, level, kind (`solo`, `friend`, `random`).
- `kingdown_lobby`: the open games; `kingdown_accept`; `kingdown_find`; `kingdown_cancel`.
- `kingdown_join` (model + app): a code.
- `kingdown_choose`: one seat's king, power, order and ready.
- `kingdown_get`, `kingdown_move`, `kingdown_computer`, `kingdown_draw`, `kingdown_resign`, `kingdown_abort`, `kingdown_claim`, `kingdown_rematch`.
- `kingdown_games` (model + app, read only; the app lists open games in Play and on the profile scroll, full rows in `_meta.games` only; changed from model only by the orchestrator, 2026-10-11, ticket 10); `kingdown_profile` (model + app, read only: handle, picture, rating, totals, badges, history page).
- `kingdown_handle`: set the handle and the picture. `kingdown_settings`: read and write the settings.
- `kingdown_say` and `kingdown_report` stay on the server but have no control in this build.

## Testing Decisions

- A good test checks what a player or a tool caller sees, not how the code does it.
- **Seam 1, the tool surface** (main seam): an in-memory MCP client calls the real tools against the real game service and a disposable PostgreSQL test database, as the branch's `server.db.test.ts` and `plugin:check:protocol` do. It covers create with each toggle mix, join, accept, find, the setup step, the game, the end, the rating, the badges, the history, the settings, hidden data and retries.
- **Seam 2, the game setup module**: pure unit tests (pool limits, the draw is the same for both sides, the deal, arrangement checks, default choices, the cards-and-powers rule, the built engine setup).
- **Seam 3, the engine**: the classic flag passes the standard chess perft numbers (start position and the usual test positions with castling and en passant); with the flag off, every perft number stays the same.
- **Seam 4, the app page**: the existing browser harness (`plugin-ui`, `plugin-ui-http`) with new screen flows, at 390 × 844 and 1440 × 900.
- Prior art: `src/match/*.test.ts`, `src/plugin/server.db.test.ts`, `tools/plugin-protocol-check.ts`, `tools/plugin-ui-check.mjs`, `src/rules/rules.test.ts` (perft).
- Every ticket runs `npm test`; tickets that change the page also run the two browser checks and record the page size.

## Out of Scope

- The website: no online mode, no join page, no profile page on kingdown.dev.
- Email and push alerts; live games with clocks; presence.
- Preset messages, Report and Block controls (the server keeps them); the safety records, the NCA registration and the lawyer's check (before any public release).
- Public submission to OpenAI (demo account, test cases, video, privacy and terms pages).
- Unlocking by crowns or badges; leaderboards; seasons; rating bands.
- Card rarity; the engine change for cards with powers that have uses; full art for every card.
- Proving Ground designs in plugin games.
- Game replay; hints; undo.

## Further Notes

- **Release.** Every deploy publishes to the world and needs the owner's word. The release follows the branch's order (`supabase/README.md`), plus the move to `kingdown.dev/mcp`. Before it, the owner checks two Supabase settings: sessions signed with an asymmetric key, and a trigger allowed on `auth.sessions`. The release ends the old plugin test games.
- **Fold-in.** Merge `origin/main` into the integration branch after each merge of the rules session (`claude/game-marks`, `claude/park-clay`), run the checks, and add an engine bundle when the engine changes.
- **Page size.** Ticket 01 measured 4,348,027 bytes, against the 4,350,000 ask line. The art move (ticket 09) comes before any page growth.
