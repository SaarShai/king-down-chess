# King Down Workshop

The Workshop lets a player make a piece: its moves, its takes, up to three properties, a name and a figure. The judge estimates the worth of the piece in pawns. This doc tells only what the code does today. Revision 3 of this doc holds the old plans and the history of each decision: [WORKSHOP-revision-3-2026-10-07.md](visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md). The review of 2026-10-06 and its fix table are in [REVIEW-2026-10-06.md](visual-design/workshop/REVIEW-2026-10-06.md).

The code is in `src/workshop/`. The game loads it as a separate chunk on the first tap (`openWorkshop` in `src/main.ts`). A design does not play in a game: Try it is the only board for it.

## Screens

The Workshop is one full-screen dialog (`dialog.ts`). It opens over the screen that opened it, and that screen stays open below it.

- **Open.** The Workshop button in the game bar and on the title screen opens Home. A link with `?design=<code>` opens its read-only card (see Share). The game then removes `design` from the address, so a reload shows the game.
- **Home.** "New piece", "Surprise me" and the shelf, "Your designs (n), on this device". Each tile shows the figure, the name and the same worth word as the full card. When stored entries cannot be read, a note gives their count. They stay in storage. Back closes the Workshop.
- **New piece.** A grid of the 34 figures. A tap starts a blank piece with that figure and the name of the figure.
- **Surprise me.** It takes one of the 11 pool pieces, makes one to three random changes, and keeps a result that is fair, has no warning and has a low memory score. After 20 tries without such a result, it gives the Knight. The piece gets a random name. One Undo step puts back the moves, takes and properties of the pool piece.
- **Your piece.** The editor is one screen, with no tabs:
  - The header: Back (to Home), the save state (New piece, Saved on this device, Not saved) and Share.
  - The card: the figure, the thermometer, the name, the worth line ("Estimated worth · 3 pawns") and the band word, for example "Fair". The pen changes the name in place: letters, digits, spaces, - and ', up to 18. The eye opens Appearance on the page: three suggested figures, a gallery of all 34 with a type filter, and the army, Ivory or Charcoal.
  - The Moves board and the Takes board: two 7 × 7 grids with the piece in the centre and forward up. A tap sets a square on or off. A mouse can paint a stroke. "Apply to" sets the squares that one tap changes: All sides (the 8 turns and mirror images), Left and right, or One square. "Take by" sets how the Takes board takes: Moving there or Shooting. The marks use the game's move legend: a green tile moves; a white tile with a red target takes only; a green tile with the target moves or takes; the target with an arrow is a shot.
  - Sliding directions, in a disclosure: 8 buttons.
  - Properties: 0 to 3 cards. Each card is a sentence with pill buttons. A pill opens its choices on the page. × removes the property. The + tile opens "Add a property": the 10 rules in 6 groups (Moving, Taking, Safe, Moving others, Changing, Holding back). Each rule shows the change in worth that it gives, or the reason that it cannot be added.
  - The footer: Undo, "Why this estimate?" and Try it.
- **Why this estimate?** A sheet with the verdict, up to three "Without …" lines, up to two fixes ("Try: …"; a tap applies one), the like line, the properties that change little, the flags, a disclaimer and, for a measured design, its measurement. "Keep it" closes the sheet. "Undo last change" undoes.
- **From a link.** The card shows the figure, name, move and take grids, rule text, worth word and pawn worth. It has no edit controls. Keep a copy saves the design and opens the editor. Try it opens the test board and saves nothing. Back from the test board returns to the card.
- **Share.** A sheet shows the read-only card and says what the friend sees. Send link is the main action: it opens the share sheet of the device, else copies the link. Copy link, Copy as text (the sentences, a MATRIX-style row and the link), Make a copy and Delete stay. Delete asks first. When the device does not let the game copy, a sheet shows the text, selected, to copy by hand.
- **Saving.** Each change saves the design on this device: localStorage `kingdown.workshop`, up to 50 designs, newest first. Each shelf tile is a mini card: figure, name and worth word. When the shelf is full, an alert asks the player to delete one design ("Choose one to delete"). The open design stays as it is. When the device refuses, the alert gives "Try again". Both alerts give "Copy link". The alert stays until a save works.
- **Try it.** An 8 × 8 board. The piece stands on d4 (on d2 when a property works from its start rank), with white pawns on c3 and e3, among six black pieces that never move. The moves come from `moves.ts`, not from the engine. It is not a game. The marks use the same legend: a green tile for a move, and a red edge with the small target tile at the top-left for a take or a shot. A square with two actions asks which one. For a Safe property, a line under the board gives the rule and says if it holds now. The buttons: Reset, Shuffle (new squares for the black pieces), "+5 moves" for a property that counts moves, and "Pretend your opponent played a card" for a property that waits for a card. Back goes to the editor.

