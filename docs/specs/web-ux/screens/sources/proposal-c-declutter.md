# Menus, screens and journeys: the radical declutter

Ticket 03, angle "radical declutter", 2026-10-08. It builds on the picks W1–W12 and the ticket 02 sample. R1–R29 are the numbered rules of the guidelines document. In-app copy is in quotation marks.

**The idea.** In a game, the screen holds the board, two player strips, one context area, one Moves line and three buttons: Menu, Hint, Undo. All else is one or two taps away. Motion and the board say what text says today.

## 1. Screen map

```text
Title ─ Continue ─────────────► Game
      ├ Learn the new pieces ─► Lesson (lesson-only screen)
      ├ Play, first visit ────► Game against Beginner, no setup
      ├ Play, later ──────────► New game sheet ─► Game
      └ Workshop (quiet link) ► Workshop (rev 3, no change) ─► caller

Game
├ Menu ─► Menu sheet
│         ├ New game ─► New game sheet
│         ├ Guide ────► Guide sheet ─► Learn ─► Lesson
│         ├ Sound (switch, in place)
│         ├ Extras ───► Extras (replaces the Menu content) ─► Workshop
│         └ Resign ───► question in the context area ─► Result
├ Hint, Undo (in place)
├ Moves line ─► Moves (phone: sheet over the panel; desktop: fold) ─► review
├ board ─► Capture or push · Promotion · Sacrifice (small cards at the square)
└ game ends ─► Result ─► Rematch · New game… · Review

Lesson ─► success sheet ─► Next | Play a game;   × ─► where you came from
Game link ─► Game (a question in the context area if it replaces a game)
?lab=1 ─► a Lab group in Extras; lab armies in New game
```

Menu and Extras are the only two levels (R2). Sheets never stack (R14). Browser boxes: 9 → 0.

## 2. The home of each item

Homes: **View** (on screen), **Menu**, **Extras**, **Lab** (`?lab=1`), **Gone**. IDs are the inventory IDs.

| Items | Home | Reason |
|---|---|---|
| T1–T3 kings, lineup, wordmark | Title. A tap on a figure opens its Guide card. New line "Chess with six new pieces" | Round 2, C:ONB-18, W3 |
| T4 Continue | Title, main: "Continue · move 12 vs Computer" | C:SET-M2 |
| T5 Learn | Title, main, until the player ends lesson 1 or a game; then Guide only | R1, R16 |
| T6 Play | Title, second. First visit: a Beginner game starts at once | W1, R17 |
| T7, P3 Workshop | Title quiet link; Extras | Rare (W3, R11) |
| T8 Esc | Closes the title only when a game exists | C:SET-M5 |
| G1 header card | Gone | Item 3 |
| G2, G3 turn and status | One status line with the turn token; the ring replaces "thinking…" | Item 3, E1 |
| G4 loading | Gone as text: the army musters (T2) | R26 |
| B1–B4, B6–B8, B11 | View | Every |
| B5 enemy tap | Its card in the context area | D-10 |
| B9 pointer over a square | Ghost and capture mark only; the card shows on a tap | C:VIS-M1 |
| B10 Shift-click, R key | Lab | Designer |
| M1–M4, M10 marks | View, with the W11 B trail | Round 2 |
| M5 hint boxes | Ghost move (C1) and one line | Item 9 |
| M6–M8 threats, coordinates, letters | Extras › Board | R7 |
| M11 frozen piece | New ice mark (F3) | C:PW-1 |
| P1 New game, P2 Guide | Menu | Once a game (R3) |
| P4 Settings | Gone: Sound to Menu, the rest to Extras | R7 |
| P5 Hint, P6 Undo | Phone bar; desktop action row | Each turn (R3) |
| P7 Resign | Menu, last, red text; the question in the context area | Item 2, R11 |
| P8, P13, P14 lesson strip, Next, Return | Lesson screen: progress, success sheet, × | W4 B |
| P9, P12, P18 help, caption, power step | Context area, fixed height; a tip shows once | R15, R18 |
| P10 Cancel selection | Gone: a second tap and Esc cancel | Item 1 |
| P11 Finish chain, P17 End turn | A button in the context area, only in that turn | R3 |
| P15 piece card | Context area: name, two lines, "All rules". Powers text shows on a tap on the emblem | C:PLAY-9, C:PW-2 |
| P16 Use power | Your strip; hidden at 0 uses and on the computer's turn | Item 17 |
| P19 Send the game link | Link game: the main action after your move. One device: Extras | W7 |
| P20 move list | One Moves line, closed by default | Section 4 |
| P21 took rows | In each player strip | Ticket 02 |
| P22, P23 | Kept, not visible | Tools, screen readers |
| N1–N4, N8, N9 | New game; side under More options | Round 3, R6 |
| N5 level | New game, with one line in place of the tooltip | W1, C:SET-14 |
| N6 two-player powers | A switch under Two players | W7 |
| N7 king pickers | Your picker open; the computer's king as a row with "Change"; "No power" → Lab | W5 |
| N10, N11 army | More options: "Random", "Today's", "Chess" pills. Custom, 10 example armies, the note → Lab | W6, R8 |
| N12 Cancel | Gone: ×, Esc, backdrop | R14 |
| N13 Start game | Sticky footer; over an unfinished game: "This ends your game at move 12." | Item 6, D-4 |
| S1 Sound | Menu, switch | R7 |
| S2–S4, S6, S7, S11 | Extras. Animations becomes 3 pills | C:VIS-18 |
| S5, S9, S10 Look, Reset view, code | Lab | W6 |
| S8 Thinking time | Gone | W1 |
| S12–S14, D1–D3 Account | Extras, in place; the delete question in place | C:SET-6 |
| S15, R7 Close | × in the header | R14 |
| R1 Learn | Guide, top | New |
| R2, R6 rules, powers | Guide folds | Some |
| R3 cards | The six new pieces first, with G1 diagrams; chess pieces in a fold | Item 14 |
| R4 draw pool | Lab | — |
| R5 notation key | Guide fold, only with Move notation on | R8 |
| C1–C3 choices | Small cards at the square (H2), outcome pictures (H1) | R26 |
| O1–O8 | Section 3.9 | W8 |
| X1, X2, X10 confirms | In-app questions | 0 boxes |
| X3–X5, X9 | Lab | — |
| X6–X8 errors | One line in the context area | — |
| Workshop | No change; W9 Surprise me first | Rev 3 |
| URL switches | Lab, except game, design and sign-in links; new `?lab=1`, remembered | W6 |

