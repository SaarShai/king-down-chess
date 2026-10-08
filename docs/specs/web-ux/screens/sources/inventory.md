# King Down web app today: screens, controls and journeys

Source of the [spec](../spec.md), kept word for word. Written on 2026-10-08 for ticket 03, plan steps 1 and 2.

This map is for ticket 03 (menus, screens and user journeys): plan step 1 (inventory), plan step 2 (journeys) and the friction. It is read only. No file in the repository changed.

## How to read this map

- **Code.** On `claude/web-ux-sample`, the web app files are the same as on `main` (5a01a6b). Only the plugin and match files differ. The files are `index.html`, `src/main.ts`, `src/new-game.ts`, `src/powers-ui.ts`, `src/lessons.ts`, `src/account/account.ts`, `src/workshop/dialog.ts`, `src/workshop/sandbox.ts` and `src/style.css`.
- **Screenshots.** There are 143 shots of 23 screens at five sizes, from the same web app (`scratchpad/ux/shots/`). `texts.json` gives the visible words of each screen. The sizes are desktop 1440×900, laptop 1280×720, tablet 820×1180, phone 390×844 and landscape 844×390. Pixel positions are from the shots, so they are approximate.
- **The defects branch.** `claude/web-ux-defects` (ticket 01) is not on `main` yet. A "Defects branch:" note shows each control or journey that it changes.
- **Count rule.** One control is one button, radio choice, checkbox, select, slider, link or disclosure. A control that is off but still shows counts. Board squares and move-list entries are counted apart. One tap is one press on a control or a square. One scroll is one swipe to reach a control that is out of view. "External" is a step outside the app: the share sheet, a chat app, or the sign-in page.
- **Who needs it.**
  - **New:** a new player in the first session.
  - **Every:** every player in every game.
  - **Some:** some players or some games.
  - **Rare:** a few times, or once.
  - **Lab:** the designer or the tests only.

These labels come from the code and the three reviews. The owner decides the new homes.

## 1. The numbers

| Item | Today |
|---|---|
| Surfaces in the game | 10 kinds: title, game screen, New game, Settings, Delete account, Guide, Capture or push, Promotion (also Sacrifice), Result, browser boxes |
| Surfaces in the Workshop | 4 screens (Home, New piece, Editor, Try it), 1 panel, 8 sheets |
| Game screen controls | 7 fixed tiles. Up to 7 more show by state: Cancel selection, Finish chain, Next lesson, Return to game, Use power, End turn, Send the game link |
| Game screen text areas | 9 (`h1`, `#turn`, `#status`, `#asset-status`, `#move-help`, `#moment`, `#info`, `#power-status`, `#lesson-progress`), plus the move list and 2 "took" rows |
| New game | 32 different controls. 7 to 31 show, by mode. The army list has 14 entries |
| Settings | 14 controls (signed out, painted look). About 1100 px tall. 4 groups |
| Guide | 2 controls, 881 words, about 4085 px tall on a phone |
| Browser boxes (`confirm`, `prompt`, `alert`) | 9 (10 on the defects branch) |
| Single-key shortcuts | Z, R, Esc, ← →. On the board: arrows, Enter, Space |
| URL switches | 12 in the game, plus `?think=` on the defects branch |
| Taps from the first visit to the first move | 3 (Learn) or 4 (Play) |
| Taps from the first visit, through all 6 lessons, to the first game move | 24 |
| Taps to set Animations to Off | 4, plus 1 scroll on a phone |

## 2. Screen map

```text
Title (once per browser tab)                         #title-screen, full screen
├─ Continue · move N ─────────► Game screen (or Result, when that game is over)
├─ Learn the pieces ──────────► Game screen in lesson mode, lessons 1 to 6
│                                └─ after lesson 6: "Start a game" ─► New game
├─ Play ──────────────────────► New game ─► Game screen
├─ Workshop ──────────────────► Workshop, over the title ─► Back ─► Title
└─ Esc ───────────────────────► Game screen (the saved game, or a fresh one)

Game screen                                           #top, #board, #panel
├─ New game ─► New game dialog ─► (Custom army: browser prompt) ─► Game
├─ Guide ─► Guide dialog ─► Learn ─► lesson 1
├─ Workshop ─► Workshop, over the game
├─ Settings ─► Account ─► sign-in page (external) | Delete account dialog
├─ Hint · Undo · Resign ─► (Resign: browser confirm) ─► Result
├─ Use power · End turn (powers games) · Send the game link (two players)
├─ board ─► Capture or push · Promotion · Sacrifice (Sacrifice uses the Promotion dialog)
├─ a move in the list ─► review ─► tap the board, or Esc ─► the live game
└─ the game ends ─► Result: Rematch · New game · Close · key moments · Copy today's result

Game link   ?army=…&moves=… ─► (browser confirm) ─► Game screen in link mode, no title
Design link ?design=…       ─► Workshop editor, read only, no title
```

- No control goes back to the title. The title does not show again on a reload in the same tab.
- After Close, no control opens the Result again.

| Surface | Element | Kind | Opens from | Leaves to | Esc or a tap on the backdrop | Main action in view with no scroll (phone / landscape) |
|---|---|---|---|---|---|---|
| Title | `#title-screen` | Full-screen modal dialog | The page load, once per tab, never over a link | Game, lesson, New game, Workshop | Esc goes to the game. It has no backdrop | Yes / yes (the title scrolls on short screens) |
| Game screen | `body` | Page | — | — | Esc leaves review and clears the selection | — |
| New game | `#new-game` | Modal | Title Play, New game tile, lesson "Start a game" | Game | Cancel | Computer mode: yes / no. Powers mode: no / no |
| Settings | `#settings` | Modal | Settings tile | Game | Close | Close: no / no |
| Delete account | `#delete-account` | Modal | Settings → Account | Settings | Keep | Yes / yes |
| Guide | `#rules` | Modal | Guide tile | Game, or lesson 1 | Close | Close: no / no |
| Capture or push | `#move-choice` | Modal | A tap by the Ogre when both moves are legal | Game | Cancels the move | Yes / yes |
| Promotion, Sacrifice | `#promo` | Modal | A pawn on the last rank; the Sacrifice power | Game | Cancels the move | Yes / no |
| Result | `#over` | Modal | Mate, a draw, Resign, Continue of a finished game | Game (by Rematch, New game, Close or a key moment) | Close | Yes / yes |
| Browser boxes | `confirm`, `prompt`, `alert` | Browser | See 3.12 | — | — | — |
| Workshop | `#workshop` | Full-screen modal | Title, Workshop tile, `?design=` | Its caller | Esc closes the top layer | Yes |
| Sign-in page | Google or GitHub | External | Settings → Account | The app with `?code=` | — | — |
| Privacy, Terms | `public/privacy.html`, `terms.html` | New tab | Settings → Account | — | — | — |

## 3. Inventory

### 3.1 Title (`#title-screen`)

| # | Element | What it does | Shows when | Who | How often | Place today |
|---|---|---|---|---|---|---|
| T1 | `.title-stage`: stone floor, 6 king figures | Art. Each king plays his element effect, except with Animations Off | Always | — | Each visit | Top half |
| T2 | `.title-lineup`: 12 figures, each with its icon and name | Shows every piece. A mouse lifts a figure. A tap does nothing (C:ONB-18) | Always | New | Each visit | Middle. Phone: 2 rows of 6. Landscape: 1 row of 12 |
| T3 | `#title-word` "King Down Chess" | The wordmark (h1) | Always | — | — | Under the lineup |
| T4 | `#title-continue` "Continue · move N" | Opens the saved game, or the Result when that game is over | A saved game has 1 or more moves. Then it is primary and has the focus | Every (returning) | Each visit | First button |
| T5 | `#title-learn` "Learn the pieces" | Starts lesson 1 | Always. It is primary and first on a first visit only | New | Once | 1st on a first visit, else 2nd |
| T6 | `#title-play` "Play" | Opens New game over the saved game | Always. Primary when the save has 0 moves | Every | Each visit | 2nd or 3rd |
| T7 | `#title-workshop` "Workshop" | Opens the Workshop over the title | Always | Rare | — | Last button, same size as Play |
| T8 | Esc key | Closes the title and goes to the game. On a first visit this skips the lessons (C:SET-M5) | Always | — | — | Key |

