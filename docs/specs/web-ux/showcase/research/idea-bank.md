# Idea bank: the King Down redesign

Date: 2026-10-08. For the lead of the showcase. Read with the [brief](../BRIEF.md), the [merged review](../../review.md) and the six research files in this folder.

This file holds the ideas before the demos: principles, five directions, options for each feature, the small delights, the fold-and-tease plan and a draft plan for 24 demos. Every idea names what it borrows. Nothing here changes a rule of the game. Where an idea needs the owner's yes, it says "owner check".

**Source keys.** `cb` = [card-battlers.md](card-battlers.md), `ch` = [chess-and-board-apps.md](chess-and-board-apps.md), `ca` = [calm-and-joyful.md](calm-and-joyful.md), `gm` = [guidelines-motion-feel.md](guidelines-motion-feel.md), `kf` = [king-down-facts.md](king-down-facts.md), `ir` = [inventory-roadmap.md](inventory-roadmap.md), `rv` = [review.md](../../review.md). "F7" is a finding, "K7" or "M7" a design move, "W7" an owner pick of the review.

**Scales.** Joy: 1 = neutral, 5 = players smile and tell a friend. Ease: 1 = the player must learn it, 5 = no learning, and no delay for a player who wants to play. Effort (to build in the app): S = a day or less, M = two to five days, L = more than a week.

**The foundation under all of it.** The three menu designs of the morning agree on the structure (ir §3.1), and the review's picks W1 to W12 stand. The game screen at rest has Hint, Undo, one Menu and a folded Moves line. Resign is in the Menu. An Extra place holds the optional things. No browser boxes. One context area of fixed height; the board never moves. The ideas below sit on top of that foundation.

---

## 1. Principles

1. **The board is the stage.** Help lives on the board as marks, lines and rings, not in a side panel. (ch patterns 1; ca, Into the Breach)
2. **One focus, one main action.** Each view has one crimson action and one thing in motion. (cb F2; gm rules 6, 22)
3. **Eight words in play.** A line during a game has eight words or fewer; the rest waits on a hold. (cb F3)
4. **Fold depth, never the turn.** Fold what a turn does not need, two levels at most, with clear labels. (gm 1.6; ch F25)
5. **A hold reads; only a tap acts.** A preview shows the rules, never the computer's plan, and never commits a move. (ch F13; cb F9)
6. **Cause before effect.** Every check, loss and refusal points at the piece that caused it. (ca, Into the Breach; ch F12, F16)
7. **Impact follows consequence.** A plain move is quiet; one peak per move; one big moment per game. (cb F18; gm rule 8)
8. **Input never waits.** A tap skips any motion to its end frame, and that frame keeps the information. (ca 14; gm rules 7, 14)
9. **Teach at first meeting, inside a real game.** A board first, words last. (ch F19; gm 1.6; cb F24 to F26)
10. **Tease honestly.** Show the hidden thing in place, say what it does and how to get it: no timer, no price, no count, no guilt. (gm 1.7; cb F34, F43 to F45)
11. **Be kind.** A loss gets a way forward, never a wall, and the game wants nothing from the player. (cb F15, F28; ca, Wordle)
12. **Never one channel alone.** Shape with colour, picture with sound, haptic with both. (gm 1.5; XAG 103, 110)

---

## 2. Directions

Five directions. Each one is a mindset that changes how the app behaves, not a new coat of paint. All five keep the foundation. All five use the same art, type and rules.

### D1. Quiet Table: "Nothing on the table but the game."

- **Mindset.** The app steps back. The player meets a calm board, and all help waits under a finger. It is for the player who wants the chess and the new pieces, not a show.
- **Style.** The warm dark stage of the title around the stone board. No frames, no cards, no portraits. Two text strips in Alegreya Sans ("Flame · Computer", "Frost · You · Freeze ready"). One hairline row: Hint, Undo, Menu, in soft ink until a touch. Crimson only on the result. Cinzel only for "King Down".
- **Motion.** Only pieces travel. The interface fades (160 ms) and never slides. One slow moment in a game: the king lies down (650 ms).
- **Sound.** Stone on stone. A take is a deeper tap, check is one low note, King Down is one bell. No interface sounds. Haptics off by default.
- **How the app behaves.**
  - Home is the table. After the first visit, the app opens on the last board with Continue on it. New game is one quiet line under the board.
  - At rest: the board and two lines of text. The last move is a sentence, not chips.
  - A hold calls everything: the reach of a piece, its card (in the status line), the coordinates (on the edge while a finger is down), the move story (hold the last-move line).
  - After the first three games: no captions and no tags. A refusal speaks in the status line only.
- **Borrows.** Lichess Zen mode (ch F6); Alto's Zen Mode and Headspace's "first dose of calm" (ca); Monument Valley's minimal interface (ca); Threes' one rule (ca).
- **Why it fits King Down.** The art carries King Down (rv, summary). Quiet Table gives the painted figures the whole stage, and it suits the chess player who distrusts gimmicks.
- **Future.** Cards: a thin row of card tops in the margin. Crowns: one line on the result. Online: a small presence dot by the name. Workshop: a line in the Menu.
- **Main risk.** The magic hides: a new player misses hold-to-read and the powers. Guard: the foundation's first-sight tags for three games, and the "?" key.

### D2. Arena: "Two kings meet. Every special move is a reveal."

- **Mindset.** Each game is a short duel between two characters. The kings are the heroes, the powers are their signature plays, the new pieces are the cast. Card-battler grammar, at a whisper.
- **Style.** Two nameplates face each other across the board: theirs on top, yours below. Each holds a small king portrait in its colour rim (Frost blue, Flame red). A turn token (the emblem disc) sits on the side to move. Your power coin sits beside your portrait. A tray of the last five moves as tiles at the side of the board (desktop) or under it (phone).
- **Motion.** Three beats for each power: anticipation 120 ms, action 300 ms, follow-through 230 ms (gm M4). A lift and a land with a 50 ms stop at contact; no screen shake. The token slides in 240 ms. A reveal flips in 200 ms.
- **Sound.** Each new piece has its voice (bow, snap, scrape, swap). Each king's power has a two-note motif. Your moves sound one step higher than theirs.
- **How the app behaves.**
  - At the start, the armies muster file by file. In a powers game the two portraits slide into their nameplates: "Frost vs Flame", 600 ms.
  - The king is the power button. A tap on the coin dims the board, and the targets appear as a wave from your king.
  - Their actions reveal: their emblem flips to the power's face and names it before the effect plays.
  - New game picks an opponent, not a level: each level has a face from the real cast (owner check).
  - The end replays the final blow, then King Down. The result shows three key-moment tiles.
- **Borrows.** Hearthstone's hero power and history tray (cb F7; kf 13.4, 13.5); Marvel Snap's reveal (cb F14); the LoR attack token (cb F6); the character select of fighting games.
- **Why it fits King Down.** King Down has six painted kings with names, colours and powers: the heroes exist. Card mode comes next, and it needs a hand, a reveal and a tray. Arena builds that grammar now, so the cards arrive in a known place.
- **Future.** Cards fan out from under your nameplate and use the same reveal. Online: four words from your portrait. Crowns: a shelf of pieces like a collection. Workshop: your piece gets a card face.
- **Main risk.** Noise, and a "gamey" frame that pushes chess players away. Guard: one peak per move; a game with no powers shows the plain Spirit and Shadow kings and no coin; on a phone the tray folds to one chip.

### D3. Pocket: "One thumb, one hand, one bus stop."

