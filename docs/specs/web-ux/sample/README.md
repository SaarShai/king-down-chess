# Game screen sample

This folder holds a rendered sample of the new game screen for [ticket 02](../issues/02-game-screen-sample.md). It is not the build. The owner looks at it and gives a yes or a change.

The page is static HTML and CSS. The board images are the real painted board of the game. The page uses the game's fonts, palette, king art, emblems and piece icons from `public/`. Nothing in `src/` changes.

| File | What it is |
|---|---|
| `index.html`, `sample.css` | The game screen. `?state=` picks the state. The CSS alone sets the layout for each screen shape. |
| `boards/<state>.webp` | The board for a large screen (desktop, laptop, tablet). |
| `boards/<state>-small.webp` | The board for a phone, upright or sideways. Here the game draws larger markers and coordinates. |
| `boards/trail.webp` | Four frames of the last-move trail of decision W11 B. Only the contact sheet of `idle` shows it. |
| `capture.mjs` | Renders, contact sheets and the checks of ticket 02. It also serves the page. |
| `boards.mjs` | Captures the board images from the running game. |

## Open the sample

```sh
node docs/specs/web-ux/sample/capture.mjs --serve
```

Open `http://127.0.0.1:5199/docs/specs/web-ux/sample/index.html?state=idle`. Change `state` to one of the seven states below, or push the keys 1 to 7. Change the window size to see the layouts. Use the device toolbar of the browser for the touch sizes: the 44 px buttons come from a coarse pointer, not from the width. Ctrl+C stops the server.

Open the page over http, not from the file. From `file://` the browser blocks the fonts and the piece icons. The server sends only this folder, `public/fonts/` and `public/ui/`.

## The seven states

All states use one game against the computer, 24 plies long, so the move list is full and scrolls. The two powers states use a short game: you play Frost (Freeze), the computer plays Shadow (Death Touch).

| State | Board | Panel |
|---|---|---|
| `idle`: your move | The computer moved its queen from h6 to e6. Only e6 has the wash. | "Your move". The note says the last move in words and "Choose a piece to see its moves." |
| `hint`: the Hint line | Your archer on g5 and its target g7 are marked. | One line: "Hint: your archer on g5 shoots the maester on g7. Tap g7 to play it." (item 9). |
| `selected`: a piece is selected | Your maester on h1 is selected. Its moves show. | The Maester card in the context area. Hint and Undo stay where they are. |
| `review`: an earlier move | The board after move 6: your archer on e3 shot the bishop on c5. Both squares have the wash. | "Reviewing move 6", the move in words and "Back to game", the only crimson button. Hint and Undo are off. Previous and Next are on. The list marks the viewed move; the later moves are in the soft ink. |
| `resign`: the question of item 2 | The idle board. | "Resign this game? The computer wins." with Resign (crimson) and Keep playing. |
| `powers`: a game with king powers | The powers game, your move. | Each strip shows its king, its power and "took" with the taken piece. Death Touch is a quiet "Always on" control. Its card is open, in the third person, in the game's own words. |
| `armed`: Freeze is armed | The Freeze targets on the board. | Freeze has the gold ring. Its card holds the rule and the step: "Tap an enemy piece (not the king). It cannot move on its next turn. Then make your move. To cancel, tap Freeze again." |

## Make the renders and run the checks

```sh
node docs/specs/web-ux/sample/capture.mjs <out-dir> [--scale 2]
```

- `<out-dir>` must be outside the repo. The script stops with a usage line if it is not. Do not commit the renders.
- The script uses Playwright from the repo and Chrome. `PLAYABLE_BROWSER` sets a different browser channel.
- It writes 63 renders (`<state>-<size>.png`), 7 contact sheets (`sheet-<state>.png`) and `results.json`.
- It prints one PASS or FAIL line for each check and exits with 1 when a check fails.

The five review sizes are 1440×900 (desktop), 1280×720 (laptop), 820×1180 (tablet), 390×844 (phone) and 844×390 (landscape). Four more sizes come from claude-review §5: 390×664 and 375×550 (phones with the Safari bars), 375×667 and 667×375 (the iPhone SE). All sizes but desktop and laptop are touch sizes. A contact sheet shows the five review sizes in its first row and the four other sizes in its second row.

| Check | Ticket 02 Verification line, or the critique that asks for it |
|---|---|
| The page loads with no error and with the correct board image | (all) |
| No sideways scroll and no page scroll | No sideways scroll |
| Every control is inside the screen and no box with a clip cuts it | Every control inside the screen |
| No region lies over another | Every control inside the screen |
| The newest move (in review: the viewed move) shows whole | Critique: the cut move row in landscape |
| The context area shows all its text with no scroll | Critique: the clipped context area |
| Touch sizes: every control is 44 × 44 px or larger | On touch sizes every control is at least 44 px |
| Hint and Undo move 0 px across the seven states, at each size | Hint and Undo stay at the same place |
| 390×844: squares 45 px or more; 820×1180: board frame 736 px or more; 844×390 and 667×375: the board fills the height | The three board sizes |
| 390×664: the board gets the full width; 375×550: squares about 37 px (36.5 px or more) | claude-review §5 |
| Cinzel only at 18 px or more; body text 16 px, no text under 14 px | Cinzel only at 18 px and larger; body text 16 px |
| Text contrast 4.5:1, 3:1 for large text | Critique: the later moves in review |
| Each button has exactly one kind; at most one crimson control in each view | Three button kinds plus an icon button |
| Keyboard order goes down the rail (desktop, laptop, tablet) | Critique: WCAG 2.4.3 |
| With the WCAG 1.4.12 text spacing: no control or text is lost | Critique: WCAG 1.4.12 |

