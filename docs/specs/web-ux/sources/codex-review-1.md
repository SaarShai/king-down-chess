# King Down Chess: independent UI and UX review

Review date: 8 October 2026. Reviewer: independent senior product designer.

## 1. Summary

King Down has a clear visual character and a working set of game tools. The painted pieces, stone board, short lessons, and special moves give it a strong base. The first large problem is that new players meet many rules and a Club computer before they get a simple first game. The second is that menus, help, piece rules, and power rules compete with the board and move controls. The third is that the layout uses screen width alone, so a tall tablet gets a small board and a short phone hides key actions. Keep the art and the owner's three game modes, but show fewer controls at each step. Make one special move easy to learn, keep the board still during play, and give each turn one clear action.

### Scope and evidence

I inspect all 141 supplied images: 116 main captures and 25 dialog-end captures. They cover 23 screen states at five sizes, plus Clay on desktop. I also read `texts.json`, the capture script, the named source files, and the named design records. I do not access the other review or session transcripts. The source references below use the repo root `/Users/za/Documents/king down chess`. Image names refer to `../shots/`.

The public site does not open through the web text tool. The headless Chrome launch stops with `SIGABRT` in this sandbox. I do not start or stop a server. Thus this report uses the supplied current captures and source. It does not claim a live usability test, a measured load time, or full WCAG compliance. Code-based risks are marked as such. The Workshop editor has source evidence but no supplied editor capture.

`inspection/contrast.json` records colour calculations. `inspection/board-measurements.json` records image-based board widths. Widths are approximate visible frame widths, not DOM bounds. Colour ratios use the WCAG sRGB formula. Suggestions and layout sizes are design targets, not test results.

Two audiences apply throughout:

- **New:** a player who knows some chess, or none, and does not know King Down.
- **Fast:** a chess player who wants quick moves, useful board information, and few delays.

Severity: **critical** blocks play or causes serious loss; **major** harms a main task; **minor** causes a smaller delay or error; **polish** affects finish. No critical defect is proved by these static inputs.

## 2. What to keep

| Strength | Evidence | Reason to keep it |
|---|---|---|
| Painted figures and the stone board | `04-game-idle-desktop.png`; `docs/painted-game/README.md:5` | The art makes the game easy to remember. Aesthetic-usability effect. |
| All twelve figures on the title | `01-title-first-phone.png`; `docs/visual-design/README.md:11` | The cast gives the game character. Keep the owner's lineup choice. |
| Learn first on a first visit; Continue first on return | `01-title-first-phone.png`, `03-title-returning-phone.png`; `src/main.ts:1404` | It gives each visit a useful next step. Nielsen: recognition and efficiency. |
| Three suggested game modes and folded More options | `10-new-game-phone.png`; `docs/visual-design/README.md:59` | Setup already has a good structure. Progressive disclosure. |
| King emblems and small power scenes | `11b-new-game-frost-phone.png`; `src/new-game.ts:100`, `src/power-motion.css:1` | They show a choice with art, name, and action. Recognition. |
| Distinct shapes for move, take, shot, swap, push, and power | `05-game-selected-phone.png`; `src/render/marks.ts:7` | They carry meaning beyond colour. WCAG 1.4.1. |
| Six short lessons and safe return to the match | `16-lesson-phone.png`; `src/lessons.ts:14`, `src/main.ts:631` | Learning uses play and keeps the saved match. Casual-game onboarding; user control. |
| Rulebook piece icons, including the chosen Ogre face | `21-promotion-phone.png`; `docs/visual-design/README.md:98` | Keep the owner's symbols. They connect board, Guide, and cards. Consistency. |
| Click, tap, drag, and keyboard play | `src/render/PaintedView.ts:94`, `src/main.ts:1339`; `docs/painted-game/README.md:9` | These paths already support different players. WCAG 2.1.1 and 2.5.7. |
| Move announcements, Undo, fast rematch, and silent play | `index.html:75`; `src/main.ts:579`, `src/main.ts:980`, `src/main.ts:1086`; `index.html:176` | These tools make play safer and faster. Keep them while the layout changes. |

## 3. Design principles for King Down's UI

1. Keep the full board in view at all five supplied sizes, with no page scroll during a normal turn.
2. Show no more than four persistent game actions: Hint, Undo, Learn, and Menu.
3. Use one context area for selection, errors, lessons, and power steps; do not stack rule boxes.
4. Let a new player make an Archer shot within three taps from the title, with no setup choice.
5. Keep full rules one action away, but show only the rule needed for the current step.
6. Give every action a visible name, a clear state, keyboard access, and a suitable touch area.
7. Keep the cast, king emblems, official piece icons, and distinct move shapes; remove extra frames and repeated text.

These are test rules. They apply [Nielsen’s usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) to this game. The four-action rule excludes move-list entries and actions that exist only in a state, such as Cancel, Use Freeze, or Share turn.

## 4. The simplification

### Today's screen map

```text
Title
├─ Learn the pieces → Lesson 1 → ... → Lesson 6 → New game
├─ Play → New game
├─ Continue → Game, or Result for a finished saved match
└─ Workshop → Home → 34 figures → Editor → Try it

Game
├─ New game → Computer / Powers / Two players
│  ├─ Level
│  ├─ Powers → White king + power; Black king + power
│  └─ More options → Side; Army; native custom-code prompt
├─ Guide → 12 piece cards → pool + notation → 12 power rules
│  └─ Learn → Lesson 1
├─ Workshop
├─ Settings → Play / Board / This game / Account
├─ Hint / Undo / Resign
├─ Power / Share link, when needed
├─ Move list → Review → tap board or Escape to return
└─ End → Result → moments / Rematch / New game / Close
```

Evidence: `index.html:38`, `index.html:117`, `index.html:172`, `index.html:227`, `index.html:240`; `src/main.ts:1484`; `src/workshop/dialog.ts:184`.

### Proposed map

```text
Title: Learn the pieces / Play; Continue when a match exists
├─ Learn → one Archer shot → Next piece or Play
└─ Play → same three-mode New game → Start game

Game: board + one context area + Hint / Undo / Learn / Menu
├─ Learn → current piece first; six special pieces; chess basics
│  ├─ lessons and named practice positions
│  └─ Workshop link for creation
├─ Menu → New game / Flip board / Copy moves / Workshop
│          Preferences / Account / Resign
├─ Power, next to the turn that owns it
├─ Share turn, only in link play
├─ Moves → Review with Previous / Next / Live game
└─ Result → Rematch / New army / Review game

Preferences: Play / Board
Account: optional sign-in and sync; separate from board preferences
Workshop: keep its existing four stages
```

Learn is one place for rules and lessons. Workshop remains directly available in Menu. Account moves out of the long Settings sheet. A screen family is a main task surface shown in the maps. Small move-choice and confirmation dialogs are not separate families. Both maps retain promotion and Capture/Push within Game, and account deletion within Account. The number of screen families does **not** fall: it stays at nine. Merging Guide and Lessons saves one family; making Account separate adds one. The benefit is less visible choice during play, not fewer capabilities.

### Count rule and control budget

Count each visible button, radio choice, select, checkbox, slider, text field, or disclosure as one control. Exclude the 64 board squares, move-list buttons, text labels, and inactive hidden controls. Count radio choices separately. Counts refer to the full active surface, even if part of it needs scroll. They are not counts of items above the fold.

| State or surface | Today | Proposed | What changes |
|---|---:|---:|---|
| First title | 3 | 2 | Move Workshop to Learn and Menu. Keep Learn and Play. |
| Returning title | 4 | 3 | Keep Continue, Learn, Play. |
| In-game navigation | 4 | 2 | Keep Learn and Menu; move New game, Workshop, Settings into Menu. |
| Normal game, fixed controls | 7 | 4 | Hint, Undo, Learn, Menu. Resign moves into Menu. A 43% reduction. |
| Selected piece, fixed controls | 8 | 5 | Keep Cancel as a 44 px control inside the context card. |
| Active power game, fixed controls | 8 | 5 | Keep one Use power control; merge its rule into the context area. |
| Two-player game after a move | 8 | 5 | Four base controls plus Share turn in link play. On-device play needs only four. |
| Incomplete lesson | 8 | 2 | Hide four app buttons and Undo/Resign. Keep Hint and Back. |
| Completed lesson | 9 | 2 | Replace the lesson controls with Next piece and Play. |
| Computer setup, More closed | 10 | 10 | Keep 3 modes, 4 levels, More, Cancel, Start. Improve defaults and size. |
| Powers setup, both pickers shown | 28 | 12 initially; 20 while editing | Replace each 9-control picker with one Change control; open one picker at a time. |
| Two-player setup, powers off | 7 | 9 | Add two choices: On this device / By link. This adds clarity, not simplicity by count. |
| Army select choices | 14 | 4 in setup | Keep Random, Today, Chess army, Custom. Move named practice to Learn; hide lab armies from normal setup. |
| Painted Settings, signed out | 14 | 7 in Preferences | Six preference controls and Close. Copy moves moves to Menu; thinking time to Strong setup; threats to Learn help; Account has its own sheet. |
| Signed-out Account sheet | Part of Settings | 5 | Two provider buttons, Privacy, Terms, Close. It remains optional. |
| Workshop home, no designs | 3 | 3 | Back, New piece, Surprise me stay. Improve the lead text and hierarchy. |

The existing army list has four general choices, six static examples, and four choices from `TRY_THESE`. Evidence: `index.html:154`, `src/try-these.ts:1`, `src/main.ts:1262`. The 28-control powers count is `3 + 4 + 9 + 9 + 1 + 2`. The proposed 12 is `3 + 4 + 1 + 1 + 1 + 2`.

A menu adds one tap for a rare action. It must not add taps to moving a piece, Hint, Undo, using a power, or sharing a turn. Do not add a Home screen, a profile dashboard, a second settings system, or a required account. Do not gate the current full game behind wins. `docs/PROGRESSION.md:1` is a proposal, not a shipped requirement.

## 5. Proposed layouts and first-run flow

### Evidence at each size

| Size | Current frame width, about | Main layout issue | Proposed frame target |
|---|---:|---|---:|
| Desktop, 1440 × 900 | 776 px | Board ends near x=971; rail begins at x=1168. The gap is about 197 px. | 760 px; rail 320 px; gap 24 px |
| Laptop, 1280 × 720 | 607 px | Full board fits. Dense stacked cards can make the rail scroll. | 600 px; rail 300 px; gap 24 px |
| Tablet, 820 × 1180 | 516 px | The 272 px rail takes a third of the width. Much of the left area is empty. | 760 px; tools below board |
| Phone, 390 × 844 | 365 px | Board fits. Selection moves Hint/Undo down; powers and moves need panel scroll. | 366 px; one 88 px context slot |
| Landscape, 844 × 390 | 298 px | Desktop rules apply. The large header touches the top board area; power action falls below the rail view. | 302–313 px; short header; fixed action row |