Count: 3 buttons on a first visit, 4 for a returning player. Words: 20 or 24.

### 3.2 Game screen: the header (`#top`)

| # | Element | What it does | Shows when | Who | How often | Place today |
|---|---|---|---|---|---|---|
| G1 | `#top h1` "KING DOWN CHESS" | Brand | Always | — | — | Desktop and tablet: a card fixed at the top left, over the floor; the board gets 64 px of top padding. Phone: a 58 px bar above the board. Landscape: the card covers rank 8 (C:PLAY-M4) |
| G2 | `#turn` | "White to move", "White to move — CHECK" (red), "Lesson 1 of 6: Archer", "Reviewing after 5… a5-a4". Empty when the game is over | Always | Every | Each move | Under G1 |
| G3 | `#status` | "thinking…", the result ("White resigns — Black wins"), the draw reason | The computer thinks; the game is over | Every | Each move | Under G2. Desktop: a new line. Phone: the same line |
| G4 | `#asset-status` | "Loading pieces…", or the load error | Load; error | — | Each load | Under G3 |

### 3.3 Game screen: the board (`#board`)

**What the player does on the board**

| # | Gesture | Result | Who | How often |
|---|---|---|---|---|
| B1 | Tap one of your pieces | Selects it. Its markers pop in. The card and the help line show (`#info`, `#move-help`) | Every | Each move |
| B2 | Tap a marked square | Plays the move, or the next step of a Beast chain or a Reaver capture | Every | Each move |
| B3 | Drag a piece to a square | Plays the move | Some | — |
| B4 | Tap the selected piece again, or Esc | Clears the selection | Some | — |
| B5 | Tap an enemy piece | Main: a refusal ("That is Black's rook. White to move: choose one of your own pieces."). Defects branch: the enemy piece's card (D-10) | New | — |
| B6 | Tap during an animation | Skips it. While the computer thinks: "The computer is thinking. Wait for its move." | Some | — |
| B7 | Tap in review | Goes back to the live game | Some | — |
| B8 | Tap after the end | "The game is over. Start a new game, or Undo to take back a move." | Some | — |
| B9 | Mouse pointer over a square | A see-through copy of the piece on the target. A capture marker turns gold. The card of the piece under the pointer. `#moment` gives a preview line for a special move | New (desktop only) | Each move |
| B10 | Shift-click a neighbour of the Ogre | Pushes with no Capture-or-push dialog | Lab, expert | Rare |
| B11 | Keyboard: Tab to the board, arrows, Enter or Space, Shift+Enter | Plays by keyboard. `#cursor-say` speaks the square | Some | — |

**Marks on the board**

| # | Mark | Notes |
|---|---|---|
| M1 | Move markers: a gold gem (move), crimson brackets (capture), a gun-sight (archer shot), violet arrows (swap), teal chevrons (shove), a blue rune (power) | Round 2, approved |
| M2 | Selected piece: a warm glow and a gold ring | — |
| M3 | Last move: a wash on the square the piece reached, not on its start square | The owner's rule, 2026-10-04 |
| M4 | Check: a red ring at the king. `#turn` turns red | — |
| M5 | Hint: two gold boxes (from and to), with no words | — |
| M6 | Threats (Settings → Show threats): a red ring on each threatened piece, a red dot on each covered square | Off by default |
| M7 | Coordinates, about 10 px | Settings. On by default |
| M8 | Piece letters | Settings. Off by default |
| M9 | Keyboard cursor box | Keyboard only |
| M10 | The losing king topples at the end | — |
| M11 | A frozen or walled piece | No mark today (C:PW-1) |

### 3.4 Game screen: the panel (`#panel`)

The rows go from top to bottom in page order. On desktop the panel is a rail, about 270 px wide and full height, and it scrolls. On a phone it is under the board.

| # | Element | What it does | Shows when | Who | How often | Place today |
|---|---|---|---|---|---|---|
| P1 | `#new-game-btn` "New game" | Opens New game | Always | Every | Each game | Row 1, tile 1 |
| P2 | `#rules-btn` "Guide" (tooltip "How each piece moves") | Opens the Guide | Always | New, some | Rare after the lessons | Row 1, tile 2 |
| P3 | `#workshop-btn` "Workshop" | Opens the Workshop | Always | Rare | Rare | Row 1, tile 3 |
| P4 | `#settings-btn` "Settings" | Opens Settings | Always | Rare | Once or twice | Row 1, tile 4 |
| P5 | `#hint` "Hint" | Thinks 0.4 s, then two gold boxes mark one move. It is off on the other side's turn, in review, after the end, and during an animation | Always | New, some | Every few moves (new players) | Row 2, tile 1 |
| P6 | `#undo` "Undo" (key Z) | Takes back 1 ply, or 2 against the computer. It stays on in review and after the end | Always | Some | Some games | Row 2, tile 2 |
| P7 | `#resign` "Resign" | Opens a browser confirm, then the Result. Off after the end and in a lesson. Main: on while the computer thinks (D-1) | Always | Rare | Some games | Row 2, tile 3, beside Undo |
| P8 | `#lesson-progress`: 6 piece icons | Shows the lesson progress. The icons are not buttons | Lesson | New | — | Under row 1 |
| P9 | `#move-help`: the help line (a live region) | "Tap a marked square to move or capture.", help for one piece (Ogre, Archer, Maester, Beast, Paladin, Catapult, Reaver), refusals ("Not allowed: …"), the review help, the link-game turn line | A selection, a refused tap, review, a link game after your move | New | Each selection | A gold box under row 1. It pushes all the rows under it down |
| P10 | `#cancel-selection` "Cancel selection" | Clears the selection. A second tap or Esc does the same | A piece is selected | Rare | — | Under P9 |
| P11 | `#stop-chain` "Finish chain (n captures)" or "Finish capture here" | Ends a Beast chain or a Reaver capture early | During a chain | Some | Rare | Beside P10 |
| P12 | `#moment`: the caption | The first time in a game that each special move plays ("The archer shot without moving."); the lesson task and its result; the mouse preview; the note of an example army; "Loaded your newer saved game from your account." | Some | Some | — | Under P10. In a lesson: a card with a crimson edge |
| P13 | `#next-lesson` "Next lesson: Guard" … "Start a game" | Starts the next lesson. After lesson 6 it opens New game | The lesson goal is done | New | 6 times | Under P12, primary |
| P14 | `#return-game` "Return to game" | Leaves the lessons and opens the game they keep | All lessons | New | Once | Under P13 |
| P15 | `#info`: the piece card | Icon, "White Pawn", the full rules (moves, captures, special). In a powers game it also always shows 2 lines of the kings' powers (about 60 words) | Mouse over a piece or a selection. Always in a powers game | New | Each selection | Between P12 and row 2. It pushes row 2 down by 95 to 243 px |
| P16 | `#power-btn` "Use Freeze (1 left)", "Cancel Freeze", "Use Freeze (from move N)" | Arms the power | A powers game, live, with a power you spend (not March, Leap or an always-on power) | Some | 1 or 2 per game | Under row 2, half width. On the computer's turn it shows the computer's power, off (C:PW-3). At 0 uses it stays as a dead button (C:PW-9) |
| P17 | `#end-haste` "End turn" | Ends a Haste turn, or the turn after a free mark | During such a turn | Rare | — | Beside P16 |
| P18 | `#power-status` | The armed step ("Tap an enemy piece to freeze it for one turn."), or the line during a turn | A power is armed, or a turn is not finished | Some | — | Under P16 |
| P19 | `#share` "Send the game link" | Phone: the system share sheet. Other screens: copies the link and shows "Link copied. Paste it to your friend." for 2.5 s | Both sides are people, 1 or more moves, not a lesson. This includes one-device games | Some | Each turn of a link game | Full width, under P18 |
| P20 | `#moves`: the move list | See 3.6 | Always | Rare during play | — | Fills the rest of the rail |
| P21 | `.taken` "White took" and "Black took" | Captured pieces as grouped icons, "—" when none | Always | Some | A look now and then | Under the list |
| P22 | `#hover` | The square name under the pointer, for a test tool | Never visible | Lab | — | — |
| P23 | `#announce`, `#cursor-say` | For screen readers: each move as a sentence, and the cursor square | Off screen | Some | — | — |

