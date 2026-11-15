# Stage A: renderer options, fault fixes and the page entry

Status: ready-for-human

Spec: [the move](../spec.md).

## Scope and plan

1. Renderer options and methods, each off or neutral by default (the old screens pass none):
   - `PaintedView` options `liveInput` and `quiet`; `holdStills` and `lazySheets` pass through to the scene.
   - `PaintedView` methods `setSkin`, `setReducedMotion` (null follows the system setting), the `animating` getter, `setSelected` and `arrive`.
   - Scene (`src/render/painted/scene.mjs` and `.d.mts`): `setBoardArt(url)`, `arrive(delays, ms, rise)`, and the `createScene` options `holdStills` and `lazySheets`.
   - Runtime (`character-runtime.mjs` and `.d.mts`): `lacks(character, army)`.
   - With `lazySheets`, a figure whose legacy sheet has not loaded draws its rest still, at rest and along a move (audit M17). A moving piece is never invisible.
2. Fault fixes for all screens: the frost flicker in `effects/card.ts`, and the `naturalWidth` guard in `sprite()` that stops a blank sheet from going into the idle cache.
3. `soundsFor` moves to `src/render/sounds.ts` (no DOM). `src/screen/moments.ts` re-exports it.
4. Page entry: `next.html` (light only, no manifest, no service worker code), `src/interface/entry.ts` (the error recorder first, then a dynamic import of `./main`), and a minimal `src/interface/main.ts` with one board (start position, refined stone). `vite.config.ts` gets the two page inputs.
5. Asset: `public/interface/stone-refined-light.webp`. The build copies `public/` with no change to its filter. The offline lists do not match `interface/`.
6. Base stays `/`: the design project's BASE_URL patches stay out.

## Verification

On the uncommitted stage A tree (base `cfe1ac61c`), 2026-11-13:

- `npm test`: exit 0. Vitest 6,282 passed, 384 skipped (before: 6,263 passed, 384 skipped). `node --test` 114 of 114.
- `npm run test:docs`: exit 0.
- The 19 new tests are in `src/render/PaintedView.test.ts` (9), `src/render/scene-load.test.ts` (8), `src/render/character-runtime.test.ts` (1) and `src/render/effects/card.test.ts` (1).
- The fix tests fail on the old code: with the old `sprite()` guard, the cache test and the M17 test fail; without the `card.ts` fix, the freeze test fails.
- `npm run build`: exit 0. `dist/index.html` and `dist/next.html` exist, `dist/interface/stone-refined-light.webp` exists, `dist/` has no symbolic link, and the ALLOWLIST and PRECACHE of `dist/sw.js` have no `next.html` and no `interface/` entry.
- Headless Chromium on `vite preview` of `dist/`: `/next.html` draws the board on the refined stone with 0 console errors and 0 failed requests. `/` starts (`view.ready()` resolves) with 0 console errors.

Two test fixtures change: `tools/offline-build.test.ts` and `tools/openai-challenge.test.ts` build a fixture page with the real config. The config's page inputs now point into the repository, so each fixture build names its own input. No assertion changes.

The build injects the offline registration script of `vite.config.ts` into every page, so `dist/next.html` has it. The script runs only at the path `/`, so on `/next.html` it does nothing.

## Known limits

- A struck figure whose legacy sheet has not loaded can draw blank for the length of the strike. The `lazySheets` rest-still rule skips a figure with an effect frame (`u.fx` in `scene.mjs`).
- No sheet retry. A legacy sheet that fails to load stays unloaded for the life of the page; its figures keep their rest stills, and no report goes out.
- The second page input moves shared chunks into the old page's offline lists. Stage B build: 3 chunks (`browser`, `sfx`, `skill`); PRECACHE 265 to 268, ALLOWLIST 266 to 269 (stage A: 4 chunks, PRECACHE 265 to 269). The modules and their behaviour do not change, only the chunk boundaries.
- The service worker VERSION hashes every file of `dist/`, so it includes the new page until the cutover. A change to the new page alone gives the old page a new offline version, and its installed copies download the precache again.
- A cancelled playback (a board tap, Back to home, a new game) can end the frame loads in flight with `net::ERR_ABORTED` in the network log. This is expected: the page does not need those frames, and no error shows.
- The M17 test checks a figure at rest and a moving figure. A temporary revert of the fix on the final `scene.mjs` fails it at the figure at rest; a revert of the `sprite()` guard fails the blank-sheet test (stage B record).

## Comments
