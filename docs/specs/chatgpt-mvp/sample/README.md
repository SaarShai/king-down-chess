# The visual sample (ticket 02), round 3

A static mock of the MVP screens. It is not production code.

## What changed and why

The owner's verdict on round 1 (2026-10-11): "the GUI look doesn't seem like it is based on our design for the game." Round 1 used OpenAI's generic app style: the system font, white cards, iOS switches and grey pills. Round 2 builds every screen from the web game on main.

- **The game's own style sheets.** `sample.html` loads `src/style.css`, `src/ui/table.css` and `src/ceremony.css` from the worktree. The tokens, the fonts, the buttons, the checkboxes and the sheets are the game's, not copies. `sample.css` adds only the host stand-in and the parts that have no twin in the game, and it uses only the game's tokens.
- **The game's fonts.** Cinzel for headings, Alegreya Sans for text. The owner's design wins over OpenAI's advice to use system fonts.
- **The real board.** Round 3 replaces this part: see "Round 3" below.
- **The game's components, screen by screen.**

| Sample screen | Game component |
|---|---|
| Inline home card | The title: the six kings on the stone board, the wordmark, the title buttons |
| Play, lobby, Your games, profile links | The Menu's index rows (`menu-row`) |
| Setup | The New game sheet: the mode tiles, the level and side rows (`seg-row`), the check rows (`label.check`), the footer button |
| Pieces, cards and king sheets | The Menu sheet over the page; the king sheet is the game's king picker (`king-pick`, `emblem`, `power-choice`) |
| Seat setup, board | The painted board through `PaintedView` with real engine state (Round 3); the table (`#game-table`): player strips, portraits, the power coin, the context line, the moves line, the bar |
| Cards in a game | The owner's card mode C, "Coins by the king": the power coin first, then one coin for each card; a spent card is a used coin |
| End card | The result dialog (`#over`) with the Ceremony's words "King Down" and its three tiles |
| Opponent found | The result dialog |
| Collection | The Guide's painted piece cards (`piece-card`) |
| Settings | The Menu's Board help page (Show threats is the game's own row) |
| Friend code, handle, card faces, profile scroll | New, from the game's tokens: vellum, stone edges, crimson, gold, Cinzel |

## Round 3: the board through the game's own code

The rules session reviewed round 2 (2026-10-11). The screens read as the game; the board marks did not. Round 3 draws every board from real game state with the game's own code, as the web game does:

- `board.mjs` sets the rules (`setRules`), reads a fixture FEN (`fromFen`) and lets the engine play the fixture's moves (`legalMoves`, `makeMove`). A move that is not legal stops the page.
- The marks come as `src/screen/play.ts` refresh() makes them: `marksModel()` and `railsOf()` for the selected piece, `offered()` for its moves, `threatsIn()` for Show threats, `checkersOf()` and `inCheck()` for check, the last engine move for the last-move mark.
- `PaintedView` draws them with the web game's options (`floor: null`, `webInk: true`), so `marks.ts`, `legend.ts` and `scene.mjs` draw each mark. No tile, frame or arrow is placed by hand.
- The words come from the game too: the piece text of `src/ui/table.ts`, `contextLine()`, `checkCause()`, and `describeMove()` with `pieceIcon()` for the moves line.
- The game: Mud (March) against Shadow (Darkness), cards on. Darkness lets Black's pawns step on the diagonal, so "Black pawn e6 to d5" is a legal move.
- `reference/` has two new captures of the game on main with Show threats on: `board-select` (the queen selected) and `board-check` (check). They use the sample's own fixtures, so the pairs in `compare.png` show the same position.

