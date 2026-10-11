# The clay look (parked)

This folder holds the clay look of King Down: the three.js board with the sculpted clay figures, the voxel and sprite fallbacks, the graphics study, the sculpt pipeline, their checks and their assets (about 43 MB). It is not part of the game. No build, type check, test or browser check reads this folder, and a guard test (`tools/parked.test.ts`) fails if the game names it or ships one of its assets.

The owner's words (2026-10-11): "clay graphics should be extracted and parked, not included in the build of the game. so nothing that relates to it is currently relevant."

The record of the change: [docs/specs/park-clay/spec.md](../../docs/specs/park-clay/spec.md).

## The last commit where clay ran

`0dd3fc36b798b41773a2b60c7ee4a9f75c2663c8` (branch `claude/pg-design`). There, `?look=clay` or Menu → Extra → Look → Clay opened it, and `npm run check:browser playable-clay` checked it.

## What is here

Each file keeps the path it had in the repository, below `parked/clay/`:

- `src/render/`: `clay.ts` (the entry of the clay chunk), `renderer.ts` (the three.js board), `ClayFigure.ts`, `OgreMaterial.ts`, `fx.ts`, `palette.ts`, `sprites.ts`, `voxels.ts`, `styles.ts`, and `prototype/` (the graphics study and its clay materials, contours, walk and capture previews).
- `public/`: `prototype/` (the sculpts, atlases, colour guides and the Quiet Hours study code), `models/` (the voxel models), `sprites/` (the sprite sets of the 3D board).
- `tools/`: `graphics-prototype/` (the sculpt pipeline and the study checks), `verify-playable-clay.mjs` (the `playable-clay` browser check), the voxel and sprite bakers (`voxelize.py`, `trim-base.py`, `paint-voxels.py`, `sprites.sh`, `sprites-painted.py`) and the 3D style boards (`styleboard.mjs`, `styleboard2.mjs`, `tiles-proc.mjs`).

The imports between these files are still correct. The imports into the game's code (`../rules/engine`, `./legend`, `./marks`, `./tap`, `../workshop/figures` and others) are correct again only when the files are back in `src/`.

## How to bring it back

1. Move each folder back: `git mv parked/clay/src/render/* src/render/`, `git mv parked/clay/public/* public/`, `git mv parked/clay/tools/* tools/`. Then delete this folder.
2. Restore the clay branches of the shared code from commit `0dd3fc36` (`git show 0dd3fc36:<path>`, then merge with the code of today):
   - `src/main.ts`: the look read (`?look=`, then `localStorage['kingdown.look']`), the dynamic import of `./render/clay` for the clay look, and `view.applyStyle(STYLES.clay)`.
   - `src/screen/settings.ts`: `LOOK_KEY`, the Look control and Reset view; `index.html`: the Look select and the Reset view button in Menu → Extra.
   - `src/screen/play.ts`: the `look` option and the marks redraw loop for the clay camera; `src/screen/keys.ts`: the `r` key.
   - `src/render/PaintedView.ts`: `resetView()` and `applyStyle()` in `BoardView`.
   - `vite.config.ts`: the `render/clay` on-demand chunk, and the publish filter (only `prototype/models/board-*.glb` and `models/` of the assets ship).
   - `package.json`: the `graphics:study`, `graphics:check` and `graphics:check:cast` scripts; `src/entry.ts`: the `?study` branch.
   - `tools/lib/registry.mjs`: the `playable-clay` entry; the clay parts of the checks `end`, `lesson-return`, `menu-extra`, `cursor-adoption`, `special-moves`, `qa`, the probes `ux-defects/d6`, `d7`, `d8`, `tools/measure-load.mjs`, and the W5 and W13 samples.
3. Remove the guard test `tools/parked.test.ts`, then run `npm test` and `npm run check:browser`.
