# Menus, screens and journeys: the design (experienced chess player first)

Ticket 03, plan step 3. Date: 2026-10-08. The design builds on the review picks W1 to W12 and on the ticket 02 sample. `[R5]` cites rule 5 of the guidelines document. `[MR4]` cites rule 4 of motion-review §5. `[W2]` cites a review pick.

**The angle.** A chess player wants a game at the chosen level in 2 or 3 taps, the board, moves, ‹ › and Undo where lichess puts them, and nothing else. A new player gets the same screen; the chess-player tools (notation, squares, keys) stay quiet or folded.

## 1. Screen map

```text
Title
├─ [Continue · vs Strong · move 12]  main when a game is unfinished ──► Game
├─ [Learn the new pieces]            main on a first visit ───────────► Lesson
├─ [Play] ──────────────────────────► Setup sheet ──► Game
└─ Workshop (quiet link) ───────────► Workshop (revision 3, no change)

Game screen (one screen; phone, short-landscape and wide layouts)
├─ Desktop toolbar  = phone Menu sheet:
│   ├─ New game ──► Setup sheet
│   ├─ Guide ─────► Guide sheet ──► Lesson
│   ├─ Extras ────► Extras sheet (on a phone it replaces the Menu content)
│   │                ├─ Workshop
│   │                └─ Account: sign-in (external) · Delete account (confirm)
│   └─ Resign ────► question in the context area ──► Result
├─ Action row: Hint · Undo · ‹ · ›
├─ Moves line ──► moves open, in place ──► a tap on a row: review
├─ Your strip: power button ──► armed step in the context area
├─ Board ──► choice at the square: Capture or push · Promotion · Sacrifice
└─ Game ends ──► Result card ──► Rematch · Review · New game… · ×
                                  × ──► game-over line in the context area

Lesson screen (no menu, no moves, no Undo)
├─ × ──► Title (first visit) or the game
└─ Success bar: Next lesson · Play a game ──► Game (Beginner)

Game link ──► "Open this game?" sheet (only when it replaces a game) ──► Game
?lab=1   ──► Extras gets a Lab group; Setup gets the lab armies
```

Every option is 2 steps or fewer from the board [R2]. A sheet never opens over a sheet [R14]. The 10 browser boxes become in-app lines or sheets [R10].

## 2. Homes

### 2.1 Every inventory item

