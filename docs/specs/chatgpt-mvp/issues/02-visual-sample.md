# 02 · The visual sample

Status: resolved. The owner approved the direction of round 2 on 2026-10-11: "Is this the right direction? yes!" Round 3 adds the rules session's board fixes to that direction.
Type: HITL (the owner's yes on the rendered sample)
Size: M
Blocked by: none

## Scope

A static, clickable mock of the MVP screens with the real art, for the owner's yes before the visual build (AGENTS.md: "A visual build waits for the owner's yes on a rendered sample"; spec decision Q18).

- Screens: the inline home card (Play, Your games); Play (computer, friend, random, Join with a code); Setup (the five toggles with their one-line texts, colour, level; the pieces "all" sheet with locks at 7; the cards "all" sheet; the king-coin sheet: six kings, then two powers, with the cards-on filter); Seat setup (king coin + arranging the back rank on the board, Shuffle, Ready, "waiting for the other player"); the board in a game with cards (both hands, spent cards, the power coin) and the action row (Resign, Draw, Abort/Claim when they apply); the end card with Rematch; Lobby (open games list with features and Accept, Find an opponent, the wait with "Play the computer while you wait", "Opponent found. Switch now?"); Profile (the scroll registry with totals, rating with "?", the 10 badges, earned and not earned); Collection; Settings (Symbols only, Show threats); the handle and picture screen (17 presets).
- Sizes: phone 390 × 844 (DPR 2) and desktop 1440 × 900; the side panel at about 400 × 900. Fullscreen screens leave room at the bottom for the ChatGPT composer.
- Look: the web game's own design (tokens, Cinzel and Alegreya Sans, components). The owner's design wins over OpenAI's style advice (system fonts); the fonts load from the plugin origin like the art. Host limits stay: at most 2 actions on the inline card, room for the composer, WCAG AA contrast.
- Art: existing art first (king portraits and emblems in `public/ui/kings`, `public/ui/emblems`; piece art; `public/ui/icons/*.svg`; the 10 card faces and the back in `public/ui/cards`). New art with Codex image_gen only (global rule): the scroll, the king-coin frame, 10 badges, toggle icons. Keep the masters and `.prompt.txt` files in `art-src/` with manifest rows.

## Plan

1. Read the spec, explorer notes E (art) and F (host), and the redesign style (`docs/specs/web-redesign/`).
2. Generate the new art with Codex image_gen; cut it to web sizes (WebP).
3. Build the mock as one HTML file under `docs/specs/chatgpt-mvp/sample/` with the screens as states.
4. Render each state at the three sizes with Playwright; save the PNGs beside it; make one contact sheet.
5. Send the sheet to the owner. Record the answer here.

## Acceptance

- Every screen above renders at the three sizes with no horizontal scroll and no text over the composer zone.
- The owner says yes (quote and date here), or the changes are listed and done.

## Result

- The sample is in `sample/`: `sample.html` with 23 states, the render script `render.mjs`, the renders in `png/` (69 PNGs: phone 390 × 844 at DPR 2, side panel 400 × 900, desktop 1440 × 900) and `contact-sheet.png`. `sample/README.md` tells how to render it again.
- States: `home` (inline card), `play`, `setup`, `setup-classic`, `setup-pieces`, `setup-cards`, `setup-king`, `friend-code`, `seat`, `seat-waiting`, `board`, `board-abort`, `board-claim`, `board-symbols`, `end`, `lobby`, `lobby-wait`, `opponent-found`, `profile`, `profile-badges`, `collection`, `settings`, `handle`.
- New art, made with Codex image_gen on the owner's plan: the coin frame, the scroll and 10 badges (one family look; the First Win badge is the reference for the other nine). The masters and prompts are in `art-src/chatgpt-mvp/`, with rows in `art-src/MANIFEST.md`. The web copies in `sample/art/` total 154,974 bytes. The toggle and feature icons are inline SVG (monochrome outline, the ChatGPT icon rule).
- The card and power texts come from `src/powers-ui.ts` (`sample/data.js`). The UI text uses system fonts; the brand crimson is only on primary buttons, switches, accents and badges.
- Checks: `node docs/specs/chatgpt-mvp/sample/render.mjs`: 23 states × 3 sizes, no faults (no sideways scroll, no text over the composer zone, no text past the right edge, no page error, no missing file). `npm test` before the merge: 1,998 passed, 2 failed on the 5-second timeout under machine load (`search.test.ts`, `power-fixes.test.ts`; this ticket changes no code). `npm test` after the merge of `claude/chatgpt-mvp` (634f5690): 2,011 passed, 56 skipped, 0 failed. The render after the merge: no faults.
- Not in the sample: the page size (the sample is not the plugin page; ticket 09 moves the art off the page).

### Open items

- The owner's yes on `sample/contact-sheet.png`, or a list of changes (Acceptance).
- Done in round 3: the board draws through `PaintedView` with real engine state (see Comments).
- Abort and Claim show in separate states (`board-abort`, `board-claim`). The owner may prefer one action row with all four.

## Notes

- Explorer notes: `../notes/e-art.md`, `../notes/f-host.md`.

## Comments

### 2026-10-11 · round 2: the game's design

The owner's verdict on round 1, word for word: "the GUI look doesn't seem like it is based on our design for the game." Round 1 used OpenAI's generic app style. Round 2 rebuilds every screen on the web game.

- Reference: the game on origin/main (b661ff0d), phone 390 × 844 and desktop 1440 × 900, in `sample/reference/` (title, home, New game for the computer and for kings' powers, Menu, Board help, a game with powers, the Ceremony). `sample/reference/capture.mjs` makes them from a production build.
- The sample loads the game's real style sheets (`src/style.css`, `src/ui/table.css`, `src/ceremony.css`) and fonts, and draws the boards with the game's painted scene and move legend (`sample/board.mjs`). The table in the README lists the component that each screen reuses.
- Cards in a game use the owner's card mode C, "Coins by the king" (web-redesign §1.1): the power coin, then one coin for each card.
- The plugin game has no Undo and no End turn (Q14), so the game's bar holds Offer draw, Resign and Menu. Abort and Claim go in the context line, as the game's context actions do.
- Art: the 10 badges fit and stay. The scroll fits; its glossy brass rollers are a little off the painted look (proposal: matte rollers in the next art pass). The gold coin frame is not used: the game's own coin replaces it. No new art in this round.
- Fonts from the plugin origin: 82,444 bytes for all four files, 62,656 without the italic.
- Checks: `node docs/specs/chatgpt-mvp/sample/render.mjs`: 23 states × 3 sizes, no faults. `sample/contact-sheet.png` and `sample/compare.png` (the game beside the sample for title, New game, the king picker, Board help, Menu, the game and the Ceremony). No `npm test` and no browser-check run in this round (a design sample; the Mac stays quiet for deploys).
- Open: the owner's yes on `sample/contact-sheet.png` and `sample/compare.png`, or a list of changes. The game's power buttons show small board pictures; the sample's king sheet shows the power names only.


### 2026-10-11 · round 3: the board through the game's code

The rules session reviewed round 2. The screens read as the game; the board marks did not (review: four MUST, three SHOULD, two NIT items). Round 3 fixes every MUST and SHOULD item, and items 4 and 8.

- Every board is real game state. `sample/board.mjs` sets the rules, reads a FEN and lets the engine play the moves. The marks come from `marksModel()`, `railsOf()`, `offered()`, `threatsIn()`, `checkersOf()` and the last engine move, as `play.ts` refresh() makes them. `PaintedView` draws them with the web game's options. The words come from the table's piece text, `contextLine()`, `checkCause()` and `describeMove()`.
- New states: `board-rails` (the queen selected: rails with arrows, a bar, crosses) and `board-check` (the check ring, the cause line and the threat arrows together, owner 2026-10-11). The sample now has 25 states.
- Fixes: the selected knight with its gold glow and the game's words ("White knight."); the take badge; threat arrows, not frames; legal last moves with the last-move mark; a real checkmate on the end card; the Settings words for Show threats; the swap mark on the seat screen; each strip shows its own king.
- Reference: two new captures of the game on main with Show threats on (`reference/board-select-*`, `reference/board-check-*`), on the sample's own fixtures. At full size the marks match the sample's: the rails, the ends, the take badges, the check ring, the cause line and the threat arrows.
- The README's "Round 3" section lists each review item, its change and its PNGs.
- Checks: `node docs/specs/chatgpt-mvp/sample/render.mjs`: 25 states × 3 sizes, no faults. No `npm test` and no browser-check run (another agent ran the full suite on this Mac; each render batch waited until no test run was active).
- Open: the owner's yes on `sample/contact-sheet.png` and `sample/compare.png`, or a list of changes.
- 2026-10-11, the ChatGPT MVP session: round 1 (OpenAI's generic style) was rejected by the owner: "the GUI look doesn't seem like it is based on our design for the game." Round 2 rebuilt each screen from the game's own parts; the owner: "yes!". The rules session reviewed round 2 (4 must-fix items, all on the board); round 3 (5478f5d0) draws each board through the game's code with engine state and fixes them. Screen tickets 11 to 16 follow round 3. Open for the art pass: matte scroll rollers.