- **Mindset.** The phone is the main table. Every action sits in the arc of the thumb. The top of the screen is for reading only.
- **Style.** The board sits low, just over a 56 px thumb bar. The opponent's strip and the move ribbon sit above the board. Every menu is a bottom sheet with three heights (peek, half, full). Targets are 48 px. In landscape: the board at full height on the left, a thumb rail on the right.
- **Motion.** Things follow the finger one to one and stop where the finger lets go. Sheets settle with a small overshoot of position only. Three haptics carry the feel (ca 7).
- **Sound.** Quiet by default. It obeys the silent switch and lets the player's music play (gm 1.9).
- **How the app behaves.**
  - Drag to move, with a loupe: the lifted figure shows at 1.5 times its size above the finger, so the finger never hides the target. Tap, then tap, still works.
  - A swipe right on the ribbon steps back through the game; a swipe left comes forward; a "Now" chip returns.
  - Pull the ribbon up: the move story opens as a sheet (peek: three moves; half: the game; full: the game and the key moments).
  - Hold to read: the card rises from the bottom edge, in reach of the thumb.
  - Every gesture has a visible twin button. No gesture is the only way.
- **Borrows.** Clash Royale's one-hand lower half (cb F2); map-app sheets with three heights; Lara Croft GO's swipe (ca); Royal Match's "don't slow down" (ca 14).
- **Why it fits King Down.** King Down is a browser game, and the daily game and the link games are phone moments. Today a selection pushes Hint and Undo off a phone screen (rv §2.1). A one-hand table removes the cause.
- **Future.** The card hand fans up from the bottom edge, straight into the thumb. Online: "Your move" on the tab title and the app badge. Crowns and Extra live in sheets.
- **Main risk.** Hidden gestures (cb F12); drags that miss on 45 px squares; a desktop that gets a phone layout. Guard: twin buttons, the loupe, tap-tap, and the foundation's desktop layout.

### D4. Chronicle: "Every game is a short tale worth retelling."

- **Mindset.** The app remembers. It tells the game in few words, marks the moments that matter, and turns each game into a keepsake.
- **Style.** Parchment and ink. One story line under the board, with a piece icon and a verb mark. The full story (folded) reads like a short chronicle. A gold quill mark on firsts and on key moments. The result is three small panels. Old games sit on a shelf as small posters.
- **Motion.** Ink draws: lines draw from the cause to the effect (180 ms). The story line writes itself in when the piece lands. The recap turns like a page (300 ms).
- **Sound.** The board sounds only, and one soft page sound when the story opens.
- **How the app behaves.**
  - While you hold a target, the story line names the move before you play it: "Your Ogre shoves their Guard to c5."
  - Continue and link games open with "Previously": the last move plays once, with one line: "Their Archer goes to e3 with Strike."
  - The ribbon is one sentence, not chips. A tap opens the story.
  - The result is a recap: three panels, each a mini board with an arrow and one line. Then Rematch.
  - Review is a scrubber with a tick for each move and a gold tick for each key moment.
  - The Book (in Extra): finished games on a shelf, each as a poster. A tap replays or shares it.
- **Borrows.** The logs of Root and Wingspan, and Board Game Arena's log replay (ch F21); Balatro names the hand while you choose (cb F10); Mini Metro's end map and Monument Valley's camera (ca); the "previously on" of TV series; Wordle's share (ca).
- **Why it fits King Down.** King Down moves are events with verbs: shoots, bites, shoves, swaps, trades for (kf §2). The engine already writes one sentence for each move and finds the key moments after a game. The owner asked for a move story that is folded but fun to read.
- **Future.** Link and online games need a catch-up, and Chronicle is that catch-up. Card plays become story lines. Unlocks become chapters of the player's own book. A Workshop piece gets its own page.
- **Main risk.** Words compete with the board, and reading slows a player who wants to play. Guard: one line at rest, eight words, the story folded, the Book in Extra.

### D5. Coach: "You never lose to a rule you could not see."

- **Mindset.** Every King Down player is new: six new pieces, twelve powers, shots over pieces. The board explains each rule at the moment it matters, and the help fades as the player grows.
- **Style.** The foundation's screen plus marks: reach on a hold, danger rings on a peek, cause lines, first-sight tags, and one line of goals ("○ ○ ○"). Home is a short path.
- **Motion.** Marks and lines only. Ghosts at 40 % opacity. Lines draw from the cause. Nothing loud.
- **Sound.** A soft tick when a goal fills. A muffled knock for a refusal, never a buzzer.
- **How the app behaves.**
  - Peek is on at Beginner and Casual: hold a target square, and each enemy that can take you there gets a thin ring.
  - Second look: after a large mistake at Beginner and Casual, the computer waits. "Your queen on d4 is open to the archer on f6." Take it back, or Keep it (owner check).
  - In check, the ways out glow. In the demo position, four squares glow: the king step, the pawn take, the Beast bite and the Maester swap.
  - Each refusal points at its cause. After the third refusal for one piece, "Show me" plays its moves once.
  - After a loss: "Retry from move 18".
  - The help fades by level and by use. At Club and Strong only hold-to-read, refusals and cause lines stay.
  - Home is a path: the next lesson, the next unlock, today's game. "Skip ahead" for a strong player.
- **Borrows.** Into the Breach's telegraphs and turn reset (ca; ch F14); Dr. Wolf's second try (ch F8); Shotgun King's Folly Shield (ch F12); Pawnbarian's hold (ch F13); Duolingo's path without its streak (ca 12); Hitman GO's three goals (ca 11); World 1-1 (gm 1.6).
- **Why it fits King Down.** A chess player loses to rules that are hard to see: an Archer shot over pieces, a Death Touch from two squares, a Guard that only a king can take. Coach turns the novelty from a trap into a pleasure.
- **Future.** Unlocks teach one piece at a time (PROGRESSION.md), so each unlock is a lesson. A card that cannot play says why ("No taken piece can return"). A Workshop piece shows its reach with the same marks.
- **Main risk.** It can feel like a nanny, it can slow an expert, and a peek may count as a hint at Club and Strong. Guard: the help fades by level; one Board help switch in Extra; previews never show the computer's plan.

### How the five behave: side by side

| Moment | Quiet Table | Arena | Pocket | Chronicle | Coach |
|---|---|---|---|---|---|
| Home | The last board, Continue on it | Pick your opponent's face; your king | Three cards in thumb reach: Continue, Today, New | The Book: last game's poster, "Previously" | A path: next lesson, next unlock, today |
| At rest | Board and two text lines | Nameplates with portraits, token, five tiles | Low board, thumb bar, one-line ribbon | Board and one story sentence | Board, goals line, first-sight tags |
| Your turn | Marks only under a finger | Verb marks; the coin glows when a power can act | Drag with a loupe, or tap-tap | The line names the move while you hold a target | Peek and danger rings, on by level |
| Their turn | Still board; a thin ring after 1 s | Portrait breathes; their power reveals | A haptic tick when their move lands | The line writes their move in words | Their move's cause line stays until you move |
| Check | One low note and the cause line | The king flinches on the nameplate | Two short pulses and the cause line | "Check: their Archer shoots over f2." | The ways out glow |
| End | The king lies down; one bell | Final blow replay, then King Down | Result sheet with Rematch under the thumb | A recap in three panels; a poster | "Retry from move 18" |
| Card mode | A row of card tops in the margin | A hand under your nameplate | A hand that fans up from the bottom edge | Each card play is a story line | A card that cannot play says why |

**The blend.** The five can mix, because each one owns a different moment best. A likely blend: Quiet Table at rest, Coach for the first ten games and then fading, Arena for powers and cards, Chronicle after the game and in link games, Pocket as the phone layout. The demos show each direction pure, so the owner can choose the mix.