| Items (inventory IDs) | Home | Why |
|---|---|---|
| No change: T1–T3, B1–B4, B6–B11, M1–M5, M7, M9, M10, P22, P23, D1–D3 | Where they are | Rounds 2 and 4 |
| T4 Continue | Title main: "Continue · vs Strong · move 12" | [R8] |
| T5 Learn | Title main on a first visit, then a quiet link; Guide | [R1], [W3] |
| T6 Play, T7 Workshop | Title; Workshop as a quiet link and in Extras | [W3], [R3] |
| T8 Esc | Opens the saved game only | C:SET-M5 |
| G1 header card | Gone | Item 3 |
| G2–G4 | One status line with the turn disc (E1) | Item 3 |
| B5 enemy tap | Shows its card | D-10 |
| M6 threats, M8 letters | Extras | [R7] |
| P1 New game, P2 Guide | Desktop toolbar; phone Menu | [W2] |
| P3 Workshop, P4 Settings | Extras | [R3], [R7] |
| P5 Hint, P6 Undo | Action row | [R3], [R11] |
| P7 Resign | Desktop: quiet flag. Phone: last Menu row. Question in the context area | Item 2, [R11] |
| P8, P13, P14 lesson parts | Lesson screen | [W4] |
| P9, P11, P12, P15, P17, P18 | One context area of fixed height | Item 1, [R15] |
| P10 Cancel selection | Gone | Item 1 |
| P16 power | Your strip | Item 17 |
| P19 Send the game link | Link games only, main action after your move | [W7] |
| P20 move list | Moves line, closed (section 4) | Owner, [R3] |
| P21 took rows | In the strips | Sample 02 |
| N1–N4, N13 | Setup; Start game in a sticky footer | Round 3, item 6 |
| N5 level | Setup, in view, with one line | [W1], [R5] |
| N6, N7 | Two players: switch. Powers: your picker open, the other king as a row with Change | [W7], [W5] |
| N8, N9 More, side | More, with a label that shows its state | [R4] |
| N10 army | More: Random · Today's · Chess. Lab armies and Custom: `?lab=1`. Ogre practice: a lesson | [W6], [R6] |
| N11 army note | `?lab=1` | [W6] |
| N12 Cancel | × , Esc, Back | [R14] |
| S1–S4, S6, S7 | Extras | [R7] |
| S5, S9, S10, R4 | `?lab=1` | [W6] |
| S8 Thinking time | Gone | [W1] |
| S11 Copy moves | Open moves header | [R10] |
| S12–S14 Account | Extras, inline | [R7] |
| R1–R3, R5, R6 Guide | King Down pieces first; chess pieces, powers, notation in folds | Item 14 |
| C1–C3 | A panel at the square | Motion H2, [R9] |
| O1–O8 | Result card; O7 opens Setup; O8 leaves a game-over line | [W8], [R10] |
| X1–X10 | In-app line, sheet or toast; X3–X5 in `?lab=1` only | [R10] |
| Keys | Add ↑ ↓ (first, last move) and F (flip); keys act only with no sheet open | [R9], D-6 |
| URL switches | Stay; add `?lab=1` (remembered) | [W6] |

### 2.2 Extras, in order

One sheet, three groups, no third level [R2]. Every row is one tap.

1. **Play**
   1. Sound: switch, on.
   2. Animations: Normal · Fast · Off (segments; I1 pawn shows the pace).
   3. Always promote to a queen: switch, off, with one help line.
2. **Board**
   4. Show threats: switch, off.
   5. Coordinates: switch, on.
   6. Piece letters: switch, off.
   7. Flip board: button (key F).
3. **More**
   8. Workshop: "Make your own piece" ›
   9. Account: "Keep your games on every device", Continue with Google, Continue with GitHub, Privacy · Terms. Signed in: name, Sign out, Delete my account.
4. **Lab** (only with `?lab=1`): Look (Clay 3D), Reset view, this game's army code, the draw pool.

### 2.3 Controls per screen

Count rule of the inventory. "Rows" are move-list buttons.

| Screen | Today | Sample 02 | After |
|---|---|---|---|
| Title, first / returning | 3 / 4 | — | 3 / 4 (one main, the rest quieter) |
| Game idle, desktop | 7 + 24 rows | 9 + 24 rows | 9 + 0 rows |
| Game idle, phone | 7 + 24 rows | 5 + 24 rows | 6 + 0 rows |
| Game, piece selected | +1 to +2 | +0 | +0 (+1 in a chain) |
| Game, powers | +1 to +2 | +1 to +2 | +1 |
| Lesson | 8–9 | — | 2, then 2 on success |
| Menu sheet (phone) | — | — | 5 |
| Extras / Settings | 14 | — | 15 (takes in Workshop, Settings and Flip; loses Look, Thinking time, Copy moves) |
| Setup, computer, More closed / open | 10 / 13 | — | 10 / 15 (army: 1 select of 14 becomes 3 segments) |
| Setup, powers | 28 / 31 | — | 16 / 21 |
| Setup, two players | 7 | — | 9 |
| Guide | 2 | — | 5 (Learn, ×, 3 folds) |
| Result | 3–7 | — | 4–8 (adds Review) |
| Browser boxes | 9 | — | 0 |

Idle after: desktop New game, Guide, Extras, ⚑, Hint, Undo, ‹, ›, Moves line; phone Menu, Hint, Undo, ‹, ›, Moves line.

