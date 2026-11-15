# Move the new interface into the game

Status: ready-for-human

Branch: `redesign` (from main `cfe1ac61c`). No commit, push, pull request or deploy until the owner says so.

## 1. The owner's words

2026-11-13, to "I move what is here into the game's repository": "yes, do that".

2026-11-13, on the theme: "light as the default. no need for dark style."

The design project keeps the decisions of the move (where, page entry, renderer patches, theme, board, storage keys, assets). This ticket follows them.

## 2. The plan

### Goal

The new interface (the play screen, its UI kit and its board adapter) runs in this repository on the real engine and the real renderer. It is a second root page, `/next.html`, beside the old page. The old screens stay as they are until the cutover.

### Scope

- Source: `src/interface/` with `play/`, `ui/`, `board-api.ts` and `entry.ts`. No copy of the design project's vendored engine or renderer.
- Renderer: the design project's renderer patches go into `src/render` as named options and methods. Each option is off by default.
- Two fault fixes go to all screens: the frost flicker in `src/render/effects/card.ts`, and the guard that stops a sheet that has not loaded from going into the figure cache.
- One theme (light) and one board surface (refined stone). No Theme setting, no Board surface setting, no `data-theme`.
- Storage keys of the new page: `kingdown.piece-view` and `kingdown.hand`. The new page never writes the old keys (`kingdown.save` and others).
- New asset: `public/interface/stone-refined-light.webp`. The display font is `/fonts/alegreya-sans-bold-latin.woff2`.
- Error reports from the new page use the route `/other` until the cutover.

### What does not change for the old screens

- `index.html`, `src/entry.ts`, `src/main.ts`, the routes, `public/sw.js`, the manifest and the deploy scripts.
- The old screens pass no new renderer option, so they see no change in behaviour. The two fault fixes are the only exceptions.
- The service worker lists (ALLOWLIST and PRECACHE) do not get the new page or its asset.
- The old browser checks. Each one moves in the change that replaces its old screen, not in this move.

### Stages

- Stage A ([issue 01](issues/01-stage-a-renderer-and-entry.md)): the renderer options, the two fault fixes, the pure sound helper, the page entry and a minimal page with one board.
- Stage B ([issue 02](issues/02-stage-b-interface.md)): the interface code (`play/`, `ui/`, `board-api.ts`) on top of stage A.

Not in this move: the offline install, the manifest and the service worker of the new page (at the cutover, with audit item M1); the kit page (it stays in the design project).

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed or weakened.
- Each new option or method has a test beside the existing tests of its file.
- `npm run build` writes `dist/index.html` and `dist/next.html`. `dist/` has no symbolic link. The ALLOWLIST and PRECACHE of `dist/sw.js` do not contain `next.html` or `interface/`.
- In headless Chromium, the built `/next.html` draws the board with 0 console errors and 0 failed requests, and the built `/` starts with 0 console errors.

## 3. Verification

Stage A: see [issue 01](issues/01-stage-a-renderer-and-entry.md), section "Verification".

Stage B: see [issue 02](issues/02-stage-b-interface.md), section "Verification". Known limits of the renderer options and the build: [issue 01](issues/01-stage-a-renderer-and-entry.md), section "Known limits".

## 4. Reviews

- Stage A check and stage B check (the lead's checkers, 2026-11-13): the builds pass. Their findings are decision 12 of the playable build (`runs/playable/decisions.md` in the design project): the test counts per file in the stage B report and issue 02 (`board-api.test.ts` 10, `turn.test.ts` 10), no test that `board-api` passes `holdStills` and `lazySheets`, an `any` in `board-api.test.ts`, this status line, no record of the reviews, the parked guard did not read `src/interface/ui/kit.js`, and no known limit for `net::ERR_ABORTED` frame loads. Part C1 of [Playable](../interface-playable/spec.md) fixes them.
- Status `ready-for-human`: built; it waits for the independent review and the owner's look at a rendered page.
