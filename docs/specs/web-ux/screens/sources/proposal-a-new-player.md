# Menus, screens and journeys: the design (ticket 03)

Angle: the new player first, then a check for the experienced player. [R1]–[R29] are the guideline rules; W1–W12 are the review picks; IDs such as P9 are from the inventory. The art, markers, lineup, emblem picker, icons and Workshop (revision 3) stay. The design starts from the ticket 02 sample and removes more.

Three ideas:
1. **In view: only what you use each turn.** The board, two player strips, one context line, one moves line, and Menu, Hint and Undo.
2. **All else is one or two taps away**, in Menu or Extras. Designer tools go behind `?lab=1`.
3. **Motion explains.** It shows where a thing comes from and what changed, then stops on a frame that keeps the facts.

## 1. Screen map

```text
Home (title)  first visit: Learn the new pieces | Play | Workshop (link)
│             returning:   Continue | New game | Learn · Today's army · Workshop (links)
├─ Learn ─────────► Lesson 1–5 (+ bonus Paladin) ─► "Play your first game" ─► Game (Beginner, at once)
│                    ├─ after any lesson: "Play a game now" ─► Game
│                    └─ ✕ ─► Home
├─ Play (first visit) ─► Game (Beginner, at once)
├─ New game ──────► New game sheet ─► Game
├─ Today's army ──► Game (today's army, the computer at your last level)
├─ Continue ──────► Game (or the Result of a finished game)
├─ Workshop ──────► Workshop (unchanged) ─► Back ─► caller
└─ a lineup figure ─► its piece card ─► "Learn it" ─► its lesson

Game
├─ Menu (sheet on phones, popover on desktop)
│   ├─ New game ─► New game sheet
│   ├─ Guide ─► Guide ─► Learn by playing ─► the next lesson
│   ├─ Extras ─► Extras (same sheet, ‹ Menu) ─► Workshop | sign-in page (external)
│   ├─ Home ─► Home (the game stays saved)
│   ├─ Sound (switch)
│   └─ Resign ─► question in the context line ─► Result
├─ moves line ─► Moves (open) ─► a row ─► Review ─► Back to game
├─ board ─► Take or push | Promotion | Sacrifice (open at the square)
└─ the game ends ─► Result ─► Rematch | Review | New game…
                     └─ in Review the moves line ends "Result ›" and opens it again

Game link ─► (a question sheet if it replaces a game) ─► Game; the friend's move plays once
?lab=1    ─► a Lab group in Extras; lab armies in New game › More options
```

Two levels at most: Menu, then Extras [R2]. Extras replaces Menu in the same sheet, so a sheet never opens over a sheet [R14].

## 2. Where each item goes

### 2.1 Homes

| Home | Items | Reason |
|---|---|---|
| **In view, always** | Board and marks; opponent strip and your strip (they hold G2, G3 and the took rows P21); context line (P9, P12, P15, P18 in one fixed box); moves line (P20, closed); Menu; Hint P5; Undo P6 | Each-turn items [R3, R11, R15] |
| **In view, only in its moment** | Power button P16 (your strip); Stop chain P11, End turn P17 (context line); Send the game link P19 (link games, after your move, in place of the moves line); ◀ ▶ Back to game (review, in place of Hint and Undo) | A control shows only when it can act [R3] |
| **Menu** | New game P1, Guide P2, Extras, Home (new), Sound S1, Resign P7 (last, with a question) | Known but not each-turn [R7, R11, R13] |
| **Extras** | Section 2.2 | Optional, set once [R1, R7] |
| **Moves, open** | Words or Letters (the notation of R5); Copy moves S11 | The option sits where it acts [R10] |
| **New game › More options** | Side N9; Army: Random, Today's, Chess | 3 army choices, not 14 [R6, R8] |
| **`?lab=1`** | Clay 3D S5, Reset view S9 and key R, the army code S10, Custom army (X3–X5), the 9 example armies, the army note N11 | Designer tools (W6) |
| **Learn** | Ogre practice (W6) | Learn by doing [R16] |
| **Gone** | Header card G1; `#asset-status` G4 (a line on load errors only); Cancel selection P10; Thinking time S8; Return to game P14 (✕); Result Close O8 (Review); "No power" for your own king; browser boxes X1–X9 (in-app questions) | Duplicates, dead ends |

The keys, Shift-click push, `#hover`, `#announce` and `#cursor-say` stay. Game keys act only when no sheet is open (D-6).

### 2.2 The Extras sheet, in order