## 3. Screens and sheets

### 3.1 Title

- Order: stage and kings, 12-figure lineup, wordmark, "Chess with six new pieces" [W3], buttons.
- First visit: **Learn the new pieces** (main), Play, Workshop (quiet link).
- Returning, unfinished game: **Continue · vs Strong · move 12** (main), Play, then "Learn the new pieces · Workshop" as quiet links.
- Returning, no unfinished game: **Play** (main), quiet links.
- Phone: buttons in the bottom third, in thumb reach [R11]. Desktop: one column of 360 px under the wordmark.

### 3.2 Game screen

Phone 390×844, top to bottom (no part moves in any state [R15]):

| Part | Height | Content |
|---|---|---|
| Opponent strip | 44 | King avatar, "Computer · Strong", taken pieces, thinking ring (E1) |
| Board | 390 | Squares 45 px |
| Your strip | 44 | Avatar with turn ring, "You · Your move", taken pieces, power button |
| Context area | rest (≥ 104) | See 3.3 |
| Moves line | 44 | "12 · ● [queen] Their queen to e6 ⌃" |
| Bottom bar | 56 | Menu · Hint · Undo · ‹ · › |

Desktop 1440×900: the board at full height on the left (squares 100 px). The rail: toolbar "New game · Guide · Extras" and ⚑; opponent strip; status line; Hint, Undo, ‹ ›; context area (fixed, 3 lines); moves line; your strip at the bottom. Tablet and short landscape keep the sample layouts, with the moves line in place of the list.

### 3.3 Context area copy

| State | Copy (player words) | Controls |
|---|---|---|
| Idle (first 3 games; later empty) | "Tap a piece to see its moves." | — |
| King Down piece selected | "[icon] Archer. Shoots the red squares without moving, over any piece." | — |
| Chess piece selected (enemy pieces too) | "[icon] Pawn. As in chess, but no en passant." Knight: "As in chess." | — |
| Hint | "Hint: your archer shoots their maester." Ghost move C1 on the board | — |
| Power armed | "Freeze: tap an enemy piece (not the king)." | Cancel = tap Freeze again |
| Chain | "Your beast can eat again." | Finish chain |
| Resign | "Resign this game? The computer wins." | **Resign**, Keep playing |
| Link game, after your move | "Your move is in. Send it to your friend." | **Send the game link** |
| Review | "Move 6. Your archer shot their bishop." | **Back to game** |
| Game over, after × | "You win · Checkmate on move 23" | **Rematch**, See result |

### 3.4 Menu and Extras

- Phone Menu: a sheet from the Menu button. Rows of 56 px: New game, Guide, Extras ›, a rule, then Resign in quiet red. ×, Esc, Back and a tap outside close it.
- Extras: on a phone it replaces the Menu content ("‹ Menu" and ×). On desktop it is a 360 px panel under the link. The header stays; the body scrolls on short screens.

### 3.5 Setup sheet ("New game")

- Order: the three mode cards (Round 3); the level row with one line that changes with the pick; for powers, your picker and "Computer's king: Shadow · Death Touch · Change"; for two players, "On this device · By link" and a Kings' powers switch; "More · You play White · Random army" (folded: White · Black; Random · Today's · Chess).
- Level lines: Beginner "Plays fast and makes mistakes." Casual "Plays fair, misses some tactics." Club "A solid club player." Strong "Thinks longer. Punishes mistakes."
- Defaults: Beginner for the first game, then the remembered setup [W1]. Start game has the focus, so Enter starts the game.
- Over an unfinished game, a quiet line shows above the footer: "This ends your game at move 12." After Start, a toast says "Old game closed. Undo" for 6 s.
- Footer (sticky): **Start game**. Header: "New game" and ×.
- Phone: a full-height sheet. Desktop: a 560 px dialog.

### 3.6 Guide sheet