| Review item | What changed | PNGs |
|---|---|---|
| 1 (MUST) No piece selected; "Knight" with no side | The engine's knight on c3 is selected: the gold glow, its moves and its take. The context line is the game's piece text: "White knight. Moves in an L, over any piece." | `board-*.png` |
| 2 (MUST) No badge on the take | The take on d5 is legend.ts's occupied take: the red edge, the ring, the glow and the badge. | `board-desktop.png` |
| 3 (MUST) Threats as red frames | Show threats draws the red arrows of `threatsIn()`, and the red glow under each piece it can take. No frames. | `board-symbols-*.png`, `board-check-*.png` |
| 4 (MUST, item 4) "Ogre f3 shoves e5" does not fit | Each moves line is the engine's last move in the shown position, with the game's last-move mark: "Black pawn e6 to d5." The end card's board is a real checkmate (rook a1 to a8); the beaten king lies down. | all board states, `end-*.png` |
| 5 (SHOULD) Settings words; check with both marks | Settings: "A red arrow points from each enemy piece to your piece it can take." A new state `board-check`: the check ring, the cause line and the threat arrows together (owner, 2026-10-11). | `settings-*.png`, `board-check-*.png` |
| 6 (SHOULD) Green tiles on the seat screen | The tapped knight stands in the gold glow; the game's swap mark (two violet arrows, `marks.ts`) shows each piece it may trade with under the arrangement rules (the guard stays next to the king). | `seat-*.png` |
| 7 (SHOULD) Black's strip shows a white figure | Each strip shows its own side's king, as the game's strip does: Mud for White, the black Shadow King for Black. | all board states |
| 8 (NIT) Coordinates; no rails | The coordinates are scene.mjs's, with the web game's size. A new state `board-rails`: the queen on d3 selected, with the rails, the arrows at the board edge, the bar before the Ogre and the crosses on the takes. | `board-rails-*.png` |
| 9 (NIT) The steppers | No change. | |

- Symbols only is a plugin setting; the web game has none. The scene stands no figures, and the game's piece icons stand on the squares. The marks still read the real position.
- The seat screen's swap targets follow the arrangement rules (`bishopsOppositeColours`, `guardNextToKing`). The arrange mode on the branch `claude/arrange-mode` marks every other piece of the rank; the sample marks only the legal ones.
- Spent cards are real game state (`Position.used`). White's Vault and Leap are spent, so the queen shows no Vault squares.

## Host limits

- The inline card has two actions: Play and Your games.
- Each fullscreen screen ends above the ChatGPT composer (96 px on a phone, 128 px on a wide screen).
- One layout serves 360 px to desktop. The renders check for sideways scroll.
- The fonts load from the plugin origin, like the art (ticket 09). Byte cost, from `public/fonts/`: Cinzel 23,756; Alegreya Sans regular 19,332, bold 19,568, italic 19,788. Total 82,444 bytes; 62,656 bytes without the italic.

## The new art

- **Badges (10):** crimson and gold, the game's accent and ornament colours. They fit. They stay.
- **Scroll:** parchment on the parchment floor; it fits. Its brass rollers are glossier than the painted figures. Proposal: a matte bronze or wood roller in the next art pass. No new art in this round.
- **Coin frame:** not used. The game already has a power coin (a parchment disc with a stone edge, `.coin`). The gold frame does not match it, so the sample uses the game's coin for kings and for cards.

## Files

- `sample.html?s=<state>` shows one screen. `sample.js` holds the states; `data.js` holds the card and power texts, made from `src/powers-ui.ts`.
- `art/` holds the web copies of the new art. The masters and their prompts are in `art-src/chatgpt-mvp/` (see `art-src/MANIFEST.md`).
- `reference/` holds the web game on main (origin/main at b661ff0d; `board-select` and `board-check` at b8a3c036, the same game code), phone and desktop, made with `reference/capture.mjs`.

## Render

Render every state at phone 390×844 (DPR 2), side panel 400×900 and desktop 1440×900, from the worktree root:

```sh
node docs/specs/chatgpt-mvp/sample/render.mjs [state,...]
```

It serves the worktree root (with `public/` at `/fonts` and `/ui`, `.ts` files as plain JavaScript, and an import with no extension as its `.ts` file), writes `png/<state>-<size>.png`, `contact-sheet.png` and `compare.png` (the game on main beside the sample, phone size). It exits 1 on a fault: a sideways scroll, text over the composer zone, text past the right edge, a page error or a missing file. The host chrome (the header and the composer) is a stand-in for ChatGPT's own.

To capture the reference again: make a detached worktree of origin/main, build it, run `npm run preview` there, then `node docs/specs/chatgpt-mvp/sample/reference/capture.mjs <preview-url> [state,...]`.