Evidence: the five `04-game-idle` images; `05-game-selected-phone.png`; `17-powers-game-landscape.png`; `src/style.css:72`, `src/style.css:627`, `src/style.css:700`; `src/render/PaintedView.ts:84`. Frame targets include the frame, not just the eight-by-eight cells. Keep the painted canvas's headroom. Use its existing 960:1024 width-to-height fit rule. Do not crop tall figures to gain space.

### Desktop and laptop game

Center the **board and rail as one group**. Do not stretch the rail to the far edge of a wide window. Use a 24 px gap. At 1440 × 900, use a 760 px painted frame and 320 px rail. At 1280 × 720, use 600 px and 300 px. Keep 12 px outer space or more. A 56 px top band and the existing headroom fit the laptop target without page scroll.

```text
┌───────────────────────────────────────────────────────┐
│ King Down                           Learn       Menu  │ 56
├──────────────────────────────────┬────────────────────┤
│                                  │ Computer · Club    │
│                                  │ Black / captures   │
│        PAINTED BOARD             ├────────────────────┤
│                                  │ Your turn          │
│        760 or 600 px frame        │ Freeze · 1 use     │
│                                  │ [Use Freeze]       │
│                                  ├────────────────────┤
│                                  │ ONE CONTEXT CARD   │
│                                  │ piece / step / ×   │
│                                  ├────────────────────┤
│                                  │ Hint        Undo   │
│                                  ├────────────────────┤
│                                  │ compact move list  │
│                                  │ White / captures   │
└──────────────────────────────────┴────────────────────┘
```

The turn is in the rail next to the board. It uses 18 px bold body type. The brand uses 18–20 px Cinzel and no framed floating box. Keep the two captured-piece rows close to their player labels. Hide empty captured rows. Let the move list use remaining rail height. It may scroll internally; the turn and actions must stay visible.

When a piece is selected, show its icon, name, square, and one useful rule. Show a short action line below it. Keep one 44 px Cancel control in the card. Full rules open from the piece name or Learn. A returning fast player can collapse the rule detail; retain the action line. The board does not move when the card changes.

In review, replace Hint and Undo with Previous and Next. Show Live game in the context area. Show “Review · after 1. e2–e4.” Keep Menu and Learn. Do not put Resign beside review controls.

### Tablet portrait game

At 820 × 1180, use one column. Use a 48 px brand bar and a 44 px opponent strip above the painted canvas. Put a 44 px player strip, the context area, and a 48 px action row below it. A 760 px frame needs about 811 px of canvas height. These parts fit in about 1075 px before small gaps and the safe area. Put the collapsed move summary in the remaining space. Open the full list in a sheet when tapped.

```text
┌──────────────────────────────────────┐
│ King Down                Learn Menu  │
│ Computer · Black · Death Touch [info]│
├──────────────────────────────────────┤
│                                      │
│          760 px PAINTED BOARD         │
│                                      │
├──────────────────────────────────────┤
│ White · Your turn · Freeze [Use]      │
│ Pawn d2  · Tap a marked square    [×] │
│ Hint                         Undo    │
│ Last: e7–e5               Moves  ›  │
└──────────────────────────────────────┘
```

This gives the frame about 47% more width than the capture. It removes the tall empty rail. Touch controls belong below the board. Do not use a portrait tablet's extra height for an empty move box.

### Phone portrait game

At 390 × 844, keep 12 px side space around tools. Keep the board as wide as it is now. Use a 48 px top bar and a 44 px opponent strip. Give the canvas about 390 px of height. Below it, use a 44 px player strip, an 88 px context slot, and a 48 px bottom action row. Use the remaining height for the latest move and a short list. Include `env(safe-area-inset-bottom)` in the action row.

```text
┌─────────────────────────────────────┐
│ King Down                Learn Menu │
│ Computer · Black · Death Touch  [i] │
├─────────────────────────────────────┤
│                                     │
│        FULL PAINTED BOARD           │
│                                     │
├─────────────────────────────────────┤
│ Your turn · Frost · Freeze 1   [Use] │
│ Archer d4                       [×] │
│ Tap the marked enemy to shoot.      │
├─────────────────────────────────────┤
│ 2. ... e7–e5                 Moves ›│
│ recent moves, if space remains      │
├─────────────────────────────────────┤
│ Hint                         Undo   │
└─────────────────────────────────────┘
```

Learn and Menu are the other two base controls. Hint and Undo stay in the same bottom positions in idle, selection, and armed-power states. The context slot changes content; it does not grow by adding boxes. Put “Cancel Freeze” in that slot while a power is armed. A target tap spends the power as today. Then show “Piece frozen. Make your move.” Use an inline End turn only when the rules allow it.

Keep all board cells reachable. A cell is about 43 px in the current portrait board. This is above WCAG's 24 px minimum but slightly below the 44 pt touch guideline. Do not shrink it to fit more menus. The supplied capture uses CSS pixels; a physical 44 pt claim needs device testing.

### Phone landscape game

Use a short layout when height is at most 500 px, not only when width is below 720 px. At 844 × 390, use a 44 px top band and a 302–313 px board frame. Give the rail about 300 px of width, with a 24 px gap. Center the group. Keep the action row at the rail bottom. The rail body may scroll above it.

```text
┌──────────────────────────────────────────────────────────┐
│ King Down                            Learn        Menu   │ 44
├──────────────────────────────┬───────────────────────────┤
│                              │ Your turn · Freeze 1      │
│                              │ [Use Freeze]              │
│       PAINTED BOARD          │───────────────────────────│
│       about 310 px           │ one short rule / action   │
│                              │ recent moves              │
│                              │───────────────────────────│
│                              │ Hint              Undo    │ 48
└──────────────────────────────┴───────────────────────────┘
```

Do not put the brand in an 84 px floating box over the top-left board area. Do not let a 200 px power paragraph come before the power button. Keep the phone's notch and home area clear. Landscape cells are about 35 px now; retain or increase that size. They pass the AA size floor, but cannot meet a 44 px cell target within this height without scroll.

### New-player first run, at all sizes

Keep the owner's Learn-first title. Keep all twelve figures, the six kings, and the wordmark. Add one plain line: **“Chess with new pieces and random armies.”** Keep two actions: **Learn the pieces** and **Play**. Returning players see **Continue · move 2**, then Learn and Play. Continue must say “View result” when the saved match has ended.

Shortest first fun path:

```text
Title → Learn the pieces → tap Archer → tap marked pawn
                                           ↓
                              shot + short rule + success
                                           ↓
                                Next piece  |  Play
```

This path already has three taps from the title. The proposal removes distractions around it; it does not add a tour. Keep “Archer shoots without moving” beside the first task. After the shot, show “The Archer stays on d4. The pawn is taken.” Offer the next piece and Play at once. Do not require all six lessons before play.

| Size | First-run layout |
|---|---|
| Desktop/laptop | Center the existing art. Put the short title line above two side-by-side actions. In the lesson, use the normal board and a small task rail. Hide app navigation. |
| Tablet | Keep the cast near the wordmark. Use a full-width lesson board and a 96 px task card below it. Keep Hint/Back below the card. |
| Phone portrait | Keep two rows of six figures. Use two 48 px title actions. This saves one action row for the short title line. In lessons, keep the task below the board and within the first view. |
| Phone landscape | Apply the short-height rule at 844 px too. Fit a smaller king group, one cast row, a 40–48 px wordmark, the title line, and side-by-side actions. Do not clip the kings. In lessons, use the compact right rail. |

Play still opens the three-mode setup. For a new browser with no stored preference, use Beginner, White, random army, no powers. Remember later choices. Do not reduce the level of a saved match. A player with no chess knowledge can open “New to chess?” in Learn. That path teaches selecting a piece, a legal move, capture, and the king's safety in small tasks. It is optional.

### Capture coverage and fit checks

Every named row below has desktop, laptop, tablet, phone, and landscape captures. I inspect all five. The listed names are screen stems; each has the size suffix supplied in the brief. The final row has desktop only.

| Screen stems | Desktop/laptop | Tablet | Phone portrait | Phone landscape |
|---|---|---|---|---|
| 01-title-first; 03-title-returning | Actions fit; returning has four | Cast fits; large empty top area | All actions fit; three/four stacked rows | King art clips; four returning actions wrap |
| 02-after-title-play; 10-new-game | Base setup fits | Base setup fits | Base setup fits | Start and Cancel need dialog scroll |
| 04-game-idle | Board fits; move list mostly empty | Small board beside tall rail | Board and controls fit | Board fits; large header consumes space |
| 05-game-selected | Three help blocks precede actions | Same stack in tall rail | Actions move to about y=732; list starts near bottom | Actions and list need rail scroll |
| 06-game-hint | Suggestion is only gold frames | Same frame-only feedback | No plain move instruction | Same feedback; small board |
| 07-game-threats | Many dots and rings | Same symbols; still small board | Clear shapes, but many marks | Dense marks on small cells |
| 08-game-review | Header changes; no visible step controls | Same | Board tap exits; no touch step row | Review help and list take much of rail |
| 11-new-game-powers; 11b-new-game-frost | Both states need dialog scroll | Both states need some scroll | Black picker and footer are below first view | Several dialog views are needed |
| 12-new-game-two | Short setup fits | Fits | Fits | Footer needs scroll |
| 13-new-game-more | Extra choices fit | Fits | Fits near height limit | Army and footer require scroll |
| 14-settings | Account/Close below first view | Near full height; small scroll | Account/Close below first view | Many scroll steps |
| 15-guide | Six normal chess pieces come first | One-column cards; special pieces lower | Only Pawn, Knight, Bishop in first view | About one card in first view |
| 16-lesson | Task rail works; extra controls remain | Board remains small | First task fits | Task fits; extra controls consume rail |
| 17-powers-game; 18-powers-armed | Long rules above Use/Cancel | Same | Use/Cancel near bottom; list lower | Use is outside initial view; armed view scrolls rail |
| 19-two-players | Turn changes; no hand-off tool | Same | Share appears; no explicit delivery mode | Share fits; list is low |
| 20-workshop | Sparse full-screen home | Same | Actions clear; purpose unstated | Home fits |
| 21-promotion | Three choices then one | Same | Useful two-by-two grid | Cancel requires scroll |
| 22-capture-or-push | All three actions fit | Fits | Fits | Fits |
| 23-result | Fits for this short match | Fits | Fits | Footer is at or below lower edge |
| 24-clay-selected | Same rail; stronger square geometry | Not supplied | Not supplied | Not supplied |

Inspect the 25 `-end` captures as well as each first view. None of these supplied files is a `-full` page capture. The absence of page scroll does not mean all tools fit: `#panel` and dialogs scroll internally (`src/style.css:140`, `src/style.css:299`).

Check the mockup at all five sizes. Include idle, a long Ogre rule, selected Maester, armed Freeze, Haste second move, review, and a 60-move list. The board must keep its position and size. Hint, Undo, current power, Cancel, and Live game must be reachable without moving past unrelated content. Check real safe areas, 200% text size, 400% desktop zoom, and keyboard focus separately.

## 6. Visual direction