- Order: **Learn the new pieces**; "What changes from chess" (three lines: "Six new pieces. No castling, no en passant. Mate the king to win."); the 6 King Down cards; folds: Chess pieces, Kings' powers, Keys and notation.
- Phone: full height, sticky header with ×. Desktop: a 640 px dialog.

### 3.7 Lesson screen

- Top bar: ×, "Lesson 1 of 6 · Archer", 6 progress icons.
- Board: the lesson piece pulses (G2). Only the goal squares carry markers.
- Task card: one sentence of 15 words or fewer. "Show me" plays the goal move as a ghost.
- Success bar from the bottom (Duolingo): "Well done!", one line, **Next: Guard** (with focus), "Play a game" (quiet). After lesson 5: **Play a game** and "Bonus: Paladin" [W4]. "Play a game" starts a Beginner game at once.

### 3.8 Choices at the square

Capture or push, Promotion and Sacrifice open as a small panel at the square (lichess promotion convention [R9]). Capture or push uses the H1 vignettes in place of the sentence. Esc and a tap outside cancel.

### 3.9 Result

- Board first (H3), then the card: the kings; **"You win!"**; "Checkmate on move 23"; "Moves to look at again" (up to 3 starred story rows); **Rematch · you play Black**, Review, New game…; ×. Daily game: "Share today's result".
- Phone: a bottom sheet over the lower half; the fallen king stays in view. Desktop: the card sits over the rail, not over the board.
- × leaves the game-over line in the context area. Rematch is never lost [R10].
- Open-link sheet: "Open this game? It replaces your game against Strong at move 12." **Open** · Keep mine.
- Toasts sit above the bottom bar for 4 s ("Link copied", errors) and never cover focus [R23].

## 4. The moves section

**Closed (the default at all sizes; the state is remembered on each device).** One 44 px row shows the newest move:

`12 · [side disc] [piece icon] Their archer shoots your bishop [gun-sight] c5   ⌃`

- The turn number, the side disc, the piece icon (Round 4), a sentence of 6 words or fewer, the event icon, and the square as a quiet chip at the end.
- In review the row shows the viewed move: "Move 6 of 24 · Your archer shoots their bishop".
- A tap on the row or on ⌃ opens it.

**Open.** One card per turn: the number, then your row and the reply row. A Haste turn is one card with two rows.

- Phone: the list takes the context area, in place. Nothing else moves, so ‹ › work with the list open. A selected piece's card takes the area until the move ends.
- Desktop: the list fills the rail under the moves line. It scrolls inside.
- Header: "Moves · 24", a switch **Story · Notation** (remembered), and a Copy icon.
- Notation shows figurines and squares: "[archer] e3 [gun-sight] c5", "[king emblem] [snowflake] c7". Copy gives the plain move text for other tools.
- A tap on a row opens review at that move. The row of the viewed move has a gold edge.
- After the game, key-moment rows get a star and the better move in words: "Better: your queen to d2."

**Sentences.** One verb per piece: the archer shoots, the ogre shoves, the maester swaps, the beast eats ("eats 2"). Others: "to e6", "takes". Powers name the king: "Their Frost king freezes your knight." With one device, "White" and "Black" replace "your" and "their". The full `describeMove()` sentence stays as the accessible name of each row.

**Event icons** reuse the Round 2 board markers, so one thing looks the same everywhere [R10]: a gold gem (move), crimson brackets (capture), a gun-sight (archer shot), teal chevrons (shove), violet arrows (swap), linked rings with a count (beast chain), a blue rune with the king's emblem and the power name (power), an up arrow and the new piece (promotion). Check is a crown with a red burst and the word "Check"; mate is a fallen king and "Checkmate". No event is colour alone [R24].