---

## 3. Feature by feature

### 3.1 The table

"Pick" is the recommendation. "Add" joins the pick. "Owner" needs the owner's yes. "Coach", "Arena" and the like: the option belongs to that direction.

| # | Feature | Option | Borrows | Joy | Ease | Effort | Pick |
|---|---|---|---|---|---|---|---|
| 1 | First launch and first minute | A. First game in one tap (Beginner; a chosen deal with an Archer and a Beast) | Marvel Snap's first match and Quicksilver (cb F24, F25); Clash Royale's camp (cb F26) | 4 | 5 | M | Add |
| | | B. Take your first shot (one move, then the game) | World 1-1 (gm 1.6); report A's reward line (ir §3.4) | 4 | 5 | S | **Pick** |
| | | C. The cast says hello (tap a lineup figure: it plays its move on a 3 × 3 board) | Fighting-game select; Pocket's immersive card (cb F11) | 5 | 3 | M | — |
| 2 | Returning home | A. The table remembers (the last board with Continue) | Lead note 9; Headspace's calm (ca) | 3 | 5 | S | **Pick** |
| | | B. Six kings (tap a king: its power plays; "Play with Frost") | Fighting-game select (kf 14.11) | 5 | 4 | M | Arena |
| | | C. One "Today" card (today's eight figures) | Snap's news (cb F30); Really Bad Chess's daily (ch F11) | 4 | 4 | S | Add |
| 3 | Starting a game | A. Opponents with faces (each level a figure from the real cast) | Fighting games; market idea 6 (kf 14.14) | 5 | 4 | M | Owner |
| | | B. One short sheet (level, powers, More options that names what is not default) | The three menu designs (ir §3); NN/g (gm 1.6) | 2 | 5 | S | Add |
| | | C. Quick play (one Play with the last setup; Change opens B) | Royal Match's one Play (ca); Clash Royale's battle button (cb F2) | 3 | 5 | S | **Pick** |
| 4 | Game screen at rest | A. Bare table (board, two text strips, three buttons) | Lichess Zen (ch F6) | 2 | 5 | S | Quiet |
| | | B. Duel frame, quiet (nameplates with small portraits, turn token, five chips) | Hearthstone's history (cb F7); LoR's token (cb F6) | 4 | 4 | M | **Pick** |
| | | C. Thumb rail (board low, bar in thumb reach) | Clash Royale (cb F2) | 3 | 5 | S | Add (phone) |
| 5 | Your turn | A. Peek before you commit (hold a target: ghost and danger rings) | Threes; Into the Breach (ca 5) | 4 | 4 | M | Add (Beginner, Casual) |
| | | B. Verb marks on targets (shove arrow, swap arrows, bite numbers, crosshair) | LoR's Oracle's Eye (cb F9); Balatro's hand name (cb F10) | 4 | 5 | S | **Pick** |
| | | C. Lift and land (shadow on lift, stone tap, 50 ms stop, loupe on touch) | Hearthstone's weight (cb F18); Sakurai's hit stop (gm 1.4) | 4 | 4 | M | Add |
| 6 | The computer's turn | A. Breath and tell (portrait breathes, ring after 1 s, piece lifts before it moves) | Disney anticipation; gm M1 | 3 | 5 | S | **Pick** |
| | | B. Toys for the wait (a taken figure wobbles and says its name) | Hearthstone's board toys (cb F31) | 4 | 5 | S | Add |
| | | C. Read while you wait (hold works; select your next piece) | Inspect at any time (cb F8) | 3 | 5 | S | Add |
| 7 | Check | A. Cause line and ember ring (line from the checker; low note; "Check") | Into the Breach; rv motion C2 | 3 | 5 | S | **Pick** |
| | | B. The king flinches (portrait tilts once, holds a rim; two pulses) | Royal Match's nervous king (ca 8) | 4 | 5 | S | Add |
| | | C. Ways out (king steps and blocks glow) | Into the Breach (ca) | 3 | 5 | S | Coach |
| 8 | End of game | A. King Down (final blow at half speed, the king falls, "King Down") | Sports replays; Sakurai's long stop (gm 1.4); Snap's match end | 5 | 4 | M | **Pick** |
| | | B. Quiet end (the king lies down, one bell) | Headspace's end; Alto's Zen (ca) | 3 | 5 | S | Quiet |
| | | C. Lay your king down (resign topples your own king) | Snap's "Escaped!" (cb F15) | 4 | 5 | S | Add (resign) |
| 9 | Reading a piece | A. Hold to read (reach on the board, card at the edge, enemies too) | Hearthstone and Snap card zoom; StS intents (cb F4); Pawnbarian (ch F13) | 4 | 4 | M | **Pick** |
| | | B. The "?" lens (names on every figure while pressed) | Wingspan's "?" (ch F18) | 3 | 5 | S | Add (keyboard) |
| | | C. Move glyph (a 5 × 5 diagram for each piece, everywhere) | Onitama's cards (ch F15) | 3 | 5 | S | Add |
| 10 | Move history | A. Chips (last five moves: icon, verb mark, side by shape) | Hearthstone's history (cb F7) | 4 | 4 | M | **Pick** |
| | | B. The story (open: one sentence a move, icons, key moments) | Root and Wingspan logs; Board Game Arena (ch F21) | 4 | 4 | M | Add (open) |
| | | C. Scrubber (drag along the ribbon like a video) | Video players; sports replays | 5 | 4 | M | Add (review) |
| 11 | King powers | A. The power coin (by your portrait; notches; tap arms; a wave of targets; stone when spent) | Hearthstone's hero power (cb; kf 13.5) | 5 | 4 | M | **Pick** |
| | | B. The reveal (their emblem flips, names the power, the effect travels) | Snap's reveal; LoR's level-up (cb F14, F23) | 5 | 4 | M | Add |
| | | C. Preview the cast (hold a target: the faint result) | Into the Breach (gm M3) | 4 | 5 | M | Add |
| 12 | Hints, undo, help | A. Hint in three steps (piece glows, ghost move, one line why) | Dr. Wolf (ch F8); rv motion C1 | 4 | 5 | M | **Pick** |
| | | B. Second look (after a large mistake: Take it back, Keep it) | Dr. Wolf; Into the Breach (ch F8, F14) | 4 | 4 | M | Owner |
| | | C. Rewind and reasons (Undo plays backward; refusals point at the cause) | Into the Breach's reset; Hive (ch F16) | 3 | 5 | S | Add |
| 13 | Result, rematch, review | A. Board-first card (outcome, three key moments, Rematch) | rv W8; Wingspan; chess.com's icons (ch F7, F23) | 4 | 5 | S | **Pick** |
| | | B. Retry from the turning point (after a loss) | Into the Breach; Threes (ca 15) | 5 | 4 | M | Add |
| | | C. Review scrubber with chapter ticks | Video players | 4 | 4 | M | Add |
| 14 | Extra and teasing | A. The cabinet (small illustrated tiles, one tease line each, a gold dot once) | Hearthstone's Modes door (cb F29) | 4 | 4 | S | **Pick** |
| | | B. Task rows (five plain rows) | Report A (ir §3.4) | 2 | 5 | S | — |
| | | C. Seals and Tricks (a first trick stamps a seal; a page of silhouettes and riddles) | Lara Croft GO's relics; Balatro's locked states (ca 10; cb F34) | 5 | 4 | M | Add |
| 15 | Lessons | A. Four boards per piece (introduce, develop, twist, conclude) | Hayashida; World 1-1 (gm M7) | 4 | 5 | M | **Pick** |
| | | B. One path (gold when done, Skip ahead, no hearts, no streak) | Duolingo's path (ca 12) | 4 | 4 | M | Coach |
| | | C. The piece joins your army (a calm done moment, then Play) | Headspace's restraint; Duolingo's milestone (ca 13) | 4 | 5 | S | Add |
| 16 | Workshop | A. Start from a working piece (Surprise me first; one reaction per edit) | rv W9; the workshop-finish spec | 4 | 4 | S | **Pick** |
| | | B. Share as a card (figure, name, glyph, worth word) | Snap's deck codes (cb F40) | 4 | 5 | M | Add |
| | | C. Try it with a goal ("Take three pieces in five moves") | Hitman GO's goals (ca 11) | 4 | 4 | M | — |
| 17 | Settings and accessibility | A. One Feel row (Sound, Haptics, Animations; first run reads the device) | Apple's defaults; GAG (gm M14) | 3 | 5 | S | **Pick** |
| | | B. Board help in Extra (each switch with a live mini preview) | Carcassonne's switches (ch F25) | 3 | 5 | S | Add |
| | | C. Pace (Calm, Brisk, Instant) | Balatro's speed (cb F20) | 3 | 5 | S | — |
| 18 | Card mode (future) | A. The hand at the edge (a stack with a count; fans out on your turn) | Hearthstone and Snap hands (cb K14; gm M12) | 5 | 4 | L | **Pick** |
| | | B. The deal (six cards flip in, the same flip as the muster) | Wordle's flip; Snap's reveal (ca 1) | 5 | 5 | M | Add |
| | | C. Cards as coins (each card a coin by the king) | Hearthstone's hero power | 3 | 5 | M | — |
| 19 | Unlocks with crowns (future) | A. Silhouette to paint (the next piece fills with paint at the unlock) | Balatro's locks (cb F34); Pocket's ritual (cb F37) | 5 | 5 | M | **Pick** |
| | | B. Crown track (pips on the result, pieces at 2, 5 and 9) | Hearthstone's track (cb F27) | 4 | 5 | S | Add |
| | | C. Choose your next piece | Gwent's reward book (cb F33) | 4 | 4 | M | Owner |
| 20 | Online play (future) | A. The waiting table (two kings face each other; one true fact) | Hearthstone's tips (cb F41); Clash Royale's rejoin (cb F42) | 4 | 5 | M | Add (later) |
| | | B. Four words (Hello, Well played, Wow, Oops; a mute) | Hearthstone's emotes (cb F38) | 4 | 5 | S | Add |
| | | C. While you were away (their moves play once, with one line) | Board Game Arena's turn-based play (ch F24) | 4 | 5 | M | **Pick** |
| 21 | Sharing | A. A daily line with no spoilers (date, result, verb marks) | Wordle's grid (ca 2) | 5 | 5 | S | **Pick** |
| | | B. The board poster (final position, last-move trail, fallen king) | Mini Metro's map; Monument Valley's camera (ca 3) | 5 | 4 | M | Add |
| | | C. Clip a moment (one move as a short loop) | Market idea 10 (ir §2.3) | 4 | 4 | L | — |

### 3.2 The cards

**1. First launch and first minute.** Pick B, then A.
- The first visit shows the six kings and one button: "Take your first shot". A small board opens: your Archer, an enemy pawn behind a row of pieces. "Tap your archer, then the pawn." The shot flies over the pieces. "A clean shot."
- The board then grows into a full game against Beginner. No menu, no sign-in, no setup before the first real move: under 30 s.
- The first game uses a chosen seed whose random army holds an Archer and a Beast. The draw rule stays; only the deal is chosen (Quicksilver by deal, cb F25). It also matches the planned starter pieces (PROGRESSION.md). Owner check.
- "Play" stays one quiet tap away for the player who wants to skip.

**2. Returning home.** Pick A, plus one card from C.
- The last board, with "Continue · your move · against Beginner" on it. Continue plays the last move once, so the player remembers the game (rv motion T3).
- One card under it: today's army as eight small figures, "Play today's army". New game is a quiet line.
- A finished last game shows "Rematch" and "Review last game" in place of Continue (report S).
- The card never counts days and never says "you missed".

**3. Starting a game.** Pick C, with B as its Change sheet. A is an owner check.
- One Play button starts at once with the last setup and names it: "Play · Beginner · Random army".
- "Change" opens one short sheet: the level, Kings' powers (your king picker only, W5), and More options. The folded label names what is not default: "More options · You play Black · Today's army". Start stays in view.
- A: each level gets a name and a face from the 34 Workshop figures, with one temper line. The face changes the look only, not the computer.
- A new game ends in the muster (delight 1).

**4. The game screen at rest.** Pick B at its quietest, with C on a phone.
- The board first. Two nameplates: name, a 32 px king portrait, and the power coin in a powers game. A turn token on the side to move. Under the board: the last five moves as chips. Three buttons: Hint, Undo, Menu.
- Phone: the bar sits in thumb reach under the chips. Desktop: a quiet column on the right.
- Count at rest: 3 buttons, 1 ribbon, 2 nameplates. Today: 7 tiles, up to 24 move buttons and 9 text areas (ir §1).

**5. Your turn.** Pick B. A is on at Beginner and Casual. C everywhere.
- Each target shows what happens there: a dot (move), a ring (take), a crosshair (shot), an arrow (shove), a two-way arrow (swap), a number (bite 1, bite 2). In the demo position the Ogre shows an arrow on the enemy Guard, and the Beast shows 1 on d5 and 2 on e6.
- A choice happens at the square: the Ogre's take or shove, a promotion and Sacrifice fan out as small pictures at the square (Hearthstone's Discover), not in a dialog.
- A Beast chain pauses after each bite, with "Bite again, or stop here" beside the Beast.
- Peek (A): hold a target for 250 ms. A see-through copy stands there, and each enemy that can take it gets a thin ring and a cause line.