**Counts** (fixed controls; squares and move rows not counted):

| Screen | Today | Ticket 02 | New |
|---|---|---|---|
| Title, first / returning | 3 / 4 | — | 3 / 3 (4 until lesson 1 or a game ends) |
| Game idle, phone / desktop | 7 / 7 + 24 moves | 5 / 9 + 24 | **4 / 4** |
| Piece selected | 8–9 | 5 / 9 | 4 (5 in a chain) |
| Powers game | 8–9 | 7 / 11 | 6 |
| Review | 7 + 24 | 6 / 10 + 24 | 6 + rows (Hint and Undo off) |
| Lesson | 8–9 | — | 2; success 2 |
| New game: computer / powers / two players | 10 / 28 / 7 | — | 10 / 19 / 9 |
| Settings / Menu / Extras | 14 / — / — | — | 0 / 6 / 17 (18 with two players) |
| Guide | 2, 881 words | — | 5, about 350 words |
| Result | 3–7 | — | 3–7 |

**Nothing lost.** Each "Every" item is in view or one tap away. Each "Some" item is two taps away or fewer. Three things go on purpose: the Settings screen (its items move), the desktop hover card (a tap shows it), and the standing power text (a tap on the emblem shows it).

## 3. Screens and sheets

### 3.1 Title
The kings, the lineup, the wordmark, "Chess with six new pieces", then the buttons. First visit: **"Learn the new pieces"**, "Play", link "Workshop". Returning: **"Continue · move 12 vs Computer"**, "Play", "Workshop". Buttons 360 px wide at most.

### 3.2 Game screen

```text
Phone 390×844                       Desktop 1440×900 (rail 480 px)
┌──────────────────────────────┐    ┌──────────────────┬─────────────────────────┐
│ (o) Computer · Beginner  took│    │                  │                 [Menu]  │
│                              │    │                  │ (o) Computer · Beginner │
│            BOARD             │    │      BOARD       │ (*) Your move           │
│                              │    │                  │ [Hint] [Undo]           │
│ (*) You · Your move  [Freeze]│    │                  │ context area, 4 lines   │
│ context area, 2 lines        │    │                  │ 12 queen Their queen  v │
│ 12 queen Their queen moves  v│    │                  │        (floor)          │
│            (floor)           │    │                  │                         │
│ [Menu]     [Hint]     [Undo] │    │                  │ (*) You · White [Freeze]│
└──────────────────────────────┘    └──────────────────┴─────────────────────────┘
```

