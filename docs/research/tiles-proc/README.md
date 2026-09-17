# Procedural pixel-stone tiles — before/after (completed 2026-09-16)

The three board JPEGs in `public/textures/` derive from textures.com stock photos and may not be
served as standalone files (ToS 6.3(a); `docs/research/licensing-2026-09-14.md`). The procedural
option replaces them with a seeded canvas texture that keeps the same mean luminance. This is the
missing report for that work; nothing here changes the default.

## What is compared

| | tiles | source | where |
|---|---|---|---|
| **Before** | `stone` | `white_tile_1.jpg`, `black_tile_1.jpg`, `board_texture1.jpg` (256×256, textures.com derivatives) | `public/textures/` |
| **After** | `stoneProc` | `stoneTexture()` in `src/render/renderer.ts` — deterministic 64×64 canvas, seeded per colour | code only, no asset file |

**B4 Dungeon (proc stone)** is the full preset on top of the current default:
`STYLES.dungeonProc = { ...STYLES.dungeonVoxel, label: 'B4 Dungeon (proc stone)', tiles: 'stoneProc' }`
(`src/render/styles.ts`). It is selectable now — `?style=dungeonProc`, or the Style dropdown.

## Method

`node tools/tiles-proc.mjs [base-url]` opens the game with a FEN that shows all 11 piece types,
screenshots `dungeonVoxel` and `dungeonProc`, crops the centre four squares at 3× nearest-neighbour
(`before-crop.png`, `after-crop.png`), reads the mean sRGB byte and mean linear luminance of each
albedo straight off the live textures into `means.json`, measures fps for both styles, and fails on
any console error.

## Results (re-run 2026-09-16)

| albedo | photo (linear) | procedural (linear) | Δ |
|---|---|---|---|
| light squares | 0.65318 | 0.64901 | −0.004 |
| dark squares | 0.03263 | 0.03264 | +0.00001 |
| frame | 0.21191 | 0.21162 | −0.0003 |

Visual read of the crops: the procedural stone keeps the light/dark contrast and the warm grey
frame, with coarser grain and more pronounced tile borders than the photo. No console errors in
either style.

**Performance caveat:** the fps check ran at 5.1 (photo) vs 3.8 (procedural) — while the Q6
generation campaign held all 16 cores, so both numbers are load-limited and the gap is noise. The
change substitutes one texture (same geometry, same draw calls, no new state), so no real difference
is expected; re-measure on a free machine before quoting a number. Re-run:
`node tools/tiles-proc.mjs http://localhost:5173`.

## The default-style decision (for the owner)

Not changed. `dungeonVoxel` (photo tiles) is still the default. To adopt B4 the change is one line in
`src/render/styles.ts` (make `dungeonProc` the first style, or set `DEFAULT_STYLE` in `src/main.ts`),
**plus** removing `public/textures/*.jpg` from the published file list: an unused file left in
`public/` still ships (`dist/files.json` lists every served file), and that is the licence problem,
not the style selection. `art-src/board/*.ai` and the raw exports stay untouched in the repo.

Recommendation on licence grounds alone: adopt B4 before the next public package. The visual call is
the designer's; the before/after crops are side by side in this directory.

## Status

- [x] Generator, `means.json`, before/after screenshots (`before.png`, `after.png`, `*-crop.png`).
- [x] Browser QA: both styles load, no console errors, screenshots regenerated from the current build.
- [ ] Default decision (owner) and, if adopted, removing the three JPEGs from the published package.
- [ ] Re-run the fps check with the machine free.