**6. The computer's turn.** Pick A. B and C join.
- Your move lands and settles. The reply starts no sooner than 500 ms later. After 400 ms the opponent's portrait breathes once; after 1 s a thin ring fills around the token. 160 ms before the move, the chosen figure lifts 3 px, then travels (gm M1).
- You can still hold any piece to read it, and select your next piece (no premove).
- A tap on a taken figure makes it wobble and say its name. Nothing marks this; players find it.

**7. Check.** Pick A and B.
- When the checking piece lands, a thin ink line draws from it to your king. An ember ring on the king's base, one low note, "Check" in the status line. Your portrait tilts once (240 ms) and holds a rim. Two short pulses where the device can.
- In the demo position, the enemy Archer checks from e3 over the pawn on f2. Without the line, a chess player does not see it.

**8. End of game.** Pick A for a mate, C for a resign.
- The mating move replays once at half speed (1.2 s at most; a tap skips). A 120 ms stop. The losing king topples. The board dims, except the winning piece. "King Down" settles in. The card rises over the lower third, never over the fallen king.
- Resign: the Menu asks "Lay your king down?" with your king's figure. On yes, your own king topples, and the card says "You laid your king down."
- A draw: both kings stay up; one open chord; "Draw: the same position three times."

**9. Reading a piece.** Pick A with C's glyph. B for keyboard and help.
- Hold any figure, yours or theirs (touch 300 ms, mouse 400 ms, keyboard I). Its reach shows on the board in three shapes. A card rises at the board's edge: portrait, name, one line of 12 words or fewer, the glyph. "More" grows the card into its Guide page.
- The enemy Archer's crosshairs show behind pieces. The Guard's card shows a shield: "Only a king can take it."
- A hold never moves a piece (ch F13). This also fixes D-10 (rv §1).