Defects branch: P7 is off while the computer thinks and always names your side. A tap on an enemy piece shows its card (B5). Hint offers only moves that the game takes now.

**Where the panel parts sit (y in px)**

| State | Phone 390×844 | Desktop 1440×900 (rail) |
|---|---|---|
| Idle | Header 0–58, board 58–450, row 1 462–522, row 2 535–595, list 607–770, took rows 778–830 | Row 1 12–82, row 2 95–153, list 165–826, took rows 845–876. The header card is at x 10–293, y 10–90. The board is at y 120–888 |
| Pawn selected | Help 535–572, Cancel 585–630, card 643–718, row 2 733–793 (198 px lower), list from 805, mostly off the screen | Row 2 moves 243 px down (C) |
| Powers game | Kings card 535–617, row 2 657–717, Use Freeze 737–780, list from 797 (cut) | — |
| Lesson | Strip 532–566, task 578–642, Return to game 657–698, row 2 712–772, list from 785 | Strip, task, Return to game, row 2, then an empty list ("No moves yet") of about 460 px |

### 3.5 Game screen: its states

| State | How it starts | What changes | Controls that show | Words (texts.json) |
|---|---|---|---|---|
| Idle | — | — | 7 | 21 |
| Piece selected | Tap one of your pieces | P9, P10 and P15 show. Row 2 moves | 8 (9 during a chain) | 52 |
| The computer thinks | Your move ends | G3 "thinking…". Hint is off | 7 | 21 |
| Hint shown | Hint | M5: two gold boxes | 7 | 21 |
| Lesson | Learn (title or Guide) | G2 "Lesson n of 6: X". P8, the P12 card and P14 show. Undo and Resign are off. The list says "No moves yet". The took rows say "—". The 4 menu tiles stay | 8, 9 after the goal | 36 |
| Review | Tap a move, or a key moment | G2 "Reviewing after 1. e2-e4". P9: "Tap the board to return to the game. ← → step through the moves." Hint is off. Undo and Resign stay on and act on the live game. The card and the took rows show the live game (D-3) | 7 | 30 (phone), 36 (desktop) |
| Powers game | The Kings' powers mode | P15 always shows (2 rules). P16 to P18 show | 8 or 9 | 83; 91 when armed |
| Two players, one device | The Two players mode | P19 shows after move 1. The board never turns | 8 | 50 |
| Link game | Opening a game link | The board turns to this device's side. After your move P9 says "Your move is played. Send the game link so your friend can answer." | 8 | — |
| Game over | Mate, a draw, Resign | G2 is empty. G3 shows the result. The Result dialog opens. Resign and Hint are off. Undo stays on | 7 | — |
| Loading | The first paint | G4 "Loading pieces…" | — | — |

### 3.6 The move list (the "play-by-play transcript")

| Property | Today |
|---|---|
| Element | `section.sheet`: `ol#moves` and the 2 `.taken` rows |
| Place and size | Desktop 1440×900: about 243 × 660 px (y 165–826), the largest block of the rail, about 70% of its height. Tablet 820×1180: about 240 × 940 px, taller than the board (512 px). Phone 390×844: about 365 × 165 px, under Hint, Undo and Resign. A selection pushes it off the screen. Landscape 844×390: about 240 × 150 px |
| Empty state | "No moves yet" in italic. The empty box still fills the rail (C:VIS-13) |
| Content | One line per turn ("1. e2-e4 e7-e5"). White's move is bold. A Haste turn keeps its 2 plies on one line. After the game, "?" or "??" follows a key-moment move |
| Notation (LAN) | A piece letter, none for a pawn: N knight, B bishop, R rook, Q queen, K king, A archer, L paladin, G guard, M maester, S beast, O ogre (C, V and T are lab pieces). Signs: `-` moves, `x` captures, `*` shoots without moving, `<>` swaps, `>` shoves (then where the shoved piece went), `=` promotes. Powers: `!` Strike, `!H` Haste, `--` ends a Haste turn, `~` Flight, `!F:` Freeze, `!W:` Ice Wall, `!S:` Sacrifice, `!M` March, `!L` Leap. Examples: `Ae3*c5`, `Mh8<>g7`, `!F:c7`. One paragraph in the Guide explains the signs (`#rules-notation`) |
| What a tap does | Each ply is a button. A tap opens review at the board after that ply. One step forward plays the move again. Desktop: ← and → step. Touch: no step buttons (C:PLAY-6) |
| Motion | None. A new entry shows at once, and the list scrolls to the end |
| Row height | Desktop about 22 px (C:PLAY-15). Phone 44 px |
| LAN also shows in | The review header ("Reviewing after 5… a5-a4"), the Result ("Last move e7-e5."), the key moments ("12. Ae3*c5: White gave away about 3 pawns. Better: Qd1-d2."), Copy moves, and the game link URL |
| Plain words that exist now | `describeMove()` (`src/move-text.ts`) makes one sentence per move for the screen reader, for example "White pawn e2 to e4.", "White archer on e3 takes the bishop on c5 without moving.", "White freezes the black knight on c7." `momentText()` (`src/moment.ts`) gives one caption per kind of special move, once per game, for example "The ogre shoved a piece." |
| Art that exists now | Piece icons in `public/ui/icons/<piece>.svg`, in each army's colour (`src/piece-icons.ts`). King emblems in `public/ui/emblems/`. King figures in `public/ui/kings/` |
| Captured rows | "White took" and "Black took" use grouped icons in each army's colours, with "—" when empty. They count the whole game, also in review (D-3) |

### 3.7 New game (`#new-game`)

| # | Element | What it does | Shows when | Who | How often | Place today |
|---|---|---|---|---|---|---|
| N1 | `h2` "New game" | Title | Always | — | — | Top |
| N2 | Mode card "Play the computer" (radio) | You against the computer, with no powers | Always | Every | Each game | Card 1 |
| N3 | Mode card "Kings' powers" (radio) | Against the computer. Each king brings one power. Opens the king picker | Always | Some | — | Card 2 |
| N4 | Mode card "Two players" (radio) | One device, or the game link | Always | Some | — | Card 3 |
| N5 | Level row, 4 radios: Beginner, Casual, Club (default), Strong | The computer's level. Its meaning is only in a tooltip. Main: "…Strong uses the full thinking time in Settings…" | Not in Two players | Every (against the computer) | Each game | Under the cards |
| N6 | `#two-powers` "Kings' powers" checkbox | Powers in a two-player game | Two players only | Some | — | In place of N5 |
| N7 | King picker, one per side (`#pick-0`, `#pick-1`) | A heading ("White's king · you" or "Black's king · computer"), 6 emblem buttons (Frost, Flame, Stratus, Mud, Spirit, Shadow), 2 power buttons with a moving picture, "No power", and one rule line. 9 controls per side, 18 in all | Powers on | Some | — | Under N5. Both pickers are open |
| N8 | `#more-options` "More options" | A disclosure, closed | Always | Some | — | Under the picker |
| N9 | "You play": White or Black (2 radios) | Your side against the computer | More options open, not Two players | Some | — | In More options |
| N10 | `#army` select, 14 options | Random King Down army (default); Today's army, the same for everyone; Chess starting army; Custom army…; then "Example armies": MMSSNBNK, KGBMSSMB, NKBBMGQS, QNKMNRSG, SQBKRSML, Ogre practice, COAQNRBK — Catapult lab, CSAQNRBK — Catapult lab, CGAQNRBK — Catapult lab, QOGNRKBA | More options open | Random: Every. Today's, Chess: Some. Custom, the 5 codes, Ogre practice, Catapult, QOGNRKBA: Lab | — | In More options |
| N11 | `#army-note` | "Example armies are hand-picked to explore. Catapult ones use an experimental piece." | More options open | Lab | — | Under N10 |
| N12 | Cancel | Drops the changes | Always | — | — | Footer, at the end of the dialog |
| N13 | Start game | Starts the game and keeps the setup. Custom army first opens a browser prompt. Defects branch: a browser confirm when the new game replaces an unfinished game with a move | Always | Every | Each game | Footer. Out of view in the powers mode at all sizes, and in landscape |