The last line of the ticket, the owner's yes, is not a script check.

## Make the board images again

Do this only when the drawing of the game changes. Start a dev server of this checkout in a second terminal, then run the script:

```sh
npx vite --port 5191 --strictPort
node docs/specs/web-ux/sample/boards.mjs http://127.0.0.1:5191/ [raw-dir]
```

Stop the dev server when the script is done. `raw-dir` is optional. It gets the full-size PNGs and must be outside the repo.

The script loads a saved game, clicks the board as a player does, and copies the canvas. It removes 36 of the 64 units of headroom at the top, so the tallest figures on rank 8 keep their heads. An image is 960 × 988 scene units. A square is 112 units and the board frame is 948 units, so on the page a square is the image width × 112 / 960. The large set is 1440 px wide, the small set is 1170 px wide. Each file is less than 240 KB.

Three things in the images are the proposal, not the game of today. The script draws them on the ground layer, under the figures, through the decorate hook of the scene:

- The stronger wash of decision W11 on the square the piece reached. It has the tile's own cut corners and lets the marble show through. After an archer's shot it also marks the archer's square.
- The trail of decision W11 B from the start square. It fades in 1.2 s. The state images show the board at rest, with no trail. `trail.webp` shows the idle move 0.1 s, 0.5 s and 0.9 s after the move, and at rest.
- A soft edge: the canvas cuts the shadow of the board frame, so the image fades that shadow into the floor.

`PaintedView.ts` and `marks.ts` do not change, so nothing changes in the ChatGPT plugin page.

## What each part answers

| Part of the page | Review item or decision |
|---|---|
| One context area under the action row; Hint and Undo in one row that does not move in any state; no Cancel button | Item 1, stable game screen |
| Resign as a quiet flag at the end of the toolbar (the word shows where the row has room) or in Menu (phones); the question in the context area | Item 2 |
| No header card; one status line in player words ("Your move", "Reviewing move 6"); on phones it is in your strip | Item 3 |
| The Hint line in the context area | Item 9 |
| Previous, Next and "Back to game", 44 px on touch; the viewed move marked in the list | Item 10, review controls |
| Body text 16 px, Cinzel only for the card titles at 18 px, three button kinds plus an icon button, one frame per surface, crimson only for the one main action | Item 16 and decision W10 B |
| "Always on" as a quiet state, the opponent's power in the third person; your power as a button with the gold ring only when armed | Item 17 |
| A portrait tablet layout with the board frame 772 px wide; a short-landscape layout with the board at full height; safe-area insets; `svh` | Item 4 and [section 4](../review.md#4-the-proposed-game-screen) of the review |
| 44 px controls on any coarse pointer, tablets included | Item 5 |
| Phones and landscape: one bar of five (Menu, Hint, Undo, Previous, Next). Desktop, laptop and tablet: a quiet text toolbar | Decision W2 C |
| The stronger wash on the square the piece reached, and the trail frames | Decisions W11 and W11 B |
| "Computer", "You", "White", "took" and the last move in words; no army codes | Item 3 (player words) and the design bar of ticket 02 |

## Where the sample differs from the wireframes

Each line is a choice the owner's yes covers. The owner can reject any one of them.

- **Previous and Next stay in the action row on wide screens.** The §4 desktop wireframe gives them a row of their own in review. In the sample they stay at the right end of the Hint and Undo row in all states, so nothing moves when review starts. Resign went to the toolbar, so no destructive control is near them.
- **A gold ring on the avatar, and the turn in words, show the side to move.** claude-review §5 asks for a 3 px gold-ink edge at the left of the strip. The ring sits on the king's own picture and has no edge to align. On phones the strip also says "· Your move"; on wide screens the status line says it.
- **The strips are 56 px high on wide screens.** On phones they are 36 to 44 px, by the height of the screen; sideways they are 48 px. claude-review §5 asks for 40 and 36 px. The 56 px strip holds the two lines below and a 40 px avatar.
- **The strip has two lines.** The name is on the first line; the level, the king and "took" are on the second. The wireframe has one line ("Computer · Casual"). Two lines keep the taken pieces next to the name and the name readable on a narrow phone.
- **The context area is under the action row.** Item 1 says so; the §4 wireframe puts it above. Under the row, a long card or a question can grow down into the move list and Hint and Undo do not move.
- **On the tablet, the status line and the actions share one row.** The panel under the board has a left column (status, actions, context) and a right column (moves). This keeps the board frame 772 px wide.
- **On phones a card has no title row.** The card's name is the bold first words of its text, in two lines of 22 px. On a short phone the open card or question takes the place of the move list until it closes.
- **The powers game at 375×550 has squares of 36.95 px.** The Freeze button needs a 44 px strip, so the board gets 1 px less than in the other states (37.86 px). claude-review §5 says "about 37 px".

## Not in the sample

- The Menu sheet of decision W2 C (New game, Guide, Workshop, Settings, Resign).
- The computer's turn ("Computer is thinking…") and check ("Check! Your move"), the other status lines of item 3.
- The result screen of decision W8.
- Motion. Only the four trail frames show the fade.
- A device test of the safe-area insets.