## Layouts

The layouts are in `workshop.css`, and the cell size is in `fit()` in `dialog.ts`. The header and the footer stay in view. The workspace between them scrolls.

- **Wider than 1000 px:** the card in a column of 240 to 320 px, beside the properties (up to 700 px). The two boards stand side by side.
- **1000 px or narrower:** one column. The card is above the properties, with a 160 px figure.
- **600 px or narrower:** the two boards stack, each up to 340 px wide. The property cards stack too.
- **Narrower than 360 px:** Back shows only its arrow. Screen readers still get its word.
- **Short landscape** (landscape and at most 500 px high, for example a 568 × 320 phone), from the owner's mockup of 2026-10-07: a 44 px header; the card in a 120 px column with an 84 px figure and no thermometer (the worth line gives the number); the two boards side by side, with 14 px titles and no mode or forward lines; the Apply-to select and the rest below them, in the scroll. Both boards and Try it are in view with no scroll. The header buttons are 36 px. The pen, the eye and the Take-by select are 28 px.
- **The board cell:** `fit()` makes the cell as wide as the board column lets it, up to 44 px and not less than 24 px. In short landscape, it also makes the cell small enough for the whole board to fit the height of the workspace. It runs on each render, on a resize (but not while the name field has the focus) and on a turn of the phone.
- **Sheets** (Why?, Share, Copy this, the delete questions) are modal sheets from the bottom, up to 560 px wide and 85% of the height. Wider than 720 px, they are in the centre.
- **Try it:** the board squares are 32 to 56 px, as large as the screen lets them be.

## Model

`model.ts` holds the stored form of a piece, `PieceDesign`. It is pure, so the judge and the tests run it in Node.

- **Squares:** x to the right and y forward, each from −3 to 3, never the centre. Each square has a mark: move, take, move and take, shoot, or move or shoot. Black uses the mirror image.
- **Lines:** up to 8 slide directions. A slide continues until a piece stops it, and it can take that piece.
- **Rules** (the properties on the card): at most 3. Each rule is a When and an ability. The 10 abilities are in `vocab.ts`, each with its sentence, its pills, the Whens that it allows and its MATRIX row. The Whens are MATRIX D.1: always, in a zone, next to a piece, from or before a move number, after the first capture, after a card, on a take, on the first take, and on the last rank.
- **Moves and takes are separate channels.** A change to the move of a square keeps its take, and a change to the take keeps its move. A square takes by moving or by shooting, not both. Slides are the same for moves and takes; the editor says so beside the slide buttons.
- **Look:** the figure id and the army (0 ivory, 1 charcoal). The look also keeps the older fields of old saves, so that old saves and links still load. The look never changes the rules or the worth.
- **Name and letter:** the name follows the design until the player names it. The letter is the first free letter of the name.
- **Canonical form and key:** what the piece does, never its name or look (`canonical`, `keyOf`). The judge finds a measured design by its key.
- **Share code:** base64url of the canonical form, the name, the look and the letter, at most 4,000 characters. `parseDesign` checks a code key by key and refuses a bad one.
- **Hard limits** (`limit`): at most 3 rules, each ability one time, a When that fits its ability, and "only a king can take it" only on a piece that takes nothing. A piece with no move and no take is empty: Try it asks for a move or a take first.
- **Presets:** the 11 pool pieces (Pawn, Knight, Bishop, Rook, Queen, Archer, Paladin, Guard, Maester, Beast, Ogre) in Workshop words. A unit test proves that each one equals the piece of the engine. The Workshop Maester does not have the long swap with the king.

## Judge

`judge.ts` is a port of the prototype `judge-v2.mjs`. It is pure: the same design always gets the same verdict.