Counts by mode (More options closed / open): computer 10 / 13; powers 28 / 31; two players 7 / 8; two players with powers 25 / 26. The dialog keeps the last setup (`localStorage['kingdown.new-game']`).

### 3.8 Settings (`#settings`) and Account

| # | Element | What it does | Shows when | Who | How often | Place today |
|---|---|---|---|---|---|---|
| S1 | Sound (checkbox, on) | Sounds on or off | Always | Rare | Once | Play group, row 1 |
| S2 | Always promote to queen (checkbox, off) | Skips the promotion dialog when queen, rook, bishop or knight is the choice. Help is in a tooltip | Always | Rare (expert) | Once | Play, row 2 |
| S3 | Show threats (checkbox, off), with a note of 24 words | Threat marks (M6) | Always | Some (learners) | Once | Play, row 3 |
| S4 | Animations select: Normal, Fast, Off, with the note "Tap the board to skip an animation." | The pace of the board and the title. Off also stops the New game pictures. Reduced motion picks Off when no choice is saved | Always | Rare | Once | Play, row 4 |
| S5 | Look select: Painted 2D, Clay 3D | Reloads the page with `?look=` | Always | Lab | — | Board group, row 1 |
| S6 | Piece letters (checkbox, off) | Letter chips on the board. Main: not saved (D-8). The defects branch saves it | Always | Rare | — | Board, row 2 |
| S7 | Coordinates (checkbox, on) | Shows the coordinates | Always | Rare | — | Board, row 3 |
| S8 | Thinking time (slider, 200–4000 ms, default 800) | The thinking time of Strong only. It shows no value. The defects branch removes it | Always | Lab | — | Board, row 4 |
| S9 | Reset view (R) | Resets the Clay camera | Clay look only | Lab | — | Board, row 5 |
| S10 | "This game": Setup with the army code (for example SQBKRSML; the tooltip holds the FEN) | Shows the army code | Always | Lab | — | Group 3 |
| S11 | Copy moves | Copies the LAN move list. Main: no feedback | Always | Rare, Lab | — | Group 3 |
| S12 | Account, signed out: "Sign in to save your games on every device.", Continue with Google, Continue with GitHub (Facebook only with `?facebook=1`), a privacy note, Privacy link, Terms link | Sign-in leaves the app | The account module is loaded (hidden when offline) | Rare | Once | Group 4 |
| S13 | Account, signed in: picture, name, "Signed in with Google", a note, Sign out, Delete my account, Privacy, Terms | — | Signed in | Rare | — | Group 4 |
| S14 | `#account-note` | "Opening Google…", "Signed out. Your games stay on this device.", errors | After an account action | — | — | Under group 4 |
| S15 | Close | Closes the dialog | Always | — | — | At the end. Out of view on a phone and in landscape |
| D1 | `#delete-account` "Delete your account?" with 50 words of text | Asks before it deletes | Delete my account | Rare | — | Modal over Settings |
| D2 | "Keep my account" | Keeps the account | — | — | — | Dialog footer |
| D3 | "Delete my account" (primary) | Deletes the account | — | — | — | Dialog footer |

Count: 14 controls (signed out, painted look). Clay adds 1. The defects branch removes 1. Words: 94.

### 3.9 Guide (`#rules`), titled "King Down pieces"

| # | Element | What it does | Who | Place today |
|---|---|---|---|---|
| R1 | `#learn` "Learn the six King Down pieces by playing, one move each" (primary) | Starts lesson 1, always lesson 1 | New | Top |
| R2 | `#rules-lead` | A rules summary of 29 words ("Mate the king. … No castling or en passant. …") | New | Under R1 |
| R3 | 12 piece cards: figure, icon, name, Moves, Captures, Special | In the order Pawn, Knight, Bishop, Rook, Queen, King, Archer, Paladin, Guard, Maester, Beast, Ogre. A lab piece joins when it is in the pool or on the board. On a phone the first King Down piece (Archer) starts at about 1260 px | New, some | Middle |
| R4 | `#rules-letters` | The draw pool as icons with counts | Lab, some | Under the cards |
| R5 | `#rules-notation` | The letters and signs of the move list | Lab, expert | Under R4 |
| R6 | "Kings' powers": `#powers-guide` and `#powers-list` | 6 kings × 2 powers, with use counts and rules | Some | Under R5 |
| R7 | Close | Closes the dialog | — | At the end of about 4085 px on a phone |

Count: 2 controls, 881 words.

### 3.10 Choices during a move

| # | Dialog | Content | Controls | Who |
|---|---|---|---|---|
| C1 | `#move-choice` "Capture or push?" | The sentence "Capture removes the enemy on c5. Push moves it to c6 and moves your Ogre to c5." | Capture on c5 (primary), Push to c6 (primary), Cancel | Some (Ogre) |
| C2 | `#promo` "Promote the pawn on a8" | One button per piece, with its painted figure, icon and name | 4 choices (more under other promotion rules), Cancel. S2 skips this dialog | Some |
| C3 | `#promo`, reused for "Sacrifice the pawn on X: which piece returns?" | One button per lost piece | n choices, Cancel | Some (powers) |

### 3.11 Result (`#over`)

| # | Element | What it does | Shows when | Who |
|---|---|---|---|---|
| O1 | `.over-art`: the two painted kings | The loser topples (500 ms, after 150 ms) | Always | — |
| O2 | `#over-title` | "White resigns — Black wins", "White wins by checkmate", "Draw by stalemate"… It names colours, also in a game against the computer | Always | Every |
| O3 | `#over-detail` | "Last move e7-e5. That side gave up. 1 move · setup SQBKRSML": LAN and the army code | Always | — |
| O4 | `#over-moments` | "Finding the key moments…", then "Key moments" with up to 3 buttons, or "No move gave away 2 pawns or more." A button closes the Result and opens review before that move, with the better move marked | Always | Some |
| O5 | `#share-result` "Copy today's result" → "Result copied" | Copies a line of text with the army code and the URL | Daily game only | Some |
| O6 | Rematch (primary) | Same army, colours swapped, same level and kings | Always | Every |
| O7 | New game | Starts a game at once with a random army. It keeps the mode, level and kings, and drops the saved army. It does not open the New game dialog | Always | Some |
| O8 | Close (quiet) | Shows the finished board. Nothing opens the Result again | Always | Some |

The Result opens on the last move, in the same moment as the king's fall on the board (motion review H3). Controls: 3 to 7. Words: 29.

### 3.12 Browser boxes

| # | Box | Text | When |
|---|---|---|---|
| X1 | `confirm` | "Resign as White?" | Each Resign |
| X2 | `confirm` | "Open the game from this link? It replaces your current game." | A link opens while a different saved game has moves |
| X3 | `prompt` | "Back rank (8 letters, one K; current draw pool …):" | Custom army |
| X4 | `alert` | "One Beast per army." | Custom army |
| X5 | `alert` | The engine's error text | A Custom army that is not valid |
| X6 | `alert` | "The Workshop could not load. Check the connection and try again." | Workshop offline |
| X7 | `alert` | "Part of this game link could not be read; the game stops before that move." | A broken link |
| X8 | `alert` | "This game link could not be read: …" | A broken link |
| X9 | `alert` | "Bad fen: …" | `?fen=` |
| X10 | `confirm` (defects branch only) | "Start a new game? It replaces your current game." | Start game over an unfinished game with a move |

### 3.13 Workshop (`#workshop`, revision 3, approved 2026-10-07)

The Workshop is full screen. It opens over its caller, and Back closes it.

