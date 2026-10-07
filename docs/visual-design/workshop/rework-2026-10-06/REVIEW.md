# Workshop: use first, then design

Status: three static options for the owner. No option is approved. No app implementation or motion changed.

Open [the comparison](index.html). The page links to Home, Try it, the phone move editor, a warning, and the sharing menu. App controls in these pages do not work. The links outside the mockups change the static view.

## Work and checks

- Worktree: `.claude/worktrees/agent-af146c2f91d80dc0b`, branch `claude/workshop`.
- Merged local `main` (`4e9ac48`) in `84f9e42`. The task-list conflict kept both sections. The matrix conflict kept sections C and D and placed the two Workshop rows in D.1 and D.2.
- After the merge: type check and production build pass. Vitest: 665 tests pass in 36 files. This is a merge check, not approval of the screen design.
- Used the current dev build at `http://127.0.0.1:5177/` in the in-app browser. No account sign-in. Phone viewport: 390 × 700. Desktop: 1440 × 900. Also viewed the current editor at 568 × 320.
- Phone path: title → Workshop → New piece → Knight → add diagonal move squares → Rules → add protection from pawns → Look → Frost glow → Done → scroll → Try it → take a pawn → Back → Edit.
- Desktop path: Workshop → New piece → Bishop → Rules → lines pass over own pieces → change condition to enemy half → Done → Try it → move to c5 → Back → Edit.
- These were agent walkthroughs at phone and desktop screen sizes. They were not tests with recruited new players, or tests on a physical phone.
- Static layout checks: A, B and C at 320 × 568, 390 × 700 and 1280 × 900. No horizontal page overflow. All displayed main move boards end above the fixed action bar. C opens its phone move board in a separate sheet; that view was checked at 390 × 700. No missing images at the main phone and desktop sizes. Small screens may scroll outside the board.
- The sample is Knight + Beast. The current judge returns 4.48175 pawns. With four one-square diagonal moves added, it returns 7.078625, with a range of 6.3133–7.8440 and `likelyOP`. The mockups round these values. No new balance run was made.

## What the player needs

A new player knows some chess pieces. They want to make one change, understand it, and see it work. A returning player wants to combine rules and test an idea fast. Neither player should need to study the value formula before they can use the board.

The main loop is **change → try → change**. Save is a state of this loop. It should not be a separate stage that the player must pass through to reach Try it.

## What the current screens do

| Screen | Player's job | What gets in the way |
|---|---|---|
| Home | Start a piece or open a saved design. | The unavailable card tile has the same size as the main action. Most of the empty phone screen adds no help. |
| Start | Choose a known base. | Mix two introduces an extra rule before the player sees a board. Its first/second roles are not equal. The painted preset grid is useful and should stay. |
| Moves | Change where the piece can go or take. | On phone, the large display comes before the tools. The small mode line must explain a large effect: one tap can edit several squares. The name also changes. On desktop, the board shares attention with a larger figure and a full value report. |
| Rules | Add one ability and set when it works. | The long list is in a sheet. A choice accepts defaults, then the player must open sentence controls to set the condition. The list hides the piece while the player decides. |
| Look | Choose the figure, glow, and letter. | The explanatory text is useful, but the small images are crowded. The large preview earns its space here more than it does during move editing. |
| Value / Why | See the likely strength and the main risk. | Desktop shows the full report before the player requests it. The report has much more detail than the next edit needs. Keep uncertainty, warnings, and optional fixes, but reveal the detail on request. |
| Saved | Confirm storage, share, or try. | At 390 × 700, the summary pushes Try it below the visible screen. Done sounds like a save action, although edits have already saved. |
| Try it | Test an action, then adjust the design. | Return to the summary, then Edit, to change the piece. Undo is disabled after that return. On desktop, much of the screen is empty around the small test board. Keep the exact action labels and the note that enemies do not move. |

These are design findings from the current build, after the previous review fixes. They do not repeat the old defects as if they were still open.

## Three choices

### A. Board first — recommended

One workspace holds the board and the piece controls. On desktop, a quiet side panel shows the piece, one value summary, its rule, and its look. On phone, the board uses most of the screen. Moves, Rules, and Look stay close to it. Try it is one action away and returns directly to editing.