**Motion when a move joins** (all within [MR3], [MR8], [MR10]):
1. The row changes at contact, not at launch, so the list never gives the move away.
2. The old sentence moves up 8 px and fades (160 ms, `in`). The new one comes up 8 px (200 ms, `out`).
3. The event icon pops at the hit (300 ms, `pop`). A taken piece's icon flies to the strip's taken row (D1).
4. Check: the crown pulses red once. Power: the emblem glints once. Promotion: the pawn icon cross-fades to the new piece (300 ms).
5. Open list: the new row has a gold wash that fades in 900 ms (D2).
6. Off: the row is there at once with the same icons and words.

## 5. Motion per screen

Tokens and easings from motion-review §5. Fast halves every time. Off and reduced motion show the end frame. A tap skips [MR5].

| Where | Job | What moves | Time, easing | Still end frame |
|---|---|---|---|---|
| Title to game (T1, small) | One world | Title fades; a night tint over the game lifts | 250 `out`; 400 `inout` | The game screen |
| New game, Rematch (T2) | The drawn army is news | Back rank rises file by file, then the pawns | 360 per piece, 38 ms stagger, about 750 | The set board |
| Setup, Guide sheets | Where it comes from | Phone: slides up. Desktop: fades and rises 12 px | 240 `out` / 200 `out`; close 140 `in` | Open sheet |
| Menu sheet, Extras panel | Where it comes from | Grows from its button or link (scale .92→1, fade), goes back into it | 200 `out`; 140 `in` | Open sheet |
| Menu to Extras | Next page, same level | Shared X axis, 24 px | 160 + 200 | Extras |
| Switches, segments | The tap answers | The thumb slides | 160 `out` | New state |
| Turn and thinking (E1) | Whose turn | Disc turns; ring fills over the think time; red pulse on check | 320 `inout`; 300 `pop` | Disc in the side's colour |
| Context area | What changed | Cross-fade, no change of height | 80 out, 160 in | New text |
| Hint (C1) | What to do | Ghost piece plays the move once, then rests faint | 450 `inout` | Faint piece on the target |
| Moves line, list | What happened | Section 4 | ≤ 300; wash 900 | Newest row |
| Moves open | Where the list is | Phone: list rises 16 px and fades in. Desktop: rows fade in, 30 ms stagger, 8 rows at most | 200 `out` | Open list |
| Review step (B4) | Time goes back | Board rewinds; row edge slides; line text moves up (forward) or down (back) | 300 `inout`; 160 | Viewed position |
| Choice at the square (H2) | Which square | Panel grows from the square | 200 `out`; 140 `in` | Panel |
| Resign | — | The king falls at once, then the card | 650 `fall` | Card |
| Result (H3) | Why the game ended | Check line, crosses, the fall; the card rises, its king down | 2.6 s, skippable | Card |
| Result × | Where it went | The card shrinks into the game-over line | 200 `in` | Game-over line |
| Lesson piece (G2) | What to touch | Pulse, loops only while the player waits [MR7] | 1.2 s loop | Static ring |
| Lesson success | Reward | Bar slides up; gold stamp rises; sound | 240 `out`; 300 `pop` | Bar with Next |
| Copied (E3) | It worked | Check mark draws in the toast | 240 | Toast with a check |

No motion: the toolbar, the bottom bar and the strips do not move in any state [R15].

## 6. Journeys

Taps to the goal. "Before" is `main` (defects branch in brackets where it differs).

