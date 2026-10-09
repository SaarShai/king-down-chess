# King Down Chess: web app UI and UX review, and the plan

Sources: 7 lens reviews with adversarial checks (refuted items removed), screenshots in `scratchpad/ux/shots/`, and code at `/Users/za/Documents/king down chess`. I opened 04-game-idle (desktop, tablet, landscape), 05-game-selected-phone, 06-game-hint-phone, 10-new-game-desktop, 11-new-game-powers-phone, 15-guide-phone, 16-lesson-desktop, 17-powers-game-phone, 01-title-first-phone and 23-result-desktop myself. They confirm the findings below.

ID note: each lens has its own "MISS-n" IDs. Here they are `<LENS>-Mn`. For example, `ONB-M1` is MISS-1 of the onboarding lens.

---

## 1. Summary

The title screen and the painted board are strong. They give a real storybook first impression. Clear move markers and plain refusal lines also give a good base. The game screen does not match that quality.

**Problem 1: the game screen is not stable or calm.** It has 7 tiles of equal weight and up to 9 text areas in 4 styles. A hover or a selection pushes Hint, Undo and Resign down by 95 to 243 px. On a real phone in Safari (390x664), one tap on a pawn pushes them off the screen.

**Problem 2: the board is smaller than the screen allows, and touch gets mouse rules.** Portrait tablet squares are 60 px. Landscape phone squares are 35 px, and 20 px at 667x375. Move rows are 22 px high. A finger tap that moves 7 px or more does not select the piece.

**Problem 3: help misleads at the moments that matter most.**
- Hint gives moves that the game then refuses, in lesson 3 and in power games.
- Lesson 1 marks 8 squares, and 7 of them fail.
- A new player meets Club, which plays the same as Strong.
- Touch players cannot read the rules of an enemy piece.
- A frozen piece looks normal.
- The result speaks in army codes.

**The direction:**
- Board-first layouts that follow the screen shape, not one 720 px width breakpoint.
- One fixed action row.
- One status line and one message line.
- Player strips that carry captures and powers.
- Help that shows on the board and fades after the first finished game.
- One lab switch that takes the designer's tools out of the player's path.

Most of this removes things. It does not add them.

## 2. What to keep

- **Title screen:** the night stage, the six kings, the lineup of 12 figures with icons, and Learn as the first choice on a first visit (01-title-first-*). Use it as the mood reference for the whole app.
- **Move markers:** one shape per kind (gem, brackets, gun-sight, swap arrows, chevrons, rune), so colour is never the only cue. The see-through preview figure on hover.
- **Refusal lines** that say why a tap fails ("Not allowed: a guard can only be taken by a king.").
- **New game:** three mode cards, the 4-step level row, and the emblem king picker with power vignettes. The dialog edits a copy and remembers the last setup.
- **Moment captions and lesson tasks** in short, warm words ("She shoots it without moving.").
- **Keyboard play on the board** and `describeMove()` sentences for screen readers.
- **Key moments** after the game, and generous Undo.
- **No clocks and no premoves.**
- **The toppling king and the painted kings** in the result.
- **Small sounds** for each action.
- **The Workshop's** sticky header and footer, its three button tiers, and its short-landscape layout. It is the model for the game screen.
- **On phones:** 44 px targets everywhere, `touch-action: none` on the board, and hover styles only with `(hover: hover)`.

## 3. Design principles (testable)

1. **The board comes first.**
   - Portrait phones and portrait tablets: the board fills the width.
   - Landscape: the board fills the height.
   - Every touch screen 390 px wide or wider: squares are at least 44 px. At 375x667: at least 40 px.
   - Desktop: 0 px of board height goes to a header card.
2. **Controls stay still.** Hint, Undo and the power chip move 0 px on hover, selection, power arming and review. A browser check measures this.
3. **One place to read.** The game screen has one status line and one message line. At idle, help is 2 lines or fewer (25 words or fewer). No rule text shows until the player asks for it.
4. **One meaning per colour and per shape.** A view has at most one crimson fill, the primary action. Every chosen option uses the gold-ink ring. On the board, red means danger only.
5. **Show the cause.** Each refusal, check and power effect has a mark on the board, and a text of 15 words or fewer names the cause.
6. **The main action is always in view.** At all six test sizes, the primary button of each dialog is in the viewport with no scroll.
7. **Help fades, speed stays.**
   - First-run help ends after the first finished game: the generic tap line, chess-piece cards and "Your army".
   - Each expert path is 1 tap or 1 key: Rematch, review arrows, Ctrl+Z.

## 4. The simplification

### Screen map

**Today:**
- **Title** (once per tab, no way back): Continue, Learn the pieces, Play, Workshop.
- **Play** opens New game:
  - 3 mode cards and the level row.
  - With powers: 2 open pickers.
  - More options: the side, and an army list of 14 entries. Custom army opens a browser `prompt()`.
- **Learn** opens 6 lessons inside the full game panel. They end with Next lesson, or "Start a game" plus "Return to game". "Start a game" opens New game again.
- **Game panel**, from the top:
  1. New game, Guide, Workshop, Settings
  2. Help box
  3. Cancel selection
  4. Moment line
  5. Piece card
  6. Hint, Undo, Resign
  7. Use power, End turn and a power status line
  8. Send the game link
  9. The move list
  10. The White took and Black took rows
- **Guide** (titled "King Down pieces"): Learn, then 12 cards with the chess pieces first, then the draw pool, notation and powers.
- **Settings:** Play, Board (with Look, which reloads the page, and Thinking time), This game, Account.
- **Resign** opens a browser `confirm()`, then the result: Rematch, New game (starts a random army at once), Close.

**Proposed:**
- **Title:**
  - Continue, when a game is saved.
  - Learn the new pieces. It hides when all lessons are done.
  - Play. Its label is "New game" when a saved game exists.
  - Workshop as a quiet text button.
- **Learn** opens 5 lessons, plus a bonus Paladin lesson. Each lesson shows only the task, the board, Show me and the lesson strip. The last one ends with "Play your first game", which starts at once at Casual.
- **Game:**
  1. Opponent strip
  2. Board
  3. Your strip
  4. Status line and message line
  5. Hint, Undo, and a quiet Resign flag
  6. Review arrows
  7. Moves

  Desktop and tablet keep the four menu buttons as a quiet toolbar. Phones and landscape get one bar with a Menu sheet (decision D2).
- **New game:**
  - 3 cards.
  - The level row with one line of help.
  - With powers: your picker is open and the computer's king is a summary row.
  - More options: the side, and the army as Random, Today's or Chess. Its label names any choice that is not the default.
  - A sticky Start game button.
- **Guide:** Learn, then "What is different", the 6 new pieces, and the 6 kings as cards. The chess pieces, and the symbols and keys, are closed sections.
- **Settings:** Play, Board, and one Account row that opens a sheet. A Lab group shows only with `?lab=1`.
- **Resign** is a two-step button in place. After 900 ms the result opens: Rematch as Black, New game…, Review.

### Counts

