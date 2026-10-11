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
- `npm run check:browser` (all 24): first run 21 passed, 3 failed: `special-moves` and `cursor-adoption` (taps before the painted board settled; fixed above), `painted-game` (not changed; a 5 s wait under load). Rerun of the three: all 3 passed (`checks2.log`).
- Samples on a preview build: W13 28 renders, 0 faults; W14 112 renders, 0 faults.
- Screenshots, Menu → Extra (where Look was) at 1440x900 and 390x844, before and after, and the board of `?look=clay` before (clay) and after (painted): `scratchpad/build/owner4/park-clay/`. No page error in any of the eight loads.

### 2026-10-11: after the commit

- The repo gate refused the first commit: the moved sculpts `rebuilt-ogre.glb` and `rebuilt-paladin.glb` are over 2,000,000 bytes, and a rename counts as a new file. Both are now in `tools/gate/size-allowlist.txt` with a reason; `tools/gate.test.ts` lists them; the parked guard lets these two files name `parked/`, as data (they are not build inputs).
- Full run on 81a10fe7: `special-moves` failed again on its first tap. Cause: the fresh game saves itself once its board is up (`src/main.ts`, `play.save()` after the board), and the painted board starts fast enough that this save came after the check's seed. The check now waits for that first save before it seeds (12 of 12 probes correct; b2ca27ae). The same run had one `menu-extra` failure ("the overflowing body has a bottom shade"); a probe at 320x568, 390x844 and 844x390 shows Extra overflow in landscape (131 px) with its shade on in 9 of 9 loads, and menu-extra then passed 5 times in a row: a timing race in the shade read, not a fault of this change.
- Full run on b2ca27ae: 23 of 24; `game-screen` read a board label before the first frame drew it (`tools/board-ink-check.mjs` `boardText`). `boardText` now waits for the label (17725935).
- Final: `npm test` through the lock on b2ca27ae: exit 0, 118 files passed, 1 skipped; 1,913 tests passed. `npm run check:browser` on 17725935: **all 24 passed** (read-piece, verb-marks, lessons, turn, link-game, end, their-turn, game-screen, menu-extra, home, account, cursor-adoption, king-effects, lesson-return, new-game, painted-game, powers, special-moves, ux-defects, visual-design, workshop, workshop-cast, qa, selftest).