| # | Journey | Before | After | What changes |
|---|---|---|---|---|
| J1a | First visit, Learn to the first move | 3; 8 marked squares; about 100 words | 3; 1 marked square; about 30 words | Lesson screen, coach mark |
| J1b | First visit, Play to the first move | 4; about 140 words | 4; about 55 words | Beginner; no help blocks jump |
| J1d | All lessons, then a game move | 24 | 20 | Play after lesson 5; Paladin is a bonus |
| J2 | Continue | 1 | 1 | "vs Strong" on the button |
| J3 | Strong game from the title | 3 (main: 6 + 2 scrolls) | 3 first time, 2 later | Strong is stronger; level line in view |
| J3 | + play Black / Chess army | +2 / +3 | +2 / +2 | More's label shows side and army |
| J3 | New game during a game | 2 (defects: 3) | Desktop 2; phone 3 | No confirm; Undo toast |
| J4 | Two players, one device | 3 | 3 | No link button |
| J5 | Link game, first send | 6 | 7 | One tap more; a clear cue |
| J5 | Receiver | 0–1 browser box | 0–1 in-app sheet | Friend's move plays (T3) |
| J6 | Powers game, first power used | 8 + 1 scroll; about 340 words | 8; about 90 words | Your picker only; sticky Start |
| J7 | Daily game | 5 | 4 | 3 army segments, not a select |
| J8 | Workshop from the title / game | 5 / +1 | 5 / phone +3, desktop +2 | Out of the game screen |
| J9 | Review a 30-move game on touch | 1 per ply + 1 scroll per 4 moves | 1 per ply, 0 scrolls | ‹ › in the bar |
| J9 | Copy moves | 3 + 1 scroll | 2 | In the moves header |
| J10 | Sound off / Animations Off | 3 / 4, + 1 scroll | Phone 4 / 4; desktop 3 / 3 | No scroll; 1 tap per choice |
| J11 | Resign | 2 (browser box) | Phone 3; desktop 2 | Rare and far [R11] |
| J12 | Rematch after × | 2 (and not a rematch) | 1 | Game-over line |
| J13 | Rules of an enemy piece, touch | 2 + 3–10 scrolls | 1 | Card in the context area |
| J14 | Sign in | 2 + 1 scroll | Phone 3; desktop 2 | — |

**The new-player check.** Learn comes first; lesson 1 takes 3 taps; the first game is Beginner; neither needs Extras [R1]. Story rows are the default [R8]. The chess-player additions sit in the moves header, in More, or on keys. The cost: Workshop, Sound and sign-in are 1 tap further on a phone.

## 7. Guidelines followed

Each choice cites its rule in brackets. In short: Extras and Menu R1–R4, R7; setup R5, R6; story rows R8, R24; chess conventions R9; fixed bar and context R11–R15; lessons R16–R19; motion R20, R21, R25–R29, MR3–MR10.

## 8. Open decisions for the owner

Each line: the rule, the options, my pick.

- **U1. Squares in story rows.** *A story row names pieces, not codes.* (A) No squares; (B) the target square as a quiet chip at the end. **Pick B.** Chess players read squares at a glance.
- **U2. Notation.** *One switch, where the moves are.* (A) In Extras; (B) "Story · Notation" in the header of the open moves. **Pick B.** It shows only when the list is open.
- **U3. Sound.** *The Menu holds actions only.* (A) Sound in the Menu (3 taps to mute on a phone); (B) Sound first in Extras (4 taps). **Pick B.**
- **U4. Workshop in a game.** *Places live on the title.* (A) Menu row; (B) Extras row and the title link. **Pick B.**
- **U5. Side and army.** *Setup shows one decision at a time.* (A) Keep them in More, with a label that shows their state (Round 3); (B) a "You play" row in view. **Pick A.**
- **U6. New game over an unfinished game.** *Forgive, do not ask.* (A) A confirm (defects branch); (B) a warning line in the sheet and an Undo toast for 6 s. **Pick B.** One tap less, and nothing is lost.
- **U7. Chess pieces' card.** *The card says only what is new.* (A) Full rules for all 12; (B) chess pieces show only the difference ("No castling"). **Pick B.**
- **U8. After lesson 5.** *Play is one tap away.* (A) "Play a game" opens Setup; (B) it starts a Beginner game at once. **Pick B.**
- **U9. One-device games.** *The board turns only when you ask.* (A) Never turns, Flip board in Extras and key F, plus the E2 gold edge; (B) turns after each move. **Pick A.** It keeps today's rule (motion question 10).