| Item | Today | Proposed |
|---|---|---|
| Game screen buttons at full weight (desktop, idle) | 7 equal tiles in 2 rows | 2 secondary (Hint, Undo), 1 quiet icon (Resign), 4 quiet nav links |
| Phone controls under the board | 7 tiles in 2 rows of 60 px, plus header 58 px | 1 bar of 5 (Menu, Hint, Undo, back, forward), 56 px |
| Text areas in the game markup | 9 (`h1`, `#turn`, `#status`, `#asset-status`, `#move-help`, `#moment`, `#info`, `#power-status`, lesson card), plus 2 "took" rows | 2 (status line, message line), plus 1 card slot of fixed height |
| A pawn selected | +1 button, +2 boxes; the action row moves 197 px (phone) or 243 px (desktop); 52 words on phone | +0 buttons; 0 px move; about 15 words |
| Powers game, phone | 2 rule paragraphs (about 60 words), half-width Use button, status line, a dead "0 left" button; 83 words | 2 power chips with use dots; about 25 words |
| Lesson 1 after a tap on the archer | 3 text blocks (about 70 words), 2 buttons, 3 empty or disabled parts, 8 marks (7 fail) | 1 task line (12 words), Show me, 1 mark |
| New game with powers | 1128 px of content; 18 picker buttons and 2 rule lines; Start game out of view at all sizes | 1 picker (9 buttons) and 1 summary row; Start game always in view |
| Army choices | 14 entries | 3 (the rest behind `?lab=1`) |
| Settings | 1075 to 1126 px; 4 groups, 1 slider, 1 select that reloads the page | About 700 px; 2 groups and 1 row; 0 sliders |
| Guide on phone | 881 words, 4085 px; the first new piece starts at 1260 px | New pieces on the first screen; about 60% less visible text |
| Result | 29 words, with "setup SQBKRSML" | About 10 words, no codes |
| Browser `confirm`, `prompt` and `alert` calls | 9 | 0 |
| Tooltips that hold needed facts | About 15 | 0 |
| Words on the first screen a new player reads | 20 (title) | About 22 (the tagline replaces "Chess") |

## 5. Proposed layouts

The layout follows the screen shape. The grid templates use the same markup.

### Desktop 1440x900 and laptop 1280x720 (wide)

```
+--------------------------------------------------+--------------------------------+
|                                                  | New game  Guide  Workshop  Settings |  quiet toolbar, 44 px, no frames
|      +--------------------------------------+    |--------------------------------|
|      | 8                                    |    | (o) Computer · Club   [P][P]   |  opponent strip, 40 px
|      |                                      |    |     [Shadow: Death Touch]      |  power chip, powers games only
|      |      BOARD                           |    |--------------------------------|
|      |      top padding 8 px                |    | Your move                      |  status, 18 px / 700
|      |      (no header card:               |    | message line, 2 lines reserved |
|      |       +53 px of board)               |    | [ Hint ] [ Undo ]          [F] |  action row: never moves; F = Resign flag
|      |                                      |    | piece card slot, fixed 96 px   |  hover or selection; scrolls inside
|      |                                      |    | 1. e2-e4    e7-e5              |  moves fill the height, 28 px rows
|      |                                      |    | 2. ...                         |
|      |                                      |    | [|<] [<] [>] [>|]              |  review bar, after move 1
|      | 1                                    |    |--------------------------------|
|      +--------------------------------------+    | (o) You · White  [N] [Freeze o.]|  your strip, 40 px, by your pieces
+--------------------------------------------------+--------------------------------+
rail 304 px at 1200 px wide and wider (272 px below); rail background #e6e1cf, 1 px line
```

- The board grows from 776 to about 829 px on desktop and from 607 to 660 px on laptop.
- The strip of the side to move has a 3 px gold-ink left edge.
- The status line says "Your move", "Computer is thinking…", "Check from the archer on e3" or "Reviewing move 12".

### Tablet portrait 820x1180 (and every portrait screen up to 1100 px wide)

```
+--------------------------------------------+
| New game    Guide    Workshop    Settings  |  quiet toolbar, 44 px
| (o) Computer · Club     [P][P]   [Death T] |  40 px
+--------------------------------------------+
|                                            |
|    BOARD, full width, about 760 px         |  min((100vw - 32px) * 1024/960, 70svh)
|    squares about 88 px (60 today)          |
|                                            |
+--------------------------------------------+
| (o) You · White   [N]      [Freeze o.]     |  40 px
| Your move. message line, 2 lines reserved  |
| [Hint] [Undo]  [|<] [<] [>] [>|]       [F] |  one row, 56 px, 44 px targets
| 1. e2-e4 e7-e5   2. ...  (2 columns)       |  moves fill the rest (about 180 px)
+--------------------------------------------+
```

### Phone portrait 390x844 (check also at 390x664 and 375x550)

```
+----------------------------------+
| (o) Computer · Casual  [P] [DT]  |  36 px; "Thinking..." shows here
+----------------------------------+
|                                  |
|   BOARD, full width              |  min(100vw * 1024/960, 100svh - 220px)
|   squares 45.5 px (42.6 today)   |
|                                  |
+----------------------------------+
| (o) You · White  [N]  [Freeze o] |  36 px; your chip is the Use button
| Your move. Choose a piece.       |  message line, 2 lines reserved (40 px)
| 1.e4 e5  2.Nf3 Nc6  3.Bc4  ->    |  move strip; scrolls to the last move;
|                                  |  grows into the free height on tall phones
| [Menu] [Hint] [Undo] [<]  [>]    |  bottom bar, 56 px + safe-area bottom
+----------------------------------+
Menu sheet (decision D2): New game · Guide · Workshop · Settings ·
Send the game link (link games only) · Resign (danger, two-step)
```

- Height budget: 36 + 36 + 40 + 44 + 56 = 212 px, plus the board.
  - At 390x664 the board still gets the full width.
  - At 375x550 the squares are about 37 px.
- When a piece is selected, the message line shows its short card: name and 15 words or fewer. "More" opens the Guide card.
- In a link game, after your move, a full-width "Send the game link" button replaces the move strip.

### Phone landscape 844x390 (`(orientation: landscape) and (max-height: 500px)`)

```
+-------------------------------+-------------------------------+
|                               | (o) Computer · Club   [P][P]  |
|  BOARD, full height           | Your move                     |
|  padding 4 px;                | message line, 2 lines         |
|  left padding =               | 1.e4 e5 2.Nf3 ->   (strip)    |
|  env(safe-area-inset-left)    | (o) You · White [N] [Freeze o]|
|  squares about 42-45 px       |                               |
|  (35 today; 20 at 667x375)    | [Menu][Hint][Undo][<][>]      |
+-------------------------------+-------------------------------+
```

- The header card goes.
- The right column gets `padding-right` and `padding-bottom` from the safe-area insets.

### The first-run flow (new player)

1. **Title (first visit).** Lineup with a 24 px gap between King and Archer. "Chess with six new pieces" in place of "CHESS". Buttons: **Learn the new pieces** (primary), with "5 short lessons" under it; **Play**; and Workshop as a quiet button. A tap on a lineup figure opens its Guide card. Escape means Learn. No focus ring shows before the first key press.
2. **Lesson n of 5.** The header reads "Lesson 1 of 5 · Archer". The task line reads "Choose your archer, then the enemy pawn. She shoots without moving." A gold ring marks the archer. Only goal moves are marked. The panel shows the lesson strip (5 buttons plus Bonus), **Show me** and **Leave lessons**. Nothing else shows.
3. **Success.** A gold pulse on the piece and on the strip icon, a chime, and one sentence: "Well done! Archers shoot without moving." **Next lesson** gets the focus.
4. **After lesson 5.** "You know the new pieces." **Play your first game** is primary. "Bonus: the Paladin" is a quiet button.
5. **First game.** It starts at once: Casual, you play White, the random army is already drawn. The opponent strip says "Computer · Casual". Before move 1, the move area shows **Your army**: one row per new piece type, for example "Archer: shoots without moving". A tap on a row puts a ring on those pieces.
6. **During the first game:**
   - The generic help line shows.
   - A tap on an enemy piece shows its card.
   - The first-time captions show.
   - The message line says each opponent move in words.
