# Menus, screens and journeys: the spec

Status: needs-info (the owner's yes on the rendered sample)

Ticket: [03](../issues/03-menus-screens-journeys.md). Date: 2026-10-08. Branch: `claude/web-ux-sample`.

This spec builds on the [review](../review.md) and its picks W1–W12, the [motion review](../sources/motion-review.md) and the [game screen sample](../sample/README.md) of ticket 02. The sample builders follow it. No build starts before the owner says yes to the rendered sample (AGENTS.md).

## The owner's request, 2026-10-08

> it's all good and you should work on these.
> but i want the next focus to be on the menus and screens and user journeys and interface. i wanted the known UI and UX best practices and guidelines and the motion graphics to be used for simplification, engagement and clarity of the GUI.
>
> on a specific note - the play by play transcript - we don't need that to be so dominant. it can be a collapsible section. also, it can be made more more engaging and fun to read, with icons and/or animations rather than just static "code" text".
>
> i also want a lot of the "optional" features to be removed and for now placed in an "extra" menu, but to clear as much as possible from the available options and declutter the screen.

## Summary

- **The game screen.** It shows the board, two player strips, one status line, one context area, one Moves line and three buttons: Menu, Hint and Undo. An idle game has 4 controls in view at every size. Today it has 7 tiles and 24 move buttons. The ticket 02 sample has 5 (phone) or 9 (desktop) and 24 move buttons.
- **The moves.** The move list is one closed line by default. The line shows the newest move as a short sentence with icons: "Their queen moves." A tap opens the full list. The list reads as a story: piece icons, plain words and the board's own marker shapes. A short motion plays when a move joins it. Chess notation is a switch in Extras.
- **Extras.** One page inside the Menu holds every option that a normal game does not need. The Settings screen goes. The designer's tools go behind `?lab=1` (pick W6).
- **Fewer surfaces.** The browser boxes (`confirm`, `prompt`, `alert`) go from 9 to 0 in player paths. A sheet never opens over a sheet. Every option is at most two steps from the board: Menu, then Extras.
- **Motion with a job.** Each motion shows where a thing comes from, what changed, or what to do next. Each one ends on a still frame that keeps its information. Animations Off shows that frame.
- **Changes to the picks.** Pick W2 C changes: one Menu button at every size, and a phone bar of 3. The [owner decisions](#owner-decisions) W13–W21 are at the end. Work continues under the picks.

## How this spec was made

Sources, in [sources/](sources/):
- [inventory.md](sources/inventory.md): every control, screen and journey of today, with tap counts and friction. The IDs in this spec (T4, P20, N10 …) are its IDs.
- [guidelines.md](sources/guidelines.md): 29 rules (R1–R29) from Nielsen Norman Group, the Laws of UX, WCAG 2.2, the Apple and Material guidelines and game UX, and the patterns of lichess, chess.com, Hearthstone, Duolingo and others. "MR4" is rule 4 of motion-review §5.
- Three proposals, each from one angle: [A, the new player](sources/proposal-a-new-player.md); [B, the chess player](sources/proposal-b-chess-player.md); [C, the radical declutter](sources/proposal-c-declutter.md).

Scores, 1 (weak) to 5 (strong):

| Criterion | A, new player | B, chess player | C, declutter |
|---|---|---|---|
| Fidelity to the owner's request | 5 | 3 | 5 |
| Simplicity (controls and taps removed) | 4 | 2 | 5 |
| Clarity for a new player | 5 | 4 | 4 |
| Speed for an expert | 4 | 5 | 3 |
| Engagement and joy | 5 | 4 | 4 |
| Accessibility | 4 | 3 | 4 |
| Fit with the art and the approved picks | 3 | 5 | 4 |
| **Total** | **30** | **26** | **29** |

- **A** has the best first run: the "new pieces in your army" row, a tap on a lineup figure, lessons with a stamp and a chime. But it adds things back: a Home row in the Menu, a daily-game link on the title, two list modes, and a bar that changes in review. It skips the Round 3 New game screen on a first Play and does not say that this reverses an approved round.
- **B** keeps the most approved work (the W2 C toolbar, Round 3) and is the fastest for a chess player. But it keeps 9 controls in view on desktop, which is against the owner's "declutter the screen". It adds a single-letter key (F), a WCAG 2.1.4 risk.
- **C** is the closest to the owner's words and maps every inventory item to a home. Its review controls are one tap further on a phone.

**Base: C.** The owner's request weighs fidelity, simplicity and fit most: there C scores 14, A 12 and B 10. **Grafts:**
- From A: the "new pieces in your army" row before move 1; a tap on a lineup figure opens its card with a way into its lesson; the lesson stamp and chime; the Menu and Extras in one container with a shared-axis slide; the event-icon table.
- From B: the result card in the rail on desktop and as a bottom sheet on a phone, so the fallen king stays in view; the game-over line that keeps Rematch after the card closes; the open-link sheet; the level lines; "What changes from chess" in the Guide; the More options label that shows its state; Start game in focus.
- The lead's own calls: no separate side disc in a move row (the icon's army colour and the word "Your" or "Their" say it); quiet moves as soft rows, not folds; Play still opens New game (Round 3); every piece card has one line, the chess pieces too.

## 1. Screen map

```text
Title
├─ Continue (an unfinished game) ──────────► Game
├─ Learn the new pieces ───────────────────► Lesson 1 of 5 ─► … ─► Lesson 5
│     (main on a first visit; later a quiet link until all 5 are done)
│     each lesson ends: Next lesson | Play a game ─► Game at once (Beginner)
│     after lesson 5: Play your first game ─► Game | Bonus: Paladin · Ogre practice
├─ Play / New game ────────────────────────► New game sheet ─► Game
├─ a lineup figure ────────────────────────► its piece card ─► Try it ─► its lesson
└─ Workshop (quiet link) ──────────────────► Workshop (revision 3, no change) ─► Back ─► Title

Game
├─ Menu ─► Menu (phone: bottom sheet; desktop and tablet: popover)
│          ├─ New game ─► New game sheet ─► Game
│          ├─ Guide ─► Guide sheet ─► Learn the new pieces ─► the next lesson
│          ├─ Sound (switch, in place)
│          ├─ Extras ─► Extras (in the same container) ─► Workshop | sign-in page (external)
│          └─ Resign ─► a question in the context area ─► Result
├─ Hint, Undo (in place)
├─ Moves line ─► Moves open (phone: sheet under the board; desktop: fold in the rail)
│                 └─ a row, ◀ or ▶ ─► Review ─► Back to game
├─ Board ─► Take or push · Promotion · Sacrifice (a small card at the square)
└─ the game ends ─► Result ─► Rematch | Review | New game…
                     └─ Review ─► the board, with "You win · Rematch · See result" in the context area

Lesson ─► × ─► where the player came from (the title on a first visit, else the game)
Game link ─► (an "Open your friend's game?" sheet only when it replaces a game) ─► Game
?lab=1 ─► a Lab group in Extras, lab armies in New game
```

- **Two levels at most** (R2): Menu, then Extras. Extras replaces the Menu content in the same container, so a sheet never opens over a sheet (R14).
- **Places are screens, actions are buttons** (R12): Learn, Workshop and the Guide are places. The bar holds only actions.

## 2. Where each item goes

### 2.1 The homes

| Home | What goes there | Rule |
|---|---|---|
| **In view** | What most turns use: the board, the strips, the status line, Hint, Undo, the Moves line, the power button (powers games) | R3, R11 |
| **In view, in its moment only** | A control that shows only when it can act: Stop here (chain), End turn, Send the game link (link games), Back to game (review) | R3 |
| **Menu** | Once a game: New game, Guide, Sound, Extras, Resign | R7, R11, R13 |
| **Extras** | Optional, set once | R1, R7 |
| **Lab** (`?lab=1`, remembered on the device; `?lab=0` turns it off) | The designer's tools | W6 |
| **Gone** | Duplicates and dead ends | — |

### 2.2 Every item

The IDs are the [inventory](sources/inventory.md) IDs. "Who" is its label: Every, New, Some, Rare, Lab.

| ID | Item today | Who | New home |
|---|---|---|---|
| T1 | Title stage and the six kings | — | Title, no change |
| T2 | Title lineup of 12 figures | New | Title. New: a tap on a figure opens its piece card (4.3) |
| T3 | Wordmark "King Down Chess" | — | Title. New line under it: "Chess with six new pieces" (W3 C) |
| T4 | Continue · move N | Every | Title, main, for an unfinished game: "Continue", with "vs Computer · Casual · move 12" under it |
| T5 | Learn the pieces | New | Title, main on a first visit: "Learn the new pieces". Later a quiet link until the 5 lessons are done. Always at the top of the Guide |
| T6 | Play | Every | Title. "Play" on a first visit, "New game" later. It opens the New game sheet |
| T7 | Workshop button | Rare | Title, quiet text link (W3 C) |
| T8 | Esc on the title | — | Opens the saved game when one exists, else does nothing. It never skips the lessons |
| G1 | "KING DOWN CHESS" card | — | Gone (review item 3) |
| G2, G3 | Turn line and "thinking…" | Every | One status line in player words, with the E1 turn disc and thinking ring |
| G4 | "Loading pieces…" | — | Gone as text: the army musters (T2). A load error shows in the context area |
| B1–B4, B6–B8, B11 | Tap, drag, cancel, skip, keyboard play | Every | No change |
| B5 | Tap on an enemy piece | New | Its card in the context area (D-10) |
| B9 | Pointer over a square | New | The see-through piece and the gold capture mark only. The card shows on a tap, not on a hover |
| B10 | Shift-click push | Lab | No change, no visible control |
| M1–M4, M10 | Markers, selection, last move, check, king fall | Every | No change. M3 adds the W11 B trail. M4 adds the C2 check line |
| M5 | Hint boxes | New | The C1 ghost move and one line |
| M6, M7, M8 | Threats, coordinates, piece letters | Some, Rare | Extras › Board |
| M9 | Keyboard cursor | Some | No change |
| M11 | Frozen or walled piece | — | New F3 ice mark and badge (W12 A) |
| P1 | New game tile | Every | Menu |
| P2 | Guide tile | New | Menu |
| P3 | Workshop tile | Rare | Extras › More, and the title link |
| P4 | Settings tile and screen | Rare | Gone. Sound goes to the Menu; the rest goes to Extras |
| P5 | Hint | New, some | In view: phone bar; desktop action row |
| P6 | Undo | Some | In view, next to Hint |
| P7 | Resign | Rare | Menu, last row, danger ink. The question shows in the context area (review item 2) |
| P8 | Lesson strip | New | Lesson screen, top bar |
| P9 | Help line | New | Context area |
| P10 | Cancel selection | Rare | Gone: a second tap and Esc cancel (review item 1) |
| P11 | Finish chain | Some | Context area, "Stop here", during a chain only |
| P12 | Moment caption | Some | Context area, until the player finishes 3 games |
| P13 | Next lesson | New | Lesson success bar |
| P14 | Return to game | New | Lesson ×, "Leave" |
| P15 | Piece card | New | Context area: icon, name, one line, "All rules". On a tap only |
| P16 | Use power | Some | Your strip. Hidden at 0 uses and on the opponent's turn. The opponent's power is a quiet chip in its strip |
| P17 | End turn | Rare | Context area, in that turn only |
| P18 | Power step line | Some | Context area |
| P19 | Send the game link | Some | Link game: the main action in the context area after your move. One-device game: Extras › Moves |
| P20 | Move list | Some | The Moves line, closed (section 5) |
| P21 | "White took", "Black took" | Some | In each player strip |
| P22, P23 | `#hover`, `#announce`, `#cursor-say` | Lab, Some | No change, not visible |
| N1 | "New game" title | — | No change, with × |
| N2–N4 | The three mode cards | Every, Some | No change (Round 3) |
| N5 | Level row | Every | In view, with one line under it (W1 B) |
| N6 | Two-player powers checkbox | Some | A switch under Two players, with "On this device · By link" (W7 B) |
| N7 | Two king pickers | Some | Your picker open; the other king as a row with Change (W5 B). "No power" goes to Lab (W21) |
| N8 | More options | Some | No change, closed. Its label names each choice that is not the default |
| N9 | You play White or Black | Some | More options, 2 segments |
| N10 | Army select, 14 entries | Every, Lab | More options: Random · Today's · Chess, 3 segments. Custom army and the 9 example armies: Lab. Ogre practice: a bonus lesson (W6 B) |
| N11 | Army note | Lab | Lab |
| N12 | Cancel | — | Gone: ×, Esc and a tap outside drop the changes |
| N13 | Start game | Every | Sticky footer, always in view. A warning line when it ends an unfinished game (W20) |
| S1 | Sound | Rare | Menu, switch |
| S2 | Always promote to queen | Rare | Extras › Play |
| S3 | Show threats | Some | Extras › Board |
| S4 | Animations | Rare | Extras › Play, 3 segments |
| S5 | Look (Clay 3D) | Lab | Lab |
| S6 | Piece letters | Rare | Extras › Board |
| S7 | Coordinates | Rare | Extras › Board |
| S8 | Thinking time | Lab | Gone (W1 B; the defects branch removes it) |
| S9 | Reset view (R) | Lab | Lab |
| S10 | Army code of this game | Lab | Lab |
| S11 | Copy moves | Rare | Extras › Moves |
| S12–S14 | Account | Rare | Extras › More, in place |
| S15, R7 | Close at the end of a dialog | — | × in the sticky header of each sheet |
| D1–D3 | Delete account dialog | Rare | A question in place, inside Extras: no dialog over a dialog |
| R1 | Learn (Guide) | New | Guide, top. It goes on at the next lesson |
| R2 | Rules summary | New | Guide: "What changes from chess", 3 lines |
| R3 | 12 piece cards | New, Some | Guide: the 6 new pieces first, with G1 diagrams. The chess pieces in a fold |
| R4 | Draw pool | Lab | Lab |
| R5 | Notation key | Lab | Guide fold "Keys and move notation" |
| R6 | Kings' powers | Some | Guide fold "Kings and their powers" |
| C1–C3 | Capture or push, Promotion, Sacrifice | Some | A small card at the square (H2), with pictures (H1) |
| O1 | Result kings | — | No change; the loser is already down when the card shows (H3) |
| O2 | Result title | Every | "You win!", "The computer wins", "Draw", "White wins!" |
| O3 | Last move and army code | — | One line: "Checkmate on move 23." No notation, no code |
| O4 | Key moments | Some | "Moves to look at again": up to 3 story rows with a star |
| O5 | Copy today's result | Some | "Share today's result": the share sheet on a phone, a copy on desktop |
| O6 | Rematch | Every | Main, with "You play Black" |
| O7 | New game (starts at once) | Some | "New game…": the New game sheet with the last choices (W8 B) |
| O8 | Close | Some | Gone. Review, Esc and a tap outside go to the board. The context area keeps Rematch |
| X1 | Resign confirm | — | Question in the context area |
| X2 | Open-link confirm | — | "Open your friend's game?" sheet |
| X3–X5 | Custom army prompt and alerts | Lab | Lab only (the lab may keep the browser prompt) |
| X6–X8 | Workshop offline, broken link | — | A toast or a context line |
| X9 | "Bad fen" | Lab | Lab only |
| X10 | Start game confirm (defects branch) | — | A warning line in the New game footer (W20) |
| Workshop | Home, New piece, Editor, Try it | Rare | No change (revision 3, W9 B) |
| Keys | Esc, Z, ← →, board keys | Some | No change. ← → also start review. Keys act only when no sheet is open (D-6). R goes to Lab |
| URL switches | 12 switches | Lab | No change. New: `?lab=1` |

**Nothing is lost.** Each "Every" item is in view or one tap away. Each "Some" item is two taps away or less. Three things go on purpose: the Settings screen (its items move), the card on a hover (a tap shows it), and the rule text of the kings that showed all the time (a tap on the power shows it).

### 2.3 Counts before and after

The count rule of the inventory: a control that shows but is off counts. Move rows count apart.

| Screen | Today | Ticket 02 sample | This spec |
|---|---|---|---|
| Game, idle, phone | 7 tiles + 24 move buttons | 5 + 24 | **4** (Menu, Hint, Undo, Moves line) |
| Game, idle, desktop | 7 + 24 | 9 + 24 | **4** |
| Game, piece selected | 8–9 | 5 / 9 | 5 (+ "All rules") |
| Game, powers | 8–9 | 7 / 11 | 6 (+ your power, + their chip) |
| Game, review | 7 + 24 | 6 / 10 + 24 | 6 (Hint and Undo off, ◀, ▶, Back to game) + rows |
| Lesson | 8–9 | — | 2 (×, Show me), + the done lessons as buttons |
| Title, first visit / returning | 3 / 4 | — | 3 / 4; 3 after all lessons |
| Menu | — | W2 C: 5 rows (not in the sample) | 6 (5 rows and ×) |
| Extras | — | — | 17 signed out; 18 in a two-player game; +3 with `?lab=1` |
| Settings | 14 | — | 0: no Settings screen |
| New game, computer: More closed / open | 10 / 13 | — | 10 / 15 |
| New game, Kings' powers | 28 / 31 | — | 19 / 24 |
| New game, two players | 7 / 8 | — | 9 / 12 |
| New game, two players with powers | 25 / 26 | — | 18 / 21 |
| Guide | 2; 881 words | — | 5 (×, Learn, 3 folds) + a replay tap on each of the 6 diagrams; about 300 words outside the folds |
| Result | 3–7; 29 words | — | 3–7; about 12 words |
| Browser boxes in player paths | 9 (10 on the defects branch) | — | 0 |
| Text areas on the game screen | 9, the list and 2 took rows | 3 | 2 (status line, context area) and the Moves line |
| Words on the idle game screen | 21 | — | about 12 |

## 3. Extras

**The name.** "Extras" (decision W15). The owner's word is "extra".

**The container.** Extras opens in the Menu's own container: the bottom sheet on a phone and in landscape, the popover on desktop and tablet. Its header has "‹ Menu", the title "Extras" and ×. Esc and Back go to the Menu; × and a tap outside close all. The header stays; the body scrolls inside. On a 390×844 phone, the Board, Play and Moves groups show with no scroll.

**Content, in order.** Rows are 56 px on touch. A switch acts at once. One help line shows only where the name is not clear.

| Group | Row (in-app copy) | Control | Default |
|---|---|---|---|
| Board | **Show threats** — "Red rings show your pieces in danger." | Switch | Off |
| | **Coordinates** | Switch | On |
| | **Piece letters** | Switch | Off |
| | **Flip board** | Button | — |
| Play | **Animations** | Normal · Fast · Off, 3 segments, with the I1 stepping pawn | Normal; Off with reduced motion |
| | **Always promote to a queen** — "Skip the choice when a pawn reaches the end." | Switch | Off |
| Moves | **Move notation** — "Chess notation at the end of each move." | Switch | Off |
| | **Copy moves** | Button; then "Copied" with a check mark | — |
| | **Send the game link** (two-player games only) | Button | — |
| More | **Workshop ›** — "Make your own piece." | Row; opens the Workshop | — |
| | **Account** — signed out: "Sign in to save your games on every device." **Continue with Google**, **Continue with GitHub**, "Privacy · Terms" | Buttons and 2 links | — |
| | **Account** — signed in: picture, name, "Signed in with Google", **Sign out**, **Delete my account** | Buttons | — |
| Lab (`?lab=1` only) | **Look**: Painted · Clay 3D; **Reset view** (Clay only); "This game: SQBKRSML" | Segments, button, text | Painted |

**Delete my account.** A tap replaces the Account rows with the question in place: "Delete your account?", the text of today's dialog (D1), **Delete my account** (danger) and **Keep my account**. No dialog opens over the sheet.

**Piece letters.** When the open TASKS item "Piece-letter icons" lands, this row becomes "Piece icons on the board". The row stays in Extras.

## 4. Screens and sheets

### 4.1 Rules for every surface

- **Sheets.** On a phone and in landscape: a bottom sheet with a visible ×. On desktop and tablet: a popover (Menu, Extras) or a centred dialog (New game, Guide). Esc, Back and a tap outside close it. A sheet never needs a drag. Opening one sheet closes the other (R14).
- **Sticky parts.** Each sheet has a sticky header (title and ×) and, when it has a main action, a sticky footer that holds it (review item 6).
- **Buttons** (W10 B, from the sample): primary (crimson, one per view), secondary, quiet, icon. 44 × 44 px on any coarse pointer; at least 28 px on a fine pointer (R22).
- **Type** (W10 B): body text 16 px; nothing under 14 px; Cinzel only at 18 px and larger.
- **Choices** use one chosen style: the gold-ink ring and tint.
- **Focus** is always visible. The bar and a sheet never cover the focused control (R23).
- **Player words only.** No notation (outside the notation switch), no army codes, no "!F:c7".

### 4.2 Title

Content, in order: the stage and the six kings (T1); the 12-figure lineup (T2); the wordmark; "Chess with six new pieces"; the buttons.

| Case | Main button | Second button | Quiet links |
|---|---|---|---|
| First visit | **Learn the new pieces**, with "5 short lessons" under it; it has the focus | **Play** | Workshop |
| Returning, an unfinished game | **Continue**, with "vs Computer · Casual · move 12" under it | **New game** | Learn the new pieces · Workshop |
| Returning, no unfinished game | **New game** | — | Learn the new pieces · Workshop |

- "Learn the new pieces" leaves the quiet links when all 5 lessons are done. The Guide keeps it.
- In a link game, Continue says "vs your friend". On one device: "White vs Black".
- Esc opens the saved game when one exists. It never skips the lessons.
- Phone: the buttons sit in the lower third, in thumb reach (R11); full width up to 360 px. Desktop: one column of 360 px under the wordmark. Landscape: the lineup in one row, the buttons beside the wordmark (as today).

### 4.3 Lineup card

A tap on a lineup figure opens a small card that grows from the figure (200 ms). Content: the figure, the icon, the name in Cinzel 18, one line from the Guide card, and for one of the 6 new pieces **Try it** (it starts that piece's lesson). × or a tap outside closes it. Example, the Archer: "Shoots without moving, even over other pieces." **Try it**.

### 4.4 Lesson (W4 B)

**Layout.** Phone: a top bar of 48 px (×, "Lesson 1 of 5 · Archer", 5 piece icons), the board at full width, then the task line and **Show me**. Desktop and tablet: the board, and in the rail (desktop) or under the board (tablet) the same top bar items, the task line and Show me. Landscape: the board on the left, the rest in the right column. Nothing else shows: no Menu, no Undo, no moves, no took rows.

- **Coach mark (G2).** The lesson piece pulses twice, then keeps a gold ring. After a tap on it, only the goal squares carry markers. With no move for 8 s, the goal move plays once as a ghost.
- **Show me** plays the goal move as a ghost (the C1 look). It does not play the move.
- **Wrong move.** "Not quite. Try again." The piece shakes, and the move goes back (B4).
- **Success (G3).** The progress icon stamps in gold. A bar slides up from the bottom over the task line, with a chime: **"Well done!"**, the rule in one line, **Next: Guard** (primary, in focus) and **Play a game** (quiet). "Play a game" starts a game at once: Beginner, you play White, a random army.
- **After lesson 5.** "You know the new pieces!" **Play your first game** (primary, in focus). Quiet links: "Bonus: Paladin", "Bonus: Ogre practice".
- The done icons in the top bar are buttons: a tap plays that lesson again.
- **×** ("Leave") goes back to where the player came from: the title on a first visit, else the game.

**Lesson copy** (12 words or less for the task; one line for the rule):

| Lesson | Task | Rule after success |
|---|---|---|
| 1 Archer | "Tap your archer. Then tap the pawn." | "She shoots without moving, even over other pieces." |
| 2 Guard | "The rook gives check. Block it with your guard." | "Only a king can take a guard. A guard never takes." |
| 3 Maester | "Tap your maester, then your knight. They swap places." | "A maester swaps with a friend next to it." |
| 4 Beast | "Tap your beast, then both knights, one after the other." | "After each bite, the beast can bite again." |
| 5 Ogre | "Tap your ogre, then the knight. Choose Push." | "The ogre shoves a neighbour and steps into its place." |
| Bonus Paladin | "Your paladin jumps your own pieces. Take the pawn." | "Taking a pawn is safe. Taking more costs the paladin." |
| Bonus Ogre practice | "Two ogres, one pawn. Try a push and a take." | — (a free board; × to leave) |

### 4.5 Game screen: layout

The markup is one for all sizes; the CSS picks the layout by the screen shape (review item 4). The ticket 02 sample gives the measures; this table gives the changes.

| Part | Phone 390×844 | Landscape 844×390 | Tablet 820×1180 | Desktop 1440×900, laptop 1280×720 |
|---|---|---|---|---|
| Menu | First item of the bottom bar | First item of the bar at the foot of the right column | Right end of the opponent strip | Top right of the rail, in a 44 px row |
| Opponent strip | Top, 40 px (36 px under 700 px tall) | Top of the right column | Above the board | Rail, under the Menu row |
| Board | Full width; squares 45 px or more | Full height, on the left | Full width; frame 736 px or more | Full height, on the left |
| Your strip | Under the board, 44 px. It holds "You · Your move" and the power button | Right column, above the bar | Under the board | Rail, at the bottom |
| Status line | In your strip | In your strip | One row with Hint and Undo | Rail, under the opponent strip, 18 px bold |
| Hint, Undo | Bottom bar | Bottom bar | The status row | One row under the status line |
| Context area | Under your strip; at least 3 lines; it takes the spare height | Under the opponent strip | Under the status row, 4 lines | Under Hint and Undo, a fixed 4 lines |
| Moves line | Above the bar, 48 px | Above your strip | Under the context area | Under the context area, 44 px |
| Moves open | A sheet from the lower edge of your strip to the bar | A sheet over the right column, between the opponent strip and the bar | A sheet from the lower edge of your strip to the screen foot | A fold: the rows fill the rail between the Moves line and your strip |

- **Bottom bar** (phone, landscape): Menu · Hint · Undo, equal width, icon over the label, 56 px plus the safe-area inset.
- **The board never moves** (R15). The board, Hint and Undo move 0 px in every state, also when the Moves open.
- **Short phones** (375×550): the context area and the Moves line share one slot; text wins, and the Moves line comes back when the text ends.
- **Desktop rail**: 352 px (ticket 02). With the Moves closed, the floor shows between the Moves line and your strip.

### 4.6 Game screen: states and copy

Phone: the status shows in your strip, after "You". Wide screens: on the status line.

| State | Status | Context area | Controls in the context area |
|---|---|---|---|
| Before move 1, first 3 games | "Your move" | "New pieces in your army:" and their icons. "Tap one to find it." | One icon button per new piece; a tap rings those pieces on the board |
| Your move, first 3 games | "Your move" | "Tap a piece to see its moves." | — |
| Your move, later | "Your move" | Empty | — |
| Computer's turn | "Computer is thinking…"; a ring fills on its avatar (E1) | Empty | — |
| Check | "Check! Your move" (red) | "Check from their archer." The C2 line shows the cause | — |
| Your piece tapped | — | [icon] **Archer.** "Shoots without moving, over any piece." | All rules |
| Enemy piece tapped | — | [icon] **Their ogre.** "Shoves a neighbour and steps into its place." | All rules |
| Chess piece tapped | — | [icon] **Knight.** "Jumps in an L, over any piece." | All rules |
| Refused tap | — | "That piece is frozen until your next turn." (a 3 px danger mark at the start) | — |
| Hint | — | "Hint: your archer shoots their maester." The C1 ghost shows the move | — |
| Beast chain | — | "Bite again, or stop here." | Stop here |
| Power armed | "Your move" | "Freeze: tap an enemy piece (not the king). Tap Freeze again to cancel." | — |
| After a free mark, or the Haste second move | — | "Now make your move." / "Move again, or end the turn." | End turn |
| Special move, first time in the game (first 3 games) | — | "The archer shot without moving." | — |
| Resign | — | "Resign this game? The computer wins." | **Resign** (danger), Keep playing |
| Link game, your move played | "Their move" | "Your move is in. Send it to your friend." | **Send the game link** (primary) |
| Link game, link sent | "Their move" | "Sent. Your friend moves next." | — |
| Link game, opened | "Your move" | "Your friend moved." The move plays once (T3) | — |
| One device | "White's turn" / "Black's turn" | Empty. A gold edge shows on the side to move (E2) | — |
| Review | "Reviewing move 6" | Desktop: "Move 6. Your archer shot their bishop." Phone: the Moves sheet covers it | — |
| Game over, after Review | "You win!" | "Checkmate on move 23." | **Rematch** (primary), See result |
| Load error | — | "The pieces did not load. Check the connection." | Reload |

- **All rules** opens the Guide at that piece's card.
- **One-line cards.** Every piece card has one line of 12 words or less. The full rules are in the Guide.
- **The power rule text** shows only on a tap on a power button or chip, not all the time.

### 4.7 Menu

- **Phone and landscape:** a bottom sheet from the Menu button, at most 70% of the screen height, so the top of the board stays in view. **Desktop and tablet:** a 320 px popover that grows from the Menu button.
- **Content**, rows of 56 px:
  1. **New game**
  2. **Guide** — "How each piece moves"
  3. **Sound** — a switch, on
  4. **Extras ›** — "Board, moves, Workshop, account" (scent, R4)
  5. a gap and a rule
  6. **Resign** — danger ink. Off on the computer's turn and in review. Hidden when the game is over.
- Header: "Menu" and ×. A tap on Resign closes the Menu and asks in the context area.

### 4.8 New game

- **Phone:** a full-height sheet. **Desktop and tablet:** a 560 px dialog. **Landscape:** a full-height sheet with the footer in view.
- **Header:** "New game" and ×. × drops the changes.
- **Body, in order:**
  1. The three mode cards (Round 3): Play the computer · Kings' powers · Two players.
  2. One row by mode:
     - **Play the computer:** Beginner · Casual · Club · Strong, and one line that follows the choice: Beginner "New to King Down? Start here." · Casual "Relaxed. It makes mistakes." · Club "A solid player. Guard your pieces." · Strong "Thinks longer. A real fight."
     - **Kings' powers:** the level row and its line; "Your king": 6 emblems, 2 power pictures (they loop while chosen), one rule line; then the row "Computer's king: [emblem] Shadow · Death Touch" with **Change**. Change opens that picker and folds yours into a row. One picker is open at a time.
     - **Two players:** On this device · By link, with one line: "Pass the device after each move." / "Send a link after each move." Then a **Kings' powers** switch. With it on: White's picker open, Black's king as a row with Change.
  3. **More options**, closed. Its label names each choice that is not the default: "More options · You play Black · Today's army". Open: "You play": White · Black (not for two players); "Army": Random · Today's · Chess, with "The same army for everyone today." under Today's.
- **Sticky footer:** **Start game** (primary). It has the focus when the sheet opens, so Enter starts the game. When the new game ends an unfinished game, a line shows above it, "This ends your game at move 12.", and the button reads **Start new game** (W20).
- **Defaults:** Beginner until the player finishes a first game, then the remembered setup (W1 B). The sheet remembers the last setup.
- **With `?lab=1`:** the Army row adds Custom… and the example armies, as a select.

### 4.9 Guide

- **Phone:** a full-height sheet with a sticky header ("Guide", ×). **Desktop:** a 640 px dialog, two cards in a row.
- **Body, in order:**
  1. **Learn the new pieces** (primary). Partly done: "Next lesson: Guard". All done: "Play the lessons again".
  2. **What changes from chess:** "Six new pieces join the chess pieces." · "No castling. No en passant." · "Mate the king to win."
  3. The 6 new pieces as cards, in lesson order (Archer, Guard, Maester, Beast, Ogre, Paladin): the figure, the icon, the name, the G1 move diagram, then **Moves**, **Takes**, **Special**, one line each. A diagram plays when its card scrolls into view; a tap plays it again.
  4. Three folds, closed: **Kings and their powers** · **The chess pieces** · **Keys and move notation**.
- On a 390×844 phone the Archer card starts in the first screen.

### 4.10 Choices at the square (H2, H1)

- A small card grows from the square that asks. No blur; the board dims to 0.25. On a phone, the card stays inside the board area; if it has no room, it docks at the lower edge of the board.
- **Take or push:** two picture buttons, **Take** and **Push**. Each picture loops on hover and focus (H1). No paragraph.
- **Promotion:** "Your pawn becomes…" and the painted figures in one row.
- **Sacrifice:** "Which piece comes back?" and the figures of the lost pieces.
- × , Esc or a tap on the board cancels the move.

### 4.11 Result, and after it

- **Order.** The board first (H3): the check line, the crosses on the king's escape squares, the king falls. Then the card rises with its king already down. A tap skips to the card.
- **Phone and landscape:** a bottom sheet over the lower half, so the fallen king stays in view. **Desktop and tablet:** a card in the rail (desktop) or under the board (tablet); it does not cover the board.
- **Content, in order:**
  1. The two kings; the loser is already down.
  2. Title, Cinzel 30: "You win!" · "The computer wins" · "Draw" · "White wins!" / "Black wins!" (one device) · "Your friend wins" (link game).
  3. One line: "Checkmate on move 23." · "You resigned on move 14." · "Draw: stalemate on move 41." · "Draw: the same position three times."
  4. **Moves to look at again:** up to 3 story rows (section 5) with a star, each with "Better: your knight takes their pawn." A tap opens review before that move, with the better move as a ghost. While they load: "Looking for moves to look at again…" with 3 faint rows. With none, the heading does not show.
  5. Daily game only: **Share today's result** (secondary): the share sheet on a phone, a copy on desktop.
  6. **Rematch** (primary), with "You play Black" under it · **Review** (secondary) · **New game…** (quiet; it opens the New game sheet with the last choices).
- **No Close.** Review, Esc and a tap outside close the card. The card shrinks into the context area, which keeps "You win! · Checkmate on move 23." with **Rematch** and **See result** (the card again).
- **After Rematch:** the same army and level, the colours change. The army musters (T2). "You play Black" slides up in your strip and fades after 1.5 s. A Rematch of a daily game says "A rematch is not today's game." in the context area.

### 4.12 Open-link sheet, toasts and errors

- **Open-link sheet.** Only when a game link opens over a different saved game with moves. "Open your friend's game?" · "It ends your game against Casual at move 12." · **Open it** (primary) · **Keep mine**. After Open it, the friend's last move plays once (T3).
- **Toasts.** Above the bar (phone, landscape) or at the foot of the rail (desktop). They stay 4 s and never cover the focus. "Link copied. Paste it to your friend." with a check mark that draws (E3). Errors use the same place with a danger mark: "The Workshop could not load. Check the connection.", "Part of this game link could not be read."

### 4.13 Workshop

No change (revision 3, approved 2026-10-07; W9 B stays). Its doors: the title link and Extras › Workshop. It opens over its caller and Back goes back to it.

## 5. The moves section

### 5.1 Closed (the default at every size)

- One row, 48 px on touch and 44 px with a mouse. The whole row is one button: "Show all moves".
- Content, left to right: the move number (soft ink), the piece icon in its army's colour, the sentence, the event icon, "Moves" in soft ink, a chevron.
- Example: "12 · [queen] Their queen moves. [gem] Moves ⌃".
- Before move 1: "Your moves show here." (R19).
- The device remembers if the player leaves it open.

### 5.2 Open

- **Header:** open, the Moves line becomes the header of the list: "Moves · 24", **◀**, **▶** and ×. In review, × becomes **Back to game** (primary).
- **Phone and tablet:** a sheet from the lower edge of your strip to the bar. The board stays in view, so a tap on a row shows that board above it.
- **Landscape:** a sheet over the right column.
- **Desktop and laptop:** the fold opens in the rail, from the Moves line down to your strip. Nothing above it moves.
- **Rows:** one row for each move; the number shows once for each turn, at the left of White's row. A Haste turn is two rows under one number. The newest row is at the foot, and the list scrolls to it.
- **A tap on a row** starts review there: the board goes back (B4), and the row gets a gold edge. ◀ and ▶ step one move. ← and → do the same at every size; on desktop they also open the fold.
- **Row height:** 44 px on touch, 32 px with a mouse (R22).

### 5.3 Rows: plain words and icons

A row: the piece icon (Round 4 icons in the army's colour) · a sentence of 6 words or less, with no squares · the event icon. The sentence of `describeMove()` is the row's accessible name, so a screen reader hears the full move.

- **Event rows** (a capture, a check, a power, a promotion, a special move): ink text, the verb in bold, the event icon in colour.
- **Quiet rows** (a plain move): soft ink, a small faint gem (decision W18).
- **Who:** "Your" and "Their" against the computer and in a link game; "White's" and "Black's" on one device.

| Event | Sentence | Event icon (the board's marker shape) |
|---|---|---|
| Move | "Their queen moves." | Gold gem, small and faint |
| Capture | "Your bishop takes their knight." | The taken piece's icon in crimson brackets |
| Archer shot | "Your archer shoots their rook." | Gun-sight over the taken piece's icon |
| Ogre shove | "Their ogre shoves your rook." | Teal chevrons |
| Maester swap | "Your maester swaps places." | Violet arrows |
| Beast chain | "Your beast bites 2 pieces." | Linked rings with "2" |
| Paladin takes more than a pawn | "Your paladin trades for their rook." | Crimson brackets and a small fallen paladin |
| Promotion | "Your pawn becomes a queen." | Up arrow, then the queen's icon |
| Power | "Freeze: their bishop cannot move." | Blue rune with the king's emblem |
| Check | The sentence, then a red "Check!" tag | Crown with a red burst |
| Mate | "Checkmate. You win!" | Fallen king |
| Draw | "Draw: stalemate." | Two standing kings |

**Power rows** start with the power's name: "Freeze: their bishop cannot move." · "Ice Wall: your knight is safe." · "Strike: your rook moves like a queen." · "Flight: your knight flies." · "Haste: your knight moves twice." · "Sacrifice: your rook comes back." · "March: your pawn steps two." · "Leap: your rook jumps your pawns." · "Death Touch: their king takes your knight." A move that an always-on power allows carries the emblem as its event icon.

**Icons.** The event icons are 20 × 20 px SVG symbols in the marker colours of `src/render/marks.ts` (move gold, capture crimson, swap violet, shove teal, power blue). Each has a thin ink outline, so it has 3:1 contrast on the parchment (R24). No event uses colour alone: each has a shape and a word.

### 5.4 Verbs (decision W17)

One verb for each piece, in every place: the moves, the lessons, the Guide, the hints.

| Piece | Plain move | Capture |
|---|---|---|
| Pawn, king | steps | takes |
| Knight | jumps | takes |
| Bishop, rook, queen | moves | takes |
| Archer | moves | shoots |
| Guard | moves | — (a guard never takes) |
| Maester | steps | takes; "swaps places" with a friend |
| Beast | moves | bites ("bites 2 pieces") |
| Ogre | moves | takes; "shoves" a neighbour |
| Paladin | moves | takes a pawn; "trades for" any other piece (both leave the board) |

### 5.5 Move notation

With Extras › Move notation on, each row adds the move in chess notation at its end, in soft ink, for example "Ae3*c5". The row keeps its icons and words. The Guide fold "Keys and move notation" explains the letters and signs. Copy moves and the game links always use the notation.

### 5.6 Moves to look at again

After the game, up to 3 rows get a star and a second line: "Better: your queen moves to safety." A tap shows the board before the move, with the better move as a ghost (C1). The result card shows the same rows.

### 5.7 Motion when a move joins

1. The row changes at contact, not at launch (MR8), so the line never tells the move before the board shows it.
2. Closed line: the old sentence moves up 8 px and fades (160 ms, `in`). The new one rises 8 px into place (200 ms, `out`).
3. The event icon pops at the hit (300 ms, `pop`). A taken piece's icon flies from the board to the taker's took row in its strip (D1, 450 ms, `inout`).
4. Check: the red tag and the crown pulse once. Power: the emblem glints once. Promotion: the pawn icon cross-fades into the new piece. 300 ms each.
5. Open list: the newest row has a gold wash that fades in 900 ms (D2).
6. None of these is a peak beat. The board keeps the move's one peak (MR10).
7. Off and reduced motion: the row is there at once, with all its icons and words.

**The 2-second test.** A player looks away for one computer move, then reads the closed line, and says what happened in 2 s, with no square names.

### 5.8 Example: the sample game in rows

The ticket 02 sample game (you play White), for the builders:

| # | Your move | Their move |
|---|---|---|
| 1 | Your pawn steps. | Their pawn steps. |
| 2 | Your knight jumps. | Their knight jumps. |
| 3 | Your pawn steps. | Their bishop moves. |
| 4 | Your archer moves. | Their pawn steps. |
| 5 | Your archer moves. | Their queen moves. |
| 6 | **Your archer shoots their bishop.** (gun-sight over a bishop) | Their queen moves. |
| 7 | Your queen moves. | Their king steps. |
| 8 | **Your archer shoots their pawn.** (gun-sight over a pawn) | Their archer moves. |
| 9 | Your archer moves. | Their queen moves. |
| 10 | Your pawn steps. | **Their maester swaps places.** (violet arrows) |
| 11 | Your archer moves. | Their queen moves. |
| 12 | Your archer moves. | Their queen moves. |

The powers sample game: 1. "Your pawn steps." "Their pawn steps." 2. "Your knight jumps." "Their knight jumps." 3. "Your pawn steps." **"Their pawn takes your pawn."** 4. **"Your knight takes their pawn."** "Their pawn steps."

## 6. Motion

### 6.1 Rules

- The tokens and easings of motion-review §5: `--dur-tap` 80, `--dur-quick` 160, `--dur-pop` 300, `--dur-move` 450, `--dur-peak` 650 ms; `out`, `inout`, `pop`, `in`, `fall`. Sheets: 240 ms to open, 200 ms to close; popovers: 200 and 140 ms.
- One sequence lasts 900 ms or less; the result may last 2.6 s (R27).
- One thing moves at a time; list rows stagger 30 ms, 8 rows at most (R28).
- Every motion ends on a still frame that keeps its information. Off and reduced motion show that frame. Fast halves every time (R25, R29).
- A tap skips; a new action cancels (MR5). DOM motion uses transform and opacity only, with no animated blur or height (MR9).
- Loops run only while the player decides (MR7): the lesson pulse, the power pictures, the Take and Push pictures.
- Board motion is the W12 A release (F3, H3, C1, C2, E1, F1, D1, T3, then F2, B4, G1, G2). This spec uses it and adds the motion of the screens.

### 6.2 Each screen and transition

| Where | Job | What moves | Time, easing | End frame (= Off) | ID |
|---|---|---|---|---|---|
| Title → game | One world | The title fades; a night tint over the game lifts | 250 `out`; 400 `inout` | The game screen | T1 (small) |
| New game, Rematch | The drawn army is news | Back ranks rise file by file, then the pawns | 360 per piece, 38 ms a file, about 750 | The set board | T2 |
| Link, Continue | What the friend did | The last move plays once | 300 wait + the gait | The board | T3 |
| Lineup card | Where it comes from | The card grows from the figure | 200 `out`; 140 `in` | The card | — |
| Lesson piece | What to tap first | It pulses twice, then keeps a ring; a ghost after 8 s | 2 × 600 | The ring | G2 |
| Lesson done | Progress | The icon stamps 1.4 → 1; the bar slides up; a chime | 200 `pop`; 240 `out` | Gold icon, the bar | G3 |
| Lesson wrong | The cause | The piece shakes; the move goes back | 240 + 260 | The lesson position | G3, B4 |
| Menu, Extras (phone) | Where it comes from | The sheet slides up from the bar | 240 `out`; 200 `in` | The sheet | H4 |
| Menu, Extras (desktop) | Where it comes from | The popover grows from Menu (scale .92 → 1, fade) | 200 `out`; 140 `in` | The popover | H4 |
| Menu → Extras | One level deeper | Shared X axis: the content slides 24 px and fades; Back reverses it | 200 `out` | Extras | — |
| New game, Guide | Where it comes from | Phone: slides up. Desktop: fades and rises 12 px | 240 `out`; 200 `in` | The sheet | H4 |
| Switches, segments | The tap answers | The thumb or the ring slides | 160 `out` | New state | — |
| Animations row | It shows the pace | A small pawn steps at that pace | 440 / 220 / a jump | The pawn at rest | I1 |
| Context area | What changed | The old text fades; the new rises 8 px; the height stays | 80 + 160 `out` | New text | — |
| Turn, thinking | Whose turn | The disc turns; a ring fills over the thinking time; a red pulse on check | 320 `inout`; 300 `pop` | The disc in the side's colour | E1 |
| One device | Whose turn | A gold edge warms on the side to move | 300 | The edge | E2 |
| Hint | Which move | A see-through piece plays it once, then rests | 450 `inout` | A faint ghost at .38 | C1 |
| Check | The cause | A red line from the checker; the king's ring pulses | 250 `out`; 300 | A dashed line, the ring | C2 |
| Power | The power is the king's | A wave from the king; ice climbs a frozen piece; the count rolls | 60 ms a square; 450; 160 | Runes, ice badge, count | F1, F3, F4 |
| A move joins the line | What happened | Section 5.7 | 160 + 200 + 300 | The newest row | D1, D2 |
| Moves open (phone) | Where the list is | The sheet rises from the line; the last 6 rows rise 8 px, 30 ms apart | 240 `out`; 200 `in` | The open list | — |
| Moves open (desktop) | Where the list is | The rows fade and rise 12 px, 30 ms apart | 200 `out` | The open list | — |
| Review step | Time goes back | The pieces slide back; the gold edge slides to the row | 260 a ply `inout`; 160 | The viewed board | B4 |
| Choice at the square | Which square asks | The card grows from the square | 200 `out`; 140 `in` | The card | H2 |
| Resign | It ended | The king falls at once, then the card | 650 `fall` | The card | H3 |
| Result | How it ended | The check line, the crosses, the fall; the card rises with its king down | 2.6 s at most | The card | H3 |
| Result → Review | Where it went | The card shrinks into the game-over line | 200 `in` | The game-over line | — |
| Toast, copy | It worked | It rises 8 px; a check mark draws | 160 `out`; 240 | "Copied" | E3 |

### 6.3 Rank, for the motion sample

1. A move joins the Moves line (quiet, capture, check, power, promotion): the owner's own request.
2. The sheets: Menu, Extras, Moves, New game. They show where each surface lives.
3. The result, board first (H3).
4. The context area at a fixed height.
5. The lesson: coach mark, stamp, a wrong move.
6. Title to game, and the muster.
7. The choice at the square.
8. Toasts, switches and the Animations pawn.

## 7. Journeys before and after

Taps to the goal. "Today" is `main` (the defects branch in brackets where it differs). Screens use the names of section 1.

| # | Journey | Today: taps, screens | After: taps, screens | What changes |
|---|---|---|---|---|
| J1a | First visit, Learn, to the first lesson move | 3; title → lesson | 3; title → lesson | 1 marked square, not 8; about 30 words, not 100 |
| J1b | First visit, Play, to the first move | 4; title → New game → game | 4; title → New game → game | Beginner chosen; Start in focus; about 60 words, not 140. W19 B gives 3 |
| J1c | First visit, to the end of lesson 1 | 3 | 3 | The stamp, the chime, Next in focus |
| J1d | All lessons, then a game move | 24; title → 6 lessons → New game → game | 20; title → 5 lessons → game | "Play your first game" starts at once; Paladin is a bonus. After lesson 1, "Play a game": 6 |
| J2 | Returning player continues | 1; title → game | 1; title → game | Continue names the opponent |
| J3 | Chess player, a Strong game | 3 (main: 6 and 2 scrolls); title → New game → game | 3, then 2 with the remembered level | Strong is stronger (W1 B); the level line is in view |
| J3 | … as Black with the chess army | +4 | +3 | Segments, not a select |
| J4 | Two players, one device | 3; title → New game → game | 3 | No link button on every turn; the E2 edge |
| J5 | Link game, first send | 6 + external | 7 + external | +1 for "By link"; no browser box; the friend's move plays (T3) |
| J5 | Link game, each later turn | 3 + external | 3 + external | The context line says what to do |
| J6 | Powers game, to the first Freeze | 8 + 1 scroll; about 340 words | 8, no scroll; about 90 words | Your picker only; Start in view; the ice mark |
| J7 | Daily game | 5 | 4; 2 the next day | Army segments |
| J8 | Workshop, from the title / from a game | 5 / 5 | 5 / 7 (Menu, Extras, Workshop) | A rare place goes 2 taps further (R3) |
| J9 | Review a finished game | 1–2 to start, then 1 per move + 1 scroll per 4 moves; the result cannot open again | 1 (Review) to start, then 1 per move, 0 scrolls; See result opens it again | ◀ ▶ in the Moves header; ← → everywhere |
| J10 | Sound off / Animations Off | 3 / 4, + 1 scroll | 2 / 3, + 1 to close; no scroll | Sound in the Menu; segments |
| J11 | Resign | 2 (a browser box) | 3; Menu → question in the context area | Far from Undo, on purpose (R11) |
| J12 | Rematch after the card closes | not possible (2 for a game that is not a rematch) | 1; the game-over line | No dead end |
| J13 | Rules of an enemy piece, touch | 2 + 3–10 scrolls (main) | 1 | The card in the context area |
| J14 | Sign in | 2 + 1 scroll + external | 3 + external (+1 scroll on a small phone); Menu → Extras | A rare task goes 1 tap further |
| J15 | Read all the moves (new) | 0: always open | 1: the Moves line | The cost of the owner's request |
| J16 | Chess notation on (new) | — | 3: Menu → Extras → switch | — |

**The new player** finishes a lesson and a first game and never opens Extras (R1). **The chess player** keeps every path at 1 tap or 1 key: Rematch, ← →, Z, Esc. Strong is 3 taps. Notation is one switch.

## 8. The guideline behind each choice

| Choice | Rules |
|---|---|
| 3 buttons and the Moves line in view; all else in Menu or Extras | R1, R3, R7, R11, R13 |
| One Menu with one name at every size | R9, R10, R13 |
| Extras inside the Menu's container; two levels | R2, R4, R14 |
| No Settings screen; Sound in the Menu | R7 |
| One fixed context area; no Cancel button; the board never moves | R15, R23; review item 1 |
| The Moves closed; story rows; the board's marker shapes as icons | The owner; R3, R8, R10, R24 |
| ◀ ▶ in the Moves header; ← → at every size | R9, R10; review item 10 |
| Resign last in the Menu; the question in the context area | R11; review item 2 |
| A lesson screen with only the lesson; Play after each lesson | R16, R17; W4 B |
| "New pieces in your army" and tips only in the first 3 games | R18, R19 |
| Level lines in view; 3 army segments | R5, R6, R8 |
| Sticky footers; a warning line in place of a browser box | R14; review item 6 |
| The result board first; Rematch main; no Close; Rematch stays | R9, R10; W8 B, H3 |
| Choices at the square | R26; H2 |
| No browser boxes | R10, R14 |
| Every tap answers in 100 ms; one peak beat a move | R20, R21 |
| Motion with a job, short, one focus, a still end | R25–R29; MR1–MR10 |
| The designer's tools behind `?lab=1` | W6 B |

## 9. Changes to the earlier picks and rounds

Said plainly. Each change with a decision line is open; work continues under the pick.

- **W2 C changes** (W13, W14). Desktop and tablet lose the text toolbar and the Resign flag of the ticket 02 sample; one Menu button takes their place. The phone bar goes from 5 items to 3: Previous and Next move to the Moves header. The Menu holds New game, Guide, Sound, Extras and Resign. The Workshop moves to Extras; Settings goes.
- **Review item 10** (visible review controls) stays, in the Moves header, not in the bar.
- **Review item 13** (a shorter Settings) goes further: no Settings screen.
- **The ticket 02 sample:** the move list leaves the panel. Its idle note, "The computer moved its queen from h6 to e6.", becomes the Moves line.
- **W1 B, W3 C, W6 B, W7 B, W9 B, W10 B, W11 B, W12 A:** no change.
- **W4 B:** no change. Ogre practice joins the Paladin as a bonus lesson (from W6 B).
- **W5 B:** one detail: one picker open at a time, and Change swaps them.
- **W8 B:** the buttons do not change. The card sits in the rail (desktop) or as a bottom sheet (phone). It has no Close; the context area keeps Rematch after Review.
- **Round 3:** Play still opens New game (W19 A keeps "the first menu after the first screen"). "No power" leaves the pickers (W21).
- **Round 4:** the move list no longer keeps its letters. It shows the piece icons and words; the letters show only with Move notation on.
- **Defects D-4:** the browser question becomes a warning line in the New game footer (W20).

## 10. The rendered sample: four groups

### 10.1 Rules for the four builders

- **Folders.** `docs/specs/web-ux/screens/sample/<group>/`, with `<group>` one of `game`, `start`, `setup`, `motion`. Each folder holds its pages, its CSS, its capture script and a README in ASD-STE100. Copy what you need from `docs/specs/web-ux/sample/` (the tokens in `sample.css`, the board images, `boards.mjs`, `capture.mjs`); do not change that folder.
- **Art and fonts** come from `public/` by relative paths. Serve the pages over http on the port you get. Open no file:// page. Stop a server you start by its PID.
- **Renders, strips and videos** go to an out-dir outside the repository. Do not commit them.
- **Names.** A render is `<state>-<size>.png`; a contact sheet is `sheet-<state>.png`. Sizes: `desktop` 1440×900, `laptop` 1280×720, `tablet` 820×1180, `phone` 390×844, `landscape` 844×390. Check sizes: `phone-safari` 390×664, `se` 375×667, `se-safari` 375×550, `se-landscape` 667×375. The touch sizes are all but desktop and laptop; emulate a coarse pointer there.
- **Copy.** Use the in-app copy of this spec word for word. Player words only.
- **Board images.** Reuse the ticket 02 images where the board is the same. For a new board, run a copy of `boards.mjs` against a dev server of this worktree (`npx vite --port <port> --strictPort`).
- **Checks on every render**, scripted, one PASS or FAIL line each: no sideways scroll; every control inside the screen and not clipped; 44 × 44 px controls on touch sizes; body text 16 px and no text under 14 px; Cinzel only at 18 px and larger; text contrast 4.5:1 (3:1 for large text) and icon contrast 3:1; at most one crimson control in each view; visible focus.

### 10.2 Group `game`: the game screen v2

All states at the five sizes. Also at the four check sizes: `idle`, `selected`, `moves`, `review`, `powers`.

| State | What it shows |
|---|---|
| `first` | A first game, before move 1: "Your move"; the context area "New pieces in your army:" with 3 icons; the Moves line "Your moves show here." |
| `idle` | The sample game at move 12, a later game: the context area empty; the Moves line "12 · Their queen moves." |
| `thinking` | The computer's turn: "Computer is thinking…", the ring on its avatar; Hint off |
| `check` | "Check! Your move" in red; the C2 line on the board; "Check from their archer." |
| `selected` | Your maester tapped: its one-line card and "All rules" |
| `enemy` | Their ogre tapped: "Their ogre. Shoves a neighbour and steps into its place." |
| `hint` | "Hint: your archer shoots their maester." and the C1 ghost |
| `moves` | The Moves open (phone sheet, desktop fold), live: the 24 rows of section 5.8, the newest at the foot with its gold wash at rest |
| `review` | Review at move 6: the Moves open, row 6 with the gold edge, ◀ ▶ and Back to game; Hint and Undo off; the board after move 6 |
| `notation` | `moves` with Move notation on (phone and desktop only) |
| `powers` | The powers game: your Freeze button (1 left), their Death Touch chip; the Moves line "4 · Their pawn steps." |
| `armed` | Freeze armed: the context step; the runes on the board |
| `resign` | The question in the context area |
| `link` | A link game after your move: "Your move is in. Send it to your friend." and Send the game link |
| `link-copied` | The toast "Link copied. Paste it to your friend." (phone and desktop only) |
| `hotseat` | Two players on one device: "Black's turn", the gold edge, "White" and "Black" in the strips |
| `over` | After Review of a won game: the king down; "You win!"; "Checkmate on move 23." with Rematch and See result |
| `menu` | The Menu open over the idle game |
| `extras` | Extras open over the idle game, at the top of its list |

Group checks: fixed controls in view: `idle` 4, `selected` 5, `powers` 6, `review` 6 (rows apart). Hint and Undo move 0 px across the live states. The board moves 0 px when the Moves open. The Moves are closed in every state but `moves`, `review` and `notation`. On a phone the Menu sheet leaves the top of the board in view, and Extras shows its Board, Play and Moves groups with no scroll. The board measures of ticket 02 still pass.

### 10.3 Group `start`: title, first run, lessons, Guide, choices

| State | Sizes | What it shows |
|---|---|---|
| `title-first` | five | First visit: Learn the new pieces (main), Play, Workshop link |
| `title-return` | five | An unfinished game: Continue "vs Computer · Casual · move 12", New game, the two links |
| `title-done` | phone, desktop | All lessons done: the Learn link is gone |
| `title-card` | phone, desktop | The Archer figure tapped: its card with Try it |
| `lesson-start` | five | Lesson 1: the archer's ring (the G2 end frame), the task line, Show me |
| `lesson-selected` | phone, desktop | The archer tapped: only the pawn marked |
| `lesson-showme` | phone | Show me: the ghost at rest |
| `lesson-wrong` | phone | "Not quite. Try again." |
| `lesson-done` | phone, desktop, landscape | The success bar: Well done!, the rule, Next: Guard, Play a game |
| `lesson-ogre` | phone, desktop | Lesson 5: the Take or Push card at the square |
| `lesson-last` | phone, desktop | After lesson 5: Play your first game, the two bonus links |
| `guide` | five | The Guide top: Learn, What changes from chess, the first new-piece cards |
| `guide-powers` | phone, desktop | The fold "Kings and their powers" open |
| `guide-card` | phone | The Archer card with its G1 diagram at rest |
| `choice-push` | phone, desktop, landscape | Take or Push in a game |
| `choice-promo` | phone, desktop | Promotion at the square |
| `choice-sacrifice` | phone | Sacrifice: "Which piece comes back?" |

Group checks: the lesson screen shows only ×, the lesson title, the progress icons, the board, the task line and Show me (or the success bar); only the goal squares carry markers; Next has the focus in `lesson-done`; on a phone the Archer card of the Guide starts above 844 px; a choice card stays inside the screen.

### 10.4 Group `setup`: New game, Extras pages, Account, result, Rematch

| State | Sizes | What it shows |
|---|---|---|
| `newgame-computer` | five | A first game: Play the computer, Beginner and its line, More closed, Start game in focus |
| `newgame-more` | phone, desktop, landscape | Strong chosen; More open: You play Black, Army Chess |
| `newgame-label` | phone | More closed with the label "More options · You play Black · Today's army" |
| `newgame-powers` | five | Kings' powers: your picker (Frost, Freeze), the computer's row with Change |
| `newgame-change` | phone, desktop | The computer's picker open; yours folded into a row |
| `newgame-two` | phone, desktop | Two players: On this device chosen; the Kings' powers switch off |
| `newgame-link` | phone | Two players: By link chosen |
| `newgame-two-powers` | phone | Two players with the switch on: White's picker, Black's row |
| `newgame-replace` | phone, desktop | The warning line and Start new game |
| `newgame-lab` | desktop | `?lab=1`: the army select with Custom and the example armies |
| `extras-account` | phone, desktop | Extras at its More group: Workshop and the signed-out Account |
| `extras-signed-in` | phone, desktop | The signed-in Account |
| `extras-delete` | phone, desktop | The delete question in place |
| `extras-lab` | phone, desktop | `?lab=1`: the Lab group |
| `result-win` | five | The H3 end frame, then the card: You win!, 3 moves to look at again, Rematch, Review, New game… |
| `result-loading` | phone | "Looking for moves to look at again…" |
| `result-loss` | phone, desktop | "The computer wins" |
| `result-draw` | phone | "Draw: stalemate on move 41." |
| `result-resigned` | phone | "You resigned on move 14." |
| `result-hotseat` | phone | "White wins!" |
| `result-daily` | phone, desktop | Share today's result |
| `rematch` | phone, desktop | After Rematch: the board turned, the muster at rest, "You play Black" in your strip |
| `open-link` | phone, desktop | The "Open your friend's game?" sheet |

Group checks: Start game is in view with no scroll in every mode and size; the phone result sheet leaves the fallen king's square in view, and the desktop card stays inside the rail; Extras pages match section 3 word for word.

### 10.5 Group `motion`: prototypes, videos and strips

Each prototype is one HTML page with a seekable timeline and Normal, Fast and Off. Start from the motion review kit (`kit.js`, `kit.css`, `strip.mjs`, `strip.py`); copy it into the folder and load the art over http. For each prototype: a WebM video at Normal, and a frame strip of at least 8 frames whose last frame equals the Off frame. Size: phone 390×844; also desktop 1440×900 where the table says so.

| Rank | Prototype | What it plays | Desktop too |
|---|---|---|---|
| 1 | `move-quiet` | A quiet move joins the closed line: the old sentence leaves, the new one comes in, the gem pops | Yes |
| 2 | `move-capture` | A capture: the icon pops at the hit; the taken icon flies to the took row (D1) | Yes |
| 3 | `move-check` | A check: the line and the crown pulse; the C2 line; the status turns red | — |
| 4 | `move-power` | Freeze: the wave from the king (F1), the ice (F3), the emblem glint in the line | — |
| 5 | `move-promo` | A promotion: the pawn icon becomes the queen in the line | — |
| 6 | `moves-open` | The Moves open and close; the newest row's wash; a review step (the edge slides, the board goes back); Back to game | Yes |
| 7 | `sheets` | The Menu opens and closes; Menu → Extras → Menu; the New game sheet; the context area cross-fade | Yes |
| 8 | `result` | The H3 sequence, then the card (phone sheet, desktop rail card); Review shrinks it into the game-over line | Yes |
| 9 | `lesson` | The coach pulse, the success bar and stamp, a wrong move and its rewind | — |
| 10 | `title` | Title to game (T1, small) and the muster (T2) | Yes |
| 11 | `choice` | The Take or Push card grows from the square; the pictures loop on focus | — |
| 12 | `feedback` | The toast and its check mark; a switch; the Animations pawn at Normal, Fast and Off | — |

Group checks: each sequence lasts 900 ms or less (the result 2.6 s or less); Fast takes half the time; Off shows the end frame at 0 ms; the keyframes change only transform and opacity; a tap skips to the end frame.

### 10.6 Journey storyboards

The storyboards are put together after the four groups finish (plan step 5), from the renders by name. Phone frames unless the line says desktop.

| Journey | Frames, in order |
|---|---|
| J1a | start/`title-first` → start/`lesson-start` → start/`lesson-selected` → start/`lesson-done` |
| J1b | start/`title-first` → setup/`newgame-computer` → game/`first` → game/`selected` |
| J1d | start/`title-first` → start/`lesson-start` → start/`lesson-done` → start/`lesson-ogre` → start/`lesson-last` → game/`first` |
| J2 | start/`title-return` → game/`idle` |
| J3 (desktop) | start/`title-return` → setup/`newgame-more` → game/`idle` |
| J4 | setup/`newgame-two` → game/`hotseat` |
| J5 | setup/`newgame-link` → game/`link` → game/`link-copied` → setup/`open-link` |
| J6 | setup/`newgame-powers` → game/`powers` → game/`armed` → motion/`move-power` strip |
| J7 | setup/`newgame-label` → game/`idle` → setup/`result-daily` |
| J8 | game/`menu` → game/`extras` → setup/`extras-account` |
| J9 | setup/`result-win` → game/`review` → game/`over` |
| J10 | game/`menu` → game/`extras` |
| J11 | game/`menu` → game/`resign` → setup/`result-resigned` |
| J12 | game/`over` → setup/`rematch` |
| J13 | game/`enemy` |
| J14 | game/`menu` → setup/`extras-account` → setup/`extras-signed-in` |

## 11. Verification

- [ ] Every control of `index.html` and every screen that `src/main.ts` builds has a home in section 2.2.
- [ ] The game screen shows fewer controls than the ticket 02 sample: 4 at idle at every size. The Moves are closed by default.
- [ ] Each journey has a storyboard and its taps before and after (sections 7 and 10.6).
- [ ] Measured on each render: no sideways scroll, controls inside the screen, 44 px targets on touch sizes, body text 16 px, contrast AA, icon contrast 3:1.
- [ ] Hint and Undo move 0 px across the game states; the board moves 0 px when the Moves open.
- [ ] Each motion ends on a still frame that keeps its information; Animations Off shows that frame.
- [ ] The owner's yes on the sample, and on the decisions below.

## Owner decisions

Each line: the rule, the options, my pick, and what happens on yes. Work continues under the picks.

- **W13. One Menu at every size.** *The Menu has one name, one icon and one place at each size.* Today 4 tiles; the ticket 02 sample (W2 C) has a text toolbar and a Resign flag on desktop and tablet. (A) Keep W2 C; (B) one "Menu" button: top right of the rail on desktop and tablet, first in the bar on phones. **Pick B.** On yes: the toolbar and the flag go; `WORKSHOP.md:11` and the phone check of `#workshop-btn` change.
- **W14. Previous and Next.** *Review controls sit with the moves they step through.* (A) In the phone bar, always (ticket 02); (B) in the header of the open Moves, with ← → at every size. **Pick B.** On yes: the phone bar has 3 items; review on a phone costs 1 more tap.
- **W15. The name.** *The menu says what it holds.* (A) "Extras"; (B) "Extra", your word; (C) "More". **Pick A.** On yes: the Menu row, the sheet title and the docs use it.
- **W16. Move rows.** *Moves read as a story of icons and plain words; chess notation is a choice.* (A) Notation as today, in a closed section; (B) story rows with no squares, and an Extras switch that adds the notation at the end of each row; (C) B, plus the target square as a quiet chip on every row. **Pick B.** On yes: the rows come from `describeMove()`; Copy moves and the game links keep the notation.
- **W17. Piece verbs.** *Each piece has one verb in all copy.* Draft: the pawn and the king step; the knight jumps; the archer shoots; the maester swaps; the beast bites; the ogre shoves; the others move; a capture takes. **Pick this list**; change any verb you like. On yes: the moves, the lessons, the Guide and the hints use the same verbs.
- **W18. Quiet moves.** *Events stand out, and every move stays one tap away.* (A) Quiet moves stay as soft rows with a faint icon; (B) 3 or more quiet turns in a row fold into one line, "4 quiet turns". **Pick A.** It needs no extra control.
- **W19. First Play.** *A new player meets one setup screen with one main button.* (A) Play opens New game with Beginner chosen and Start game in focus (it keeps your Round 3 "first menu after the first screen"); (B) on a first visit, Play starts a Beginner game at once. **Pick A.** B saves 1 tap. After the lessons, "Play a game" starts at once in both.
- **W20. New game over an unfinished game.** *Warn before the tap; do not ask twice.* (A) The browser question of the defects branch (D-4); (B) a line above the button, "This ends your game at move 12.", and the button reads "Start new game". **Pick B.** On yes: the D-4 question goes, and player paths have 0 browser boxes.
- **W21. "No power".** *A powers game gives each king a power.* (A) Keep "No power" in each picker (Round 3); (B) move it behind `?lab=1`. **Pick B.** On yes: the picker has 8 buttons.
