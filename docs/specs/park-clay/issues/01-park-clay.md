# 01: Park the clay look

Status: done
Spec: [../spec.md](../spec.md)

## Steps

1. [x] Measure the build before (§6 of the spec) and take the before screenshots.
2. [x] `git mv` the clay-only files of spec §2.1 to `parked/clay/`; write `parked/clay/README.md`.
3. [x] Delete the clay branches of spec §2.2 and the dead code.
4. [x] Old data: the old-data unit test; `menu-extra` opens `?look=clay` on the painted board.
5. [x] Port the clay-only checks to the painted board; remove `playable-clay` from the registry.
6. [x] The guard test `tools/parked.test.ts`.
7. [x] Update the docs that name clay as a current feature.
8. [x] `npm test`, all browser checks, the W13 and W14 samples; measure after; the after screenshots.

## Comments

### 2026-10-11: built

Base `0dd3fc36`. Every change, with its reason:

- **Moved with `git mv`** to `parked/clay/` (the paths of spec §2.1): the three.js board and its modules, `src/render/prototype/`, `public/prototype/`, `public/models/`, `public/sprites/`, `tools/graphics-prototype/`, `tools/verify-playable-clay.mjs`, the voxel and sprite bakers and the 3D style boards. Reason: the import graph shows that only `src/render/clay.ts` and the `?study` page reach them. `parked/clay/README.md` holds the owner's words, the last commit where clay ran and the steps back.
- **`Highlights`** moved from `renderer.ts` to `src/render/marks.ts`: the painted board reads it, and only as a type. The parked `renderer.ts` now imports it from `./marks`, which is correct again when it comes back.
- **Deleted clay branches:** `src/entry.ts` (`?study`), `src/main.ts` (the look read, the clay view, `applyStyle`), `src/screen/settings.ts` (`LOOK_KEY`, Look, Reset view), `src/screen/play.ts` (`look`, the marks redraw loop and its `marksFrame`), `src/screen/keys.ts` (the `r` key), `BoardView.resetView` and `BoardView.applyStyle` (empty in the painted board), `index.html` (Look and Reset view), `vite.config.ts` (the publish filter, the clay chunk, the precache filter), `public/sw.js` (the clay comment), `package.json` (`graphics:*`). Reason: each one served only the clay look; a switch with one value is dead code.
- **Old data:** nothing reads `kingdown.look` or `?look=` any more, so both open the painted board. A stale `kingdown.look` value stays in a player's storage; it is harmless, so no code removes it. Proof: `tools/parked.test.ts` (no source reads either value; `main.ts` makes the painted board with no condition) and the `menu-extra` check (a saved clay look with `?look=clay`: painted board, no notice, no dialog, no error).
- **Checks ported to the painted board:** `qa`, `cursor-adoption` and `special-moves` ran only on clay. They now read `view.pos.board` for `view.pieces` and `view.marks` for `view.highlights`. `cursor-adoption` and `special-moves` now wait for `readyBoard` and for the end of a move or rewind animation before the next tap (on the painted board a tap during an animation skips it; the first run failed there). Removed, with a `Removed-check:` trailer each: the camera and orbit-control assertions, the clay check-ring colour, the 3D check-halo pixel count, the clay end-frame speed and fallen frame, the Look switch and Reset view zoom, the clay touch-tap with a turning camera, and the `R` key count in D-6.
- **Checks that ran both looks** now run the painted look: `end`, `lesson-return`, `ux-defects/d7`. `ux-defects/d8` opens an old `?look=` link in place of the Look control, so it also proves that old links keep the letters setting. `tools/measure-load.mjs` measures the painted look only.
- **Samples:** W5 loses `clay-check` (the same position as `archer-over-piece`). W13 loses the clay states; `clay-black` and `clay-check` become `painted-black` and `painted-check`, because the painted board had no state for a turned board or for check. `clay-depth` and its camera `tilt` go (a camera state). `docs/specs/web-ux/capture.mjs` loses its clay shot.
- **Not changed:** the `three` packages stay in `package.json` (a dependency change needs a worktree with its own installation; AGENTS.md). Follow-up: remove `three` and `@types/three` there. `workshop-cast` and the `clay-golem` figure are not the clay look; they stay.
- **Docs:** `docs/PLAYABLE-CLAY.md` (parked note), `docs/perf/README.md` (parked note), `docs/visual-design/README.md` and `docs/painted-game/README.md` (no current clay feature). AGENTS.md names no clay; TASKS.md and LESSONS.md are main-only.

### Evidence

- Build sizes before and after: spec §6.
- `npm test` through the lock: exit 0, 118 test files passed, 1 skipped; 1,913 tests passed (log `scratchpad/park-clay/test1.log`).
- `npm run check:browser` (all 24): first run 21 passed, 3 failed: `special-moves` and `cursor-adoption` (taps before the painted board settled; fixed above), `painted-game` (not changed; a 5 s wait under load). Rerun of the three: all 3 passed (`checks2.log`). The full run after the commit is below.
- Samples on a preview build: W13 28 renders, 0 faults; W14 112 renders, 0 faults.
- Screenshots, Menu → Extra (where Look was) at 1440x900 and 390x844, before and after, and the board of `?look=clay` before (clay) and after (painted): `scratchpad/build/owner4/park-clay/`. No page error in any of the eight loads.