7. **End.** The king falls on a clear board for 900 ms. Then the card shows "You win!" or "The computer wins", one line ("Checkmate on move 23"), and "Moves to look at again" when there are some. Buttons: **Rematch as Black**, **New game…**, **Review**.
8. **Later visits.** Continue is first. "Learn the new pieces" hides after all lessons; the Guide keeps it. First-run help stops after the first finished game.

## 6. Visual direction

### Tokens

Keep the names and values in `src/style.css:23-75`. Add only the missing roles.

| Role | Token | Value | Use |
|---|---|---|---|
| Floor | `--floor` (new) | `#e6e1cf` | Board surround and rail (the scene floor, `scene.mjs:473`). The 4 px stripe becomes 1 px `--stone-300`. |
| Surface | `--parchment` | `#f3ead7` | Strips, cards |
| Raised surface | `--vellum` | `#fbf7ee` | Dialogs, secondary buttons |
| Text | `--ink`, `--ink-soft` | `#2b2621`, `#5b5045` | Body text, secondary text |
| Line | `--stone-300`, `--stone-500` | `#c9bfac`, `#8a8072` | Dividers; borders and disabled |
| Primary | `--accent`, `--accent-hover` (new), `--accent-deep` | `#842c21`, `#a8422f`, `#5a1c14` | Primary action only, one per view |
| Chosen | `--chosen` (new; = `--gold-ink`), `--chosen-tint` (new) | `#7a5712`, `#f6e9c8` | A 2 px ring and the tint on every chosen option: mode cards, segments, emblems, power options, the viewed move |
| Danger | `--danger` | `#b0251b` | Resign confirm, refusals, threats |
| Check | `--check` | `#e02828` | Red wash on the king's square in check, and the checker line |
| Focus | `--focus` | `#1c5bb0` | Focus on parchment. It replaces `#8cc0ff` at `style.css:375`. Keep `#8cc0ff` only on `--night`. |
| Night | `--night`, `--on-night` | `#221d18`, `#f3ead7` | Title screen only |
| Ornament | `--gold` | `#c99a3e` | On dark stone only |
| Board marks (canvas) | `marks.ts:65` | Move `rgb(255,214,128)`, capture `rgb(214,52,40)`, swap `rgb(160,120,220)`, shove `rgb(64,190,176)`, power `rgb(96,160,255)` | Keep |

**Type**

| Role | Font | Size / weight |
|---|---|---|
| Result title | Cinzel | 30 px |
| Dialog title | Cinzel | 23 px |
| Card names | Cinzel | 18 px |
| Status line | Alegreya Sans | 18 px / 700 |
| Body | Alegreya Sans | 15.5 px |
| Inputs and selects | Alegreya Sans | 16 px (no iOS zoom) |
| Secondary text | Alegreya Sans | 14 px |
| Caption (minimum) | Alegreya Sans | 12.5 px |

- Cinzel is used only at 18 px and larger. Below that, use Alegreya Sans 700 in sentence case, for example the mode titles and the lineup names.
- Square names never go into a Cinzel title.
- Only the Workshop mini-board coordinates may use text under 12 px.

**Spacing:** 4 / 8 / 12 / 16 / 24 / 32 (keep).

**Radii:** 5 / 8 / 14 (keep). Replace the raw 4, 6, 10, 12 and 22 values in `workshop.css`.

**Elevation:**
- Flat (0) for secondary and quiet buttons, strips and rows.
- `--shadow-card` for real cards.
- `--shadow-float` for dialogs.
- `--lift` only on the primary button.

**Motion:**

| Event | Duration |
|---|---|
| Button press | 80 ms |
| State change | 120 ms |
| Marker pop | 300 ms, + 38 ms per square of distance |
| Power-mark pop | 300 ms |
| Toppling king in the result | 500 ms |
| King's fall on the board | 650 ms |
| Delay before the result opens | 900 ms after the last move (0 with Animations Off or reduced motion; a tap skips it) |
| "Copied" label | 2 s |
| Thinking indicator | Shows within 400 ms |
| Resign confirm | No timer |

### Component rules

- **Buttons: 4 kinds.**
  - *Primary:* crimson fill and the 2 px press. At most one per view.
  - *Secondary:* flat `--vellum`, 1 px `--stone-500` border, and a 1 px `--stone-300` under-edge. No gradient.
  - *Quiet:* no fill, `--ink` text, and a hover tint.
  - *Icon:* 44x44 with an `aria-label`. Use it for the Resign flag, the review arrows and Send link.

  *Disabled* is the same kind at 45% opacity. On a coarse pointer every control is 44 px. On a fine pointer the minimum is 28 px.
- **Choices** have one chosen style (`--chosen` ring and `--chosen-tint`). Settings that act at once are switches (44x26 track), not checkboxes.
- **Messages** use one line and no coloured boxes. Each kind has its own weight:
  - Task: bold.
  - Info: regular.
  - Refusal: ink text with a 3 px `--danger` start mark.
- **Cards** are only for a real unit: a piece, a king, a key moment. A card never holds another card.
- **Dialogs** have one frame:
  - `--vellum` fill, 1 px `--stone-300` border, radius 14, `--shadow-float`.
  - No outer rings, no radial gradient.
  - A sticky footer with the primary button on the right.
  - Esc and a tap on the backdrop close the dialog. There is no × button.

  Bottom sheets on phones are an optional later style. The sticky footer is the fix.
- **In-game choices** (promotion, capture or push): no blur and a dim of 0.25. They sit in the rail on desktop and under the board on phones.

## 7. Ranked changes

Impact: H/M/L. Effort: S/M/L. Audience: N = new players, E = experienced players, B = both.

**Coordination:** `src/render/PaintedView.ts` and `src/render/marks.ts` also run in the ChatGPT plugin page (`src/plugin/app.ts`). Tell the Codex session before rows 3, 16 and B3 land.

### Quick wins (S effort, high value)