**10. Move history.** Pick A closed, B open, C in review.
- Closed: the last five moves as chips (icon, verb mark, square). Yours are filled, theirs outlined. A new chip slides in when the piece lands.
- A tap on a chip plays that move once as a ghost. A tap on the row opens the story: "Your Beast bites twice: the Ogre, then a pawn." Firsts and key moments carry a gold mark. Letters (Nf3) are a switch in Extra.
- Review: drag along the ribbon like a video, with a tick for each move. "Back to game" stays in view.

**11. King powers.** Pick A and B, with C inside the arming.
- A spent power (Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, Leap) is a coin beside your portrait, with one notch for each use. A tap dims the board; the targets appear as a wave from your king. A hold on a target shows the faint result (ice on the figure). A tap casts in three beats. The coin turns to grey stone and stays readable: "Freeze · used".
- An always-on power (March, Holy Light, Mercy, Death Touch, Darkness) has no coin: a faint aura on the king. A hold on the king shows its squares and one line.
- A two-beat turn (Freeze or Ice Wall, then a move; Haste; a Beast chain) shows two pips and "Now make your move".
- Their power: their emblem flips to the power's face (200 ms) and names it; then the effect travels. Full on the first use in a game, short after that.

**12. Hints, undo, help.** Pick A and C. B is an owner check.
- Hint: tap 1 selects and lights the piece; tap 2 plays the move once as a ghost; tap 3 gives one line, for example "Hint: use Strike, then knight f1 to f7" (rv §2.9). The hint arms a power when the move needs it.
- Undo plays the move backward (450 ms). Free, always.
- A refusal points at its cause and says why in one line.
- B: at Beginner and Casual, the computer waits after a large mistake and offers "Take it back".

**13. Result, rematch, review.** Pick A. B after a loss. C in review.
- "You win! Checkmate on move 23." Up to three key-moment chips, 150 ms apart. Rematch (crimson), Review, New game. One fact line can follow: "Your first win with an Ogre."
- After a loss to the computer, "Retry from move 18" joins when the key moments are ready. The board rewinds to before the costly move, the better move shows once as a ghost, and play goes on. It earns no crown.
- No accuracy score and no grade on the card.

**14. Extra and teasing.** Pick A and C.
- Extra is a cabinet of small tiles with real art, one line each: Today's army ("The same army for everyone today"), Workshop ("Make your own piece"), Tricks ("Tricks you found, riddles for the rest"), Board help, This game, Account. Later: Card mode ("Coming: a hand of power cards").
- A new tile carries a gold dot once.
- Seals: the first time a player does a trick (the far Maester and king swap, a Beast chain, an Ogre that shoves a Guard, a shot over a piece, a Paladin trade), a small wax seal stamps on the board's corner (200 ms), holds 1 s, then flies into the Menu button. The Tricks page shows found tricks in paint and the rest as silhouettes with one riddle each.

**15. Lessons.** Pick A and C.
- Four tiny boards for each new piece, about 60 s in all: introduce, develop, twist, conclude. The Guard's twist: "Take the Guard." The try fails with the shield and "Only a king can take a guard." Then the king takes it.
- Each line has eight words or fewer. After 8 s with no move, the goal move plays once as a ghost.
- Done: the other squares dim, a gold ring passes under the piece, one chime, "Guard learned." Then "Next: Maester" and "Play a game".

**16. Workshop.** Pick A and B.
- A first visit opens a working piece from Surprise me (W9). Each edit plays one reaction on the figure (the workshop-finish spec; keep it).
- Share makes a card: figure, name, glyph and worth word ("Fair"). A received link opens the card read-only, with "Keep a copy".
- A design does not play in a real game. The card says "Try it on the test board".

**17. Settings and accessibility.** Pick A and B.
- The Menu holds one Feel row: Sound, Haptics (only where the device can), Animations (Normal, Fast, Off). The first run reads the device: reduced motion sets Off; the silent switch mutes.
- Extra › Board help: Show threats, coordinates, piece icons, peek, letters. Each switch shows a live mini board of what it does.
- The keyboard does every task. At 200 % text and 320 px width the page scrolls; type never shrinks. Each mark has a shape. A screen reader hears the same sentence as the move story. An evening (dark) table follows the system setting.

**18. Card mode (future).** Pick A and B.
- The deal: six cards fan in face down and turn over from left to right, 45 ms apart: the same flip as the muster, so a random reveal has one look in the app.
- At rest the hand is one small stack with a count at the edge of the board. On your turn a tap fans it over the lower edge. A card you can play sits 4 px higher. A card you cannot play lies flat with a small lock; a hold gives the reason.
- A tap on a card marks its targets (the power pattern). A played card becomes a chip in the ribbon. Their hand shows as a count only (hands are private).
- A card that waits for a move number carries a ring with the turns left. Legendary Rage glints in gold once, at the deal (owner check on the look).

**19. Unlocks with crowns (future).** Pick A and B. C is an owner question.
- A thin crown track on the result card, with the next piece as a silhouette at 2, 5 and 9 crowns (PROGRESSION.md). A win against Casual or stronger adds a crown. A loss takes none away.
- The unlock: the player drags the silhouette up; paint fills from the base to the head (600 ms); one chime. "Try it · 1 min" and "Later".
- New game says which pieces your random army can draw.
- The shelf: yours (paint), met (paint and "Met in today's army"), locked (silhouette and its goal). The silhouette is a filter on the real art, not new art.

**20. Online play (future).** Pick C and B. A comes with live matches.
- Link games today, online later: the game opens on the position before their move, their move plays once (400 ms), and one line says it: "Sam's Ogre shoves your pawn to e5. Your move." More moves play in order; a tap skips to now.
- Home lists open games, "Your move" first. A hidden tab shows "Your move" in its title.
- Four words: Hello, Well played, Wow, Oops. A bubble by your nameplate for 1.6 s; one every 4 s; a mute on their nameplate that they never learn of. No chat. Against the computer, its king says "Well played" once, only when you win.

**21. Sharing.** Pick A and B.
- The daily line: "King Down · Daily 8 Oct", "Won in 31 · Club", then the verb marks of the game (two shots, one bite, one Freeze). No army code, no moves. Owner check: emoji or the game's own icons; a "plain words" choice.
- The poster: "Save picture" makes a 4:5 image: the final position on the stone board, the last move as a faint ink trail, the fallen king, both emblems, the date and "Won in 31".
- "Copied" shows only after the copy succeeds (D-9).

---

## 4. Surprise and delight: the top 20

Small things with a big effect. Each one is quiet, short and skippable.