- **Worth:** a formula over the features of the piece on the 64 squares of an empty board (quiet squares, far takes, shots, steps and open lines), plus a term for each rule. The When of a state rule scales its term by how often the When holds. The number on the card is always the formula.
- **Error:** each term adds an error. The band is the worth plus or minus the root sum of squares of the errors.
- **Labels** (the lines are in `THRESHOLDS`): Fair from 2.5 to 5.0 pawns. "Possibly overpowered" above 5.0. "Likely overpowered" when the low end of the band is above 5.0. "Possibly overpowered" also when the high end is above 5.5 and the error is 1 pawn or more. "Possibly too weak" below 2.5. "Likely too weak" when the high end is below 2.5. An unchanged Pawn says "The unit of worth", and an unchanged Queen says "The queen’s worth".
- **Measured designs:** `anchors.ts` holds 17 designs that computer games measured. A design with the same key gets a note ("Measured in computer games: 4.27 ± 0.29.") and its label from the measurement. The number stays the formula. Each design names the source of its value, for example the runs pv2-d3 (Bishop, Rook, Ogre, Beast, Guard), pv2-A-vsR-d3 (Archer) and pv-A-af2 (Archer far2, 2.83 ± 0.28, one pass against the Rook). The Knight and the Queen use the prices of the engine (`src/ai/eval.ts`).
- **Flags:** more draws, very frequent takes, shots over pieces, a long wait, a rule that is hard to judge or never measured, a piece that nothing can block, more squares than any measured piece, and an early queen.
- **Memory:** a score for how hard the piece is to remember, from level 0 to 3. Level 3 gives a warning.
- **Why?:** up to three "Without …" lines (the worth without one part, the largest change first), the hinges of the formula, up to two fixes (one removal each, which puts the worth in the fair band), and the properties that change the worth by less than 0.3 pawn.
- **Badges:** each rule in "Add a property" shows the change in worth that it gives, in halves of a pawn. "?" marks a rule that computer games never measured.
- **No wrong direction:** a test on random designs proves that no added square, line or ability lowers the worth, and no flaw raises it.

## Motion

`motion.ts` plays the approved Set A reactions on the card. `update()` in `dialog.ts` calls `react()` at the end of each render, except a first render. Each change, Undo and rename goes through it, so each one plays one reaction. The look and verdict of the last render are the start of the reaction.

- **A1:** the figure plays its approved gait in place (480 ms). The gait curves are in `docs/2d-first-pieces/board/gait.mjs`. When the figure or the army changes, the new picture fades in (300 ms) over a copy of the old picture, which fades out (250 ms).
- **A4:** when the verdict becomes overpowered (possibly, likely or untested), the figure shakes three times (560 ms), in place of the gait.
- **A5:** when a "moves like" or "becomes" piece is new or changes, a gold ring grows and fades on the figure (560 ms).
- **The limit:** each reaction ends by 560 ms (280 ms at the Fast pace), in the limit of 600 ms (300 ms at Fast). Each animation ends at the still transform. A temporary element goes when its animation ends.
- **Stops:** the next change, a screen change and a close stop the reaction. With reduced motion (`prefers-reduced-motion: reduce`) or Animations Off (`data-pace="off"`), no reaction starts, and a reaction that runs stops when the setting changes. Animations Off also stops the CSS transitions and animations of the Workshop.
- **No other motion:** a new reaction, for example A3 on the thermometer, needs the owner's yes first.

## Art

- **The cast:** 34 approved figures in `figures.ts`, each with an id, a name and tags (Fast, Strong, Ranged, Magic, Support). `docs/visual-design/workshop/cast.json` is the same list, and a unit test keeps the two equal. The tags give the three suggestions in Appearance. They never change the rules or the worth.
- **The shipped art:** two webp per figure in `public/ui/workshop/`, `{id}-w.webp` (ivory) and `{id}-b.webp` (charcoal): 68 files. A unit test checks that the folder holds only these.
- **The sources:** in the main checkout, `art-src/workshop/{id}.png` (one paired sheet: ivory on the left, charcoal on the right) and `art-src/workshop/{id}.prompt.txt` (the recorded prompts). Git ignores `art-src/` except `art-src/MANIFEST.md`. The workshop section of the manifest lists each source by id, and a unit test checks that each figure has a row.
- **The art script:** `node tools/prepare-workshop-art.mjs` makes the 68 webp again in the current checkout, from any checkout. It finds the sources by id through the common folder of git. It cuts each sheet into its two halves, trims each half, fits it in 384 × 448 px and writes webp at quality 88. When a PNG or a prompt is missing, it names each missing file, writes nothing and stops with exit 1.
- **Art direction:** the "Production method" in `docs/visual-design/workshop/figure-samples-2026-10-06/README.md` and the 2D artwork direction in `docs/lessons/art-and-motion.md`.
- **On screen:** the card shows only the figure. In Try it the figure is always ivory, because the piece plays White there.

