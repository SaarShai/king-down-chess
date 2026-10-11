# The visual sample (ticket 02), round 2

A static mock of the MVP screens. It is not production code.

## What changed and why

The owner's verdict on round 1 (2026-10-11): "the GUI look doesn't seem like it is based on our design for the game." Round 1 used OpenAI's generic app style: the system font, white cards, iOS switches and grey pills. Round 2 builds every screen from the web game on main.

- **The game's own style sheets.** `sample.html` loads `src/style.css`, `src/ui/table.css` and `src/ceremony.css` from the worktree. The tokens, the fonts, the buttons, the checkboxes and the sheets are the game's, not copies. `sample.css` adds only the host stand-in and the parts that have no twin in the game, and it uses only the game's tokens.
- **The game's fonts.** Cinzel for headings, Alegreya Sans for text. The owner's design wins over OpenAI's advice to use system fonts.
- **The real board.** `board.mjs` draws each board with the game's painted scene (`docs/2d-first-pieces/board/scene.mjs`, as `src/render/PaintedView.ts` uses it) and the game's move legend (`src/render/legend.ts`). Symbols only uses the game's piece icons.
- **The game's components, screen by screen.**

| Sample screen | Game component |
|---|---|
| Inline home card | The title: the six kings on the stone board, the wordmark, the title buttons |
| Play, lobby, Your games, profile links | The Menu's index rows (`menu-row`) |
| Setup | The New game sheet: the mode tiles, the level and side rows (`seg-row`), the check rows (`label.check`), the footer button |
| Pieces, cards and king sheets | The Menu sheet over the page; the king sheet is the game's king picker (`king-pick`, `emblem`, `power-choice`) |
| Seat setup, board | The table (`#game-table`): player strips, portraits, the power coin, the context line, the moves line, the bar |
| Cards in a game | The owner's card mode C, "Coins by the king": the power coin first, then one coin for each card; a spent card is a used coin |
| End card | The result dialog (`#over`) with the Ceremony's words "King Down" and its three tiles |
| Opponent found | The result dialog |
| Collection | The Guide's painted piece cards (`piece-card`) |
| Settings | The Menu's Board help page (Show threats is the game's own row) |
| Friend code, handle, card faces, profile scroll | New, from the game's tokens: vellum, stone edges, crimson, gold, Cinzel |

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
- `reference/` holds the web game on main (origin/main at b661ff0d), phone and desktop, made with `reference/capture.mjs`.

## Render

Render every state at phone 390×844 (DPR 2), side panel 400×900 and desktop 1440×900, from the worktree root:

```sh
node docs/specs/chatgpt-mvp/sample/render.mjs [state,...]
```

It serves the worktree root (with `public/` at `/fonts` and `/ui`, and `.ts` files as plain JavaScript), writes `png/<state>-<size>.png`, `contact-sheet.png` and `compare.png` (the game on main beside the sample, phone size). It exits 1 on a fault: a sideways scroll, text over the composer zone, text past the right edge, a page error or a missing file. The host chrome (the header and the composer) is a stand-in for ChatGPT's own.

To capture the reference again: make a detached worktree of origin/main, build it, run `npm run preview` there, then `node docs/specs/chatgpt-mvp/sample/reference/capture.mjs <preview-url>`.
