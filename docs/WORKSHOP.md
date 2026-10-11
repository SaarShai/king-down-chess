# King Down Workshop

The Workshop lets a player make a piece: its moves, its takes, up to three rules, a name and a figure. The player paints on a real board and tests the piece on the same board. The judge estimates the worth of the piece in pawns. This doc tells only what the code does today. Revision 3 of this doc holds the old plans and the history of each decision: [WORKSHOP-revision-3-2026-10-07.md](visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md). The review of 2026-10-06 and its fix table are in [REVIEW-2026-10-06.md](visual-design/workshop/REVIEW-2026-10-06.md).

The Workshop is the Proving Ground, view A of [the spec](specs/workshop-proving-ground/spec.md). Its decisions table and the "Comments" of its tickets give the reason for each choice. The code is in `src/workshop/`: `ground.ts` (the dialog), `ground.css` (the layouts), `marks.ts` (the SVG marks), `scene.ts` (a design on a board as a scene), `why.ts` (the why-trace), `face.ts` (the card face), and `model.ts`, `vocab.ts`, `judge.ts`, `anchors.ts`, `moves.ts`, `text.ts`, `names.ts`, `store.ts` and `figures.ts`. The game loads it as a separate chunk on the first tap (`openWorkshop` in `src/main.ts`). A design does not play in a game.

## Screens

The Workshop is one full-screen modal dialog (`#workshop`). It opens over the screen that opened it, and that screen stays open below it. ‹ Menu and Esc close it.