| # | IDs | Screen | Change | Why | Aud. | Imp. | Eff. | Simplifies |
|---|---|---|---|---|---|---|---|---|
| 1 | PLAY-1, RESP-3, VIS-2, VIS-M1, A11Y-4, ONB-15, PLAY-8, SET-2 (step 1) | Game, all sizes | Put Hint/Undo/Resign above all changing text. Put the help, the moment line, the card and Finish chain in one slot under the row (min-height 2.9em; the card slot is fixed and scrolls). Delete Cancel selection: a second tap and Esc already cancel. Update `tools/verify-special-moves.mjs:64`. | Fitts; Nielsen 4; no layout shift | B | H | S | yes |
| 2 | ONB-M1, A11Y-M1, A11Y-M2, PW-M2, ONB-12, PLAY-4, A11Y-1, VIS-11 (hint part) | Game, lessons, powers | **Lesson:** "Show me" lights the goal move (`LESSONS[i].goal`) with no engine call. **Live game:** Hint selects the piece, arms the power when `needsArming`, and writes one line from `describeMove()` ("Hint: use Strike, then knight f1 to f7."). **Key-moment review:** one gold arrow from the piece to the target, in place of two equal boxes. | Nielsen 5, 9, 1; WCAG 1.4.11, 4.1.3 | N | H | S | yes |
| 3 | RESP-M1 | Board, touch | Use a 10 px drag threshold for touch and pen (6 px for a mouse). A drag that ends on its start square keeps the selection. | Platform touch slop; Nielsen 1 | B | H | S | no |
| 4 | SET-1, RESP-6, RESP-15, VIS-7 (footer) | New game, Settings, Guide, Result | Sticky form footer (`position: sticky; bottom: calc(-1 * var(--space-5))`). In `max-height: 500px`: hide `.mode-art`, use 8 px card padding, use 56 px result art, and put the promotion choices in one row. | Fitts; Material dialogs | B | H | S | no |
| 5 | RESP-2, VIS-M3, PLAY-2 (board), RESP-4, RESP-M2, RESP-10 | Tablet, phone, iPhone landscape | Stacked layout for `(orientation: portrait) and (max-width: 1100px)`. Phone board row `min(calc(100vw * 1024/960), 63svh)`. Use `svh` in place of `vh`. Add safe-area insets, or drop `viewport-fit=cover`. | Figure-ground; HIG 44 pt; HIG safe area | B | H | S | yes |
| 6 | SET-12, RESP-7, A11Y-7, VIS-M4, PLAY-15 (desktop rows) | Tablet, landscape, desktop | Move the 44 px rules into `@media (max-width: 720px), (pointer: coarse)`, for dialogs and the panel only. Set `#moves [data-ply]` min-height to 28 px on fine pointers. | WCAG 2.5.8; HIG; Material | B | H | S | no |
| 7 | ONB-19, PLAY-M1 | Game, touch | With no piece selected, a tap on an enemy piece shows its short card ("Black guard. Only a king can take it."), not "choose one of your own pieces". | Nielsen 6, 9 | N | H | S | yes (D10) |
| 8 | ONB-5, SET-4, SET-14, A11Y-11 | New game, first run | Casual until the first finished game (`new-game.ts:34`, `main.ts:85`). One line of 8 words or fewer under the level row. Delete the `#level` tooltip. | Peak-end; Tesler; HIG | N | H | S | yes (D1) |
| 9 | ONB-M2, PLAY-5, A11Y-9, PW-6, PW-4, A11Y-M3, VIS-8, PW-21, SET-9, SET-M3, PW-14, PW-13, A11Y-14 | Result | Wait 900 ms, then open with no blur and a 0.25 dim. Set `data-fallen` one frame after `showModal`. Lift the fallen king with `translate: 0 -26px`. Title "You win!", "The computer wins" or "Draw" (colour names in two-player games). One line: "Checkmate on move 23." Delete "That side gave up." and the setup code. Head key moments "Moves to look at again", or hide them when there are none. Buttons: Rematch as Black, New game… (opens the dialog with the last setup), Review. Focus goes to `#board`. Play an end sound for resign and draws. | Peak-end; Nielsen 2, 4; WCAG 2.4.3 | B | H | S | yes |
| 10 | VIS-1, RESP-12, PW-15, ONB-16, SET-M2, A11Y-5 | Game header | Remove the "KING DOWN CHESS" h1 from play (keep it for screen readers) and the 64 px board padding. Merge `#turn` and `#status` into one line in player words: "Your move", "Computer is thinking…", "Check! Your move". Add the matchup: "You (White) vs Computer · Casual". | Nielsen 1, 8 | B | H | S | yes |
| 11 | PW-3, PW-9, PW-8 | Powers game | Show only the power of this device's side (hot-seat games keep the side to move). Hide the button at 0 uses left. During Haste or a free mark, show End turn and one line ("Freeze done. Now make your move, or end the turn."). Delete `#power-status`. | Nielsen 4, 8; Fitts | B | M | S | yes |
| 12 | ONB-7, A11Y-3, A11Y-15, ONB-14, PW-17 | Piece card, Guide, New game | One short line per piece and per power, built from the rule flags. The opponent's power is written in the third person ("its king"). Use "Choose" in every instruction. Remove FEN, custom setup, draw pool and Shift-click from the game screen. Use one count style: "once a game", "always on". Guide: "Spend a power with its Use button." | Nielsen 2; ASD-STE100 | N | H | S | yes |
| 13 | PLAY-16, SET-M1, VIS-M2, A11Y-2, SET-11 | Resign, link, New game | Resign becomes a two-step button ("Confirm resign"). Any other action, or moving focus away, cancels it; no timer. A game link opens a styled confirm built like `#delete-account`. Errors go in the message line. New game shows "This ends your game at move 12." | Nielsen 4, 5 | B | M | S | yes |
| 14 | ONB-8, ONB-9, ONB-11, ONB-10, ONB-18, ONB-21, RESP-14, VIS-15, A11Y-M4, SET-M5, VIS-20 | Title, lesson exits | "Play your first game" starts at once. Hide "Return to game" when the saved game has no moves. Learn opens the first lesson not done. Strip icons become 44 px buttons. Add a `kingdown.played` flag. Title: tagline, King and Archer gap, lineup figures open their Guide card, landscape rule keyed to height, focus on the h1 (`tabindex=-1`), Escape means Learn on a first visit, names at 12 px in Alegreya Sans. One label everywhere: "Learn the new pieces". | Hick; Nielsen 3; five-second test | N | H | S | yes |
| 15 | VIS-4 | New game, Settings, move list | Crimson only for the primary action and danger. Every chosen option gets the `--chosen` ring and tint. Segment focus `#1c5bb0`. | Von Restorff; Nielsen 4 | N | M | S | yes |
| 16 | PLAY-19, VIS-M5, A11Y-20, PLAY-M3, A11Y-17, PLAY-12, PLAY-11, VIS-11 (threats), PLAY-M2 (shooter) | Board | Coordinates at 12 px or more, Alegreya Sans 700, `#e4d8bb`. Selected outline `#fbf7ee` 3 px with a 1 px `#2b2621` edge. Last-move wash `rgba(205,140,30,.5)` on light squares only. Red radial wash on the king's square in check. Threats: a 2 px red inner edge on covered squares (no dots) and a red "!" badge on a threatened piece. The last-move wash goes on the shooter's square too. `scene.mjs` belongs to the motion track; agree with it first. | WCAG 1.4.11; Jakob | B | M | S | no |
| 17 | A11Y-6, A11Y-8, PLAY-17, SET-M4, A11Y-13, PW-M3, RESP-M3, SET-13, SET-19, A11Y-16, ONB-M3, VIS-18 (16 px) | Game, Settings, Guide | **Keys:** Ctrl/Cmd+Z, as the Workshop has; no game keys while any dialog is open; Home and End. **Guide:** one "Keys" line on hover screens. **Motion:** follows the device until the player chooses, including the king's fall. **Screen readers:** move `aria-label` from `describeMove()`; hover previews are not live; refresh `sayCursor` after each move. **Touch:** a '?' or '??' move shows its note when opened. **Fixes:** save Piece letters; "Moves copied" after Copy moves; load error with a Reload button; delete the 3 two-beast example armies; 16 px inputs. | WCAG 2.1.4, 2.3.3, 1.3.1; Nielsen 1, 4 | B | M | S | yes |

