# King Down Workshop: build spec (revision 3)

- **Status:** the owner chose direction C, Piece card, on 2026-10-06. The screen rework is on `codex/workshop-card`, from `claude/workshop`. The original rules and judge stay in use. Sections 2.2–2.3 and 12.4 define the current screen contract. Custom artwork is a follow-up: the current cast is a placeholder.
- **Inputs:** three Workshop designs (minimal UX, RPG customisation, balance judge), three reports (UI architecture, art and motion, balance data), and one critic's review (24 fixes, §11).
- **Repository:** read at `/Users/za/Documents/king down chess/.claude/worktrees/agent-a86f1633d0ed4db62`, branch `claude/power-schema`, HEAD `3d5f0e5`. All line numbers are at this HEAD.
- **Tags:** **[A]** marks an assumption (§10). A **★** marks one of the owner questions (§9).
- **Prototypes** (throwaway, under 1 s of CPU each, no games played), in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/1c5adfa2-c747-4b20-ac72-5d45fc6131ab/scratchpad/workshop/`:
  - `judge-v1.mjs`: the first judge. It reproduces the balance report's empty-board counts (knight 5.25, rook 14.00, today's Archer 7.19 shots, `far2` 4.13 shots).
  - `judge-v2.mjs`: this revision's judge (the critic's fixes 3–7, 9, 21 and 24). All piece numbers in §6 come from it.
  - `adv-v2.mjs`: the critic's attack designs, run on `judge-v2.mjs`.

---

## 0. What this spec decides

| Topic | Decision | Why |
|---|---|---|
| Controls | Two kinds of control only. **Paint squares** on a 7 × 7 board, or **tap a pill** in a plain sentence. | The fewest ideas to learn |
| First view | The phone shows 2 brushes (Move+take, Line) and a **More** button. Move, Take, Shoot and "Paint on" sit behind More. The When sheet shows 6 choices and **More choices**. | A first visit must not show 20 controls at once (critic 15) |
| Slots | A piece has three tabs: Moves, Rules, Look. The rule book has the six RPG groups: Moving, Taking, Safe, Moving others, Changing, Holding back. | Three tabs fit 375 px. The groups keep the RPG feel. |
| Point-buy | Each row of the rule book shows what it adds: "+1", "−½", "+0" or "?". | Players learn worth by browsing |
| Gauge | One bar from 0 to 10 pawns, with the fair band shaded and a soft pill for the judge's error. | One widget, honest about its error |
| Worth | **The number is always the formula.** A measured value shows as a note ("Measured in computer games: 4.27 ± 0.29"). For a design that equals a measured piece, the measurement sets the label, never the number. | The same design always shows the same number, and every change moves the number the right way (critic 1, 2) |
| Tiers | The plinth metal shows the worth: stone, bronze, silver, gold. **Gold is 3.5–4.5**, where the best pool pieces stand. From 4.5 a hairline crack shows. Past 5.0 the gold cracks. | The best look is fair. Pushing past it looks damaged (critic 12) |
| Words | "Possibly overpowered" and "Likely overpowered"; "Possibly too weak" and "Likely too weak". A wide error band that reaches past 5.5 also says "Possibly overpowered: an untested shape". | The judge warns where it knows least, not only where it is sure (critic 4) |
| Lines | A piece is "possibly overpowered" past **5.0 pawns** (criterion 1 says 5.5). | Fast pieces read low in this judge, and the strongest pool piece but the queen is 4.27 (critic 24) |
| Blocked shapes | Two shapes are blocked, not warned: "only a king can take it" on a piece that takes, and "becomes another piece" anywhere but the last rank or the first take. | The judge cannot price them, and the evidence says they force draws or make a queen too soon (critic 5, 7) |
| Stored form | A piece is squares, lines and at most 3 rules. A card is a verb, its pills and one "Play it" condition. Everything else is computed. | One form serves the editor, the link and the judge |
| Mix two | **The first piece's moves plus the second piece's rules.** A piece with no rules gives "Also moves like a {piece} in the enemy half". | A union of two move sets is overpowered almost every time (critic 13) |
| Body | The body is the one you picked. Auto look is on only for Blank. | In an RPG, the body you chose stays (critic 14) |
| Fixes | The judge suggests removals only | A fix never makes a design harder to remember |
| A card "is a condition" | A small **Then** tab on the card model shows the icons of who answers it. Its text line shows only when something other than the opponent's Mirror answers it. | It shows both sides of a condition without noise on every card (critic 16) |
| Motion | The Set A motion preview is built **during** build 1. If the owner approves it, build 1 ships with it. | The owner wants a model that reacts; the standing rule needs approval, not a delay (critic 18) |
| Scope | **Build 1a: pieces only**, 10 rule blocks. **Build 1b: cards.** Build 2: play a design in a real game. | Cards cannot be played anywhere yet, and a smaller first build is easier to check (critic 23) |

### 0.1 The owner's question 1: a card can have a condition and be a condition

Yes, and the matrix says so.
- MATRIX C.1 has two rows: "Has a condition" (`docs/MATRIX.md:128`) and "Is a condition" (`:129`).
- D.1 (`:210-213`) says that a card or power can be on both sides of a condition.

The Workshop puts both sides on every card model (build 1b):
- The **If socket** (left side of the card) is what the card *has*. Examples: "Play it from your move 10" and "Play it only right after your opponent plays Freeze".
- The **Then tab** (right side of the card) is what the card *is* a condition for. Example: "Your card Answer can be played right after it." The opponent's Mirror, which can copy any card, shows as a faint icon only.
- A piece rule can also use "after your opponent plays [a card]" as its When (§4.3). This works in build 1a.

One shared event, "a card is played", joins all three.

---

## 1. Goal

1. Players build a piece (1a) or a card (1b) on a phone in under a minute. They mix the parts of `docs/MATRIX.md`: they paint squares and pick words in plain sentences.
2. A model on a pedestal changes with every tap. A judge shows "about N pawns", names the risks, and says "possibly overpowered". It warns and never blocks for strength. It blocks only the hard limits of §4.9.
3. Build 1 needs no new art and no engine change. It designs, judges, tries, saves and shares. Playing a design in a real game is build 2.

---

## 2. Screen flow and wireframes

### 2.1 Entry points

- **Title screen.** Add a fourth button, **Workshop**, after Play.
  - It is not `.primary`. Its icon is a new `#i-workshop` symbol (an anvil drawn as stroked paths) in the sprite, `index.html:17-29`.
  - **The Workshop opens over the title, as a second modal.** The title dialog stays open under it. The title code needs no new `TitleChoice` and no branch after `await titleClosed` (`src/main.ts:1382`, `:1463`): `titleClosed` is a one-shot promise, so the title cannot be shown again once it closes. The button handler is `() => openWorkshop({ from: 'title' })`, and it does not call `dlg.close()`.
  - While the Workshop is open, the title kings pause: the `enabled()` option of `startTitleKings` (`main.ts:1408-1410`) also returns false when `#workshop` is open.
  - `docs/visual-design/verify.mjs` must pass at all ten sizes, 568 × 320 included. ★4
- **Guide.** Add a quiet button, **Make your own piece or card**, under `#learn` (`index.html:226`). The Workshop opens over the Guide.
- **Link.** `?design=<code>` opens a read-only piece card over the game. Add `!params.has('design')` to `showTitle` (`main.ts:1381`), so the title does not open under it.
- **Game menu.** New game, Guide, Workshop, Settings. Workshop opens over the game.

**Back and Esc.** "< Back" on HOME always closes the Workshop dialog. The player is then where they came from: the title, the Guide or the game. Esc closes the top sheet first, then the Workshop.

### 2.2 Flow

```text
Title / Guide / game menu → Workshop
Workshop → New piece → preset, Mix two, or Surprise me → piece card
Workshop → saved design → piece card
Link → read-only piece card → Keep a copy → editable piece card
Piece card → Edit moves / Edit rules / Look & name
Piece card → Share → Send link / Copy link / Copy as text / Make a copy / Delete
Piece card → Try it → Back → same piece card, with Undo and edit state kept
```

- The home title is **Workshop**, with no lead text. It has one New piece door, Surprise me, and the local shelf. There is no disabled card door in build 1a.
- There is no separate Saved screen. Each new piece is saved when created, then after each change. Starting a selection without picking a piece saves nothing.
- A persistent status says Saved on this device, From a link, or Not saved. A refused save shows the cause, Retry or a full-shelf action, and Copy link. The alert remains visible inside a phone editor.
- Undo covers up to 50 changes. Returning from Try it does not restart editing or clear Undo. Delete needs one confirmation.
- Shared designs are read-only. Keep a copy makes a new local design and opens its editable card.

### 2.3 The frame and its layouts

- One full-screen dialog opens over the caller. Back returns to that caller.
- The card is the main surface: painted figure, editable name, estimated worth and uncertainty gauge, warning, Moves & takes, Special (0–3), Edit actions, Look & name, and an Every square disclosure.
- The card uses light parchment, two thin borders, Cinzel for the name, and burgundy for actions. Type sizes: 12–14 px labels, 16–18 px body, 18–19 px section labels, 24–28 px headings. Space uses 4, 8, 12, 16, 24 and 32 px steps.
- The header holds Workshop, save status, and Share. The footer keeps Why this estimate? and Try it visible while the card scrolls.
- **Phones, up to 720 px:** Edit opens a focused modal sheet. Done, Escape, or an outside tap returns to the card. The sheet header keeps the current estimate and warning visible, with a button to open Why. Look has its own live figure preview.
- **Desktop, above 720 px:** the card sits beside one editor. Moves opens first. Done closes that editor; a card Edit action opens it again. Why is a separate sheet at every width.
- Moves has native Action and Apply to selects plus Undo. All five actions remain available. The 7 × 7 board supports tap, drag, and arrow keys. Its cell size uses the actual panel width and the space left after the header, controls, help, and save alert. A board never requires a scroll through its rows.
- In short phone landscape, tools sit beside the board. At 568 × 270 the visual Forward label is hidden to retain the complete grid; its accessible text remains.
- Non-board controls are at least 44 px. Board cells are up to 44 px on phones and 56 px on desktop; the shortest landscape view uses 28 px cells.
- Rule choices and Why stay in nested sheets. An outside tap closes only the top modal. Dragging from inside onto the backdrop does not close it.
- Every string uses short, direct sentences. The player sees **Action** and **Apply to**, not geometry terms.

### 2.4 Original wireframes at 375 px (build 1a screens replaced by sections 2.2–2.3)

Each frame is 47 columns (8 px a column). `[ ]` is a button or a pill, `( )` a radio, `(o)` the chosen radio. The figures and plinths are stand-ins for the art in §5.

**W1. HOME**
```text
+---------------------------------------------+
| < Back                Workshop              |
+---------------------------------------------+
| Make your own piece or card. Start from one |
| you know, then change it.                   |
| +-------------------+ +-------------------+ |
| |  [knight figure]  | |  [card outline]   | |
| |     New piece     | |     New card      | |
| +-------------------+ +-------------------+ |
| [ (die)  Surprise me                      ] |
|                                             |
| Your designs (3), on this device            |
| +-------------+ +-------------+ +---------+ |
| | [fig/gold]  | | [fig/silver]| |[fig/crk]| |
| | Hungry Rider| | Swift Rider | |Wide Rook| |
| | Fair        | | Fair        | |Strong?  | |
| +-------------+ +-------------+ +---------+ |
+---------------------------------------------+
```
- The two doors are 164 × 140 px, in the `label.mode` card style. In build 1a the card door reads "Cards come next." and is disabled.
- **Surprise me** rolls a piece (1a) or a piece or a card (1b, 50/50) and opens its editor (§4.8).
- **The shelf** has 3 columns of 109 px, newest first, at most 50 designs. A tile shows the model drawn small by the same art functions, the name, and one band word: Fair, Weak? or Strong?.
- **Empty shelf:** "Nothing here yet. Your pieces and cards appear here, on this device."

**W2. START A PIECE**
```text
+---------------------------------------------+
| < Workshop            New piece             |
+---------------------------------------------+
| Start from a piece you know.                |
| [ ] Mix two pieces                          |
| +--------+ +--------+ +--------+ +--------+ |
| | [art]  | | [art]  | | [art]  | | [art]  | |
| |  Pawn  | | Knight | | Bishop | |  Rook  | |
| +--------+ +--------+ +--------+ +--------+ |
| +--------+ +--------+ +--------+ +--------+ |
| | [art]  | | [art]  | | [art]  | | [art]  | |
| | Queen  | | Archer | |Paladin | | Guard  | |
| +--------+ +--------+ +--------+ +--------+ |
| +--------+ +--------+ +--------+ +--------+ |
| | [art]  | | [art]  | | [art]  | |  (D)   | |
| |Maester | | Beast  | |  Ogre  | | Blank  | |
| +--------+ +--------+ +--------+ +--------+ |
| [ (die)  Surprise me                      ] |
+---------------------------------------------+
```
- The tiles are 80 × 96 px. They use the UI crops `public/ui/pieces/<name>-w.webp` (`src/main.ts:279-287`). Blank is a lettered token disc. There is no King tile.
- **One tap** opens the editor with that piece's preset (§4.7).
- **Mix two pieces** is a checkbox. Pick two tiles: the first gets a "1" badge, and the second opens the editor.
  - **The mix is the first piece's moves, body and letter, plus the second piece's rules.** The first piece's own rules come first; the list is cut to 3.
  - **A second piece with no rules** (Knight, Bishop, Rook, Queen) gives one rule: "In the enemy half, it also moves and takes like a {piece}." The player can change the When pill.
  - **Archer and Blank** cannot be the second piece. Their tiles grey out after the first tap, with "It has no rules to give."
  - **A rule that breaks a hard limit** (§4.9) is left out. Example: the Guard's "only a king can take it" on a knight. The toast names it: "Mixed: Knight + Guard. Left out: only a king can take it (a piece that takes cannot have it)."
  - The toast for a normal mix is "Mixed: Knight + Beast."
  - Results (`judge-v2.mjs`): Knight + Beast = Hungry Rider 4.48, fair. Knight + Rook 4.95, fair (hairline crack). Knight + Bishop 4.36, fair. Rook + Knight 5.89, likely overpowered. Bishop + Beast 4.25, fair.
- This is the matrix as mix and match: the piece columns of MATRIX A.1 are the tiles, and their rows are the rules they bring.

**W3. PIECE EDITOR, tab Moves (stage 156 px, H = 660)**
```text
+---------------------------------------------+
| <  Workshop    New piece    (undo)  [Done]  |
+---------------------------------------------+
|    .  *  .  *  .   Hungry Rider  (pen)(die) |
|   *    _/\_    *   About 4 1/2 pawns . Fair |
|       |    |       [..|===(=*=)=|.......]   |
|   *   |____|   *   Like a beast.            |
|     ||=[x2]=||                              |
| One thing to learn                          |
+---------------------------------------------+
|   [ Moves ]    [ Rules 1 ]    [  Look  ]    |
+---------------------------------------------+
| [ Move+take ]  [  Line  ]        [ More v ] |
|                  forward ^                  |
|     +----+----+----+----+----+----+----+    |
|     |    |    |    |    |    |    |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    |    | MT |    | MT |    |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    | MT |    |    |    | MT |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    |    |    | @@ |    |    |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    | MT |    |    |    | MT |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    |    | MT |    | MT |    |    |    |
|     +----+----+----+----+----+----+----+    |
|     |    |    |    |    |    |    |    |    |
|     +----+----+----+----+----+----+----+    |
| It lands on a painted square, even past     |
| other pieces.                               |
+---------------------------------------------+
```
Legend: `@@` is the piece, `MT` Move+take, `M` Move, `T` Take, `S` Shoot, `MS` Move or shoot. A line shows as a gold stripe through its squares to the rim, with an arrowhead on the edge square.

**More** opens a second row in place (it pushes the board down, and the panel scrolls):
```text
| [ Move ] [ Take ] [ Shoot ]                 |
| Paint on: [All sides] [Left and right] [One square] |
```
- On a phone, More stays open for the rest of the session once opened (a `localStorage` convenience in `try/catch`). Tablet and desktop always show every brush.

**The stage (right of the model), top to bottom**

| Element | What it shows |
|---|---|
| Name | Cinzel 23 px. Tap the name or the pen to edit it in place. The die rolls a name (§4.8). |
| Worth line | "About N pawns · {band word}". Rounded to halves; the UI shows "½". |
| Gauge | 0–10 pawns, "10+" at the right end. The fair band 2.5–5.0 is shaded. The marker is a gold gem inside a soft pill whose width is the judge's band. The gem and pill turn crimson outside the band. Landmarks only on tablet and desktop (§2.3). |
| Like line | "About as strong as a {piece}." (§6.7) |
| Stats | Moves and Takes, 0–5 dots each (§6.12). Only at H ≥ 780 and on tablet and desktop. |
| Bottom row (full width) | The learn line (§6.11), or the warning chip when there is a warning (W8) |

**The brushes**
- A radio group named "Brush". On a phone: Move+take (the default), Line, and More. The icons use the board's marker colours (`src/render/marks.ts:64-66`): Move gold, Take crimson, Shoot the archer's sight, Line a gold stripe.