| Group | Row (player words) | Control | Default |
|---|---|---|---|
| Play | Show threats · "Red rings on your pieces in danger." | Switch | Off |
| | Animations | Normal · Fast · Off (one tap) | Normal; Off with reduced motion |
| | Always make a queen · "Skip the choice when a pawn reaches the end." | Switch | Off |
| Board | Turn the board | Button | — |
| | Coordinates | Switch | On |
| | Piece icons on the board | Switch | Off |
| More | Workshop · "Make your own piece." | Row › | — |
| | Account · "Keep your games on every device." | Continue with Google, Continue with GitHub, Privacy, Terms. Signed in: picture, name, Sign out, Delete account (an in-app question) | Signed out |

With `?lab=1` a fourth group, Lab, holds Clay 3D, Reset view and the army code. The sheet fits a phone with no scroll.

### 2.3 Control counts

| Screen | Today | Ticket 02 sample | Proposed |
|---|---|---|---|
| Game, idle, phone | 7 tiles + 1 per ply | 5 + 1 per ply | **4**: Menu, Hint, Undo, moves line |
| Game, idle, desktop | 7 + 1 per ply | 9 + 1 per ply | **4** |
| Game, piece selected | 8–9 | 5 + 1 per ply | **5** (+ "Full rules" in the card) |
| Game, powers | 8–9 | 7 + 1 per ply | **6** (+ your power, + their power chip) |
| Game, review | 7 + 1 per ply | 6 + 1 per ply | **4** + 1 per row |
| Lesson | 8–9 | — | **2** (✕, Show me) + done dots; 4 after success |
| Title | 3 or 4 | — | 3 first visit; 5 returning (2 buttons, 3 links) |
| New game: computer (More closed / open) | 10 / 13 | — | 10 / 15 |
| New game: powers | 28 / 31 | — | **19** / 24 |
| New game: two players | 7 / 8 | — | 9 / 12 |
| Settings | 14 + its tile | — | gone; Menu 7, Extras 15 (Animations counts 3); 0 in view |
| Guide | 2; 881 words | — | 6 + 6 cards; about 220 words before a fold |
| Result | 3–7; 29 words | — | 3–7; about 12 words |
| Browser boxes | 9 | — | **0** |

Words on the idle game screen: 21 today, about 12 proposed.

## 3. Screens and sheets

Tablet and landscape keep the sample's layouts with the stack below. Each sheet has a visible ✕; Esc and Back close it; a sticky footer holds its main action [R14]. Touch targets are 44 px [R22].

### 3.1 Home (title)

- First visit: the stage and the 12-figure lineup; the wordmark; "Chess with six new pieces" (W3); **Learn the new pieces** (primary, focused) with "5 one-move lessons"; **Play**; Workshop (quiet link).
- Returning: **Continue** (primary) with "You vs Computer · Club · move 12"; **New game**; quiet links Learn (until all lessons are done) · Today's army (a "Played" mark) · Workshop.
- A tap on a lineup figure opens its piece card. Esc does the focused action, so it never skips the lessons.
- Buttons: full width on phones, 360 px on desktop.

### 3.2 Lesson (W4 B)

- In order: a top bar with ✕, "Lesson 1 of 5 · Archer" and 5 icon dots (done dots are buttons); the board, with only the goal move marked; one task line; **Show me** (the goal move plays as a ghost).
- Task copy, 12 words or fewer: "Tap your archer. Then tap the pawn."
- Success: a card rises over the task line: "Well done! She shoots without moving, even over pieces." **Next: Guard** (primary, focused) and "Play a game now" (quiet).
- After lesson 5: "You know the new pieces!" **Play your first game** (at once: Beginner, you play White) and "Bonus: the Paladin".
- Phone: task and Show me under the board. Desktop: the same at the top of the rail. Nothing else.

### 3.3 Game screen

```text
Phone 390×844                         Desktop 1440×900
┌──────────────────────────────┐     ┌────────────────────┬─────────────────────────┐
│ (K) Computer · Beginner  took│     │                    │                Menu ≡   │
├──────────────────────────────┤     │                    │ (K) Computer · Beginner │
│                              │     │                    │ Your move               │
│      BOARD, full width       │     │       BOARD        │ [Hint] [Undo]           │ never moves
│                              │     │                    │ context, 4 lines, fixed │
├──────────────────────────────┤     │                    │ ▸ moves line (closed)   │
│ (K) You · Your move [Freeze] │     │                    │   open: the list fills  │
│ context, 2–4 lines, fixed    │     │                    │                         │
│ ▸ (pi) Their queen moves.  12│     │                    │ (K) You · White [Freeze]│
├──────────────────────────────┤     └────────────────────┴─────────────────────────┘
│   Menu      Hint      Undo   │ 56 px + safe area
└──────────────────────────────┘
```