Best for quick experiments. The cost is less space for the figure during move editing. Look gives the figure its full view.

### B. Step by step

A visible path asks one question at a time: Start, Moves, Rules, Look and name. The current step has one large question and a clear Next button. Try it stays available. Completed steps must be direct links in the eventual app; the static page shows their position.

Best for a first visit. The cost is more movement between screens for a skilled player. This option should keep the last step when the player returns from Try it.

### C. Piece card

The complete design is the main object. Its moves, rule, look and name have clear edit points. Desktop puts the current editor beside the card. Phone opens that part in a sheet over the card. The separate phone move view shows the proposed sheet.

Best for reading and sharing a design. The cost is an extra open/close step for repeated move edits. “Card” here means the display of a custom piece. It does not add playable cards or an image-export feature. Sharing still sends a link or plain text.

## Common design rules

- One main action per task. In A and C it is Try it. In B it is the next step; Try it is secondary.
- Home keeps Workshop as its page title. New piece leads. Mix two and Surprise me remain available. No large disabled New card tile.
- Keep the piece limit, reach, ten rule blocks, conditions and hard limits. No game-rule changes are proposed.
- Keep automatic local saving. Show success only after success. A storage failure needs a persistent message, Retry and Copy link. Preserve a draft if the shelf is full. The mockups show only the successful-save state.
- Share opens Send link, Copy link, Copy as text, Make a copy and Delete. Delete still requires the existing confirmation. Incoming designs remain read-only until copied.
- The value is an estimate. Keep the existing threshold above 5 pawns, ordinary-piece exceptions, uncertainty and risk/memory warnings. Do not require a player to weaken a design. The warning sample offers a removal and a way to keep editing.
- Keep a name stable after the player sets it. Undo must stay available across edit/try changes in the future app.
- Keep the active action and its scope visible. The mockups retain All sides but give it a full control beside the action. A tap and a drag need the same clear scope.
- Rules: show the effect and condition together. Reveal choices for the selected rule. Keep 1 of 3 visible. Give unavailable rules a reason. Look: clearly separate appearance from abilities.
- Try it keeps the same design context. Keep Reset, Shuffle, condition settings, action choice, and Finish for a capture chain. Explain where protection cannot be tested. Static Try it shows the normal knight-chain example only.
- A tap outside a sheet closes it. The later app must preserve keyboard focus, arrow-key board use, names for controls, and exact square descriptions.
- Retain approved Set A reactions after the owner chooses a layout: at most 600 ms, no motion with reduced motion or Animations Off. These pages contain no motion.

## Graphic design

Use the existing painted figures. Keep Cinzel for titles and Alegreya Sans for controls and text. Use a small type scale: 12 for short labels, 16–18 for text, 22–24 for section titles, 30–34 for large desktop titles. Use 4, 8, 12, 16, 24 and 32 px spacing steps.

Parchment is the work surface. Dark ink is the main text. Burgundy marks the main action and selected controls. Gold belongs to the art and value, not all buttons. Green means a confirmed save or an estimated value in the target range. A warning must use words and a symbol, not colour alone.

Use one alignment line for each area. Separate sections with space and thin rules. Avoid framing every sentence as a button. Keep the figure large where a player chooses its look. Make the board largest where a player edits moves.

The text palette uses the existing high-contrast colours. Check body text against the WCAG [contrast requirement](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Use 44 px controls where possible; at short phone sizes, board cells can reduce to 32 px. The WCAG [target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets a 24 px minimum with exceptions, and recommends larger targets. A static picture does not establish accessibility compliance.

## Before implementation

Choose A, B, C, or specific parts of them. Then create an implementation branch from `claude/workshop`. Keep the pure modules. Build the chosen screen flow around the existing model, judge, storage and test board. Do not build a second game engine or a new state framework.

A read-only design check found missing phone Why/Undo controls, a missing phone card editor, incomplete chain wording, and unclear management actions. These were added or corrected in the static study. This was a focused check, not the full independent app review from the handoff.

After implementation, run the checks named in the handoff and update `docs/WORKSHOP.md`. Ask the owner whether to run the independent app review again. Do not merge into main or deploy without the owner's request.