| # | Idea | What the player gets | Borrows | Effort |
|---|---|---|---|---|
| 1 | **The muster** | The back ranks land file by file, each twin at the same time; then "Same army for both sides." About 700 ms. The mirror rule, with no words. | Really Bad Chess (ch F11); Wordle's flip (ca 1) | M |
| 2 | **Take your first shot** | The first tap in the app is an Archer shot over a row of pieces. The novelty is the first memory. | World 1-1 (gm 1.6); Snap's first match (cb F24) | S |
| 3 | **One mark, five places** | Each verb (shot, bite, shove, swap, trade, freeze) has one mark. It shows on the target square, the chip, the story, the share line and the Tricks page. | Inscryption's sigils (cb F5) | M |
| 4 | **The cause line** | A thin ink line from the cause to each take without contact (a shot, a Death Touch, the later bites) and to a king in check. | Into the Breach (ca) | S |
| 5 | **The refusal that teaches** | A tap on a Guard: a shield glints on its base, and "Only a king can take a guard." | Hive (ch F16); Shotgun King (ch F12) | S |
| 6 | **Rising bites** | Each Beast bite sounds one step higher, and the line counts "Beast bites ×2". | Dots (ca); Balatro (cb F19) | S |
| 7 | **The tell** | The computer's piece lifts 3 px 160 ms before it moves. The eye is there in time. No spinner, ever. | Disney anticipation (gm M1) | S |
| 8 | **The king flinches** | In check, your king's portrait tilts once and holds a rim. No red flash. | Royal Match's king (ca 8) | S |
| 9 | **Rewind undo** | Undo plays the move backward, so the player sees what came back. | Into the Breach's reset (ca) | S |
| 10 | **The ghost hint** | The hint plays its move once as a see-through piece, then rests faint. | rv motion C1 | S |
| 11 | **The final blow, once more** | The mating move replays at half speed, then the king falls. | Sports replays (kf 14.12) | M |
| 12 | **Lay your king down** | Resign is the name of the game as a gesture: your own king topples. | Snap's "Escaped!" (cb F15) | S |
| 13 | **Previously** | Continue and link games open with the last move played once and one line: "Their Ogre shoves your pawn. Your move." | TV recaps; Board Game Arena (ch F24) | S |
| 14 | **Choice at the square** | Promotion, Sacrifice and the Ogre's take or shove fan out as small pictures at the square, not in a dialog. | Hearthstone's Discover | M |
| 15 | **Toys for the wait** | While the computer thinks, a tap on a taken figure makes it wobble and say its name. | Hearthstone's board toys (cb F31) | S |
| 16 | **Coordinates on demand** | File and rank letters show on the edge only while a finger is on the board. | Lead note 20; Carcassonne (ch F25) | S |
| 17 | **Your step, their step** | All sounds share one key. Your piece lands one step higher than theirs, so the ear knows whose move it was. | Mini Metro (ca 6) | S |
| 18 | **Seals and riddles** | The first Ogre that shoves a Guard stamps a wax seal. The Tricks page keeps a riddle for each trick still hidden. | Lara Croft GO (ca 10); Balatro (cb F34) | M |
| 19 | **The daily line** | "King Down · Daily 8 Oct · Won in 31" and a row of verb marks. Friends ask: "An archer shot, in chess?" | Wordle (ca 2) | S |
| 20 | **The board poster** | One tap saves the final position as a picture worth keeping, with the fallen king. | Mini Metro; Monument Valley (ca 3) | M |

The next five: kings that meet on the nameplates at the start of a powers game ("Frost vs Flame"); a spent power coin that turns to stone and stays readable; frost that thaws from a frozen piece's base; "Your first win with an Ogre"; faces for the computer levels.

---

## 5. Fold and tease

### 5.1 What the first screens show

- **First visit.** The six kings on their stage, the name, and one button: "Take your first shot". "Play" is a quiet second line. "Workshop" is a text link at the foot. Nothing else.
- **A returning player.** The last board with Continue on it (or Rematch and Review, if the game is over). One "Today" card. New game as a quiet line.
- **The game screen at rest.** The board. Two nameplates (with the power coin in a powers game). The last-move ribbon. Hint, Undo, Menu. Nothing else.

### 5.2 Where each thing folds

| Thing | Where it lives | How the player reaches it |
|---|---|---|
| Move story | Behind the ribbon | Tap the ribbon |
| Review | In the ribbon | Tap a chip, or drag the ribbon |
| A piece's rules | On the piece | Hold it (keyboard: I) |
| New game, Guide, Resign, Feel row (Sound, Haptics, Animations) | Menu | One tap |
| Today's army, Workshop, Tricks, Board help, This game (army code, Copy moves), Account, the Book | Menu › Extra | Two taps |
| Show threats, coordinates, piece icons, peek, letters | Extra › Board help | Two taps; each with a live preview |
| Flip board (one device), Send your turn (by link) | The Hint slot of the bar, by mode | In place of Hint, only in that mode (report A) |
| Lab armies, Clay 3D, thinking time | `?lab=1` | Not for players (W6) |

### 5.3 How hidden things call to the player

Seven quiet calls. Each one says what the thing does in eight words or fewer, and each one shows at most three times.

1. **First sight.** A new piece type in your game gets a tag at the start: "Archer · hold to read". It folds into a dot after your first move.
2. **The seal.** A first trick stamps a seal, which flies into the Menu. The Menu keeps a dot until the player opens it.
3. **The one offer.** A result card can carry one line and one button, never more: "Your king can have a power. Try Frost." (after game 3).
4. **The silhouette.** A locked piece or a coming mode shows in place, as a silhouette, with what it does and how to get it.
5. **The kings.** A tap on a king on the first screen plays its power on a tiny board: "Frost freezes an enemy piece for a turn." Then "Play with Frost".
6. **The Today card.** Today's eight figures on the home screen: a glimpse of pieces the player has not met.
7. **The gold dot.** One dot on a new Extra tile, once.

### 5.4 The tease ladder

Features unfold with play; they never lock behind play (cb K7). "Open now" always works.

| When | What appears |
|---|---|
| First minute | The first shot, then the first game. Nothing else. |
| Games 1 to 3 | First-sight tags for each new piece type. |
| After game 1 | The Today card on the home screen. |
| After game 3 | The result offers Kings' powers: "Your king can have a power." |
| First trick | The first seal; the Tricks page opens in Extra. |
| First link game | "Previously" and the turn line in the bar. |
| With crowns (planned) | The crown track and the next silhouette on the result card. |
| Card mode (planned) | A "Coming" tile in Extra, then one offer on a result card. |

### 5.5 Rules for every tease

- One tease on a screen at a time. Never during your own selection.
- No count of what the player misses ("12 of 40") on the home or game screen.
- A tease that the player closes does not come back.
- No timer, no price, no streak, no "you missed".
- The core actions (the board, your move, Hint, Undo, Menu) never move to make room for a tease.

---

## 6. Draft demo plan

### 6.1 The shared positions

All five direction demos start from the same position, so the owner compares like with like. Both positions are checked with the kit's engine (`kit/kd-engine.js`).

- **P1: the middle game.** A Kings' powers game. You play White with Frost (Freeze, one use). The computer plays Black with Flame (Strike, one use).
  `r1b2mk1/2p3pp/1a2p3/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 w - - 0 12`
  White can: shoot the pawn on a5 with the Archer; bite the Ogre on d5 with the Beast, then the pawn on e6; shove the enemy Guard from c4 to c5 with the Ogre; swap the Maester with the king or a pawn; Freeze one of 12 pieces. A tap of the pawn on d3 onto the Guard on c4 is a refusal ("Only a king can take a guard"). Show "Black pawn e7 to e6" as the last move.
- **The scripted line from P1.** 12. Archer shoots a5 (`Aa3*a5`). Then the computer plays Flame's Strike: its Archer goes from b6 to e3 like a queen (`Ab6-e3!`) and gives check by a shot over the pawn on f2. White has four answers: the pawn takes (`f2xe3`), the Beast bites (`Se4xe3`), the king steps (`Kg1-h1`), the Maester swaps with the king (`Mf1<>g1`). The real computer at Club prefers to take the Beast, so the direction demos script this reply; the feature demos use the real computer.
- **P2: the end.** The same armies, later. White mates in one: the Archer steps from e5 to f6 and shoots the king on h8 (`Ae5-f6`, "White wins by checkmate").
  `r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24`

### 6.2 Rules for every demo