- **Doors.** The Workshop button on the title screen (`#title-workshop`) and the Workshop row of the game menu (`#workshop-btn`). The first open shows the Pawn; a later open shows the last open piece. A link with `?design=<code>` opens the card face of the design first, in a sheet "A shared piece", with Keep a copy and Open on the board. Keep a copy saves the design and opens it. Open on the board, × and Esc show it on the board, read only until the first edit. A bad code gives the toast "This design link could not be read." and opens the Pawn. The game removes `design` from the address, so a reload shows the game.
- **The board.** An 8 × 8 board with the open piece and its marks. A pool piece stands on its example board (`examplesOf` in `scene.ts`): on d4, but the Rook on d1, with the friends and enemies of the approved mockup. A new piece and a design from a link stand alone on d4. The marks use the game's move legend (`src/render/legend.ts`): a green tile moves; a white tile with a red target takes only; a green tile with the target moves or takes; the target with an arrow is a shot. `marks.ts` adds the refused marks, the stamps, the knots and the zone chalk. A copy shows how its paint differs from its pool piece.
- **The plinth.** The name, the Yours tag, "from <Piece>" for a copy, Weigh (once the piece is the player's), the pen (wide layout), and the figure on its stone. Under them, the rule lines: a seal, a When chip and a short line with its pill. A tap on a pill or a chip opens its row of choices; the board previews a choice under the pointer or the focus, and a choice that does not fit gives its reason. × removes a rule. The plinth holds at most 3 rules ("3 of 3 rules. Remove one to add another."). A tap on a seal keeps that rule alone on the board; hover or focus on a line shows it alone while it stays there. Gold and cracked knots between two lines tell how two rules meet.
- **The Rules shelf.** Add a rule or the S key opens it over the right column. It holds the 10 rules as seals in 6 groups (Moving, Taking, Safe, Moving others, Changing, Holding back). A tap on a seal previews it on the board and shows its sentence card. Stamp adds the rule; when the rule cannot go on, Stamp is off and the card gives the reason.
- **The brushes.** Move, Take and Both (keys 1, 2 and 3; B goes in and out) start brush mode: the piece stands alone on d4, and a tap paints a square. The reach ends 3 squares out. The tools are Shot, Eraser, Mirror and Done. Mirror sets "Paint on": Mirror (left and right), All 8 or One. Eight nubs round d4 switch the lines, with their Mirror partners. A mark that a rule makes does not take paint ("A rule makes this mark. Tap its seal."). Outside brush mode, the three brush tiles are also the key.
- **The Why tag.** In look mode, a tap or Enter on a square (not the piece's own square, which lifts the piece) opens its tag: the square, its piece, the sum of the parts that make its mark, and a note. The tag also holds the Try with actions of that square.
- **Try with.** The tray holds the Friend and Enemy tokens (a white or a black pawn; a tap on a piece takes it away), the eye (the threats on the piece), the die (six enemies on new squares) and the broom (the piece alone). "+5 moves" and "Pretend your opponent played a card" show only when a rule reads them. A tap or a drag lifts the open piece, and a tap places it. In the tag, Move here, Take from here, Push or Swap plays the move with the engine (`makeMove`), White each time; the other side never moves. Take back undoes the move, and Finish ends a chain. A plaque says "An example board. No check test. The other side does not move."
- **The ledge.** The 11 pool pieces, then "Yours" with the designs on this device, then NEW. Hover or focus on a figure shows its reach in a 96 px diagram (wide layout only). NEW makes a blank piece with an automatic name, alone on d4 in brush mode.
- **Copies.** A pool piece is read only. The first edit makes a private copy, "My <Piece>", and opens it in Yours. When that name is taken, the copy is "My Pawn 2", and so on.
- **The ⋯ menu.** Copy as text and Make a copy (the next free number) for a piece that moves, and Delete for a design on the shelf (asks first, then opens the pool piece of the design, else the Pawn). On the phone it also holds Share, Weigh, Rename and Look.
- **The pen.** The name becomes a field: letters, digits, spaces, - and ', up to 18. Enter or a blur keeps it; Esc keeps the old name. A pool or card name gets " (yours)".
- **Look.** On the wide layout, a piece made with NEW, or from a link, has a look row: three suggested figures and More. Other pieces have Look in ⋯. More opens the Look sheet: the army (Ivory or Charcoal), a tag filter and the 34 figures.
- **Weigh.** A popover: "About 3 pawns (estimate). Fair." and the like line. On the phone, a toast with the same words.
- **Share.** Once the piece is the player's, the Share sheet shows the card face (`face.ts`): the name, the figure, the reach diagram, the seals with their sentences, the worth and the band word, with no control. Send link opens the share sheet of the device; Copy link and Copy as text (the sentences, a MATRIX row and the link) copy. When the device refuses to copy, a sheet shows the text, selected, to copy by hand.
- **Saving.** Each change saves the design on this device: localStorage `kingdown.workshop`, at most 50 designs, newest first. On a full shelf the alert says "Not saved: your shelf is full (50 designs)." with "Choose one to delete". When the device refuses, it says "Not saved: this device did not keep the design." with "Try again". Both give "Copy link". Undo (the top bar, or Ctrl+Z, Cmd+Z on a Mac) keeps 50 steps for the open piece. Undo past the first edit removes the copy.

## Layouts

The layouts are in `ground.css`. The regions are a CSS grid. The same media queries are in `ground.ts`.

- **Wide (1000 px and wider):** a 56 px top bar (‹ Menu, Workshop, Undo, Share, ⋯); three columns: the plinth (240 to 336 px), the board (`min(672px, 100dvh - 228px, 100vw - 600px)`) and the right column (264 to 336 px: the brushes, the key row, the Why tag, the tray); the ledge at the foot. The Rules shelf covers the right column.
- **Narrow (below 1000 px):** one column, up to 592 px. A 48 px top bar with icons; Share and Weigh go into ⋯. The plinth is a 68 px strip: the figure in a 56 px window, the name and a row of seals; a tap on a kept seal opens its rule card. The board is up to 560 px wide, then the brush row, then the ledge with two tabs, Pieces and Board (the tray). The Why tag, the shelf and the rule card are bottom sheets. Below 360 px the seals and the name are smaller.
- **Short landscape (landscape, at most 500 px high):** the board on the left, `min(100dvh - 56px, 100vw - 300px)`; one column on the right with the plinth strip, the brush row and the tray. Pieces in the top bar opens the ledge as a 198 px bottom sheet. The Why tag, the shelf and the rule card are side sheets over the column. A turn of the phone keeps the design, the brush, the tag and the shelf.
- **The squares:** each square is one eighth of the board, so it is as large as the board allows: up to 80 px on the wide layout (the board less its 16 px rim), 45 px at 390 px, 36 px at 320 px, 33 px at 568 × 320.
- **Sheets** (Share, the card face of a link, Look, Copy this, the delete questions) are modal dialogs inside the Workshop.

## Model

`model.ts` holds the stored form of a piece, `PieceDesign`. It is pure, so the judge and the tests run it in Node.

- **Squares:** x to the right and y forward, each from −3 to 3, never the centre. Each square has a mark: move, take, move and take, shoot, or move or shoot. Black uses the mirror image.
- **Lines:** up to 8 slide directions. A slide continues until a piece stops it, and it can take that piece.
- **Rules:** at most 3. Each rule is a When and an ability. The 10 abilities are in `vocab.ts`, each with its sentence, its pill, its seal label, the Whens that it allows and its MATRIX row. The Whens are MATRIX D.1: always, in a zone, next to a piece, from or before a move number, after the first capture, after a card, on a take, on the first take, and on the last rank.
- **Brushes and channels:** Move, Take and Both paint the whole mark. Shot adds a shot and keeps the move. Eraser clears the square. A square takes by moving or by shooting, not both. "Paint on" (`orbit`, `lineOrbit`) sets the squares and lines of one tap: the 8 turns and mirror images, left and right, or one. It is editor state, never stored.
- **Look:** `body`, `auto`, `glow`, `army` (0 ivory, 1 charcoal) and an optional `figure`. A share code with a glow still loads; A keeps the glow but does not show it. The look never changes the rules or the worth.
- **Name and letter:** until the player names it, the name follows the design (`autoName`, for example "Dawn Spirit"). The letter is the first free letter of the name.
- **Canonical form and key:** what the piece does, never its name or look (`canonical`, `keyOf`). The judge finds a measured design by its key.
- **Share code:** base64url of JSON with exactly 7 keys: `kind`, `squares`, `lines`, `rules`, `name`, `look` and `letter`. At most 4,000 characters. `parseDesign` checks it key by key and refuses a bad code, a code that breaks a hard limit and an empty piece.
- **Hard limits** (`limit`): at most 3 rules, each ability one time, a When that fits its ability, and "only a king can take it" only on a piece that takes nothing.
- **Presets:** the 11 pool pieces (Pawn, Knight, Bishop, Rook, Queen, Archer, Paladin, Guard, Maester, Beast, Ogre) in Workshop words. A unit test proves that each one equals the piece of the engine. The Workshop Maester does not have the long swap with the king.

## Judge

`judge.ts` is a port of the prototype `judge-v2.mjs`. It is pure: the same design always gets the same verdict.

- **Worth:** a formula over the features of the piece on the 64 squares of an empty board (quiet squares, far takes, shots, steps and open lines), plus a term for each rule. The When of a state rule scales its term by how often the When holds. The worth on screen is always the formula.
- **Error:** each term adds an error. The band is the worth plus or minus the root sum of squares of the errors.
- **Labels** (the lines are in `THRESHOLDS`): Fair from 2.5 to 5.0 pawns. "Possibly overpowered" above 5.0. "Likely overpowered" when the low end of the band is above 5.0. "Possibly overpowered" also when the high end is above 5.5 and the error is 1 pawn or more. "Possibly too weak" below 2.5. "Likely too weak" when the high end is below 2.5. An unchanged Pawn says "The unit of worth", and an unchanged Queen says "The queen’s worth".
- **Measured designs:** `anchors.ts` holds 17 designs that computer games measured. A design with the same key gets its label from the measurement. The number stays the formula. Each design names the source of its value, for example the runs pv2-d3 (Bishop, Rook, Ogre, Beast, Guard), pv2-A-vsR-d3 (Archer) and pv-A-af2 (Archer far2, 2.83 ± 0.28, one pass against the Rook). The Knight and the Queen use the prices of the engine (`src/ai/eval.ts`).
- **Flags and memory:** the judge flags more draws, very frequent takes, shots over pieces, a long wait, a rule that is hard to judge or never measured, a piece that nothing can block, more squares than any measured piece, and an early queen. It scores how hard the piece is to remember, from level 0 to 3.
- **On screen:** Weigh, the card face and Copy as text show the worth, the band word and (Weigh only) the like line. They call `judge(d, false)`.
- **Not on screen:** the judge still computes the "Without …" lines, the fixes, the rule deltas, the flags, the memory score and the measured note. No screen shows them now.
- **No wrong direction:** a test on random designs proves that no added square, line or ability lowers the worth, and no flaw raises it.

## Motion

`ground.ts` plays the motions of the approved mockup (ticket 10) with the Web Animations API; `ground.css` has the ripple, the preview pulse and the tag's slide.

- **Open a piece:** the figure fades in on the plinth (480 ms), the piece flies from its ledge slot to its square by its gait (320 ms), and the board ripples, ring by ring from the piece (up to 480 ms). The gait curves are in `docs/2d-first-pieces/board/gait.mjs`.
- **The first edit:** the name stamps (320 ms), the figure flies to its slot in Yours (320 ms), and the slot flashes (520 ms in all).
- **Stamp:** the seal stamps (320 ms) with a wax ring (420 ms), the stone shakes (160 ms), the new line unrolls (200 ms), and the board ripples.
- **Move here:** the piece flies by its gait (320 ms); a taken piece and a piece removed too go in a puff (520 ms in all).
- **Small motions:** a paint ripples the painted squares; a lock flashes on a square out of reach (420 ms); the lines shake at 3 of 3 (260 ms); a picked seal pulses (400 ms); a kept rule's pill pulses (480 ms); a preview pulses (480 ms); the desktop Why tag and the plaque slide in (320 ms). The die, the broom, a placed piece, a token and Done ripple the board.
- **No motion:** Undo, Take back, a removed rule and a nub.
- **The limit:** each motion ends by 600 ms (300 ms at the Fast pace) at its still pose. A temporary element goes when its motion ends.
- **Stops:** a press, a key, a close of the Workshop and a change of the motion setting stop each running motion at its still pose. A button's press transition goes on. With reduced motion (`prefers-reduced-motion: reduce`) or Animations Off (`data-pace="off"`), no motion starts.

## Art

- **The cast:** 34 approved figures in `figures.ts`, each with an id, a name and tags (Fast, Strong, Ranged, Magic, Support). `docs/visual-design/workshop/cast.json` is the same list, and a unit test keeps the two equal. The tags give the three suggestions of the look row and the filter of the Look sheet. They never change the rules or the worth.
- **The shipped art:** two webp per figure in `public/ui/workshop/`, `{id}-w.webp` (ivory) and `{id}-b.webp` (charcoal): 68 files. A unit test checks that the folder holds only these.
- **The sources:** in the main checkout, `art-src/workshop/{id}.png` (one paired sheet: ivory on the left, charcoal on the right) and `art-src/workshop/{id}.prompt.txt` (the recorded prompts). Git ignores `art-src/` except `art-src/MANIFEST.md`. The workshop section of the manifest lists each source by id, and a unit test checks that each figure has a row.
- **The art script:** `node tools/prepare-workshop-art.mjs` makes the 68 webp again in the current checkout, from any checkout. It finds the sources by id through the common folder of git. It cuts each sheet into its two halves, trims each half, fits it in 384 × 448 px and writes webp at quality 88. When a PNG or a prompt is missing, it names each missing file, writes nothing and stops with exit 1.
- **Art direction:** the "Production method" in `docs/visual-design/workshop/figure-samples-2026-10-06/README.md` and the 2D artwork direction in `docs/lessons/art-and-motion.md`.
- **On screen** (`figureOf` in `ground.ts`): a pool piece and its copies show the pool art of the game (`pieceArt` in `src/ui/guide.ts`) until the player picks a figure. A new piece shows a cast figure: the first suggestion until the player picks one. The plinth, the board, the ledge and the card face show the same figure, in the army of the design. The other pieces on the board use the pool art. After a "becomes", the board shows the art of the new piece.

## Accessibility

- **Targets:** buttons, pills, chips and choices have a 44 px hit area or more. The exceptions: the line nubs and the knots (24 px), and the board squares, as large as the board allows.
- **The board:** the squares are one grid with one Tab stop. The arrow keys move along the squares (forward is up). Each square is a button with a label such as "e5: take only, black pawn." Enter or Space acts as a tap: in look mode it opens the Why tag, lifts or places the piece. Hover or focus on a square shows its hover-only marks.
- **The Why tag** is a polite live region. × or Esc closes it, and the focus goes back to its square.
- **Rules:** each seal is a button with `aria-pressed` and a label such as "Rule I: … Show only its marks." A pill or a chip has `aria-expanded`. In a row of choices the arrow keys move the focus, and Enter commits. While the shelf is open, the controls under it leave the Tab order.
- **Keys:** 1, 2 and 3 arm a brush, B goes in and out of brush mode, S opens and closes the shelf, Ctrl+Z or Cmd+Z undoes. None of them acts under a sheet or in a text field.
- **Esc** closes one thing, in this order: the ledge's sheet; a lifted piece or an armed token; a row of choices; the rule card; the shelf; ⋯ or Weigh; the Why tag; brush mode; a kept rule or knot. Then Esc closes the Workshop.
- **Sheets** are modal dialogs, and their title gets the focus. ×, Esc or a tap on the backdrop closes a sheet, and the focus goes back to the control that opened it.
- **Toasts** are a polite status region (3.6 s). The save alert is `role="alert"`.
- **The figure art** is decoration (empty alt). Each figure choice is a button with the name of the figure and `aria-pressed`.
- **Close:** the focus goes back to the door that opened the Workshop.
- **Reduced motion and Animations Off:** see Motion.

## Checks

- **`npm test`** runs the type check, then vitest, then the node tests. The unit tests of the Workshop: `compat.test.ts` (old saves and links still load), `css.test.ts` (each class of `ground.css` is in the source), `face.test.ts` (the card face and the reach diagram), `figures.test.ts` (the cast, the 68 webp and the art manifest), `judge.test.ts` (the worth, the labels and the anchors), `model.test.ts` (the canonical form, the share code, the limits, the brushes), `moves.test.ts` (the presets equal the engine), `scene.test.ts` (the scenes equal the mockup; Try with), `ui.test.ts` (the text, the MATRIX rows, the When choices, the store and the ⋯ menu), `why.test.ts` (the why-trace and the Why tag words) and the two doc lints.
- **`npm run test:docs`** runs the doc lints. `workshop.docs.test.ts` checks this doc (the eight sections, a deny list of removed features, no tracker citation, the screenshot folder), the dated revision 3 file, the section citations in the Workshop source files, and the anchor table. `review.docs.test.ts` checks the "Checked by" column of the fix table in the review.
- **The browser checks:** `npm run check:browser workshop` and `npm run check:browser workshop-cast`. The runner builds the app, serves it on 127.0.0.1 at a free port and runs the named checks, one at a time in this run; runs in other worktrees share the machine's three slots.
- **`workshop`** (`tools/verify-workshop.mjs`; its header lists each group) runs at eight sizes, from 1440 × 900 to 568 × 320. It checks the doors, each pool piece, Yours, a link, the keys, refused marks, the isolate, the knots, the layouts and a turn of the phone. It checks the editor: paint, the first copy, Undo, the save alerts, Share and Weigh. It checks the rules: the shelf, 3 of 3, the pills, the When chips and Remove. It checks the Why tag, the hover-only marks, Try with, NEW, the pen, Look, the ⋯ menu, the Share sheet, the link card, the reach popover and the motions.
- **`workshop-cast`** checks each cast figure through More of a new piece, both armies, the filter, Undo, save and reload, and Share.
- **Screenshots:** the checks write their screenshots and logs to the output folder of the run. The runner makes one folder for each run under `kingdown-check-runs` in the temporary folder of the system, prints it at the start, and keeps one folder for each check in it (`<run folder>/workshop/`, `<run folder>/workshop-cast/`). The folder is outside each checkout, so git never tracks it. The system removes old run folders after three days; the runner never empties another run's folder.
- **The review fixes:** the fix table of the review names the check of each fix, or "superseded", or "not checked: <reason>".
