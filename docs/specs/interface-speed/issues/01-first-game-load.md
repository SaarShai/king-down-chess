# Part 01: the first game loads in 5 s on slow 4G

Status: ready-for-human

Spec: [Speed](../spec.md). Blocked by: none.

## Scope and plan

### 1. The board shows on the stone base (audit fix 1, first half)

- `src/interface/play/main.ts` `start()`: the board shows when `board.ready()` resolves: the stone base and the rest stills. `applySkin()` starts at the same time and does not hold the board; the scene draws the board picture in place of the stone when the picture has decoded (`setBoardArt`).
- Edge: on a slow link the stone base can show before the board picture comes. The decision accepts this. When the picture has decoded before the first frame, that frame already has it.
- Edge: before, a board picture that failed held the board hidden and showed "loadFailed". Now the board plays on the stone base. A failure of the stone or of the stills still gives "loadFailed".
- Test: browser check `late-skin` (design project, `parallel/speed/run/tools/speed-check.mjs`): the picture is held for 10 s; the game is playable at once on the stone base; the canvas changes when the picture comes. It fails on the build before this part (no board in 60 s).

### 2. The board picture at 150 kB or less (audit fix 1, second half)

- `public/interface/stone-refined-light.webp`: the same 1024 × 1024 picture, encoded again from its own pixels with `cwebp -q 92 -m 6 -sharp_yuv` (lossless 651,674 bytes to lossy 56,176 bytes; the repair below changed quality 98 to 92). No picture is generated.
- Quality against the original at the board sizes in use (352, 640, 1024 and 1920 px): PSNR 44.0 to 46.9 dB, SSIM 0.975 to 0.987, largest pixel difference 10 to 19 of 255. A 2 × crop and a 640 px view side by side show no visible change.
- Tests (`src/render/first-frame.test.ts`): "the board picture of the new page is the same 1024 px picture, lossy, at 150 kB or less" and "the board picture is smaller than the stone base ...".

### 3. Late art after the first frame (audit fix 3)

All behind the scene option `lazySheets` (new page only) with the character runtime:

- `src/render/painted/scene.mjs` `load()`: the after-board gate (`boardReady()`) and the legacy motion sheets start in the frame after the first frame (`firstFrameLoads`), not when the load ends. The art behind `afterBoard` (fire, clouds, bells, fallen puffs, king ground layers and lying figures) waits for that gate.
- `createScene`: the wind sheet (`wind-art.mjs` `loadWindArt`) and the rift sheet (`fx-kings.mjs` `loadRiftArt`) load behind the gate. Without the option they load when the scene is made.
- `setKings`: the sheet of a king that comes into play waits for the gate.
- `src/render/PaintedView.ts` `setRules`: the Darkness art (`loadDarkGate`) waits for the gate.
- The character parts of both sides and `footprints.json` already started after the first frame (the body runtime starts there). With part 1 that frame is the frame the player sees.
- Tests (`src/render/first-frame.test.ts`): "lazySheets: before the first frame only the stone base and the rest stills load ...", "no option (the old screens): the wind and rift sheets load when the scene is made ...", "lazySheets true/false: the sheet of a king that comes into play ...", "PaintedView lazySheets true/false: the Darkness art ...". Browser check `order`: in Pieces, Powers and Cards games no late file starts before the board's first visible frame.

### 4. One mode for each figure still (audit fix 10)

- `scene.mjs`: with `lazySheets` the stills and the board picture load in the page's own mode (no CORS), as the `<img>` figures of home, Versus, the strips and the Guide do. The new page is same-origin, so the canvas stays readable. Without the option the scene keeps CORS (the plugin page draws art from another origin).
- Test (`first-frame.test.ts`): "lazySheets true/false: the stills and the board art load in mode ...". Browser check `modes`: from home to the first game, each still and the board picture load once (before: 10 stills and the picture loaded twice, in no-cors and cors mode).

### Shared module rule

- The old page and the plugin do not pass `lazySheets`: their scene asks for the same files at the same points, in CORS mode. The tests with the option off pass before and after the change.
- One change reaches them: the wind and rift sheets load in `createScene`, not at module load. The old page makes its scene in the body of `src/main.ts`; the browser record of the old page shows the wind, rift and stone requests in the same millisecond, before and after.

## Verification

- Before and after, the audit's `load.mjs` (median of 5, 390 × 844, CPU 4×, Pieces only):
  - slow 4G: playable 16,222 ms before, 4,829 ms after (budget 5,000 ms). Before playable: 88 files and 2.64 MB before, 45 files and 0.66 MB after.
  - fast 3G: playable 12,446 ms before, 8,130 ms after.
  - slow 4G, "With powers and cards": 17,614 ms in the audit, 7,419 ms after. The four card pictures (about 410 kB) are now the longest load; they are not in this part.
- The part adds 9 tests in one new file. No test is removed or newly skipped. The full suite passes 6,513 tests with 384 skips; all 114 Node checks pass; the docs check passes 187 tests with one skip. The build passes.
- The browser checks (`late-skin`, `modes`, `order`, the size matrix with Continue and Rematch, the old page) pass in Chromium and WebKit with no console error. The size matrix covers the 16 sizes of the build for tomorrow and 320 × 568.
- `late-skin`, `modes` and `order` fail on the build before this part. With the change undone, 5 of the 9 new tests fail; the other 4 are the old-page guards and pass on both.
- The stage report `parallel/speed/run/report.md` in the design project holds the logs and the screenshots.

## Repair (after two independent checks)

- Fault: in 15 runs of the audit's `load.mjs` the first game was playable at a median of 5,024 ms; 8 runs were over 5,000 ms. Cause: home loads the board picture (133 kB) for its floor strip just before Play, so it shares the link with the stone base (86 kB) and the stills. The picture is now 56 kB (quality 92). After: 15 runs, median 4,534 ms, 4,314 to 4,805 ms, none over 5,000 ms.
- Fault: on a slow link the dark stone base showed for some frames before the light picture. The picture is now smaller than the stone base and starts first, so it ends first (about 0.9 s before the stone base) and the first frame has it. After: 0 frames of stone base in 8 first visits on slow 4G. A picture that comes very late still shows the stone base first, as decision 43 says.
- `start()` in `src/interface/play/main.ts` has two source tests: the board does not wait for the picture, and the engine worker starts when the board shows.
- The type doc of `lazySheets` (`scene.d.mts`, `PaintedView.ts`) now names all the art that waits for the first frame and says that the stills and the board art must come from the page's origin.
- Tests: "the board picture is smaller than the stone base: on a shared link it arrives first, so the first frame has it" and "the new page shows its board when the stone base and the stills are ready; the board picture does not hold it". Each fails with its fix taken out.

## Known limits

- The board picture still loads on home for the floor strip (audit fix 8, another lane) and shares the link with the stone base. When fix 8 lands, the stone base and the stills get that bandwidth.
- When the board picture comes after the stone base (a lost or very slow picture), the stone base shows until it comes.
- By code reading (not run in a browser): the Guide pictures of the figures and the board now use the same mode, so a Guide visit before a game gives no second load. The old page still loads some stills in two modes (its own fault; it does not change).
