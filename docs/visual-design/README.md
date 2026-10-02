# Visual design and UX pass — 2026-10-02

Owner request (2026-10-02): improve graphic design and UX, so the game looks designed and in keeping
with its painted storybook pieces and stone board, and is easier to start and to use. This folder holds
the design note, the checks and the before/after screenshots.

## What changed

| Area | Before | After |
|---|---|---|
| Opening | The game opened straight onto a random army. | A title screen: the King Down wordmark over the painted kings on the stone board, with **Continue** (when a game is saved), **Learn the pieces** and **Play**. A first visit leads with the lessons. Shown once per browser tab; never over a game link, `?fen=` or `?army=`; `?title=0` skips it. |
| Type | System sans and Georgia. | Cinzel for the wordmark, headings and the result; Alegreya Sans for everything else. |
| Look | Black-and-white pixel HUD (2 px ink borders, hard drop shadows). | Parchment surfaces, stone edges and borders, one burgundy accent, gold ornament. |
| Buttons | Text only. | The menu and Hint/Undo/Resign show an icon over the label; primary actions are burgundy. |
| Guide | A four-column table (stacked on phones). | One card per piece with its painted figure, letter, moves, captures and specials. |
| Promotion | Letter buttons. | Each choice shows its painted figure (in the promoting side's colour). |
| Result | Plain dialog. | The two painted kings; the beaten one lies toppled (none after a draw). |
| Lessons | Text in the panel. | A six-step progress bar and the task in a lesson card. |
| Threats | — | Settings → **Show threats** (off by default): a red ring at the feet of each of your pieces the other side can take, and a red dot on each empty square it covers. Uses only the engine's exported `pseudoMoves` and `isAttacked`. |
| Refused moves | The tap did nothing, or deselected silently. | The help line says why: "That is Black's rook. White to move…", "This bishop has no legal move…", "Not allowed: that bishop move would leave your king in check.", "Not allowed: a guard can only be taken by a king.", "Not allowed: the rook cannot reach b2…", "The computer is thinking…". |
| Keyboard | Panel buttons only; the board needed a pointer. | Tab to the board; arrow keys move a square cursor (it follows the board's orientation), Enter or Space selects and moves, Shift+Enter is the Ogre push shortcut, Escape cancels. Moves in the list are buttons. |
| Screen readers | Help and moment lines only. | Every move by either side is announced ("White pawn e2 to e4.", "Black archer on c7 takes the knight on d6 without moving."), plus Undo, and the cursor's square and piece. |
| Phones | Mixed control heights. | Every control in the panel and the dialogs is at least 44 px; visible focus everywhere. |

Every element id is kept. Two kinds of tool selectors changed: the Guide's `#rules-rows tr` became
`#rules-rows .piece-card` (cards keep the "A Archer" text), and each browser tool now sets
`sessionStorage['kingdown.title-seen'] = '1'` to skip the title screen.

## Fonts (SIL Open Font License 1.1, self-hosted)

| Face | Use | Files | Licence |
|---|---|---|---|
| [Cinzel](https://github.com/NDISCOVER/Cinzel) (variable, 400–900) | wordmark, header, dialog headings, piece names, result | `public/fonts/cinzel-latin.woff2` (24 KB) | [OFL-Cinzel.txt](../../public/fonts/OFL-Cinzel.txt) |
| [Alegreya Sans](https://github.com/huertatipografica/Alegreya-Sans) 400, 400 italic, 700 | body, buttons, labels | `public/fonts/alegreya-sans-{regular,italic,bold}-latin.woff2` (19–20 KB each) | [OFL-AlegreyaSans.txt](../../public/fonts/OFL-AlegreyaSans.txt) |

Source: the `google/fonts` repository. Subset with `pyftsubset` to Basic Latin, Latin-1 and the
punctuation the game prints (— – … ‘ ’ “ ” · × ← →), as woff2: 82 KB in all, so the game still works
offline. Cinzel's classical capitals suit kings and stone; Alegreya Sans is a humanist sans with a
calligraphic touch that stays readable at 12–15 px.

## Tokens (`src/style.css`, `:root`)

- **Colour.** `--parchment #f3ead7` (panel), `--vellum #fbf7ee` (dialogs, cards, fields),
  `--parchment-deep #e7d8b8`; text `--ink #2b2621` and `--ink-soft #5b5045`; stone `--stone-100/300/500/700/900`;
  `--accent #842c21` (primary buttons, checked boxes), `--accent-deep #5a1c14`; `--gold #c99a3e` (ornament),
  `--gold-ink #7a5712` (gold as text); `--danger #b0251b` (threats, check); `--focus #1c5bb0`;
  `--night #221d18`, `--on-night`, `--on-night-soft` (title screen).
- **Type.** `--font-display`, `--font-body`; sizes `--fs-xs 12.5` · `--fs-sm 14` · `--fs-md 15.5` (body) ·
  `--fs-lg 18` · `--fs-xl 23` · `--fs-2xl 30`; `--lh 1.45`.
- **Space and shape.** `--space-1…6` = 4 · 8 · 12 · 16 · 24 · 32 px; `--radius-sm 5`, `--radius 8`, `--radius-lg 14`;
  `--tap 44px`; `--lift`, `--shadow-card`, `--shadow-float`.

## Contrast (WCAG 2.2 AA)

`node docs/visual-design/contrast.mjs` checks 26 text/surface and UI pairs read from the tokens
([contrast.json](contrast.json)); all pass. Lowest text pairs: `--gold-ink` on parchment 5.49:1, `--danger`
on parchment 5.62:1, `--ink-soft` on `--stone-100` (disabled labels) 6.30:1. Body text is 12.5:1 on the
panel and 14.0:1 in dialogs. UI parts: focus ring 5.5:1, borders 3.6–7.9:1.

## Checks

- `PLAYABLE_URL=… PLAYABLE_BROWSER=chromium node docs/visual-design/verify.mjs` — title screen (first visit,
  returning player, never over links/`?fen=`/`?title=0`), keyboard play of e2-e4 with both announcements,
  move-list buttons, Show threats on a known position (1 ring, 15 dots), five refusal messages, Guide cards
  and promotion figures, and every phone control ≥ 44 px. Results: [checks.json](checks.json).
- `node docs/visual-design/shots.mjs <url> before|after` — the screenshots below.
- `python3 docs/visual-design/make-ui-art.py` — re-cuts `public/ui/` from the painted sheets.

## Screenshots (1280×900 and 390×844)

| View | Before | After |
|---|---|---|
| Title / first load | [desktop](before/title-desktop.png) · [phone](before/title-phone.png) | [desktop](after/title-desktop.png) · [phone](after/title-phone.png) · returning: [desktop](after/title-returning-desktop.png) · [phone](after/title-returning-phone.png) |
| Game (d-pawn selected) | [desktop](before/game-desktop.png) · [phone](before/game-phone.png) | [desktop](after/game-desktop.png) · [phone](after/game-phone.png) |
| Show threats | — | [desktop](after/threats-desktop.png) · [phone](after/threats-phone.png) |
| New game | [desktop](before/new-game-desktop.png) · [phone](before/new-game-phone.png) | [desktop](after/new-game-desktop.png) · [phone](after/new-game-phone.png) |
| Settings | [desktop](before/settings-desktop.png) · [phone](before/settings-phone.png) | [desktop](after/settings-desktop.png) · [phone](after/settings-phone.png) |
| Guide | [desktop](before/guide-desktop.png) · [phone](before/guide-phone.png) | [desktop](after/guide-desktop.png) · [phone](after/guide-phone.png) |
| Lesson | [desktop](before/lesson-desktop.png) · [phone](before/lesson-phone.png) | [desktop](after/lesson-desktop.png) · [phone](after/lesson-phone.png) |
| Promotion | [desktop](before/promotion-desktop.png) · [phone](before/promotion-phone.png) | [desktop](after/promotion-desktop.png) · [phone](after/promotion-phone.png) |
| Capture or push | [desktop](before/capture-or-push-desktop.png) · [phone](before/capture-or-push-phone.png) | [desktop](after/capture-or-push-desktop.png) · [phone](after/capture-or-push-phone.png) |
| Result | [desktop](before/result-desktop.png) · [phone](before/result-phone.png) | [desktop](after/result-desktop.png) · [phone](after/result-phone.png) |

![Title, desktop](after/title-desktop.png)
![Guide, phone](after/guide-phone.png)

## Limits

- The board itself (squares, markers, coordinates, figures) is drawn by the painted scene, which the
  motion track owns; this pass did not change it. Threat markers and the keyboard cursor are a separate
  layer over the canvas, placed with `view.screenOf()`.
- In the clay 3D look, threat markers follow the camera frame by frame, but they sit flat over the
  view, not on the tilted squares.
- The before screenshots were taken in a cloud container without Georgia, so the old header shows a
  fallback serif.
- Not tested with a real screen reader (NVDA, VoiceOver); the live regions and labels were checked by
  their text in a headless browser.
- No new art: the title uses the existing King, Ogre and Beast figures and the stone board. A dedicated
  title illustration would be a later art task.