Keep stone, paper, ink, burgundy, and gold. Make the game surface feel as cared for as the title. The title may stay dark and the game may stay light. Use the same warm ink, gold detail, type, and restrained frame style to connect them. A full dark-game theme is not needed.

### Compact token set

| Role | Token or value | Rule |
|---|---|---|
| Page floor | `#e6e1cf` | Keep the painted floor from `src/style.css:698`. |
| Panel | `#f3ead7` | Existing parchment. |
| Raised surface/field | `#fbf7ee` | Existing vellum; one solid fill. |
| Main text | `#2b2621` | Existing ink. |
| Secondary text | `#5b5045` | Existing soft ink; no opacity reduction. |
| Quiet divider | `#c9bfac` | Existing stone-300; decoration only. |
| Control edge | `#8a8072` | Existing stone-500; use where an edge conveys control shape. |
| Primary action | `#842c21`; pressed `#5a1c14` | Existing accent pair, with vellum text. |
| Gold detail | `#c99a3e`; gold text `#7a5712` | Existing pair; bright gold is not body text on paper. |
| Error/check text | `#b0251b` | Existing danger. Add words and shape. |
| Focus | `#1c5bb0` | Existing focus; 3 px line, 2 px offset. |
| Dark brand surface | `#221d18`; text `#f3ead7`; soft text `#d6c9ad` | Existing title tokens. |
| Type | Alegreya Sans 14, 16, 18 px; Cinzel 20, 28 px | Raise body from 15.5 to 16. Keep Cinzel for brand and major headings. |
| Line height | 1.45 body; 1.2 heading | Keep current body rhythm. |
| Space | 4, 8, 12, 16, 24, 32 px | Keep current six steps. |
| Radius | 6 px control; 12 px dialog | Replace the general 5/8/14 split with two roles. |
| Elevation | none for normal cards; `0 8px 24px #2b262126` for a floating sheet | One soft shadow. The painted board keeps its own art depth. |
| Motion | 120 ms hover/state; 180 ms sheet; existing 300 ms marker entry; 500 ms king fall | Keep the owner's board motion. Make ordinary controls quiet. Off/reduced motion shows the final state. |

Source palette and scale: `src/style.css:23`. Current multi-frame header: `src/style.css:117`. Current button effects: `src/style.css:164`. Current marker times: `src/render/marks.ts:33`. Current king fall: `src/style.css:473`. Values for radius, flat fills, shadow, and the 180 ms sheet are proposals.

### Component rules

- Use three button treatments: filled primary, outlined normal, and plain text. Destructive actions use danger text and a clear question before commit. Do not give every menu button a raised stone edge.
- Put a 20 px icon beside a 16 px label. Use icon-over-label only where it saves real width. Keep names visible; do not replace the official piece icons with new symbols.
- Use one primary action per dialog. Capture and Push are equal alternatives; neither needs a burgundy fill.
- Use 48 px touch height for app actions and at least 44 px for small app controls. Pointer targets need at least 24 × 24 CSS px unless a valid WCAG exception applies. Board cells have a separate fit constraint. Keep the owner-approved 28/36 px Workshop controls in short landscape; they exceed the AA size floor. Check their spacing and real touch use.
- Use one border around a surface, not border + outer ring + inner light edge + drop shadow. Keep a borderless turn strip and a simple context card.
- Give long dialogs a fixed title/Close row, one scroll body, and fixed actions. Keep the focused control fully visible above the footer.
- Use a two-by-two promotion grid at all sizes. In short landscape, use four compact choices in one row if they all fit with 44 px targets.
- Treat “No moves yet” as one line. Do not draw a nearly empty 700 px box. Hide empty capture rows.
- Keep the six game marker shapes. Add a dark/light outline behind Hint and last-move cues. Their meaning must survive grey scale and a still frame.
- Show one short rule first. Put detailed rules behind a clear disclosure. Keep body lines below about 55 characters in a reading sheet.

### Measured contrast