| Screen | Controls and content | Count |
|---|---|---|
| Home | Back, "New piece" (a door with a figure), Surprise me, one tile per saved design (0 to 50). Text: "Your designs (n), on this device", the empty-shelf line, a line for designs it cannot read | 3 + n |
| New piece | Back ("Workshop"), the lead line, 34 figure buttons | 35 |
| Editor | Header: Back ("Workshop"), "Your piece", the save state ("Saved on this device", "New piece", "From a link", "Not saved"), Share. Piece card: model, worth gauge, name, Change name (pen), Choose appearance (eye), "Estimated worth · n pawns", the band word. Boards: "Apply to" select (All sides, Left and right, One square), Moves board (48 cells), Takes board (48 cells), "Take by" select (Moving there, Shooting), "Sliding directions" disclosure (8 arrows). Properties: up to 3 rule cards (× and 1 to 3 choice pills each), + Add a property. Footer: Undo, Why this estimate?, Try it. From a design link: Keep a copy | 11 fixed controls + 96 cells (+8 arrows, +2 to 4 per rule) |
| Appearance panel (eye) | 3 suggested figures, the "All 34 figures" disclosure, the "Show" filter (All, Fast, Strong, Ranged, Magic, Support), 34 figures, Army: Ivory or Charcoal | About 41 |
| Sheets | Add a property (a key disclosure, 10 rules in 6 groups, ×). A pill's choices (radios, Apply, ×). When (radios, More choices, a "Next to your" select, From move and Before move numbers, Apply). Why this estimate? (reasons, fix buttons, Keep it, Undo last change, Close). Share this piece (Send link, Copy link, Copy as text, Make a copy or Keep a copy, Delete, Close). Delete X? (Delete, Keep, Close). Delete one design (Delete per design, Close). Copy this (a text box, Close). A "Not saved" bar (Choose one to delete or Try again, Copy link). A toast | — |
| Try it | Back, Reset, a 64-square board, a help line, the move count, Shuffle, Finish (chain), "+5 moves" (timed rules), "Pretend your opponent played a card" (card rules), choice buttons (promotion, move kinds) | 3 to 7 + 64 squares |

Keys: Esc closes the top sheet, then the choices panel, then the Workshop. Ctrl or Cmd+Z undoes. Arrows move on the boards. A Workshop piece cannot join a game (C:PW-10).

### 3.14 Keys and URL switches

| Key | Where | What it does | Who |
|---|---|---|---|
| Esc | Game | Skips an animation, leaves review, clears the selection, disarms a power | Some |
| Z | Game | Undo. It also works under the Result and Promotion dialogs (D-6) | Some |
| R | Game | Resets the Clay view | Lab |
| ← → | Game | Steps through the moves. Desktop help says so; touch has no buttons | Some |
| Arrows, Enter, Space, Shift+Enter | Board with focus | Keyboard play | Some |

| URL switch | What it does | Who |
|---|---|---|
| `?rules=2017` or `2021` | An older rule set | Lab |
| `?kings=frost:freeze,mud:march` | Kings and powers | Lab, game links |
| `?look=clay` | Clay 3D | Lab |
| `?labels=1` | Piece letters on | Lab |
| `?players=human,ai` | Who plays | Lab, tests |
| `?title=0` | No title | Lab, tests |
| `?fen=` | A position | Lab |
| `?army=…&moves=…` | A game link | Some |
| `?design=` | A Workshop design link | Some |
| `?facebook=1` | Facebook sign-in | Lab |
| `?error`, `?code` | Sign-in return | — |
| `?study` (dev builds only) | The render study | Lab |
| `?think=` (defects branch) | A shorter thinking time for tests | Lab |

### 3.15 Counts per screen

| Screen | Controls | Text blocks | Words |
|---|---|---|---|
| Title | 3 or 4 | 2 (12 names, wordmark) | 20 or 24 |
| Game, idle | 7 + move buttons | 3 + 2 took rows | 21 |
| Game, piece selected | 8 or 9 | 5 or 6 | 52 |
| Game, powers | 8 or 9 | 6 | 83; 91 armed |
| Game, lesson | 8 or 9 | 4 + the lesson strip | 36 |
| Game, review | 7 (Hint off) | 4 | 30 to 36 |
| Game, two players after a move | 8 | 4 | 50 |
| New game | 7 to 31 by mode (see 3.7) | 3 to 6 | 49 (computer), 101 (More open), 137 to 139 (powers), 50 (two players) |
| Settings | 14 | 4 group heads + 2 notes + Account text | 94 |
| Delete account | 2 | 1 | 55 |
| Guide | 2 | 5 sections, 12 cards | 881 |
| Capture or push | 3 | 1 | 27 |
| Promotion | 5 | — | 10 |
| Result | 3 to 7 | 3 | 29 |
| Workshop Home | 3 + n | 2 | 23 |
| Workshop New piece | 35 | 1 | About 40 |
| Workshop Editor | 11 + 96 cells (+ rules) | 5 | — |
| Workshop Try it | 3 to 7 + 64 squares | 2 | — |

### 3.16 Who needs what

This table feeds the "Extra" decision. It groups the elements by the label in the "Who" columns above.

| Who | Elements | Count |
|---|---|---|
| Every | Board play B1–B4, markers M1–M4, turn line G2, status G3, New game (between games) P1, Undo P6, mode card N2, level N5, Start game N13, Result O1, O2 and O6 (Rematch), title Continue and Play T4 and T6 | About 17 |
| New | Learn T5 and R1, lessons P8, P12, P13 and P14, help line P9, piece card P15 and B9, Guide P2, R2 and R3, Show threats S3, tap on an enemy piece B5 | About 14 |
| Some | Hint P5, Resign P7, Finish chain P11, powers P16–P18, Send the game link P19, took rows P21, the move list and review P20, modes N3 and N4, the two-player powers box N6, the king picker N7, More options N8, side N9, Today's army and Chess army (in N10), key moments O4, Copy today's result O5, Result New game O7, Close O8, the powers list R6, Capture or push C1, Promotion C2, Sacrifice C3 | About 25 |
| Rare | Workshop T7 and P3, Settings P4, Cancel selection P10, Sound S1, Always promote S2, Animations S4, Piece letters S6, Coordinates S7, Copy moves S11, Account S12–S14, Delete account D1–D3, draw pool R4 | About 15 |
| Lab | Look (Clay 3D) S5, Thinking time S8, Reset view S9, the army code S10, Custom army with its browser prompt and alerts (N10, X3–X5), 5 army codes, Ogre practice, 3 Catapult armies and QOGNRKBA (N10), the army note N11, the notation key R5, Shift-click push B10, `#hover` P22, the R key, all URL switches except links | About 20 |

The Lab and Rare rows hold about 35 of about 90 player-facing elements. Today they share places and weights with the Every rows. Settings mixes Rare and Lab items (6 of its 14 controls are Lab or "This game"). New game puts 10 Lab armies in the same select as Random, Today's and Chess.

## 4. Journeys today

### 4.0 Summary

| # | Journey | Taps today | Surfaces, in order | Browser boxes | Phone scrolls | Words read before the goal |
|---|---|---|---|---|---|---|
| J1a | First visit: title to the first move, by Learn | 3 | Title → lesson | 0 | 0 | About 100 |
| J1b | First visit: title to the first move, by Play | 4 | Title → New game → game | 0 | 0 | About 140 |
| J1c | First visit: to the end of lesson 1 | 3 (the same as J1a) | Title → lesson | 0 | 0 | About 100 |
| J1d | First visit: all 6 lessons, then the first game move | 24 | Title → lesson ×6 → Capture or push → New game → game | 0 | 0 | About 330 |
| J2 | Returning player: continue a game | 1 (0 on a reload in the same tab) | Title → game | 0 | 0 | 24 |
| J3 | Chess player: a Strong game | 3. On main, 6 for a Strong that differs from Club. Defects branch: 3 or 4 | Title → New game → game (→ Settings on main) | 0 (defects: 0 or 1) | 0 (main, slider path: 2) | About 75 |
| J4 | Two players on one device | 3 | Title → New game → game | 0 | 0 | About 75 |
| J5 | A game by link: the first send, then each turn | 6 + 2 external, then 3 + 2 external per turn | Title → New game → game → share sheet → chat → friend's game | Sender 0, receiver 0 or 1 | 0 | About 125 |
| J6 | A powers game: start, and the first use of a power | 8 | Title → New game (powers) → game | 0 | 1 | About 340 |
| J7 | The daily game | 5, plus 1 to copy the result | Title → New game (More options) → game → Result | 0 | 0 (landscape: 1) | About 125 |
| J8 | Workshop: try a piece | 5 (Surprise me) or 7 (New piece). 3 Backs to leave | Title → Workshop Home → (figures) → Editor → Try it | 0 | 0 | About 60 |
| J9 | Review a finished game | 1 or 2 to the first position, then 1 per move on touch | Result → game in review | 0 | 1 per 4 moves in the list | About 40 |
| J10 | Set Animations Off; set Sound off | 4; 3 | Game → Settings → game | 0 | 1 | 94 |
| J11 | Resign | 2 | Game → browser confirm → Result | 1 | 0 | About 35 |
| J12 | Rematch | 1 | Result → game | 0 | 0 | 29 |
| J13 | Extra: read the rules of a piece | Desktop 0; touch 1 (own piece) or 2 + scrolls (enemy piece, main) | Game (→ Guide) | 0 | 3 to 10 | 30 to 881 |
| J14 | Extra: sign in | 2 + external | Game → Settings → sign-in page → game | 0 | 1 | 94 |

