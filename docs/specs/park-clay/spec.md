# Park the clay look

Status: ready-for-agent. The owner asked for this on 2026-10-11. The pick in §4 is made by delegation (owner, 2026-10-09: decide by UI/UX and engineering best practice), not by the owner's own yes; he can overrule it.

## 1. The owner's words

2026-10-11: "clay graphics should be extracted and parked, not included in the build of the game. so nothing that relates to it is currently relevant."

Limits: no change to any game rule. The painted board looks and works exactly as before.

## 2. The map

Found by grep (`clay`, `look`, `prototype`, `resetView`, `three`, the public asset paths) and by the import graph of `src/`, `tools/`, `sim/`, `campaign/` and `docs/specs/` (a type-only import is not an edge, because it does not ship). Base: commit `0dd3fc36` (branch `claude/pg-design`, tickets 16 and 17 in it).

### 2.1 Used only by the clay look (it moves to `parked/clay/`)

The three.js board (`BoardRenderer`) is made only by `src/render/clay.ts`, and `src/render/clay.ts` is loaded only when the look is `clay` (`src/main.ts:69`). The graphics study (`src/render/prototype/study.ts`) is loaded only by `?study` on the dev server (`src/entry.ts:3`). Everything that only these two reach is clay-only:

- Source: `src/render/clay.ts`, `renderer.ts`, `ClayFigure.ts`, `OgreMaterial.ts`, `fx.ts`, `palette.ts`, `sprites.ts`, `voxels.ts`, `styles.ts` (after §3 step 2), and `src/render/prototype/` (`CapturePreview.ts`, `CastCatalog.ts`, `ClayLook.ts`, `PieceContourPass.ts`, `WalkPreview.ts`, `study.ts`, `study.css`).
- Public assets, about 43 MB: `public/prototype/` (the sculpts, atlases, colour guides, the Quiet Hours study code; 40 MB), `public/models/` (the voxel models, 0.8 MB), `public/sprites/` (the 3D board's sprite sets, 2.8 MB). The build published `prototype/models/board-*.glb` and `models/` (12 MB of `dist/`).
- Tools: `tools/graphics-prototype/` (the sculpt pipeline and its study checks), `tools/verify-playable-clay.mjs` (the `playable-clay` browser check), the voxel and sprite bakers `tools/voxelize.py`, `tools/trim-base.py`, `tools/paint-voxels.py`, `tools/sprites.sh`, `tools/sprites-painted.py`, and the 3D style boards `tools/styleboard.mjs`, `tools/styleboard2.mjs`, `tools/tiles-proc.mjs`.
- Scripts in `package.json`: `graphics:study`, `graphics:check`, `graphics:check:cast`.

### 2.2 Clay branches in shared code (they are deleted; the shared code stays)

- `index.html`: the Look select and the Reset view button in Menu → Extra.
- `src/main.ts`: the `?look=` and saved-look read, the clay view branch, `view.applyStyle(STYLES.clay)`.
- `src/screen/settings.ts`: `LOOK_KEY`, the Look control, Reset view. `src/screen/play.ts`: the `look` option and the clay redraw loop of the marks. `src/screen/keys.ts`: the `r` key (Reset view).
- `src/render/PaintedView.ts`: `BoardView.resetView` and `BoardView.applyStyle` (both empty in the painted board). The `Highlights` type moves from `renderer.ts` to `marks.ts`, beside `drawMarks`, which reads it.
- `vite.config.ts`: the publish filter for `prototype/` and `sprites/`, the `render/clay` on-demand chunk, the `prototype|models` precache filter. `public/sw.js`: the comment on the clay cache.
- Checks that also ran the clay look: `qa`, `cursor-adoption` and `special-moves` ran only on clay (they read `view.pieces`, the camera and the tweens); `end`, `lesson-return`, `menu-extra` and the probes `ux-defects/d6`, `d7`, `d8` ran it beside the painted board. `tools/measure-load.mjs` measured both looks.
- Samples: W5 `clay-check`; W13 `clay-queen`, `clay-archer`, `clay-power`, `clay-power-take`, `clay-depth`, `clay-black`, `clay-check`.

### 2.3 Shared with the painted board (it stays as it is)

`src/render/PaintedView.ts`, `marks.ts`, `legend.ts` (the clay board also used it), `board-ink.ts`, `tap.ts`, `sfx.ts`, `src/read.ts`, `src/workshop/figures.ts` (`figureUrl`, `selectedFigure`), `docs/2d-first-pieces/` (the painted scene), `public/ui/`, `public/icons/`, `public/fonts/`.

Not clay, although the name says so: the `clay-golem` Workshop figure, and the `workshop-cast` check (the Workshop figure picker; it never opens the clay look). Both stay.

### 2.4 Left as it is, with the reason

- The `three` and `@types/three` packages: after this change only `parked/` imports them. AGENTS.md allows a dependency change only in a worktree with its own installation, and this worktree links the shared `node_modules`. Removing them is a follow-up in a worktree with its own installation.
- Docs that only tell clay history stay in `docs/` (they do not ship): `docs/graphics-prototype/`, `docs/playable-clay/`, `docs/special-moves/clay/`, research reports, closed specs, `docs/takeover/baseline.json` (a hash record). `docs/PLAYABLE-CLAY.md` gets a parked note at the top.
- `TASKS.md` and `LESSONS.md` change only on main.

## 3. The plan

1. `git mv` each file of §2.1 to `parked/clay/<the same path>`. Write `parked/clay/README.md`: what it is, the owner's words, the last commit where clay ran (`0dd3fc36b798b41773a2b60c7ee4a9f75c2663c8`), the steps to bring it back.
2. Delete the clay branches of §2.2. Delete what becomes dead: no look switch stays with one value.
3. Old data: a saved look (`localStorage['kingdown.look']`) or a link with `?look=clay` opens the painted board, with no error and no notice. Nothing reads either value any more. A unit test proves that no source reads them and that `main.ts` makes the painted board with no condition; the `menu-extra` browser check opens `?look=clay` with a saved clay look and asserts the painted board with no error.
4. Port the checks that ran only on clay to the painted board (`view.pos.board` for `view.pieces`, `view.marks` for `view.highlights`); drop the assertions about the camera, the orbit controls and the clay rings, each with a `Removed-check:` trailer. Remove `playable-clay` from the registry (it moves to `parked/`).
5. A guard test (`tools/parked.test.ts`): no tracked file under `src/` or `tools/` (but the guard itself), `vite.config.ts` or `index.html` names a path under `parked/`; and a production build (`vite build` into a temporary folder) holds no file and no text that names a parked public asset.
6. Docs that name clay as a current feature are changed: `docs/PLAYABLE-CLAY.md` (parked note), `docs/perf/README.md`, `docs/visual-design/README.md` where it says the game has a clay look.

`parked/` is outside every build input: `tsconfig.json` includes only `src`, vitest collects only `src/`, `tools/` and `.claude/hooks/`, vite serves `public/` and the module graph from `index.html`, and the check registry names no parked script.

## 4. The pick (delegated) and its reasons

Pick: move the clay-only source, tools, checks and assets with `git mv` into the top-level folder `parked/clay/`, with their relative paths kept.

- One folder holds the whole look, so a reader sees at once what is parked and nothing in it can reach the build by accident. The guard test makes that a fact, not a hope.
- Kept relative paths make the return a reverse `git mv` of one folder; the imports between the parked files stay valid.
- `git mv` keeps the history of each file (`git log --follow`).
- Other options: delete the files and rely on git history (smallest tree, but the owner said "parked", and a return then needs a search through history); keep the files in place behind a build flag (the clay code stays in every type check and every lint, and the switch stays in the code, which the owner's "not included in the build" rules out).

## 5. Verification

- `npm test` through the lock passes, with the guard test and the old-data test.
- `npm run check:browser` (all) passes; W13 and W14 samples give 0 faults.
- `npm run build`: the size before and after (§6).
- Screenshots of Menu → Extra at 1440x900 and 390x844, before and after, and the board of `?look=clay` after: the painted board.

## 6. Measurements

`npm run build` on this Mac, 2026-10-11. Before: commit `0dd3fc36`. After: this change. Bytes are file sizes on disk.

| | Before | After | Change |
|---|---|---|---|
| `dist/`, all files | 20,841,454 B (213 files) | 8,709,120 B (182 files) | −12,132,334 B (−58 %) |
| Main JS chunk (`assets/main-*.js`) | 361,471 B | 360,649 B | −822 B |
| JS that a first visit loads before the board (the entry, `main` and their static imports) | 520,293 B (8 files) | 515,951 B (6 files) | −4,342 B |
| All JS in `dist/assets/` | 1,844,170 B | 1,068,253 B | −775,917 B (the 771,519 B clay chunk is gone) |
| Service worker precache list | 182 entries | 180 entries | −2 |
| Plugin page (`board.html`, `tools/plugin-ui-build.mjs`) | 4,312,074 B | 4,312,047 B | −27 B (the empty `resetView()` and `applyStyle()`) |

The `legend` chunk (66,790 B) is now part of the `guide` chunk; both loaded before the board already, so the first visit loads the same code in fewer files. The published `prototype/models/board-*.glb` sculpts and `models/*.json` (about 12 MB) are gone from `dist/`.

## 7. Reviews

Two independent reviews of `0dd3fc36..f45ef300` (A: is the parking complete; B: regressions for players). Each finding was read against the code.

- **A1 (should-fix), the return steps omit the size allowlist.** Confirmed: `tools/gate/size-allowlist.txt` and the exact list in `tools/gate.test.ts` name the two sculpts at `parked/clay/public/...`; after the reverse `git mv` the gate test fails and the size gate refuses the files. Fix: `parked/clay/README.md` step 2 names both files and the path change.
- **A2 and B2 (should-fix), dropped assertions have no `Removed-check:` trailer.** Confirmed: no commit of the range has a trailer, and the ticket said each removal had one. The commit-msg hook did not catch it (it counts removed `assert` lines in registered checks; most lines moved to `parked/` or call `check(...)`). Fix: the review commit carries one trailer for each dropped assertion; the ticket line now says so. History stays as it is.
- **B1 (medium), the Ceremony's half-speed replay had no check.** Confirmed: the dropped clay check `view.tweens.rate === 0.5` was the only check of `src/ceremony.ts` (`animateMove(..., 0.5)`) and `PaintedView.animateMove` (`speed: 1 / speed`). Fix: `tools/verify-end.mjs` records the speed of the last scene move before the end words and checks that it is 2 (the scene's duration factor for half speed). The fallen-frame half was already checked on the painted board (`view.fallen.sq === 63`).
- **B2, the drawn check ring.** Confirmed as a gap, not fixed: the ring is now checked as data (`view.marks.check`), not as pixels. A pixel probe is more than the smallest change; the W5 samples show the ring.
- **A3 and B3 (nit), d8 still says "the look changes to clay".** Confirmed, not fixed: the fix costs three lines, and the check is correct (an old `?look=` link keeps the letters).
- **A4 (nit), the one-value look block in `tools/measure-load.mjs`.** Refuted as a defect: it keeps the `docs/perf` result shape, and its comment says so.
- **A5 (nit), `docs/special-moves/README.md` names `verify-playable-clay.mjs`.** Confirmed. Fix: one parked note at the top, as in `docs/perf/README.md`. The perf README's `graphics:study` line is under its parked note already.
- **A6 (nit), the guard grep sees only `parked/`.** Confirmed. Fix: the grep also matches a quoted `'parked'` or `"parked"` (a `join(root, 'parked', ...)` path); no current file matches.