- Each direction demo has the same six states: `rest`, `read`, `select`, `played`, `check`, `end`. Each demo reads `?state=` and `?frame=phone|desktop`, so the compare demo can show them side by side.
- Each demo has a state bar (named buttons and ← →), a frame switch (phone 390 × 844, desktop 1440 × 900) and a Reduced motion switch. Reduced motion shows each end frame at once.
- Real art only, from `showcase/assets/`. All player text in plain words, eight words or fewer in play.
- Every control works with the keyboard; touch targets are 44 px or more; no mark uses colour alone.

### 6.3 The demos

Priority: 1 = build first, 2 = next, 3 = if time allows. Kit: the board (the painted board with a marks layer), the engine (`KD`), the computer player (`KD.ai`).

**Directions**

1. **`dir-quiet-table` · Quiet Table · direction · priority 1**
   - Shows: P1 in the Quiet Table style. A dark stage, two text strips, no portraits. Marks show only under a finger. The status line carries every word.
   - States: `rest` · `read` (hold their Archer on b6: its reach as crosshairs) · `select` (your Ogre: the shove arrow on the Guard) · `played` (the Archer shoots a5) · `check` (their Archer goes to e3 with Strike; one low note, the cause line) · `end` (P2: the Archer goes to f6; the king lies down; one bell).
   - Options: dark stage or parchment floor.
   - Kit: board; engine (P1, P2, the scripted line).

2. **`dir-arena` · Arena · direction · priority 1**
   - Shows: P1 with two facing nameplates (Frost below, Flame above), the turn token, your Freeze coin and a tray of five tiles.
   - States: `rest` · `read` (the enemy Archer's card rises) · `select` (the Freeze coin armed: a wave of targets) · `played` (the shot; a tile with the shot mark slides into the tray) · `check` (Flame's emblem flips to "Strike", the Archer travels, your king flinches) · `end` (final blow replay, King Down, three tiles).
   - Options: tray beside or under the board; portrait size 32 or 48 px.
   - Kit: board; engine (P1, P2, powers).

3. **`dir-pocket` · Pocket · direction · priority 1**
   - Shows: P1 on a phone, board low, thumb bar, sheets. Landscape too.
   - States: `rest` · `read` (the card rises from the bottom edge) · `select` (drag the Beast with the loupe; bites 1 and 2) · `played` (a haptic tick; the ribbon updates) · `check` (two pulses; the cause line) · `end` (result sheet with Rematch under the thumb).
   - Options: portrait or landscape; drag or tap-tap.
   - Kit: board (with drag and loupe); engine (P1, P2).

4. **`dir-chronicle` · Chronicle · direction · priority 1**
   - Shows: P1 with one story line under the board and the folded story.
   - States: `rest` (the line: "Their pawn steps to e6.") · `read` (the piece card, and its line in the story voice) · `select` (hold the Guard square with the Ogre: "Your Ogre shoves their Guard to c5.") · `played` (the line writes itself) · `check` ("Check: their Archer shoots over f2.") · `end` (the recap: three panels, then the poster).
   - Options: story open or folded; squares named or not.
   - Kit: board; engine (`describe` for each move, P1, P2).

