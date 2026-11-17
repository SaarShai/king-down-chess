# Play, New game, the Menu, You and the Guide

Status: ready-for-human

Spec: [Menus](../spec.md). Blocked by: none (the copy after stage "sides-lane", [Sides](../../interface-sides/spec.md)).

AGENTS.md: this part changes what the player sees. It waits for the owner's yes on a rendered sample before a merge.

## Scope and plan

### Decision 24: the control set

- `src/interface/play/menus.ts` (new): `listRow` (the whole row is the target), `pictureChoice` (the kit's radio cards with a picture), `segmented` (one track; a setting row puts the name at the left), `switchSetting` (the whole row changes the value), and `SETTING_ORDER` (Pieces, Powers and cards, Coordinates, Sound, Motion speed). You and the Menu take their rows from one function, with the same handlers in `main.ts` (`settings()`).
- `kit.js`: `switchRow` adds no note when the description is empty, and shows the state as a word and a track with a knob.
- `components.css`: selected is blue, the main action is brass, danger is red; no underline on a control; hover only under `@media (hover: hover)`.
- Test: unit (`menus.test.ts`), browser (each case counts controls under 44 px).

### Decision 25: Play

- `src/interface/play/home.ts` (new): `playScreen`. No picture at the top; a small title at the left.
- No game: "Play the computer", the summary line (level, game type, side) with Change, the army row and "Tap a figure to read its rule.", then "Play a person".
- A saved game: one card with the small board (`mini-board.ts`), the level, the game type and the turn, the state ("Your move", "Your turn · Not final" or "Computer to move"), the last action as a sentence, and Continue. "New game" opens the panel.
- The army row shows each piece type one time (`armyTypes` in `new-game.ts`), with 44 px targets. It wraps to a second row and does not scroll sideways. A figure opens the piece card (the name, "New", one line, Full rule, Close). Full rule opens the entry in the Guide; Back returns to Play with focus on the same figure.
- `src/interface/play/mini-board.ts` (new): `savedPreview` uses the staged position and the person's side; `lastSquares` marks each square that the last action changes, in the "Last" colour of the marks spec.
- Test: unit (`mini-board.test.ts`, `new-game.test.ts`), browser (`home_new`, `home_saved`, `home_draft`, `piece_card`).

### Decision 26: the New game panel

- `src/interface/play/new-game.ts` (new, no DOM): the candidate `NewGameDraft` (setup, level, side choice, player, back rank, rules, preview game). `createDraft` deals it; `changeDraft` keeps the game for a level change, keeps the deal for a side change, and deals kings and cards once for a type change; `startOf` gives the live game with the same army, kings and hands.
- `newGamePanel` in `home.ts`: a sheet from the bottom on a phone, a centred panel (560 px, 90 percent of the height at most) from 600 px. Game type as three picture choices, the computer level as a segmented control with one line, "Your pieces" (Light, Dark, Random) with a small king, and the army of the candidate. When a saved game exists, one red line names it ("This ends your game against the Casual computer."). Start game is the one main button.
- Close, Escape, a tap outside and browser Back discard the edits. Start game reads the save again: when another tab saved or ended a game since the panel opened, the first press shows the new line and does not start. A second press in the same moment does not start a second game and does not land on the page under the panel.
- The dialog "Start a new game?" goes. The result card's New game opens the panel on Play.
- `shell.ts`: `openLayer` and `closeLayer` give the panel a history entry, so Back closes it.
- Test: unit (`new-game.test.ts`), browser (`panel`, `panel_second_tab`), `tools/verify-next-save.mjs`.

### Decision 27: the in-game Menu

- `gameMenu` in `menus.ts`: Close in the head; Back to home and the red Resign in one row; "Your game stays saved." (or the save fault line); then the five setting rows.
- At 390x844 the whole Menu fits (head 44, exits 44, note 22, rows 220 px). At 360x640 only the setting rows scroll. In the side rail of a wide layout the Menu takes the opponent strip; a phone on its side (height under 500 px) also lends it the strip of the person's pieces. The board does not move.
- Soak fault 4: the Menu always takes the reader space before it draws, and `menuEnter` keeps the head and the exits in place (a short fade); only the rows slide. A tap at once after the Menu opens lands on the control that the person sees.
- Test: browser (`menu`, `menu_fast_tap`).

### Decision 28: You

- `youPage` in `menus.ts`: the device notice ("You play on this device. Your settings stay here."), BOARD (Pieces and Powers and cards as picture tiles, Coordinates), SOUND AND MOTION (Sound, Motion speed), Reset hints, and ABOUT (Privacy, Terms, Support as list rows). No games and no New game.
- iOS need P1: the About links use `apiOrigin` (`aboutLinks`).
- Test: unit (`menus.test.ts`), browser (`you`).

### Decision 29: the picture Guide

- `guide.ts`: the front page has four picture tiles with counts, in the order of the learning spec. Pieces in two groups ("New pieces", "Chess pieces") with the "New" tag; Kings and powers as six king blocks with two powers each; Cards as a grid of the paintings (two columns on a phone, four on a wide screen); "How a turn works" on one page. An entry has larger art, the rule panel and the move diagram of the learning stage, and Previous and Next (off at the ends). The back link names its target. Back returns to the row that the person left. On a wide screen the list is beside the entry.
- Speed fix 11: Guide Back returns to the row; a skip link ("Skip to content") comes before the bar.
- Test: unit (`menus.test.ts`), browser (`guide`).

### Decisions 30 and 37: small faults, shell classes and safe areas

- The phone bar is 56 px plus the bottom safe area; the top bar is 72 px plus the top safe area (iOS need P2). The tab marker is brass. Dialog text and Play text are at the left.
- `tokens.css`: `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` from `env(safe-area-inset-*, 0px)`, `--bar-phone`, `--bar-top`, `--brass`. The bar, the pages, the panel, the dialogs and the Menu pad with them.
- iOS needs P4 and P5: no callout, no selection and no tap colour on controls; `-webkit-text-size-adjust: 100%` on `html`.
- Classes: under 600 px one column and the bar at the bottom; 600 to 899 px one column of 640 px at most; from 900 px two columns in 1120 px at most; a phone on its side keeps the main action in view.
- Test: unit (`menus.test.ts`), browser (`layout`, and the bar checks of `home_new`).

### Decision 45: home load

- `main.ts` loads `board-api` and `render/sfx` with a dynamic import when a game starts or continues, and in idle time after home shows. The large stone picture of the board starts with that code. Home does not wait for the symbol files.
- Test: unit (`menus.test.ts`), browser (`load_order`), and the speed run.

### Decisions 46, 51 and 52

- The level lines: "The easiest level. A good level for a first game.", "Much stronger than Casual. It makes some mistakes.", "The strongest level. Much stronger than Clever."
- "Play a person" stays a list row on Play. The side choice is "Your pieces" with Light, Dark and Random, each with a small king.
- Test: unit (`menus.test.ts`).

## Verification

- `npm test`, `npm run test:docs`, `npm run build` and `npm run check:browser next-save`: the counts and the logs are in the stage report.
- Browser: Chromium and WebKit, 14 cases at 360x640, 390x844 and 1440x900, and 9 cases at the other 13 sizes of the matrix and at 320x568.
- Red proofs: 13 browser cases against the base build (12 fail; `old_page` is a regression check), and the 12 new unit tests against small changes that undo each rule (12 fail). The case `code_fault` (the board code cannot load) came after the red run: the base has no late load of the board code.
- Speed: home usable on "fast 3G" with a 4 times slower processor.
- Evidence: the stage report in the design project, `parallel/menus/run/report.md`, section "Stage menus".

## Known limits

- The time to a playable game on "fast 3G" goes up when the press comes at once after home shows: the board code loads after the press, as decision 45 says. When the person looks at home first, the code is ready.
- The 44 px squares spill past a small board at 320x568 and 667x375 (also in the base). The Menu sits above them.
- Desktop engines do not apply `-webkit-text-size-adjust`; a unit test reads the style file.
- The safe-area checks set the tokens in the page; no real device is used.
- A manual screen-reader journey is not done.

## Comments

### Changed tests

- `tools/verify-next-save.mjs`: the main button selector takes the button inside the saved card; the game with powers starts from the New game panel; the Continue line check reads the saved card (level, game type and turn, state); the kept case reads "Play the computer" and the note line. Each save and write assertion stays.

## Repair

The repair checks each fault in the two lane reviews before it changes code.
The board-code failure has a visible line on Play. The main action can try the load again.
A failed font does not show a boot fault. A retained board reports an art fault after Rematch.
The small menu and Guide faults have browser tests in tools/verify-next-menus.mjs.
The registry names this check next-menus. It uses the full size matrix by default.
The earlier sides script uses the New game panel and the saved-game card. Its game assertions stay.
The design project report records the final counts, red proofs, merge notes and limits.