## Accessibility

- **Targets:** buttons and selects are 44 px or more (`--tap`). The exceptions: the board cells (24 px or more) and, in short landscape, the header buttons (36 px) and the pen, the eye and the Take-by select (28 px), as in the mockup.
- **The thermometer** is `role="meter"`, with the label "Estimated worth in pawns" and a value text with the words of the summary, for example "about 1 pawn, the unit of worth". Its parts are aria-hidden. It is never an input.
- **The card** has a hidden summary: the figure and the army, the piece in words, and the worth with its band. A live region gives the new worth and band when the band changes.
- **The figure art** is decoration (aria-hidden, empty alt). Each figure choice is a button with the name of the figure.
- **The boards:** each board is one Tab stop. The arrow keys move along its cells, and Enter or Space changes a cell. Each cell is a button with a label such as "2 up, 1 right: on" and `aria-pressed`.
- **Choices:** in a choices panel, a tap commits at once. The arrow keys only move the choice, and Enter or Apply commits it. In "Add a property", ArrowUp and ArrowDown move along the rules that the player can add. Esc closes only the panel and puts the focus on the button that opened it.
- **Undo keys:** Ctrl+Z (Cmd+Z on a Mac) undoes in the editor only: not under a sheet, not in a choices panel, not in the name field and not on a design from a link. The game gets no key from the Workshop while the Workshop is open.
- **Sheets** are modal dialogs, and their title gets the focus. Close, Esc or a tap on the backdrop closes a sheet. A press that starts in the sheet and ends on the backdrop keeps it open.
- **Toasts** are a polite status region. A screen change clears them.
- **Try it:** the board is one Tab stop. The arrow keys move, the focus follows the piece, and a status line says each move.
- **Reduced motion and Animations Off:** see Motion.

## Checks

- **`npm test`** runs the type check, then vitest, then the node tests. The unit tests of the Workshop: `model.test.ts`, `moves.test.ts`, `judge.test.ts`, `ui.test.ts` (the text, the MATRIX rows, the art, the read-only card and the store), `figures.test.ts` (the cast, the 68 webp and the art manifest), `css.test.ts` (each class of the stylesheet is in the Workshop source) and the two doc lints.
- **`npm run test:docs`** runs the doc lints. `workshop.docs.test.ts` checks this doc (the eight sections, a deny list of removed features, no tracker citation, the screenshot folder), the dated revision 3 file, the section citations in the Workshop source files, and the anchor table. `review.docs.test.ts` checks the "Checked by" column of the fix table in the review.
- **The browser checks:** `npm run check:browser workshop` and `npm run check:browser workshop-cast`. The runner builds the app, serves it on 127.0.0.1 at a free port and runs the named checks, one at a time in this run; two runs in two worktrees share the machine's two slots. `workshop` runs at 320 × 568, 390 × 844, 568 × 320, 768 × 1024 and 1280 × 900. It checks the card, the boards, the properties, the name, Appearance, the thermometer, Undo, the keys, a refused save, Share, Try it, a reload, the game menu, the review fixes (one group for each fix), Esc in a panel, Surprise me, the reactions (the group `motionSetA`, from the end times of the animations) and the short landscape layout. The read-only card, Share and shelf also run at 320 × 568, 390 × 844 and 1440 × 900. `workshop-cast` checks each figure in New piece and in the gallery, both armies, the filter, Undo, save and reload, Share and Try it.
- **Screenshots:** the checks write their screenshots and logs to the output folder of the run. The runner makes one folder for each run under `kingdown-check-runs` in the temporary folder of the system, prints it at the start, and keeps one folder for each check in it (`<run folder>/workshop/`, `<run folder>/workshop-cast/`). The folder is outside each checkout, so git never tracks it. The system removes old run folders after three days; the runner never empties another run's folder.
- **The review fixes:** the fix table of the review names the check of each fix, or "superseded", or "not checked: <reason>".
