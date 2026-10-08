# King Down: the fact sheet for demo builders

Date: 2026-10-08. Research track: King Down itself. Read with [inventory-roadmap.md](inventory-roadmap.md).

Use this sheet when a demo shows a rule, a mode or a number. Each fact names its source. The sources are the code and the rules of `main` at commit 6d65af1. **(unsure)** marks a fact that the code does not show clearly. Do not quote an (unsure) fact as true.

Links go from this folder to the repository root: `../../../../RULES.md` is `docs/RULES.md`.

## 1. The game in five facts

- Chess on 8 × 8. Mate the king to win. No castling. No en passant. A pawn promotes to a queen, rook, bishop or knight only. Source: [RULES.md §1, §6.13](../../../../RULES.md).
- Draws: stalemate, the same position three times, 50 moves with no capture and no pawn move, and too little material to mate. Source: [RULES.md §1](../../../../RULES.md).
- Each army has 8 pawns, a king and 7 pieces drawn at random from `Q O R R B B N N A A G M M S`. **Both armies get the same back rank, in the same order.** Two bishops start on opposite colours. At most one Beast and one Guard in an army. Source: [RULES.md §2, §6.11, "One beast per army"](../../../../RULES.md).
- A back rank has a code of 8 letters, for example `RSAKGQOB`. Letters: A Archer, L Paladin, G Guard, M Maester, S Beast, O Ogre. Source: [RULES.md §2–§3](../../../../RULES.md).
- Card-game names exist for the chess pieces (Pike = pawn, Steed = knight, Cross = bishop, Rock = rook, Thorn = queen). The app does not use them. Source: [RULES.md §3](../../../../RULES.md).

## 2. The six new pieces

One sentence each, on how it moves and its special ability. The short line is safe to put on a card (12 words or fewer). The verb is the one verb that the spec gives each piece (screens spec §5.4, decision W17).

| Piece | One plain sentence (official rule) | Short line for a card | Verb |
|---|---|---|---|
| **Archer** (A) | The Archer steps one square in any direction, never takes by moving, and instead shoots an enemy without moving: on a diagonal neighbour square, two squares away in a straight line, or two squares away on a forward diagonal, even over other pieces. | "Shoots without moving, even over other pieces." | moves, **shoots** |
| **Guard** (G) | The Guard steps one square in any direction onto an empty square, never takes, and only a king can take it. | "Only a king can take it. It never takes." | moves |
| **Maester** (M) | The Maester steps one square in any direction and takes an enemy next to it; it can swap places with a friend next to it, and when it and its king both stand on their first rank they can swap from any distance. | "Swaps places with a friend next to it." | steps, takes, **swaps** |
| **Beast** (S) | The Beast steps one square in any direction onto an empty square, takes any enemy next to it, and after each take may take again from its new square in the same turn. | "After each bite, it can bite again." | moves, **bites** |
| **Ogre** (O) | The Ogre steps and takes one square in any direction; instead, it can push a neighbour (friend or enemy, never a king) one square straight away onto an empty square and step into the space. | "Shoves a neighbour and steps into its place." | moves, takes, **shoves** |
| **Paladin** (L) | The Paladin moves like a queen and jumps over its own pieces (an enemy stops it); it can never take a king, and it leaves the board after it takes anything but a pawn. | "Jumps its own pieces. Taking more than a pawn costs it." | moves, takes, **trades for** |

Details that a demo must get right:

- **Archer.** She has 10 shot squares: 4 diagonal neighbours, 4 squares two away in a straight line (forward, back, left, right), and the 2 forward squares two away on a diagonal (forward is toward the enemy, so Black's squares are mirrored). An enemy straight beside her is safe from her. Her shot gives check the same way. Source: `archerShotsFor` and `case A` in [engine.ts](../../../../../src/rules/engine.ts); [RULES.md §3, §6.16](../../../../RULES.md).
- **Guard.** It blocks lines like any piece. A Beast, an Ogre or a Paladin cannot take it either. An Ogre can push it. Source: `canCapture` in engine.ts; [RULES.md §3](../../../../RULES.md).
- **Maester.** It can swap with its own king when the two stand next to each other. The far swap needs both on the first rank. A swap that leaves the king in check is illegal. Players use the far swap about once a game, as a stand-in for castling. Source: `case M` in engine.ts; [RULES.md §6.7 and "First measured evidence"](../../../../RULES.md).
- **Beast.** A chain never takes a king after the first bite. The player ends a chain with "Finish chain" today ("Stop here" in the spec). Source: [lessons.ts](../../../../../src/lessons.ts), [index.html](../../../../../index.html) `#stop-chain`.
- **Ogre.** The push works in all 8 directions. When a neighbour can be taken or pushed, the game asks "Capture or push?". Source: `case O` in engine.ts; `#move-choice` in index.html.
- **Paladin.** It is **not in the random army** since 2026-09-24 (the Ogre took its place). It stays in custom armies, its lesson and the title lineup. Source: [RULES.md §6.18](../../../../RULES.md).

The computer's worth of each piece, in pawns (a pawn is 1): Archer 5.05, Beast 4.34, Paladin 4.08, Maester 3.18, Ogre 3.18, Guard 0.96 (low, because it never takes). Knight 3.16, Bishop 3.22, Rook 4.49, Queen 9.33. Source: `src/ai/eval.ts`. These are engine numbers, not rules. Do not show them as official values.

## 3. The six kings and their powers

Kings' powers is a mode. Each player picks one king, then one of its two powers, or "No power". With no power, White shows the Spirit king and Black the Shadow king. Each king has a colour. These are the official (balanced) readings that the game plays. Source: [RULES.md §4, §6.6](../../../../RULES.md); `KINGS`, `POWERS_BALANCED` in [rules.ts](../../../../../src/rules/rules.ts); `powerText` in [powers-ui.ts](../../../../../src/powers-ui.ts).

| King | Colour | Power | Uses | One plain sentence |
|---|---|---|---|---|
| **Frost** | blue | Freeze | 1 a game | Freeze an enemy piece (not the king), then make your move: that piece cannot move on its next turn. |
| | | Ice Wall | 2 a game | Wall one of your pieces (not the king), then make your move: nothing can take it on the next turn. |
| **Flame** | red | Strike | 1 a game | Move one of your pieces (not a pawn or the king) like a queen, to an empty square. |
| | | Haste | 1 a game | Move one piece twice in one turn; neither move takes, and the second move is optional. |
| **Stratus** | purple | Flight | 1 a game | Move any piece except the king to any empty square in your half of the board. |
| | | Sacrifice | 1 a game | Turn one of your pawns into one of your pieces that the enemy took earlier (not a pawn or a guard). |
| **Mud** | green | March | always on | Any pawn may step two squares from any rank. |
| | | Leap | 3 a game | A rook, bishop or queen passes over your own pawns. |
| **Spirit** | white | Holy Light | always on | Enemy pawns cannot take your king, your king may take pawns, and nothing can take your pieces beside, in front of or behind your king. |
| | | Mercy | always on | Your king steps one or two squares and jumps your own pieces but takes only a pawn or a guard, and only pawns can take your pieces next to it. |
| **Shadow** | black | Death Touch | always on | Your king takes without moving: an enemy next to it, or two squares away in a straight line over an empty square; it can take only this way. |
| | | Darkness | always on | Your pawns may also step diagonally forward but take only straight ahead, and your king may also step two squares in a straight line over an empty square. |

Facts for the power UI:

- Two kinds of power. **Spent** powers (Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, Leap) have a count and a "Use" button. **Always-on** powers (March, Holy Light, Mercy, Death Touch, Darkness) have no button. Source: `usesAllowed`, `needsArming` in powers-ui.ts.
- Freeze and Ice Wall are **free actions**: mark, then make the turn's move. Haste can leave the same player to move again ("End turn"). Source: `POWERS_BALANCED.markFree` in rules.ts; `#end-haste` in index.html.
- March and Leap moves simply show among a piece's moves. The other spent powers need the player to arm them first. Source: `ARMED` in powers-ui.ts.
- No power ever takes a king. No power changes how other pieces move. Source: [RULES.md §4](../../../../RULES.md); AGENTS.md "Game design".
- The engine's tag for Ice Wall is `ward`. Players see "Ice Wall". Source: `POWER_TAG` in powers-ui.ts.
- A balance test puts all twelve powers within 42–57% against each other. Death Touch now measures 55.1% and is an open owner question. Source: [RULES.md §4](../../../../RULES.md); TASKS.md.

## 4. Game modes and armies

Source: [index.html](../../../../../index.html) `#new-game`; [new-game.ts](../../../../../src/new-game.ts); `main.ts` lines 1270–1290.

| Mode (New game) | What it is |
|---|---|
| **Play the computer** | You against the computer, with no powers. You pick a level. |
| **Kings' powers** | Against the computer. Each side picks a king and a power (or No power). |
| **Two players** | One device (hot seat), or by link: after each move, send a link that holds the whole game. A box turns on Kings' powers. |

- **More options** (folded): You play White or Black; Army: Random King Down army, Today's army, Chess starting army, Custom army… (a browser prompt for 8 letters), example armies (codes such as `SQBKRSML`, and Catapult lab armies), Ogre practice (two players, two Ogres and a pawn).
- **Game link.** The link holds the army and every move, for example `?army=RNBQKBNR&moves=e2-e4_e7-e5`. No server. Either player can edit a link or use Undo. Source: [tasks archive 2026-09](../../../../tasks-archive/2026-09.md) "Play a friend by link".
- **Older rule sets** by address only: `?rules=2017` (the 2017 rulebook) and `?rules=2021`. Source: [RULES.md §6.8](../../../../RULES.md).
- **(unsure)** Three example armies (`MMSSNBNK`, `KGBMSSMB`, `SQBKRSML`) hold two Beasts, against the one-Beast rule. They are lab armies.

## 5. Computer levels

Source: [src/ai/skill.ts](../../../../../src/ai/skill.ts); review W1 in [review.md](../../review.md).

| Level | How it plays |
|---|---|
| Beginner | Thinks up to 0.7 s, picks from a wide band of moves, and plays a random legal move 10% of the time. |
| Casual | Thinks up to 0.8 s, a narrower band, a random move 4% of the time. |
| Club | Thinks up to 0.8 s; varies only in the first moves; no random moves. |
| Strong | Like Club, but uses the full Thinking time in Settings (0.2 to 4 s; default 0.8 s). |

- At the default 0.8 s, Club and Strong play the same. Pick W1 B fixes Strong at 2.5 s and starts a new player on Beginner. Source: review.md W1.
- The New game sheet starts on Club today. These are not ratings. The computer uses a trained evaluation network. Source: `defaultSetup` in new-game.ts; `main.ts` line 59.

## 6. The daily game ("Today's army")

- It is an army choice inside More options, not a mode. Every player gets the same random army on the same local date (the seed is the date, YYYYMMDD). Your level, side and powers still apply. Source: `main.ts` line 1279.
- At the end, **Copy today's result** copies one line, for example "King Down daily 2026-09-27 (MBGSORKM): won in 23 moves against the club computer." and the page link. Source: `main.ts` line 1302.
- No one-try limit, no streak, no daily number, no shared table of results. A Rematch replays the same army. Source: [tasks archive 2026-09](../../../../tasks-archive/2026-09.md) "Lessons" limits.
- Owner pick (proposal, not built): the daily board draws from the full pool, also when unlocks exist. Source: [PROGRESSION.md](../../../../PROGRESSION.md) decision 4.

## 7. Lessons

- Six one-move lessons, one per new piece, in this order: Archer, Guard, Maester, Beast, Ogre, Paladin. Each is a tiny position, White to move. Source: [lessons.ts](../../../../../src/lessons.ts).

| Lesson | Task (today's words, shortened) | The rule after success (shortened) |
|---|---|---|
| Archer | Tap your archer, then the marked enemy pawn. | She shoots from where she stands, also over other pieces. |
| Guard | The rook gives check. Block it with your guard. | Only a king can capture a guard. A guard never captures. |
| Maester | Tap your maester, then your own knight. | A maester swaps with a friendly neighbour, and captures an adjacent enemy. |
| Beast | Take the knight on d5, then the knight on d6. | After each bite the beast may bite again. A chain never continues onto a king. |
| Ogre | Tap your ogre, then the enemy knight, and choose Push. | The ogre shoves a neighbour one square away and steps into its place. |
| Paladin | Take the pawn on d6. | Taking a pawn is safe. Taking any other piece also removes the paladin. |

- Doors: "Learn the pieces" on the title, and the top button of the Guide. A wrong move goes back with "Not quite." and the task again. A lesson never replaces the saved game. Progress syncs with an account. Source: `main.ts`; [sync.ts](../../../../../src/account/sync.ts) `SECTIONS`.
- No lessons for the chess pieces or the kings' powers. Approved change (W4 B): a lesson-only screen, five lessons, the Paladin as a bonus. Source: review.md W4.

## 8. The Workshop

Source: [WORKSHOP.md](../../../../WORKSHOP.md).

- **What it does.** A player makes a piece: moves and takes on two 7 × 7 boards, up to 8 slide directions, up to 3 properties (10 rules in 6 groups, each with a "When"), a name (up to 18 characters) and one of 34 painted figures in ivory or charcoal.
- **The judge** gives an estimated worth in pawns with an error band and a word: Fair (2.5 to 5 pawns), Strong?, Weak? or Standard. "Why this estimate?" gives reasons and up to two fixes.
- **Try it**: an 8 × 8 test board with six black pieces that never move. It is not a game. **A design does not play in a real game.**
- **Share**: a link (`?design=<code>`), Copy link, Copy as text, Make a copy, Delete. A design from a link is read-only until you keep a copy. Designs stay on the device (up to 50); they do not sync with an account.
- **Surprise me** makes a random fair variant of one of the 11 pool pieces.
- **Motion**: each edit plays one short reaction on the figure (a gait, a shake when overpowered, a gold ring), 560 ms at most.

## 9. Accounts

Source: [account.ts](../../../../../src/account/account.ts), [sync.ts](../../../../../src/account/sync.ts), `supabase/migrations/0001_accounts.sql`.

- Sign in with Google or GitHub (Facebook only with `?facebook=1`). The account is optional: the game plays the same without it.
- It keeps three things: settings, lesson progress and the saved game. Not Workshop designs.
- The game gets the name, picture, email address and an account number. Other players never see the email.
- Sign out, and Delete my account (with a question). Privacy and Terms pages.
- **(unsure)** The database keeps a rating (1200 at the start) that only a server may change. The web game does not show it, and no web feature uses it yet.

## 10. Other features of today

Hint (one move that the computer likes) · Undo (back to your last turn) · Resign · move list with review (each move opens the board after it; ← and →) · key moments after a game (up to 3 moves that lost 2 pawns or more, or missed or allowed a mate, with the better move) · a one-line caption the first time each special move happens in a game · Show threats · Animations Normal, Fast, Off (a tap skips) · synthesized sounds (a bowstring for a shot, a scrape for a shove, two snaps for a bite) · Painted 2D and Clay 3D looks · piece letters, coordinates · keyboard play and screen-reader move announcements · an installable web app (manifest). Source: [index.html](../../../../../index.html); [moment.ts](../../../../../src/moment.ts); [tasks archive 2026-09](../../../../tasks-archive/2026-09.md).

**Art in `public/ui/`:** 11 piece figures × 2 armies (no king in `pieces/`), 6 kings × 2 armies, 6 emblems, 12 piece icons (SVG), 34 Workshop figures × 2, `stone-board.webp`. No art exists for cards, crowns or the lab pieces (a "Wooden Catapult" Workshop figure exists).

## 11. Built in the lab, not in the game

Card mode (hands of one-use cards), the Catapult, Reaver and Templar, the Guard reserve, other Archer readings, capital rules. A demo may show them only as "coming" or "idea". Source: [MATRIX.md](../../../../MATRIX.md) A.3, C.2. Details and the UI they need: [inventory-roadmap.md](inventory-roadmap.md) §2.

## 12. Words to use

- "Take", not "capture", in player text (the spec). Use the verbs of §2. "Your" and "Their" against the computer; "White's" and "Black's" on one device.
- "Kings' powers", "Today's army", "Workshop", "Guide", "Hint", "Undo", "Rematch": these are the names in the app today.
- Do not say "rating", "Elo", "streak" or "rank": the app has none of these for the player.

---

## 13. Outside findings (for the design moves below)

1. **Into the Breach shows every enemy attack before it happens.** The tile and the damage show during your turn, so each loss is your own choice. Source: [Game Developer, Road to the IGF](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-); [GameSpot review](https://gamespot.com/reviews/into-the-breach-review-a-mechanized-masterpiece/1900-6416865/).
2. **Marvel Snap reveals its board in steps.** The three locations are hidden; one reveals at the start of each of the first three turns. Source: [outof.games, How to play Marvel Snap](https://outof.games/realms/marvel-snap/guides/255-how-to-play-marvel-snap/).
3. **Marvel Snap teaches by the order of unlocks.** New players get cards of one kind first (for example "ongoing"), then a card that combines them. Source: [mobilegamer.biz](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/).
4. **Hearthstone's history bar** shows the last 7 to 10 actions as small tiles beside the board, newest on top, yours with a blue border and the opponent's with a red border. A hover shows the detail. Source: [Hearthstone wiki, History](https://hearthstone.wiki.gg/wiki/History).
5. **Hearthstone's hero power** is a button beside the hero portrait. After use it flips to a grey face; it flips back at the start of your turn. Source: [Hearthstone wiki, Hero Power](https://hearthstone.wiki.gg/wiki/Hero_Power).
6. **Wordle's share grid** tells how you did without the answer. The creator kept it minimal on purpose; the mystery made people ask. Source: [Boston.com](https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/); [The Spinoff](https://thespinoff.co.nz/media/13-01-2022/those-coloured-boxes-on-twitter-are-new-zealands-fault).
7. **Duolingo's single path** made the next step clear for new learners, but players who chose their own practice disliked the lost freedom. Source: [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design/); [UX Collective critique](https://uxdesign.cc/down-the-wrong-path-the-disaster-of-the-latest-duolingo-ui-update-a4cdd1e6ea1c).
8. **Clash Royale gives new cards by arena**, so a player meets a few cards at a time. Source: [Sportskeeda, arenas and cards](https://www.sportskeeda.com/esports/all-arenas-in-clash-royale-what-new-cards-unlock).
9. **Lara Croft GO** is a turn-based "elegant board game": dangers stay in view, and enemies have few, clear behaviours. Source: [Wikipedia](https://en.wikipedia.org/wiki/Lara_Croft_Go).

## 14. For King Down: 14 design moves

Each move fits a King Down fact above. "Sees" is what the player sees; "When" and "How long" are the timing. Most of them add nothing to the screen at rest.

1. **Hidden reach, shown on touch.** *Borrows:* Into the Breach (finding 1). *Why King Down:* Archer shots pass over pieces and Death Touch takes from two squares, so a chess player cannot see these threats. *Sees:* while a finger holds (or the mouse rests on) an enemy piece, its take squares show as small crosshairs; an Archer's 10 shot squares show even behind pieces. *When:* on hold only. *How long:* while held; the marks fade in 120 ms.
2. **The rule tells itself at the refusal.** *Borrows:* Into the Breach and Lara Croft GO (findings 1, 9): no hidden rule. *Why:* a Guard cannot be taken, a frozen piece cannot move, a Paladin cannot take a king. *Sees:* a tap that the rules refuse plays a 300 ms glint on the cause (a shield on the Guard, ice on the frozen piece) and one line, "Only a king can take a guard." *When:* at each refused tap. *How long:* the line stays until the next tap.
3. **The army musters, and the new pieces say hello.** *Borrows:* Marvel Snap's reveal in steps (finding 2). *Why:* each game draws a new army, the same for both sides, so the cast changes every game. *Sees:* the back ranks rise file by file, then a name chip shows under each new-piece type in play. *When:* at the start of a game, for a player's first 3 games. *How long:* 750 ms muster; the chips stay 2 s, or until the first tap.
4. **The power is a coin by the king.** *Borrows:* Hearthstone's hero power (finding 5). *Why:* seven powers are spent and have counts; five are always on. *Sees:* a spent-type power is a round emblem coin beside your king's portrait with one notch for each use; a use flips it to grey stone with the count. An always-on power has no coin: a faint aura on the king, and a tap on the king shows its line. *When:* in Kings' powers games. *How long:* the flip is 300 ms.
5. **Shelter you can see.** *Borrows:* Into the Breach (finding 1). *Why:* Holy Light and Mercy protect the pieces next to the king; Ice Wall protects one piece. *Sees:* a thin halo on each protected piece, only while the opponent holds a piece that could take it, or while you hold a piece that wants to. *When:* on hold. *How long:* while held.
6. **A two-beat turn shows its second beat.** *Borrows:* the action pips of tactics games (finding 1). *Why:* Freeze and Ice Wall are a mark plus a move; Haste and a Beast chain give a second action. *Sees:* two small pips in your strip; the first fills after the mark or the first move, with "Now make your move" or "Bite again, or stop here". *When:* only in such a turn. *How long:* until the turn ends.
7. **Moves as a history strip.** *Borrows:* Hearthstone's history bar (finding 4). *Why:* the owner wants the move list less dominant, and King Down moves are events (shots, bites, shoves). *Sees:* closed, the last 5 moves as small tiles (piece icon plus event mark, gold edge for you, ink edge for them); a tap on a tile shows that board as a ghost; a tap on the strip opens the story list. *When:* always, at the edge of the board. *How long:* a new tile slides in over 200 ms.
8. **Tricks found.** *Borrows:* the silhouettes of a collection book and Marvel Snap's teaching by order (finding 3). *Why:* King Down has tricks that players seldom find: the far Maester–king swap, a Beast chain, an Ogre that pushes a Guard, a shot over a piece, a Paladin trade, Sacrifice. *Sees:* the first time the player does a trick, a small stamp lands in the corner; the Guide page "Tricks" shows found tricks in colour and the rest as silhouettes, each with a one-line hint. *When:* at the trick. *How long:* the stamp shows 1.2 s. No count of missing tricks on the game screen.
9. **One new piece at a time.** *Borrows:* Marvel Snap unlocks and Clash Royale arenas (findings 3, 8). *Why:* PROGRESSION.md: start with Archer and Beast, then Maester, Ogre, Guard, by crowns from wins. *Sees:* the next piece as a dark silhouette on the result card with "2 crowns"; at the unlock, the silhouette fills with paint and the one-minute lesson offers itself. *When:* on the result card. *How long:* the fill is 900 ms. Losses never take a crown away.
10. **A share line without spoilers.** *Borrows:* Wordle (finding 6). *Why:* Today's army is the same for everyone. *Sees:* "King Down · Oct 8 · won in 23", then a row of the event marks of the tricks used (shot, shot, chain), with no army code and no moves. *When:* on the result of a daily game. *How long:* a check mark draws in 240 ms when copied. Owner check: emoji or the game's own icons in the copied text.
11. **Six kings that tease their powers.** *Borrows:* the character select of fighting games and the card inspect of card games. *Why:* players do not know the twelve powers exist. *Sees:* on the title, a tap on a king plays its power vignette and one line, "Frost: freeze an enemy piece for a turn", with **Play with Frost**. *When:* on the title only. *How long:* 1.2 s vignette; the line stays until the next tap.
12. **The final blow, once more.** *Borrows:* the replay of the winning goal in sports games. *Why:* King Down's mates come from new verbs (a shot, a chain, a Death Touch). *Sees:* the mating move replays once at half speed, then the king falls and the result card rises. *When:* at mate. *How long:* 1.2 s at most; a tap skips; Off shows the end frame.
13. **The hand rests as a deck.** *Borrows:* the hand of Hearthstone and Marvel Snap. *Why:* card mode deals six one-use cards, and some wait for a move number. *Sees:* at rest, one small stack with "6"; a tap fans the cards over the lower edge of the board; a waiting card carries a ring that fills each turn (the countdown branch); legendary Rage glints in gold once, when dealt. *When:* in card mode, on your turn. *How long:* the fan opens in 240 ms; the glint is 600 ms.
14. **Opponents with faces from the real cast.** *Borrows:* named computer opponents (the market review's suggestion 6). *Why:* four levels mean little to a new player; the 34 Workshop figures already exist. *Sees:* each level as a figure with a name and a temper, for example a Lantern Witch who plays Beginner. *When:* in New game. *How long:* no motion beyond the choice ring. Owner check: which figures, and whether a face changes how the computer plays.

Rules for all 14: each motion ends on a still frame that keeps the information; Off and reduced motion show that frame; nothing loops at rest; no streaks, timers or pressure.