- Phone: the moves line sits on the bar; spare height goes to the context box.
- Status, one line: "Your move", "Computer is thinking…" (a ring fills on its avatar), "Check! Your move", "White's turn" (one device), "Reviewing move 6".
- Context line by state:
  - Until the first finished game, idle: "Tap a piece to see its moves." Later: empty.
  - Before move 1 of the first game: "3 new pieces in your army" with their icons; a tap rings them on the board.
  - Own or enemy piece: "[icon] Archer. Shoots without moving, over any piece." and "Full rules".
  - Hint: "Hint: your archer shoots their knight." Refusal: "That piece is frozen until your next turn."
  - Armed power: "Tap an enemy piece to freeze it. Tap Freeze again to cancel."
- Link game, after your move: **Send the game link** (primary) replaces the moves line; then "Sent. Your friend moves next."
- The board, Hint and Undo move 0 px in every state [R15].

### 3.4 Menu and Extras

Phone: a bottom sheet. Desktop: a 320 px popover. Rows of 56 px: **New game** · **Guide** · **Extras ›** · **Home** ("Your game stays saved.") · **Sound** (switch) · a line · **Resign** (danger ink; off in a lesson, on the computer's turn and after the end). Resign closes the menu and asks in the context line: "Resign this game? The computer wins." [Resign] [Keep playing]. Extras opens in the same sheet with ‹ Menu.

### 3.5 New game

- "New game" and ✕; the three mode cards (Round 3); then one row by mode:
  - Computer: Beginner · Casual · Club · Strong, and one line that follows the choice: "Learning the pieces? Start here." · "Makes mistakes. A relaxed game." · "Plays well. Guard your pieces." · "Thinks hard. A real fight."
  - Kings' powers: the level; "Your king": 6 emblems, 2 power pictures, one rule line; "Computer's king: Shadow · Death Touch [Change]" (W5 B).
  - Two players: On this device · By link (W7 B), and a Kings' powers switch.
- "More options", closed. Its label names each choice that is not the default: "More options · You play Black · Chess army".
- Sticky footer: **Start game**. If it ends an unfinished game, the first tap asks in the footer: "End your game at move 12?" [Start new game] [Keep it] (D-4, no browser box).
- Phone: a full-height sheet. Desktop: a 560 px dialog. Before the first finished game, Beginner is chosen (W1 B).

### 3.6 Guide ("How the pieces move")

**Learn by playing** (it resumes at the next lesson); the 6 new pieces, each with a moving diagram (G1) and one line; four closed sections: The kings and their powers · The chess pieces · Rules in short ("No castling or en passant.") · How moves are written. Phone: the Archer is on the first screen. Desktop: two cards per row.

### 3.7 Result (W8 B)

After the board-first sequence (H3) the card rises: the two kings, the loser already down; **"You win!"**, "The computer wins", "Draw" or "White wins!" (one device); one line, "Checkmate on move 23."; "Moves to look at again" (up to 3 story rows with a star); **Rematch** (primary, "You play Black"), **Review**, **New game…** (the sheet with the last choices). Daily game: "Share today's result". Esc and the backdrop do the same as Review.

### 3.8 Choices during a move

Take or push and Promotion open at their square, with no blur (H2). Take or push shows two picture buttons, **Take** and **Push** (the H1 loops), and no paragraph. A tap on the board or Esc cancels. Sacrifice uses the promotion look: "Which piece comes back?"

## 4. The moves section

**Closed (the default at every size).** One 44 px row: side disc, piece icon, the newest move in words, event icon, move number: "(●)(archer) Your archer shoots their bishop. (sight) 6". The row is one button that opens the list. Before move 1: "Your moves show here." [R19]. A swipe on the row steps back or forward, as a shortcut only [R14].

**Open.**
- Phone: the list fills the space under the board, never over it. A tap on the board, or a move, folds it. On short phones and in landscape it is a sheet over the lower half of the board; a tap on a row closes it and shows that board.
- Desktop: the list fills the rail under the context box until the player folds it. The device keeps the choice.
- Header: "Moves · 12", Words · Letters, Copy moves ("Copied" after the copy succeeds).

**Rows in Words (the default).** One card per turn: the number, your move, the reply. Each row: side disc · piece icon · sentence (6 words or fewer, no squares) · event icon. A Haste turn is one card with two steps. A run of 3 or more quiet turns folds into "4 quiet turns ⌄"; captures, checks, powers and promotions always show. A tap on a row shows that board. One device: "White's" and "Black's" replace "Your" and "Their". The `describeMove()` sentence is the row's accessible name.

| Event | Sentence | Event icon (the board marker) |
|---|---|---|
| Move | "Their queen moves." | Gold gem |
| Capture | "Your bishop takes their knight." | Crimson ring |
| Archer shot | "Your archer shoots their rook." | Gun-sight |
| Ogre shove | "Their ogre shoves your rook." | Teal chevrons |
| Maester swap | "Your maester swaps with your knight." | Violet arrows |
| Beast chain | "Your beast bites 2 pieces." | Linked rings, "2" |
| Promotion | "Your pawn becomes a queen." | Up arrow, then the queen icon |
| Power | "Frost freezes your bishop." | Blue rune with the king's emblem |
| Check | A red "Check!" tag after the sentence | Crown with a red burst |
| End | "Checkmate. You win!" | Fallen king |

**Letters.** The classic two-column list, with piece icons in place of letters and today's signs (`*`, `<>`, `>`), no folds.

**Key moments.** After the game, up to 3 rows get a star and a line: "Better: your knight takes the pawn." A tap shows the board before the move, with the better move as a ghost (C1).

**Review.** The bar changes to Menu · ◀ · ▶ · **Back to game**; on desktop the three review controls take the Hint and Undo row. The viewed row has the gold ring. ← and → work at every size.

## 5. Motion

All motion follows motion-review §5: its tokens; 900 ms or less per sequence (the result 2.6 s); a tap skips; transform and opacity only; Fast halves; Off and reduced motion show the end frame [R25–R29].

| Where | Purpose | What moves | Time, easing | Still end frame (= Off) |
|---|---|---|---|---|
| Home → game (T1, small) | One world | Title fades; night tint .6→0 | 250 + 400 ms, inout | Game screen |
| New game, Rematch (T2) | The drawn army is news | Back ranks rise a→h, 38 ms per file; pawns 80 ms later | 750 ms, out | Full board |
| Lesson piece (G2) | What to tap first | Pulses twice, then keeps a ring; after 8 s idle, the goal plays as a ghost | 2 × 600 ms | Ring on the piece |
| Lesson done or wrong (G3) | Progress, or the cause | Done: the dot stamps 1.4→1, the card rises 12 px, a chime. Wrong: a shake, then a rewind | 200 + 300 ms; 240 + 260 ms | Filled dot and card; start position |
| Sheets | Where it comes from | Phone: slides up; desktop: grows from Menu | 240 open, 200 close; out, in | Sheet |
| Menu → Extras | Depth, not a new place | Shared axis X, 24 px and fade | 200 ms, out | Extras |
| Context line | What changed | Cross-fade in a fixed box | 160 ms | New text |
| Turn (E1) | Whose turn | The avatar ring flips; the thinking ring fills | 320 ms, inout | Gold ring on the side to move |
| Hint (C1) | Which way | A see-through piece travels, then rests at .38 | about 1 s, inout | Dashed start, solid end, ghost |
| Check (C2) | The cause | A red line from the checker; the king's ring pulses once | 260 + 320 ms, out | Dashed line, ring |
| Power (F1, F3) | The power is the king's | A wave from the king; ice climbs the piece; a badge pops | 480 + 450 ms | Tint and badge |
| New move in the closed line | What just happened | At contact the old sentence slides up and out, the new one slides in 8 px; the event icon pops at the hit | 160 + 200 + 300 ms; in, out, pop | Newest sentence |
| Capture (D1) | Where the piece went | The taken icon flies to the "took" of the strip | 450 ms, inout | Icon in the strip |
| Check, power, promotion in the line | One accent | The red tag pulses once; the emblem glints; the pawn icon becomes the queen | 300 ms | Tag, emblem, queen |
| Moves open | Where the list comes from | It rises from the line; rows stagger 30 ms, 8 at most | 240 ms, out | Open list |
| Review step (B4) | What changed back | Pieces slide back; the ring slides to the row | 260 ms per ply; 160 ms | Viewed board |
| Result (H3) | How it ended | Check line, crosses, the king falls, then the card rises | 2.6 s; a tap skips | Card, king down |

Loops run only while the player decides (motion rule 7): the lesson pulse and the power pictures.

## 6. Journeys, before and after

| # | Journey | Taps today | Taps proposed | Screens proposed | Other changes |
|---|---|---|---|---|---|
| J1a | First visit, Learn, first move | 3 | 3 | Home → Lesson 1 | Words read: about 100 → 25 |
| J1b | First visit, Play, first move | 4 | **3** | Home → Game | No setup sheet; Beginner; words 140 → 30 |
| J1d | All lessons, then a game move | 24 | **20** | Home → 5 lessons → Game | After lesson 1, "Play a game now": **6** taps |
| J2 | Continue | 1 | 1 | Home → Game | Continue says whom you play |
| J3 | Chess player, Strong | 3 (+3 on main) | 3 | Home → New game → Game | Black and Chess army: +4 → +3 |
| J4 | Two players, one device | 3 | 3 | Home → New game → Game | No link button; a hand-off cue (E2) |
| J5 | Link game, first send | 6 | 7 | Home → New game → Game → share | +1 for By link; the friend's move plays (T3) |
| J6 | Powers game, first power | 8 + 1 scroll | 8 | Home → New game → Game | Words 340 → about 90 |
| J7 | Daily game | 5 | **1** | Home → Game | Share opens the share sheet |
| J8 | Workshop | 5 | 5 from Home; 7 from a game | Menu → Extras → Workshop | +2 taps for a rare place |
| J9 | Review a finished game | 1–2 to start; 1 per ply + 1 scroll per 4 | 1 to start; 1 per ply, no scroll | Result → Review | The result opens again |
| J10 | Animations Off / Sound off | 4 / 3, + 1 scroll | 4 / 3, no scroll | Menu (→ Extras) | One-tap segments |
| J11 | Resign | 2 (browser box) | 3 | Menu → question | Never next to Undo |
| J12 | Rematch after Close or Review | not possible | 2 | Moves line → Result | — |
| J13 | Rules of an enemy piece, touch | 2 + 3–10 scrolls | **1** | Game | The card in the context line |
| J14 | Sign in | 2 + 1 scroll + external | 3 + external | Menu → Extras | — |

**The experienced player.** Nothing they use goes away. Expert paths stay 1 tap or 1 key: Rematch, ← → (they start review), Z, Esc. Strong is 3 taps. Letters gives the classic list. Menu is the same at every size [R9, R10]. `?lab=1` brings back the lab tools.

## 7. Guidelines behind the main choices

| Choice | Rules |
|---|---|
| Four controls in view; all else in Menu or Extras; Resign last, with a question | R1, R3, R7, R11, R13 |
| Extras inside the Menu sheet; one Menu at every size | R2, R4, R9, R10, R14 |
| Fixed context line and moves line | R15, R23 |
| Moves closed, in words, with marker icons | R3, R8, R24 |
| Empty states teach; tips once | R18, R19 |
| Lessons with only the goal; a first Play at once | R1, R16, R17 |
| One main door; 3 army choices | R5, R6, R12 |
| Every tap answers; one peak beat; motion ends still | R20, R21, R25–R29 |

## 8. Open decisions for the owner

- **M1. Desktop controls.** *The game screen shows one Menu at every size.* (A) W2 C: a text toolbar and a Resign flag; (B) one Menu button. **Pick B.** It changes W2 C on desktop and tablet.
- **M2. Moves default.** *The moves stay closed until the player opens them.* (A) Closed at every size, kept per device; (B) open on desktop. **Pick A.**
- **M3. Move words.** *Moves read in player words; letters are a choice.* (A) Words by default; (B) Letters by default. **Pick A.** You choose one verb per piece. My draft: the Archer shoots, the Ogre shoves, the Maester swaps, the Beast bites, the Paladin charges, the Guard blocks.
- **M4. Quiet moves.** *The story shows the events.* (A) One card per turn; (B) 3 or more quiet turns fold into one line. **Pick B.**
- **M5. First Play.** *A new player plays before choosing options.* (A) Play opens New game with Beginner chosen; (B) on a first visit, Play starts a Beginner game at once. **Pick B.**
- **M6. Workshop in a game.** *Optional features live in Extras.* (A) A Menu row; (B) an Extras row, plus the quiet link on Home. **Pick B.** WORKSHOP.md and the phone check of `#workshop-btn` change.
- **M7. Home.** *A player can go back to the title.* (A) No way back (today); (B) Home in Menu. **Pick B.**
- **M8. Daily game.** *Today's army is one tap from Home.* (A) Only in More options; (B) also a quiet Home link. **Pick B.**
- **M9. Name.** *The menu says what it holds.* (A) "Extras"; (B) "Extra"; (C) "More". **Pick A.**

A copy of this document is at `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/a41b03aa-d18d-421f-bcf6-5c53a79f9f7b/scratchpad/ux03-design-draft.md`. No file in the repository changed.
