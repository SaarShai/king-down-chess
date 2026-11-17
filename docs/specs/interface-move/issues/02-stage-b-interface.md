# Stage B: the interface code

Status: ready-for-human

Spec: [the move](../spec.md). Blocked by: [01](01-stage-a-renderer-and-entry.md).

## Scope and plan

1. Copy `app/src/play`, `app/src/ui` and `app/src/board-api.ts` (with its test) of the design project to `src/interface/`. Change only the vendor import paths to the real modules (`src/game.ts`, `src/rules/*`, `src/render/*`). Import `soundsFor` from `src/render/sounds.ts`.
2. `board-api.ts` passes `holdStills: true` and `lazySheets: true` to `PaintedView`, next to `liveInput` and `quiet`.
3. Light only: remove the table, dark and test themes, the Theme setting and `data-theme`. Rename the `--focus` token of `tokens.css`, or `tools/focus-contrast.test.ts` fails.
4. Remove the Board surface setting. Use `/interface/stone-refined-light.webp` for the board and the stage floor, and `/fonts/alegreya-sans-bold-latin.woff2` for the display font.
5. Storage keys: `kingdown.piece-view` and `kingdown.hand`.
6. Replace the stage A page (`src/interface/main.ts`) with the play screen. Add the new CSS files to `tools/parked-css.test.ts`.
7. Run the checks of the spec again, and open the page in a browser.

## What changed

- `src/interface/play/` (`main.ts`, `motion.ts`, `turn.ts`, `texts.ts`, `play.css` and the tests `turn.test.ts`, `texts.test.ts`, `opening.test.ts`), `src/interface/ui/` (`kit.js`, `kit.d.ts`, `tokens.css`, `components.css`, `turn-controls.ts`, `PROVENANCE.md`), `src/interface/board-api.ts` and `board-api.test.ts`. The stage A `src/interface/main.ts` is gone; `entry.ts` starts the error recorder, then imports `./play/main`.
- Imports: `../vendor/game/X` became `../../X`, `../vendor/game/rules/X` became `../../rules/X`, `../vendor/board/render/X` became `../../render/X`; in `board-api.ts` the same with one `..` less, and `./vendor/board/sounds` became `../render/sounds`. The interface reads rules only through `game.context`, `GameRules` and the `Game` object, as the app code did. No `import.meta.env.BASE_URL`: asset paths start with `/`.
- Light only. `tokens.css` keeps the light values as the `:root` values. The `table`, `dark` and `test` blocks and the palette values that only they used are gone. `--focus` is now `--focus-ring` (the same blue), because `src/style.css` owns `--focus`. No Theme setting, no `kd-theme` key, no `data-theme`.
- One light-theme colour repair: the Versus card had light text on a dark teal glow that fades into the paper page, so the text lost its contrast at the edges. It now uses the paper tokens (`--surface-muted` glow, `--text` and `--text-muted`). The other places that the dark table could affect keep their app colours: they read on the light page (the stone slab of the home stage and its dark name labels, the board marks in paper colours, the Roll call name tags, the painted cards with their dark shade, the result card).
- No Board surface setting: the board and the stage floors use `/interface/stone-refined-light.webp` only.
- Storage keys `kingdown.piece-view` and `kingdown.hand`. The app does not store the Motion setting, so there is no motion key.
- Assets: no new file. The page uses `public/ui/{cards,icons,pieces}`, `public/character-runtime` and `public/fonts/alegreya-sans-bold-latin.woff2` (the same bytes as the app files).
- `next.html`: the stage A board size rule for `#app` is gone (it narrowed the home screen on a wide, short window). The head keeps `color-scheme` "only light" and theme-color `#f3ead7`.
- Meta-tests: `tools/parked-css.test.ts` also scans the three new CSS files. `src/parked.test.ts` has a new case: `next.html` and the `.ts` files of `src/interface` hold no entry to a parked feature. `src/render/scene-load.test.ts`: the M17 test also checks a figure at rest.

## Verification

On the uncommitted tree (base `cfe1ac61c`), 2026-11-13:

- `npm test`: exit 0. Vitest 6,307 passed, 384 skipped, 0 failed (stage A: 6,282 passed, 384 skipped). `node --test` 114 of 114. The new tests: `board-api.test.ts` 10, `turn.test.ts` 10, `texts.test.ts` 1, `opening.test.ts` 3, `src/parked.test.ts` 1.
- `npm run test:docs`: exit 0, 187 passed, 1 skipped.
- `npm run build`: exit 0. `dist/next.html` exists, `dist/` has no symbolic link, and the ALLOWLIST and PRECACHE of `dist/sw.js` name no `next.html` and no `interface/` file.
- Temporary-revert proof on the final `scene.mjs` (selected cases: the blank-sheet test and the M17 test of `src/render/scene-load.test.ts`): the main `sprite()` line fails the blank-sheet test; a `sheetless()` that is always false fails the M17 test at its new at-rest assertion. With the final file both pass.
- Headless Chromium on `vite preview` of `dist/`, `/next.html` at 390×844 and 1440×900: home; a game with powers and cards (Versus, Roll call, select, move, Undo, move, End turn, the computer's reply, the always-on power, one card used, Menu, Resign, Rematch); a game with powers (the king's power armed and used, End turn, reply); a game with pieces only (no Versus, a move, the reply, Symbols and Ribbon). 0 console errors, 0 failed requests, no control under 44 px, no page scroll in a game, one board rectangle in each game (7,352,376,376 and 104,63,800,800). Menu groups: Pieces, Powers and cards, Motion speed. Stored keys: `kingdown.piece-view`, `kingdown.hand` only. The old page `/` starts with 0 console errors and 0 failed requests.

## Comments

- Visible differences from the app (light theme): no Theme and no Board surface group in Menu (at 1440×900 "Back to home" now shows with no scroll in the reading area); the Versus card in paper colours; the stage A page head (`color-scheme` "only light", theme-color, a `#f2e9d6` page colour before the CSS loads). The rest matches by eye. Screenshots and the full record are in the design project's stage B report.
- Open: the app's faults that the move carries (the design project's carry list); a browser check entry for `/next.html` in `tools/lib/registry.mjs`; an independent review; the owner's look at a rendered sample.