### Next (M effort)

| # | IDs | Screen | Change | Why | Aud. | Imp. | Eff. | Simplifies |
|---|---|---|---|---|---|---|---|---|
| N1 | ONB-1, ONB-2, ONB-17, ONB-22, RESP-17, VIS-13 | Lessons, first game | **Lessons:** hide `#move-help`, `#info`, Undo, Resign, moves and the "took" rows. Put the task in the header. Ring the piece. `candidates()` keeps only goal moves. Success is one sentence and a pulse. Five lessons, Paladin as Bonus (D9). **First game:** "Your army" rows before move 1. | Errorless onboarding; Hick; empty states teach | N | H | M | yes |
| N2 | ONB-4, PLAY-12, PW-1, PW-5, PW-7, PW-M1 | Game, powers | **Check:** a thin red line from each checker to the king and a ring at the checker. Add a `checkers()` helper. The header says "Check from the archer on e3". **Powers:** a frost tint and crystal on frozen pieces, an ice dome on walled pieces, a pop and a "mark" sound. Refusals name the power ("Holy Light: pieces next to the Spirit king cannot be taken."). The piece card is written from the power when a power changes that piece. | Nielsen 1, 9; Von Restorff | B | H | M | no |
| N3 | PLAY-6, RESP-9 | Review, all sizes | Review bar: first, back, forward, last (44 px). Leave review with "Back to game" in place of the "tap the board" sentence. `back` with `viewing == null` calls `showPly(len - 1)`. | Jakob; Nielsen 3 | E | H | M | no |
| N4 | ONB-6, RESP-16, VIS-19, PW-16, A11Y-19, SET-17 | Guide | Title "Guide". Order: Learn; "What is different" (3 bullets); 6 new pieces; 6 king cards (emblem, still vignettes, 1 line each); "Chess pieces" closed; "Symbols and keys" closed, as a table. Card minimum 340 px, so 2 columns at 820 px. | Progressive disclosure; inverted pyramid | B | M | M | yes |
| N5 | SET-3, A11Y-12, SET-8, SET-7, SET-11, SET-16, SET-10 | New game | Your picker is open and first ("Your king · Black"). The computer's king is a summary row with Change (D5). Pickers become native radio groups (about 23 tab stops become 9). Army: Random, Today's, Chess. The More options label names what is not default ("More options · Black · Chess starting army"). The powers-box row has the same height as the level row. | Hick; Miller; APG radio | B | H | M | yes |
| N6 | SET-6, SET-5, A11Y-18, VIS-18, SET-18, VIS-16, A11Y-10, ONB-20 | Settings, lab | Groups: Play, Board, and one Account row that opens a sheet. Move "This game" out. Switches for settings that act at once. Delete the Thinking time slider; Strong has a fixed 2.5 s (D3). The `?lab=1` switch holds the example armies, the Catapult armies, Ogre practice, Custom army (an inline 8-slot field), Clay 3D and LAN copy (D4). | Hick; Nielsen 8; WCAG 3.2.2 | B | M | M | yes |
| N7 | VIS-3, VIS-5, VIS-7, VIS-9, VIS-10, VIS-17, RESP-18, PW-12 | Whole app | The four button kinds. A quiet nav toolbar with `white-space: nowrap`. Rail 304 px at 1200 px wide and wider. Rail background `#e6e1cf`. One flat dialog frame. Remove the `.king-pick` box and the vignette's gold frame. Cinzel at 18 px or larger (D8). Replace the raw hex values (about 37 in `style.css`) with tokens. Leave the art colours in `power-motion.css` as they are. | Von Restorff; Nielsen 4, 8 | B | M | M | yes |
| N8 | ONB-3, PLAY-9, ONB-15 | Board, piece card | A name chip at the figure's feet on hover and on selection. The short card for any King Down piece (own or enemy). Chess-piece cards and the generic tap line only until the first finished game (one `kingdown.finished` count). Piece icons on the board (D6). | Nielsen 6; scaffolding that fades | B | M | M | yes |
| N9 | PW-19, PW-18, PW-22, PW-M4, PW-20, PW-23, PW-10, VIS-21 | Workshop | **Try it:** a count with no fail state ("Taken 3 of 6 · 5 moves"), and a first line "Only this board plays your piece for now." **Footer:** the Why button shows "Fair · 4½ pawns ›"; the toast sits above the footer. **Editor:** the "Apply to" control becomes "Mirror: 8 ways, Left and right, Off". "Look" button (D13). **Home:** "Your pieces (0)", aligned with the doors; one chevron style. | Peak-end; Nielsen 2; proximity | B | M | M | yes |
| N10 | RESP big idea, RESP-M2, A11Y big idea | Browser checks | A layout gate at 375x550, 390x664, 667x375, 844x390, 820x1180 and 1280x720. It checks the square size, a Hint move of 0 px after hover and selection, the dialog primary in view, move rows of 24 px or more, keys under dialogs, focus after close, and reduced motion with a saved pace. | Prevents regressions | B | H | M | no |

### Bigger redesign (L effort)

| # | IDs | Screen | Change | Why | Aud. | Imp. | Eff. | Simplifies |
|---|---|---|---|---|---|---|---|---|
| B1 | PLAY-3, VIS-6, PW-2, RESP-8, ONB-13, RESP-13, VIS-13, PLAY-18, PLAY-M2, PLAY-13, A11Y-4, VIS-2 | Game, all sizes | Two player strips. Each has the king emblem or avatar, the name and level, captured icons (no +N, D11) and the power chip with use dots. Your chip is the Use button; a tap on any chip opens its rule. Add one status line and one message line. The opponent's last move shows in words until your next move. Send link is an icon button; it is full width only in a link game, after your move. | Proximity; Jakob; Hick; Nielsen 1 | B | H | L | yes |
| B2 | RESP-5, RESP-1, PLAY-M4, PLAY-15, VIS-14, RESP-9 | Phone, landscape | The bottom bar (Menu, Hint, Undo, back, forward), the Menu sheet (D2), the move strip, and the short-landscape grid with the board on the left at full height. | Fitts; thumb zone; HIG 44 pt | B | H | L | yes |
| B3 | PLAY-10, VIS-12, RESP-11 | Promotion, Capture or push | **Step 1 (S):** no blur, a 0.25 dim, the dialog in the rail or under the board; 4 columns only when there are exactly 4 choices; no Cancel button. **Step 2:** capture or push on the board ("Tap c5 again to capture, or c6 to push"). No board column for promotion now. | Nielsen 6; Jakob | B | M | L | yes |

### Conflicts between lenses, and how I resolve them

1. **Hover card.** VIS-2, VIS-M1 and ONB-15 remove it. The PLAY-1 and RESP-3 checks keep it.
   - **Keep it, in the fixed slot under the action row.** On desktop, hover is the only way in a game to read an enemy piece's rules.
