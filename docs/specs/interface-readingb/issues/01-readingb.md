# Reading B: the B reading area, the layout classes, touch rules and their tests

Status: ready-for-human

Spec: [Reading B](../spec.md). The build is in the working copy of the design project. AGENTS.md: this change is visible, so it waits for the owner's yes on a rendered sample before a merge.

## Scope and plan

### Decision 33: B on top of A

- `reader.ts` `readerView`: the normal reading area. Tall and wide forms: the turn state, the headline row (`h2.play-headline` and the name tools), the subject (art, a fixed primary part, a secondary part, the tools), and the summary control. Compact form: one pinned 44 px header (the turn state, a name headline and the tools), then the body. The words come from A's functions in `texts.ts`; `main.ts` `readerModel` places them for each state of the design's state table.
- `fitReader`: a long result sentence leaves the headline for the actor's name and opens the subject; the art goes when the words do not fit; the last lines of the fixed part go to the top of the secondary text, which can scroll (design section 4).
- a1: `main.ts` `effectsSummary`. One control, "Active effects · n" (n counts sources), or the one source's summary in the tall and wide forms. A tap puts A's group rows in place of the secondary text; each row opens its exact lines; a second tap returns the subject.
- b1: `addRivalCards`. The computer's four cards are one control in its strip with four small marks; a used card's mark has a slash. A tap shows "Computer’s cards" with one row for each card; a row opens that card's full rule and arms nothing.
- c2 and c1: `layout.ts` `ownRows`. One resource row on upright phones and on rails under 400 px; the power above the cards on a rail of 400 px or more. A narrow column (under 352 px) also takes two rows.
- d2: `reader-rules.ts` `finishKind`. End turn is quiet after a free action alone and brass after a move. Its enabled state does not change.
- e1: "?" and Cancel or Close are beside the name.
- f1 and J5: `readerModel` gives the subject art: the piece figure, the power's king, the card painting, and the painting of a played card beside its result sentence (the player's or the computer's). `fitReader` leaves it out where it cuts text; Undo removes it with its sentence.
- Small words from the design table: an enemy piece tap says "The computer has this." (`text.computerOwns`, unused since stage A); a used power shows "Used" (was "0 left"); a card shows "Used" or "Not now".

### Decision 34: the layout classes

- `layout.ts` `gameLayout(W, H, setup)`: W and H are the game box after the safe areas. Rail when W >= 1.2 H, else stack. The game state is not an input, so a state change never moves the board. The board side is a multiple of 8 and does not depend on the game type.
- Stack: tall form from H 760, compact below. The board is the largest that leaves the opponent strip, the reader's least height (283 or 134 px), the resource row and the finish row. The column has the board's width (352 px at least) and is centred. Pieces only gives the resource row to the reader and puts the board lower (y 408 at 390x844, y 236 at 360x640, as in the design).
- Rail: the board takes the height less the margins and leaves 320 px for the rail; the rail gives way to 280 px before the squares go under 44 px; the board stops at 960 px; the group is centred. Wide form when the rail is 400 px or more and H >= 700; compact when H < 600; else the tall form.
- `main.ts` `layout()` runs at entry and on each change of the game box (a `ResizeObserver`), and sets the data attributes and CSS variables that `reading-b.css` reads.
- Fit: the Menu's Resign and Back to home share one row and only the setting rows scroll; the Menu and the full rule take the opponent strip on a rail too; the compact result card has one row of actions.
- No text under 14 px: the turn state, the summary label, the New tag and the square names of a rule diagram are 14 px on the game screen.

### Decision 35: touch and pointer

- `reading-b.css`: hover styles only under `(hover: hover)` (the kit's hover underline is off on a touch screen); no selection, callout or tap highlight on the board and the controls; `touch-action: manipulation` on the controls; `overscroll-behavior: none` on the game box. Escape cancels an armed card or power and closes a panel (A's handler).
- The game box is inset by `var(--safe-top, …)` and the three others. This file reads the variables and does not define them.

### Decision 36, P3 and P4