### J1a. First visit, by Learn, to the first move (also J1c, the end of lesson 1)

| Step | Surface | Player action | Taps | What the player reads or meets |
|---|---|---|---|---|
| 1 | Title (first visit) | Taps "Learn the pieces" (primary, with the focus) | 1 | 12 names, the wordmark, 3 buttons (20 words) |
| 2 | Game screen, "Lesson 1 of 6: Archer" | Reads the task | 1 | Header, 4 menu tiles, a strip of 6 icons, the task card (13 words), Return to game, Hint, Undo (off), Resign (off), "No moves yet", 2 empty took rows (36 words) |
| 3 | Same | Taps the archer | 2 | 8 marked squares; 7 of them fail the lesson (C:ONB-1). The help line and the card add about 40 words |
| 4 | Same | Taps the pawn. The archer shoots | 3 | "Well done. An archer never captures by moving onto a piece: …" (22 words). "Next lesson: Guard" shows |

### J1b. First visit, by Play, to the first move

| Step | Surface | Player action | Taps | What the player reads or meets |
|---|---|---|---|---|
| 1 | Title | Taps "Play" | 1 | 20 words |
| 2 | New game | Taps "Start game" (Play the computer and Club are chosen) | 2 | 3 cards, 4 levels, More options, Cancel (49 words) |
| 3 | Game, against Club, random army, you play White | Taps a piece | 3 | The help line, Cancel selection and the full card (52 words). Row 2 moves 198 px down |
| 4 | Same | Taps a marked square | 4 | The computer answers |

### J1d. First visit, through all 6 lessons, to the first game move

| Step | Goal | Taps | Total |
|---|---|---|---|
| Title | Learn the pieces | 1 | 1 |
| Lesson 1, Archer | Archer, then the pawn; "Next lesson" | 2 + 1 | 4 |
| Lesson 2, Guard | Guard, then a square on the e-file; "Next lesson" | 2 + 1 | 7 |
| Lesson 3, Maester | Maester, then your knight; "Next lesson" | 2 + 1 | 10 |
| Lesson 4, Beast | Beast, the knight on d5, the knight on d6; "Next lesson" | 3 + 1 | 14 |
| Lesson 5, Ogre | Ogre, the knight, then "Push to d6" in the Capture-or-push dialog; "Next lesson" | 3 + 1 | 18 |
| Lesson 6, Paladin | Paladin, the pawn on d6; "Start a game" | 2 + 1 | 21 |
| New game | Start game | 1 | 22 |
| Game | A piece, then a square | 2 | 24 |

- A wrong move gives "Not quite." with the task again, and costs 2 more taps.
- "Return to game" shows in every lesson. On a first visit it opens a game that the app saved at load: Club, a random army, you play White. The player did not choose this game.

### J2. Returning player continues a game

| Step | Surface | Player action | Taps | What happens |
|---|---|---|---|---|
| 1 | Title, in a new tab | Taps "Continue · move 12" (primary, with the focus) | 1 | The game opens. The computer moves if it is its turn |

- A reload in the same tab shows no title: 0 taps.
- When the saved game is over, Continue opens the Result.
- When signed in, a newer game from the account replaces the board with no question. Only the caption "Loaded your newer saved game from your account." says so.

### J3. Experienced chess player to a Strong game

| Step | Surface | Player action | Taps | Notes |
|---|---|---|---|---|
| 1 | Title | Play | 1 | — |
| 2 | New game | Strong | 2 | The meaning of each level is a tooltip on the row. Touch never shows it |
| 3 | New game | Start game | 3 | The game starts. Defects branch: a browser confirm (+1) when the saved game is unfinished |
| 4 to 6 (main only) | Settings | Settings, scroll, drag Thinking time, scroll, Close | +3 taps, 2 scrolls | On main, Strong thinks 800 ms, the same as Club, until the slider moves (D-5). The slider shows no value |
| Options | New game | Play Black: More options, Black (+2). Chess army: the Army select, then "Chess starting army" (+2) | +4 | The chess army is option 3 of 14 |

### J4. Two players on one device

| Step | Surface | Player action | Taps | Notes |
|---|---|---|---|---|
| 1 | Title | Play | 1 | — |
| 2 | New game | Two players | 2 | The level row changes to a "Kings' powers" checkbox |
| 3 | New game | Start game | 3 | — |
| Each turn | Game | A piece, then a square | 2 per move | White stays at the bottom for both players. Only "Black to move" in the header shows the turn. "Send the game link" shows from move 1 on every turn |
| Option | New game | Kings' powers checkbox, then an emblem and a power per side | +1 to +5, +1 scroll | 25 controls; Start game is out of view |

### J5. A game by link

| Step | Who | Surface | Action | Taps |
|---|---|---|---|---|
| 1–3 | Sender | Title → New game | Play, Two players, Start game | 3 |
| 4–5 | Sender | Game | A piece, then a square | 5 |
| 6 | Sender | Game | "Send the game link" | 6 |
| 7 | Sender | External | Phone: the share sheet, then a chat app. Desktop: the app copies the link and shows "Link copied. Paste it to your friend.", then the sender pastes it in a chat | External |
| 8 | Receiver | Game (no title) | Opens the link. When a different saved game has moves: browser confirm X2, OK | 0 or 1 |
| 9–10 | Receiver | Game, the board turned to the receiver's side | A piece, then a square | 2 |
| 11 | Receiver | Game | The help line says "Your move is played. Send the game link so your friend can answer." The receiver taps "Send the game link" | 3 |
| Each later turn | Both | Game | Open the newest link, move (2), send (1) | 3 + 2 external |

### J6. A powers game: start, and the first use of a power

| Step | Surface | Player action | Taps | What the player reads or meets |
|---|---|---|---|---|
| 1 | Title | Play | 1 | — |
| 2 | New game | Kings' powers | 2 | Both pickers open: 28 controls, 137 words. Defaults: you get Spirit with Holy Light (always on); the computer gets Shadow with Death Touch |
| 3 | New game | Taps the Frost emblem (Freeze is chosen) | 3 | The rule line changes |
| — | New game | Scrolls to Start game | 1 scroll | Start game is out of view at every size |
| 4 | New game | Start game | 4 | — |
| 5 | Game | "Use Freeze (1 left)" | 5 | The card shows 2 rule paragraphs (about 60 words). The button sits under Hint, Undo and Resign |
| 6 | Game | Taps an enemy piece | 6 | "Tap an enemy piece to freeze it for one turn." Then: "Now make your move, or end the turn." End turn shows |
| 7–8 | Game | A piece, then a square | 8 | Nothing on the board marks the frozen piece. The list shows `!F:c7` |

### J7. The daily game