2. **Menu sheet against the four buttons.** PLAY-2, RESP-5 and the SET big idea want a sheet. The PW-12 and SET-2 checks, commit a8fd7d0, and revision 3 §12.1 item 14 (two days old) keep the buttons.
   - **Desktop and tablet keep the four buttons as a quiet toolbar.**
   - **Phones and landscape get the sheet**, which still holds a Workshop button, only if the owner agrees (D2).
3. **Hint in lessons.** ONB-1 wants "Show me". A11Y-M1 hides Hint.
   - **"Show me" with the goal move.** A tutorial needs a way out that always succeeds. Undo and Resign hide.
4. **Level help line.** ONB-5 and SET-4 add it. A11Y-11 says no.
   - **Add one line of 8 words or fewer.** It replaces a tooltip that touch screens never show. It is not a new choice.
5. **Result buttons.** PLAY-5 and PW-14 want "New army" (instant start). SET-9 wants "New game…".
   - **"New game…"** opens the dialog with the last setup. One label keeps one meaning. Rematch stays the one-tap path.
   - **"Review"** replaces Close (PW-14).
6. **Result backdrop.** PW-4 keeps it. PLAY-5 makes it lighter.
   - **900 ms wait, then a 0.25 dim with no blur.** The owner's dialog and its painted kings stay.
7. **Resign confirm timer.** PLAY-16 and VIS-M2 use 3 s. A11Y-2 uses no timer.
   - **No timer.** A timer traps slow players and screen-reader users.
8. **Threat marks.** PLAY-11 uses a faint tint. VIS-11 uses smaller solid dots.
   - **A 2 px red inner edge, plus a "!" badge.** It is not a dot (Jakob), and it keeps 3:1 contrast.
9. **Hint marker.** VIS-11 uses an arrow. A11Y-1 uses a ring and a box.
   - **Live games use the selection and the preview figure. Review uses one arrow.**
10. **Strip placement.** PLAY-3 puts them on the board edges. The PW big idea puts them in the header card.
    - **Rail top and bottom on wide screens; above and below the board on portrait screens.** This keeps the board height. The PW-2 check refuses the header card.
11. **Coordinates.** Three values were proposed.
    - **12 px or more on screen, Alegreya Sans 700, keep `#e4d8bb`.** Agree with the motion track first.
12. **Rail width.** Proposals: 288, 304 and 320 px.
    - **304 px at 1200 px wide and wider.** It fits the 196 px of empty floor on each side.
13. **Last move.** PLAY-7 reverses an owner decision. A11Y-17 does not.
    - **Do A11Y-17 now. Put PLAY-7 to the owner (D7).**
14. **Title focus.** VIS-15 focuses the h1. A11Y-M4 keeps the button focus but hides the ring.
    - **VIS-15.** It matches the other dialogs (`index.html:118, :173`).
15. **King picker.** SET-3 closes both pickers. Round 3 opens both.
    - **Open your picker; the computer's king is a summary row (D5).** This keeps the vignettes and halves the dialog height.
16. **Close button.** VIS-8 and the VIS big idea add a ×. SET-6 and RESP-15 do not.
    - **No ×.** The sticky footer always holds Close or Start game.
17. **Removing the old brand header.** Two ideas compete.
    - **The dark night stage (VIS, PW big ideas) is an owner question (D12).** Now: remove only the h1, and give the rail the light floor colour (VIS-10 corrected).

## 8. Full finding list by area

Severity is the checked severity: maj = major, min = minor, pol = polish. The arrow shows where each finding goes in section 7, or which decision covers it.

**Game screen layout and controls**
- PLAY-1 (maj): the rail jumps on hover and on selection. → 1
- VIS-2 (maj): five message areas in four styles push the controls down. → 1, B1
- VIS-M1 (maj): a hover moves Hint 95 to 115 px. → 1
- RESP-3 (maj): Hint, Undo and Resign jump 180 to 240 px. → 1
- A11Y-4 (maj): messages in five places; the power text is cut off in landscape. → 1, B1
- ONB-15 (min): help and the full card show on every selection, for good. → 1, N8
- PLAY-8 (min): Cancel selection and the generic help box repeat what the board shows. → 1
- SET-2 (maj): navigation holds the best place on a phone. → 1 (step 1), D2
- RESP-5 (maj): the phone thumb zone holds an empty move list. → B2, D2
- PLAY-2 (maj): seven equal buttons; a small tablet board. → 5, N7, D2
- VIS-5 (maj): navigation and actions look the same; "New game" wraps. → N7
- RESP-18 (pol): a narrow rail beside 390 px of empty floor. → N7
- PW-12 (pol): the Workshop takes a menu slot. → keep the slot; nowrap (N7)
- SET-15 (pol): no way back to the title. → "Home" in the Menu sheet only if D2 is yes
- PLAY-13 (min): two players get no hand-off signal; the link row shows on every turn. → B1
- PLAY-18 (pol): a caption stays for the whole game. → B1
- PLAY-M2 (min): the opponent's move is not said in words; the shooter is not marked. → B1, 16

**Header, status and strips**
- VIS-1 (maj): the brand outranks the game state. → 10
- RESP-12 (min): the header card costs 7 to 20% of the board. → 10
- PW-15 (pol): remove the h1 during play. → 10, D12
- ONB-16 (min): the screen does not say who plays whom. → 10
- SET-M2 (min): the screen does not say what game is in play. → 10
- A11Y-5 (min): the turn line uses colours; "thinking…" is weak. → 10
- PLAY-3 (min): captures and the turn line are far from the board. → B1
- RESP-13 (min): captures are far from the board. → B1, D11
- VIS-13 (min): empty states fill the rail. → N1, B1
- PLAY-14 (pol): no material count. → D11
- VIS-10 (min): two beiges; the game loses the title's warmth. → N7, D12

**Board size and layout by shape**
- RESP-1 (maj): phone landscape squares are 20 to 35 px. → B2
- PLAY-M4 (min): in landscape the header card covers rank 8. → 10, B2
- RESP-2 (maj): portrait tablets get the desktop rail. → 5
- VIS-M3 (maj): portrait tablets get a small board. → 5
- RESP-4 (maj): the phone board is narrower than the screen. → 5, B2
- RESP-M2 (maj): the layout uses `vh`, and the checks have no browser toolbar. → 5, N10
- RESP-10 (maj): no safe-area insets. → 5
- RESP-14 (min): the title breaks at 844x390; Workshop stands alone on a tablet. → 14
- RESP-17 (pol): empty and disabled parts show in lessons. → N1

**Touch input and targets**
- RESP-M1 (maj): a 6 px tap slop drops the selection. → 3
- RESP-M4 (min): a tap on a tall figure's head hits the square above. → measure in N10 first; change only if it is frequent
- SET-12 (min), RESP-7 (maj), A11Y-7 (min), VIS-M4 (maj): touch sizes follow the width, not the input. → 6
- PLAY-15 (min): four moves on a phone; 22 px rows on desktop. → 6, B2
- VIS-14 (min): three moves on a phone. → B2
- RESP-M3 (min): needed help sits in hover tooltips. → 17
- RESP-9 (maj): no back and forward controls on touch. → N3
- PLAY-6 (maj): no review step bar; no Home or End. → N3, 17