- **Landscape:** the board at full height on the left; the right column keeps the phone order, bar at its foot.
- **Tablet:** as ticket 02; the Moves line replaces the move column.
- **Short phones (375×550):** the context area and the Moves line share one slot; text wins.

Only the context area changes between states (R15):

| State | Status | Context area |
|---|---|---|
| Your move | "Your move" | First 3 games: "Tap a piece to see its moves." Then empty |
| Computer's turn | "Computer is thinking…" and the ring | — |
| Check | "Check! Your move" (red) | — |
| A piece tapped | — | Icon, name, "Shoots without moving, over any piece.", "All rules" |
| Hint | — | "Hint: your archer shoots their maester." |
| Beast chain | — | "Take again, or stop here." [Finish here] |
| Power armed | — | "Tap an enemy piece to freeze it. Tap Freeze again to cancel." |
| After a free mark | — | "Now make your move." [End turn] |
| Link game, your move played | — | "Your move is in. Send it to your friend." **[Send the game link]** |
| Resign | — | "Resign this game? The computer wins." **[Resign]** [Keep playing] |
| Link over a game | — | "Open your friend's game? Your game at move 12 ends." **[Open it]** [Keep mine] |
| Game over | "You win!" | "Checkmate on move 23." **[Rematch]** |

### 3.3 Lesson
× ("Leave"), "Lesson 1 of 5 · Archer" and five icons at the top. Only the goal moves are marked; the lesson piece pulses (G2). One task line: "Your archer shoots without moving. Shoot the pawn." Bar: "Show me" only. Wrong move: "Not quite. Try again." Success sheet: "Well done!", **"Next: Guard"**, "Play a game". After lesson 5: **"Play a game"**, "Bonus: Paladin" (W4 B). × goes back to the game, or to the title on a first visit.

### 3.4 New game
"New game" and ×. The three mode cards. Then, by mode:
- Computer: level pills and one line: "New to King Down." / "Relaxed. It makes mistakes." / "A solid player." / "Thinks longer. A real fight."
- Kings' powers: level pills, "Your king" (6 emblems, 2 powers, a rule line), "Computer's king: Shadow · Death Touch" with "Change".
- Two players: "On this device" (default) or "By link", and a "Kings' powers" switch.
- More options, closed: "You play" White or Black; "Army" Random, Today's or Chess.
- Sticky footer: the replace line when needed, **"Start game"**. Phone: full height. Desktop: 560 px card.

### 3.5 Menu
"Menu" and ×; "New game", "Guide" ("How each piece moves"), "Sound" (switch), "Extras ›", a gap, "Resign" in red (live games only). Phone: a bottom sheet; the board stays in view. Desktop: a 320 px panel under the Menu button.

### 3.6 Extras
"‹ Menu", "Extras", ×. Same container as Menu.
- **Board:** "Show threats" ("Red rings show what they can take."), "Coordinates", "Piece letters", "Flip board", "Animations" (Normal, Fast, Off).
- **Game:** "Move notation" ("Chess notation beside each move."), "Always promote to queen", "Copy moves" (then "Copied"), "Send the game link" (two players only).
- **More:** "Workshop ›"; Account: "Save your games on every device.", "Continue with Google", "Continue with GitHub", "Privacy · Terms". Signed in: name, "Sign out", "Delete my account".
- **Lab** (`?lab=1`): Look, Reset view, Setup code.

### 3.7 Guide
"Guide" and ×. **"Learn the new pieces"**. Six cards for the new pieces: figure, icon, name, the G1 diagram, one line each for Moves, Takes, Special. Folds: "Kings and powers", "Chess pieces", "Rules in short", "Move notation" (only with notation on).

### 3.8 Choices
A small card at the square (H2). Capture or push: "Take it", "Shove it", each with a picture that loops on hover and focus (H1). Promotion and Sacrifice: the figures in one row. × cancels.

### 3.9 Result
After the board-first sequence (H3). Phone: a bottom sheet, so the fallen king stays in view. Desktop: a 420 px card.
- The two kings, the loser already down. **"You win!"** / "The computer wins" / "Draw" / "White wins!".
- One line: "Checkmate on move 23." / "You resigned on move 14."
- "Moves to look at again": up to 3 story rows with a star; a tap opens review there, the better move as a ghost.
- Daily game: "Share today's result".
- **"Rematch"** ("You play Black"), "New game…", "Review". No ×: Review and Esc go to the board.

## 4. The moves section

**Closed** (default at all sizes; the device remembers the state):
- One 48 px row, one button: move number, side dot, piece icon in its army colour, sentence, event icon, chevron. It shows the last move only.
- Before move 1: "Your moves show here." (R19).