| Step | Surface | Player action | Taps | Notes |
|---|---|---|---|---|
| 1 | Title | Play | 1 | Nothing on the title names the daily game |
| 2 | New game | More options | 2 | — |
| 3 | New game | Army select | 3 | 14 options |
| 4 | New game | "Today's army, the same for everyone" | 4 | Option 2 of 14 |
| 5 | New game | Start game | 5 | — |
| End | Result | "Copy today's result" | +1 | Copies "King Down daily 2026-10-08 (CODE): won in N moves against the club computer. URL". Then the player pastes it outside the app |

- On the next day, the dialog keeps Today's army: Play, then Start game (2 taps).
- A Rematch of a daily game is not a daily game: the Copy button does not show after it.

### J8. The Workshop

| Path | Steps | Taps |
|---|---|---|
| Fastest working piece | Title "Workshop" → "Surprise me" → "Try it" → tap the piece → tap a square | 5 |
| New piece | "Workshop" → "New piece" → 1 of 34 figures → at least 1 square on the Moves board → "Try it" → the piece → a square | 7 |
| Leave | Back (Try it) → Back (Editor) → Back (Home). The caller (title or game) shows again | 3 |
| Share | Share → Send link, Copy link or Copy as text → external | 2 + external |
| From the game | The Workshop tile, then the same paths | +0 |

### J9. Review a finished game

| Step | Surface | Player action | Taps | Notes |
|---|---|---|---|---|
| 1 | Result | Waits for "Finding the key moments…" | 0 | About 0.4 s at most per ply: up to about 24 s for 60 plies |
| 2a | Result | Taps a key moment | 1 | The Result closes. The board shows the position before the move. Two gold boxes mark the better move. The help line shows the moment text in LAN |
| 2b | Result | Close | 1 | — |
| 3b | Game | Taps a move in the list | 2 | "Reviewing after 1. e2-e4" |
| Each step | Game | Desktop: ← or →. Touch: a tap on the next move in the list | +1 per move | A phone list shows about 4 lines; it needs a scroll for each 4 moves. A 30-move game: about 60 taps |
| Leave | Game | Taps the board, or Esc | +1 | — |
| Copy | Settings | Settings, scroll, Copy moves, Close | 3 + 1 scroll | No feedback on main |

### J10. Change a setting

| Goal | Steps | Taps |
|---|---|---|
| Sound off | Settings → Sound → Close (phone: scroll first, or Esc, or a tap on the backdrop) | 3 + 1 scroll |
| Animations Off | Settings → Animations select → Off → Close | 4 + 1 scroll |
| From the title | The title has no Settings. First Continue (1), or Play and Cancel (2) | +1 or +2 |

### J11. Resign

| Step | Surface | Action | Taps | Notes |
|---|---|---|---|---|
| 1 | Game | Resign | 1 | The tile is next to Undo and has the same weight |
| 2 | Browser confirm "Resign as White?" | OK | 2 | Main: on the computer's turn it names the computer's side, and OK gives you the win (D-1) |
| 3 | Result | — | — | "White resigns — Black wins". "That side gave up." and the army code |

### J12. Rematch

| Step | Surface | Action | Taps | Notes |
|---|---|---|---|---|
| 1 | Result | Rematch | 1 | The same army, colours swapped (against the computer you now play Black and the board turns), the same level and kings |
| After Close | Game | No Rematch control. "New game" tile → Start game | 2 | A random army and the same side: not a rematch |
| Result "New game" | Result | New game | 1 | Starts at once with a random army. The tile with the same label opens a dialog |

### J13. Extra: read the rules of a piece

| Case | Steps | Taps |
|---|---|---|
| Desktop | Move the pointer over the piece. The card shows in the rail and pushes Hint, Undo and Resign 95 to 115 px down | 0 |
| Touch, your piece | Tap it. It is selected and its markers show | 1 |
| Touch, enemy piece (main) | The tap gives a refusal. Guide → scroll to the card (the Archer is at about 1260 px) → Close at the end (or Esc, or the backdrop) | 2 + 3 to 10 scrolls |
| Touch, enemy piece (defects branch) | The tap shows its card | 1 |

### J14. Extra: sign in

Settings (1) → scroll to Account → "Continue with Google" (2) → the provider's page (external) → back to the app. Settings then shows the name and picture.

## 5. Friction per journey

Kinds: **H** the player hesitates; **R** the player reads too much; **O** the player meets an option that this journey does not need; **D** a dead end or a loss; **W** a wait; **X** a wrong or a surprising result. IDs cite the reviews (C, X1, X2, motion review) or the defects (D-n). "Code" marks a fact found in the code for this map.

### J1. First visit

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Title | Three large buttons. The Workshop has the same weight as Play | O | Pick W3 |
| Title | Nothing says what King Down is: "Chess" is the only word | H | C:ONB-10 |
| Title | A tap on a lineup figure does nothing, but the figure lifts under a mouse | H | C:ONB-18 |
| Title | Esc on a first visit skips the lessons and opens a game | X | C:SET-M5 |
| Title | "Learn the pieces" promises 12 pieces. The lessons teach 6 | H | C:ONB-21 |
| Lesson | The lesson shows 4 menu tiles, Return to game, Hint, Undo (off), Resign (off), an empty list and empty took rows | O | C:ONB-1, C:RESP-17, X1:F03, X2:F02 |
| Lesson 1 | Nothing marks the archer before the first tap | H | Motion G2 |
| Lesson 1 | After the archer tap, 8 squares are marked and 7 of them fail the lesson | X | C:ONB-1 |
| Lesson 1 | Three text blocks at once, about 70 words | R | C (counts table) |
| Lesson 3 | Hint suggests a king move, and the lesson refuses it | X | D-2 |
| Lessons | The strip icons are not buttons. Learn always starts at lesson 1 | H | C:ONB-11 |
| Success | One flat line. "Next lesson" does not get the focus | H | C:ONB-22; code |
| Return to game | On a first visit it opens a game the player never set up | D | C:ONB-8 |
| After lesson 6 | "Start a game" opens New game, a second set of choices | O | C:ONB-8 |
| Lesson 6 | It teaches the Paladin, which is not in the random draw | R | C:ONB-17, pick W4 |
| J1b, New game | Kings' powers, Two players, 4 levels and More options show before the first move. Club is the default, and on main Club plays the same as Strong | O, X | C:ONB-5, D-5, pick W1 |
| J1b, game | A selection adds 3 help blocks (52 words). Hint, Undo and Resign jump 198 px; on a real phone they go off the screen | R, H | C:PLAY-1, C:RESP-3 |
| J1b, game | A tap on an enemy piece gives a refusal, not its rules | H | D-10 |
| J1b, game | No army overview before move 1: the player does not know which new pieces are on the board | H | C:ONB-2 |

### J2. Returning player

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Title | Continue says "move N" but not who plays whom | H | C:SET-M2 |
| Title | A second visit with no moves loses the Learn lead: Play is primary | H | C:ONB-9 |
| Game | No control goes back to the title | D | C:SET-15 |
| Account | A newer game from the account replaces the board with no question | X | Code (`fromAccount` → `openSaved`) |
| Game | The header card shows the brand, not the game ("You vs Computer · Club") | H | C:VIS-1, C:ONB-16 |

### J3. Experienced chess player

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| New game | On main, Strong plays the same as Club. The only fix is a slider in Settings with no value | X, H | D-5, C:SET-5, C:VIS-18 |
| New game | The meaning of a level is a tooltip; touch never shows it | H | C:SET-14, C:A11Y-11 |
| New game | Side and "Chess starting army" hide in More options, next to 10 lab armies | O | C:SET-7, C:SET-8 |
| New game | On main, Start game replaces the running game with no question | D | D-4 |
| Game | The move list uses new signs (`*`, `<>`, `>`, `!F:`). Only one paragraph at the end of the Guide explains them | R | Code (`#rules-notation`) |
| Game | Touch has no review step buttons. Desktop move rows are about 22 px | H | C:PLAY-6, C:PLAY-15 |
| Game | "No castling or en passant" is only in the Guide | H | Code (`#rules-lead`) |