**Hint**
- ONB-12 (min): Hint gives no reason. → 2
- PLAY-4 (min): two equal frames and no words. → 2
- A11Y-1 (maj): 1.68:1 contrast and no text. → 2
- VIS-11 (min, hint part): the hint has no direction. → 2
- ONB-M1 (maj), A11Y-M1 (maj): Hint in lesson 3 fails the lesson. → 2
- A11Y-M2 (maj), PW-M2 (maj): Hint suggests a power move that the game refuses. → 2

**Board marks and legibility**
- ONB-4 (maj): an archer's check through a piece is not shown. → N2
- PLAY-12 (min): the check ring hides under the king. → 16, N2
- PLAY-11 (min): threat marks reuse the move dot and the capture ring. → 16
- VIS-11 (min, threats part): threat dots. → 16
- PLAY-7 (min): the square a piece left is not marked. → D7
- A11Y-17 (pol): on light squares the last-move mark changes hue only. → 16
- PLAY-M3 (min): the selected piece is hard to see. → 16
- PLAY-19, VIS-M5, A11Y-20 (pol, min, pol): coordinates are about 10 px. → 16
- ONB-3 (maj): the piece names are hard to learn; Rook and Ogre look alike. → N8, D6

**Piece information and copy**
- ONB-19 (maj), PLAY-M1 (maj): a tap on an enemy gives a refusal, not a card. → 7, D10
- PLAY-9 (min): full rule text for every piece. → N8
- ONB-7 (maj): jargon in the piece rules. → 12
- A11Y-3 (maj): long text and developer words. → 12
- A11Y-15 (min): "Tap" and "Click" mixed. → 12
- ONB-14 (min): the opponent's power says "your king"; the Guide names the wrong place for Use. → 12
- PW-17 (pol): power counts and names change from screen to screen. → 12
- PW-M1 (maj): the card gives the base rule when a power changes the piece. → N2
- A11Y-13 (min): screen-reader output reads symbols. → 17
- PW-M3 (min): power moves in the list read as code. → 17

**Kings' powers in play**
- PW-2 (maj), VIS-6 (maj), RESP-8 (maj), ONB-13 (min): power information is in three places and the Use button is plain. → B1
- PW-3 (maj): the computer's power button shows in your panel. → 11
- PW-9 (min): a dead "0 left" button. → 11
- PW-8 (min): mid-turn controls fall below the fold. → 11
- PW-1 (maj): frozen and walled pieces look normal. → N2
- PW-5 (min): a power use has no moment of its own. → N2
- PW-7 (maj): passive powers are hidden; refusals do not name them. → N2

**First run and lessons**
- ONB-1 (maj): three texts at once; 7 of 8 marks fail. → N1
- ONB-2 (maj): no army overview before move 1. → N1
- ONB-5 (maj), SET-4 (maj): the first opponent is Club. → 8, D1
- ONB-8 (maj): lesson exits lead into an unknown game. → 14
- ONB-9 (min): the second visit loses the welcome. → 14
- ONB-10 (min): the title does not say what King Down is. → 14
- ONB-11 (min): the lesson strip is not navigable; Learn always restarts. → 14
- ONB-17 (min): the first-run lessons teach the Paladin. → N1, D9
- ONB-18 (min): the title lineup reacts to the pointer but does nothing. → 14
- ONB-21 (pol): "Learn the pieces" promises more than the lessons give. → 14
- ONB-22 (pol): lesson success is flat. → N1
- SET-M5 (pol): Escape on the first-visit title skips the lessons. → 14
- VIS-15 (min), A11Y-M4 (pol): a focus ring shows on load. → 14
- VIS-20 (pol): the lineup names are small. → 14, D8

**New game**
- SET-1 (maj), RESP-6 (maj): Start game is out of view. → 4
- SET-3 (maj): two open pickers. → N5, D5
- A11Y-12 (min): the picker uses toggle buttons. → N5
- SET-7 (min): More options hides choices that change the game. → N5
- SET-8 (maj): an army list of 14 entries and a browser prompt. → N6, D4
- ONB-20 (min): example armies are codes in a hidden list. → D4
- ONB-M3 (min): three example armies break the one-beast rule. → 17 (delete now)
- SET-10 (pol): two controls turn on Kings' powers. → N5
- SET-11 (min): Start game ends the game in progress with no warning. → 13
- SET-16 (pol): your king is not always first. → N5
- VIS-4 (maj): crimson means both "do it" and "chosen". → 15
- VIS-7 (maj): frames inside frames. → 4, N7

**Settings**
- SET-5 (maj), A11Y-18 (pol): Strong plays the same as Club. → N6, D3
- SET-6 (min): Settings mixes preferences, game data and sign-up. → N6
- SET-13 (min): Piece letters does not stay on after a reload. → 17
- SET-14 (min), A11Y-11 (min): help lives in tooltips. → 8, 17
- SET-18 (pol), A11Y-10 (min), VIS-16 (min): Look reloads the page; Clay uses a second marker language. → D4
- SET-19 (pol), A11Y-16 (min): Copy moves and load errors give weak feedback. → 17
- VIS-18 (min): checkboxes for instant settings; a slider with no value; 15.5 px selects. → 17, N6
- RESP-15 (pol): Close only at the end of a long dialog. → 4

**Guide:** ONB-6 (maj), RESP-16 (min), VIS-19 (min), PW-16 (min), A11Y-19 (pol), SET-17 (pol). → N4

**Result:** ONB-M2, PLAY-5, VIS-8, A11Y-9, PW-6, PW-4, A11Y-M3, PW-21, PW-14, SET-9, SET-M3, PW-13, A11Y-14 (two maj; the rest min or pol). → 9

**In-game choices:** PLAY-10 (min), VIS-12 (min), RESP-11 (min). → B3

**Browser dialogs:** PLAY-16, SET-M1, VIS-M2, A11Y-2 (all min). → 13

**Keyboard, motion and accessibility**
- A11Y-6 (maj): Reduce Motion stops working after the first visit. → 17
- A11Y-8 (maj): the single "z" key undoes, also behind the result. → 17
- PLAY-17 (pol), SET-M4 (pol): few keyboard shortcuts, and no list of them. → 17
- A11Y-14 (min): focus falls to the page body after the result closes. → 9

**Visual system**
- VIS-3 (min): every button is a raised tile. → N7, D8
- VIS-9 (min): too many type sizes; Cinzel capitals at small sizes. → N7, D8
- VIS-17 (min): tokens exist, but the code goes round them. → N7
- VIS-21 (pol): Workshop Home has two left edges. → N9

**Workshop**
- PW-10 (min): nothing says that a custom piece cannot join a game. → N9
- PW-18 (pol): the worth shows four times. → N9
- PW-19 (min): Try it has no goal. → N9
- PW-20 (pol): the toast covers the footer buttons. → N9
- PW-22 (pol): an eye icon opens Appearance. → N9, D13
- PW-23 (pol): Home repeats words and misaligns the shelf. → N9
- PW-M4 (min): the mirror control is labelled "Apply to". → N9

**Big ideas kept for later**
- A move diagram per piece, from the Workshop presets (ONB): L. It removes rule text.
- Typed moves for non-visual play (A11Y): L. It adds a feature, but it is the only way to play by phone screen reader.
- Hold on a piece to see its reach (ONB).
- Title kings as doors to "Play as the Frost king" (PW).