**Open:**
- Phone: a sheet over the panel, from the board's lower edge to the bar; the board stays in view. Header: "Moves · 24", ◀, ▶, close. In review, **"Back to game"** replaces close.
- Desktop and tablet: the fold opens down to your strip. Nothing above it moves.
- One row per move, newest at the foot. The number shows once per turn. Rows: 44 px on touch, 32 px with a mouse.
- A row: side dot, piece icon, six words or fewer with no squares, event icon.
- 4 or more quiet moves in a row fold into "4 quiet moves" with small icons; a tap or ◀ ▶ opens the run. Captures, checks, powers, promotions and special moves never fold.
- A tap on a row starts review there: the board rewinds (B4), the row gets a gold edge.
- After the game, key moments get a star and "Better: your knight takes their rook."
- "Move notation" adds the chess notation in soft ink at the row's end.

| Event | Icon (Round 2 marker shapes) | Copy |
|---|---|---|
| Move | gold gem | "Your knight jumps." |
| Capture | the taken piece's icon in a crimson ring | "Your bishop takes their pawn." |
| Archer shot | gun-sight | "Your archer shoots their knight." |
| Ogre shove | teal chevrons | "Their ogre shoves your rook." |
| Maester swap | violet arrows | "Your maester swaps with your knight." |
| Beast chain | linked rings, ×2 | "Their beast eats two pieces." |
| Power | blue rune with the king's emblem | "Frost king freezes your bishop." |
| Promotion | up arrow, then the new piece | "Your pawn becomes a queen." |
| Check | crown with a red burst | "Check!" |
| Mate | fallen king | "Checkmate. You win!" |

The copy is a short form of `describeMove()` (`src/move-text.ts`); the full sentence stays as the row's accessible name (R24). One device: "White" and "Black" in place of "Your" and "Their". A Haste turn is two rows under one number.

**Motion when a move joins:**
1. The row joins at contact, not at launch (motion rule 8).
2. Closed line: the old sentence leaves 8 px up (160 ms, `in`); the new one rises in (200 ms, `out`).
3. At the hit the event icon pops (300 ms, `pop`), and the taken piece's icon flies to the taker's strip (D1, 450 ms, `inout`).
4. Check: the crown pulses red once. Power: the emblem glints once. Promotion: the pawn icon cross-fades into the new piece. 300 ms each.
5. Open list: the new row has a gold wash for 900 ms (D2).
6. Open: the phone sheet slides up from the line (240 ms, `out`); the last 6 rows rise 45 ms apart. Close: 200 ms, `in`. Desktop rows fade and rise 12 px (200 ms).
7. Review: the gold edge slides between rows (160 ms).

End frame: the row with all its icons; Off shows it at once. None of these is a peak: the board keeps the move's one peak (motion rule 10).

## 5. Motion per screen and transition

Fast halves each time. Off and reduced motion show the end frame. A tap skips. DOM motion uses transform and opacity only (R25–R29).

| Where | Purpose | What moves | Time, easing | End frame |
|---|---|---|---|---|
| Title → game (T1, small) | One world | Title fades; a night tint fades 0.6 → 0 | 250 + 400 ms, `out`, `inout` | The board |
| New game, Rematch (T2) | The drawn army | Back rank rises by file, then pawns | 750 ms, 38 ms per file | Start position |
| Sheets open | Where it comes from | Phone: slides up. Desktop: grows from its button | 240 / 200 ms `out`; close 200 / 140 ms `in` | Sheet; backdrop fade only |
| Menu → Extras | One level deeper | Content slides 24 px from the right; Back reverses | 240 ms `out` | Extras |
| Status (E1) | Whose turn | Token turns over; a ring fills while the computer thinks; red pulse on check | 320 ms `inout`; 300 ms `pop` | Token |
| Context area | What changed | Old text fades; new text rises 8 px | 160 + 200 ms | New text |
| Hint (C1) | Which move | A see-through piece plays it once | 450 ms `inout` | Faint ghost |
| Check (C2) | The cause | Line from the checker to the king; sound at contact | 220 ms `out` | Dashed line |
| Capture (D1) | Where it went | Icon flies to the strip at the hit | 450 ms; pop 160 ms | Icon in strip |
| Power (F1, F3, F4) | The king's power | Runes wave from the king; ice climbs a frozen piece; the count rolls | 60 ms per square; 450 ms; 160 ms | Runes, ice badge, count |
| Choices (H2) | Which square asks | Card grows from the square | 200 ms `out`; 140 ms `in` | Card |
| Lesson (G2, G3) | Start here; done | Piece pulses twice; ghost after 8 s; icon stamps; sheet rises | 2 × 600; 200 `pop`; 240 ms | Gold icon, sheet |
| Wrong lesson move | Not this one | Piece shakes, move rewinds | 280 + 450 ms | Lesson position |
| Result (H3) | How it ended | Check line, crosses, the king falls, the card rises with the king down | 2.6 s at most; card 300 ms `out` | Card |
| Review (B4) | Time goes back | Pieces walk back | 450 ms `inout` | Earlier position |
| Copy (E3) | It worked | A check mark draws, "Copied" | 240 ms | "Copied", 2 s |
| Animations pills (I1) | Shows the pace | A small pawn steps at that pace | 440 / 220 ms / jump | Pawn at rest |

