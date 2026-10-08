# Game screen sample

This folder holds a rendered sample of the new game screen for [ticket 02](../issues/02-game-screen-sample.md). It is not the build. The owner looks at it and gives a yes or a change.

The page is static HTML and CSS. The board images are the real painted board of the game. The page uses the game's fonts, palette, king art, emblems and piece icons from `public/`. Nothing in `src/` changes.

| File | What it is |
|---|---|
| `index.html`, `sample.css` | The game screen. `?state=` picks the state. The CSS alone sets the layout for each screen shape. |
| `boards/<state>.webp` | The board for a board 700 px wide or more (desktop, laptop, tablet). |
| `boards/<state>-small.webp` | The board for a phone. Here the game draws larger markers and coordinates. |
| `capture.mjs` | Renders, contact sheets and the checks of ticket 02. It also serves the page. |
| `boards.mjs` | Captures the eight board images from the running game. |

## Open the sample

```sh
node docs/specs/web-ux/sample/capture.mjs --serve
```

Open `http://127.0.0.1:5199/docs/specs/web-ux/sample/index.html?state=idle`. Change `state` to `selected`, `review` or `powers`, or push the keys 1 to 4. Change the window size to see the layouts. Use the device toolbar of the browser for the touch sizes: the 44 px buttons come from a coarse pointer, not from the width. Ctrl+C stops the server.

Open the page over http, not from the file. From `file://` the browser blocks the fonts and the piece icons. The server sends only this folder, `public/fonts/` and `public/ui/`.

## Make the renders and run the checks

```sh
node docs/specs/web-ux/sample/capture.mjs <out-dir> [--scale 2]
```

- `<out-dir>` must be outside the repo. The script stops with a usage line if it is not. Do not commit the renders.
- The script uses Playwright from the repo and Chrome. `PLAYABLE_BROWSER` sets a different browser channel.
- It writes 20 renders (`<state>-<size>.png`), 4 contact sheets (`sheet-<state>.png`) and `results.json`.
- It prints one PASS or FAIL line for each check and exits with 1 when a check fails.

The sizes are 1440×900 (desktop), 1280×720 (laptop), 820×1180 (tablet), 390×844 (phone) and 844×390 (landscape). The last three are touch sizes.

| Check | Ticket 02 Verification line |
|---|---|
| The page loads with no error and with the correct board image | (all) |
| No sideways scroll and no page scroll; every control inside the viewport | No sideways scroll and every control inside the screen |
| Touch sizes: every control is 44 × 44 px or larger | On touch sizes every control is at least 44 px |
| Hint and Undo move 0 px across the four states, at each size | Hint and Undo stay at the same place |
| Phone squares 45 px or more; tablet board 736 px or more; landscape board fills the height | The three board sizes |
| Cinzel only at 18 px or more; body text 16 px, no text under 14 px | Cinzel only at 18 px and larger; body text 16 px |
| Each button has exactly one kind; at most one crimson control in each view | Three button kinds plus an icon button; crimson only for the one main action |

The last line of the ticket, the owner's yes, is not a script check.

## Make the board images again

Do this only when the drawing of the game changes. Start a dev server of this checkout in a second terminal, then run the script:

```sh
npx vite --port 5191 --strictPort
node docs/specs/web-ux/sample/boards.mjs http://127.0.0.1:5191/ [raw-dir]
```

Stop the dev server when the script is done. `raw-dir` is optional. It gets the full-size PNGs and must be outside the repo.

The script loads a saved game, clicks the board as a player does, and copies the canvas. It removes 36 of the 64 units of headroom at the top, so the tallest figures on rank 8 keep their heads. An image is 960 × 988 scene units. A square is 112 units and the board frame is 948 units, so on the page a square is the image width × 112 / 960. The large set is 1440 px wide, the small set is 1170 px wide. Each file is less than 220 KB.

The script also draws the two marks of decision W11 B on the ground layer, under the figures, through the decorate hook of the scene: a stronger wash on the square the piece reached, and in the idle state the faint trail from the start square. The trail is one still frame of the 1.2 s fade. `PaintedView.ts` and `marks.ts` do not change, so nothing changes in the ChatGPT plugin page.

## The four states

| State | Board | Panel |
|---|---|---|
| `idle`: your move | The computer moved its queen from d8 to h4. The h4 wash and the faint trail from d8. | "Your move". The note says the last move in words and "Choose a piece to see its moves." |
| `selected`: a piece is selected | Your archer on e3 is selected. Its moves and its two targets show. | The Archer card in the same context area. Hint and Undo stay where they are. |
| `review`: an earlier move | The board at move 3: the computer's bishop on c5. | "Reviewing move 3", the move in words and "Back to game", the only crimson button. Hint and Undo are off. Back and forward are on. The viewed move is marked in the list; the later moves are grey. |
| `powers`: a game with king powers | You play Frost, the computer plays Shadow. | Each strip shows its king, the taken piece and its power. Your Freeze shows "1 left". Death Touch shows "Always on" and its card is open, written in the third person. |

## What each part answers

| Part of the page | Review item or decision |
|---|---|
| One context area of fixed height; Hint and Undo in one row that does not move; no Cancel button | Item 1, stable game screen |
| Resign as a quiet flag (wide screens) or in Menu (phones) | Item 2 |
| No header card; one status line in player words ("Your move") | Item 3 |
| Back, forward and "Back to game", 44 px on touch | Item 10, review controls |
| Body text 16 px, Cinzel only for the card titles at 18 px, three button kinds plus an icon button, one frame per surface, crimson only for "Back to game" | Item 16 and decision W10 B |
| "Always on", the opponent's power in the third person, each power button in its own strip | Item 17 |
| A portrait tablet layout with the board 756 px wide; a short-landscape layout with the board at full height; safe-area insets; `svh` | Item 4 and [section 4](../review.md#4-the-proposed-game-screen) of the review |
| 44 px controls on any coarse pointer, tablets included | Item 5 |
| Phones and landscape: one bar of five (Menu, Hint, Undo, Back, Forward). Desktop, laptop and tablet: a quiet text toolbar and a quiet Resign flag | Decision W2 C |
| The stronger wash on the square the piece reached, and the faint trail in the idle state | Decision W11 B |
| "Computer", "You", "White" and the last move in words; no army codes | Item 3 (player words) and the design bar of ticket 02 |

## Not in the sample

- Item 9, the Hint line. No state shows it. On the build it is one line in the context area, for example "Hint: use Strike, then knight f1 to f7."
- The Menu sheet of decision W2 C (New game, Guide, Workshop, Settings, Resign).
- The result screen of decision W8, and all motion.
- A device test of the safe-area insets.