- P3: the `ResizeObserver` watches the game box, which the safe-area variables inset, so a change of the safe areas alone runs the layout again.
- P4: a square has no minimum size, so the tap grid is always the painted board (the lead's rotation fault: a 44 px square minimum made the grid larger than the board when the squares were smaller).

### J1: one readable state title

- `motion.ts` `swapText`: no outgoing copy and no travel; the new label fades from 0.7 to 1 over 120 ms, linear; Fast halves it; Off and reduced motion show it at once. The turn state and the headline each keep one node for the whole game.

## Tests

- `layout.test.ts` (13 tests): the reference sizes of the design (390x844, 360x640, 1440x900, Pieces only), the class at each size, the forms, 44 px squares and the 960 px cap at each size and game type, the parts that fit, the tablet column, the soft case, the side phone, the safe areas, and the game type that does not change the board.
- `reading-b.test.ts` (11 tests): sentences, d2, a1 labels, the new words, J1 in `swapText`, the decision 35 rules in `reading-b.css`, P4, P3 and Escape.
- `runs/tools/launch-readingb/browser.mjs` (design project): `states` (27 states at each of the 17 sizes, safe areas at 0 and set, Chromium and WebKit), `rules` (A's facts and the options of decision 33 in B's places), `rotation` (P3 and 32 touch taps on the corner squares after rotations), `mutations` (deliberate faults).

## New strings

"Computer’s cards", "Used", "Not now" and "Computer’s turn" come from the design's state table (`readingBText`). "Active effects · n" is A's label with B's count.

## Where decision 34 cannot hold

The board squares are under 44 px in these cases; everything else holds. Screenshots: `parallel/reading/run/b/browser/shots/final/` in the design project.

- 360x640 with the safe areas 59/34: 32 px squares (the game box is 360x547).
- 375x667 with the safe areas 59/34: 36 px squares (375x574).
- 667x375 on the side with 59 left and right and 21 bottom: 30 px squares (549x354).
- 320x568, the soft case: 29 px squares with no safe area, 18 px with 59/34. Decision 34 permits it there.

## Verification

See the report `parallel/reading/run/report.md` in the design project, section "Stage readingb (build 2 of 2)", for the counts, the log paths and the screenshot paths.

## Known limits

- The compact secondary text scrolls inside its own box (design section 4: "Only secondary text can scroll"). Decision 34 permits internal scroll in the full rule and the Menu setting rows; the lead can read the secondary box as a third place or ask for a cut.
- On a side phone with the safe areas set, the Menu's setting rows have about 60 px and scroll.
- No real phone, no manual screen reader and no Firefox run.

## Repair (checks "play" and "code")

Two independent checks found 3 major faults and 22 minor faults. The repair fixes the 3 major faults and 15 minor faults, adds 6 of the missing states to the browser record, and lists the rules in other lanes' parts in the report's merge notes. Each fix has a test that fails without it.

- The computer's Sky Lift card opens its full rule: `learning-diagrams.ts` accepts the swap example in either square order, so the example is legal for side 1 (`reading-repair.test.ts` opens each power and card rule for both sides).
- The result card keeps stage A's look at each size. Only a rail result area under 200 px (667x375 with the side safe areas) puts the three actions in one row (`data-tight`).
- Stage A's rules have browser checks that fail without them: give check, "Possible result:" for hover and keyboard focus only, the red edge ends, the owner line of the full rule, and the first-time step line.
- Small fixes: the choice prompt takes both lines of the compact header; the compact turn state says "Not final" beside a card; "Possible result:" never shows for a touch tap, goes when the pointer leaves the board, and names no result where a later choice follows; one effect source opens its lines at the first tap; the sealed End turn sinks 4 px (`seal` gets a `travel` argument); the Menu's Resign and Back to home stay on one line; Escape on the Menu closes only the Menu; a resign ends an armed card; a piece with no legal action says so; a second tap clears the piece name; the narrow strip fits the computer's power; the J1 fade plays; the computer's card group is inert after the end and has `aria-expanded`; a closed summary names no missing block; dead CSS and the safe-area probe go.
- The browser record plays the computer's turn with Motion speed Normal too, and adds the states: a blocked piece, the Guard wrong tap, a card after a staged step, a used card, the Salvation choice, and a move that gives check.
- Not fixed (for the lead): squares under 44 px and "Show again" in the scrolled result reply at three safe-area sizes that no phone has; the two apostrophe forms (base text with base tests); raw colours; the browser checks outside the repository; four rows of the state table with no fixture.