Normal text needs 4.5:1. Large text needs 3:1. Required control and state graphics need 3:1 against adjacent colours. A decorative divider does not automatically need 3:1. These thresholds come from [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) and [W3C's non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

| Foreground / background | Ratio | Reading |
|---|---:|---|
| Ink `#2b2621` / parchment `#f3ead7` | 12.53:1 | Pass for normal text |
| Ink / vellum `#fbf7ee` | 14.01:1 | Pass |
| Soft ink `#5b5045` / parchment | 6.56:1 | Pass |
| Soft ink / disabled stone `#ebe6da` | 6.30:1 | Pass; inactive controls also have an exception |
| Vellum / accent `#842c21` | 8.31:1 | Pass |
| Vellum / primary gradient top `#9c3a2d` | 6.43:1 | Pass at the lighter endpoint |
| Gold text `#7a5712` / parchment | 5.49:1 | Pass |
| Danger `#b0251b` / parchment | 5.62:1 | Pass |
| Focus `#1c5bb0` / parchment | 5.54:1 | Pass for the light-surface ring |
| Control edge `#8a8072` / vellum | 3.63:1 | Pass for a required edge |
| Quiet divider `#c9bfac` / vellum | 1.70:1 | Use only for decoration or redundant grouping |
| Bright gold `#c99a3e` / parchment | 2.15:1 | Do not use as small text or a sole state cue |
| Soft title text `#d6c9ad` / night `#221d18` | 10.20:1 | Pass on the base night colour |
| Hint stroke `#c99a2e` / sampled light stone `#ead9ae` | 1.85:1 | Local non-text contrast risk |
| Same hint stroke / sampled dark stone `#543d27` | 3.93:1 | Pass on this local sample |

The two stone samples are median colours from empty c6 and b6 patches in `06-game-hint-phone.png`. Stone is textured; these samples do not prove the whole board passes or fails. The unbacked Hint stroke is defined at `src/render/marks.ts:144`. Add a 2 px dark under-stroke and a light outer edge, then check all light and dark tile states. Do not confuse the current gold move gems with this problem: the gems already have dark outlines (`src/render/marks.ts:162`).

## 7. Ranked changes

Impact: H = main task or trust; M = common clarity/comfort; L = finish. Effort: S = copy/style/local state; M = several components; L = layout or flow work with broad checks. “Simplifies” means it removes, merges, hides, or reduces a step or repeated information. It does not mean fewer lines of code. Each ID links to the full finding in section 8.

### Quick wins

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F14 | New game | Ask before replacing a live saved match; default to Keep playing | Nielsen: error prevention | Both | H | S | No |
| F24 | Long dialogs | Pin Close and Start/Cancel around one scroll body | User control; WCAG 2.4.11 | Both | H | M | Yes |
| F02 | First setup | Use Beginner for a fresh browser; keep remembered levels | Casual-game onboarding | New | H | S | Yes |
| F09 | Hint | Say the suggested piece, action, and destination; strengthen its outline | Visibility; WCAG 1.4.11 | Both | H | S | Yes |
| F28 | Keyboard/review | Scope R/Z to the board; keep review focus after refresh | WCAG 2.1.4, 2.4.3 | Both | H | M | Yes |
| F25 | Moves/touch | Give every move entry at least 24 px height; 44 px on touch | WCAG 2.5.8; Fitts | Both | H | S | No |
| F36 | Account | Say “Sync your saved game across devices” | Nielsen: match with real world | Both | M | S | Yes |
| F05 | Army examples | Replace codes with names; hide Catapult lab from normal setup | Recognition; progressive disclosure | New | M | S | Yes |
| F01 | Title | Add one game line; move Workshop out of the first title | Hick; minimalist design | New | M | S | Yes |
| F23 | Promotion/push | Use a balanced promotion grid and shorter equal-choice labels | Proximity; recognition | Both | M | S | Yes |

### Next

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F30 | Powers in play | Move Use beside the turn; show one rule and one next step | Proximity; visibility | Both | H | M | Yes |
| F08 | Selection | Merge help, Cancel, and piece rules in one fixed context area | Common region; minimalist design | Both | H | M | Yes |
| F10 | Review | Replace play actions with Previous, Next, Live game | User control; Jakob | Both | H | M | Yes |
| F11 | Review | Read piece info, captures, and speech from the viewed position | Nielsen: consistency | Both | H | M | Yes |
| F19 | Navigation/settings | Use Learn + Menu; separate preferences, game tools, and Account | Progressive disclosure | Both | H | M | Yes |
| F31 | Passive powers | Use “Always on” for passive effects and explain automatic Leap targets | Recognition; visibility | Both | H | M | Yes |
| F32 | Result | Lead with the outcome; move detailed mistakes to Review game | Peak-end; progressive disclosure | Both | M | M | Yes |
| F21 | Controls/surfaces | Use three button treatments and one frame per surface | Consistency; minimalist design | Both | M | M | Yes |
| F22 | Type/copy | Use 16 px body copy and short body-font controls | Readability; WCAG 1.4.4 | Both | M | S | Yes |
| F37 | Preferences | Keep Piece letters after reload and look changes | Nielsen: consistency | New | M | S | Yes |

### Bigger redesign

| ID | Screen | Concrete change | Why / principle | Audience | Impact | Effort | Simplifies |
|---|---|---|---|---|---|---|---|
| F07 | Tablet/landscape | Fit by width and height; use a portrait tablet column | Fitts; responsive fit | Both | H | L | Yes |
| F20 | Game frame | Center board + rail; remove the floating header box | Proximity; visual hierarchy | Both | H | M | Yes |
| F17 | Power setup | Collapse both pickers to summaries; edit one at a time | Hick; progressive disclosure | New | H | M | Yes |
| F03 | First lessons | Remove unrelated actions; offer Play after the first success | Casual-game onboarding | New | H | M | Yes |
| F04 | Learn/Guide | Show King Down pieces first; merge reference and lessons | Recognition; information scent | New | H | M | Yes |
| F15 | Two players | Add Flip and a clear hand-off state; do not force rotation | User control; chess convention | Both | M | M | No |
| F16 | Game link | Distinguish device play from turn-by-link play | Nielsen: match with real world | Both | H | M | No |
| F26 | Reflow/safe areas | Add safe-area space and allow text to reflow within sheets | WCAG 1.4.10, 2.4.11 | Both | H | M | No |
| F33 | Workshop entry | Keep creation in Learn/Menu; state its purpose before entry | Hick; progressive disclosure | New | M | S | Yes |
| F06 | No-chess path | Add optional small chess-control tasks in Learn | Help/documentation; onboarding | New | H | L | No |

## 8. Full finding list by area

### A. First run, onboarding, and learning

#### F01 — The title shows the cast before it explains the game

- **Screens/severity:** first and returning title, all sizes; minor.
- **Evidence:** `01-title-first-phone.png`, `03-title-returning-desktop.png`, `01-title-first-landscape.png`; `index.html:107`, `src/style.css:680`.
- **Problem:** The title has piece names, art, and actions, but no plain game description. A new player cannot tell what Play offers. Workshop is a third first-visit path. At 844 × 390, the short-title rule does not apply because its width limit is 720 px; the kings clip.
- **Principle:** Hick's law; Nielsen's minimalist design; responsive fit.
- **Recommendation:** Keep the full lineup and Learn-first choice. Add “Chess with new pieces and random armies.” Move Workshop to Learn and Menu. Use a height-based title rule for short landscape. Keep Continue first on return. For a finished save, use “View result.”
- **Simplifies:** yes. It removes one first-visit choice and explains the two that remain.

#### F02 — Club is too demanding as the untested first default

- **Screens/severity:** first Play and computer setup; major for new players.
- **Evidence:** `02-after-title-play-phone.png`, `02-after-title-play-laptop.png`; `src/new-game.ts:33`; level descriptions at `index.html:131`.
- **Problem:** A fresh setup selects Club. The player has not yet learned the special pieces. The level explanation is a hover title; it is hard to get on touch. This does not prove Club is too strong for every player, but it makes first-play risk needlessly high.
- **Principle:** casual-game onboarding; Nielsen's error prevention.
- **Recommendation:** Select Beginner only for a browser with no saved setup. Keep all four levels in the current row. Use one selected-level line: “Beginner makes more mistakes.” Remember later choices. Keep saved games at their existing level.
- **Simplifies:** yes. A new player need not judge an unknown level before play. **This reverses the Round 3 Club default** (`docs/visual-design/README.md:64`).

#### F03 — The first lesson shares too much game controls

- **Screens/severity:** lessons, all sizes; major.
- **Evidence:** `16-lesson-phone.png`, `16-lesson-landscape.png`; `index.html:39`, `src/main.ts:475`, `src/main.ts:678`.
- **Problem:** New game, Guide, Workshop, Settings, Hint, Undo, Resign, and Return to game surround one small task. Undo and Resign can be disabled, but still take space. The first-visit label “Return to game” refers to a match the player has not chosen. Play becomes available only at the end of the six-step sequence through the normal next-step path.
- **Principle:** Hick; casual-game onboarding; Nielsen's match with real world.
- **Recommendation:** In a lesson, show the task, progress words, Hint, and Back. After the first goal, replace these actions with Next piece and Play. Back returns to the title on a true first visit, or the protected match on a later visit. Keep all six lessons available.
- **Simplifies:** yes. The incomplete lesson falls from eight fixed controls to two. It shortens the path from first success to a full game.

#### F04 — The Guide makes the known pieces the first lesson

- **Screens/severity:** Guide at all sizes, especially phone and landscape; major.
- **Evidence:** `15-guide-phone.png`, `15-guide-desktop.png`, `15-guide-landscape.png`, `15-guide-phone-end.png`; `src/main.ts:290`, `index.html:228`.
- **Problem:** Pawn, Knight, Bishop, Rook, Queen, and King come before the six King Down pieces. The phone first view reaches only three standard pieces. Detailed notation and all twelve power rules then form a long reading task. Selecting a piece on the board does not open its Guide card directly.
- **Principle:** recognition; progressive disclosure; Nielsen's help and documentation.
- **Recommendation:** Make Learn the shared home for reference and lessons. Show the current selected piece first when entered from a match. Otherwise show Archer, Beast, Maester, Ogre, Guard, then Paladin. Fold normal chess rules, army pool, notation, and the full powers list under named sections. Mark Paladin “Custom armies” because it is outside the random pool. Keep its lesson and rules.
- **Simplifies:** yes. It hides known or rare rules and removes the separate Guide-versus-lessons choice.

#### F05 — “Try these” is present, but hidden behind army codes

- **Screens/severity:** More options and example armies; minor.
- **Evidence:** `13-new-game-more-phone.png`; `index.html:159`; `src/try-these.ts:1`; `src/main.ts:1262`, `src/main.ts:1285`.
- **Problem:** The code contains practice guidance, but the select shows codes such as `MMSSNBNK` and `QOGNRKBA`. Three generated examples are Catapult lab armies. The useful “watch” text is in an option title and then appears only after game start. Native select titles do not give a reliable touch preview.
- **Principle:** recognition over recall; progressive disclosure.
- **Recommendation:** Move practice to Learn and name the goal: “Archer shot,” “Beast chain,” “Ogre push.” Keep army codes in advanced details and copy tools. Hide experimental Catapult armies from the normal user list. Keep lab access for testing.
- **Simplifies:** yes. Setup shows four general army choices rather than fourteen mixed choices.

#### F06 — Learn assumes that the player already knows chess

- **Screens/severity:** first run, Guide, and lesson controls; major for a player with no chess knowledge.
- **Evidence:** `15-guide-phone.png`, `16-lesson-phone.png`; `src/main.ts:315`; `src/lessons.ts:14`.
- **Problem:** “Mate the king,” “check,” “rank,” and “marked enemy” assume prior knowledge. The six lessons teach special moves, not the basic goal, turn, or capture. There is no basic-chess lesson in the six lesson definitions.
- **Principle:** Nielsen's match with real world and help/documentation; casual-game onboarding.
- **Recommendation:** Add an optional “New to chess?” path inside Learn. Use small tasks for select/move, take a piece, protect the king, and win by checkmate. Do not make it a forced first-run question. In the main game, explain only the first unfamiliar action.
- **Simplifies:** no. It adds learning content, but leaves the fast path unchanged.

#### F38 — Lesson completion is saved but not used as a useful return path

- **Screens/severity:** returning Learn and lessons; minor.
- **Evidence:** `03-title-returning-phone.png`, `16-lesson-desktop.png`; `src/main.ts:619`, `src/main.ts:648`, `src/main.ts:489`.
- **Problem:** Completed lesson names are stored. Learn still starts at Archer. The visible six icons show current-session progress and are hidden from screen readers; the header does state the current lesson number. A returning player cannot use the saved progress to choose the next missing piece.
- **Principle:** Nielsen's flexibility and efficiency; recognition.
- **Recommendation:** In Learn, show the six named lessons with Done text for completed ones. Offer “Continue learning: Ogre” when appropriate. Keep “Repeat Archer” available. Do not turn this progress into a locked game or a reward system.
- **Simplifies:** yes. It removes repeated steps for a returning learner.

### B. Core play loop and chess expectations

#### F07 — Width-only layout gives the tablet the wrong shape

- **Screens/severity:** game states on tablet and landscape; major.
- **Evidence:** `04-game-idle-tablet.png`, `05-game-selected-landscape.png`, `17-powers-game-landscape.png`; `src/style.css:92`, `src/style.css:627`, `src/render/PaintedView.ts:84`.
- **Problem:** The 820 px portrait tablet gets the desktop 272 px rail. Its board is about 516 px wide despite 1180 px of height. The 844 px landscape phone also gets desktop rules. Its long selection and power content needs rail scroll. The board does fit at 1280 × 720; a redesign must preserve that useful fit.
- **Principle:** Fitts; responsive design; minimalist design.
- **Recommendation:** Use the one-column tablet layout and a short-height landscape layout from section 5. Fit the board from both available width and height. Keep the actions outside the scrolling rail body. Do not shrink the board to make unrelated tools fit.
- **Simplifies:** yes. It removes the tall tablet rail and replaces two broken breakpoint assumptions with content-fit rules.

#### F08 — One selection produces three separate help blocks

- **Screens/severity:** selected-piece state, all sizes; major on phone/landscape.
- **Evidence:** `05-game-selected-phone.png`, `05-game-selected-laptop.png`; `index.html:46`, `index.html:47`, `index.html:54`; `src/main.ts:336`.
- **Problem:** Move-help, Cancel selection, and the piece card repeat related information in separate frames. On the phone, Hint/Undo start near y=732 and the move list starts at the bottom edge. The help says how to tap; the full pawn paragraph gives rules the chess player already knows.
- **Principle:** common region; proximity; minimalist design.
- **Recommendation:** Use one context card with name/square, one action line, and a 44 px Cancel control. Example: “Pawn d2” and “Tap a marked square.” Put full rules behind the name or Learn. Show a longer rule for a new special piece; keep it within the same reserved space. Keep a visible Cancel path for touch and keyboard.
- **Simplifies:** yes. It merges three blocks and removes repeated text without removing control.

#### F09 — Hint marks a move but does not say what to do

- **Screens/severity:** Hint, all sizes; major for a new player.
- **Evidence:** `06-game-hint-phone.png`, `06-game-hint-desktop.png`; `src/main.ts:885`; `src/render/marks.ts:144`.
- **Problem:** Hint sets square frames, but no visible move sentence. A player must infer the piece, order, and action. The same gold stroke has about 1.85:1 contrast against one sampled light stone patch. A shot or swap is less obvious than a normal move.
- **Principle:** visibility of system status; recognition; WCAG 1.4.11.
- **Recommendation:** Put the engine's proposed move in the existing context area using the existing move-description code. Example form: “Try: Archer d4 shoots the pawn on e5.” Mark source and target for this suggestion and use the correct special-move shape. Give the frame a dark/light edge. Announce the suggestion after the search. Do not add an evaluation bar to normal play.
- **Simplifies:** yes. The player interprets one instruction instead of unnamed square marks.

#### F10 — Touch review has no visible way to step through moves

- **Screens/severity:** review, all sizes; major on touch.
- **Evidence:** `08-game-review-phone.png`, `08-game-review-landscape.png`; `src/main.ts:419`, `src/main.ts:901`, `src/main.ts:1326`.
- **Problem:** A move button opens review and the header changes. The help says tap the board to return. Arrow keys step through history, but touch has no Previous/Next controls. The play row still shows Undo and Resign. Board taps also have a different meaning in review than in play.
- **Principle:** Nielsen's user control and mode visibility; Jakob's law.
- **Recommendation:** Make review explicit. Replace Hint/Undo with Previous/Next and show Live game in the context area. Keep the selected move visible. Use a clear Review label. Board taps may still leave review, but must not be the only visible exit.
- **Simplifies:** yes. It replaces irrelevant play controls and removes the need to know hidden gestures.

#### F11 — Review shows an old board with some live-game information

- **Screens/severity:** review; major, based on source.
- **Evidence:** `08-game-review-desktop.png`; `src/main.ts:905`, `src/main.ts:919`, `src/main.ts:336`, `src/main.ts:457`, `src/main.ts:562`.
- **Problem:** `showPly` draws the stored position. Piece information and the keyboard cursor description still read `game.pos`. Captured-piece totals iterate the full history. Thus an early board can have a later piece description or later capture count. The short supplied review has no captures, so it does not expose the count error. Last-move markers already use the viewed move correctly (`src/main.ts:390`); threats are hidden in review (`src/main.ts:530`).
- **Principle:** Nielsen's consistency and visibility; WCAG 1.3.1 and 4.1.2 for correct announced state.
- **Recommendation:** Make every review readout use the viewed position and history prefix. Include piece card, cursor speech, captures, and turn/check text. Keep the existing correct viewed-move marker. Test a game with captures and a piece that later leaves its square; review before those moves.
- **Simplifies:** yes. One position supplies all readouts. It also removes conflicting information.

#### F12 — Captures have a large empty home but little fast value

- **Screens/severity:** normal game and long-game information; minor.
- **Evidence:** `04-game-idle-desktop.png`, `04-game-idle-tablet.png`; `index.html:68`; `src/style.css:269`, `src/main.ts:455`.
- **Problem:** One move occupies a nearly full-height sheet on desktop and tablet. Two empty “White took / Black took” rows remain visible. Grouped icons and accessible names already exist after captures. A fast player gets no quick material difference.
- **Principle:** minimalist design; proximity; chess-app convention.
- **Recommendation:** Hide empty capture rows and attach filled rows to their player strip. Use a small move list until there are enough moves to need space. Inside expanded Moves, offer an optional “Material ≈ +3” based on the current piece values. Call it an estimate. Fairy-piece value depends on position and powers. Keep it separate from a position evaluation.
- **Simplifies:** yes for empty rows and placement; no for the optional material estimate. Do the removal first.

#### F13 — Last move, check, and threats need a clear visual order

- **Screens/severity:** board marks, all sizes; minor.
- **Evidence:** `07-game-threats-phone.png`, `05-game-selected-phone.png`; `src/main.ts:399`, `src/render/PaintedView.ts:184`, `src/style.css:100`.
- **Problem:** Last move is a warm square wash; Hint is a gold frame; legal moves use gold gems. Threat dots and rings can fill much of the board. Check already has CHECK text and a king ring, so it is not a colour-only warning. The owner explicitly chooses to mark only where the piece goes or hits, not its origin.
- **Principle:** visual hierarchy; WCAG 1.4.1 and 1.4.11; recognition.
- **Recommendation:** Keep the owner's destination-only last-move rule. Add a strong two-tone edge to that mark and put the source/action in the latest-move text. Keep check above other marks. Put the threats toggle in Learn's board-help area, beside its explanation; keep it off by default. During selection, keep capture markers visually distinct from threat rings.
- **Simplifies:** yes. The latest-move sentence supplies meaning without another persistent board marker. This does not reverse the origin-marker decision.

#### F14 — Start game replaces a live match without a check

- **Screens/severity:** New game over a match; major.
- **Evidence:** `10-new-game-phone.png`; `src/main.ts:1270`, `src/main.ts:954`, `src/main.ts:976`; contrast with Resign at `src/main.ts:1094` and link replacement at `src/main.ts:1439`.
- **Problem:** Start game immediately resets and saves a new match. The dialog does not state that it replaces the current saved match. Resign and an unrelated game link already ask first. Starting a new match can remove the only normal route back to the old one.
- **Principle:** Nielsen's error prevention and user control. This is a game-design safety rule, not a claim that WCAG 3.3.4 applies to every game action.
- **Recommendation:** At final Start, if a non-finished match has moves, ask “Replace your current game?” with “Keep playing” and “Start new game.” Focus Keep playing. Opening or cancelling setup does not change the match. Skip the question for a fresh board or finished game.
- **Simplifies:** no. It adds one necessary check only when the current match is at risk.

#### F15 — On-device play has a turn label but no deliberate hand-off

- **Screens/severity:** two players; minor.
- **Evidence:** `19-two-players-phone.png`, `19-two-players-landscape.png`; `src/main.ts:944`.
- **Problem:** After e4, Black to move is visible, but the board stays in White's orientation on one device. There is no manual Flip control in the markup or game key handler. Automatic orientation exists for a human playing Black against the computer or from a link. This is a discoverability gap for face-to-face play, not a missing renderer feature.
- **Principle:** user control; chess-app convention; Fitts.
- **Recommendation:** Add Flip board to Menu and an F shortcut while the board has focus. After a local move, use “Black to move · pass the device.” Let players choose automatic turn rotation once; keep manual rotation as the default. Do not add a mandatory hand-off dialog after each move.
- **Simplifies:** no. It adds a small control. It removes repeated device rotation and avoids a new per-turn tap.

#### F16 — Two players combines two different ways to play

- **Screens/severity:** two-player setup and game link; major.
- **Evidence:** `12-new-game-two-phone.png`, `19-two-players-phone.png`; `index.html:129`; `src/main.ts:1113`, `src/main.ts:1126`, `src/main.ts:1447`.
- **Problem:** One-device play and a turn-by-link game share one mode description. The link contains the whole game at the time it is sent. It is not a live room. An incoming link locks play to the receiving side. The starting two-human game remains a local two-player board. A player can expect a persistent online match without seeing the need to send each new turn.
- **Principle:** Nielsen's match with real world and visibility.
- **Recommendation:** Keep the owner's Two players mode. Inside it, show On this device and By link. For By link, use “Send each turn as a link.” Name the action “Share turn,” then “Link copied.” On successful share, show “Send this link. Open your friend's reply to continue.” Preserve the existing input-side lock and replacement check. Do not imply live sync.
- **Simplifies:** no. It adds a setup distinction, but prevents a larger mental-model error. Do not build a live multiplayer service as part of this UI pass.

### Comparison with lichess and chess.com

Use their familiar play controls, while keeping King Down's art and rules. Do not copy their whole service structure.

| Need | Current King Down | Reference pattern | Concrete choice |
|---|---|---|---|
| Fast movement | Tap/click/drag and keyboard already exist | Lichess documents keyboard board navigation and move commands | Keep current input; surface a short key list in Learn |
| Board orientation | Automatic in limited cases | Lichess documents F; Chess.com provides Flip Board | Add manual Flip without adding a permanent button |
| Space and density | Fixed rail; large empty sheet | Chess.com offers board size, Focus, and Theatre tools | Fit the board automatically; collapse idle detail before adding view modes |
| Material | All captured pieces only | Lichess's own interface supports difference, captures, or hidden | Hide empty captures; offer an optional estimate in Moves |
| Review | Clickable history; arrows; no touch step row | Chess.com separates analysis options; Lichess documents review navigation | Use a clear Review state with three named controls |
| Rematch | One click; same start, sides swap | Fast restart is a normal chess-game expectation | Keep the existing fast rematch; explain its side swap |

Sources: [Lichess's official accessible-board guide](https://lichess.org/page/blind-mode-tutorial), [Lichess's own interface strings](https://github.com/lichess-org/mobile/blob/main/translation/source/mobile.xml), [Chess.com board-size and view tools](https://support.chess.com/en/articles/8609533-how-do-i-change-my-board-size), and [Chess.com analysis tools](https://support.chess.com/en/articles/8583825-how-do-i-use-the-analysis-board). This is a pattern comparison, not a live timed test of either service. Standard chess notation does not fully describe King Down's shots, chains, swaps, pushes, or powers. Keep the current move record and add plain names where needed.

### C. Setup, settings, and navigation

#### F17 — Powers setup exposes both armies at once

- **Screens/severity:** all powers/Frost picker sizes; major.
- **Evidence:** `11-new-game-powers-phone.png`, `11b-new-game-frost-phone-end.png`, `11-new-game-powers-laptop.png`, `11-new-game-powers-tablet-end.png`; `src/new-game.ts:100`.
- **Problem:** Three modes, four levels, twelve king emblems, six power buttons, More, and two footer actions create 28 controls. Both sides' detailed rules are visible together. Start game lies below the first view even on the tall tablet capture. The new player must edit the opponent as well as choose their own power, or work out that defaults are acceptable.
- **Principle:** Hick; progressive disclosure; recognition.
- **Recommendation:** Keep the six emblems and three power choices inside each picker. Initially show two summaries: “You: Spirit · Holy Light · Always on” and “Computer: Shadow · Death Touch · Always on,” each with Change. Edit one side at a time. Keep the existing defaults and counts. Pin Start/Cancel. A chosen power scene can show its current rule; do not show all rules together.
- **Simplifies:** yes. It reduces initial controls from 28 to 12. It changes the Round 3 expanded presentation, but keeps the owner's emblem picker and default kings.

#### F18 — Custom army input uses a separate native prompt and late errors

- **Screens/severity:** More options and Custom army; minor.
- **Evidence:** `13-new-game-more-desktop.png`; `index.html:158`; `src/main.ts:1272`.
- **Problem:** The main dialog leads to a native text prompt containing a pool code. Validation follows Start and uses alerts. The draft becomes the remembered setup before all custom-army start checks finish. A malformed army can leave the next setup remembered as Custom even though the player does not get a valid new game.
- **Principle:** Nielsen's error prevention; WCAG 3.3.1 and 3.3.2.
- **Recommendation:** When Custom is chosen, show one labelled code field inside More options, with a small piece preview. Validate there: eight pieces, one king, the current allowed counts. Disable final Start only while the code is invalid, with a visible reason. Save the setup after a valid start. Keep raw codes for fast players; do not require a new drag editor.
- **Simplifies:** yes. It removes the prompt/alert surfaces and keeps correction beside the field.

#### F19 — Settings mixes preferences, match tools, and identity

- **Screens/severity:** navigation and Settings, all sizes; major on phone/landscape.
- **Evidence:** `14-settings-phone.png`, `14-settings-phone-end.png`, `14-settings-landscape-end.png`; `index.html:172`.
- **Problem:** Sound, auto-queen, threats, animation, look, letters, coordinates, thinking time, army code, Copy moves, sign-in, privacy, and Close share one scroll sheet. Thinking time sits under Board although it applies to Strong computer play. Copy moves is a match action. Account is a separate task.
- **Principle:** common region; progressive disclosure; Nielsen's consistency.
- **Recommendation:** Keep Play and Board preferences in a short sheet. Move thinking time to More options only when Strong is selected; show a number in seconds. Move Copy moves and current army details to Menu/Moves. Put threats beside board help in Learn. Open Account from Menu in its own sheet. Keep Learn visible during play; hide New game, Workshop, and Preferences behind Menu.
- **Simplifies:** yes. It removes unrelated items from the preference task. It adds one sheet, but does not make accounts part of play.

#### F37 — Piece letters do not stay on after reload

- **Screens/severity:** Settings and look changes; minor, based on source.
- **Evidence:** `14-settings-phone.png`; `src/main.ts:1319`, `src/main.ts:1152`, `src/main.ts:69`.
- **Problem:** Piece letters are set from `?labels=1` and only update the current view. They are absent from the saved settings shape. Look changes reload the page. A new player who uses letters to identify figures can lose that aid when changing the look or reopening the app.
- **Principle:** Nielsen's consistency and user control.
- **Recommendation:** Store Piece letters with the existing board preferences, as Coordinates already is. Keep it on across look changes and return visits. A link should keep the receiver's display preferences.
- **Simplifies:** yes. It removes a repeated correction step. It does not add a control.

### D. Visual system and board focus

#### F20 — The header is ornate; the surrounding game space is not composed

- **Screens/severity:** normal game, desktop/laptop/tablet/landscape; major on tablet, minor elsewhere.
- **Evidence:** `04-game-idle-desktop.png`, `04-game-idle-tablet.png`, `17-powers-game-landscape.png`; `src/style.css:117`, `src/style.css:138`.
- **Problem:** The title card has several edge layers and a shadow. It holds a larger brand than turn information. The board is centered in one large region while the rail sits at the far right. The title's dark art scene then gives way to wide plain floor areas and a pale rail. The board remains the most interesting object, but its useful controls feel far away.
- **Principle:** proximity; common region; aesthetic-usability effect.
- **Recommendation:** Center the board/rail group with a 24 px gap. Remove the floating header frame. Use a small brand bar and a stronger turn label next to the board. Keep the light floor and the dark title; connect them with the same type, restrained gold, and paper surfaces. Do not add texture to every empty area.
- **Simplifies:** yes. It removes a framed object and unused distance.

#### F21 — Too many controls use the same heavy raised treatment

- **Screens/severity:** menu, New game, Settings, Guide, and result; minor.
- **Evidence:** `05-game-selected-desktop.png`, `10-new-game-phone.png`, `23-result-phone.png`; `src/style.css:164`, `src/style.css:337`, `src/style.css:401`.
- **Problem:** Button lifts, inset highlights, double selected borders, outer dialog rings, card shadows, and the move-box inset shadow all compete. Icon-over-label buttons consume 58–60 px of height. Ordinary navigation looks as important as making a move or using a power.
- **Principle:** consistency; visual hierarchy; minimalist design.
- **Recommendation:** Apply the three button treatments and one-frame surface rule from section 6. Use side-by-side icon/label controls where width permits. Keep burgundy for the main next action. Keep emblems distinct by their art and selected state, not several new layers of shadow.
- **Simplifies:** yes. It reduces visual treatments and control height.

#### F22 — Small type and long sentences work against the warm type choice

- **Screens/severity:** phone rules, power text, menu labels, Guide, and result; minor.
- **Evidence:** `05-game-selected-phone.png`, `15-guide-phone.png`, `17-powers-game-phone.png`; `src/style.css:49`, `src/style.css:237`, `src/style.css:639`; `texts.json` keys for these screens.
- **Problem:** The smallest general size is 12.5 px; phone piece rules use it. Cinzel appears in small control headings and several labels. Terms such as “orthogonally,” pool codes, and long power sentences make the player work harder. Good measured contrast does not make small dense text easy to read.
- **Principle:** readability; Nielsen's match with real world; WCAG 1.4.4 and 1.4.12.
- **Recommendation:** Use 16 px body text and 14 px only for secondary data. Use Alegreya Sans for controls and rule names in tight spaces. Keep Cinzel for brand and major headings. Replace repeated full rules with the short current-step copy below. Do not remove a power restriction to make the text shorter.
- **Simplifies:** yes. It reduces wording and type roles; larger type requires the layout removals above.

#### F23 — Promotion has uneven rows; Capture/Push has too much equal emphasis

- **Screens/severity:** promotion and Ogre choice, all sizes; minor.
- **Evidence:** `21-promotion-desktop.png`, `21-promotion-phone.png`, `21-promotion-landscape.png`, `22-capture-or-push-phone.png`; `src/style.css:455`; `src/main.ts:747`; `index.html:217`.
- **Problem:** Promotion is three choices then one on larger screens, but a useful two-by-two on phone. In landscape, Cancel falls below the first view. Capture and Push are both burgundy; a long sentence must explain the outcome. Both decisions already wait for a deliberate choice, and Cancel leaves the move unplayed.
- **Principle:** proximity; recognition; user control.
- **Recommendation:** Use a stable two-by-two promotion grid, or four compact choices in a short landscape row. Keep names and painted art. For the Ogre, use “Take pawn” and “Push pawn to c6.” Under Push say “Ogre moves to c5.” Use equal normal buttons and a separate Cancel. Preview the exact outcome on focus/hover if the existing board can show it without extra text.
- **Simplifies:** yes. It shortens the decision and removes an accidental empty grid cell. Keep auto-queen in preferences for fast players.

#### F35 — Clay is a useful option but has different mark language

- **Screens/severity:** Clay desktop; minor. Other Clay sizes are not supplied.
- **Evidence:** `24-clay-selected-desktop.png`; `docs/painted-game/README.md:5`; `docs/visual-design/README.md:53`; `src/main.ts:67`.
- **Problem:** Clay makes square geometry clear, but its bright tile marks differ from the painted gem/ring system. The game rail stays the same. A look switch changes rendering and reloads the page, so it must not change help or preferences. The capture is not enough to judge Clay on touch or after camera movement.
- **Principle:** consistency; recognition; user control.
- **Recommendation:** Keep Painted as the owner-approved default and Clay in Board preferences. Keep the same state meanings and plain action text across both. Check selection, shot, shove, power, check, and keyboard cursor in Clay at all five sizes. Do not add a prominent Clay choice to first run or redraw Clay from this one image.
- **Simplifies:** yes. The first run keeps one look, and both renderers use one help model.

### E. Responsive layout, accessibility, and feedback

#### F24 — Long dialogs hide both the exit and the commit action

- **Screens/severity:** New game, powers, Settings, Guide, promotion, result; major on short screens.
- **Evidence:** `02-after-title-play-landscape.png`, `10-new-game-landscape-end.png`, `11b-new-game-frost-phone.png`, `14-settings-phone-end.png`, `15-guide-landscape-end.png`, `21-promotion-landscape.png`, `23-result-landscape.png`; `src/style.css:299`, `src/style.css:321`.
- **Problem:** The whole dialog scrolls. The title, Close/Cancel, and footer do not stay visible. Powers setup needs scroll even on desktop. A new player can miss Start; a touch player can need a long scroll just to close the Guide. Escape and backdrop dismiss already work (`src/dialog-dismiss.ts:13`), but are not substitutes for a visible touch exit.
- **Principle:** user control; Fitts; WCAG 2.4.11 focus not obscured.
- **Recommendation:** Use a fixed title/Close row, one scroll body, and fixed footer. Give the body scroll padding equal to the footer height. Preserve native dialog focus containment. Use a 16 px screen margin plus safe-area space. Keep the close label available to screen readers.
- **Simplifies:** yes. It removes the need to find the end of content to act.

#### F25 — Touch rules miss tablets; desktop move entries risk the AA size floor

- **Screens/severity:** move list and small controls; major accessibility risk.
- **Evidence:** `04-game-idle-tablet.png`, `08-game-review-landscape.png`; `src/style.css:278`, `src/style.css:627`, `src/style.css:650`; Workshop exceptions at `src/workshop/workshop.css:112`.
- **Problem:** Main touch sizing applies below 720 px. Tablet and 844 px landscape use the base move buttons. The move-entry rule resets all button styles and gives only 1 px vertical padding. With 14 px type and 1.45 line height, a row can be about 22.3 px high, with no vertical row gap. That is a source-based WCAG 2.5.8 risk, not a live DOM measurement. Most app buttons are already large. The Workshop's approved 28/36 px short-landscape controls exceed the 24 px AA minimum; they are not automatic failures.
- **Principle:** WCAG 2.5.8; Fitts; Apple's 44 pt touch guideline.
- **Recommendation:** Use at least 24 px height for every history entry and check the spacing exception where needed. On coarse-pointer devices, use 44 px or more for history and 48 px main actions, independent of width. Keep the owner's compact Workshop exceptions and test their spacing and touch use. Do not claim AA requires every control to be 44 px.
- **Simplifies:** no. It makes existing targets easier to hit. The layout work removes the space needed for extra controls.

The exact AA rule is 24 × 24 CSS pixels or a valid exception, including sufficient spacing. See [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). The larger touch goal is design guidance, not the AA threshold; see [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility).

#### F26 — Safe-area and enlarged-text behaviour need explicit layout support

- **Screens/severity:** phone portrait/landscape, dialogs, standalone app; major risk, not a proved device failure.
- **Evidence:** `index.html:5`; `src/style.css:85`, `src/style.css:628`; `src/workshop/workshop.css:5`; `public/manifest.webmanifest` sets `orientation: any`. No `safe-area-inset` use appears in the inspected game or Workshop styles.
- **Problem:** `viewport-fit=cover` lets content enter screen cutout areas. Current styles do not reserve those insets. Fixed viewport layouts and hidden body overflow also need enlarged-text checks. The supplied captures have no notch or browser toolbar, and do not test zoom. The board may need two-dimensional layout, but the controls and prose must still reflow.
- **Principle:** WCAG 1.4.4, 1.4.10, 1.4.12, and 2.4.11; Apple HIG.
- **Recommendation:** Pad edge actions with safe-area insets. Use dynamic viewport height for the game, as dialogs already partly do. At enlarged text, let the rail/sheet body scroll while named actions remain visible. Do not force portrait orientation. Test 320 CSS px reading width, 200% text, and 400% desktop zoom; allow the board's valid two-dimensional exception only for the board.
- **Simplifies:** no. It makes the same layout robust on real devices and text settings.

#### F27 — Several useful states are visible but not announced

- **Screens/severity:** thinking, Hint, turn hand-off, share/copy; major accessibility risk.
- **Evidence:** `index.html:34`, `index.html:35`, `index.html:76`; `src/main.ts:431`, `src/main.ts:579`, `src/main.ts:885`, `src/main.ts:1133`.
- **Problem:** Completed moves, refusal help, and cursor squares have live regions. Loading pieces also has a status region. The turn and “thinking…” header do not. Hint ends with visual frames and no spoken suggestion. Link copied is button text; Copy moves has no success text. Clipboard fallback can fail silently yet the link button still says copied.
- **Principle:** WCAG 4.1.3 status messages; Nielsen's visibility and error recovery.
- **Recommendation:** Use one polite game-status channel for turn, thinking, hint, copy, and waiting-for-reply messages. Announce thinking once if it lasts more than about 300 ms. Do not announce every animation frame. Show “Link copied” only after a successful copy; otherwise show selectable link text. Reuse the Workshop's existing visible copy fallback pattern (`src/workshop/dialog.ts:173`).
- **Simplifies:** yes. It gives feedback one stable home and removes uncertain success states.

#### F28 — Keyboard support is real, but review focus and key scope need repair

- **Screens/severity:** keyboard play, history, review, dialogs; major accessibility risk.
- **Evidence:** `index.html:31`; `src/main.ts:448`, `src/main.ts:452`, `src/main.ts:1326`, `src/main.ts:1347`; `src/style.css:620`.
- **Problem:** Arrow/Enter/Space board play and visible focus already exist. R and Z are global letter shortcuts outside a few excluded dialogs; no off/remap control appears. Rebuilding the move list with `innerHTML` removes the focused move button during review. This creates a source-based focus-loss risk. With a visible board cursor, left/right move the cursor rather than the history, despite the review help line.
- **Principle:** WCAG 2.1.1, 2.1.4, 2.4.3, 2.4.7, and 4.1.2.
- **Recommendation:** Scope letter shortcuts to board focus, which satisfies one allowed character-shortcut path. Block game shortcuts under all modal surfaces. Keep or restore focus to the same move entry after review refresh. Give Previous/Next ordinary buttons and define the key behaviour for review. Keep Escape as the cancel path. Test the board's `role=application` with VoiceOver and NVDA before changing it; the code alone does not prove good screen-reader use.
- **Simplifies:** yes. Each focus state gets one clear key meaning; no shortcut-settings panel is needed. [W3C character-shortcut guidance](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) allows shortcuts active only on component focus.

#### F29 — Loading and motion controls need one clear rule, not more animation

- **Screens/severity:** loading, Hint, Workshop entry, board motion; minor risk/polish.
- **Evidence:** `index.html:36`; `src/main.ts:652`, `src/main.ts:885`, `src/main.ts:1310`, `src/main.ts:1191`; `src/render/PaintedView.ts:63`, `src/render/PaintedView.ts:131`; `src/power-motion.css:34`.
- **Problem:** Piece loading and Workshop load errors have text. The lazy Workshop has no visible pending state before it opens. Hint disables during its search without a named progress state. Reduced motion disables CSS motion and marker/idle effects; an initial Off choice can be replaced by a saved Normal setting. Actual capture-scene behaviour under that combination is not verified here.
- **Principle:** Doherty threshold as a response goal, not a measured time; Nielsen's visibility; WCAG 2.2.2 for ongoing nonessential motion. Interaction animation guidance at WCAG 2.3.3 is AAA, not AA.
- **Recommendation:** After a short delay, show “Opening Workshop…” or “Finding a move…” in the existing status area. Keep actions responsive and the board in place. Make the system's reduced-motion setting stop nonessential motion even when Normal is saved. Test that combination, and Animations Off, for every look. Keep existing Normal/Fast/Off and tap-to-skip paths.
- **Simplifies:** yes. It reuses one status channel. It adds no loading screen or new motion preference.

### F. Kings' powers, Workshop, and delight

#### F30 — The power action comes after its long explanation

- **Screens/severity:** powers idle/armed, all sizes; major.
- **Evidence:** `17-powers-game-phone.png`, `18-powers-armed-phone.png`, `17-powers-game-landscape.png`; `src/main.ts:43`, `src/main.ts:495`; `index.html:54`, `index.html:60`.
- **Problem:** The info card appends both kings' full power rules even with no selected piece. Hint/Undo/Resign then come before Use. Freeze is easy to miss in landscape. When armed, the full rules stay while another line states the next tap. “Your king” in the Black rule can read as the human player's king even when Black is the computer.
- **Principle:** proximity; common region; visibility; progressive disclosure.
- **Recommendation:** Put “Frost · Freeze · 1 use” and Use next to Your turn. Keep the opponent's power name in the opponent strip. The context area shows one current step: arm, choose target, make move, or end turn. Full rules open from the power name. Use “Black's king” or “The enemy king” in opponent text. Keep counters from the current rules; do not change use counts.
- **Simplifies:** yes. It removes two repeated paragraphs from every turn and keeps the action in view.

#### F31 — “Always on” and automatic power moves need different copy from Use

- **Screens/severity:** power setup and in-game passive powers; major for new players.
- **Evidence:** `11-new-game-powers-phone.png`, `17-powers-game-desktop.png`; `src/main.ts:501`, `src/main.ts:509`; `src/powers-ui.ts:113`, `src/powers-ui.ts:138`; `index.html:235`.
- **Problem:** Spirit/Shadow powers can be always on, with no Use button. March and Leap can appear in ordinary legal targets because they do not need arming. The Guide tells players to spend a power with Use, which does not cover these cases. A player can wait for a missing button or use a limited Leap without knowing a use is spent.
- **Principle:** recognition; Nielsen's consistency and visibility.
- **Recommendation:** Show “Holy Light · Always on” as a status, not a disabled action. For automatic limited moves, use a short selection line such as “Blue rune: Leap · uses 1 of 3.” Explain the automatic path in Learn. On completion, announce the power and remaining count. Explain the opponent's special threat when it first affects a refusal, not as a full paragraph each turn.
- **Simplifies:** yes. It removes the false expectation of one Use path for all powers.

#### F32 — The result has personality, but its final message is mostly loss analysis

- **Screens/severity:** result and key-moment review, all sizes; minor/polish.
- **Evidence:** `23-result-phone.png`, `23-result-landscape.png`; `src/main.ts:1012`, `src/main.ts:1044`, `src/main.ts:1083`; `src/moment.ts:87`.
- **Problem:** The fallen king is memorable. The text then gives last move, “That side gave up,” move count, army code, and a threshold statement about giving away pawns. Key moments select up to three costly errors or mate events. For a short resignation, the no-error line is a weak ending. The Result button New game starts a random army directly, while the same label during play opens setup. Rematch already restarts the same army with player sides swapped.
- **Principle:** peak-end; Nielsen's consistency; progressive disclosure.
- **Recommendation:** Lead with “You win,” “Black wins,” or “Draw,” as the player context requires. Put the reason on one short line. Keep the king fall. Move detailed errors and the army code to Review game. Use Rematch, New army, and Review game, with a visible Close control in the title row. Show “No key moments found” when the quick search finds none; do not promise error-free play. Explain “Same army · switch sides” under Rematch. Start review analysis when requested or in the background without delaying restart.
- **Simplifies:** yes. The ending shows outcome and next action before analysis. It keeps fast rematch.

#### F33 — Workshop is a first-run choice without a plain promise

- **Screens/severity:** title, game navigation, Workshop home; minor.
- **Evidence:** `01-title-first-phone.png`, `20-workshop-desktop.png`, `20-workshop-phone.png`; `src/workshop/dialog.ts:184`; `src/main.ts:650`.
- **Problem:** Workshop has equal navigation status beside learning and playing. Its home shows New piece, Surprise me, and an empty shelf. It does not state what the player can make or where they can use it. This is a separate creation task, with a worth estimate and a local test board, not a new player's main game.
- **Principle:** Hick; information scent; progressive disclosure.
- **Recommendation:** Move title entry to Learn; keep Workshop in Menu for returning makers. Add “Make a piece. Set its moves and rules, then try it.” Keep “Saved on this device” close to the shelf. Do not imply Workshop designs are synced by the game account or used in a normal match unless that path exists.
- **Simplifies:** yes. It removes one first-run branch and explains creation before entry.

#### F34 — A blank piece starts with 34 appearance choices

- **Screens/severity:** Workshop New piece, source-only; minor hypothesis for user testing.
- **Evidence:** `20-workshop-phone.png`; `src/workshop/dialog.ts:204`; `docs/WORKSHOP.md:13`, `docs/WORKSHOP.md:14`.
- **Problem:** New piece opens a 34-character grid, then a blank movement design. This can be a fun art choice, but also delays the first rule change. Surprise me already produces a playable design and supports Undo. The supplied home images do not show whether players struggle with the editor; I do not claim that its layout is broken.
- **Principle:** Hick; casual-creation onboarding; recognition.
- **Recommendation:** Keep the 34-character route. For a first Workshop visit, make the existing Surprise me action primary. Describe it as “Start with a piece you can change.” New piece remains for a blank design. Use the existing Try it footer and local-save feedback. Do not add a second editor, new tabs, or more motion reactions.
- **Simplifies:** yes. It uses an existing path to reduce the first decisions. This is a presentation change, not a request to replace the approved editor.

### Shorter copy for the weakest cases

The “Today” column uses `texts.json` or the cited code. The proposed short copy does not replace the full legal rule where detail matters.

| Element | Today | Proposed | Evidence |
|---|---|---|---|
| Computer mode | “You against the computer, with no powers.” | “Play against the computer.” | `02-after-title-play-phone`; `index.html:123` |
| Powers mode | “Against the computer. Each king brings one power.” | “Play the computer with king powers.” | `11-new-game-powers-phone`; `index.html:126` |
| Two players | “Share one device, or send the game link after each move.” | “On this device” / “By link: send each turn.” | `12-new-game-two-phone`; `index.html:129` |
| Generic move help | “Tap a marked square to move or capture.” | “Tap a marked square.” | `05-game-selected-phone`; `src/main.ts:422` |
| Guide lesson button | “Learn the six King Down pieces by playing, one move each” | “Learn the new pieces” | `15-guide-phone`; `index.html:229` |
| Rook rule | “Moves any distance orthogonally.” | “Moves any distance along a row or column.” | `15-guide-desktop` |
| Armed Freeze | “Tap an enemy piece to freeze it for one turn.” | “Choose an enemy piece to freeze.” Then: “Piece frozen. Make your move.” | `18-powers-armed-phone`; `src/main.ts:515` |
| Review help | “Tap the board to return to the game.” | Button: “Live game” | `08-game-review-phone` |
| Resign reason | “That side gave up.” | “White resigns.” | `23-result-phone`; `src/main.ts:1024` |
| No key moments | “No move gave away 2 pawns or more.” | “No key moments found.” | `23-result-phone`; `src/main.ts:1061` |
| Account promise | “Sign in to save your games on every device.” | “Sync your saved game across devices.” | `14-settings-phone-end`; `src/account/account.ts:41` |
| Workshop empty shelf | “Your pieces will appear here. They are saved on this device.” | “Your designs stay on this device.” | `20-workshop-phone`; `src/workshop/dialog.ts:193` |
| Ogre choice | “Capture on c5” / “Push to c6” | “Take pawn” / “Push pawn to c6”; “Ogre moves to c5.” | `22-capture-or-push-phone`; `src/main.ts:748` |

#### F36 — The Account promise suggests a game archive

- **Screens/severity:** signed-out/signed-in Account; minor.
- **Evidence:** `14-settings-phone-end.png`; `src/account/account.ts:41`, `src/account/account.ts:51`; `src/main.ts:1216`.
- **Problem:** The signed-out text says “games” on every device. Signed-in copy describes settings, lessons, and one saved game. No game-archive route appears in the supplied markup. Workshop saves are local and have their own store. A player can assume old matches and custom designs are backed up by sign-in.
- **Principle:** Nielsen's match with real world; trust; visibility.
- **Recommendation:** Say “Sync your saved game across devices.” State “Includes settings and lesson progress” below it. Keep Workshop's local-save notice explicit. Keep the existing provider loading/error messages, delete confirmation, and “games stay on this device” sign-out feedback. Do not add an account step to first play.
- **Simplifies:** yes. It removes an unsupported promise and keeps identity separate from game controls.

### Delight to retain, with boundaries

The shot, shove, swap, chain, and fallen king are the game's special moments. Sounds already follow action/contact timing (`src/main.ts:583`), and special-move captions appear once per kind (`src/moment.ts:71`). Keep these. Use the first Archer lesson to let the player see and hear one clear special action. Keep Sound, Fast, and Off easy to find in Preferences. Do not add music, badges, confetti, or more ambient motion as the first response to the UI problems.

The win moment can be warmer through clear outcome copy and the existing art. Review must be optional and useful. It should not turn every result into a list of faults. For a fast player, quick moves and an instant same-army rematch are part of the pleasure. For a new player, a correct special move and a clear next step are enough.

### Accessibility check status

| Area | Evidence now | Report status and required check |
|---|---|---|
| Text contrast, 1.4.3 | Token calculations above | Main text pairs pass; title gradients, art labels, and every state still need sampling |
| Non-text contrast, 1.4.11 | Outlined gems and shaped capture marks; unbacked Hint stroke | Repair Hint edge; test all tile states and Clay |
| Colour meaning, 1.4.1 | Different marker shapes; CHECK text | Strong base; verify selected modes/powers in grey scale; retain text state |
| Keyboard, 2.1.1 and 2.1.2 | Board cursor and native dialogs | Existing path; test all six lessons, powers, promotion, shove, and exit without a trap |
| Character shortcuts, 2.1.4 | Global R/Z | Scope to board focus or offer another allowed mechanism |
| Focus, 2.4.3/2.4.7/2.4.11 | Visible CSS rings, dialog title focus | Check list refresh and long-dialog focus with fixed footers |
| Target size, 2.5.8 | Width-gated 44 px rules; small history rows | Measure actual hit boxes at all five sizes; separate 24 px AA from larger touch goals |
| Reflow/text size, 1.4.4/1.4.10/1.4.12 | Fixed game; scrolling rail/dialogs | Not tested live; check enlarged text and spacing without lost actions |
| Name/role/value, 4.1.2 | Labels, pressed states, application board | Test with VoiceOver and NVDA; ensure review speech uses viewed state |
| Status messages, 4.1.3 | Move/cursor/help/load live regions | Add named thinking/hint/share states; check order and duplicate speech |
| Motion, 2.2.2; optional AAA 2.3.3 | Off/Fast, reduced CSS and marker motion, skip | Test saved Normal + system reduce, and all long-running decorative effects |
| Drag alternative, 2.5.7 | Tap/click and keyboard path | Preserve; no need for drag-only controls |

Use [WCAG 2.2's reference](https://www.w3.org/WAI/WCAG22/quickref/) for the listed criteria and [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) for announcement checks. This is a scoped review, not an AA certification.

## 9. Owner decisions

These are rules for the proposed design, not requests to approve unfinished work. The choices below show what changes on yes. Keep the first three as the main product decisions; the other rows settle the details of that direction. Routine defect fixes, such as truthful review readouts and a valid copy-success state, do not need a separate product choice.

### Main decisions

| ID | One-sentence rule | Options | My pick | What happens on yes | Earlier decision |
|---|---|---|---|---|---|
| D01 | A fresh player starts against Beginner; a returning player keeps the stored level. | **1:** Beginner only on a fresh setup. **2:** keep Club for everyone. **3:** ask skill before the first game, adding one question. | 1 | Change `defaultSetup` for fresh setup only; test old saves and stored setup. | **Reverses the adopted Round 3 Club default**, `docs/visual-design/README.md:64`; F02. The reason is the extra load of new rules. |
| D02 | The game shows four fixed actions, and rare match/app actions live in Menu. | **1:** Hint/Undo/Learn/Menu, 4 controls. **2:** keep 7. **3:** keep New game direct too, 5. | 1 | Merge selection/help; move New game, Workshop, Preferences, Account, Copy, Flip, Resign into a labelled menu. Keep state actions direct. | Revises the current four-button app menu, `index.html:39`; no explicit owner rule requires all four to stay visible. F08/F19/F20. |
| D03 | The board fits the available shape, with tools below it on a tall portrait tablet. | **1:** tablet frame about 760 px; compact landscape. **2:** keep 516 px tablet frame and 272 px rail. **3:** use a narrow 180 px tablet rail, leaving about 608 px for the canvas. | 1 | Build the four layouts in section 5 and test long states at the five sizes. Keep laptop board fit. | Keeps Painted default and full figures/headroom, `docs/painted-game/README.md:5`; F07. |

### Setup and learning

| ID | One-sentence rule | Options | My pick | What happens on yes | Earlier decision |
|---|---|---|---|---|---|
| D04 | Powers setup starts with two king summaries and opens one emblem picker at a time. | **1:** 12 controls first; 20 while editing. **2:** open the player's picker first, 20 controls. **3:** keep both expanded, 28 controls. | 1 | Keep all six emblems, both powers and No power, Spirit/Shadow defaults, and rule counts. Pin the footer. | Changes the **adopted Round 3 expanded layout**, `docs/visual-design/README.md:68`. It does not reverse the owner's explicit emblem or default-king choices. F17. |
| D05 | Learn stays primary on the first title, and Workshop moves to Learn/Menu. | **1:** Learn/Play, 2 first actions. **2:** keep Learn/Play/Workshop, 3. **3:** make Play primary and keep 2. | 1 | Retain the full twelve-piece lineup and six kings; add the one-line game description; repair short landscape. | Keeps the owner lineup and the adopted Learn-first rule, `docs/visual-design/README.md:11`, `docs/visual-design/README.md:121`. Removing title Workshop changes today's UI, not a stated owner instruction in these records. F01/F33. |
| D06 | A learner can start a full game after one special move, while all six lessons stay available. | **1:** Next piece/Play after each goal. **2:** keep Play only after lesson 6. **3:** show 6 lesson choices before the first task. | 1 | Keep the three-tap Archer success; hide unrelated lesson controls; add a Play exit after the first goal. | Keeps six one-move lessons; changes the current linear next-action flow, `docs/painted-game/README.md:14`. F03/F38. |
| D07 | Normal play keeps the current full random pool, with optional learning help. | **1:** full pool + contextual help. **2:** a separate Archer/Beast training preset. **3:** locks at 2/5/9 wins. | 1 | Change UI help, not army rules or access. Mark Paladin as custom-army content. | `docs/PROGRESSION.md:1` is a proposal with open decisions at line 48. This review does not adopt it or reverse an adopted unlock system. F04/F06. |
| D08 | Learn holds piece rules, lessons, and named practice positions in one place. | **1:** one Learn surface with named sections. **2:** keep Guide and lessons separate. **3:** add a separate Practice screen as well. | 1 | Show current/special pieces first; fold normal chess and notation; move named examples out of setup. | Keeps official piece icons and all six special pieces, `docs/visual-design/README.md:110`; changes reference order and navigation only. F04/F05. |

### Play, appearance, and creation

| ID | One-sentence rule | Options | My pick | What happens on yes | Earlier decision |
|---|---|---|---|---|---|
| D09 | Two players names the delivery method before play. | **1:** On this device/By link, 2 choices within the existing mode. **2:** keep both meanings in one description. **3:** make a fourth top-level game mode. | 1 | Add the two choices inside Two players; set turn locks and Share turn copy for link play. | Keeps the owner's **three top modes**, `docs/visual-design/README.md:59`; adds clarity inside one mode. F16. |
| D10 | Players control board rotation, with no required hand-off dialog. | **1:** manual Flip, plus optional per-turn rotation for local play. **2:** always rotate. **3:** require a confirmation after each move, 1 extra tap per turn. | 1 | Add Flip in Menu and a board-focused F key; use a clear pass-device turn line. | No inspected record requires automatic local rotation. F15. |
| D11 | Last move marks only the destination or hit square, with a strong edge and readable move text. | **1:** keep destination-only and strengthen it. **2:** mark origin and destination. | 1 | Preserve the owner's marker rule; improve the outline and latest-move sentence. | **Option 2 would reverse an explicit owner decision** in `src/main.ts:399`. It is not my recommendation. F13. |
| D12 | The result shows outcome and restart before detailed analysis. | **1:** one Review game route; details inside review. **2:** keep up to 3 inline error moments. **3:** show 1 inline moment plus review. | 1 | Keep the fallen king and same-army side-swapping rematch. Rename direct random restart New army. Keep all key moments in review. | Revises the adopted immediate key-moment presentation, `docs/painted-game/README.md:15`; keeps the feature and peak-end art. F32. |
| D13 | Body rules use 16 px Alegreya Sans; Cinzel carries the brand and major headings. | **1:** 16/14 px body/data scale. **2:** keep 15.5/12.5 px. **3:** use 18 px body everywhere. | 1 | Reduce text and frames first; move small control/piece-name headings to body type; check laptop density and enlarged text. | Revises the adopted small-heading type roles in `docs/visual-design/README.md:139`; the record does not state a direct owner requirement for Cinzel on every small piece label. Both chosen fonts stay. F22. |
| D14 | Workshop keeps its approved compact editor and offers the existing generated design as the easy first start. | **1:** make Surprise me primary on the first Workshop visit. **2:** keep New piece → 34 figures → blank editor primary. | 1 | Keep both entry routes, all 34 figures, the existing four stages, local save, Undo, and Try it. Add one purpose line. | Changes entry emphasis, not the approved editor. Keep the owner's 28/36 px short-landscape controls, `docs/WORKSHOP.md:35`, and approved motion set at line 71. F33/F34. |
| D15 | Account is optional and promises one saved match plus settings and lessons. | **1:** separate Account sheet from 7-control Preferences. **2:** keep Account at the bottom of the 14-control Settings sheet. **3:** add sign-in to first run. | 1 | Use precise sync copy; keep providers and delete safety; keep Workshop's local-save notice. | Keeps current account scope, `src/account/account.ts:51`, and Workshop local storage, `docs/WORKSHOP.md:24`. F19/F36. |

### Decision guardrails

Keep the official Ogre face icon, ivory/charcoal art, and Painted default. Keep Spirit/Shadow plain kings, three setup modes, six king emblems, official power counts, and separate move shapes. Keep the full twelve-piece title lineup visible at each size. These come from `docs/visual-design/README.md:11`, `docs/visual-design/README.md:18`, `docs/visual-design/README.md:30`, `docs/visual-design/README.md:59`, `docs/visual-design/README.md:98`, and `docs/painted-game/README.md:5`.

The only recommended reversal of a directly recorded default is Beginner in place of fresh Club setup. Other rows identify revisions to the adopted presentation so they are not hidden inside a new mockup. Do not change piece rules, army balance, power use counts, the progression proposal, or Workshop reactions as a side effect of UI work.

### Check before implementation sign-off

Use these tests for the proposed design. They are not results from this review.

1. Give a new player the title with no instruction. They can explain Play and Learn, and complete the Archer shot without leaving the lesson.
2. Give a fast player a saved match. They can continue, move, Undo, use a power, flip, review three moves, and rematch without opening unrelated sheets.
3. Show every long context state at 1440 × 900, 1280 × 720, 820 × 1180, 390 × 844, and 844 × 390. The full board stays in place; the active turn tools stay visible.
4. Review a captured piece before and after its capture. Board, captures, card, turn, cursor speech, and last move all match the viewed position.
5. Try New game, Resign, a conflicting game link, failed copy, cancelled promotion, and a failed Workshop load. Each gives a clear result and a safe return path.
6. Complete board play, powers, review, promotion, and the Ogre choice with keyboard only and with a screen reader. Check focus after every dialog and list update.
7. Check actual target bounds, enlarged text, safe areas, grey scale, all marker contrast states, Animations Off, and saved Normal with system reduced motion.

Fix the loss/feedback risks first. Then build the smaller game frame and context area as one complete layer. Validate it in play before changing setup or learning structure. This keeps a working game throughout the design pass.