5. **`dir-coach` · Coach · direction · priority 1**
   - Shows: P1 with first-sight tags, peek, danger rings and the goals line.
   - States: `rest` (tags: "Guard · hold to read") · `read` (the Guard's shield card) · `select` (peek on c4 for the Ogre: danger rings) · `played` (the refusal first: the pawn onto the Guard, then the shot) · `check` (four ways out glow) · `end` (the result with "Retry from move 18").
   - Options: help level (Beginner or Club).
   - Kit: board; engine (legal moves for both sides, `threats`, P1, P2).

6. **`dir-compare` · The five side by side · direction · priority 2**
   - Shows: the five direction demos in one view, all at the same state, so the owner can compare.
   - States: the six shared states, one picker for all five frames.
   - Options: phone or desktop frames; two or five at a time.
   - Kit: the five direction pages (with `?state=` and `?frame=`).

**Features**

7. **`feat-first-minute` · Take your first shot · feature · priority 1**
   - Shows: the first visit, from the kings to the first real move, in under 30 s.
   - States: `title` (one button) · `shot-board` (the Archer and the pawn behind pieces) · `shot` (the shot flies over; "A clean shot.") · `grow` (the board grows into a full game) · `first-move` (the coach line leaves after your first move).
   - Options: with or without the chosen deal (an Archer and a Beast).
   - Kit: board; engine (the Archer lesson position, `newGame` with a seed); computer player (Beginner).

8. **`feat-home` · Home for a returning player · feature · priority 2**
   - Shows: the three home options from one set of data.
   - States: `first-visit` · `continue` (a game in play; the last move plays once) · `finished` (Rematch, Review last game) · `today` (the Today card) · `king-tap` (a king plays its power on a tiny board).
   - Options: A the table, B the six kings, C the Today card.
   - Kit: board (small, still); engine (a saved position, Today's army by date seed).

9. **`feat-new-game` · Quick play and Change · feature · priority 2**
   - Shows: one Play that starts at once, and the short sheet behind Change.
   - States: `play` (the Play button names the setup) · `change` (the sheet) · `powers` (your king picker; the other king as a summary row) · `faces` (levels as figures with names) · `more` (the folded label names what is not default) · `start` (the muster begins).
   - Options: levels as words or as faces.
   - Kit: engine (`kings`, `powerText`, `newGame`).

10. **`feat-muster` · The muster and first sight · feature · priority 1**
    - Shows: a new random army landing, the twins together, and the tags for new pieces.
    - States: `bare` (kings and pawns only) · `muster` (files land, a to h) · `mustered` ("Same army for both sides.") · `first-sight` (tags on new piece types) · `folded` (the tags fold into dots after the first move).
    - Options: flip in or rise up; normal or fast.
    - Kit: board; engine (`newGame` with a seed).

11. **`feat-hold-to-read` · Hold to read any piece · feature · priority 1**
    - Shows: the reach of any piece on the board, and its card at the edge.
    - States: `rest` · `own-archer` (crosshairs over pieces) · `enemy-archer` (works on their pieces) · `guard` (the shield: "Only a king can take it.") · `more` (the card grows into the Guide page) · `keyboard` (the cursor and the I key).
    - Options: the card at the edge or over the piece; the "?" lens.
    - Kit: board; engine (legal moves of a piece for either side, P1).

12. **`feat-your-move` · Verb marks, peek and choices · feature · priority 1**
    - Shows: what each target does before you play it.
    - States: `ogre` (the shove arrow) · `beast` (bites 1 and 2; "Bite again, or stop here") · `maester` (swap arrows) · `peek` (a ghost and danger rings) · `refusal` (the pawn onto the Guard: shield and one line) · `choice` (the Ogre's take or shove as two pictures at the square).
    - Options: peek on or off; marks or plain dots.
    - Kit: board; engine (legal, `describe`, `threats`; P1 and the Ogre lesson position).

13. **`feat-their-turn-check` · The tell, the breath and check · feature · priority 2**
    - Shows: the computer's turn with no spinner, and a check you can see.
    - States: `landed` (your move settles) · `thinking` (the portrait breathes; the ring after 1 s) · `tell` (their piece lifts) · `their-move` (the shot's cause line) · `check` (the line, the ember ring, the flinch) · `ways-out` (the escape squares, Coach only).
    - Options: the tell on or off; haptics on or off.
    - Kit: board; engine; computer player (the real reply), and the scripted Strike check from P1.

14. **`feat-move-story` · Chips, the story and the scrubber · feature · priority 1**
    - Shows: the owner's request: the transcript folded, fun to read, with icons and motion.
    - States: `chips` (the last five moves) · `ghost` (a tap on a chip replays it) · `story` (one sentence a move) · `key-moment` (a gold mark and the better move) · `scrub` (drag back through the game) · `back` (Back to game).
    - Options: chips or one sentence at rest; squares on or off; letters (Nf3) on or off.
    - Kit: board; engine (`describe` for each move); a recorded game of 30 to 40 moves with a shot, a chain and a shove (played by the computer player and saved); its key moments, worked out beforehand.

15. **`feat-king-powers` · The power coin and the reveal · feature · priority 1**
    - Shows: a spent power as a coin, the cast in three beats, their reveal, and an always-on power.
    - States: `ready` (the coin by your portrait) · `armed` (the targets as a wave from your king) · `preview` (ice on the held target) · `cast` (three beats; two pips: "Now make your move") · `spent` (the coin in stone, "Freeze · used") · `their-reveal` (Flame's emblem flips to Strike).
    - Options: the coin by the portrait or the portrait as the button; an always-on power (Spirit's Holy Light: the aura on hold).
    - Kit: board; engine with powers (P1: Frost Freeze against Flame Strike; a Holy Light position).

16. **`feat-help` · Hint, second look, rewind · feature · priority 2**
    - Shows: help that teaches, and Undo that shows what comes back.
    - States: `hint-1` (the piece glows) · `hint-2` (the ghost move) · `hint-3` (one line why) · `mistake` (the second look: Take it back, Keep it) · `rewind` (Undo plays backward) · `show-me` (after three refusals).
    - Options: the second look on or off.
    - Kit: board; engine (`threats`, `describe`); computer player (the hint, and the check for a large mistake).

17. **`feat-king-down` · The end, the result and the retry · feature · priority 1**
    - Shows: the one big moment of each game, and a kind way forward after a loss.
    - States: `blow` (the mating move) · `replay` (half speed) · `fall` (the king topples; "King Down") · `result` (the card with three key moments) · `retry` (after a loss: rewind to move N, the ghost of the better move) · `resign` ("Lay your king down?").
    - Options: loud (A) or quiet (B).
    - Kit: board; engine (P2, and a lost game for the retry); key moments (worked out beforehand with the computer player).

18. **`feat-menu-extra` · Menu, Extra, Tricks and Feel · feature · priority 2**
    - Shows: what folds, where, and how it calls.
    - States: `menu` (New game, Guide, Feel row, Resign, Extra) · `extra` (the cabinet of tiles) · `board-help` (switches with live mini previews) · `tricks` (found tricks in paint, the rest as silhouettes with riddles) · `seal` (a seal stamps and flies into the Menu) · `dot` (the Menu keeps a dot until opened).
    - Options: cabinet tiles or plain task rows.
    - Kit: board (small previews); engine for the seal moment (a Beast chain).

19. **`feat-lessons` · Four boards for one piece · feature · priority 2**
    - Shows: the Guard lesson as introduce, develop, twist and conclude.
    - States: `introduce` · `develop` · `twist` (take the Guard: refused with the shield) · `conclude` · `done` ("Guard learned"; Next, or Play a game) · `path` (the Coach path view).
    - Options: a path or a plain list; stars on or off.
    - Kit: board; engine (`lessons`, `lessonGoal`, new positions with `fromFen`).

20. **`feat-share` · The daily line and the poster · feature · priority 2**
    - Shows: a share that tells the shape of the game, not the moves.
    - States: `result` (a daily win) · `line` (the share line with verb marks) · `plain` (the plain-words choice) · `copied` (the check mark after a real copy) · `poster` (the 4:5 picture) · `saved`.
    - Options: emoji or the game's icons.
    - Kit: board (drawn to a canvas for the poster); engine (the final position and the moves for the marks).

**Future**

21. **`future-card-hand` · Card mode: the deal and the hand · future · priority 2**
    - Shows: where a hand of six cards lives without covering the board.
    - States: `deal` (six cards flip in) · `stack` (the hand at rest, a count) · `fan` (your turn; playable cards sit higher) · `armed` (a card marks its targets) · `played` (the reveal; a chip in the ribbon) · `waiting` (a card with a ring of turns left; Rage's gold glint).
    - Options: the hand under the nameplate, or cards as coins by the king.
    - Kit: board; engine card mode (`newGame` with `cards`, `hand`).

22. **`future-crowns` · Unlocks with crowns · future · priority 2**
    - Shows: the crown track, the silhouette and the unlock ritual of PROGRESSION.md.
    - States: `crown` (a win adds a crown on the result) · `track` (the pips; the Maester at 2) · `near` ("1 more crown") · `unlock` (paint fills the silhouette) · `try-it` (the one-minute lesson) · `shelf` (yours, met, locked).
    - Options: a fixed order or "choose your next piece" (owner question).
    - Kit: board and engine for the lesson (`lessons`); the silhouette as a filter on the real art.

23. **`future-online` · Turns with a friend · future · priority 3**
    - Shows: link games today and online play later: the catch-up, the four words, a dropped line.
    - States: `invite` (Send your turn) · `waiting` (two kings face each other; one true fact) · `previously` (their move plays once with one line) · `words` (Hello, Well played, Wow, Oops) · `away` (the board holds: "Waiting for Sam") · `result-both` (the result for both players).
    - Options: words on or off.
    - Kit: board; engine (replay of moves); the computer player as a stand-in friend.

24. **`future-workshop-share` · A Workshop piece as a card · future · priority 3**
    - Shows: a design that travels as a card and opens read-only.
    - States: `card` (figure, name, glyph, worth word) · `share` (the share sheet preview) · `received` (the read-only card) · `kept` (Keep a copy) · `test-board` (Try it on the test board).
    - Options: card or poster.
    - Kit: the Workshop figures in `assets/workshop/`; no engine (the Workshop rules are not in the kit).

### 6.4 Build order

1. The board in the kit: the painted board, a marks layer (dot, ring, crosshair, arrow, two-way arrow, number, shield), a ghost layer and a line layer, all with an end frame for reduced motion.
2. The five direction demos on one shared state machine (P1, the scripted line, P2), then `dir-compare`.
3. The strongest features: `feat-hold-to-read`, `feat-your-move`, `feat-king-powers`, `feat-move-story`, `feat-king-down`, `feat-muster`, `feat-first-minute`.
4. Then the rest of priority 2, then priority 3.

---

## 7. Owner questions this bank raises

Each line: the rule, the options, the pick, what happens on yes.

- **The first deal.** *The first game draws its random army from a chosen seed with an Archer and a Beast.* (A) Any random army; (B) a chosen seed. **Pick B.** On yes: one seed constant; the draw rule does not change.
- **Faces for levels.** *Each computer level shows a figure and a name from the real cast.* (A) Words only; (B) faces, look only. **Pick B for the demo; decide after it.** On yes: four figures and four names; the computer does not change.
- **Peek at Club and Strong.** *Peek shows the rules, never the computer's plan.* (A) Beginner and Casual only; (B) a switch at every level. **Pick B, off by default at Club and Strong.** On yes: one Board help switch.
- **Second look.** *After a large mistake at Beginner and Casual, the computer waits and offers Take it back.* (A) No; (B) yes. **Pick B.** On yes: one check after each move at those levels.
- **The next unlock.** *Crowns unlock pieces in a fixed order.* (A) Fixed (PROGRESSION.md); (B) the player chooses. **Pick A.** On yes: no change to the proposal.
- **The daily line.** *The share line shows the verbs of the game, not the moves.* (A) Emoji; (B) the game's own icons as an image; (C) plain words. **Pick A with C as a choice.** On yes: a mark for each verb.