**Refuted and removed:** SET-20 (the account does store a rating) and PW-11 (the blank start is an owner rule).

## 9. Owner decisions

**D1. First opponent level.** *Rule: a player with no finished game meets the Casual computer.* Reverses Round 3 (docs/visual-design/README.md: Club is the default).
- A) Club for everyone (today; Club plays the same as Strong at 800 ms).
- B) Casual until the first finished game, then the remembered choice.
- C) Beginner until the first finished game.
- **Pick: B.** On yes:
  - Change `new-game.ts:33-37` and `main.ts:85`.
  - Add the flag.
  - Add one level line under the row.

**D2. Phone controls.** *Rule: on phones and in landscape, game actions sit in one bottom bar, and navigation sits in one Menu sheet.* Reverses commit a8fd7d0, revision 3 §12.1 item 14, docs/WORKSHOP.md:11 ("Workshop button in the game bar") and the Round 1 panel ("icon over the label").
- A) Keep 4 tiles plus 3 tiles (7 buttons in 2 rows). Only put the actions first and the menu last (SET-2, step 1).
- B) A bar of 5 at all sizes. The Workshop is 2 taps away.
- C) B on phones and in landscape only. Desktop and tablet keep the 4 buttons as a quiet toolbar.
- **Pick: C.** On yes:
  - The phone Menu sheet holds New game, Guide, Workshop, Settings, Resign and Home.
  - Update WORKSHOP.md:11 and the phone checks that click `#workshop-btn`.

**D3. Computer strength.** *Rule: each level is a different opponent.* Changes the state recorded in docs/PLAYABLE-CLAY.md:14.
- A) Today: Strong uses the Thinking time slider, default 800 ms, which equals Club.
- B) Strong gets a fixed 2.5 s, set in the caller (`main.ts:688`, so the simulations do not change). Delete the slider.
- C) B, plus "Strong thinks: 1 s | 3 s | 5 s" in More options.
- **Pick: B.** On yes:
  - Change `play.test.ts:12`.
  - Remove `think` from `account/sync.ts:21` and from the Save interface.
  - Read an old saved value once, to migrate it.

**D4. Lab switch.** *Rule: players see only player features; the designer's tools sit behind `?lab=1`.* Reverses Round 3 More options (example armies, Ogre practice) and the 2026-09-27 decision in docs/painted-game/README.md ("Look in Settings switches to Clay 3D").
- A) Today: 14 army entries; Look, Thinking time and "This game" in Settings.
- B) `?lab=1` (remembered) shows them in a Lab group. The public app gets 3 armies and the Painted look only.
- C) B, but keep a "Use Clay 3D (reloads the page)" button for everyone.
- **Pick: B.** On yes:
  - Custom army becomes an inline 8-slot field that checks the one-beast rule as you type.
  - Ogre practice can move to the lessons.

**D5. King picker.** *Rule: New game with powers opens only your own picker.* Reverses Round 3 ("both pickers open").
- A) Both open: 18 buttons, 1128 px, Start game out of view at all sizes.
- B) Yours open, the computer's as a summary row with Change: 9 buttons, about 870 px, sticky Start game.
- C) Both as summary rows: about 640 px, no scroll, but the vignettes hide until Change.
- **Pick: B.** On yes: the computer keeps Shadow with Death Touch as its default.

**D6. Board chips.** *Rule: the optional board chips show the rulebook icon, not a letter.* Reverses Round 4 ("the board's letter chips" keep LAN letters).
- A) Letters, about 10 px (today).
- B) Icons; the setting becomes "Piece icons", off by default and saved.
- **Pick: B.** On yes: the move list keeps its letters.

**D7. Last move.** *Rule: with Animations Off, the square a piece left is marked.* Reverses the 2026-10-04 decision (`main.ts:399`).
- A) Never marked (today).
- B) Only with Animations Off or reduced motion: a 2 px gold inset outline.
- C) Always marked (lichess and chess.com).
- **Pick: B.** On yes: the outline joins the darker wash of row 16.

**D8. Button and type look.** *Rule: only the primary action is raised, and Cinzel appears only at 18 px and larger.* Partly reverses Round 1 ("stone edges" look; Cinzel for piece names and headings).
- A) Today: every button has a gradient and a lift; Cinzel down to 8.5 px.
- B) Four button kinds with a 1 px under-edge on secondary buttons. Labels under 18 px use Alegreya Sans 700 in sentence case.
- **Pick: B.** On yes: the Guide card names, dialog titles, the wordmark and the result title stay in Cinzel.

**D9. First-run lessons.** *Rule: the first-run lessons teach only pieces of the random draw.*
- A) 6 lessons, with the Paladin (today).
- B) 5 lessons; the Paladin is a Bonus lesson after "Play your first game".
- **Pick: B.** On yes: "Lesson 1 of 5", and the Guide and title copy say "5 short lessons".

**D10. Tap on an enemy.** *Rule: a tap on an enemy piece shows its card, not a refusal.* Changes one refusal line of Round 1 ("That is Black's rook. White to move…").
- A) Refusal (today).
- B) The short card; the help line gives the name and one rule.
- **Pick: B.** On yes: all other refusal lines stay.

**D11. Material count.** *Rule: the game shows who is ahead in material as +N.*
- A) No count (today).
- B) +N from the engine values, from the pieces on the board.
- **Pick: A, until you set official values for the six new pieces.** docs/RULES.md:219-221 says the engine values are disputed. On yes: compute the count from the board, not from the capture lists.

**D12. Around the board.** *Rule: the area round the board is the title's night stage.* Reverses the Round 1 parchment look round the board.
- A) The light floor `#e6e1cf`, with the rail the same colour (VIS-10).
- B) The night stage. It needs a floor parameter in `scene.mjs` (motion track) and a contrast check for the black figures.
- **Pick: A now.** Ask again after B1. On yes to B: the motion track makes the scene floor a parameter.

**D13. Workshop appearance control.** *Rule: Appearance opens from a labelled button.* Reverses revision 3 §12.5 (the eye icon).
- A) The eye (today).
- B) A "Look" button (44 px). A tap on the figure opens it too.
- **Pick: B.** On yes: keep `aria-label="Choose appearance"`.

**D14. Feature reveal.** *Rule: new players see all features from the first visit.* Option B reverses docs/WORKSHOP.md (Workshop on the title) and the Round 3 Kings' powers card.
- A) Everything visible (today).
- B) Workshop and Kings' powers appear after the first finished game.
- C) Everything visible; the Workshop is a quiet text button on the title.
- **Pick: C.** On yes: the title has 2 strong buttons, not 3.

**D15. New game structure.** *Rule: New game has three mode cards.* Option B reverses Round 3 ("3 top buttons").
- A) Three cards (today); fix the row height of the two-player powers box (SET-10).
- B) Two cards (Computer, Friend) plus a "Kings' powers: Off | On" row.
- **Pick: A.** You asked for three cards on 2026-10-03, and D5 already removes most of the length.

**D16. Result "New game".** *Rule: one label has one meaning.*
- A) An instant random army that ignores the saved army (today).
- B) "New game…" opens the dialog with the last setup.
- C) "Next game" starts at once with the saved army.
- **Pick: B.** On yes: Rematch stays the one-tap path, and Close becomes Review.