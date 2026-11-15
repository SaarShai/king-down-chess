# Sides, keys and faults

Status: ready-for-human

Spec: [Sides](../spec.md).

AGENTS.md: this part changes what the player sees. It waits for the owner's yes on a rendered sample before a merge.

## Scope and plan

### Decision 10: the side choice

- `src/interface/play/sides.ts` (new, no DOM): `SideChoice`, the key `kingdown.side`, `resolveSide` (Random draws once, when a new game starts), the screen map `squareAt` and `cellOf`, `arrowStep`, the edge-label rules and the words of this stage (`sideText`).
- Home: a group "You play" with Light, Dark and Random after "Computer level". The default is Light. A new game from home stores the choice; Cancel in the New game confirm keeps the stored choice. The home figures show the side that the next game uses.
- Dark view: `board-api` forwards `flip` to `PaintedView.flip` (the renderer, its marks and its effects). The button grid is eight `role="row"` rows built with `squareAt`, so the buttons, the arrows, the edge labels (files on the bottom row, ranks on the left column), the target choice, the roll call and the Versus card follow the view.
- The computer moves first when the person plays Dark. The texts take the person's side: `stateDescriptions`, `effectLines` and `resultText` in `texts.ts`, and `firstMinute` in `learning.ts`, get a `player` argument with the default 0 (Light), so each old call gives the same words. "You move first" shows only when the person moves first.
- Rematch swaps the sides. Resign records the person's side.
- Save: `snapshot` writes `white: 'ai', black: 'human'` for Dark. `readStored` gives `resume` with `player` for each solo save on either side (`playerOf`). The Dark path to the kept copy is gone. An empty save with the computer to move resumes.
- The kept offer: `keptOffer` finds a kept copy that this page can now open and that is not the current game, and `answerOffer` records the answer for that kept state (in memory for this page load when storage refuses). Home shows "A kept game can open now. Open it?" with Open and Not now. Open asks first ("Open the kept game?", Keep my game or Open) when a game that this page can open is current. When the current game cannot open here, there is no offer. The kept copy stays.
- Edge: a save of two people (`white` and `black` both `human`) still goes to the kept path.
- Test: unit (`sides.test.ts`, `saved.test.ts`, `saved.old-page.test.ts`, `texts.test.ts`, `board-api.test.ts`), browser (`dark_new`, `rematch`, `rematch_dark`, `dark_resume`, `offer_not_now`, `offer_open`, `dark_cards`).

### Decision 11: keys and the screen reader

- Escape, Z and Enter on the main action already work on this page (no change). The arrows now follow the screen in both views (`arrowStep`).
- The grid has eight rows of eight cells (`role="grid"`, `role="row"`, `role="gridcell"`) and one tab stop.
- One live region. When the same sentence comes again (for example a second wrong tap), the region is cleared and the sentence is set again 60 ms later, so a screen reader hears it again.
- Test: browser (`keys_live`, and the grid and arrow checks of `dark_new`).

### Decision 12: faults

- Art: `onArtError` (a new scene option, off by default) reports a rest still that cannot load. The page also catches a failed board picture. The board waits (the grid is inert) and a panel on the board says "The art cannot load." and "Your game stays saved." with Try again. Try again builds the board again with the same game, its staged steps and its save.
- The computer cannot move: the panel says "The computer cannot move." and "Your game stays saved." with Try again, which starts the search again. The person cannot move for the computer. The last good save stays; a reload gives Continue.
- A save that cannot open: the kept line, as before.
- Offline at the first load: a small script at the top of `next.html` shows "You are offline. Connect to the internet, then try again." (or "The game cannot load. Try again." when the device is online) with Try again when a page file cannot load, or when `entry.ts` cannot load the page module. Try again fetches each page file again with `cache: 'reload'`, then reloads: WebKit keeps a failed module preload in its memory cache across a reload.
- The panel sits on the board, not in the reader: on a landscape phone (667×375) the reader has no height.
- Test: unit (`scene-load.test.ts`, `PaintedView.test.ts`, `board-api.test.ts`), browser (`art_fault`, `skin_fault`, `computer_fault`, `kept_line`, `boot_offline`, `boot_failed`).

### Lead's item: hash routes

- `shell.ts`: `placeOf` maps `#play`, `#guide` and `#you`; any other hash opens Play. A load, a reload and an address edit (`hashchange`) open that place; Back applies a route once.
- Test: unit (`shell.test.ts`), browser (`hash_routes`).

## Verification

- `npm test`: 6524 passed and 384 skipped (338 files); `node --test` 114 of 114. Baseline: 6504 passed and 384 skipped.
- `npm run test:docs`: 187 passed and 1 skipped. `npm run build` passes. `npm run check:browser next-save`: 1 of 1 passed.
- Browser: Chromium and WebKit, all 15 cases at 360×640, 390×844 and 1440×900, and 6 cases at the other 14 sizes of the matrix with 320×568. Firefox: all 15 cases at 390×844.
- Red proofs: the browser cases against the base build (14 of 15 fail; `kept_line` is a regression check), and the new unit tests against small changes that undo each rule (16 tests fail).
- Evidence: the stage report in the design project, `parallel/menus/run/report.md`.

## Known limits

- The 44 px squares spill past a small board at 320×568 and 667×375. The base build has the same fault; this stage does not change it.
- The home summary line does not name the side.
- The Guide and home figures are HTML images: a failed image there has no Try again.
- The kept slot keeps one copy, as before. After Open, the kept key stays.
- The first visit with no HTML is the browser's screen.
- A manual screen-reader journey is not done; the checks count the live region text in the DOM.

## Comments

### Changed tests

- `saved.test.ts`: the kept case "the player is Dark" is gone, because decision 10 makes a Dark game resume. The new block "launch decision 10: a Dark game resumes" tests that. The copy-rule tests that used a Dark save as their example of a save this page cannot open now use a save of two people; their assertions are the same.
- `tools/verify-next-save.mjs`: the same change of example (a save of two people).

## Repair

The repair checks each fault in the two lane reviews before it changes code.
The board-code failure has a visible line on Play. The main action can try the load again.
A failed font does not show a boot fault. A retained board reports an art fault after Rematch.
The small menu and Guide faults have browser tests in tools/verify-next-menus.mjs.
The registry names this check next-menus. It uses the full size matrix by default.
The earlier sides script uses the New game panel and the saved-game card. Its game assertions stay.
The design project report records the final counts, red proofs, merge notes and limits.