### J4. Two players on one device

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| New game | "Two players" means both one device and a link game | H | Pick W7, X1:F16, X2:F15 |
| Game | The board never turns. No hand-off cue | H | C:PLAY-13, motion E2 |
| Game | "Send the game link" shows on every turn of a one-device game | O | Code (`#share` rule) |
| Game | Only the header text shows whose turn it is | H | C:A11Y-5 |
| New game, powers | A checkbox and two open pickers (25 controls). Start game is out of view | O | C:SET-10, C:SET-1 |

### J5. A game by link

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Sender | The link button shows only after the first move. The help line is the only cue | H | C:PLAY-13 |
| Sender | On main, "Link copied" shows before the copy succeeds | X | D-9 |
| Both | Each turn needs a new link. Nothing says which link is the newest | H | Code |
| Receiver | A browser confirm with a different look | H | C:SET-M1 |
| Receiver | The link replaces the receiver's own saved game: the app has one save slot | D | Code (`save()`) |
| Receiver | The friend's move does not play. Only a wash on its target square shows it | H | Motion T3 |

### J6. A powers game

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| New game | 28 controls, 137 words, two open pickers. Start game is out of view at every size | R, O | C:SET-1, C:SET-3, pick W5 |
| New game | The default power (Holy Light) is always on. It gives no Use button and no sign on the board | H | C:PW-7 |
| New game, game | The computer's power reads "your king" | R | C:ONB-14 |
| Game | About 60 words of rules always show. The Use button comes after Hint, Undo and Resign | R | C:PW-2, C:VIS-6 |
| Game | On the computer's turn the panel shows its power button, off | O | C:PW-3 |
| Game | "0 left" stays as a dead button | O | C:PW-9 |
| Game | Freeze plays no motion and leaves no mark on the frozen piece | H | C:PW-1, motion F3 |
| Game | End turn and the next step go below the fold on a phone | H | C:PW-8 |
| Game | Hint suggests a power move that the game refuses | X | D-2 |

### J7. The daily game

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Title, game | Nothing names the daily game, or says whether you played it today | H | Code |
| New game | It is option 2 of 14 in a select inside More options, next to army codes | H, O | Code (`#army`) |
| New game | The note under the select is about example armies | R | Code (`#army-note`) |
| Result | The share button is only in the Result. After Close it is gone | D | Code |
| Result | The copied text has the army code. It does not open the share sheet | R | Code (`#share-result`) |
| Result | "New game" after a daily game starts a random army | X | C:SET-9, pick W8 |

### J8. The Workshop

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Title | For a new player, the Workshop has the same weight as Play | O | Pick W3 |
| New piece | 34 figures come before any move | H | X1:F34, pick W9 |
| Editor | 96 cells, "Apply to" and "Take by" selects | R, H | C:PW-M4 |
| Editor | An eye icon opens Appearance | H | C:PW-22, D13 |
| Editor | The worth shows four times | R | C:PW-18 |
| Try it | No goal | H | C:PW-19 |
| Any | A Workshop piece cannot join a game, and nothing says so | D | C:PW-10 |
| Leave | 3 Backs to get back | H | Code |

### J9. Review a finished game

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| End | The Result covers the king's fall on the board. Then the card's kings fall again | H | Motion H3 |
| Result | "Finding the key moments…" can take many seconds | W | Code (`listMoments`) |
| Result | The key moments are in LAN, with "gave away about 3 pawns" | R | C:A11Y-13 |
| Result | The army code and "That side gave up." | R | C:ONB-M2 |
| Result | Close is the only way to the board, and nothing opens the Result again | D | Code |
| Review | No step buttons on touch: one tap per move on small list rows | H | C:RESP-9, C:PLAY-6 |
| Review | "Tap the board to return" is the only exit | H | X1:F10 |
| Review | Undo and Resign stay on and act on the live game | X | Code (`refresh()` turns off only Hint) |
| Review | The card and the took rows show the live game, not the viewed move | X | D-3 |
| Review | The better move is two equal gold boxes, with no direction | H | C:PLAY-4 |
| Copy moves | No feedback on main. The text is LAN | R | D-9 |

### J10. Change a setting

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Game | The Settings tile has the same weight as Hint and Undo | O | C:PLAY-2 |
| Settings | 14 controls in 4 groups. Lab items (Look, Thinking time, the army code, Copy moves) sit between the player settings | O | C:SET-6, pick W6 |
| Settings | Animations is a select: 2 taps for one choice | H | C:VIS-18 |
| Settings | Close is at the end of a long dialog on a phone | H | C:RESP-15 |
| Settings | Look reloads the page | X | C:SET-18 |
| Settings | On main, Piece letters is lost after a reload | X | D-8 |
| Settings | The help for Always promote is a tooltip | H | C:SET-14 |
| Title | The title has no Settings | D | Code |

### J11. Resign

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Game | Resign is a tile next to Undo, with the same weight: a tap meant for Undo can hit it | O | C:PLAY-16, review item 2 |
| Confirm | A browser box. It names the side to move; on main this can be the computer's side | X | D-1 |
| Result | "That side gave up." and the army code | R | C:ONB-M2 |

### J12. Rematch

| Step | Friction | Kind | Evidence |
|---|---|---|---|
| Result | Rematch shows only in the Result. After Close it is gone | D | Code |
| Result | "New game" in the Result starts at once. The tile with the same label opens a dialog | H | C:SET-9 |
| Result | Rematch swaps the colours and does not say so | H | C ("Rematch as Black") |
| Result | The Rematch of a daily game is not a daily game | H | Code |

### J13 and J14. Extras

| Journey | Friction | Kind | Evidence |
|---|---|---|---|
| J13 | On desktop, the card shows on each pointer move and moves the controls | H | C:VIS-M1 |
| J13 | The card shows the full rules for every piece, the chess pieces too, in every game | R | C:PLAY-9 |
| J13 | The Guide puts the 6 chess pieces first. On a phone the first new piece is about 1260 px down | R | C:ONB-6 |
| J14 | The sign-in is at the end of Settings, after the board and game items | H | C:SET-6 |

## 6. Facts for the redesign

**Approved rounds to keep** (`docs/visual-design/README.md`):
- Round 2: the 12-figure title lineup and the move markers.
- Round 3: the three mode cards, the emblem king picker with power pictures, Spirit and Shadow as the plain kings, and More options. Picks W5 and W6 change parts of this round.
- Round 4: the rulebook piece icons, also in the card, the took rows and the lesson strip.
- The Workshop revision 3 (2026-10-07).
- The last-move rule of 2026-10-04: only the target square. Pick W11 B adds a fading trail.
- The review picks W1 to W12. The owner said yes to work under them.

**Motion today by surface** (motion review §2):

| Surface | Motion today |
|---|---|
| Title | Lineup and kings rise; live king effects; a lift under the mouse |
| New game | Power pictures loop on hover, on focus and while chosen; emblem effects |
| Board | Gaits, themed captures, marker ripple, king fall |
| Result | The card's kings topple |
| Workshop | Set A reactions |
| No motion (snaps) | Every dialog, the move list, the took rows, the header text, Undo, review, lesson retries, promotion, Freeze, Ice Wall, Sacrifice, the board flip |

**Data that exists for a "story" move list:**
- `describeMove()` gives one sentence per move.
- `momentText()` gives one caption per special move.
- `pieceIcon()` draws each piece's icon in its army's colour.
- Each history entry has the move and the position before it. A list entry can therefore name the piece, its target, what it took and the power used, with no new engine work.
- The motion review prototype P4 (`ux/motion/proto/p4-capture-tray-*`) shows a new list entry glowing and the taken piece flying to the took row at the moment of the hit.

**Defects branch changes to the journeys:**
- J3: Strong thinks 2.5 s. The Thinking time slider is gone. Start game asks first when it replaces an unfinished game.
- J11: Resign is off while the computer thinks, and always names your side.
- J13: a tap on an enemy piece shows its card.
- J5, J7, J9: the copy feedback shows only after the copy succeeds.
- Hint gives only moves that the game takes now.

**Things that tests and tools read:** `#hover` (`tools/qa.mjs`), `#workshop-btn` (phone checks), `.piece-card[data-piece]` (Guide tools) and the ids of `index.html` (browser checks). A builder who moves or renames them updates those tools too.
