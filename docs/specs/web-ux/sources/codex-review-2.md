# King Down Chess: independent UI and UX review

Review date: 8 October 2026. Scope: the supplied app build and source.

## 1. Summary

King Down has strong art, clear piece names, and useful help during play. The painted board and the short lessons give it a sound base. The first large problem is the split between learning and starting a full game. The second is the screen layout: controls compete with play, and tablet and landscape space is poorly used. The third is the amount of setup and rule text that a player must read before using powers. Keep the art, the three game modes, and the emblem picker. Put the board, the current task, and the next action first; move other controls into one menu. Fix game replacement, resignation, and keyboard access before adding more features.

### Scope and evidence

I inspect **all 141 supplied images**: 23 screens at five sizes, one Clay screen, and 25 dialog end views. The five sizes are 1440×900, 1280×720, 820×1180, 390×844, and 844×390. I check source before I state that a feature is absent. I do not read another review folder or any session transcript.

The local server returns HTTP 200. Headless Chrome cannot start in the sandbox. The public URL fetch also fails in the web tool. Thus, this report does **not** verify that the public deployment matches the supplied build. It does not claim a live device test, an audio test, or a full WCAG audit. Workshop views after Home receive a source review only. Proposed dimensions are design targets. Current canvas sizes are CSS calculations; screenshot positions are approximate.

Evidence uses paths from `/Users/za/Documents/king down chess`, such as `src/main.ts:1092`. Screenshot paths start at `../shots/`. The file [review-evidence.md](review-evidence.md) records the method. [contrast.json](contrast.json) records the colour calculations. A screenshot name without `-end` shows the initial view. The capture script makes an end image only when overflow exceeds 40 px. No end image does not prove that a dialog fits.

### Terms and sources

**N** means a new player, with little or no chess knowledge. **E** means an experienced chess player. **Both** means both groups. A **rail** is the side panel. A **sheet** is a dialog. A **target** is the area that accepts a click or tap. A **token** is a shared design value.

I use Nielsen's principles of status, control, consistency, error prevention, recognition, efficiency, minimal design, and help. The findings apply those principles to this app. [Nielsen's ten heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

WCAG references name criteria from WCAG 2.2. AA conformance includes the A criteria. Normal text needs 4.5:1 contrast; large text needs 3:1. Required visual parts of controls need 3:1 against adjacent colours. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