## 6. Journeys, before and after

| # | Journey | Today | New | What changes |
|---|---|---|---|---|
| J1a | Learn → first lesson move | 3 taps, about 100 words | 3, about 30 words | Only the goal marked |
| J1b | Play → first move | 4; title, New game, game | **3**; title, game | No setup on a first visit |
| J1d | All lessons → first game move | 24 | **20** | 5 lessons, Paladin bonus |
| J2 | Continue | 1 | 1 | Names the opponent |
| J3 | Strong; as Black with chess army | 3 (main 6); +4 | 3; +3 | Pills, not a select |
| J4 | Two players, one device | 3 | 3 | No Send button each turn |
| J5 | Link game: first send; each turn | 6; 3 (+ external) | 7; 3 (+ external) | +1 "By link"; no browser box |
| J6 | Powers game, first Freeze | 8 + 1 scroll, 340 words | 8, 0 scrolls, about 90 words | Start in view; ice mark |
| J7 | Daily game | 5 | **4** | Army pills |
| J8 | Workshop | 5; +0 from game | 5; +2 from game | Rare (R3) |
| J9 | Review 30 moves, phone | about 60 taps + scrolls | 60 taps on fixed ◀ ▶, 0 scrolls | Fixed buttons |
| J10 | Sound off; Animations Off | 3 + scroll; 4 + scroll | 3; 4 | No scroll |
| J11 | Resign | 2, browser box | 3, in-app | +1 on purpose (R11) |
| J12 | Rematch after Close | 2 | **1** | No dead end |
| J13 | Enemy piece rules, touch | 2 + 3–10 scrolls | **1** | Card in context area |
| J14 | Sign in | 2 + scroll | 3 + scroll | Rare |

## 7. Guidelines behind the main choices

- One Menu, three bar items, Resign last: R3, R9–R11, R13.
- No Settings screen; two levels: R2, R4, R7.
- One fixed context area: R15, R18, R23.
- Closed Moves line, story rows with icons: R8, R19, R24, R28.
- No setup on a first Play; lesson-only screen: R1, R16, R17.
- Pills; More options: R5, R6.
- Cards at the square, visible close, no browser boxes: R14, R22, R26.
- Short motion with a job, one focus, a still end: R20, R21, R26–R29.

## 8. Decisions for the owner

- **W13. One Menu at all sizes.** *The same Menu in the same place on every screen.* (A) W2 C desktop text toolbar and Resign flag; (B) one "Menu" button. **Pick B** (R10, R13).
- **W14. Previous and Next.** *Review controls live with the moves.* (A) in the bar (ticket 02); (B) in the Moves section, ← → keys always. **Pick B**: the bar goes from 5 to 3.
- **W15. First Play.** *A new player meets no setup.* (A) Play opens New game; (B) on a first visit Play starts a Beginner game. **Pick B** (R17).
- **W16. Move story.** *The moves read as a story; notation is a choice.* (A) notation, closed; (B) story rows, no squares, quiet runs fold, notation in Extras; (C) B with squares. **Pick B.**
- **W17. Piece verbs.** *One verb per piece in all copy.* Proposal: pawn and king "step", knight "jumps", archer "shoots", ogre "shoves", maester "swaps", beast "eats", the others "move". **Pick this list**; change it as you like.
- **W18. No Settings screen.** *A rare setting goes to Extras.* (A) a short Settings sheet; (B) Sound in Menu, the rest in Extras. **Pick B** (R7).
- **W19. Result with no ×.** *One way out, and Rematch stays after it.* (A) keep Close; (B) Review is the way out, and the context area keeps "Rematch". **Pick B.**
- **W20. "No power" in the picker.** *A powers game gives your king a power.* (A) keep; (B) Lab. **Pick B.**