| Brush | Mark on the board | Meaning (the brush's `title`) |
|---|---|---|
| Move+take | gold gem in a crimson ring | "It may go there, or take an enemy there." |
| Move | gold gem | "It may go there, only if the square is empty." |
| Take | crimson ring | "It may take an enemy there, by moving onto it." |
| Shoot | crimson sight | "It takes an enemy there and stays where it is." |
| Line | gold stripe to the edge | "It slides that way, square by square, until a piece stops it. It may take that piece." |

**What a tap does** (the square's mark before → after; "—" is an empty square):

| Brush \ before | — | move | take | both | shoot | moveShoot |
|---|---|---|---|---|---|---|
| Move+take | both | both | both | — | both | both |
| Move | move | — | move | move | move | move |
| Take | take | take | — | take | take | take |
| Shoot | shoot | moveShoot | shoot | moveShoot (the take by moving becomes a shot) | — | move (the shot is removed) |

- **Drag.** The first square decides the result, and every square the finger crosses gets the same result. A drag is one Undo step. The board has `touch-action: none`.
- **Line.** Tap any square on one of the 8 rays from the piece, and the whole ray toggles, painted on the chosen sides. Off the rays, a toast says "Lines go straight or diagonally from the piece."
- **The centre square** does nothing. Its label is "Your piece".
- **A guard-type piece** (it has "only a king can take it") refuses Take, Shoot, Move+take and Line. The toast says "Only a king can take this piece, so it cannot take. Remove that rule first." (H2b, §4.9)

**Paint on**
- **All sides** (the default) applies the 8 turns and reflections. One tap at (1, 2) gives the 8 knight squares, and one ray gives the rook's 4.
- **Left and right** paints across the file only. Use it for the pawn, the archer and forward ideas.
- **One square** paints one square.
- A change applies only to the next taps. It never repaints squares. "Paint on" is editor state; it is not stored. A preset sets it (§4.7).

**The board**
- 7 × 7, so the reach is 3. That covers every pool piece and the D.1 idea "shoots 3 squares away" (`docs/MATRIX.md:203`).
- Forward is up. The outer ring is drawn 15% dimmer.

**W3b. The same, compact stage (H < 620)**
```text
+---------------------------------------------+
| <  Workshop    New piece    (undo)  [Done]  |
+---------------------------------------------+
| +------+ Hungry Rider            (pen)(die) |
| |[fig] | About 4 1/2 pawns . Fair           |
| | x2   | [..|===(=*=)=|.......]             |
| +------+ One thing to learn                 |
+---------------------------------------------+
|   [ Moves ]    [ Rules 1 ]    [  Look  ]    |
+---------------------------------------------+
|  (brushes, the 7 x 7 board)                 |
+---------------------------------------------+
```
The model is 80 × 96 px. The like line moves into the Why? sheet.

**W4. PIECE EDITOR, tab Rules**
```text
+---------------------------------------------+
|   [ Moves ]    [ Rules 1 ]    [  Look  ]    |
+---------------------------------------------+
| Rules: 1 of 3                               |
| +-----------------------------------------+ |
| | When it takes by moving, it may take    | |
| | again from the new square (not a king). | |
| |                    +1 pawn    [Remove]  | |
| +-----------------------------------------+ |
| [ +  Add a rule                           ] |
| Fewer rules are easier to remember.         |
|                                             |
| Started from: Knight                        |
+---------------------------------------------+
```
- **A rule is a card holding one sentence.** A pill is an inline button, 44 px tall, on 52 px lines at 18 px type. The fixed words between the pills are plain text.
- **The When pill comes first.** For an event rule (§4.2), it offers only that rule's events. If only one event fits, the words are plain text, not a pill (as here).
- **Each rule card shows what it adds**, for example "+1 pawn", with "?" when the term was never measured.
- **Remove** is a quiet button, and Undo brings the rule back.
- **At 3 rules** the Add button reads "3 of 3 rules. Remove one to add another." and is disabled.

**W5. Sheet: the rule book (build 1a, 10 rows), shown for Hungry Rider**
```text
+---------------------------------------------+
| Add a rule                          [Close] |
+---------------------------------------------+
| MOVING                                      |
| (^^) Steps 2 straight ahead      +0    P    |
| (=>) Also moves like ...         +1/2  T    |
| (/\) Its lines pass over ...     --    L    |
|      Paint a line first.                    |
| TAKING                                      |
| (xx) Takes again                 --    S    |
|      Already in this piece.                 |
| SAFE                                        |
| (()) Cannot be taken by pawns    +0?   G    |
| MOVING OTHERS                               |
| (->) Pushes a piece next to it   +0    O    |
| (<>) Swaps with a friend next .. +1/2  M    |
| CHANGING                                    |
| (^Q) Becomes another piece       +1/2? P    |
| HOLDING BACK                                |
| (x/) Cannot take ...             -1    L    |
| (x+) Is removed after it takes   -2    L    |
+---------------------------------------------+
```
- **The sheet** is a nested modal `<dialog>`. It slides up and covers 85% of the height. A row is 56 px: a 32 px icon, a bold title, and a 14 px example under it.
- **The badge** is what the row adds to *this* design with its default pills (§6.12). "?" means the term was never measured. "--" means the row cannot work.
- **"Seen on"** shows the `.pi` icons of the pieces that have the ability today (the columns of MATRIX A.1).
- **A row that cannot work** is greyed, with its reason in place of the example: "Paint a line first.", "It needs a square it takes on by moving.", "Already in this piece.", "Only for a piece that takes nothing."
- **One tap** adds the rule with its default When and closes the sheet.
- **Build 1b adds 5 rows:** Steps 1 after it takes, Its shots reach farther, Guards pieces next to it, Brings a new pawn, Cannot move (§4.2).

**W6. Sheet: a pill's choices (the When of "Also moves like a queen")**
```text
+---------------------------------------------+
| When does it work?                  [Close] |
+---------------------------------------------+
| ( ) Always (adds it to Moves)               |
| (o) In the capital (d4 e4 d5 e5)            |
| ( ) In the enemy half                       |
| ( ) Next to your king                       |
| ( ) From move 10                            |
| ( ) After its first capture                 |
| [ More choices                            ] |
+---------------------------------------------+
```
- **One radio list** with 48 px rows. A choice applies at once and closes the sheet.
- **More choices** adds, in place: In your half · On its start rank · On the last rank · Next to one of your pieces · Next to an enemy piece · Next to your … [pick a piece] · From move [5] [15] [20] · Before move [5] [10] [15] [20] · On your turn after your opponent plays [any card v]. The move numbers are a mini segmented control in their row.
- **Choices that do not fit the rule are left out**, not greyed.
- **"Always" for "Also moves like"** adds the figure's squares or lines to the Moves tab and removes the rule. The toast says "Added to Moves: the queen's lines."
- **The card When** carries the note "Only in card games." under it.

**W7. PIECE EDITOR, tab Look**
```text
+---------------------------------------------+
|   [ Moves ]    [ Rules 1 ]    [  Look  ]    |
+---------------------------------------------+
| Body                                        |
| [pawn][kngt][bshp][rook][quen][arch]        |
| [pald][guar][maes][bst ][ogre][ D  ]        |
| Glow                                        |
| [None][Frst][Flam][Strt][Mud ][Sprt][Shdw]  |
| Army    [ Ivory ]  [ Charcoal ]             |
| Letter  [ H ]  Tap to change.               |
| Black's moves are the mirror image.         |
+---------------------------------------------+
```
- **Body:** 12 toggle buttons of 52 × 52 (`aria-pressed`), with the UI crops; "D" is the token disc. The body is only a look: a knight body may carry a beast's rules.
  - **A design started from a piece keeps that piece's body**, until the player taps another.
  - **A Blank design** starts with Auto on: a button **[ Auto: like a beast ]** shows above the grid, and the figure follows the pool piece with the most shared parts (§6.7). A tap on a body turns Auto off; a tap on Auto turns it back on.
- **Glow:** 7 emblem buttons of 44 px (`public/ui/emblems/`). "None" is a plain disc.
- **Army** switches the figure between the `-w` and the `-b` crop.
- **Letter:** the first free letter of the name, D E F H I J U W X Y Z. The used ones are `' PNBRQKALGMSOCVT'` (`src/rules/engine.ts:22`) and E (Squire, MATRIX:80). A tap steps to the next free letter.

**W8. The warning state, and the Why? sheet (Rook + Takes again)**
```text
+---------------------------------------------+
|    . x--x--x .      Wide Rook   (pen)(die)  |
|    x  _/\_  x       About 5 1/2 pawns       |
|    x ~|  |~ x       [..|=======|(=*=)..]    |
|    x  |__|  x       More than any pool      |
|     ||/\/\/||       piece but the queen.    |
|     '-/\/\-'                                |
| [ (!) Possibly overpowered. Why?        > ] |
+---------------------------------------------+
```
```text
+---------------------------------------------+
| Why "possibly overpowered"?         [Close] |
+---------------------------------------------+
| About 5 1/2 pawns (5 to 6). Most pieces are |
| worth 2 1/2 to 5 pawns. Only the queen is   |
| above.                                      |
| - Its lines reach far: it can take on       |
|   about 7 squares; a knight, about 5.       |
| - It takes again after it takes: +1 1/2.    |
| Try:  [ Remove "Takes again": about 4 ]     |
|                                             |
| This is a guess from computer games with    |
| the pieces we know. A new mix can play      |
| stronger or weaker. You can keep it.        |
| [ Keep it ]            [ Undo last change ] |
+---------------------------------------------+
```
- **The chip** is a 44 px button in `--danger` text on vellum. It takes the place of the learn line.
- **The stage's live line** (`role="status"`) says "About 5½ pawns. Possibly overpowered." It speaks only when the label changes, with the same guard as `src/new-game.ts:152`.
- **The reasons** are the judge's largest terms, at most 3 (§6.12).
- **"Try:"** offers at most two fixes. Each is a removal that brings the point into the band. One tap applies a fix, and Undo is there.
- **An untested shape** (§6.9) says instead: "About 4½ pawns, but the judge is unsure: the guess runs from 3½ to 6½. Nothing we measured looks like this. It may be overpowered."
- **A measured design** adds a last line: "Measured in computer games: 4.08 ± 0.45 (fair)."

**W9. SAVED**
```text
+---------------------------------------------+
| < Workshop       Hungry Rider       [Edit]  |
+---------------------------------------------+
| +-----------------------------------------+ |
| | [figure on    Hungry Rider              | |
| |  its plinth]  About 4 1/2 pawns. Fair.  | |
| | Moves:   like a knight.                 | |
| | Takes:   the same squares.              | |
| | Special: When it takes by moving, it may| |
| |          take again from the new square | |
| |          (not a king).                  | |
| |          [7 x 7 pattern picture]        | |
| +-----------------------------------------+ |
| [                 Try it                  ] |
| [ Send link ]             [ Copy as text ]  |
| [ Make a copy ]           [ Delete ]        |
+---------------------------------------------+
```
- **The card** is the Guide's `.piece-card` (`style.css:479-512`), with the Moves / Captures / Special `dl` of `fillPieceGuide()` (`main.ts:289-306`) and a still 7 × 7 SVG of the pattern. Any warning chip stays on it.
- **Send link** uses `navigator.share` where it exists and otherwise copies the link.
- **Copy as text** copies the sentences, a MATRIX-style row and the share code, so the owner can paste a player's idea into `docs/MATRIX.md`.
- **Delete** asks once: "Delete Hungry Rider? This cannot be undone." [Delete] [Keep].
- **A card design (1b)** shows the card model large, its sentence, the gauge and the same buttons. It has no Try it.

**W10. TRY IT (pieces)**
```text
+---------------------------------------------+
| < Back       Try Hungry Rider      [Reset]  |
+---------------------------------------------+
|    +--+--+--+--+--+--+--+--+                |
|  8 |  |  |  |  |  |  |  |rr|                |
|  7 |  |  |  |  |  |nn|  |  |                |
|  6 |  |  |  |pp|  |  |  |  |                |
|  5 |  |bb|  |  |  |pp|  |  |                |
|  4 |  |  |  |@@|  |  |pp|  |                |
|  3 |  |  |PP|  |PP|  |  |  |                |
|  2 |  |  |  |  |  |  |  |  |                |
|  1 |  |  |  |  |  |  |  |  |                |
|    +--+--+--+--+--+--+--+--+                |
|      a  b  c  d  e  f  g  h                 |
| The other side does not move. Tap your      |
| piece, then a marked square.                |
| Move 1      [ +5 moves ]      [ Shuffle ]   |
+---------------------------------------------+
```
- **The board** is a DOM 8 × 8 of about 42 px squares. The figures are `pieceIcon()` discs, and your piece is its body crop. The marks are the board's (gold, crimson, the sight; teal for push, violet for swap). When a rule names the capital, its squares are tinted.
- **The moves come from the Workshop's own move function**, `moves.ts` (§8). It never touches the engine. It is also the reference that build 2 must match.
- **Event rules prompt the player:** [Take again] or [Finish] for a chain; the push and swap targets; the Becomes choice.
- **Time and card Whens get controls.** "+5 moves" moves the counter on. A rule that answers a card adds "Pretend your opponent played a card".
- **Safe rules cannot show here**, because the other side never moves. A shield mark appears on the safe piece, with the line "Enemies cannot take this piece."
- **It is not a game.** Real games come in build 2.

**W11. START A CARD (build 1b)**
```text
+---------------------------------------------+
| < Workshop            New card              |
+---------------------------------------------+
| Start from a card you know.                 |
| MOVE                                        |
| +-----------+ +-----------+ +-----------+   |
| | Haste     | | Rage      | | Rally     |   |
| +-----------+ +-----------+ +-----------+   |
|   and Strike, Mimic, Control, March,        |
|   Flight, Leap, Vault                       |
| TAKE: Burn, Fire Starter                    |
| BIND AND PROTECT: Freeze, Ice Wall,         |
|   Firewall                                  |
| MOVE OTHERS: Curse, Earth Quake, Sky Lift,  |
|   Firewall B                                |
| CHANGE YOUR ARMY                            |
| +-----------+ +-----------+ +-----------+   |
| | Morph new | | Spawn new | | Salvation |   |
| +-----------+ +-----------+ +-----------+   |
|   and Sacrifice                             |
| CARDS: Mirror, Growth                       |
| [ Blank card ]       [ (die) Surprise me ]  |
+---------------------------------------------+
```
- 25 tiles of 109 × 72 px, in 3 columns, grouped by the verb families. Players learn the verbs while they browse.
- **A "B" variant is not a tile.** It is a pill in the editor: RageB, MirrorB, Earth Quake B, GrowthB, MorphB, SpawnK, Spawn2, SpawnK2.
- **"new"** marks cards that are not in the build's engine yet. Morph and MorphB are built on `claude/morph-card` (ab14413), and their run `morph-a1` is queued (TASKS.md:14). Spawn is being built on `claude/spawn-card` (TASKS.md:16).
- **Rescue is not in the deck.** Its "renew your last mark" fits no verb.
- **Blank card** opens the editor with no verb, the verb book open, and an empty frame on the stage.

**W12. CARD EDITOR, tab What it does (build 1b)**
```text
+---------------------------------------------+
| <  Workshop     New card     (undo)  [Done] |
+---------------------------------------------+
|   If   .------------------.  Then           |
|  .--.  | LONG WINTER   ** |  .--.           |
|  |10|==| [frost scene]    |==|An|           |
|  '--'  | Freeze an enemy  |  '--'           |
|        | piece or pawn... |                 |
|        '------------------'                 |
| About 2 pawns . Fair  [.|=(=*=)===|.....]   |
| Like Control.               Easy to learn   |
+---------------------------------------------+
|  [ What it does ]        [    Look    ]     |
+---------------------------------------------+
| [(*) Freeze] [an enemy piece or pawn] (not  |
| the king): it cannot move on [their next 2  |
| turns]. [Then make your move].              |
|                                             |
| Play it [from your move 10].                |
|                                             |
| Then: your card Answer can be played right  |
| after it. Your opponent's Mirror can copy   |
| it.                                         |
| Started from: Freeze                        |
+---------------------------------------------+
```
- **The card model** is a 5:7 portrait, 108 × 150 px here and 200 × 280 on SAVED. It holds the name banner, the verb's scene (an 80 × 48 SVG), the first 2 lines of the text at 11 px, and 1–5 gems for the worth. Its frame takes the verb family's colour (§5.3).
- **The If socket** (left) shows the "Play it" condition as an icon: an hourglass with N; a card back, for a card played; a broken piece, for "after you lose a piece"; a scale, for "fewer pieces". With "any time" the socket is empty.
- **The Then tab** (right) shows the icons of the listeners. With only the opponent's Mirror, it shows a faint Mirror icon and the panel has no "Then:" line. With another listener (here, the player's card Answer), the "Then:" line appears and lists all of them.
- **The gauge** for cards runs 0–5 pawns. The band is 0.7–3.0. Landmarks (tablet and desktop): March 0.5, Freeze 1.39, Haste 2.3, Rage 4.06.
- **The like line** says "About as strong as {card}." when a measured card is within 0.3 pawns. Otherwise: "Between {card} and {card}."
- **The sentence is the editor.** The first pill is the verb, with its icon; a tap opens the verb book (W13). The other pills are the verb's blanks (§4.4). The last line is always "Play it [any time]".
- **The Look tab** has the glow and the name. A card has no body.

**W13. Sheet: the verb book (build 1b)**
```text
+---------------------------------------------+
| What does the card do?              [Close] |
+---------------------------------------------+
| MOVE                                        |
| [Move again][ Move as ][ Move to ][ Jump  ] |
| [   Take   ]                                |
| BIND AND PROTECT                            |
| [  Freeze  ][  Shield  ]                    |
| MOVE OTHERS                                 |
| [   Push   ][   Swap   ]                    |
| CHANGE YOUR ARMY                            |
| [Bring back][ New pawn ][  Change  ]        |
| CARDS                                       |
| [   Copy   ][   Draw   ]                    |
+---------------------------------------------+
```
- 14 tiles of 80 × 80 px, an icon over the verb. A long press, or the tile's `title`, shows a one-line meaning.
- **A new verb** keeps every blank it shares with the old one and resets the rest. One Undo brings the old verb back.

**W14. Sheet: When can you play it? (the If socket, build 1b)**
```text
+---------------------------------------------+
| When can you play it?               [Close] |
+---------------------------------------------+
| (o) Any time                                |
| ( ) From your move [5] [10] [15] [20]       |
| ( ) Only when you have fewer pieces than    |
|     your opponent                           |
| ( ) Only right after your opponent plays    |
|     [any card v]                            |
| ( ) Only right after you lose a piece       |
+---------------------------------------------+
```

**W15. Phone landscape, 568 × 320 (visible height about 270)**
```text
+---------------------------------------------------------------------+
| < Workshop  Hungry Rider  [Moves][Rules 1][Look]  (undo) [Done]     |
+---------------------------------------------------------------------+
|    .  *  .  *  .          | MT | +---+---+---+---+---+---+---+      |
|   *    _/\_    *          | L  | |   |   |   |   |   |   |   |      |
|       |    |              | .. | +---+---+---+---+---+---+---+      |
|   *   |____|   *          |    | |   |   |MT |   |MT |   |   |      |
|     ||=[x2]=||            |    | +---+---+---+---+---+---+---+      |
| About 4 1/2 pawns . Fair  |    |   (the 7 x 7 board, 32 px;         |
| [..|===(=*=)=|.......]    |    |    the panel scrolls a little)     |
+---------------------------------------------------------------------+
```

**Desktop, 1280 × 900.** Three columns: the tabs and panel on the left, the stage in the centre (the model 320 px tall), and the sheet on the right with the gauge at full size, the landmarks, the stats, every flag, the fixes, and Why? always open.

---

## 3. The data model

### 3.1 Types

The stored form is what the player edits. The judge's features and the card's MATRIX C.1 row are computed from it (§3.2, §6.2).

```ts
// src/workshop/model.ts. Piece letters are the engine's LETTERS (src/rules/engine.ts:22).
type Body = 'P'|'N'|'B'|'R'|'Q'|'A'|'L'|'G'|'M'|'S'|'O';   // never 'K'
type Mark = 'both' | 'move' | 'take' | 'shoot' | 'moveShoot';   // the tap table in W3 is closed over these 5
type Dir = 'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'nw';            // 'n' = forward for its owner
type Zone = 'startRank' | 'ownHalf' | 'enemyHalf' | 'lastRank' | 'capital';
type MoveN = 5 | 10 | 15 | 20;
type KingName = 'Frost'|'Flame'|'Stratus'|'Mud'|'Spirit'|'Shadow';
type CardRef = 'any' | CardName | `design:${string}`;      // CardName: src/rules/rules.ts

/** MATRIX D.1. A state holds for a while. An event happens at one moment. */
type When =
  | { on: 'always' }
  | { on: 'zone'; zone: Zone }                               // while it stands there
  | { on: 'near'; who: 'king' | 'friend' | 'enemy' | Body }
  | { on: 'fromMove'; n: MoveN } | { on: 'beforeMove'; n: MoveN }
  | { on: 'afterFirstCapture' }                              // sticky: one bit per piece, like SPENT (engine.ts:48)
  | { on: 'afterCard'; card: CardRef }                       // on your turn right after your opponent played it
  | { on: 'takes' } | { on: 'firstTake' }                    // events
  | { on: 'reaches'; zone: 'lastRank' | 'enemyHalf' };       // events; Becomes allows only lastRank (H12)

type Ability =                                               // §4.2 has the sentence for each; (1b) = build 1b
  | { a: 'step2' }
  | { a: 'movesLike'; as: 'king' | 'knight' | 'bishop' | 'rook' | 'queen' }
  | { a: 'linesPass'; over: 'own' | 'any' }
  | { a: 'chain' }
  | { a: 'cannotBeTaken'; by: 'pawns' | 'allButKing' }
  | { a: 'push'; then: 'follow' | 'stay' }
  | { a: 'swap'; with: 'friend' | 'enemy' }
  | { a: 'becomes'; into: 'choice' | 'Q' | 'R' | 'B' | 'N' | 'A' }
  | { a: 'cannotTake'; what: 'king' | 'pawns' | 'any' }
  | { a: 'removedAfter'; what: 'piece' | 'any' }
  | { a: 'stepAfter'; dirs: 'straight' | 'any' }             // (1b)
  | { a: 'shotsFarther' }                                    // (1b)
  | { a: 'guardsNear'; from: 'pawns' | 'allButPawns' }       // (1b)
  | { a: 'newPawn' }                                         // (1b)
  | { a: 'cannotMove' };                                     // (1b)

interface Rule { when: When; does: Ability }

interface PieceDesign {
  v: 1; kind: 'piece';
  id: string;                    // random, on the device only; not in the share code
  name: string;                  // 1–18 characters: letters, digits, space, - and '
  named: boolean;                // true once the player typed or rolled a name
  look: { body: Body | 'token'; auto: boolean; glow: KingName | null; army: 0 | 1 };
  letter: string;                // D E F H I J U W X Y Z
  squares: { x: number; y: number; mark: Mark }[];   // x, y in −3..3, never (0, 0); stored after painting
  lines: Dir[];                  // slides until a piece stops it; it may take that piece
  rules: Rule[];                 // 0–3; no ability twice
  from: string[];                // [] | ['knight'] | ['knight', 'beast']
  updated: number;               // ms; not in the share code
}

type Verb = 'freeze'|'shield'|'again'|'moveAs'|'moveTo'|'jump'|'take'|'push'|'swap'
          | 'back'|'newPawn'|'change'|'copy'|'draw';
type Play =                                                  // MATRIX C.1 "Has a condition": one per card
  | { on: 'any' } | { on: 'fromMove'; n: MoveN } | { on: 'behind' }
  | { on: 'afterCard'; card: CardRef } | { on: 'afterLoss' };

interface CardDesign {
  v: 1; kind: 'card'; id: string; name: string; named: boolean;
  look: { glow: KingName | null };
  verb: Verb;
  pills: Record<string, string>; // keys and values per verb from vocab.ts (§4.4); a missing key = its default
  play: Play;
  from: string[]; updated: number;
}
type Design = PieceDesign | CardDesign;
```

**Fixed semantics**
- A painted square is reached like a leaper: it lands even past other pieces.
- A shot ignores blockers and takes without moving, as the archer does. The engine shape is a capture with `to === from` (MATRIX:61).
- A line stops at the first piece, and it may take that piece if it is an enemy.
- Black's pattern is the mirror image of White's.
- **A piece that cannot move (1b) still attacks and blocks.** It gives check and guards squares, as a frozen piece does today ("a frozen piece still gives check", `engine.ts:1622`). It cannot move and cannot take. Build 2's `isAttacked` follows this.

### 3.2 The derived C.1 row of a card (build 1b)

`cardRow(d: CardDesign): C1Row` reads the vocab table of §4.4. It is used by the judge, by "Copy as text", and (in build 3) by the engine's data-driven cards.

```ts
interface C1Row {
  source: 'card'; uses: 1;
  type: 'mark'|'extraMove'|'specialMove'|'arrival'|'copy'|'draw'|'promotion'|'spawn';   // C.1 :122
  turnCost: 'isMove' | 'free' | 'extraMove';                                          // :124
  captures: 'may' | 'must' | 'never';                                                 // :125
  targets: string;               // plain words, from the pills; kings excluded as C.2 does  // :126
  duration: 'instant' | 'nextTurn' | 'twoTurns';                                      // :127
  hasCondition: 'none'|'zone'|'tagTeam'|'turnN'|'behind'|'pieceLost'|'cardPlayed';    // :128
  isCondition: string[];         // the listeners: 'Mirror' and design ids              // :129
  shackled: boolean;             // true when play.on === 'fromMove' (:130)
  promotion: boolean;            // verb === 'change'                                  // :131
  fromMove: number | null;       // :132
}
```

### 3.3 Mapping to `docs/MATRIX.md` (HEAD `3d5f0e5`)

| Workshop field or value | MATRIX row (line) | Engine today |
|---|---|---|
| `squares` mark both / move / take | A.0 Move, Capture (:30-31); A.1 4b Taking = moving? (:42) | `genPiece` per type; `leaper()` :488 |
| `squares` mark shoot / moveShoot | A.0 archer capture (:31); A.1 4b (:42); A.2 shot shape (:61) | archer shots, `to === from` |
| `lines` | A.0 B/R/Q slides (:30) | `slider()` :508 |
| `step2` | A.1 4a special first move (:41); B.1 pawn rank (:93) | ● pawn; ◐ `guardDoubleFirst` |
| `movesLike` + a When | B.2 C3 moves differently there (:106); D.1 tag team, turn N, capture (:203-205) | ◐ templar (T) |
| `linesPass` own / any | A.1 4d (:44) / 4e (:45) | ● paladin; ◐ over enemies (degenerate) |
| `chain` | A.1 6a trigger on capture (:51); 6b no king as a chain step (:52) | ● beast `beastChain()` :468 |
| `cannotBeTaken` | A.1 2 Shield (:39); B.2 C2 with a capital When (:105) | ● guard; `canCapture()` :377 |
| `push` follow / stay | A.1 5a, 5d (:46, :49) / 5e (:50) | ● ogre push; ◐ repel |
| `swap` friend / enemy | A.1 5b (:47) / 5c (:48) | ● maester; ◐ enemy swap |
| `becomes` | D.3 Promotion (:224-231) | ● pawn promotion; `landed()` :936 |
| `cannotTake` king / pawns / any | A.1 3 Handicap (:40); 6b (:52); B.2 C5 (:108) | ● paladin, guard |
| `removedAfter` | A.1 6a, paladin (:51) | ● paladin `selfRemove` |
| `stepAfter` (1b) | A.1 6a; A.3 Reaver (:78) | ◐ reaver (V) |
| `shotsFarther` (1b) | D.2 the Archer shackle idea (:222); D.1 (:203) | idea |
| `guardsNear` (1b) | D.1 tag team: Mercy, Holy Light (:203) | ● king shelters only |
| `newPawn` (1b) | D.5 "a piece that spawns" (:252) | idea |
| `cannotMove` + beforeMove / near / zone (1b) | D.2 Shackled (:215-222); D.1 "a piece that wakes at turn N" (:204) | idea; the frozen-piece rule `engine.ts:1616-1622` is the model |
| When `zone` | B.1 zones (:88-96); D.1 reaches a zone (:202) | ranks compared inline; `CAPITAL` (B.2 :110) |
| When `near` | D.1 tag team (:203) | — |
| When `fromMove` / `beforeMove` | D.1 turn N (:204); C.1 fromMove (:132) | ◐ `fromMove` for cards |
| When `afterFirstCapture` | D.1 a capture (:205) | `SPENT` bit precedent |
| When `afterCard` | D.1 a card is played (:207) | `CardCtx.last` (engine.ts:1215) |
| Card `verb` | C.1 Type (:122); C.2 readings (:134-170) | §4.4 |
| Card pills | C.1 Turn cost, Captures, Targets, Duration (:124-127) | §4.4 |
| Card `play` | C.1 Has a condition (:128); D.1 (:198-208); D.4 (:233-238) | ◐ `fromMove`, ◐ `sacrificeBehind` (rules.ts:447) |
| Then (listeners) | C.1 Is a condition (:129); D.1 both sides (:210-213) | Mirror reads `last` (engine.ts:1023) |
| `verb: 'change'` | C.2 Morph (:170); D.3 (:230) | ◐ on `claude/morph-card` |
| `verb: 'newPawn'` | D.5 Spawn, SpawnK, Spawn2, SpawnK2 (:249-251) | ○ being built on `claude/spawn-card` |

**Add to the matrix when build 1 lands** (AGENTS.md: "add the new item there"):
- a D.1 row "Material behind (own side): ◐ Sacrifice with `sacrificeBehind`";
- a D.2 row "Any piece: off until move N (Workshop `cannotMove`); it still attacks, like a frozen piece".

### 3.4 Canonical form, share code, storage

- **Canonical form** (the anchor key and the duplicate test).
  - A piece: `{ kind, squares, lines, rules }`. Squares sorted by (y, x), lines by `Dir` order, rules by the order of the vocab table.
  - A card: `{ kind, verb, pills, play }`, with **every pill filled in with its default** before the compare.
  - Name, letter, look, `from`, `named`, `id` and `updated` are never in it. So a knight painted on Blank, named "Rider" with letter D, is the same design as the Knight preset.
  - `JSON.stringify` of that object is the key; no hash is needed.
- **Share code.** `?design=` + base64url(UTF-8 JSON of the canonical form + `name` + `look` + `letter`).
  - A typical piece is 300–600 characters. The limit is 2,000.
  - `parseDesign` checks every key and value against `vocab.ts` and the hard limits (§4.9), as `parseSetup` does (`src/new-game.ts:76-85`). It refuses unknown keys or values, kings, sizes over the limits, (0, 0), and every blocked shape.
  - Opening a link shows SAVED with "A design from a link" and **[Keep a copy]**. The URL is then cleaned with `history.replaceState`, as the game link is (`main.ts:1356-1435`).
  - The verdict is never in the link. It is computed again on open, so a link cannot fake a "fair" label.
- **Device storage.**
  - localStorage `kingdown.workshop` = `{ v: 1, designs: Design[] }`: at most 50 designs, newest first.
  - Every read and write is in `try/catch`, like every other key.
  - If a write fails, a toast says "Could not save on this device."
- **Cloud save:** later (§7.5).

### 3.5 Examples

```json
{ "v":1, "kind":"piece", "name":"Hungry Rider", "letter":"H",
  "look":{ "body":"N", "auto":false, "glow":null, "army":0 },
  "squares":[ {"x":-2,"y":-1,"mark":"both"}, {"x":-1,"y":-2,"mark":"both"}, {"x":1,"y":-2,"mark":"both"},
              {"x":2,"y":-1,"mark":"both"}, {"x":-2,"y":1,"mark":"both"}, {"x":-1,"y":2,"mark":"both"},
              {"x":1,"y":2,"mark":"both"}, {"x":2,"y":1,"mark":"both"} ],
  "lines":[], "rules":[ { "when":{"on":"takes"}, "does":{"a":"chain"} } ], "from":["knight"] }
```

```json
{ "v":1, "kind":"card", "name":"Long Winter", "look":{"glow":"Frost"},
  "verb":"freeze", "pills":{ "turns":"2" }, "play":{ "on":"fromMove", "n":10 }, "from":["Freeze"] }
```

The next card *has* a condition (it waits for the opponent's card), and it *is* one (Mirror can copy it, and another design may answer it). Its sentence: "Play it only right after your opponent plays any card."
```json
{ "v":1, "kind":"card", "name":"Answer", "look":{"glow":"Flame"},
  "verb":"again", "pills":{ "who":"same", "takes":"never" }, "play":{ "on":"afterCard", "card":"any" }, "from":["Haste"] }
```

The owner's Morph idea as a preset:
```json
{ "v":1, "kind":"card", "name":"Morph", "look":{"glow":null}, "verb":"change", "pills":{ "into":"pool" },
  "play":{ "on":"any" }, "from":["Morph"] }
```

---

## 4. The sentence builder

There is one source table in code, `src/workshop/vocab.ts`. Each entry carries its MATRIX row, its sentence template with pills and defaults, the Whens it allows, its judge term, its "seen on" pieces, its build (1a or 1b), and whether Try it can show it. When the owner adds a MATRIX row, the matching entry is one line.

### 4.1 Squares and lines (the Moves tab)

| Part | Values | Default |
|---|---|---|
| Brush | Move+take · Line · (More) Move · Take · Shoot | Move+take |
| Paint on | All sides · Left and right · One square | the preset's (All sides for Blank) |
| Square | x, y in −3..3; one mark: both · move · take · shoot · moveShoot (the tap table in W3) | — |
| Line | n ne e se s sw w nw (n = forward) | — |

### 4.2 Piece rules

**Kind:** a **state** rule holds while its When holds. An **event** rule happens when its event happens. The first When listed is the default. The pill values in [ ] start with the default.

**Build 1a: 10 blocks in 6 groups.** Every pool preset uses only these blocks.

| Group | Block (as the sentence reads) | Pills | Kind | Whens allowed | Needs | Seen on |
|---|---|---|---|---|---|---|
| Moving | "…it may also step 2 squares straight ahead, over an empty square, to an empty square." | — | state | on its start rank · always · in your half · in the enemy half | — | P (G lab) |
| Moving | "…it also moves and takes like [a queen]." | king · knight · bishop · rook · queen | state | in the capital · in the enemy half · next to your king · from move 10 · after its first capture · (More) the rest of W6 ("always" moves it into the Moves tab) | — | T (lab) |
| Moving | "…its lines pass over [its own pieces]." | its own pieces · any piece | state | always · a zone · next to … | a line | L |
| Taking | "When it takes by moving, it may take again from the new square (not a king)." | — | event | when it takes | a take-by-moving square or a line | S |
| Safe | "…it cannot be taken [by pawns]." | by pawns · by anything but a king (only on a piece that takes nothing, H2b) | state | always · a zone · next to … · before move N | — | G |
| Moving others | "…it may push a piece next to it (not a king) 1 square straight away, onto an empty square, [and follow it]." | and follow it · and stay | state | always · a zone · next to … | — | O |
| Moving others | "…it may swap places with [a friend] next to it (not a king)." | a friend · an enemy | state | always · a zone | — | M |
| Changing | "When it [reaches the last rank], it becomes [a piece you choose: queen, rook, bishop or knight]." | event: reaches the last rank · takes for the first time. Into: a piece you choose (Q R B N) · a queen · a rook · a bishop · a knight · an archer | event | as the pill (H12) | — | P |
| Holding back | "…it cannot take [a king]." | a king · pawns · anything | state | always · a zone · next to … · before move N | — | L, A (lab) |
| Holding back | "When it takes [a piece, not a pawn], it is removed too." | a piece, not a pawn · anything | event | when it takes | a take | L |

**Build 1b: 5 more blocks.**

| Group | Block | Pills | Kind | Whens allowed | Needs | Seen on |
|---|---|---|---|---|---|---|
| Taking | "When it takes, it may then step 1 square [straight] to an empty square." | straight · any way | event | when it takes | a take | V (lab) |
| Taking | "…its shots reach 1 square farther." | — | state | in the enemy half · on the last rank · next to … · after its first capture · from move N | a Shoot square at distance ≤ 2 | idea (D.2) |
| Safe | "…your pieces next to it cannot be taken [by pawns]." | by pawns · by anything but a pawn (not with "only a king can take it", H2c) | state | always · a zone | — | Mercy, Holy Light |
| Changing | "When it [takes for the first time], a new pawn of yours appears on an empty square next to it (not on a first or last rank). Up to 2 a game." | event: takes for the first time · takes (up to 2) · reaches the enemy half | event | as the pill | — | idea (D.5) |
| Holding back | "…it cannot move. It still guards and gives check." | — | state | before move [10] · next to an enemy piece · in the enemy half | — | idea (D.2) |

**Fixed words, not choices**
- Kings are never pushed, swapped or taken as a chain step. This follows the ogre, maester and beast rules (MATRIX:52).
- "Becomes" never offers a king or a pawn, and never a second beast (the one-Beast pool, MATRIX:71).
- "Cannot move" also means that it cannot take.

### 4.3 Whens (MATRIX D.1)

| When (as the pill reads) | Type | Memory the engine needs | MATRIX |
|---|---|---|---|
| Always | — | none | — |
| On its start rank · In your half · In the enemy half · On the last rank · In the capital (d4 e4 d5 e5) | state, positional | none (A.2 "positional, like the pawn", :63) | B.1 :88-96, D.1 :202 |
| Next to your king · one of your pieces · an enemy piece · your [piece] | state, tag team | none | D.1 :203 |
| From move N · Before move N (N = 5, 10, 15, 20) | state, game | `Position.move` (C.1 :132) | D.1 :204 |
| After its first capture | state, sticky | one bit per piece, like `SPENT` (engine.ts:48) | D.1 :205 |
| On your turn after your opponent plays [any card · a named card · one of your card designs] | state, game: **a card is the condition**. Only in card games. | the last card, kept for Mirror (`CardCtx.last`, engine.ts:1215) | D.1 :207 |
| When it takes · takes for the first time · reaches … | event | — | D.1 :202, :205 |

- **The first 6 choices** of every When sheet are: always, in the capital, in the enemy half, next to your king, from move 10, after its first capture (where the rule allows them). The rest sit behind **More choices**.
- **Zones mean "while it stands there"**, not "once it has been there". A sticky zone needs per-piece memory, which the engine avoids on purpose (MATRIX:63). The only sticky When is "after its first capture", which has the `SPENT` precedent.

### 4.4 Card verbs: 14 blocks in 5 families (build 1b)

The pills are listed with the default first. "Covers" names the measured cards that each pill setting equals.

| Family | Verb | Sentence, with pills in [ ] | Covers | C.1 type · turn cost · captures · duration |
|---|---|---|---|---|
| Move | Move again | "[The same piece moves again · A different piece of yours moves next] this turn (you may skip the second move); [no move takes · either move may take · the second move must take]." | Haste · Rage · RageB · Rally | extra move · extra move · never / may / must · instant |
| Move | Move as | "One of your pieces (not a pawn or the king) moves as [a queen · a rook · a bishop · a knight · another of your piece types · a friend next to it] moves, [to an empty square · and it may take]." A seventh choice, "[a pawn: 2 squares straight ahead, from any rank]", turns the sentence into March's. | Strike · Mimic · Control · March | special move · is the move · never / may · instant |
| Move | Move to | "One of your pieces or pawns (not the king) moves to an empty square [in your half · next to your king · anywhere]." | Flight | special move · is the move · never · instant |
| Move | Jump | "A rook, bishop or queen of yours passes over [your own pawns · one piece of either side] on this move, and may take (not a king)." | Leap · Vault | special move · is the move · may · instant |
| Move | Take | "One of your pieces (not a pawn or the king) takes an enemy (not the king) [in the capital · on the enemy's back rank · anywhere], as a queen on its square would: along a straight or diagonal line, with no piece between." | Burn · Fire Starter (`rules.ts:113-114`) | special move · is the move · must · instant |
| Bind and protect | Freeze | "Freeze [an enemy piece or pawn · an enemy piece · an enemy pawn] (not the king): it cannot move on [their next turn · their next 2 turns]. It still guards and gives check. [Then make your move · This is your move]." | Freeze | mark · free / is the move · never · next turn / two turns |
| Bind and protect | Shield | "[One of your pieces or pawns · All your pieces and pawns] (not the king) cannot be taken on [their next turn · their next 2 turns]. [Then make your move · This is your move]." | Ice Wall · Firewall | mark · free / is the move · never · next turn / two turns |
| Move others | Push | "[An enemy piece or pawn (not the king) steps 1 square, your choice · The pieces next to a square you choose are pushed 1 square away · The pieces next to one of your pieces are pushed 1 square away] (never a king)." | Curse · Earth Quake · Earth Quake B | special move · is the move · never · instant |
| Move others | Swap | "[Two of your pieces (not pawns, not of one type) · One of your pieces and an enemy piece next to it] trade squares (never a king)." | Sky Lift · Firewall B | special move · is the move · never · instant |
| Change your army | Bring back | "One of your captured pieces (not a pawn or a guard) comes back [to an empty square of your first rank · in place of one of your pawns]." | Salvation · Sacrifice | arrival · is the move · never · instant |
| Change your army | New pawn | "[A new pawn · Two new pawns] of yours appear on empty squares [of your pawn start rank · next to your king, not on a first or last rank]." | Spawn · Spawn2 · SpawnK · SpawnK2 | spawn · is the move · never · instant |
| Change your army | Change | "One of your pieces (not a pawn or the king) becomes [a piece type from the pool · a piece type from the pool, not a queen · a rook, bishop or knight] on its square. Never a second beast." | Morph · MorphB · (idea) | promotion · is the move · never · instant |
| Cards | Copy | "Play [the card your opponent played last · another card in your hand, which stays], as if it were this card." | Mirror · MirrorB | copy · the copied card's |
| Cards | Draw | "Draw the next card from your pile. [This is your move · Then make your move]." | Growth · GrowthB | draw · is the move / free · never · instant |

**Fixed rules for every card**
- Every card is one use (MATRIX:172). The editor has no "uses" control.
- No card acts on a king (H1).
- "The pool" for Change means the draw pool's types (Q O R B N A G M S), as the Morph branch plays it ("a second queen may come; MorphB never makes a queen", `claude/morph-card` ab14413).
- The owner's open Morph questions decide the Change verb's fixed words: a Guard as a target, a second Guard, a second Beast through Salvation (TASKS.md:14). [A1]

### 4.5 "Play it …": the card has a condition (the If socket, 1b)

| Choice | Status today |
|---|---|
| Any time | the default |
| From your move [5 · 10 · 15 · 20] | ◐ `fromMove`, per card (MATRIX:132) |
| Only when you have fewer pieces than your opponent | ◐ Sacrifice only (`sacrificeBehind`, rules.ts:447) |
| Only right after your opponent plays [any card · a named card · one of your designs] | idea; the event is kept for Mirror (MATRIX:207) |
| Only right after you lose a piece | idea (D.1 "a piece lost", :206) |

- A card has one condition at most.
- A zone or tag-team condition lives in the target pill ("takes an enemy in the capital"), not here. `cardRow()` still reports it as C.1 "Has a condition: zone / tag team".

### 4.6 "Then": the card is a condition (the Then tab, read-only, 1b)

The list is computed and is never edited:
- "Your opponent's Mirror can copy it." This holds for every card except the Copy verb [A2]. **Alone, it shows only as a faint icon on the Then tab.**
- "It answers: {card}." This is shown when its own Play is `afterCard` with a named card.
- One line for each saved design that listens to this card or to any card: "Your Hungry Rider: … also moves like a knight" or "Your Answer can be played right after it."
- The "Then:" text line in the panel shows only when the list has a line other than Mirror's.

**Left out on purpose:** a card that triggers *your own* next card ("when you play Freeze, your next card is free", MATRIX:207), and any play during the opponent's turn. Both add a second idea of time.

### 4.7 Presets

**Pieces, in Workshop words** (from White's side: x is to the right, y is forward):

| Preset | Squares | Lines | Paint on | Rules | Left out |
|---|---|---|---|---|---|
| Pawn | Move (0,1); Take (±1,1) | — | Left and right | "On its start rank, it may also step 2 squares…"; "When it reaches the last rank, it becomes a piece you choose: queen, rook, bishop or knight." | — |
| Knight | Move+take (±1,±2), (±2,±1) | — | All sides | — | — |
| Bishop | — | 4 diagonal | All sides | — | — |
| Rook | — | 4 straight | All sides | — | — |
| Queen | — | all 8 | All sides | — | — |
| Archer (today, `plusDiagFwd2`) | Move on the 4 straight neighbours; Move or shoot on the 4 diagonal neighbours; Shoot (0,±2), (±2,0), (±2,2) | — | Left and right | — | — |
| Paladin | — | all 8 | All sides | lines pass over own pieces · removed after taking a piece, not a pawn · cannot take a king | — |
| Guard | Move on the 8 neighbours | — | All sides | cannot be taken by anything but a king | — |
| Maester | Move+take on the 8 neighbours | — | All sides | swaps with a friend next to it | the long swap with the king, both on the first rank. Its Rules tab says "Not in the Workshop: the long swap with the king." |
| Beast | Move+take on the 8 neighbours | — | All sides | takes again after it takes | — |
| Ogre | Move+take on the 8 neighbours | — | All sides | pushes a piece next to it, and follows it | its "a guard excepted" is the Guard's own rule |

- A unit test proves that each preset's squares and lines equal `genPiece(board, d4, 'all')` on an empty board (§8.4).
- The Archer preset follows the official reading. If the owner adopts `far2` (TASKS.md:9-10), the preset changes with it.

**Cards (1b):** 25 tiles (W11), from `ALL_CARDS` (`src/rules/rules.ts:167`) without Rescue and without the B variants, plus Morph and Spawn.

### 4.8 Fun: Mix two, Surprise me, names

**Mix two:** see W2.

**Surprise me**
1. Pick a random preset (1a: a piece; 1b: a piece or a card).
2. Make 1–3 random edits that fit: for a piece, add or clear one painted square group, add or remove one line pair, or add one rule that fits with its default When; for a card, change one pill.
3. Roll up to 20 times, until the judge says Fair with no warn flag and the learn line is at most "One thing to learn".
4. Add a random glow and a rolled name.
5. Open the editor with the toast "A surprise: Moss Warden. Change anything." One Undo goes back to the preset.

**Names**
- A piece name is an adjective plus a noun. The adjective comes from the strongest trait, and the noun from the body.
  - Adjectives: chain "Hungry", shots "Far-eyed", lines "Swift", lines over pieces "Leaping", cannot be taken "Stone", guards neighbours "Kind", push "Shoving", swap "Tricky", becomes "Rising", new pawn "Nesting", removed after a take "Doomed", cannot move before N "Sleeping", in the capital "Central". Otherwise: Ash, Moss, Iron, Amber, Night, Dawn.
  - Nouns: pawn Squire, knight Rider, bishop Seer, rook Tower, queen Regent, archer Bowman, paladin Champion, guard Warden, maester Scholar, beast Brute, ogre Giant, token Spirit.
- A card name is an adjective plus a verb noun.
  - Adjectives: 2 turns "Long", from move N "Late", answers a card "Answering", all your pieces "Great", may take "Fierce". Otherwise the glow word: Frost, Ember, Storm, Moss, Light, Night.
  - Verb nouns: Freeze Winter, Shield Ward, Move again Rush, Move as Stride, Move to Flight, Jump Vault, Take Blaze, Push Quake, Swap Switch, Bring back Return, New pawn Sprout, Change Morph, Copy Echo, Draw Harvest.
- The name follows the design until the player types or rolls one.
- A name that equals an existing piece or card gets " (yours)" on save.
- Every name is escaped wherever it is drawn. The only escaper today, `esc()` in `src/account/account.ts:22`, is not exported. Export it, or add a one-line copy in `src/workshop/`.

**Undo**
- Every change is one step: a tap, a drag, a pill choice, a rule added or removed, a rename, a roll, a fix.
- The history holds 50 steps for one editing session and is not saved. There is no redo.
- Ctrl/Cmd+Z also undoes. The Undo button's `title` names the step: "Undo: add a rule".

### 4.9 Hard limits (blocked) and warnings (never blocked)

**Blocked.** These options are not offered, or they show greyed out with their reason:

| # | Limit | Reason shown | Source |
|---|---|---|---|
| H1 | Nothing takes, moves, swaps, pushes, freezes or changes a king. No pill names a king as a target. | "Nothing may move or take a king." | engine.ts:101; MATRIX C.2 targets |
| H2 | Every piece can be taken, at least by a king. "Cannot be taken" stops at "by anything but a king". | "Only kings are never taken." | engine.ts:389; MATRIX A.3 Shieldbearer (:81) |
| **H2b** | **"Cannot be taken by anything but a king" only on a piece that takes nothing** (no take square, shot or line), as the Guard. With that rule on, the Take, Shoot, Move+take and Line brushes refuse. | "Only for a piece that takes nothing." / "Only a king can take this piece, so it cannot take. Remove that rule first." | "a single Iron piece that can follow the King guarantees at least a draw" (`fairy-values.md:48-50`); MATRIX:81, :105 |
| **H2c** (1b) | "Guards pieces next to it from all but pawns" is not offered with "cannot be taken by anything but a king". | "Not with 'only a king can take it'." | MATRIX A.3 Shieldbearer (:81) |
| H3 | A piece must move or take somewhere. Done does not leave the editor. | "Paint at least one square or line." | — |
| H4 | The reach is 3 squares, and lines are full length | the 7 × 7 board | — |
| H5 | No pawn on a first or last rank (spawn, change, bring back) | "No pawn may stand there." | MATRIX D.5 :250 |
| H6 | One extra move a turn | "One extra move a turn." | `Position.haste` is one slot [A3] |
| H7 | A rule must change this design (W5 reasons) | the row's reason | — |
| H8 | At most 3 rules, with no ability twice | "3 of 3 rules…", "Already in this piece." | owner: simple rules |
| H9 | A card has a verb | "Pick what the card does." | — |
| H10 | At most 2 new pawns a game from one piece | fixed words "Up to 2 a game" | — |
| H11 | No body, target or "becomes" choice is a king, and no "becomes" choice is a pawn or a second beast | not offered | MATRIX C.2 Morph :170 |
| **H12** | **"Becomes" happens only on the last rank or on the first take.** | not offered | MATRIX D.3 (:224-231): promotion is a last-rank event. A king-stepper that becomes a queen in the capital gets there in about 3 moves. |

**Warned, never blocked:** every other case: worth outside the band, every risk flag (§6.10) and "Possibly hard to remember" (§6.11). This is the owner's "the player CAN make it, but there's a warning".

A design with a warning:
- can be saved and shared;
- keeps its cracked look and its chip everywhere: on the shelf, on SAVED, and on a link (it is computed again on open);
- in build 2, makes New game show one line: "This army has Wide Rook: possibly overpowered." ★2

### 4.10 The text generator (`src/workshop/text.ts`)

`describe(d)` returns `{ moves, takes, special[], summary }` for a piece, and `{ text, play, then[] }` for a card. It is pure, so it can be tested in Node.

**Moves line**
1. Build the sets: M = move squares (both, move, moveShoot); T = take-by-moving squares (both, take); S = shoot squares (shoot, moveShoot); L = lines.
2. **A known pattern wins:** 8 neighbours "1 square any way, like a king"; the knight's 8 "in an L, like a knight"; 4 diagonal lines "like a bishop"; 4 straight lines "like a rook"; 8 lines "like a queen"; (0,1) with takes at (±1,1) "like a pawn".
3. **Otherwise, one phrase per square group.** A group is a set of squares the same under the 8 turns and reflections, with one mark. The phrases go nearest first:

   | Group | Full | Part |
   |---|---|---|
   | (1,0), (2,0), (3,0) | "{n} squares straight" | "straight ahead", "straight back", "sideways", "straight ahead and back" |
   | (1,1), (2,2), (3,3) | "{n} squares diagonally" | "diagonally forward", "diagonally back" |
   | (2,1) | "in an L" | "in a forward L", "in a back L" |
   | (3,1), (3,2) | "in a long L (3 and 1)", "(3 and 2)" | the same with "forward" or "back" |

   At most 3 phrases, joined with commas and "or". With more, the line reads "to {n} squares (see the picture)".
4. **Lines:** "slides straight", "slides diagonally", "slides any way"; for a part, "slides straight ahead and back", "slides forward", and so on. Then add: "It lands on a painted square, even past other pieces."

**Takes line**
- If every square is Move+take and there are no shots: "the same squares."
- Otherwise: phrases for T, then "Shoots without moving: {S phrases}."
- With no T, no S and no lines: "nothing." With a "cannot be taken by anything but a king" rule, add: "Only a king can take it."

**Special lines.** One sentence per rule, from the template in §4.2:
- **State rules:** "{When head}, it {does}." Examples: "In the capital, it also moves and takes like a queen." "On your turn after your opponent plays any card, it also moves like a knight."
- **Event rules:** the event is the head. Example: "When it takes by moving, it may take again from the new square (not a king)."

**Card text (1b).** The verb template with its pills, then "Play it {play}.", then the Then lines (§4.6).

**Style rules (unit-tested)**
- Present tense, active voice, digits for numbers.
- Every sentence ends with a period and has at most 120 characters.
- No engineering word (§2.3).
- The 11 piece presets produce pinned strings that match the Guide's meaning.

---

## 5. The model: how it reacts

**The house rules**
- Every change is first an instant state change: the still frame shows the idea (`src/power-motion.ts:7-9`).
- Motion (§5.5) is built during build 1 on a preview page. It enters the Workshop only after the owner approves it.
- Motion animates only `transform` and `opacity` (plus one stroke draw for cracks).

### 5.1 The piece stage, back to front (DOM, SVG and CSS; no canvas, no animation-frame loop)

| # | Layer | Built from |
|---|---|---|
| 1 | Night backdrop | the title's CSS gradients (`style.css:517-527`, `--night`) |
| 2 | Floor: a tilted 7 × 7 patch with the design's marks | inline SVG. The squares come from `board()` in `power-motion.ts:49-54`, widened from 5 × 3. It is tilted with `perspective` and `rotateX(58deg)`, as `.title-floor` does (style.css:529). |
| 3 | Zone mini-map, 64 × 64, top right | SVG. Only when a rule names a zone. The capital is squares 27 28 35 36 (MATRIX:110). |
| 4 | Partner | a 55% `<img>` of the partner's UI crop, desaturated, joined to the model by a gold dashed thread. Only for a `near` When. |
| 5 | Ghost of the future form | the crop of the `becomes` or `movesLike` target at 115%, opacity .25, grayscale, a gold rim (`drop-shadow`) |
| 6 | Rim glow | a `<div>` with `mask-image: url(<crop>)`, a blurred colour, opacity .35. Its colour is the Look tab's glow; with no glow, the colour of the strongest stat. It sits behind the figure, so the army colour stays dominant (LESSONS.md:319). |
| 7 | Figure | `<img src="ui/pieces/<name>-<w|b>.webp">`. Only the one shown loads (about 19 KB). The relative heights come from the title lineup's `--h` (`index.html:92-103`). Blank uses the `.pc-medallion` disc (`style.css:496`) with the letter. |
| 8 | Shield | a ring at the feet like Mercy's `.shield` (`power-motion.ts:146`), or a warm-ivory dome from the Ice Wall path (`power-motion.ts:72`) scaled about 6× |
| 9 | Plinth | CSS: an ellipse top textured with `public/ui/stone-board.webp`, and a 22 px front band in the metal of the worth (§5.4), with a letter seal |
| 10 | Badges on the band | small seals for the rules (§5.2) |
| 11 | Chains and padlock (1b) | SVG paths in stone-700 `#4d453c`, for `cannotMove` |
| 12 | Cracks | SVG paths over the band, in the ember colours `#ff8a1c` and `#ffd060` (`power-motion.ts:226-228`) |
| 13 | Hourglass, card back, pawns | SVG: the hourglass shows N; the card back for `afterCard`; `SHAPE.pawn` (`power-motion.ts:21`, export it) |

**Accessibility**
- The stage is `aria-hidden="true"`. A visually hidden summary follows it. Example: "Knight look, ivory, gold plinth. Moves like a knight. Takes again after it takes. About 4½ pawns, fair."
- Colour is never the only cue: every prop also has a sentence in the text.

### 5.2 Piece: property → reaction → implementation

The marker colours match the board: move gem `#e9b44c` (shades `#fff4cf / #f0bf52 / #9a6418`), capture `#b3261e`, swap `#7d5ba6`, shove `#2f7f75`, power `#3f7fd0` (`src/render/marks.ts:105-241`, RGB at `:64-66`).

| Property | Still reaction | Implementation | Motion proposal |
|---|---|---|---|
| Body | the figure changes (Auto follows the rules, Blank only) | swap the `<img>` src; the token disc for Blank | A1: 250 ms cross-fade |
| Army | ivory ↔ charcoal | `-w` / `-b` crop | — |
| Move squares and lines | gold gems on the floor; a line shows 3 gems and a fading chevron at the patch edge ("goes on") | SVG diamonds per offset | A2: gems pop in, rippling by distance (`POP_MS` 300, `RIPPLE_MS` 38, `backOut`, `marks.ts:33-39`) |
| Take squares | a crimson ring on each; a ring without a gem where it only takes | SVG ellipse stroke | A2 |
| Shoot squares | dashed crimson rings, and a thin sight line from the figure's chest | dashed ring (as `marks.ts:115`) + SVG line | A2 |
| Takes nothing | no red on the floor; a sheathed-sword seal | seal + a sword glyph drawn as paths | A6-like stamp |
| Step 2 | two footprints forward | March's `.print` dots (`power-motion.ts:108-109`) | — |
| Also moves like X (with a When) | the ghost of X; X's extra gems hatched; the When's prop (mini-map, partner, hourglass, card back) | layers 3–5, 13 | A5: the When reveal |
| Lines pass over pieces | ivory pawns (own) or charcoal pawns (any) on a line, with an arc over them | `SHAPE.pawn` + an arc like Leap's `trace-leaf` (`:116`) | A2 |
| Takes again (chain) | 2–3 crimson rings joined by a dashed line, numbered 1 and 2; a "×2" seal; the rim turns crimson | SVG | A1: two crimson pulses |
| Cannot be taken | by pawns: a feet ring and a pawn seal; by anything but a king: a full dome and a "K only" seal | layer 8 | A1 rim flash in ivory `#fff2cf` |
| Push | teal chevrons pointing away on the neighbours, a pawn being pushed; "and follow" adds a gem behind it, "and stay" an anchor under the figure | SVG `#2f7f75` | A2 |
| Swap | violet double arrows to the neighbours | SVG `#7d5ba6` | A2 |
| Becomes | the ghost of the target, a gold arrow, the event's chip | layer 5 | A5: cross-fade with Sacrifice's `ring-gold` burst (`:105`) |
| Cannot take X | X's icon struck through on the rings; a seal with X slashed | `pieceIcon(X)` + a slash | A6 stamp |
| Removed after it takes | a faint after-image above the figure; the rings drawn as one-way dashes | a second mask layer at opacity .15 | — |
| (1b) Steps 1 after it takes | a crimson ring with a small gold arrow out to an empty square | SVG | A2 |
| (1b) Shots reach farther | one more dashed ring outward, hatched until its When holds | SVG | A5 |
| (1b) Guards its neighbours | a dotted halo ring on the floor around it | SVG | A5 halo pulse |
| (1b) New pawn | 1–2 pawn silhouettes at the floor's edge, with dust | `SHAPE.pawn` + March's `.dust` (`:112`) | A2 |
| (1b) Cannot move | a grey copy of the figure on top, chains and a padlock with the release icon; its red rings stay (it still guards) | two stacked `<img>`s; `filter: grayscale(.85) brightness(.85)`; layer 11 | A5: the links fly apart, the colour returns |
| Glow (Look tab) | a soft aura in the king's code colour: Frost `rgba(110,196,250)`, Flame `rgba(255,130,30)`, Stratus `rgba(130,180,230)`, Mud `rgba(130,150,50)`, Spirit `#ffe7a6`, Shadow `rgba(90,40,130)` | layer 6 colour | B5: the live king effects |
| Worth | the plinth metal (§5.4); the figure scales from 0.94 to 1.08 with the worth [A4] | CSS gradient; `transform: scale()` | A3: the metal cross-fades with the gauge |
| Near the line (4.5–5.0) | one hairline crack, no glow | layer 12 | — |
| Possibly / likely overpowered | cracks with ember seams; crimson gauge gem | layer 12 | A4: cracks draw, 3 tremors, then a slow ember loop |
| Untested shape | the same cracks, drawn dashed | layer 12 | A4 |
| Possibly too weak | a plain stone plinth; the figure at 90% brightness | CSS | — |
| A "Now / When…" toggle (stage corner, only when a rule has a When) | "When…" shows the state with the rule on: hatched gems lit, chains off, the ghost in front | a class on the stage | A5 |

### 5.3 The card model (build 1b)

| Part | Built from | Reaction |
|---|---|---|
| Card, 5:7 | an HTML `<article>` with real text | — |
| Frame colour, by verb family | Move: gold `#e9b44c`. Take: crimson `#b3261e`. Bind and protect: blue `#3f7fd0`. Move others: teal `#2f7f75`. Change your army: violet `#7d5ba6`. Cards: stone `#4d453c`. These are the board's marker colours, not king colours. | A6: the new frame cross-fades |
| Frame metal (worth) | parchment < 0.7, bronze 0.7–1.5, silver 1.5–2.0, gold 2.0–2.7, gold with a hairline 2.7–3.0, cracked > 3.0 | A3, A4 |
| Gems | 1–5 gems at the top right for the worth (one gem a pawn, rounded); crimson over the band | — |
| Scene window | a generated 80 × 48 SVG inside a `.pm` span, so every fill of `power-motion.css:10-33` applies. The 12 powers reuse `powerArt()` (`power-motion.ts:171`). The other verbs are built from existing parts (Freeze `fz-tint`/`ice`; Shield the dome; Move again ghost steps; Move as and Jump a `trace-gold` arc; Take a crimson ring; Push teal chevrons; Swap violet arrows; Bring back `sc-beam`; New pawn pawns with dust; Change a swirl and `ring-gold`; Copy a mirrored card outline; Draw a rising card back). | still frame; Set B animates it |
| Sword badge (captures) | sheathed (never), plain (may), red glint (must) | A6 stamp |
| Duration ring | 1 or 2 segments around the top-left gem | — |
| Cost gem (top left) | "1 move", "free" (a lightning ribbon), "+1 move" (two footprints) | — |
| If socket (left) | a CSS/SVG socket with the condition's icon (W12) | A6: the seal stamps in |
| Then tab (right) | a tab with the listeners' icons; Mirror alone is a faint icon | A6: the tab slides out |
| Glow (Look tab) | tints the frame's inner rim | — |

### 5.4 Worth → metal (pieces), the same scale for every view

| Worth (pawns, the formula) | Plinth | Today's presets (formula) |
|---|---|---|
| < 2.5 | stone `#8a8072 → #4d453c`; figure at 90% brightness | guard 0.88, pawn 1.03 (the pawn shows its own line) |
| 2.5–3.0 | bronze `#c08a52 → #7a4a22` [A5] | ogre 2.58, archer `far2` 2.89 |
| 3.0–3.5 | silver `#e8e6e0 → #8f949a` [A5] | knight 3.28, bishop 3.04, maester 3.28 |
| 3.5–4.5 | gold `#f0d48a → #c99a3e` (`--gold`) | rook 3.96, beast 4.08, archer 4.47 |
| 4.5–5.0 | gold with one hairline crack, no glow | Hungry Rider 4.48 is just under it |
| > 5.0 | gold, cracked, ember seams | — |
| ≥ 7.5 | wide cracks, crimson seams | the queen only ("Only the queen stands here.") |

The best look is gold, and the strong pool pieces already have it. A design gains nothing to look at past 4.5: the plinth starts to crack. So the visuals never reward power creep into the zone where the judge's error is largest.

### 5.5 Motion sets (each needs the owner's approval)

**Set A was approved on 2026-10-06.** It is connected to the piece-card rework in `src/workshop/motion.ts`. Every reaction ends within 560 ms (280 ms at Fast), leaves the still state, and is cancelled on the next edit, navigation, close, or a switch to reduced motion / Animations Off. The preview remains at `docs/visual-design/workshop/motion-preview.html`.

| # | Motion | Length | Moves |
|---|---|---|---|
| A1 | **Equip:** an in-place bob from the approved gait curves (`GAITS` and `GAIT_OF`, `docs/2d-first-pieces/board/gait.mjs:54-60`; `lift`, `sx`, `sy`, `tilt` only, no travel), plus a rim flash; also the 250 ms cross-fade of a body change | 420–480 ms | transform, opacity |
| A2 | **Floor pop:** new marks pop in by distance; removed marks fade | 360 ms + 38 ms a ring | transform, opacity |
| A3 | **Gauge ease:** the marker, the pill and the metal ease | 450 ms | transform, opacity |
| A4 | **Overload:** on crossing the line, the cracks draw and the figure shakes 3 times, then rests | 560 ms | stroke-dashoffset, transform, opacity |
| A5 | **"When…" reveal:** chains break, the ghost cross-fades with a gold ring, the sleeper wakes, the partner's squares light | 560 ms | transform, opacity |
| A6 | **Card stamp (1b):** a seal stamps in, the Then tab slides out, a gem fills | 250 ms | transform, opacity |

**Rules for every motion**
- A new tap cancels the running motions of that element first (`el.getAnimations().forEach(a => a.cancel())`).
- No motion runs longer than about 600 ms per tap. The end of every one-shot is the still state.
- **A WAAPI trap.** The reduced-motion CSS rule (`style.css:688-690`) does **not** stop `el.animate()`. So `react()` must itself skip motion when `matchMedia('(prefers-reduced-motion: reduce)').matches` or `document.documentElement.dataset.pace === 'off'` (`main.ts:1303`). It halves the durations for `'fast'`.

**Set B (later):** B1 a demo move with its gait; B2 the idle breath `idleAt` (`gait.mjs:64-65`); B3 a canvas body with its own pose (the `startTitleKings` pattern, `title-kings.mjs:39`); B4 the card tilts toward the pointer; B5 live element auras through `createKingEffects` (Spirit needs a small change; Flame and the Shadow smoke need masks); B6 a real Morph change, which the board also needs when Morph ships.

### 5.6 Sound

Behind Settings › Sound, with no new sound code. Each change plays the board sound of its kind through the exported `snd` (`src/render/sfx.ts:81`): Move brush `snd.move`; Take `snd.capture`; Shoot `snd.shot`; Push `snd.shove`; Swap `snd.swap`; Takes again `snd.chain`; crossing into "possibly overpowered" `snd.check`. At most one sound every 120 ms. No vibration (iOS Safari has none [A6]).

---

## 6. The judge (`src/workshop/judge.ts`, pure, under 2 ms a call)

### 6.1 Output

```ts
interface Verdict {
  worth: { point: number; lo: number; hi: number;                  // pawns; lo..hi is the 95% band; always the formula
           measured?: { value: number; pm: number; source: string; label: Label } };   // a note, for an exact anchor
  label: Label;                  // 'fair' | 'possiblyOP' | 'likelyOP' | 'untestedOP' | 'possiblyWeak' | 'likelyWeak'
  metal: 'stone' | 'bronze' | 'silver' | 'gold' | 'hairline' | 'cracked' | 'broken';
  like: string;                  // "About as strong as a beast."
  flags: { code: FlagCode; level: 'info' | 'warn' | 'good'; line: string; evidence: string }[];
  memory: { points: number; level: 0 | 1 | 2 | 3 };
  idle: string[];                // rules that change worth by < 0.3 pawn: "Simpler without it?"
  why: string[];                 // ≤ 3 sentences, largest term first
  fixes: { label: string; design: Design; worth: number }[];      // ≤ 2, removals only
  stats: { moves: 0|1|2|3|4|5; takes: 0|1|2|3|4|5 };
  deltas: Record<string, number | null>;   // rule-book badges (null = "?")
  line: string;                  // ≤ 90 characters
}
judge(d: Design): Verdict        // no options: the same design always gets the same verdict
```

### 6.2 Piece features

All features are averages over the 64 from-squares, from White's side. Every other square is occupied with chance p = 0.4 (the balance report's conventions, so its fits carry over).

**One weighted union per target square.** The design's own squares and lines are one layer with weight 1. Each "Also moves like X" and "Shots reach farther" rule adds a layer with weight = its When share (§6.5). For each target square, only the largest value of all layers counts. So a queen painted on the Moves tab and a queen added by a rule with "always" read the same, and the hinge (§6.3) runs on the blended counts. (The first prototype added the layers, and a king-stepper with "like a queen from move 5" read 13.46, more than a queen.)

| Feature | Counting |
|---|---|
| Q (quiet squares) | painted move squares: the full count. Lines: Σ 0.6^d. `step2`: 0.6 × 0.875 × its When share. |
| X_far (far takes) | painted take squares at distance ≥ 2, or in an L: the full count. Lines: Σ 0.6^(d−1), so the first blocker counts. |
| X_shot (open shots) | shoot squares: the full count |
| X_step (takes next to it) | painted take squares at distance 1 |
| X_open | X_far + X_shot + X_step |
| M (mobility, empty board) | move squares + full line lengths (for the stats and the idle flag) |

**Check values** (the prototype matches the balance report §3):

| Piece | Q | X_far | X_shot | X_step |
|---|---|---|---|---|
| Knight | 5.25 | 5.25 | — | — |
| Bishop | 3.17 | 5.29 | — | — |
| Rook | 4.16 | 6.93 | — | — |
| Queen | 7.33 | 12.21 | — | — |
| Archer today | 6.56 | — | 7.19 | — |
| Archer `far2` | 6.56 | — | 4.13 | — |
| Beast | 6.56 | — | — | 6.56 |

### 6.3 Piece formula

**W_geo = 0.077 + 0.123·Q + 0.487·(X_far + X_shot) + 0.258·X_step + 0.46·max(0, X_open − 7) + 0.4·max(0, Q − 8)**

| Coefficient | Value | Source |
|---|---|---|
| intercept, quiet, far or shot take | 0.077 · 0.123 · 0.487 | fit 2c of the balance report (N B R + 4 beasts); the archers alone give 0.47 a shot, the beasts alone 0.51 a square |
| take next to it | 0.258 (= 0.487 − 0.229) | the maester and ogre residuals |
| take squares beyond 7 | +0.46 each | set so that the queen (X 12.21) reads 9.32. It rests on one point. |
| **quiet squares beyond 8** | **+0.4 each** [A18] | **The mobility hinge.** No measured piece has Q over 7.33 (the queen), so no measured value moves. The weight sits between the cross-section's 0.12 and the one paired reading's 0.51 (maester step 2, era C). |

Why the hinge: without it, a piece that moves to all 48 squares within 3 and takes like a king read 5.37, fair, with a gold plinth. It can jump into a fork from anywhere. With the hinge it reads 13.87, likely overpowered. A 5 × 5 leaper with king-step takes reads 7.49, possibly overpowered (it read 3.87). Flag F11 also fires (§6.10).

### 6.4 Rule terms

The ± values are 95% and combine in quadrature (§6.6). **Monotone rule:** an ability never lowers the estimate, and a flaw never raises it. Each term is clamped to its side. Players read the gauge as a point budget.

| Rule | Δ pawns | ± | Evidence | Status |
|---|---|---|---|---|
| Takes again | +0.229 × (X_step + X_far): beast +1.50, knight +1.20, rook +1.59 | 0.5 | S − O +1.67 ± 0.40; S − M +0.99 ± 0.40 (pv2-d3) | measured, indirect |
| Lines pass over own / any | +0.3 / +0.6, with F8 and F10 for "any" | 1.0 | the sign is unknown outside the kamikaze paladin; over enemies was degenerate | unmeasured |
| Also moves like X, Step 2, Shots farther (1b) | geometry: a layer in the union (§6.2), weighted by the When share | 0.5 for the When | — | — |
| Cannot be taken by pawns / by all but a king | +0.2 / 0, with F1 | 0.5 / 1.0 | guard < 1.66 under 6 rule changes. "All but a king" is legal only on a piece that takes nothing (H2b), so it is priced against a non-taker only. | unmeasured alone |
| Push, follow / stay | 0 / 0 | 0.5 / 0.7 | ogre ≈ a plain stepper; repel 0.93 below push (era B), clamped to 0 | measured, indirect |
| Swap with a friend / an enemy | +0.7 / 0, with F1 info | 0.4 / 0.5 | M − O +0.68 ± 0.39; the enemy swap was never played (era C) | measured |
| Becomes X | + P(event) × (W(X) − W) | max(0.5, the term) | **P(last rank) = min(0.9, 0.05·f³)**, f = the farthest forward reach of one move (a forward line counts 4): the pawn and a king-stepper 0.05, a knight 0.4, a rook or bishop 0.9. **P(first take) = 0.6.** The pawn reads 1.03. Flag F12 when X is a queen and f > 1 or the event is the first take. | [A8] |
| Cannot take a king / pawns / anything | −1.0 / −0.3 / W := min(W, 1.3) | 0.8 / 0.5 / — | paladin pair +1.00 ± 0.79; guard and catapult < 1.66 | era C / [A10] / bound |
| Removed after it takes a piece / anything | W := base + (W − base) × 0.41 / × 0.32, base = 0.077 + 0.123·Q | 1.0 | paladin 4.08 ± 0.45 (era B, fitted on it); era C ratio 0.77 | one piece |
| No take at all (no take square, shot or line) | W := min(W, 1.3), with F1 | — | guard, catapult < 1.66 | bound |
| (1b) Steps 1 after it takes, straight / any way | +0.9 / +1.9, with F8 for "any way" | 0.6 / 1.5 | reaver 4.04 ± 0.56 vs knight 3.16; all 8 has no fixed point (> 4.66) | era B |
| (1b) Guards neighbours from pawns / from all but pawns | +0.6 / +1.1, with F1; F6 when the piece takes | 1.0 | king shelters: Holy Light 4 squares +1.10; Mercy 8 vs 4 +1.96 | analogue [A7] |
| (1b) New pawn | +0.5 × 2 × P(event): first take 0.6, each take 1, enemy half 0.35 | 0.5 | prior | [A9] |
| (1b) **Cannot move** | **− min(0.4·W, 0.7 × share × W)**. It still attacks and blocks (§3.1), so it keeps part of its worth, and the discount is capped at 40%. Shares: **before move N: max(0, N − 6) / 45** (a back-rank piece often waits about 6 moves anyway); **next to an enemy: 0.15 for a piece whose reach is over 1** (a long-range piece is seldom next to an enemy unless it chooses to be), 0.5 otherwise; zones as §6.5. | 0.5 | — | [A11] |

Examples of the new prices (`adv-v2.mjs`): a queen that cannot move next to an enemy reads 8.35 (it read 4.66, fair). Knight + rook lines that cannot move before move 20 reads 7.91 (it read 5.3). A queen that cannot move before move 10 reads 8.74. All three are likely overpowered.

### 6.5 When shares (state rules)

| When | Share | Basis |
|---|---|---|
| always | 1 | — |
| start rank, own half, enemy half, last rank, capital | 0.25 · 0.65 · 0.35 · 0.05 · 0.05 | the templar used the capital in 4–8% of its moves (MATRIX:79) [A12] |
| next to … | 0.5 | [A12] |
| from move N / before move N | 1 − N/45 / N/45 (for Cannot move: §6.4) | a side makes about 45 moves (pv2-d3: 86–99 plies) [A12] |
| after its first capture | 0.5 | [A12] |
| after the opponent's card | **0.1, always** | a side plays about 4.4 cards a game (cards m2). The judge always assumes a card game, so the verdict does not depend on options. Flag F7 says "Works only in card games." |

### 6.6 Band (95%)

half-band = √(0.35² + Σ term_err² + extrapolation²)

- **0.35** is the model error (the leave-one-out residuals of N, B and R and the held-out archers).
- **Extrapolation** adds: 0.25 for each take square beyond 7; 0.3 for each open shot beyond 8.3; 0.4 for each quiet square outside 3–7.5; 0.5 when any rule has a When other than "always" or an event.
- **Shown as** "About 5½ pawns (5 to 6)". The fuzz pill on the gauge spans lo..hi.

### 6.7 Measured designs (anchors) and the like line

**The number is always the formula.** The critic showed that switching between a measured value and the formula breaks the monotone rule (Templar: anchor 2.15, formula 2.74; removing its rule *raised* the worth) and the badges (Beast: one added square lowered the number). So:

- `src/workshop/anchors.ts` maps a canonical form (§3.4) to `{ value, pm, era, source }`.
- A design that equals an anchor shows a note on the stage and in Why?: "Measured in computer games: 4.27 ± 0.29."
- **The label** of a design that equals an anchor comes from the measurement (§6.9 rules on the measured value and band). The number, the badges and the metal still come from the formula. Example: the Paladin's formula band (2.0–6.2) would say "untested shape", but it was measured fair, so it shows Fair.
- **Era A** comes first (pv2-d3, 2026-10-04/05), then the era A lab readings, then era B (2026-09-17). Era C and D numbers are never anchors.
- **The Maester preset is not an anchor.** The measured piece has the long swap with the king, which the Workshop leaves out. Why? notes "Measured with the long swap: 3.28 ± 0.27."

| Anchor (note only) | Value | Source |
|---|---|---|
| Pawn | 1.00 | the unit |
| Knight | 3.16 | `eval.ts:60` (the Texel price) |
| Bishop | 3.17 ± 0.27 | `piece-runs-2026-10-04-pv2-d3.md:32` |
| Rook | 3.84 ± 0.27 | pv2-d3 :31 |
| Queen | 9.33 | `eval.ts:60` |
| Ogre | 2.60 ± 0.28 | pv2-d3 :30 |
| Beast | 4.27 ± 0.29 | pv2-d3 :35 |
| Guard | < 1.66 (shown "under 1.7") | pv2-d3 :33 |
| Archer today | 4.29 ± 0.35 (4.11 and 4.46) | `…-pv2-A-vsR-d3.md:24`; `claude/archer-reach` |
| Archer `far2` | 2.83 ± 0.28 | TASKS.md:9 |
| Archer `fwd2NoSide` · `fwd2NoBack` | 3.99 ± 0.28 · 4.34 ± 0.28 | `claude/archer-reach` |
| Archer classic | 3.73 ± 0.42 | era B |
| Paladin · Reaver (straight step) · Templar | 4.08 ± 0.45 · 4.04 ± 0.56 · 2.15 ± 0.53 | era B |
| Beast 7 neighbours · diagonals | 3.77 ± 0.43 · 1.81 ± 0.42 | era B |

**The like line**
- It compares the worth with the **formula values of the pool presets** (the same scale as the gauge): within 0.4 → "About as strong as a {piece}."; otherwise "Between a {lower} and a {higher}."
- Above 5.0 it says "More than any pool piece but the queen."; at 7.5 or more, "About a queen."
- When several pieces are within 0.4, it names the one that shares the most parts. A shared rule counts 2; a shared square group or line set counts 1.
- **Auto look** (Blank only) uses the same part count, without the worth. A tie goes to the knight.
- **The gauge landmarks** (tablet and desktop) also use the formula values: P 1.03, N 3.28, R 3.96, Q 9.32.

### 6.8 The card estimator (build 1b)

**W = max(0, (base(verb, pills) + Σ modifiers) × Π gates × play factor)**

band = √(σ_base² + Σ σ_mod² + 0.3²), widened by ±0.15·W for any play factor other than "any time".

- Card worths are one card held on one side against no card, at depth 3, in card pawns at **64 Elo a pawn** (`docs/research/cards-2026-10-03.md:369`). Piece pawns are 70 Elo (`piece-runs-2026-10-04-pv2-d3.md:37`). The two gauges are separate, so they need no conversion. Only the Change verb uses piece values; it multiplies them by 70/64.
- A pill setting that equals a measured card **is** its base, so the number is the measured value. (For cards the base table is the formula, so there is no switch.)
- **One yardstick per card.** Freeze uses measurement 5's 1.39 (`:383`), not the mean with measurement 1's 1.7 (`:69`). Cards measured only in m1 (Haste, Strike, Flight, Sacrifice, Leap, Ice Wall, March) keep m1's value. The doc itself compares the two (Rage is "about 1.7 Haste", `:391`), and on Freeze they differ by 0.3, inside the error [A13].

| Verb · pill setting | Base (card pawns) | ± | Anchor or basis |
|---|---|---|---|
| Freeze · any enemy, 1 turn, then move | **1.39** | 0.41 | Freeze (m5) |
| Freeze · an enemy piece / an enemy pawn | ×0.9 / ×0.4 | — | [A13] |
| Shield · one, 1 turn, then move | **0.6** | 0.4 | Ice Wall |
| Shield · all | **2.28** | 0.43 | Firewall |
| Freeze or Shield · 2 turns | ×1.5 | 0.5 | `markTurns: 2` was never measured [A13] |
| Freeze or Shield · "This is your move" | **worth 0** | 0.5 | Freeze as the whole turn scored 40.6% against no power, below even; free, 73.4% (`kings-powers-balance-2026-10-02.md:172`). A card is optional to play, so it is never below 0. [A19] |
| Move again · same, none take | **2.3** | 0.5 | Haste |
| Move again · same, may take / second must take | **4.06** / **3.97** | 0.55 / 0.53 | Rage / RageB |
| Move again · a different piece, none take / may take | 2.3 / 3.9 | 0.8 / 1.0 | Rally prior (`rally-r1` ran and is unread, TASKS.md:12) |
| Move as · queen, empty square | **1.9** | 0.4 | Strike |
| Move as · queen, may take | 3.5 | 0.6 | Strike + capture (+1.6: the Haste → Rage gap 1.76 and the Strike power pair 1.49) |
| Move as · rook / bishop / knight | 1.5 / 1.2 / 1.1 | 0.5 | [A13] |
| Move as · own type / a friend next to it, may take | **1.1** / **2.49** | 0.4 / 0.48 | Mimic / Control |
| Move as · pawn 2 ahead from any rank | **0.5** | 0.4 | March |
| Move to · own half / next to your king / anywhere | **1.5** / 1.0 / 2.5 | 0.4 / 0.6 / 0.8 | Flight / [A13] |
| Jump · own pawns / one piece | **1.1** / **1.5** | 0.4 | Leap / Vault |
| Take · capital / back rank / anywhere | **1.64** / **1.61** / 3.5 | 0.4 / 0.41 / 0.6 | Burn / Fire Starter / Strike + capture |
| Push · enemy steps / around a square / around your piece | **0.3** / **1.17** / **0.68** | 0.4 | Curse / Earth Quake / Earth Quake B |
| Swap · two of yours / you and an enemy next to it | **1.2** / **1.02** | 0.4 / 0.36 | Sky Lift / Firewall B |
| Bring back · first rank / in place of a pawn | **0.71** / **1.2** | 0.4 | Salvation / Sacrifice |
| New pawn · 1 or 2, start rank / next to king | 0.5 / 1.0 / 0.6 / 1.1 | 0.4 / 0.6 / 0.5 / 0.7 | prior [A9]; Spawn is unmeasured |
| Change · pool / pool, not a queen / R, B or N | **2.95** / 0.96 / 0.79 | ±50% | 0.36 × (best target − E[weakest own piece] 1.83) × 70/64; best targets queen 9.33, beast 4.27, rook 3.84. 0.36 is Sacrifice's realisation (1.2 measured for a +3.3 median swing) [A14]. Replace these when `morph-a1` is read. |
| Copy · last card / another card in hand | **≈ 0** / **4.06** | 0.45 / 0.8 | Mirror (+0.33 ± 0.42 added) / MirrorB: "its worth is the best other card's, so beside a Rage it is a second Rage" (`cards-2026-10-03.md:388-389`). Priced as the best card in the deck, Rage. |
| Draw · as the move / free | **1.09** / **0.84** | 0.37 / 0.39 | Growth / GrowthB |

**Play factors: the chance that the card is ever playable** (none is measured; MATRIX:132 "every row below is none") [A15]. A one-use card needs one window only, and most cards are played late anyway (median ply 46–56, `cards-2026-10-03.md`, "Most cards get played", :114).
- any time 1;
- from move 5, 10 or 15: 1; from move 20: 0.95. Replace with the `haste-from10` run (TASKS.md:13);
- after you lose a piece: 0.95 (a piece is lost in nearly every game);
- after the opponent's card: 0.9 (in a 6-card game);
- fewer pieces than the opponent: 0.7.

So a condition costs little, and Why? says so: "This condition costs little: most games reach it." Rage after a loss reads 3.86, Rage with fewer pieces 2.84 (fair, but F6 warns), Rage after the opponent's card 3.65.

### 6.9 Thresholds and labels

All the lines live in one `THRESHOLDS` constant, so the owner can move them.

| | Possibly too weak | Fair | Possibly overpowered | Untested shape |
|---|---|---|---|---|
| Piece | point < 2.5 | 2.5–5.0 | point > 5.0 | point ≤ 5.0, hi > 5.5 and half-band ≥ 1.0 |
| Card | point < 0.7 ("may feel like a dud", `cards-2026-10-03.md:84`) | 0.7–3.0 | point > 3.0 (Rage, "the one overpowered card", `:391`) | point ≤ 3.0, hi > 3.5 and half-band ≥ 0.6 |

- **Why 5.0 and not 5.5.** Criterion 1 (`docs/research/piece-balance-criteria-2026-10-03.md:15`) sets 5.5. The strongest pool piece but the queen is the Beast at 4.27, and the judge reads fast pieces low (§6.14.1). So the Workshop warns 0.5 earlier. The owner can set it back. ★2
- **"Likely"** replaces "Possibly" when the whole band is past the line (lo > 5.0, or hi < 2.5). This is the PASS / pass? rule of the criteria file.
- **Untested shape.** A wide band that reaches well past the line gets the label "Possibly overpowered: an untested shape" and the dashed cracks. The judge warns where it knows least. (Before this fix, a wide band gave "unsure" and no chip, so odd designs got no warning at all.)
- At 7.5 or more, the piece line says "about a queen".
- **The untouched Pawn and Queen presets** show their own line and no chip: "A pawn: the unit of worth." and "The queen: the one piece above the band. Only the queen stands here." Any change to them follows the normal rule.

### 6.10 Risk flags (separate from worth)

Each flag fires on a rule that has a mechanism, and each one cites its evidence.

| Code | Fires when | Level | Line | Evidence |
|---|---|---|---|---|
| F1 Draws | cannot be taken by all but a king · takes nothing · guards neighbours · Shield all for 2 turns · swap with a friend (info only) | warn (swap: info) | "May lead to more draws: only a king can take it, like the Guard." | guard +3.2 draws in an army, two guards +8.8; maester +3.1 [+1.5, +4.6] (pa-r1) |
| F2 Takes very often | ≥ 4 open shots, or a capture-rate proxy > 1.5× the average piece | warn | "Takes very often, like the Archer. Games may end fast and one-sided." | proxy: 0.18 a shot + 0.8 for a shooter; 0.09 a far take + 0.2; 0.08 a step take (0.165 with a chain). It reads today's archer 2.09× (measured 2.11×) and `far2` 1.54× (measured 1.54×). Criterion 2. |
| F3 Checks through pieces | a shot at distance ≥ 2 | info | "Its shots pass over pieces, so a check cannot be blocked." | RULES §3; `fairy-values.md` S15 |
| F6 Hard to answer | a card: **any extra move that takes, whatever its condition** · Take anywhere · Change with a queen allowed · Copy another card in hand · (1b) guards neighbours from all but pawns on a piece that takes | warn | "Hard to answer: it gives an extra move that takes." | Rage; `fairy-values.md:48-50` |
| F7 May sit idle | M < 3 · every ability behind a 0.05 zone · (1b) cannot move with a share ≥ 0.4 · a card with a zone target · **any "after the opponent's card" When ("Works only in card games.")** | warn | "May often wait: it needs an enemy in the capital." | catapult never fired in 38–52%; Burn played in 50%, Fire Starter in 40% (`cards-2026-10-03.md:379-380`); guard moved in 70–80% (criterion 5) |
| F8 No fair price found | lines pass over any piece · (1b) steps 1 any way after a take | warn | "The lab never found a fair price for this." | paladin over enemies (`sim-lm-buffs`); reaver all 8 (no fixed point) |
| F9 Never measured | any term marked unmeasured, or any [A] base | info | "Never measured: play-test it." | §6.4, §6.8 status columns |
| F10 Set aside before | lines over any piece (Wraith) | warn | "The owner set a piece like this aside: it moves through pieces." | MATRIX A.3 :81-84 |
| **F11 Moves very far** | Q > 8 (more quiet squares than any measured piece) | warn | "It moves to more squares than any piece we measured." | no measured piece has Q > 7.33 |
| **F12 Becomes a queen fast** | "becomes" a queen (or a choice that includes the queen) on the first take, or on the last rank with a forward reach over 1 | warn | "It can become a queen early in the game." | the pawn needs about 6 moves to promote; a knight about 3 |
| F+ Fewer draws | open shots · takes again · Move again · a card that may take | good | "May mean fewer draws." | archer −6.2, beast −3.1, Haste and Rage −10 |

- Calibration: on today's pool only the Archer (F2) and the Guard (F1, weak) warn. These are the two criteria the pool fails today (balance report §7).
- F4 and F5 are not used. F4 (stall) folds into F1, F6 and H2b. F5 (loops) needs card answers in play, so it waits for build 3.

### 6.11 Complexity: "hard to remember"

**Points** are counted from the stored design. Parts that a chess player knows are cheap.

| Part | Points |
|---|---|
| Squares or lines a chess player knows (king step, knight, bishop / rook / queen lines; the pawn with its double step and promotion) | 0.5 |
| Any other square group (one group with one mark), or another set of lines | 1 each |
| Moves and takes on different squares (shots and "takes nothing" count) | +1 |
| Direction matters | +0.5, once |
| Each rule | +1 |
| Its When: a zone, next to, from or before move N / after its first capture / after the opponent's card | +1 / +1.5 / +2.5 |
| A built-in exception ("(not a king)" on Takes again, "a piece, not a pawn") | +1.5 |
| It names a piece ("cannot take a king", "becomes an archer", "next to your beast") | +0.5 |
| Card: the verb | 1 |
| Card: an exception in a pill or the fixed words ("not a pawn", "the second move must take", "not a queen", "never a second beast"); "not the king" is a game rule and is free | +1.5 each |
| Card: Play it: from move N, fewer pieces / after a loss / after the opponent's card | +1 / +1.5 / +2.5 |

**Levels** (as in `tools/rule-simplicity.ts`):

| Points | Learn line |
|---|---|
| ≤ 2 | Easy to learn |
| 2.5–3.5 | One thing to learn |
| 4–5 | Needs a picture |
| ≥ 5.5 | **Possibly hard to remember** (a warn chip) |

**Calibration** (prototype counts): pool pieces knight, bishop, rook, queen, pawn 0.5 · maester and ogre 1.5 · guard 2.5 · beast 3.0 · archer 5.0 (`far2` 4.0); none warns. Paladin 5.5 warns. The owner-rejected beast with the 7-neighbour blind spot (`tools/rule-simplicity.ts:28-29`) 6.5 warns. Cards: Freeze, Haste, Rage 1.0 · RageB, Strike 2.5 · Morph 4.0 · MorphB 5.5 (warns).

The count cannot see taste. The owner rejected Haste H3 as "too cumbersome" at 4.5 points (TASKS.md:330), and the Archer `over23` too.

**Pull its weight** (AGENTS.md: "All things being equal or near equal, do not change or add rules"). For each rule, the judge computes W without it. If |ΔW| < 0.3 pawn (cards: 0.25) and no flag changes, Why? shows: "This rule changes little (about ±0.2 pawn). Simpler without it?" This is an info line, not a chip. Example: the ogre's push.

### 6.12 Text: the line, Why?, the fixes, the badges, the stats

**The line** (≤ 90 characters, one number at most, rounded to halves). Priority: a hard limit, then likely OP, possibly OP, untested shape, a warn flag, weak, memory, and fair last.

| Case | Template | Example |
|---|---|---|
| Limit | "Not allowed: {reason}." | "Not allowed: nothing may move or take a king." |
| OP | "{Possibly / Likely} overpowered: about {W} pawns, {like}." | "Possibly overpowered: about 5½ pawns, more than any pool piece but the queen." |
| Untested | "Possibly overpowered: an untested shape, about {lo} to {hi} pawns." | "Possibly overpowered: an untested shape, about 3½ to 6½ pawns." |
| Flag | "{flag line}" | "May lead to more draws: only a king can take it, like the Guard." |
| Weak | "Possibly too weak: about {W} pawns; {cause}." | "Possibly too weak: about half a pawn; it waits for your opponent's card." |
| Memory | "Possibly hard to remember: {n} rules and {m} exceptions." | — |
| Fair | "Fair: about {W} pawns. {like}" | "Fair: about 4½ pawns. About as strong as a beast." |

**Why? reasons:** the 3 largest terms, each as a plain sentence:
- lines or far takes: "Its lines reach far: it can take on about {X_far} squares; a rook, about 7."
- shots: "It shoots without moving on about {X_shot} squares."
- the take hinge: "Past 7 take squares, each one counts double. Only the queen stands there."
- the mobility hinge: "It moves to about {Q} squares. Past 8, each one counts much more."
- a rule term: "{rule title}: {±v}."
- a When share: "{When}: it counts about {share×100}% of the time."

**Fixes**
- The judge tries each single removal: a rule, a square group, a line group.
- It offers at most two that bring the point inside the band, the smallest change first.
- It never adds, so a fix never adds memory.

**Rule-book badges.** For each row: judge(design + the rule with its default pills) − judge(design), rounded to halves. "?" when the term is unmeasured, "--" when the row cannot work. Because the number is always the formula, a badge always equals the change the player then sees. Cost: 10–15 rows × 1 call, plus about 17 calls for the fixes; under 40 ms on a phone [A16].

**Stats dots** (empty-board counts, matching the floor):
- **Moves** from M: 1 = ≤ 2 · 2 = ≤ 5.5 · 3 = ≤ 9 · 4 = ≤ 15 · 5 = > 15.
- **Takes** from the empty-board take squares (a shot counts 1), with the same steps.
- Examples: knight 2 · 2, rook 4 · 4, queen 5 · 5, archer 3 · 3.

### 6.13 The judge on today's pieces and cards (`judge-v2.mjs`)

**Pieces.** "Shows" is the formula, which is what the player sees. "In fit" means the coefficient was fitted on that piece; "held out" means it was not.

| Design | Shows (band) | Measured (note) | Label | Metal | Flags | Memory | Basis |
|---|---|---|---|---|---|---|---|
| Pawn | 1.03 (0–2.2) | 1.00 | the preset's own line | stone | — | 0.5 | P(last rank) set from it |
| Knight | 3.28 (2.9–3.6) | 3.16 | fair | silver | — | 0.5 | in fit |
| Bishop | 3.04 (2.7–3.4) | 3.17 ± 0.27 | fair | silver | — | 0.5 | in fit |
| Rook | 3.96 (3.6–4.3) | 3.84 ± 0.27 | fair | gold | — | 0.5 | in fit |
| Queen | 9.32 (8.0–10.7) | 9.33 | the preset's own line | broken | — | 0.5 | hinge set from it |
| Archer today | 4.47 (4.1–4.8) | 4.29 ± 0.35 | fair | gold | F2 (2.09×), F3, F+ | 5.0 | held out |
| Archer `far2` | 2.89 (2.5–3.2) | 2.83 ± 0.28 | fair | bronze | F2 (1.54×), F3 | 4.0 | held out |
| Archer `fwd2NoSide` · `fwd2NoBack` · classic | 3.65 · 4.02 · 3.84 | 3.99 · 4.34 · 3.73 | fair | gold | F2 | 5.0 · 5.0 · 3.5 | held out |
| Beast | 4.08 (3.5–4.7) | 4.27 ± 0.29 | fair | gold | F+ | 3.0 | in fit |
| Beast, 7 neighbours | 3.65 (3.0–4.3) | 3.77 ± 0.43 | fair | gold | — | 6.5 (hard) | in fit |
| Beast, diagonals | 2.38 (1.8–3.0) | 1.81 ± 0.42 | likely weak (from the measurement) | stone | — | 5.0 | in fit |
| Maester (no long swap; not an anchor) | 3.28 (2.8–3.8) | 3.28 ± 0.27 with the long swap | fair | silver | F1 info | 1.5 | in fit |
| Ogre | 2.58 (2.0–3.2) | 2.60 ± 0.28 | fair | bronze | — | 1.5 | in fit |
| Guard | 0.88 (0–1.9) | < 1.66 | likely too weak | stone | F1 | 2.5 | held out |
| Paladin | 4.11 (2.0–6.2) | 4.08 ± 0.45 | fair (from the measurement; the formula alone says "untested shape") | gold | F9 | 5.5 (hard) | in fit |
| Reaver (straight step, 1b) | 4.18 (3.5–4.9) | 4.04 ± 0.56 | fair | gold | — | 1.5 | in fit |
| Templar | 2.74 (2.1–3.4) | 2.15 ± 0.53 | possibly weak (from the measurement) | bronze | F7 | 2.5 | **held out: +0.59** |

**Player-style designs** (`judge-v2.mjs`, `adv-v2.mjs`; none is measured):

| Design | Estimate (band) | Label | Flags | Memory | Like line |
|---|---|---|---|---|---|
| Hungry Rider (knight + takes again) | 4.48 (3.9–5.1) | fair | F+ | 3.0 | About as strong as a beast. |
| Rook + takes again (Wide Rook) | 5.55 (4.9–6.2) | possibly OP | F+ | 3.0 | More than any pool piece but the queen. |
| … + lines pass over own pieces | 5.85 (4.7–7.0) | possibly OP | F9, F+ | 4.0 | — |
| … + cannot take a king | 4.85 (3.4–6.3) | untested shape | F9 | 5.5 (hard) | — |
| Mix Knight + Rook (knight + like a rook in the enemy half) | 4.95 (4.3–5.6) | fair, hairline | F9 | 2.5 | About as strong as a beast. |
| Mix Rook + Knight (rook + like a knight in the enemy half) | 5.89 (5.1–6.7) | likely OP | F9 | 2.5 | — |
| Knight with rook lines painted (no rule) | 10.11 (8.6–11.7) | likely OP | F11 | 1.0 | About a queen. |
| Archer `plusDiag2` (12 shots) | 5.54 (5.1–6.0) | likely OP | F2, F3 | 4.5 | era B measured > 4.66 ✓ |
| Archer `ring2` (20 shots) | 10.5 (8.2–12.8) | likely OP | F2, F3 | 5.5 | — |
| 48 squares within 3, king-step takes | 13.87 (5.2–22.6) | likely OP | F11 | — | — |
| 5 × 5 leaper, king-step takes | 7.49 (3.7–11.3) | possibly OP | F11 | — | — |
| King-step + like a queen from move 5 | 8.13 (6.6–9.7) | likely OP | F11 | 2.5 | — |
| King-step + like a queen next to your king | 5.36 (4.5–6.3) | possibly OP | F11 | 2.5 | — |
| King-step + like a queen in the capital | 2.74 (2.1–3.4) | fair | — | 2.5 | the Templar shape |
| King-step + like a queen after the opponent's card | 2.95 (2.3–3.6) | fair | F7 | 4.0 | — |
| King-step + becomes a queen on its first take | 6.63 (2.6–10.7) | possibly OP | F12 | 2.0 | — |
| Knight + becomes a queen on the last rank | 5.70 (3.3–8.2) | possibly OP | F12 | 2.0 | — |
| Rook + becomes a queen on the last rank | 8.79 (4.0–13.6) | possibly OP | F12 | 2.0 | — |
| King-step + guards neighbours from all but pawns (1b) | 3.68 (2.6–4.7) | fair | F1, F6 | 1.5 | — |
| Knight + only a king can take it | **blocked (H2b)** | — | — | — | — |
| King-step + becomes a queen in the capital | **blocked (H12)** | — | — | — | — |
| (1b) Knight + steps 1 any way after a take | 5.18 (3.6–6.7) | possibly OP | **F8** | 1.5 | the lab found no fixed point ✓ |
| (1b) Queen that cannot move next to an enemy | 8.35 (6.8–9.9) | likely OP | — | 2.5 | — |
| (1b) Knight + rook lines, cannot move before move 20 | 7.91 (6.2–9.6) | likely OP | F11 | 3.0 | — |
| Squire (king step; after its first capture, also like a knight) | 5.66 (4.6–6.7) | possibly OP | F9, F11 | 3.0 | — |

**Cards (1b).** "LOO" (leave one out) means the estimate does not use that card's own measurement. It checks the base table; the player sees the base.

| Card | Shows | LOO estimate (how) | Label | Flags | Memory |
|---|---|---|---|---|---|
| Rage | 4.06 ± 0.55 | 3.79 (Haste 2.3 + the Strike pair 1.49) | likely OP ✓ | F6, F+ | 1.0 |
| RageB | 3.97 ± 0.53 | 3.79 | likely OP ✓ | F6 | 2.5 |
| Control | 2.49 ± 0.48 | 2.03 (Mimic 1.1 + 1.6, × tag team 0.75) | fair ✓ | — | 2.5 |
| Fire Starter | 1.61 ± 0.41 | 1.68 ((1.9 + 1.6) × the Burn gate 0.48) | fair ✓ | F7 | 2.5 |
| Firewall | 2.28 ± 0.43 | 1.8 (Ice Wall × 3) | fair ✓ | F9 | 1.0 |
| Mirror | ≈ 0 | 0.6 (prior) | possibly too weak ✓ | F7 | 1.0 |
| MirrorB (Copy another card in hand) | 4.06 ± 0.8 | — | possibly OP | F6 | 1.0 |
| Long Winter (Freeze, 2 turns, from move 10) | 1.39 × 1.5 × 1.0 = 2.09 | — | fair | F9 | 2.0 |
| Freeze as the whole turn | 0 | — | likely too weak | — | 1.0 |
| Strike that may take | 3.5 | — | possibly OP | F6 | 2.5 |
| Rage, only after you lose a piece | 4.06 × 0.95 = 3.86 | — | possibly OP | F6 | 2.5 |
| Rage, only with fewer pieces | 4.06 × 0.7 = 2.84 | — | fair | F6 | 2.5 |
| Rally | 2.3 | — | fair | F9 | 1.0 |
| **Morph** (pool, a queen allowed) | 2.95 (1.5–4.4) | queued (`morph-a1`) | untested shape | F6, F9 | 4.0 |
| **MorphB** (no queen) | 0.96 (0.5–1.4) | queued | fair | F9 | **5.5 (hard)** |
| Morph R/B/N | 0.79 (0.4–1.2) | — | fair / weak edge | F9 | 2.5 |
| Spawn · Spawn2 · SpawnK | 0.5 · 1.0 · 0.6 | — | possibly weak · fair · possibly weak | F9 | 1.0 |

### 6.14 Where the judge is weak (the UI says "about" and "possibly")

1. **Quiet squares.** The cross-section gives 0.12 a square, and the one pair gives 0.51. Fast movers may read low below the hinge. This is why the line is 5.0.
2. **Few points.** Only N, B and R were measured by a swap, and the queen is a Texel price. The mobility hinge rests on no measurement [A18].
3. **Combinations do not add up.** Blind, the judge reads the paladin at 7.2, and it measured 4.08.
4. **Zones.** The templar reads 0.59 high.
5. **Screened shots (out of build 1).** No single weight fits the four readings (`screen.mjs`): with weight 0, `over23` reads 0.88 against a measured 3.0 ± 0.27 (TASKS.md:8); with 0.49, `nearOver2` reads 3.18 against 2.39; `over2`'s fixed point (0.83) and first pass (1.94) differ by more than a pawn. Refit on all four, with a distance term, before screens enter.
6. **No worth exists** for: zones, tag team, turn N, shackles, promotion of non-pawns, new pawns, "after a card", Rally, Spawn, Morph, two-turn marks, and every play factor.
7. **Scale.** All numbers are depth-3 self-play. Elo per pawn runs from 64 to 92 (±15–25%), and single-pass lab readings can be off by about 1 pawn.

---

## 7. Scope and phases

### 7.1 Build 1a: the piece Workshop (no engine change, no new art)

**In build 1a**
- The entry points (§2.1) and the screens W1–W10 and W15, at the sizes of §2.3.
- Pieces: the Moves, Rules and Look tabs; the 10 rule blocks of §4.2; the When sheets; Mix two; Surprise me; names; Undo.
- The judge for pieces (§6.1–6.7, §6.9–6.13), with its anchor notes, flags, memory score, line, Why? and fixes.
- The still model (§5.1, §5.2, §5.4).
- Sound through the existing `snd`.
- Try it: the DOM sandbox driven by `moves.ts`.
- Save on the device, the share link, Copy as text.
- **In parallel:** the Set A motion preview page (§5.5) for the owner. If approved, A1–A5 ship in 1a.

### 7.2 Build 1b: cards and five more rules

- The card door, W11–W14, the card model (§5.3), the card judge (§6.8), the Then tab, A6.
- The 5 rule blocks of §4.2 "Build 1b", with their props and flags.

**Not in build 1** (1a or 1b): real games with a design (build 2); card play of any kind, because card mode has no in-game UI (`main.ts` never reads `Rules.hands`); cloud sync, galleries, ratings; king powers as a design; screened shots, lines of limited length, reserves.

**Rule:** build 1 adds no code path to the engine, the AI or the save. `moves.ts` is for Try it only.

### 7.3 Build 2: play a design in a real game (engine work; it needs its own owner go)

**The type slot.** All 15 type values are used (`engine.ts:19-23`). Two options:

| Option | How | Cost |
|---|---|---|
| **A (recommended for build 2)** | Reuse T as "the Workshop piece" when `RULES.workshop` is set. **T is a live lab generator today** (the Templar: a king step, a queen on the capital, `engine.ts:798-805`; paused and rejected, MATRIX:79). With `RULES.workshop` set, `case T` calls `genWorkshop(spec)` instead, so a Workshop game cannot also hold a Templar. One design per game, the same for both armies. | small: no change to the byte layout |
| B (later, more designs) | Bit 6 (64) of the piece byte is free: the low 4 bits are the type, bit 4 the colour, bit 5 `SPENT` (`engine.ts:42-52`). A set bit 6 means "design slot (p & 15)". | `typeOf` and every type switch, FEN, `zIndex` hashing, NNUE inputs |

**The engine seams (option A)**
- `genPieceRaw` (`engine.ts:526`): `case T` calls `genWorkshop(spec)`. It is built from `step` (:246), `leaper` (:488), `slider` (:508), `beastChain` (:468) and the existing `Move` shapes: `to === from` shots, `swap`, `shove`, `selfRemove`.
- `canCapture` (:377) reads the spec's Safe and Holding-back rules.
- `isAttacked` (:1110) gets a generic branch that runs the generator in `'attacks'` mode. A piece that cannot move still attacks (§3.1), as a frozen piece does (`engine.ts:1622`).
- `landed()` (:936) handles Becomes, and the `SPENT`-style bit handles "after its first capture".
- **Evaluation.** `VALUES[T] = 100 × W` (the judge's point). **The templar does not have a zero piece-square table:** it has `TEMPLAR_ON_CAPITAL = 120` (`eval.ts:94`, used at `:382`), and with a zero bonus the search never went to the capital (4% of its moves, MATRIX:79). So build 2 derives a zone bonus from the design: for each state rule with a zone When, the zone's squares get 100 × ½ × (W with the rule always on − W without it) centipawns, capped at 150 [A20]. Without it, every zone design plays weak in games.
- **The AI worker** gets the spec with the rules (`src/ai/worker.ts:18-21`), and the save stores it with `rules` (`main.ts:1166`).
- **FEN and the net.** FEN still writes "T", and in a Workshop game it means the design (the save carries the spec). If the NNUE has inputs for T, they were trained on the Templar, so Workshop games use the `linear` evaluator (`eval.ts:417-422`) [A21].

**Tests**
- **Oracle tests:** `genWorkshop(preset)` must equal `genPiece` for each pool piece on random boards, and `moves.ts` must equal both. Add `crossCheckAttacks` and `legality.test.ts` cases.
- **Toggles off:** on 20,000 random boards, the moves are the same as before the change (the repo's standard).

**Where it enters a game.** New game › More options › "Use a design" puts one saved design in place of one pool letter, for both armies. The design's warning shows on the New game screen (§4.9). A test drive against the computer reuses the lesson sandbox (`startLesson()`, `main.ts:628-664`), which keeps the autosave clean.

### 7.4 Build 3: cards in play

- **A card-mode UI:** a hand panel. None exists today.
- **Data-driven card families:** each verb is one `PowerTag` with a spec index. New cards are appended to `ALL_CARDS`, because the hash order is append-only (`rules.ts:166`). Answers to cards read `last` (`engine.ts:1023`).
- Card Try it, with one fixed scene per verb.

### 7.5 Later

- **Measurement loop.** The owner picks designs. They run with `run.ts --experiment values` and `tools/piece-activity.ts` on Kaggle or the M1, with the owner's go, and become anchors. Refit the coefficients (the mobility hinge first) after about 5 new anchors. An on-phone "quick test" is **not** recommended: 60 games give about ±1.2 pawns, no sharper than the judge.
- King powers as a third door: the C.1 schema plus "always-on". The judge uses the power report's increments: a second use +1.0, captures +1.5–1.7, reach +1.35.
- Screened shots (after the refit of §6.14), and lines of limited length.
- Motion Set B after approval.
- New art through Codex image_gen on the owner's plan only: a backdrop, a painted plinth, card ornaments, a neutral figure for Blank, a portrait card back, Morph and Spawn art.
- Do not ship the 2014 card art; its licence is not confirmed.
- No paper doll without the owner's consent: the owner rejected the rigged Archer on 2026-09-25.

### 7.6 Saving and sharing

| Where | Build | What |
|---|---|---|
| Device | 1a | `kingdown.workshop` (§3.4) |
| Link | 1a | `?design=` (§3.4). The verdict is recomputed on open. |
| Copy as text | 1a | the sentences; a MATRIX-style row (the name, piece or card, each part with its MATRIX row, the judge's worth and band); and the share code |
| Cloud | later | Migration `supabase/migrations/0002_designs.sql`: a `designs jsonb` column with a 64 KB size check, the `{at}` stamp constraint, a branch in `keep_newer_sections`, and grants. Add `'designs'` to `SECTIONS` (`src/account/sync.ts:6`), give `readLocal` and `writeLocal` a branch, and merge by design id (a union where the newer `updated` wins for each id, with deletions as `{id, deleted: true, updated}`). Also the select lists in `src/account/client.ts:43, 49`, the account blurb (`account.ts:51`), and `public/privacy.html`. The owner applies migrations by hand (`supabase/README.md`). |
| Public gallery | not planned | it needs new tables, moderation and RLS |

---

## 8. Files, tests and checks

### 8.1 New files (all in one lazy chunk)

| File | Role |
|---|---|
| `src/workshop/vocab.ts` | the one table of blocks: rule blocks, Whens, verbs and pills, MATRIX refs, defaults, judge keys, "seen on", build (1a/1b), Try-it support, text templates |
| `src/workshop/model.ts` | types, presets (11 pieces; 25 cards in 1b), Mix two, the "Paint on" expansion, the canonical form, `validate()` (hard limits), `parseDesign` / `designCode` |
| `src/workshop/text.ts` | `describe()` (§4.10) |
| `src/workshop/judge.ts` | features (the weighted union), the estimators, flags, memory, the line, Why?, fixes, badges, stats; `THRESHOLDS` |
| `src/workshop/anchors.ts` | the measured anchors (notes and labels), each with its source path |
| `src/workshop/moves.ts` | `movesOf(design, board, from, state)` for Try it; the oracle for build 2 |
| `src/workshop/names.ts` | names and rolls |
| `src/workshop/look.ts` | `lookOf(design, verdict)`, the pure stage state (body, metal, props, rim, floor marks) |
| `src/workshop/art.ts` | SVG and HTML strings: floor, plinth, gauge, card frame, scenes, the pattern picture |
| `src/workshop/store.ts` | localStorage, 50 designs, `try/catch` |
| `src/workshop/dialog.ts` | `workshopDialog()` → `{ open({ from }), openDesign(code) }`, in the `newGameDialog` style (`src/new-game.ts:93`) |
| `src/workshop/sandbox.ts` | the Try it board |
| `src/workshop/workshop.css` | imported by `dialog.ts`, so it lands in the chunk |
| `src/workshop/*.test.ts` | Vitest (§8.4) |
| `tools/verify-workshop.mjs` | the browser check (§8.5) |
| `docs/visual-design/workshop/` | screenshots, `checks.json`, and the Set A motion preview page |

### 8.2 Files to touch

| File | Change |
|---|---|
| `index.html` | `<symbol id="i-workshop">` in the sprite (:17-29); the title button in `.title-actions` (:107-111); the Guide button under `#learn` (:226) |
| `src/main.ts` | the title button handler opens the Workshop over the title (no new `TitleChoice`); the title kings' `enabled()` also checks `#workshop[open]` (:1408-1410); `!params.has('design')` in `showTitle` (:1381) and reading `?design=`; the Guide button handler. **The keydown handler (:1313-1316):** the Escape branch runs *before* the dialog guard, so Esc in the Workshop would clear the game's selection. Move the guard above the Escape branch for `#workshop[open]`, and add `#workshop[open]` (and `#rules[open]`, the Guide, which is missing today) to the guard selector, so `z` and the arrows do not change the game behind it. |
| `src/style.css` | title-action sizing for 4 buttons (:562-564, :671-672, :685-686), only if the checks need it |
| `src/power-motion.ts` | export `SHAPE` (:21) |
| `src/account/account.ts` | export `esc` (:22), or copy it |
| `docs/visual-design/verify.mjs` | the title button checks (:196-236) for 4 buttons |
| `docs/MATRIX.md` | the two new rows of §3.3, and a one-line pointer to `vocab.ts` |
| `vite.config.ts` | nothing: the chunk stays precached for offline use. Add it to `onDemand` (:18) only if the first-visit cost must not grow [A17]. |

### 8.3 Lazy loading and size

- The first tap on Workshop (title or Guide), or a `?design=` link, runs `await import('./workshop/dialog')`.
- `main` must not grow (`docs/perf/README.md`: 2.06 MB, 14.1 s to the first move on slow 4G). Measure with `tools/measure-load.mjs`.
- No UI framework, no canvas loop, no new art. The figure crops load one at a time, about 19 KB each.

### 8.4 Unit tests (Vitest, node)

1. **Presets equal the engine.** Each preset's squares and lines expand to exactly `genPiece(board, d4, 'all')` (`engine.ts:899`) on an empty board. On 500 random boards, `movesOf` equals `genPiece` for every pool piece under the default rules.
2. **Features.** They reproduce the balance report's §3 counts to ±0.01 (§6.2 check values). A queen painted and a queen added as "always like a queen" give the same features (the union).
3. **Canonical form.** A Knight preset, a knight painted on Blank, and a knight renamed with another letter and body have the same key and get the same anchor note. A card with a missing pill and the same card with that pill at its default have the same key.
4. **Monotone.** On 1,000 random designs, **including every anchor and every design one edit from an anchor**, adding a square, a line or an ability never lowers W, and adding a flaw never raises it. Each badge equals the change that the edit then shows.
5. **Pinned numbers.** The §6.13 piece rows to ±0.01, and the card rows. Labels, flags and memory are pinned. No pool piece warns except the Archer (F2) and the Guard.
6. **Attack designs.** The rows of `adv-v2.mjs` keep their labels: none of them reads fair except the ones §6.13 marks fair.
7. **The line** is at most 90 characters. Fixes are removals, and each lands in the band.
8. **Validation.** Each hard limit H1–H12 refuses its case. `parseDesign(designCode(d))` round-trips every preset and refuses bad values, kings, oversize codes, (0, 0) and every blocked shape.
9. **Text.** The pinned preset sentences; no engineering word; every sentence ≤ 120 characters; names escaped.
10. **Vocab.** Every block cites a MATRIX row that exists: the test reads `docs/MATRIX.md` and finds the row label.
11. **Art.** The SVG strings hold no text, use unique ids and are `aria-hidden` (the pattern of `src/power-motion.test.ts`). `lookOf` table tests: Rook → gold, no seals; + takes again → cracked gold, a crimson rim and chain marks; + cannot take a king → the seal, and the metal back to gold with a hairline.
12. **Store.** It works when storage throws, keeps the cap of 50, and puts the newest first.

### 8.5 Browser checks (`tools/verify-workshop.mjs`, Playwright, against `vite preview`)

**Sizes:** 320 × 568, 375 × 667, 375 × 812, 390 × 844, 568 × 320, 768 × 1024, 1280 × 900. Touch is on for the phone sizes. **Also the Safari visible heights:** 375 × 553, 375 × 660, 390 × 700 and 568 × 270 (the viewport set to those sizes).

**Checks**
- No sideways scroll on the page or in the dialog (`scrollWidth ≤ clientWidth`).
- The piece card, estimate, footer, and complete board fit their visible areas at every size. Test both board corners against the sheet and viewport bounds, including a visible save alert.
- Every control is at least 44 px, except board cells (at least 28 px in the shortest landscape view).
- It opens from the title, from the Guide and from a `?design=` link. Back returns to the caller: the title is still open after Back. Esc closes a sheet first, then the Workshop.
- Esc, `z` and the arrow keys inside the Workshop do not change the game behind it (its selection stays).
- Focus lands on the `h2`, and the board takes arrow keys with roving `tabindex`.
- A phone shows the card first. Edit moves opens the complete board with native Action and Apply to controls.
- Knight → Rules → Add a rule → Takes again takes at most 6 actions. Then the gauge's `aria-valuenow` and the live line change.
- Rook → Add Takes again shows "Possibly overpowered", the chip, and one spoken announcement. Undo restores the state.
- Mix two › Knight + Guard shows the "Left out" toast, and the result has no immunity rule.
- Reload keeps the design. A link opens the read-only card with the same verdict. Edit → Try → Back → Undo restores the prior design on phone and desktop.
- With reduced motion, and again with `data-pace=off`, `document.getAnimations().length === 0` after each tap.
- Try it: the knight's 8 squares are marked; a chain asks "Take again / Finish".
- No page errors and no console errors.

**Then** rerun `docs/visual-design/verify.mjs` (the title at its ten sizes) and every `tools/verify-*.mjs` (LESSONS.md:27). Screenshots go to `docs/visual-design/workshop/`.

**Accessibility**
- **The board** is `role="group"`, `aria-label="Squares around the piece"`. It holds 49 buttons with labels such as "2 up, 1 right: move and take". Enter or Space paints.
- **Action and Apply to** are native labelled select controls. Each card section has its own labelled Edit button.
- **A pill** is a `<button aria-haspopup="dialog">` with a label such as "When: in the capital. Change."
- **The gauge** is `role="meter"`, with `aria-valuetext` such as "about 4½ pawns, fair".
- **The sheets** are nested dialogs, each with an `h2 tabindex=-1 autofocus`.

### 8.6 Done means

- tsc, Vitest and the build pass.
- Every check in §8.5 passes at every size, and the existing tools pass.
- The prototype's numbers in §6.13 are pinned.
- The owner has seen the screens (screenshots at 375 × 660 and 1280 × 900) and the Set A preview page.
- The two MATRIX rows are added. TASKS.md records the results.

---

## 9. Owner questions (each has a default; build 1a proceeds on the defaults)

**The owner's answers (2026-10-06): all five on the defaults.**

1. ★1 **Scope.** Build 1a is pieces only: design, judge, Try it, save on the device and a share link. Build 1b adds cards. Real games come in build 2, which reuses the Templar's slot (one design per game, both armies). *Default: yes.* **Answer: yes. Build 1a is pieces only; cards come in build 1b.**
2. ★2 **Warnings and the line.** "Warn, never block" for strength. A piece warns past **5.0** pawns (criterion 1 says 5.5); a card past 3.0. Two shapes are blocked, not warned: "only a king can take it" on a piece that takes, and "becomes" anywhere but the last rank or the first take. *Default: yes, 5.0.* **Answer: yes. The warning starts at 5 pawns.**
3. ★3 **Size of a design.** At most 3 rules a piece; one "Play it" condition a card; a reach of 3 squares; no shots that need a piece between, and no lines of limited length. *Default: yes.* **Answer: yes. At most 3 rules a piece, one condition a card, a reach of 3.**
4. ★4 **Entry points.** A fourth title button, "Workshop" (after Play), that opens over the title, and a Guide button, "Make your own piece or card". The in-game menu stays as it is. *Default: yes.* **Answer: yes. A fourth title button, "Workshop", and the Guide button.**
5. ★5 **Motion.** The Set A preview page (six motions, §5.5) is built during build 1a for your approval. If you approve it, build 1a ships with it. *Default: yes.* **Answer: yes. The owner approves the motion on a preview page during build 1a.**

The Morph questions already open in TASKS.md:14 (the Guard as a target, a second Guard, a second Beast through Salvation) set the fixed words of the Change verb (1b). The Workshop follows your answers there.

---

## 10. Assumptions

- **A1** The Change verb follows the `claude/morph-card` readings until the owner answers TASKS.md:14.
- **A2** Mirror cannot copy a Copy card.
- **A3** No stacking of extra moves.
- **A4** The figure scales from 0.94 to 1.08 with the worth.
- **A5** The bronze and silver hex values.
- **A6** iOS Safari has no Vibration API.
- **A7** Guarding neighbours is priced from the king shelters.
- **A8** Becomes: P(last rank) = min(0.9, 0.05·f³); P(first take) = 0.6.
- **A9** A new pawn is worth 0.5.
- **A10** "Cannot take pawns" −0.3.
- **A11** Cannot move: the shares, the 0.7 factor and the 40% cap.
- **A12** Zone, tag-team, turn and capture shares.
- **A13** Card bases not measured (pawn or piece targets, two-turn marks, Move as rook / bishop / knight, Move to near the king or anywhere), and no rescale between the m1 and m5 yardsticks.
- **A14** Morph's realisation of 0.36, from Sacrifice.
- **A15** Play-it factors as chances.
- **A16** Phone speed of the judge.
- **A17** The chunk stays precached.
- **A18** The mobility hinge: +0.4 a quiet square beyond 8.
- **A19** "This is your move" makes Freeze and Shield worth 0.
- **A20** Build 2's zone bonus: half the rule's always-on worth, capped at 150 cp.
- **A21** Workshop games use the `linear` evaluator.

Era B numbers sit beside era A ones in the anchors. One drift is known: the ogre read 3.18 in era B and 2.60 in era A.

---

## 11. The critic's fixes: what this revision did

| # | Fix | Result |
|---|---|---|
| 1 | Canonical form held name, letter and `from` | **Applied** (§3.4): piece `{kind, squares, lines, rules}`, card `{kind, verb, filled pills, play}`. |
| 2 | Anchor/formula switch broke monotonicity | **Applied, second option:** the number is always the formula; a measurement is a note and sets the label of an exact match (§6.7). **Rejected the first option** (a residual that fades with edits): in `judge-v2.mjs` the Templar still breaks it (removing its rule goes from 2.15 to 2.29). |
| 3 | Cheap quiet squares | **Applied:** the mobility hinge (§6.3) and F11. 48-square leaper 5.37 → 13.87; 5 × 5 leaper 3.87 → 7.49. |
| 4 | A wide band silenced the warning | **Applied:** "untested shape" (§6.9), and the Why? sheet says so. |
| 5 | Immunity priced at zero | **Applied, block option:** H2b and H2c (§4.9). The "+2 pawns" option is rejected: the judge has no data for an immune taker, and a number would look more certain than it is. |
| 6 | Shackle release | **Applied** (§6.4): it still attacks (the frozen-piece rule, `engine.ts:1622`), a 40% cap, before-move share max(0, N − 6)/45, next-to-enemy 0.15. Moved to build 1b with the block. |
| 7 | Promotion with fixed chances | **Applied, both:** H12 limits the events; P(last rank) comes from the forward reach; F12. |
| 8 | Play conditions almost always true | **Applied** (§6.8): play factors are chances; F6 on any extra move that takes. |
| 9 | "Also moves like" double-counted | **Applied** (§6.2): the weighted union. King-step + queen from move 5: 13.46 → 8.13. |
| 10 | Copy in hand gameable | **Applied:** priced as Rage, with F6. |
| 11 | Negative worth; mixed scales | **Applied** the clamp and worth 0 for the whole-turn mark [A19]. **Rejected** a global card rescale: the gauges are separate. Only Change converts (× 70/64). |
| 12 | Metals reward power creep | **Applied the third option:** gold 3.5–4.5, a hairline from 4.5, cracks past 5.0. **Rejected** "one Fair look": the owner asked for a model that reacts like an RPG character, and tiers do that. |
| 13 | Mix two is overpowered | **Applied:** first piece's moves + second piece's rules (W2). |
| 14 | Auto look surprises | **Applied:** Auto only for Blank. |
| 15 | Overloaded phone editor | **Applied:** 2 brushes + More, "Paint on" behind More, no stats or landmarks on phones, 6 Whens + More choices. |
| 16 | "Mirror" means two things | **Applied:** "Paint on". **Partly applied** for the Then tab: Mirror alone shows as a faint icon, not a text line; the tab stays, because it is the visible answer to the owner's question 1. |
| 17 | Height breakpoints used device sizes | **Applied** (§2.3): the layout reads `innerHeight`; a 156 px stage at 620–779; cells down to 32 px; checks at 553, 660, 700 and 270. |
| 18 | Motion deferred too far | **Applied** (§5.5, ★5). |
| 19 | Mark gaps; "anywhere" ambiguous | **Applied:** the tap table (W3) and the full Take sentence from `rules.ts:113-114`. |
| 20 | Build 2's "reuse T" claims | **Applied** (§7.3): T is live (`engine.ts:798-805`); `TEMPLAR_ON_CAPITAL = 120` (`eval.ts:94`); a zone bonus [A20]; FEN and net notes [A21]. |
| 21 | Card When depended on options | **Applied:** share 0.1 always, F7 "Works only in card games", no `opts`. |
| 22 | Exit and Esc | **Applied** (§2.1, §8.2): the Workshop opens over its caller, so Back has a target; the Escape branch at `main.ts:1314` gets the guard. |
| 23 | Build 1 too big | **Applied:** 1a pieces with 10 blocks; 1b cards and 5 blocks. |
| 24 | Small accuracy points | **Applied all three:** Maester is not an anchor; Freeze uses m5's 1.39 only; the piece line is 5.0. |

## 12. Build 1a: changes from this spec (2026-10-06)

Where the spec was wrong or could not be built as written, the build took the smallest sound fix:

1. **Union by worth** (§6.2): where layers overlap on a square, the square keeps its largest *worth*, not its largest weight, so no added square, line or ability lowers W (§8.4.4 holds on 1,000 designs and their one-edit neighbours). Only one prototype row changes: King-step + like a queen from move 5 shows 9.28 (was 8.13), still likely overpowered.
2. **Flaws never raise W:** "is removed after it takes" applies only above the base (0.077 + 0.123·Q); W is never below 0.
3. **Flags** follow the §6.10 rules in full. The §6.13 table leaves out some flags those rules give (F+ for any shot, F3 for the archer family, F9 for each unmeasured rule); the tests pin the rule output. A preset with its own line (Pawn, Queen) keeps only its good flags. F12 also fires for "becomes a queen on its first take".
4. **"No pool piece warns except the Archer and the Guard"** (§8.4.5) is true of warning flags. The Paladin also shows the chip, from its memory score 5.5 ("hard", as §6.13 says).
5. **The like line** compares worths rounded to 0.01, so Hungry Rider (4.48) reads "About as strong as a beast." as §6.13 says.
6. **Free letters** exclude E (the Squire). **Names** may hold brackets, for "(yours)". "Always" for "also moves like" is never stored: it adds the piece's squares to Moves (W6).
7. **The Maester** in Try it and in the tests never swaps with a king (H1). The engine's Maester also swaps with an adjacent king (part of its long swap), which the Workshop leaves out.
8. **`workshopDialog().open()`** takes no `{ from }`: the Workshop opens over its caller, so Back only closes it.
9. **`judge(d, false)`** skips Why?, the fixes and the badges, for the shelf tiles (0.08 ms against 0.67 ms).
10. **Phone landscape:** code moves the tabs into the top bar. The tabs and every segment are 44 px tall.
11. **Try it** puts a piece with a start-rank rule on d2, not d4. "After a card" offers only "any card".
12. **MATRIX:** after merging `main` on 2026-10-06 (`84f9e42`), sections C and D are present. The two §3.3 rows now live in D.1 and D.2.
13. **Cards (1b):** the card parts of §8.4.3 and §8.4.5 wait for build 1b.

### 12.1 Changes after the owner's first look (2026-10-06)

The owner tried build 1a on a phone. These changes fix what he found and what the checks then found.

14. **Doors** (the owner's request): the game menu has four buttons, New game, Guide, **Workshop** and Settings (§2.1 said "not in the in-game menu"; the owner asked for it). The Guide no longer holds a Workshop door. HOME has no lead line: the title "Workshop" is the only heading.
15. **A tap outside a dialog or sheet closes it**, as Escape does, for every dialog of the game (`src/dialog-dismiss.ts`: the dialog gets a `cancel` event first). The press must start and end on the backdrop, so a drag out of a sheet does not close it. The full-screen title and Workshop have no backdrop.
16. **The stage fits its content at every size.** When the chip shows, the worth line gives only the number ("About 9 pawns"), because the chip names the label; on phones the like line gives way to the chip (Why? still says it). Under 620 px high (the 104 px stage) the gauge gives way, so the name, the worth line and the 44 px chip or Why? fit. The name steps down from its size to 14 px to fit, then ends in "…"; the pencil always shows.
17. **The plinth holds only the letter and the cracks.** The small rule seals of §5.1 layer 10 are gone (they read as noise; the floor and the rule text show the rules). The letter is larger and cut into the band; the Look tab says what it is ("the piece's own letter … It follows the name until you tap it."). The die keeps a letter the player chose, as renaming does. Cracks are dark splits with an ember seam at the two ends of the band, clear of the letter.
18. **Glow:** a chosen glow is a clear aura (a brighter rim and a floor halo in its colour) on the model at once; the chosen body and glow tiles have a thick ring and a tick.
19. **Words:** "in the capital" is "on a center square" everywhere ("On a center square (d4 e4 d5 e5)" in the When sheet). The Safe row is "Some pieces cannot take it" ("For example, pawns cannot take it."). Headings use lining figures ("0 of 3", not "o of 3").
20. **Rule-book badges:** the sheet starts with its key ("The number is about how many pawns the rule adds to this piece. A rule that works only some of the time adds less. "?" marks a guess: never tested in computer games."). A change of 0.1 to ¼ pawn shows as "+¼", not "+0" (`badgeText`); the rest are halves as §6.12 says. The rule cards say ", a guess" in place of "?".
21. **Why? reasons** (§6.12) name the parts of the design and what each adds: the worth without that rule, square group or line set ("Moves and takes 1 square diagonally: adds about 3 pawns."), the 3 largest. Then the hinges in plain words: "In all, it can take on about 10 squares; a rook, about 7; a queen, about 12. Past 7, each one counts double." The like line shows once. A fix says "about 4 pawns".
22. **Try it:** after a take that may chain, the next targets show at once; a **Finish** button in the button row ends the move (no "Take again" step). One line of help at a time, in a box of fixed height, so the board and the buttons never move. The board grows with the screen (32–56 px a square) and the page is centred in the height.
23. **Motion preview:** the page holds everything (the art as data URIs in the markup, so the still models show where scripts do not run; `motion-a.js` inline; the phone video by a path beside it). It plays every motion in turn on open (**Play all**), with a **Slow view** (×4, the preview only). Each one-shot stays within 600 ms but moves more: A1 480 ms, a lift 1.8 times the gait's; A2 360 ms + 38 ms a ring, from scale 0 through 1.6; A3 450 ms, the gem swells to 1.7; A4 560 ms, a 7 px shake; A5 560 ms. The third A5 card is now "next to your king" (the chain seal it showed is gone).
24. **Fixed bugs:** after the name field closed with no change, the name and its pencil vanished (and a script error followed). While the name is typed, a phone keyboard no longer changes the layout under the finger.
25. **Smaller layout fixes:** on tablet and desktop a sheet is as tall as its content (it filled 85% of the height); the zone map stays inside the model (it lay over the name); HOME's heading and empty line are centred with the doors; the phone-landscape tabs do not wrap ("Rules 1"); under 360 px wide Back shows its arrow only, so the bar title fits (in landscape too, Back keeps its word for screen readers).

### 12.2 Changes after the independent review (2026-10-06)

`docs/visual-design/workshop/REVIEW-2026-10-06.md` found 13 Major, 14 Minor and 2 Polish problems. Each one failed first (a test or a browser check against the old code) and passes now. Items 15, 20 and 21 above change as follows.

26. **Saving tells the truth.** `saveDesign` returns `'saved'`, `'full'` or `'failed'`. Only `'saved'` sets "Saved on this device". A failed save shows an alert that stays (Try again, Copy link) until a save works. Make a copy, Keep a copy and Delete report success only when it happened.
27. **A full shelf drops nothing.** At 50 designs the alert asks the player to delete one ("Choose one to delete" opens a list); the open draft stays and saves after that. A saved entry that is damaged stays in storage, HOME says how many cannot be read, and the rest show.
28. **Every allowed design shares.** The code limit is 4,000 characters; the largest allowed design is about 2,811 (a test pins it). Send link and Copy check the code first. Where the device cannot share or copy, a sheet shows the text, selected, to copy by hand.
29. **Keys and strokes:** Ctrl/Cmd+Z does nothing while a sheet is open. A choice sheet commits on a tap, on Enter or on Apply; the arrow keys only move the choice; the sheet checks that its rule still exists. The move grid captures the pointer, so a stroke ends wherever the button is released. Item 15: the press and the release must both be outside the dialog's box, so a drag from its padding does not close it.
30. **"Always" keeps every ability.** It is offered only where the like-piece squares merge with the painted ones (`likeAlways`); where a square would need both a take by moving and a shot, it is disabled and says why.
31. **Try it:** each target square does one action; a square with two or more (take or push, for example) asks which one. A chain clears the square the piece left, so a rook can take across its start square. A Safe rule shows its own words, says whether it holds now, and says that Try it cannot test it (the other side never moves); the shield shows only while it holds. One tab stop and arrow keys on the board; focus goes to the landing square; each move is announced. The figure is drawn as White (ivory), as the board plays it.
32. **The Moves tab** always shows the brush and Paint on in a mode line ("Move+take, all sides. Tap to add or erase."). On phones, More opens a Brushes sheet and "?" opens the help, so the board never moves. At 568×320 the board sits beside the brushes and every square shows (32 px). The tool row scrolls sideways, outside the painting surface.
33. **Why?** (item 21) compares the design with itself less one part: `Without "takes again": about 4 pawns.`, or `…, it cannot move at all.` It then says once that the parts overlap and the differences do not add up. A rule that works only some of the time says "The estimate assumes it works … about N% of the time." Flags name the rule they mean and use no project history ("we have no reliable estimate for …"). The gauge's shaded band is named in Why?.
34. **Ordinary pieces keep their words** on the stage, the shelf and SAVED (an unchanged Pawn is "The unit of worth", a Queen "Standard"); the Why? sheet title follows the verdict.
35. **SAVED and Look:** SAVED says "Custom pieces cannot join games yet." Its picture is labelled "Base moves", a conditional move gets its own picture, and "Every square" lists each square in words. Look says body, glow and army change only how it looks. The letter follows the name until the player sets it (`ownLetter`, stored).
36. **Mix two** shows on each tile what that piece gives and leaves out; the result note stays in the Rules tab until the player leaves. Toasts clear when the screen changes. Item 20: the badge key is one line that opens for the full text.
37. **Desktop:** the stage shows the figure, name and short verdict; the full judge shows once, on the right; Why? moves focus there.
38. **Diagrams:** movement lines have a dark edge.
39. **Motion preview** (not in the shipped editor): no scrolling with reduced motion or Off; Play stops Play all; a body change runs the gait and the change together; fading floor marks keep their gradients; overload restores the seams' dash pattern.

### 12.3 Design study before the screen rework (2026-10-06)

The owner requested a new design from first principles, with static options before implementation. `main` is merged into `claude/workshop`. [The study](visual-design/workshop/rework-2026-10-06/REVIEW.md) records the current phone and desktop walkthroughs and the three proposed directions. [The static comparison](visual-design/workshop/rework-2026-10-06/index.html) shows each direction on phone and desktop, with Home, Try it and detail states. The owner chose **C, Piece card**. The new screen contract is in sections 2.2–2.3 and 12.4.

### 12.4 Piece-card rework (2026-10-06)

Direction C replaces the stage, tabs, and separate Saved screen with one piece card. Phone edits use a modal sheet; desktop edits sit beside the card. Try and Share are direct actions. The rules, judge, local store, and sandbox retain their existing data and behaviour. No engine, AI, or main-game save path is added.

Initial presets now save at creation. Shared designs stay read-only until copied. A save failure stays visible even while a phone edit sheet is open. The Try return preserves the current edit section, brush, Apply to value, and Undo history. Approved Set A reactions are bounded and stop for the motion preferences.

**Artwork follow-up:** the owner does not want new designs to reuse the existing piece artwork. The owner approved a separate Workshop cast of 30 figures: five in each of five broad groups, plus five figures that each combine two properties, with three suggestions based on the chosen rules and a full gallery. The owner approved that set size and asked to see one of each type before the full set. The first review has six sample identities, including Fast + Ranged, with ivory and charcoal pairs. Check style and shape at board size, then wait for the owner's approval before generating the rest. Existing figures in the layout build are placeholders. [The six-sample review](visual-design/workshop/figure-samples-2026-10-06/index.html) includes large pairs, small views, current-cast references and source prompts. Approval is pending.