The AA target rule is **24×24 CSS px**, with stated exceptions, including spacing. It is not a blanket 44 px rule. I set a higher product target of 44×44 CSS px for touch controls. Apple recommends 44×44 points for its platforms; points and CSS pixels are not the same unit. [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Apple control guidance](https://developer.apple.com/design/tips/)

## 2. What to keep

- **The painted figures and stone board.** They make the game distinct. Keep Painted 2D as the default. Evidence: `04-game-idle-desktop.png`, `04-game-idle-phone.png`; `docs/painted-game/README.md:5`. Principle: aesthetic-usability.
- **The twelve-piece title lineup.** It shows the game's range before play. Keep the owner's full lineup. Evidence: `01-title-first-phone.png`; `docs/visual-design/README.md:11`. Principle: recognition.
- **Shape-based move marks.** Gems, capture brackets, swap arrows, push chevrons, and power runes carry different meanings. Keep these shapes. Evidence: `05-game-selected-phone.png`, `18-powers-armed-phone.png`; `src/render/marks.ts:7`. Principle: WCAG 1.4.1.
- **One-move lessons and contextual rule messages.** A player can learn by doing. A lesson preserves the saved game. Evidence: `16-lesson-phone.png`; `src/lessons.ts:14`, `src/main.ts:631`, `src/moment.ts:71`. Principle: recognition and error recovery.
- **Three setup modes, hidden More options, and six king emblems.** This is a better base than a long form. Evidence: `10-new-game-phone.png`, `11b-new-game-frost-phone.png`; `src/new-game.ts:129`. Principle: progressive disclosure.
- **Existing access and recovery features.** Keep tap-tap and drag play, keyboard play, Undo, move announcements, visible focus, and motion controls. Evidence: `index.html:31`, `index.html:76`, `src/main.ts:981`, `src/main.ts:1339`, `src/render/PaintedView.ts:94`. Principle: WCAG 2.1.1, 2.5.7; user control.
- **Direct Rematch and the fallen king.** The result has a clear next action and a fitting visual end. Evidence: `23-result-phone.png`; `src/main.ts:1028`, `src/main.ts:1086`. Principle: efficiency and peak-end.

## 3. Design principles for King Down's UI

1. Keep every board square and the current action visible at all five test sizes.
2. Show one current instruction; keep full rules behind the selected piece or power.
3. Let a new player make a special move after one title action and two board taps.
4. Keep Hint and Undo one action away; put infrequent commands in one Menu.
5. Keep the three game modes; show detailed choices only after the player asks for them.
6. Use one type scale, three button styles, and 44 px touch controls outside the board.
7. Give each move, power, error, and result a text meaning as well as a visual cue.

## 4. The simplification

### Today's screen map

```text
Title
├─ Learn the pieces → lesson 1 → ... → lesson 6 → New game
├─ Play → New game → Game
├─ Continue → saved Game
└─ Workshop → Home → figure choice → editor → Try it

Game
├─ New game → 3 modes → level / two-player powers box
│             ├─ powers: 2 full king-and-power pickers
│             └─ More options: side + army → custom prompt
├─ Guide → 12+ piece cards → pool + notation → 12 powers
│          └─ Learn → lesson 1
├─ Workshop → Home
├─ Settings → Play + Board + This game + Account
├─ Hint / Undo / Resign
├─ selected piece → help + Cancel + rule card
├─ power → arm → choose target / piece → move / end turn
├─ move list → review → tap board or Escape to return
├─ two players → send a new game link after a move
├─ promotion / capture-or-push dialog
└─ Result → Rematch / New game / Close / up to 3 key moments
```

Evidence: `index.html:38`, `index.html:117`, `index.html:172`, `index.html:227`, `src/main.ts:678`, `src/main.ts:1262`, `src/main.ts:1484`; `docs/WORKSHOP.md`, “Screens”. “Try these” is not a separate current screen. Its four entries become army options. Three are Catapult lab armies (`src/try-these.ts:1`, `src/main.ts:1262`).

### Proposed screen map

```text
Title: Try one move / Play / quiet Menu
├─ Try one move → Archer lesson → Play beginner game / Next piece
├─ Play → New game: Computer / Kings' powers / Two players
├─ Continue replaces the leading action when a game is saved
└─ Menu → Learn / Workshop / Settings

Game: board + turn + one context area + Hint / Undo / Menu
├─ context → piece rule OR armed power OR review controls
├─ own power: Use / Cancel; opponent power: name + state + details
├─ Moves: always open on desktop; a disclosure on small screens
└─ Menu → New game / Learn / Workshop / Settings / Turn board / Resign

Learn: lessons + piece reference + powers + practice armies
New game: 3 modes + current setup summary + More options + Start
Settings: Play and appearance + Advanced + collapsed Account
Workshop: separate place to build and test; same saved-game return
Result: result + Rematch + Review; Change setup is a quiet action
```

**Learn replaces the Guide label.** It holds the existing Guide and lessons. It does not create a second reference system. Keep a direct piece rule from the board. Practice army labels describe the action they teach. Keep raw army codes in details and copy tools.

### Control count

Count each button, radio choice, select, and disclosure once. Include disabled controls when they occupy visible space. Exclude board squares, variable move entries, and controls inside a closed disclosure. Count all controls in an open dialog, even if the player must scroll to them. These are comparable inventories, not claims about attention or task time.

| State | Today | Proposal | Removed, merged, hidden, or moved |
|---|---:|---:|---|
| First title | 3 large actions | 2 large actions + 1 quiet Menu | Move Workshop under Menu. Total remains 3. |
| Returning title | 4 large actions | 2 large actions + 1 quiet Menu | Keep Continue and Play. Move Learn and Workshop under Menu. |
| Desktop game, fixed controls | 7 | 3 | Keep Hint, Undo, Menu. Move four navigation actions and Resign into Menu. |
| Phone game, fixed controls | 7 | 4 | Same three, plus Moves disclosure. Four fewer large command buttons; one new disclosure. |
| Phone, piece selected | 8 | 6 | Four fixed controls + Details + Cancel. Merge three help blocks into one. |
| Lesson before its goal move | 8 | 2 | Keep Exit lesson and Hint. Hide four game navigation buttons, Undo, and Resign. |
| Computer setup, More closed | 10 | 6 | Three modes + More + Cancel + Start. Move four level choices into More. |
| Computer setup, More open | 13 | 13 | Keep full choice. Show level, side, and army here. |
| Powers setup, More closed | 28 | 16 | Hide levels. Keep 9 own-picker controls. Replace 9 opponent controls with one Change action. |
| Powers setup, opponent expanded, More closed | 28 | 24 | All 18 king/power choices stay available. Levels remain in More. |
| Two-player setup, powers off | 7 | 9 | Add Same device and By link within this mode. This is a deliberate increase. |
| Promotion, ordinary four-piece set | 5 | 5 | Change layout only: four choices and Cancel. |
| Result, without key moments or share | 3 | 3 | Rematch, Review board, Change setup. Use Review board as the close action. |

Current count evidence: `index.html:39`, `index.html:47`, `index.html:55`, `index.html:119`, `index.html:131`, `index.html:140`, `src/new-game.ts:100`, `index.html:250`. Proposed counts are design targets. The Menu keeps the moved actions. It does not delete their functions.

The main removal is **repeated content**. Game choices remain available. Delete the separate generic move-help card when the context area gives the same instruction. Remove empty captured-piece rows. Remove full power rules from every selected-piece card. Stop making an almost empty move list fill the whole rail.

### What experienced chess players expect

Use these products as references for task structure. Keep King Down's own art and rule marks.

| Need | Reference | King Down today | Decision |
|---|---|---|---|
| Board focus | Chess.com Focus mode enlarges the board and reduces surrounding content. | The board fits, but the rail holds seven equal-weight commands and a large empty move list. | Make the normal layout quiet. Do not add another display mode yet. |
| Position review | Lichess documents previous/next controls and a direct move review path, including touch access. | Clickable moves and arrow keys exist. Touch has no visible step controls. | Add Previous, Next, and Live only in review. |
| Material | Chess.com places captures under player names and shows a material difference. | Grouped capture icons exist. A material difference does not. | Group captures by player. First show piece counts; keep any value estimate inside Moves details. |
| Access | Lichess documents board navigation, named squares, and touch use with a screen reader. | Keyboard cursor and spoken moves exist. The painted board remains one application region with a canvas. | Keep keyboard play. Add a semantic square representation and test touch reading. |
| Fast replay | Common chess-app practice keeps rematch separate from a new setup. | Rematch already starts the same army with player sides swapped. Result “New game” starts a random game directly. | Keep one-action Rematch. Name the other action “Change setup” and open setup. |

Sources: [Chess.com Focus mode](https://support.chess.com/en/articles/8588088-what-is-focus-mode-how-do-i-turn-it-on), [Chess.com captures and material](https://support.chess.com/en/articles/8708638-how-can-i-see-the-captured-pieces-and-material-count), [Lichess access and review guide](https://lichess.org/page/blind-mode-tutorial). Local evidence: `src/main.ts:440`, `src/main.ts:455`, `src/main.ts:1083`, `src/main.ts:1326`, `index.html:31`.

Do not add clocks, ratings, chat, premoves, or an evaluation bar to solve the current layout problem. The brief does not need them. Keep LAN move text for the variant. Explain it on demand; do not replace it with an assumed standard-chess notation.

## 5. Proposed layouts

### Current fit: where the space goes

Canvas width includes the scene border. It is not the width of the eight playable squares. Calculations use `src/style.css:72`, `src/style.css:628`, `src/style.css:701`, and `src/render/PaintedView.ts:84`.

| Size | Calculated canvas width | What the supplied view shows | Required change |
|---|---:|---|---|
| Desktop 1440×900 | 776 px | Board is large. A 272 px rail is narrow for prose. The header is a separate floating box. | Centre board and rail as one group. Use a flat header and 320 px rail. |
| Laptop 1280×720 | 607 px | The board fits without page scroll. The move list takes about 480 px for one turn. | Keep board fit. Bound the move list and shorten the rail. |
| Tablet 820×1180 | 516 px | Board frame is about 510 px wide. It starts near y=381. The rail consumes one third of the width. | Use a portrait layout. Put controls below a wider board. |
| Phone 390×844 | 365 px | Board frame is about 360 px. The panel starts near y=450 and scrolls internally. | Keep board width. Remove one command row and merge help. |
| Landscape 844×390 | 298 px | Board frame is about 294 px. The header overlaps its upper edge. Right-panel content scrolls. | Use a dedicated short layout. Remove the floating header. |

Evidence: `04-game-idle-desktop.png`, `04-game-idle-laptop.png`, `04-game-idle-tablet.png`, `04-game-idle-phone.png`, `18-powers-armed-landscape.png`. The current page uses hidden overflow. A lack of page scroll can conceal panel overflow (`src/style.css:85`, `src/style.css:140`).

### Desktop and laptop

Use this layout when width is at least 1000 px and height exceeds 500 px.

- Use a 48 px top bar. Set the brand to 18 px Cinzel. Put the turn in 16 px bold body type.
- Place the board and rail in one centred row. Use a 24 px gap and a 320 px rail.
- Start the row at y=56. Leave 8 px below it. The board scene has a height budget of `viewport height − 64 px`.
- Keep the scene's 960:1024 ratio and its headroom. This gives a canvas near 783 px at 1440×900 and 615 px at 1280×720.
- The rail shows player and level, captures, one context area, Hint and Undo, then Moves. Menu sits in the top bar.
- Give the context area 96 px in ordinary play. It can grow for a special move. Keep Hint and Undo in fixed positions.
- Cap a short move list at 240 px. Let a long list use the rail's remaining height. Scroll the list, not the whole play rail.
- Put both king power summaries together. Show one line per side. Expand the selected power's rule in the context area.

```text
┌ King Down       Your turn · White                         Menu ┐
│                                                              │
│   ┌────────────────────────────┐   Computer · Club            │
│   │                            │   captured icons             │
│   │                            │   ─────────────────────────  │
│   │           BOARD            │   Pawn · d2        Details   │
│   │                            │   Choose a marked square.   │
│   │                            │                    Cancel   │
│   │                            │   Hint       Undo           │
│   └────────────────────────────┘   Moves                     │
│                                    1. e2-e4       e7-e5      │
└──────────────────────────────────────────────────────────────┘
```

At 1280×720, no core control needs page scroll. A long rule opens as a sheet. Do not make the board smaller to hold a full rulebook paragraph.

### Tablet portrait

Use the portrait layout below 1000 px, except for the short landscape rule.

- At 820×1180, centre a scene up to 736 px wide. Its height is about 785 px.
- Use the same 48 px header and 8 px gap. The scene ends near y=841.
- Put a 48 px action row below it. Put short context next to, or below, that row within the same 736 px width.
- Use a Moves disclosure below the context. Keep captures beside player labels in that section.
- Use a sheet up to 640 px wide for setup or reference. Avoid the current narrow side rail.
- Keep every ordinary control at least 44 px high. Use 16 px body text.

This raises the scene width from a calculated 516 px to 736 px, about **43%**. It uses the empty vertical space already present. Evidence: `04-game-idle-tablet.png`, `16-lesson-tablet.png`, `17-powers-game-tablet.png`.

### Phone portrait

At 390×844, use a 48 px header and 12 px side margins for controls. Let the board scene use about 366 px width. Do not inset it inside another card.

```text
┌ King Down        Your turn · White ┐ 48 px
│                                   │
│               BOARD               │ about 390 px scene height
│                                   │
├ Pawn · d2                 Details ┤
│ Choose a marked square.    Cancel │ 72 px context budget
├──────────┬──────────┬─────────────┤
│   Hint   │   Undo   │    Menu     │ 48 px
├───────────────────────────────────┤
│ Moves · 1...e7-e5               ▾ │ 44 px
└───────────────────────────────────┘
```

A power game adds one 48 px own-power row near the context. An armed power replaces the piece instruction. It does not append a second full rule block. Place the opponent's power name in the status/context summary; open its rule on tap.

Core play should fit in about 700–750 px, including gaps and a safe bottom inset. Keep the board and action row stable. Let expanded Moves and full rules scroll in a sheet. On a shorter phone, the content can scroll; do not reduce text to force fit.

In the current captures, Hint, Undo, and Resign move from y≈535 in idle play to y≈733 after selection. Captures fall below the fold. In the power capture, Use Freeze **is visible** at y≈738; the main problem is the long path through rules above it. Evidence: `04-game-idle-phone.png`, `05-game-selected-phone.png`, `17-powers-game-phone.png`.

### Phone landscape

Use a height rule, not only a width rule: landscape with height at most 500 px. This includes 844×390, which the current 720 px phone breakpoint misses.

- Put the scene on the left and the control area on the right.
- At 844×390, give the scene about 350×373 px, with 8 px top and bottom space.
- Give the right area the remaining width, about 450 px before safe-area adjustment.
- Put turn and player at its top. Use up to 80 px for the current instruction.
- Put the power action next. Collapse Moves. Keep Hint, Undo, and Menu in a 44 px bottom row.
- Remove the floating brand card. Keep a small brand in the right header.
- Board squares will be about 41 px. They exceed the AA minimum but fall short of the 44 px product target. Do not make false 44 px claims.

```text
┌───────────────────────┬───────────────────────────────────┐
│                       │ Your turn · White                 │
│                       │ Freeze · 1 use                     │
│        BOARD          │ Choose an enemy piece.             │
│                       │ Cancel Freeze                      │
│                       │ Moves                         ▾    │
│                       │ Hint        Undo         Menu      │
└───────────────────────┴───────────────────────────────────┘
```

Add `env(safe-area-inset-*)` to outer controls. The supplied desktop-style mobile view does not test a real notch or browser toolbar.

### New-player flow at all sizes

**Shortest path to a special move:** title → Try one move → tap Archer → tap marked pawn. This is three deliberate actions. The existing Archer lesson already supports this path (`src/lessons.ts:16`). The proposal improves its framing and removes unrelated controls.

1. Title says: **“Chess with new pieces.”** Its main action says **“Try one move.”** Play remains beside it or below it.
2. The lesson shows the task before the board: **“Select the Archer. Then select the marked pawn.”** The first tap reveals the shot mark.
3. After the shot, say: **“The Archer shoots without moving.”** Show **Play beginner game** and the quieter **Next piece**.
4. A player can continue through all six pieces. Do not require six lessons before play.
5. Direct Play keeps the owner's three-mode setup. Start on Beginner for a first visit. Preserve a returning player's chosen level.
6. In the first full game, show: **“You play White. Select a piece to see its moves.”** Keep a small **Chess basics** entry within Learn. Teach check and the win condition there.

| Size | Title and lesson placement |
|---|---|
| Desktop/laptop | Keep the king art and twelve-piece row. Put actions below a one-line game description. Lesson uses board plus a small task rail. Hide the full game menu and move history. |
| Tablet | Use two rows of six title pieces with 12 px names. Centre the board. Put the lesson task directly above it and the next action below it. |
| Phone portrait | Keep two rows of six. Use 12 px names, 48 px actions, and a smaller king stage. Put task before board so it is read before the first tap. |
| Phone landscape | Remove the separate six-king stage in this short view. Keep all twelve pieces in two rows beside the title/actions. In lessons, put the task in the right area beside the board. |

The full lineup remains. The landscape stage change does not remove the owner's twelve-piece lineup. The first-level change does reverse the accepted Club default; see D1.

## 6. Visual direction

### Small token set

Keep the current fonts. Let the figures carry the detail. Make the surrounding controls quieter. The source already has useful tokens (`src/style.css:23`). Consolidate one-off values into these roles.

| Role | Value | Rule |
|---|---|---|
| Game floor | `#e6e1cf` | Keep the painted scene's current floor. Avoid a visible seam around its canvas. |
| Surface | `#f3ead7` | Main panels; current parchment. |
| Raised surface | `#fbf7ee` | Dialogs and fields; current vellum. |
| Selected surface | `#e7d8b8` | Quiet selected rows. Do not use as text. |
| Main text | `#2b2621` | Body, control labels, and piece names. |
| Secondary text | `#5b5045` | Descriptions and counts. No opacity reduction. |
| Required control edge | `#8a8072` | Fields and neutral button edges. |
| Quiet divider | `#c9bfac` | Decoration only. It does not identify a required control. |
| Main action | `#842c21` | One leading action in each sheet or task area. |
| Main action pressed | `#5a1c14` | Pressed state. |
| Error/check text | `#b0251b` | Include an icon or word. Keep renderer check red as an art token. |
| Focus | `#1c5bb0` | 3 px outer ring, with 2 px surface gap. Use a light ring on dark surfaces. |
| Dark stage | `#221d18` | Title background. Also use in a small brand detail if needed. |
| Text on dark | `#f3ead7` / `#d6c9ad` | Main / secondary title text. |
| Ornament | `#c99a3e` | Small gold edges and art. Never normal text on parchment. |
| Gold text | `#7a5712` | Use only when gold text has a clear purpose. |

All colours come from `src/style.css:25` or `src/style.css:698`. This proposal does not require new brand colours.

| Token group | Proposed values | Change from today |
|---|---|---|
| Body type | Alegreya Sans, 16/24 px, weight 400 | Raise 15.5 px to 16 px. |
| Control type | Alegreya Sans, 16/20 px, weight 700 | Stop using 12.5 px for main navigation. |
| Small type | Alegreya Sans, 14/20 px | Replace most 12.5 px rule text. Reserve 12 px for nonessential figure captions. |
| Section title | Cinzel, 20/26 px, weight 700 | Use for sheets and sections, not every label. |
| Result title | Cinzel, 28/34 px, weight 700 | Keep the result distinct. |
| Wordmark | Cinzel, 48–88 px; 32 px in short landscape | Keep the brand treatment within the screen. |
| Spacing | 4, 8, 12, 16, 24, 32 px | Keep the existing six-step set. |
| Radius | 6 px controls; 12 px sheets | Replace 4, 5, 8, 12, and 14 px variants. |
| Border | 1 px neutral; 2 px selected | Remove stacked outline frames. Keep focus separate. |
| Elevation | None for ordinary controls; `0 8px 24px #2b262129` for sheets | Remove the hard 2 px button lift and most inset shadows. |
| Motion | 100 ms press; 160 ms selection; 200 ms sheet; 400 ms result | No repeated motion in ordinary controls. Keep art motion under the existing pace setting. |
| Touch | 44×44 px minimum; 8 px preferred gap | Apply by input and height context, not width alone. |

### Contrast checks

These ratios use the WCAG relative-luminance formula. They measure exact solid colour pairs. They do not measure textured art, transparency, or every gradient pixel.

| Pair | Ratio | Assessment |
|---|---:|---|
| `#2b2621` on `#f3ead7` | 12.53:1 | Pass, normal text. |
| `#5b5045` on `#f3ead7` | 6.56:1 | Pass, secondary text. |
| `#2b2621` on `#fbf7ee` | 14.01:1 | Pass, dialog text. |
| `#fbf7ee` on `#842c21` | 8.31:1 | Pass, primary button text. |
| `#fbf7ee` on current gradient top `#9c3a2d` | 6.43:1 | Pass at this endpoint. |
| `#7a5712` on `#f3ead7` | 5.49:1 | Pass, gold text. |
| `#b0251b` on `#f3ead7` | 5.62:1 | Pass, error text. |
| `#1c5bb0` on `#f3ead7` | 5.54:1 | Pass, focus indicator against this surface. |
| `#8a8072` on `#fbf7ee` | 3.63:1 | Pass for a required control edge; not normal text. |
| `#c9bfac` on `#fbf7ee` | 1.70:1 | Use only for optional dividers or decoration. |
| `#f3ead7` on `#221d18` | 13.97:1 | Pass, title text on the base dark colour. |
| `#d6c9ad` on `#221d18` | 10.20:1 | Pass, secondary title text on that base. |
| `#c99a3e` on `#f3ead7` | 2.15:1 | Not enough for text or a sole required state cue. |
| Hint stroke `#c99a2e` against floor `#e6e1cf` | 1.97:1 | Warning pair only. Actual hint marks sit on textured squares, which need pixel tests. |

The palette is not broadly low contrast. Small text, heavy framing, and weak hierarchy are the larger visual problems. Do not report decorative borders as AA failures. Test the hint, selected, check, and threat marks against both rendered square colours. Keep the dark/light halos already used by move marks (`src/render/marks.ts:58`).

### Component rules

- Use **three button styles**: filled main action, outlined secondary action, and quiet text action. Keep text labels on game controls.
- Put icons beside labels in ordinary rows. Do not stack an icon over a two-line label unless width makes it necessary.
- Keep the rulebook's piece icons. Keep their names beside them in learning and choice screens.
- Use one context component for selection, refusal, power use, lesson task, and review. These states replace each other.
- Put Cancel at the right of the context area, with a 44 px target. Preserve Escape and deselection by board input.
- Use a fixed sheet header and footer. Only the body scrolls. A footer must not cover focused content.
- For four promotion choices, use 2×2 on phone and one row of four when width allows. Do not use the current 3+1 pattern.
- Give Capture and Push equal neutral treatment. The question has two valid answers; neither needs a default main-action colour.
- Remove the frame and shadow from the in-game brand header. Keep ornament on title and result.
- Keep Clay in Settings. Use the same control system, accessible names, and marker meanings in both looks.

## 7. Ranked changes

Impact: **H** changes a main task or prevents a serious error; **M** reduces repeat effort; **L** improves finish. Effort: **S** is a local change; **M** changes a component or flow; **L** changes a layout or several linked states. These are design estimates, not delivery dates. Order within each group reflects priority. “Simplifies” means fewer visible choices, repeated blocks, or steps. It does not always mean less code.

### Quick wins

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F10 | Game | Resign the human side, including during computer thinking. | Error prevention | Both | H | S | No |
| F09 | New game | Warn at Start when it replaces an unfinished game. | Error prevention | Both | H | S | No |
| F21 | Game | Limit single-letter shortcuts to board focus; document keys. | WCAG 2.1.4 | Both | H | S | No |
| F19 | Dialogs | Keep actions visible; use four-across or 2×2 promotion. | Fitts; WCAG 2.4.11 | Both | H | M | Yes |
| F06 | Hint | Give a named move in the context line and announce it. | Status; WCAG 4.1.3 | N | H | S | Yes |
| F11 | New game | Move level choices into More; keep a setup summary. | Hick; progressive disclosure | Both | M | S | Yes |
| F13 | More options | Replace raw army names with task names and icon strips. | Recognition | N | M | S | Yes |
| F14 | Settings | Hide advanced time control and collapse Account. | Minimal design; common region | Both | M | S | Yes |
| F24 | Result | Keep Rematch; shorten result text; expose Review clearly. | Peak-end; consistency | Both | M | M | Yes |

### Next

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F28 | Game navigation | Replace seven fixed controls with Hint, Undo, and Menu. | Hick; minimal design | Both | H | M | Yes |
| F05 | Selection | Merge help, Cancel, and the piece card in one stable area. | Proximity; consistency | Both | H | M | Yes |
| F16 | Powers in play | Keep two short power summaries; show one current instruction. | Status; recognition | Both | H | M | Yes |
| F07 | Review | Show Previous, Next, and Live; preserve focus. | User control; WCAG 2.4.3 | Both | H | M | No |
| F20 | Touch | Apply touch sizes beyond the phone breakpoint; add safe insets. | Fitts; WCAG 2.5.8 | Both | H | M | No |
| F22 | Feedback | Report actual copy success; unify pending and error messages. | Status; error recovery | Both | H | M | Yes |
| F23 | Board access | Add semantic square access and named nonvisual states. | WCAG 1.1.1, 4.1.2 | Both | H | L | No |
| F08 | Moves/captures | Show captures for the viewed position; hide empty rows. | Status; chess convention | E | M | M | Yes |
| F17 | Visual system | Reduce button, border, shadow, and type variants. | Consistency; minimal design | Both | M | M | Yes |
| F27 | Motion | Show legal marks at once; keep short art responses. | Doherty; user control | Both | M | M | Yes |

### Bigger redesign

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F04 | Responsive game | Use a portrait tablet layout and a short landscape layout. | Proximity; Fitts | Both | H | L | Yes |
| F01 | First run | Explain the game; start new players on Beginner. | Match to user; error prevention | N | H | M | Yes |
| F02 | Lessons | Use a lesson-only shell; allow play after one lesson. | Progressive disclosure | N | H | M | Yes |
| F12 | Power setup | Show own picker; fold the opponent picker behind Change. | Hick; progressive disclosure | Both | H | M | Yes |
| F15 | Two players | Separate same-device and link play inside the mode. | Match to user; error prevention | Both | H | M | No |
| F03 | Learn/Guide | Put current pieces and actions before the full reference. | Recognition; help in context | Both | M | M | Yes |
| F18 | Title/game/Clay | Keep one art identity and remove the floating game frame. | Aesthetic-usability; consistency | Both | M | M | Yes |
| F25 | Workshop Home | State its purpose and limits; move it out of the main play row. | Match to user; minimal design | N | M | S | Yes |
| F26 | Workshop editor | Start from a usable sample; move the full figure choice later. | Hick; progressive disclosure | N | M | L | Yes |

## 8. Full finding list by area

### First run, onboarding, and learning

#### F01 — The first screen does not explain the game or set a gentle first match

**Screens:** title, first Play, first game; all five sizes. **Severity:** major. **Simplifies:** yes; better defaults remove a decision before play.

**Evidence:** `01-title-first-phone.png`, `01-title-first-desktop.png`, `02-after-title-play-phone.png`, `02-after-title-play-landscape.png`; `src/new-game.ts:33`; `src/main.ts:1401`, `src/main.ts:1484`. The title text names pieces and actions. It gives no game promise or goal. Play opens setup with Club selected. Cancel closes setup onto the board that the app already creates.

**Problem:** “Chess” does not explain what changes here. A new player must choose a level without knowing its meaning. A player who cancels setup can reach a game without choosing Start. An experienced player may assume castling and en passant work.

**Principle:** match between the system and the user's world; error prevention; casual-game onboarding.

**Recommendation:** Add “Chess with new pieces” below the wordmark. Keep Try one move as the first-visit main action. Use Beginner for a first match. Preserve a returning player's setting. Keep the three setup modes. In the first game, say “You play White. Select a piece to see its moves.” Put “No castling or en passant” in the setup summary's details and Learn. If no match has started, Cancel returns to the title. Keep Continue direct for a saved match. Changing the Club default reverses the accepted Round 3 setup baseline.

**Check:** A first-time player can state their side, choose a piece, and make a legal move without opening Settings.

#### F02 — Lessons keep too much of the game interface

**Screens:** first lesson and its next-step flow; all five sizes. **Severity:** major. **Simplifies:** yes; reduce eight visible controls to two before the goal move.

**Evidence:** `16-lesson-desktop.png`, `16-lesson-tablet.png`, `16-lesson-phone.png`, `16-lesson-landscape.png`; `src/main.ts:475`, `src/main.ts:619`, `src/main.ts:648`, `src/main.ts:678`; `src/lessons.ts:14`. New game, Guide, Workshop, Settings, Return to game, Hint, Undo, and Resign remain visible. Some are disabled. The six progress icons are not lesson links. Learn always starts lesson 1, though completion is saved.

**Problem:** Disabled game commands and an empty move list compete with one simple task. “Return to game” is unclear on a first visit. The next action after each lesson leads through the sequence. A player can leave, but the screen does not offer a clear early path to a suitable match.

**Principle:** minimal design; progressive disclosure; user control.

**Recommendation:** Hide the game navigation, history, captures, Undo, and Resign in the lesson shell. Keep Exit lesson and Hint. Put the task before or beside the board. After success, offer Play beginner game and Next piece. If a saved match exists, show Return to game instead of Play beginner game. Within Learn, use the saved completion state to offer Continue lessons and a piece list. Keep all six lessons available. Do not gate pieces behind wins: `docs/PROGRESSION.md` is a proposal, not a shipped requirement.

**Check:** Complete the Archer shot at phone size without scrolling. Return to a saved match with the same board, side, powers, and history.

#### F03 — The Guide buries the parts that make King Down different

**Screens:** Guide and practice entry; all five sizes. **Severity:** major. **Simplifies:** yes; show a smaller relevant set before the full reference.

**Evidence:** `15-guide-phone.png`, `15-guide-phone-end.png`, `15-guide-laptop.png`, `15-guide-tablet.png`, `15-guide-landscape-end.png`; `src/main.ts:151`, `src/main.ts:290`, `src/main.ts:314`; `index.html:229`. The first phone view shows the Pawn, Knight, and part of Bishop. The six fairy pieces and twelve powers come later. The lead starts with “Mate the king.”

**Problem:** A chess player must scroll through familiar rules. A person who knows no chess does not receive a basic explanation of check and the goal. The power reference is a dense list far from the board. “Use button under the board” is not true on desktop, and passive powers have no Use button.

**Principle:** recognition; help in context; progressive disclosure; WCAG 3.3.2.

**Recommendation:** Rename Guide to Learn. Lead with Pieces in this game. Open the selected piece directly when help comes from the board. Put All pieces, Kings' powers, Chess basics, and Practice inside this one place. Use one expandable card per piece or power. Keep the shared rule source. For the goal, use “Win when the enemy king is under attack and no move can save it.” Keep castling and en passant differences in the chess-player summary. Say “Select Use beside your power” only for powers that need arming.

**Check:** From a selected Ogre, its push rule is one action away. A reader can reach a power rule without scrolling through twelve piece cards.

### Core play

#### F05 — Selection splits one task across three blocks

**Screens:** selected piece; all five sizes. **Severity:** major. **Simplifies:** yes; merge help, cancel, and rule text.

**Evidence:** `05-game-selected-phone.png`, `05-game-selected-laptop.png`, `05-game-selected-landscape.png`; `index.html:46`, `index.html:47`, `index.html:54`; `src/main.ts:336`, `src/main.ts:409`, `src/style.css:260`. The phone stacks a yellow help box, a separate half-width Cancel button, and a rule card. The action row moves down by about 198 px from idle.

**Problem:** Selecting a piece changes the panel's structure. A common Pawn action receives almost as much rule space as a new fairy piece. The reader must connect the help line with a separate card. Hover can also supply the card, so it does not always describe a selection.

**Principle:** proximity; consistency; minimal design.

**Recommendation:** Use one context area: “Pawn · d2”, a short action line, Details, and Cancel. Keep the action row below it stable. Put the complete move rule in Details. For a special piece, show its special action first. Label hover information as a preview, or update only the compact name. Keep Finish chain in this area when the Beast needs it. Do not remove Cancel's visible escape route.

**Check:** Tap Pawn, Ogre, then empty ground. Hint and Undo stay in the same place. A keyboard user can cancel without finding the board again.

#### F06 — Hint marks two squares but does not explain the move

**Screens:** Hint; all five sizes. **Severity:** major. **Simplifies:** yes; reuse the context area instead of adding a help surface.

**Evidence:** `06-game-hint-phone.png`, `06-game-hint-desktop.png`, `06-game-hint-landscape.png`; `src/main.ts:885`, `src/render/marks.ts:144`. Hint sets `hintSquares` from the suggested move. It does not write a named move to a live region. Both squares receive the same gold outline.

**Problem:** A new player must infer which piece moves and which square is the target. A shot or swap is harder to infer than a normal move. Gold on a light textured square can be weak. A screen-reader user receives no equivalent hint result from this handler.

**Principle:** visibility of status; recognition; WCAG 1.4.1, 1.4.11, 4.1.3.

**Recommendation:** While the request runs, show “Finding a move…” in the existing context area. Then state the move, for example “Move the pawn from d2 to d4.” Use the existing move-description logic for shots, swaps, and pushes. Announce that text. Give the source a piece-selection cue and the target its legal-action shape. Keep a dark/light outline around a hint on stone. Do not invent a strategic reason that the engine does not supply.

**Check:** Understand one ordinary hint and one Archer hint with colour removed, then with the board hidden from view.

#### F07 — Review is hard to control on touch, and its focus needs protection

**Screens:** move review and key-moment review; all five sizes. **Severity:** major. **Simplifies:** no; three explicit controls add clarity and access.

**Evidence:** `08-game-review-phone.png`, `08-game-review-landscape.png`, `08-game-review-desktop.png`; `src/main.ts:418`, `src/main.ts:440`, `src/main.ts:452`, `src/main.ts:897`, `src/main.ts:1333`. Move buttons and arrow-key review already exist. The touch help says only “Tap the board to return to the game.” Each refresh rebuilds the move buttons.

**Problem:** There is no visible Previous/Next control on touch. A board tap exits review, which is easy to confuse with selecting a piece for inspection. Replacing the focused move button can lose keyboard focus. This focus risk needs a runtime check; it is not verified here.

**Principle:** user control; chess-app convention; WCAG 2.4.3 and 2.4.7.

**Recommendation:** In review, replace ordinary play actions with Previous, Next, and Live game. After the game ends, name the last action Final position. Show “After 1. e2-e4” in the status. Keep arrow keys. Preserve the focused move element or restore focus after the list updates. Let a board tap inspect a piece during review; use Live or Escape to leave. Keep live board input locked until the user returns.

**Check:** Review ten moves using touch and keyboard. The displayed move, selected list item, captures, and focus all agree.

#### F08 — Captures use too much empty space and do not follow the reviewed position

**Screens:** idle game, capture history, review; all five sizes. **Severity:** minor. **Simplifies:** yes; hide empty rows and group useful state.

**Evidence:** `04-game-idle-laptop.png`, `04-game-idle-tablet.png`, `04-game-idle-phone.png`; `src/style.css:269`, `src/style.css:289`; `src/main.ts:455`. The rail stretches the move sheet into free space. Both captured-piece rows appear empty. The capture loop reads all game history without a review cutoff.

**Problem:** A large empty sheet looks like the main task on tablet. “White took” and “Black took” consume space before any capture. During review, captures can describe the live game instead of the viewed board. Experienced players also lack a concise material summary.

**Principle:** visibility of status; minimal design; chess convention.

**Recommendation:** Hide each capture row until it has content. Place its grouped icons by the player name. During review, count only moves up to that position. Keep the latest move in a compact row when Moves is closed. Preserve the owner's destination-only board highlight (`src/main.ts:399`). Put a textual from/to description in history instead of restoring origin-square paint. If material value is added, call it an estimate and define fairy-piece values; do not present a raw piece count as strength.

**Check:** Review a position before and after the first capture. The count changes with the board. Empty history takes at most one short row.

#### F09 — Start game silently replaces an unfinished game

**Screens:** New game from an active game; all sizes. **Severity:** major. **Simplifies:** no; one conditional confirmation protects a saved match.

**Evidence:** `10-new-game-phone.png`; `src/main.ts:1270`, `src/main.ts:954`, `src/main.ts:976`. The Start callback reaches `newGame()` and saves it without a replacement check. A game link does have a replacement question (`src/main.ts:1439`).

**Problem:** Cancel safely discards setup changes, but Start also discards the current match. The action label does not disclose this loss. The user gets different protection for two ways of replacing a game.

**Principle:** error prevention; consistency; user control.

**Recommendation:** Ask only at the final Start action when a real unfinished match has moves: “Replace this game?” Use Keep playing and Replace game. Do not ask when merely opening setup, after a finished game, or before any move. Keep the current draft-on-Cancel behaviour. Do not add a game archive to solve this case.

**Check:** Start, Cancel, and backdrop dismissal preserve the correct game in first-run, unfinished, finished, and lesson states.

#### F10 — Resign can name the computer's side

**Screens:** game while the computer thinks; all sizes. **Severity:** major. **Simplifies:** no; this is a correctness fix.

**Evidence:** `src/main.ts:476` disables Resign only for a finished game or lesson. `src/main.ts:683` starts computer thinking. `src/main.ts:1092` asks “Resign as” the current turn and stores that same side. `04-game-idle-phone.png` shows Resign as a normal peer of Hint and Undo.

**Problem:** During the computer's turn, the code can offer to resign the computer's army. This can give the human a false win. This is a source finding, not a reproduced live result. In review, Resign is also still enabled and can affect the live match.

**Principle:** error prevention; match between action and user intent.

**Recommendation:** In a computer game, bind Resign to the human side. In link play, bind it to the local side. In same-device play, state the current side. Disable it during review. Keep a clear confirmation. Move it to the bottom of Menu, apart from Hint and Undo. Use the question “Resign this game?” and state the losing side beneath it.

**Check:** Resign on each human side, during thinking, after a move, and from review. Only the intended player can resign.

#### F15 — “Two players” combines two different turn systems

**Screens:** two-player setup and play; all five sizes. **Severity:** major. **Simplifies:** no; two short subchoices remove uncertainty.

**Evidence:** `12-new-game-two-phone.png`, `19-two-players-phone.png`, `19-two-players-landscape.png`; `index.html:129`, `src/main.ts:478`, `src/main.ts:945`, `src/main.ts:1126`, `src/main.ts:1447`. The setup describes one device or a link. Share appears after a move. Opening a link locks play to the side to move. Same-device play stays White-side-up. Automatic orientation exists for a human playing Black or a received link.

**Problem:** The sender can still see both sides as local humans. There is no clear “waiting for your friend” state at the start of link play. Same-device users lack a visible hand-off or manual flip action. “Send the game link” can be mistaken for a live room invitation.

**Principle:** match to the user's model; visibility of status; chess convention.

**Recommendation:** Within Two players, offer Same device and By link. Keep them inside the existing mode, not as a fourth top-level mode. For same-device play, say “Black to move. Pass the device.” Add Turn board in Menu; do not force rotation after every move. For link play, say “Send a new link after each move.” After sending, retain the sender's side and show “Waiting for your friend's move.” On return, accept a continuing link through the existing continuity check. Label the main action Send move.

**Check:** Two people complete three turns on separate devices without assuming that the link updates live. A same-device pair can turn the board without opening Settings.

### Setup, settings, and navigation

#### F11 — Setup still presents too many equal choices before Start

**Screens:** New game, no powers and two players; all five sizes. **Severity:** minor. **Simplifies:** yes; ten controls become six in ordinary computer setup.

**Evidence:** `10-new-game-desktop.png`, `10-new-game-phone.png`, `10-new-game-landscape.png`, `12-new-game-two-phone.png`; `index.html:119`, `index.html:131`, `src/new-game.ts:129`. Three mode cards, four levels, More options, Cancel, and Start are all in the first computer setup. The mode cards repeat “against the computer”.

**Problem:** Level choice competes with game choice. Club has no visible meaning on touch; its explanation is a title attribute. On landscape, even this small form pushes Start out of the initial view.

**Principle:** Hick's law; progressive disclosure; recognition.

**Recommendation:** Keep the owner's three cards. Name them Computer, Kings' powers, and Two players. Use one short description each. Below them, show the current setup as text: “Beginner · You play White · Random army.” Put level, side, and army inside More options. Preserve all four levels and the last accepted setup. Start stays in the fixed footer. Do not add a second “quick setup” screen.

**Check:** A returning player starts the last setup with one Start action after opening the dialog. All three mode names remain visible at 390 px.

#### F12 — Powers setup asks the player to configure both armies at once

**Screens:** default powers picker and Frost picker; all five sizes and their end views. **Severity:** major. **Simplifies:** yes; 28 open-dialog controls become 16 before More or the opponent picker opens.

**Evidence:** `11-new-game-powers-desktop.png`, `11-new-game-powers-desktop-end.png`, `11b-new-game-frost-phone.png`, `11b-new-game-frost-phone-end.png`, `11b-new-game-frost-landscape.png`; `src/new-game.ts:100`, `src/new-game.ts:143`, `src/style.css:383`. Each side has six emblems and three power choices. The rule line can be several lines. The form scrolls even on desktop.

**Problem:** A new player faces eighteen king/power controls, besides mode and level. The opponent's setup is as large as the player's. Selecting a lower control can scroll the dialog away from its title and mode context. Small animated board pictures require careful inspection on phone.

**Principle:** Hick's law; common region; progressive disclosure.

**Recommendation:** Keep the six emblems, their names, the two powers, and No power. Show the player's picker first. Show the opponent as “Shadow · Death Touch · Always on” with Change. Expand the second picker only on Change. Preserve Spirit for White and Shadow for Black as the base defaults. Keep the first power when powers are enabled. Give the selected power three short fields: effect, use count, and whether the player still moves. Allow its picture to play once on selection. Keep Start in view.

**Check:** A player can choose Frost and Freeze, state its one-use limit, and start without scrolling past an open opponent picker. Changing Black's setup remains possible.

#### F13 — Army codes expose the storage format as the choice label

**Screens:** More options and custom army; all five sizes. **Severity:** minor. **Simplifies:** yes; plain names replace decoding work.

**Evidence:** `13-new-game-more-phone.png`; the same key in `texts.json` contains 14 army options. `index.html:154` includes `MMSSNBNK` and four other bare codes. `src/main.ts:1262` adds four Try these armies. `src/main.ts:1273` opens a browser prompt for eight letters. `src/try-these.ts:1` supplies useful practice descriptions that mostly stay in tooltips or appear after Start.

**Problem:** A new player cannot compare codes. The list mixes normal starts, practice, and experimental pieces. The prompt requires notation knowledge. “Chess starting army” describes placement, but may imply ordinary chess rules.

**Principle:** recognition instead of recall; match to user language; error prevention.

**Recommendation:** Keep Random army and Today's army first. Rename Chess starting army to “Chess pieces · King Down rules”. Group examples under Practice, with task names such as “Ogre push” and “Archer and Ogre”. Show a small back-rank icon strip when an army is selected. Keep its code in details. Put lab armies in an Experimental disclosure or the practice section of Learn. Replace the browser prompt with an inline field and a letter key. Show validation beside that field. Preserve raw-code input for experts; do not build a full army editor for this fix.

**Check:** A player can choose an Ogre practice without knowing O, S, or L. Invalid input keeps the setup form and the typed code.

#### F14 — Settings mixes preferences, game data, and sign-in

**Screens:** Settings; all five sizes and end views. **Severity:** minor. **Simplifies:** yes; hide rarely used sections, keep their functions.

**Evidence:** `14-settings-phone.png`, `14-settings-phone-end.png`, `14-settings-laptop.png`, `14-settings-landscape-end.png`; `index.html:174`, `index.html:184`, `index.html:191`, `src/account/account.ts:37`. Thinking time sits under Board. It has no visible unit or numeric value. Account adds two provider buttons and legal links. Close sits after all sections.

**Problem:** Presentation choices, engine tuning, current game data, and identity form one long list. A player who wants Sound or Piece letters sees unrelated content. The sign-in text says “games”, while the signed-in text names one saved game.

**Principle:** common region; progressive disclosure; match to user language.

**Recommendation:** Use Play and Appearance as the first groups. Move Thinking time into Advanced, or remove it from ordinary settings and let the four levels define it. If retained, show “Strong thinking time · 0.8 s” with its value. Move Setup code and Copy moves to Moves details. Collapse Account to one row with signed-in state. Use “Sign in to keep your game and lessons across devices.” Keep provider error text and account-delete confirmation. Keep Close visible.

**Check:** Sound and board appearance are visible without scrolling at 390×844. Account access still works through Settings. The copy does not imply that Workshop designs sync.

#### F28 — The main navigation has no useful priority

**Screens:** idle, selection, lesson, powers, and two-player game; all five sizes. **Severity:** major. **Simplifies:** yes; reduce fixed play controls from seven to three on desktop.

**Evidence:** `04-game-idle-phone.png`, `05-game-selected-phone.png`, `17-powers-game-laptop.png`; `index.html:39`, `index.html:55`, `src/style.css:232`. New game, Guide, Workshop, and Settings form one large row. Hint, Undo, and Resign form another. They use nearly the same colour, border, and depth.

**Problem:** An occasional visit to Workshop receives the same weight as Undo. Resign sits within easy reach of normal play actions. The rows use 132 px of phone height before contextual help grows. A new player has to decide which of seven controls matters now.

**Principle:** minimal design; Hick's law; proximity.

**Recommendation:** Keep Hint and Undo visible. Merge navigation under Menu. Put New game, Learn, Workshop, Settings, and Turn board there. Separate Resign at the bottom. On phone, use one labelled row: Hint, Undo, Menu. Contextual power controls stay outside Menu. Keep Menu in the same place in all ordinary play states. A lesson uses its own Exit action.

**Check:** Hint and Undo still take one action. New game and Learn take two actions. No ordinary board task requires opening Menu.

### Visual design

#### F17 — Too many frames and small type weaken the hierarchy

**Screens:** game panel, setup, Guide, Settings, result; all five sizes. **Severity:** minor. **Simplifies:** yes; fewer component variants and layers.

**Evidence:** `04-game-idle-laptop.png`, `10-new-game-phone.png`, `15-guide-phone.png`, `22-capture-or-push-phone.png`; `src/style.css:49`, `src/style.css:117`, `src/style.css:164`, `src/style.css:237`, `src/style.css:298`, `src/style.css:482`. Buttons have gradients, hard lower shadows, inset light, and borders. Dialogs add multiple outer rings. Small labels use 12.5 px. Phone piece text also uses 12.5 px.

**Problem:** The controls compete with the detailed figures. Many boxes look raised even when they contain only text. Cinzel in small labels adds texture where quick reading matters. The checked solid text pairs pass contrast, so darker text alone does not fix this.

**Principle:** minimal design; consistency; aesthetic-usability.

**Recommendation:** Apply the token and component rules in section 6. Keep Cinzel for brand, sheet titles, piece headings, and results. Use Alegreya Sans for controls and rule sentences. Use 16 px body text and 14 px secondary text. Remove the hard lift from ordinary buttons and the extra dialog rings. Use space and one divider between related groups. Preserve clear required control edges at 3:1 or better.

**Check:** At a glance, one main action leads each dialog. The board remains the most detailed object in the game view.

#### F18 — The title promises a richer place than the game shell provides

**Screens:** first and returning title, game, Clay; all five sizes where supplied. **Severity:** polish. **Simplifies:** yes; remove decoration from the wrong place and reuse the existing art system.

**Evidence:** `01-title-first-desktop.png`, `03-title-returning-phone.png`, `01-title-first-landscape.png`, `04-game-idle-desktop.png`, `24-clay-selected-desktop.png`; `src/style.css:117`, `src/style.css:519`, `src/style.css:599`, `src/style.css:695`. The title has a dark stage and warm light. The game has a flat pale floor and a heavily framed floating name box. At 844×390, the six-king stage compresses into a small strip at the top. The lineup lifts on hover but has no action in `index.html:93`.

**Problem:** The visual change can feel like moving from a finished game into a tool panel. The floating brand box carries more ornament than the turn information. Hover lift suggests that title pieces can be selected. Clay uses much smaller figures and different marker treatment, so changing looks also changes how players read the board.

**Principle:** aesthetic-usability; consistency; clear affordance.

**Recommendation:** Keep the light floor; it supports the painted board. Use the same type, burgundy, and restrained gold in both screens. Remove the floating game frame. Use a flat header and one shared panel surface. Keep all twelve title pieces. Stop the hover lift unless a piece opens its reference. Prefer removing the false affordance. In short landscape, omit the separate king stage. Keep Clay as an optional look in Settings and bring its marker meanings into line with Painted. Do not make Clay the default or add a third look now.

**Check:** Compare the title, first game, and result side by side. They share a clear identity without putting a dark panel behind every control.

### Responsive layout and touch

#### F04 — Tablet and short landscape inherit the wrong game layout

**Screens:** all game states at all five sizes. **Severity:** major. **Simplifies:** yes; three layout rules replace the current width-only split.

**Evidence:** `04-game-idle-tablet.png`, `05-game-selected-tablet.png`, `16-lesson-tablet.png`, `04-game-idle-landscape.png`, `18-powers-armed-landscape.png`; `src/style.css:72`, `src/style.css:627`, `src/style.css:701`, `src/render/PaintedView.ts:84`.

**Problem:** Tablet keeps the 272 px desktop rail and centres a 516 px canvas in a tall empty area. Landscape keeps a large title card and a 298 px canvas. The header's actual height can exceed the reserved 64 px. Phone panel content scrolls while the board stays fixed. This preserves the board, but can hide the action or instruction that explains it.

**Principle:** proximity; Fitts's law; WCAG 1.4.10 and 2.4.11 as verification requirements.

**Recommendation:** Use the exact layout budgets in section 5. Switch portrait tablet to controls below the board. Give short landscape its own height-based rule. Remove the floating card. Keep the context and main action in view together. Allow reference sheets to scroll. At 200% text size, let non-board content reflow instead of clipping it to a fixed viewport. The board is a two-dimensional task; that does not exempt its menus from reflow.

**Check:** Verify all five sizes with selected Ogre, a Beast chain, armed Freeze, check, review, and a long move list. Repeat at 200% text size and a 320 CSS px content width for surrounding UI.

#### F19 — Dialog actions disappear below the initial view

**Screens:** setup, powers, Settings, Guide, promotion, and result; all sizes, especially landscape. **Severity:** major. **Simplifies:** yes; one sheet pattern replaces several inconsistent layouts.

**Evidence:** `10-new-game-landscape.png` and `10-new-game-landscape-end.png`; `11-new-game-powers-laptop.png`; `14-settings-phone.png`; `15-guide-phone-end.png`; `21-promotion-landscape.png`; `23-result-landscape.png`; `src/style.css:298`, `src/style.css:321`, `src/style.css:455`.

**Problem:** Start, Close, and result actions live at the end of the scrolling dialog. The landscape result cuts the lower part of its buttons in the supplied image. Promotion uses three choices on its first row and one on the next at desktop and landscape. Scrolling is available; these views are not proven dead ends. They are harder to scan and leave.

**Principle:** Fitts's law; user control; WCAG 2.4.11.

**Recommendation:** Make each sheet a header, scrollable body, and visible footer. Give the body enough bottom space for focus and the last row. For the ordinary four-piece promotion, use one row at larger widths and 2×2 on phone. Reduce result art height to 64 px in short landscape. Use a compact four-across promotion row there. Keep Cancel visible. Keep Escape and the current safe backdrop-dismiss logic (`src/dialog-dismiss.ts:13`).

**Check:** Every dialog shows its exit and main action at all five sizes. Tab to the last field; the footer does not hide it.

#### F20 — Touch sizing stops at 720 px, and safe areas are not reserved

**Screens:** move list, setup controls, game panel, Workshop landscape; all sizes. **Severity:** major. **Simplifies:** no; this fixes access without removing functions.

**Evidence:** `src/style.css:278`, `src/style.css:627`, `src/style.css:647`; `index.html:5`; `src/workshop/workshop.css:112`. The game raises touch target heights only below 720 px. Tablet and 844 px landscape use desktop move rows. At 14 px type and 1.45 line height, a move target is about 22.3 px high before browser rounding. Adjacent rows can miss the 24 px spacing test. Searches of both style files find no safe-area inset rules.

**Problem:** A device can be wide and still use touch. Small history rows are hard to select in the long tablet rail. `viewport-fit=cover` allows use of unsafe screen areas, but controls do not reserve them. The supplied images do not include a real notch, so overlap with one is a risk, not an observed failure.

**Principle:** Fitts's law; WCAG 2.5.8; Apple touch guidance.

**Recommendation:** Set history rows to at least 44 px for coarse pointers and at least 28 px for fine pointers. Check both width and height. Apply 44 px targets to mode levels, emblem buttons, and selects on touch devices. Use a 3×2 emblem grid if six columns cannot fit true 44 px widths. Add safe-area padding to outer headers, footers, and sheets. Keep the chess grid's two-dimensional layout; its approximately 42 px phone squares already exceed the AA minimum.

**Check:** Measure actual clickable boxes, including whole checkbox labels. Test spacing before naming a 2.5.8 failure. Do not confuse Workshop's 28 px controls with an automatic AA failure; they exceed 24 px but miss the product's touch target.

### Accessibility, status, and copy

#### F21 — Global single-letter keys have no focus limit or opt-out

**Screens:** game and board control; keyboard use at every size. **Severity:** major. **Simplifies:** no; safer key scope removes unintended actions.

**Evidence:** `src/main.ts:1326` registers global `r` and `z`. It excludes fields and some dialogs, but it does not require board focus. `src/main.ts:1339` separately handles board arrows, Enter, and Space. `index.html:57` mentions Z only in a tooltip. No disable or remap control appears in `index.html:172`.

**Problem:** A single typed or dictated letter can undo a move when focus is elsewhere. The same arrows move the board cursor or review history based on focus state. That can be useful, but the visual UI does not teach the distinction.

**Principle:** WCAG 2.1.4; efficiency; recognition. The criterion allows a focus-only scope, a disable option, or remapping with a non-character key. [Character-key rule](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)

**Recommendation:** Keep plain Z and R only while the board has focus, or replace them with modifier shortcuts. Prefer focus scope to adding a Settings switch. Add a short Keyboard section under Learn: arrows move the square cursor; Enter/Space select or move; Escape cancels; Shift+Enter pushes; arrows outside board play step through history. Keep visible focus rings. Check dialog close returns focus to its opener.

**Check:** Dictate or type letters while focus is outside the board. No move changes. Complete an Ogre push and a Beast chain with keyboard input alone.

#### F22 — Some pending and success states do not match the result

**Screens:** thinking, Hint, copy/share, asset loading, Workshop loading, Account; all sizes. **Severity:** major. **Simplifies:** yes; use one status pattern and one reliable copy pattern.

**Evidence:** `src/main.ts:430` shows “thinking…”; `index.html:35` has no live status role. `src/main.ts:885` sets busy for Hint without a named pending state. `src/main.ts:1133` starts clipboard work and immediately says “Link copied”. `src/main.ts:1140` ignores fallback failure. Asset status does use a live region (`index.html:36`). Workshop load failure uses an alert (`src/main.ts:652`). Account has status and failure text (`src/account/account.ts:111`).

**Problem:** The player can see a disabled control without knowing why. Copy can claim success before the operation finishes. A slow first Workshop load has no local progress state in this handler. Feedback is spread across unrelated places.

**Principle:** visibility of status; error recovery; WCAG 4.1.3.

**Recommendation:** Use “Computer is thinking…” in the turn/status area and announce it once. Use “Finding a move…” for Hint. Change copied text only after success. If copy fails, show the link selected in a small sheet; the Workshop already has this pattern (`src/workshop/dialog.ts:172`). During Workshop import, show “Opening Workshop…” on its action and block repeat activation. Use “Pieces could not load. Reload to try again.” Preserve the Account's existing named pending and error states.

**Check:** Test blocked clipboard, failed asset load, slow Workshop import, and cancelled native share. None reports success for a failed or cancelled action.

#### F23 — Keyboard access exists, but nonvisual board state is incomplete

**Screens:** board, Hint, threats, powers, check, review; all sizes. **Severity:** major. **Simplifies:** no; it adds an equivalent way to use the existing board.

**Evidence:** `index.html:31` makes the board one application region. `src/render/PaintedView.ts:49` creates a canvas. `src/main.ts:562` announces the cursor's square, piece, selection, and legal target. `src/main.ts:579` announces moves and check. `src/main.ts:81` hides the threat layer from assistive tools. `src/main.ts:512` applies only a CSS class for an armed power. `07-game-threats-phone.png` and `18-powers-armed-phone.png` show visual states.

**Problem:** Keyboard users can move across squares, which is a real strength. Touch exploration with a screen reader is not established by this structure. The cursor text does not say that a piece is threatened, frozen, protected, or a special power target. The power button has no pressed state. These are access gaps or risks; this review does not claim that all screen-reader play fails.

**Principle:** WCAG 1.1.1, 1.3.1, 2.1.1, 4.1.2, and 4.1.3.

**Recommendation:** Keep the canvas for art. Expose the 64 squares through a labelled semantic grid with one roving keyboard stop. Connect it to the same legal moves. Give touch screen readers named squares and actions. Add relevant state to a square's accessible name: “Black rook, c8, frozen for this turn.” Set `aria-pressed` on the power button. Announce the chosen power target and remaining uses. Keep check as a word and a mark. For threats, say “Attacked square” and “Piece can be captured” when the help is on.

**Check:** Use VoiceOver with touch and keyboard, then NVDA with keyboard. Complete ordinary play, promotion, capture-or-push, powers, and review. Check 200% text, 400% zoom for non-board content, and focus visibility. Do not certify AA from source inspection alone.

### Powers, Workshop, and delight

#### F16 — Power rules crowd out the action they describe

**Screens:** powers game and armed power; all five sizes. **Severity:** major. **Simplifies:** yes; two short summaries replace repeated paragraphs.

**Evidence:** `17-powers-game-phone.png`, `18-powers-armed-phone.png`, `17-powers-game-tablet.png`, `18-powers-armed-landscape.png`; `src/main.ts:50`, `src/main.ts:336`, `src/main.ts:495`; `src/powers-ui.ts:113`. Both full power rules appear in the info card. The action follows Hint/Undo/Resign. An armed instruction is added below it. Passive powers hide the Use button. March and Leap appear with ordinary moves rather than through arming.

**Problem:** The screen repeats setup rules while the player needs the next step. “Black's king … your king” mixes perspective. A passive rule can look like a missing control. A spent or unavailable power gives limited reason text. The opponent's ability is visible, but hard to scan in the paragraph.

**Principle:** visibility of status; recognition; proximity; progressive disclosure.

**Recommendation:** Show two persistent summaries, for example “You · Frost · Freeze · 1 use” and “Computer · Shadow · Death Touch · Always on”. Put Use Freeze beside the first. Details opens the full rule. When armed, the context area says “Select an enemy piece. You then make your move.” Exclude the king through legal targets and name the exception in Details. For a passive power, show Always on and no disabled action. For March or Leap, say “Choose a piece to see its power moves.” After use, show Spent or the remaining count. Keep the opponent's name and state visible on their turn.

**Check:** A player can explain whether each of Freeze, Death Touch, and Leap needs a button. Test unavailable, armed, cancelled, spent, and second-move states. Add a one-move power trial within Learn when the compact UI is stable.

#### F24 — The result leads with loss and technical detail

**Screens:** result and key moments; all five sizes. **Severity:** minor. **Simplifies:** yes; shorten the first result view and make review explicit.

**Evidence:** `23-result-phone.png`, `23-result-desktop.png`, `23-result-landscape.png`; `src/main.ts:1012`, `src/main.ts:1044`, `src/main.ts:1083`; `src/moment.ts:87`. The result says “That side gave up”, gives the setup code, and reports “No move gave away 2 pawns or more”. Key moments search every played position and can return up to three losses or mate errors. Rematch already swaps player sides. Result New game starts a random game, unlike the menu action of the same name.

**Problem:** “Gave up” is needlessly negative. A setup code is not the main memory of a game. The two-pawn threshold is an engine estimate, not necessarily two captured pawns. The empty review line sounds like a quality guarantee. Close hides the useful review path. Long analysis can leave an indeterminate waiting message.

**Principle:** peak-end; consistency; visibility of status.

**Recommendation:** Lead with “Black wins” and “White resigned · 1 move”. Keep the fallen king, with smaller art in short landscape. Keep Rematch as the main action. Use Review board to close the dialog into review. Use Change setup to open setup. Hide setup code in game details. Say “No clear turning point found” when the search finds none. Give key moments a plain summary and an optional move label. Mark their advice as a quick computer review. Keep Rematch usable while review runs; show progress only if it is measured. Never invent a praise line or a best move.

**Check:** Finish by mate, resignation, draw, and a long game. The result fits, respects the outcome, and reaches rematch in one action. Review remains reachable after dismissal.

#### F25 — Workshop Home does not say what the player can make or where it works

**Screens:** Workshop Home; all five sizes. **Severity:** major for new players. **Simplifies:** yes; clarify one separate purpose and reduce its play-screen weight.

**Evidence:** `20-workshop-desktop.png`, `20-workshop-phone.png`, `20-workshop-landscape.png`; `src/workshop/dialog.ts:184`; `docs/WORKSHOP.md`, opening and “Screens”. Home offers New piece and Surprise me. Its empty text says that pieces appear here and stay on this device. A Workshop piece cannot enter a normal game; Try it is its test board.

**Problem:** A new player can reasonably expect New piece to make an army piece they can use in their next match. The sparse screen does not explain moves, takes, or the test boundary. Workshop appears as a peer of Play and Learn on the title, and as a main game command.

**Principle:** match to the user's model; minimal design; expectation setting.

**Recommendation:** Use one line: “Make a piece. Set its moves and test it here.” Add “Workshop pieces stay in the Workshop.” Keep the local save note by Your designs, where it matters. Move Workshop into Menu during play and on the title. Keep Home and saved designs as a separate creative space. Do not connect custom pieces to the full game without a separate game-design decision.

**Check:** Before creating a piece, a new user can say what Try it does and where the design is saved.

#### F26 — The Workshop starts with 34 art choices before the player sees a working piece

**Screens:** Workshop entry and editor; Home at all five sizes; deeper views reviewed in source. **Severity:** minor. **Simplifies:** yes; move a large optional choice later.

**Evidence:** `src/workshop/dialog.ts:204`, `src/workshop/dialog.ts:280`, `src/workshop/dialog.ts:407`; `docs/WORKSHOP.md`, “Screens” and “Layouts”. New piece opens 34 figures, then a blank piece. Surprise me already produces a usable design. The editor separates Moves and Takes, keeps Try it visible, and has Undo. These are strengths. `src/workshop/workshop.css:112` gives short-landscape header buttons 36 px and edit controls 28 px by the owner's mockup.

**Problem:** Art choice delays the first test of the core tool. A blank board requires the player to learn the editing model first. This is a design risk from the flow, not an observed user failure. Short-landscape edit controls meet the AA height minimum but can be hard for fingers.

**Principle:** Hick's law; progressive disclosure; Fitts's law.

**Recommendation:** On an empty shelf, lead with a usable sample through the existing Surprise me path. Keep New piece as a quieter choice. Offer appearance after the player sees or tests moves; retain the complete 34-figure gallery there. Keep Moves and Takes separate; merging them hides an important rule difference. Keep the three-property limit, Undo, save-failure alert, and Try it footer. Keep one primary worth statement, “Estimated worth: about 3 pawns”; put its explanation in Why this estimate. Increase landscape edit hit areas to 44 px without overlapping neighbours. Allow secondary settings to scroll if needed.

This changes the documented entry flow. Raising 36/28 px landscape controls reverses an explicit owner mockup detail. See D8 and D9. No deeper Workshop layout failure is claimed from the Home screenshots.

**Check:** Make one move-rule change, test it, undo it, and reload at all five sizes. Test one new user who knows chess and one who does not.

#### F27 — The art can delight without delaying the next action

**Screens:** title, move selection, powers picker, captures, result, Workshop; all sizes. **Severity:** polish. **Simplifies:** yes; remove repeated motion from controls and shorten readiness cues.

**Evidence:** `src/render/marks.ts:33`, `src/render/marks.ts:74`; `src/power-motion.css:38`; `src/style.css:601`, `src/style.css:691`; `src/render/PaintedView.ts:113`, `src/render/PaintedView.ts:131`; `src/main.ts:585`, `src/main.ts:1313`. Marks use a 300 ms pop plus distance delay. Selected power pictures loop. Move sounds and capture sounds already follow action type. Normal/Fast/Off and reduced-motion handling exist. A saved pace can override the initial reduced-motion default (`src/main.ts:1191`, `src/main.ts:1312`, `src/main.ts:1382`). `docs/WORKSHOP.md`, “Motion”, describes short reactions.

**Problem:** A mark that settles late can make the board feel slower, even if input is already active. Several moving setup pictures can compete with reading. The static captures cannot establish actual audio quality or motion discomfort. The saved-pace path also needs a live reduced-motion check.

**Principle:** Doherty threshold; user control; peak-end. Reduced-motion support is good practice. Do not mislabel WCAG 2.3.3, an AAA criterion, as an AA requirement.

**Recommendation:** Draw legal destinations fully on the next frame. Let a short glow follow without hiding them. Target 100–160 ms for selection response. Play a power example once on selection; repeat only on request or deliberate hover. Keep Fast and Off. Keep a still frame under reduced motion. Apply that preference after saved settings load and when the system setting changes. Test saved Normal pace as well as a fresh visit. Reserve the strongest motion for a special capture and the game's end. Keep the approved Workshop Set A reactions; this proposal adds no Workshop reaction. Do not add confetti, medals, or reward gates. Keep sound optional and ensure every sound has a visible equivalent. Audit auto-running loops under WCAG 2.2.2 where applicable; Off already provides a pause mechanism, but its access needs testing.

**Check:** With Off and reduced motion, every move, target, result, and power remains clear. At Normal pace, a player can make the next legal choice without waiting for decorative motion.

### Copy changes

These are edits to existing messages, not extra messages shown at the same time. Use the current rules when filling piece names, sides, squares, and counts.

| ID | Current copy / location | Proposed copy |
|---|---|---|
| F01 | “Learn the pieces” on first title | **Try one move**. In Menu, use **Learn** for the full section. |
| F11 | “Play the computer” plus “You against the computer, with no powers.” | **Computer** / “Play without king powers.” |
| F11 | “Kings' powers” plus “Against the computer. Each king brings one power.” | **Kings' powers** / “Play the computer. Each king has one power.” |
| F15 | “Share one device, or send the game link after each move.” | **Same device** / **By link**. For link play: “Send a new link after each move.” |
| F05 | “Tap a marked square to move or capture.” | “Select a marked square.” The marker shape and current piece supply the action. |
| F05 | “Cancel selection” | **Cancel**, within the named piece context. |
| F03 | “Learn the six King Down pieces by playing, one move each” | **Try the pieces** / “Six short lessons.” |
| F02 | “Return to game” on a first lesson visit | **Exit lesson**. Use **Return to game** only when a match exists. |
| F03 | “Mate the king.” | “Win when the enemy king is under attack and no move can save it.” |
| F16 | Long repeated Freeze rule in play | **Freeze · 1 use**. Details: “Freeze an enemy piece, except the king. It cannot move next turn. Then make your move.” |
| F16 | “Black's king: Death Touch — your king…” | **Computer · Death Touch · Always on**. In details, name “the black king”, not “your king”. |
| F16 | “Tap one of your pieces to wall it for one turn.” | “Select a piece to protect. You then make your move.” Keep the king exclusion and duration in the rule. |
| F22 | “thinking…” | “Computer is thinking…” |
| F22 | “Link copied. Paste it to your friend.” | “Link copied. Send it to your friend.” Show only after success. |
| F19 | Ogre paragraph with repeated squares | “Capture removes the pawn on c5. Push sends it to c6. Your Ogre moves to c5.” |
| F19 | “Capture on c5” / “Push to c6” | **Capture pawn** / **Push to c6**. Name the actual target piece. |
| F24 | “White resigns — Black wins” and “That side gave up.” | **Black wins** / “White resigned.” |
| F24 | “No move gave away 2 pawns or more.” | “No clear turning point found.” |
| F24 | Result “New game” | **Change setup**, which opens setup. |
| F25 | Empty Workshop: “Your pieces will appear here.” | “No designs yet.” Put the purpose sentence above the creation actions. |
| F14 | “Sign in to save your games on every device.” | “Sign in to keep your game and lessons across devices.” |

Copy evidence: the matching screen keys in `../shots/texts.json`; `src/main.ts:409`, `src/main.ts:515`, `src/main.ts:1018`, `src/main.ts:1135`, `src/account/account.ts:41`, `src/workshop/dialog.ts:193`. Principles: match to user language, recognition, consistency, and error recovery. F16's full Details copy must retain every current rule exception; shorter play text does not change rules.

### Coverage of the supplied images

**D:** desktop. **L:** laptop. **T:** tablet. **P:** phone. **LS:** landscape. A check means the supplied image is inspected. Each screen prefix below expands to `<prefix>-<size>.png`. “End” notes cover every supplied scrolled dialog image.

| Screen prefix | D | L | T | P | LS | Main cross-size observation / finding |
|---|---|---|---|---|---|---|
| `01-title-first` | ✓ | ✓ | ✓ | ✓ | ✓ | Actions fit. Landscape king stage compresses; F01, F18. |
| `02-after-title-play` | ✓ | ✓ | ✓ | ✓ | ✓ | Club default. Landscape Start needs scroll; LS end checked; F01, F11, F19. |
| `03-title-returning` | ✓ | ✓ | ✓ | ✓ | ✓ | Continue is strong. Four large actions wrap on tablet/landscape; F18, F28. |
| `04-game-idle` | ✓ | ✓ | ✓ | ✓ | ✓ | Tablet blank space and large history; F04, F08, F28. |
| `05-game-selected` | ✓ | ✓ | ✓ | ✓ | ✓ | Help growth moves play controls; F05. |
| `06-game-hint` | ✓ | ✓ | ✓ | ✓ | ✓ | Two equal outlines, no named hint; F06. |
| `07-game-threats` | ✓ | ✓ | ✓ | ✓ | ✓ | Rings and dots stay distinct; preserve off by default; F23. |
| `08-game-review` | ✓ | ✓ | ✓ | ✓ | ✓ | Touch has no step buttons; F07. |
| `10-new-game` | ✓ | ✓ | ✓ | ✓ | ✓ | Good three-mode base. LS end checked; F11, F19. |
| `11-new-game-powers` | ✓ | ✓ | ✓ | ✓ | ✓ | Long two-side form. All five end views checked; F12. |
| `11b-new-game-frost` | ✓ | ✓ | ✓ | ✓ | ✓ | Freeze rule and second picker extend the form. All five ends checked; F12. |
| `12-new-game-two` | ✓ | ✓ | ✓ | ✓ | ✓ | Device/link share one setup. LS end checked; F15. |
| `13-new-game-more` | ✓ | ✓ | ✓ | ✓ | ✓ | Raw-code options; LS end checked; F13. |
| `14-settings` | ✓ | ✓ | ✓ | ✓ | ✓ | Long mixed-purpose sheet. All five ends checked; F14. |
| `15-guide` | ✓ | ✓ | ✓ | ✓ | ✓ | Fairy pieces and powers come late. All five ends checked; F03. |
| `16-lesson` | ✓ | ✓ | ✓ | ✓ | ✓ | Unrelated controls remain; F02. |
| `17-powers-game` | ✓ | ✓ | ✓ | ✓ | ✓ | Full rules precede the action; F16. |
| `18-powers-armed` | ✓ | ✓ | ✓ | ✓ | ✓ | LS instruction falls at the panel edge; F04, F16. |
| `19-two-players` | ✓ | ✓ | ✓ | ✓ | ✓ | White orientation stays after 1.e4; F15. |
| `20-workshop` | ✓ | ✓ | ✓ | ✓ | ✓ | Home fits; purpose is unclear; F25. |
| `21-promotion` | ✓ | ✓ | ✓ | ✓ | ✓ | P has a clear 2×2 layout. Others use 3+1. LS end checked; F19. |
| `22-capture-or-push` | ✓ | ✓ | ✓ | ✓ | ✓ | Fits at all five sizes. Both options look primary; F19. |
| `23-result` | ✓ | ✓ | ✓ | ✓ | ✓ | LS cuts lower button edges; F19, F24. |
| `24-clay-selected` | ✓ | — | — | — | — | Alternate art and marks. Only D is supplied; F18. |

### Accessibility disposition

| Area | Evidence-based disposition | Next acceptance check |
|---|---|---|
| Text contrast, WCAG 1.4.3 | The solid text pairs in section 6 pass. This is not a whole-screen pass. | Sample all rendered states and gradients. |
| Non-text contrast, 1.4.11 | Many control edges and focus pairs pass. Hint and art states need rendered checks. | Measure on both light and dark squares. |
| Colour-only cues, 1.4.1 | Painted legal marks use different shapes. Check also has a text label. | Test monochrome and nonvisual meaning; retain shape differences in Clay. |
| Keyboard, 2.1.1 | Board arrows, selection keys, Escape, and Ogre push exist. | Complete every special interaction without a pointer. |
| Character keys, 2.1.4 | Global Z/R have a source-level gap; F21. | Focus-scope or remap them, then test speech input. |
| Focus, 2.4.3/2.4.7/2.4.11 | Rings and modal headings exist. Rebuilt move buttons and scrolling sheets need checks. | Test entry, all controls, dismissal, and focus return. |
| Targets, 2.5.8 | Phone rules help. Wide-touch history rows need size and spacing checks. | Measure actual targets, not icon dimensions. |
| Drag alternative, 2.5.7 | Tap-tap and keyboard alternatives exist. | Verify all special moves use an alternative too. |
| Status, 4.1.3 | Moves, cursor, help, powers, and Account have live regions. Hint result and thinking need work. | Check announcement order and avoid repeated full-rule speech. |
| Names and roles, 4.1.2 | Named controls exist. The armed power lacks pressed state. Canvas touch access is unverified. | Test semantic board and armed state in assistive tools. |
| Reflow, 1.4.10; resize, 1.4.4 | Not verified at zoom. Fixed-height play and scrollable panels need testing. | Keep surrounding content readable at 200% text and 320 CSS px width. |
| Motion | CSS and board code support reduced motion and Off. Real playback is not tested. | Check no important state disappears when motion stops. |

Keep Show threats **off by default**. Its many dots can distract an experienced player, but they support learning. In Learn or the setting description, distinguish attacked empty squares from pieces that can be taken. Do not imply that the marks prove a move is safe from every tactic. Evidence: `07-game-threats-phone.png`; `src/main.ts:530`; `index.html:179`. Principle: progressive disclosure and clear system limits.

## 9. Owner decisions

These are review choices, not permission requests to change the app. No implementation is part of this report. “Reversal” below distinguishes an explicit owner rule from a documented accepted design or current behaviour.

### D1 — A first computer game uses Beginner; later games use the player's last choice

**Options:** (1) Keep Club for everyone. (2) Use Beginner only for a first match. (3) Ask every new player to choose among all four levels. **Pick:** 2. **On yes:** change the first-run default and verify saved setups remain unchanged; apply F01. **Decision effect:** this reverses the documented Round 3 Club default (`docs/visual-design/README.md`, “Round 3”; `src/new-game.ts:34`). It does not reverse the three-mode requirement.

### D2 — New game keeps three top-level modes and hides level choice under More

**Options:** (1) Keep 10 ordinary setup controls. (2) Show 6, with level choices inside More. (3) Replace the modes with one quick-start button. **Pick:** 2. **On yes:** keep Computer, Kings' powers, and Two players; add a plain current-setup summary; apply F11. **Decision effect:** moving the level row changes the accepted Round 3 layout. The owner explicitly asks for three top buttons; option 3 reverses that request and is not recommended.

### D3 — The title has two leading actions and one quiet Menu, while all twelve pieces stay visible

**Options:** (1) Keep 3 large first-visit actions and 4 returning actions. (2) Use 2 leading actions plus Menu. (3) Remove the title for returning players across all visits. **Pick:** 2. **On yes:** keep first-visit learning, direct Continue, the full lineup, and Workshop access inside Menu; apply F18 and F28. **Decision effect:** Workshop's front-page placement changes the current documented design. No supplied owner quote requires that placement. The explicit twelve-piece lineup decision stays intact. Keep the current once-per-tab behaviour.

### D4 — Power setup shows the player's picker and an expandable opponent setup

**Options:** (1) Keep both pickers open, 28 controls before More. (2) Show 16 controls before the opponent picker or More opens. (3) Offer only a small set of fixed king pairs. **Pick:** 2. **On yes:** apply F12; retain six emblems, two powers, No power, and Spirit/Shadow defaults. **Decision effect:** this changes the accepted per-side open-picker layout, but preserves the owner's emblem choice and base king identities. Option 3 removes flexibility and is not recommended.

### D5 — The last-move board mark continues to show only the destination or target

**Options:** (1) Keep destination-only paint and improve the text history. (2) Restore both source and target highlights. (3) Add a persistent arrow. **Pick:** 1. **On yes:** apply F06–F08 without new permanent board marks. **Decision effect:** option 2 reverses the explicit owner rule in `src/main.ts:399`. This report does not recommend that reversal. A temporary hint can still distinguish its own source and target.

### D6 — The core game stays light, and Painted stays the default look

**Options:** (1) Keep light stone and simplify the surrounding controls. (2) Make the whole game as dark as the title. (3) Add a new appearance mode. **Pick:** 1. **On yes:** apply the tokens, flat header, and common markers in F17–F18. **Decision effect:** no reversal of the owner-selected Painted default or rulebook icons. Do not repaint the art to solve a control-layout problem.

### D7 — Two players asks whether they share a device or exchange move links

**Options:** (1) Keep the current single flow, 7 setup controls with powers off. (2) Add two subchoices within the mode, for 9 controls. (3) Build a live game-room system. **Pick:** 2. **On yes:** apply F15 and preserve the current move-link transport. **Decision effect:** this adds a justified choice to prevent a larger misunderstanding. It keeps the three top-level modes. It does not authorize live multiplayer infrastructure.

### D8 — An empty Workshop leads with a usable sample, and full art choice comes later

**Options:** (1) Keep the 34-figure first step as the leading route. (2) Lead with the existing usable-design route and keep art choice in Appearance. (3) Remove blank-piece creation. **Pick:** 2. **On yes:** apply F25–F26; retain New piece, the complete figure gallery, Undo, and the separate Moves/Takes boards. **Decision effect:** this changes the documented Workshop entry sequence. The supplied current record describes that sequence; it does not quote an explicit owner requirement to choose art first. Prototype this change before replacing the current entry.

### D9 — Workshop touch controls use 44 px hit areas even in short landscape

**Options:** (1) Keep 36 px header and 28 px edit targets. (2) Raise hit areas to 44 px and let secondary settings scroll. (3) Show only one movement board at a time. **Pick:** 2. **On yes:** keep both boards and Try it visible, test at 844×390 and the owner's smaller 568×320 case, and apply F20/F26. **Decision effect:** this explicitly reverses the 36/28 px target-size detail from the owner's landscape mockup (`src/workshop/workshop.css:108`; `docs/WORKSHOP.md`, “Layouts”). The reason is touch accuracy, not an unsupported AA-failure claim.

### D10 — Result review uses explicit controls, while Rematch stays one action

**Options:** (1) Keep Rematch, New game, and Close with their current meanings. (2) Use Rematch, Review board, and Change setup. (3) Force key-moment review before replay. **Pick:** 2. **On yes:** apply F07 and F24; preserve direct rematch and the fallen-king art. **Decision effect:** this changes the documented tap-board-to-exit review behaviour and result New game behaviour. These are current design choices, not explicit owner quotations. Do not force analysis or add a delay before Rematch.

### D11 — Material stays factual until fairy-piece values have a clear product rule

**Options:** (1) Show grouped captures and piece counts. (2) Show a labelled estimated material difference using agreed values. (3) Put a full engine evaluation bar beside the board. **Pick:** 1 now. **On yes:** apply F08 and put captures beside player labels. Revisit option 2 only after the owner selects the values and wording. **Decision effect:** no rule reversal. This avoids treating the Workshop's estimate or a count of pieces as a final balance rule.

### D12 — Lessons remain optional and do not lock pieces behind wins

**Options:** (1) Keep every lesson and piece available. (2) Adopt the proposed 2/5/9-win unlock schedule. (3) Show suggested next lessons without locking anything. **Pick:** 3, with the access of option 1. **On yes:** use existing lesson completion data for Continue lessons; apply F02–F03. **Decision effect:** `docs/PROGRESSION.md` is marked as a proposal with open owner decisions. This review does not treat it as an implemented feature or an approved gate.

### Delivery and acceptance order

1. Fix F09, F10, and F21. Verify replacement, resignation, and keyboard scope in focused tests.
2. Build one complete game layout with Menu, context, powers, and review. Check the five sizes before changing the title.
3. Apply the common sheet footer, setup changes, and visual tokens. Recheck touch targets and rendered contrast.
4. Test the first Archer flow and one full Beginner game with 4 new players. Test fast play and review with 4 experienced players. Treat this as a first test round, not statistical proof.
5. Check Workshop entry separately. Keep its current working editor until the revised route passes a small task test.

Use these acceptance targets:

- A new player makes the first special move within 60 seconds without spoken help.
- The player identifies their side and the current turn correctly.
- No action loses a saved game without a clear final choice.
- Resign never ends the wrong side's game.
- The core action stays visible at all five sizes.
- Every special move has a complete keyboard path.

The time target is a proposed test goal, not a measured result. Record errors and pauses. Remove their cause before adding more options.
