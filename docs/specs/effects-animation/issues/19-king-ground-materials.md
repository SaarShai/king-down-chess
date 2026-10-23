# King ground materials

Status: preview ready; lava choice pending

The owner approved the restored Sky artwork but found its clouds too subtle. Keep that original art. Make clouds full and visible as they form and fade. Give Frost a forming ice floor with the accepted frozen state's blue depth, pale facets and white fracture lips. Show two Flame floor alternatives, with moving lava below cracks.

Plan: update the existing back layer and shared clock; add branching fissure and broken crust preview options; verify scene tests and real board behaviour, then inspect at phone and enlarged sizes. Both lava options remain preview-only until the owner chooses. No combat changes or game-rule changes.

Acceptance: all ground stays behind the figures, fades during movement, respects Effects Off/reduced motion, and loops without a jump. The clouds must have visible rounded bodies, ice must have solid facets, and lava must read below stone.

## Result and evidence

Sky has larger rounded cloud bodies and a shared gather/hold/dissolve cycle. Frost uses the accepted frozen material palette and faceted surfaces in a low crystal cluster. Both use the existing back layer and movement fade. Flame has two explicit preview-only options: irregular branching fissures and separated stone slabs over a molten bed. The game keeps its existing Flame effect until a ground option is selected.

- `KINGDOWN_TEST_FILE='src/ui/motion.test.ts' npm test`: typecheck, 12 selected helper cases and 52 scene cases pass. Log: `/tmp/king-ground-tests.log`.
- `PLAYABLE_BROWSER=chromium npm run check:browser king-effects`: passes in 107.4 seconds. Movement, Off, reduced motion, hidden tabs and real-board rendering pass. Phone Mud + Sky averages 1.51 ms per frame, p95 1.80 ms. Log: `/tmp/king-ground-browser.log`.
- Inspected desktop and phone previews. Both lava studies render behind the figures. Their visual comparison is manual; the automated board check uses the default game effects.
- Preview: `/docs/king-effects/preview.html?record#lava-fissures`. Sky and Frost are on the same page. No deployment or full-suite run.

## Preview replay controls

Each king and both lava options now have a local Replay ground animation button. It resets the visible ground clocks together and keeps that scene awake for ten seconds. The scene's normal five-second passive window could stop before a complete review cycle, so workshop replay must explicitly keep the scene awake through its longest loop. Verified Sky and both lava buttons in the live browser, including an empty start and the lava reforming. This small control change did not rerun the full browser suite.

## Material revision plan

The owner rejected all three ground treatments: clouds read as rings, lava reads flat with heavy outlines, and the ice clusters look poor. Replace separate outlined lobes with one filled billowing cloud mass. Replace crystal piles with a connected frost sheet that spreads from the feet. For lava, reveal fixed cracks along their length, open their width, shade recessed walls, and close the edges before fading. Keep both comparison buttons. Verify full formation and disappearance at board scale, plus scene and browser checks. These revisions remain awaiting visual approval.

## Revised materials and checks

Replaced the procedural cloud circles with an original transparent, painted cumulus sprite made with the built-in image tool. The full prompt and provenance are in `docs/2d-first-pieces/king-stratus/cloud-bank.md`. Three filled cloud layers gather, billow and dissolve; the Sky King painting is intact. The obsolete cloud-circle helper and its tests are removed.

Ice is now one connected translucent frost sheet with a thin blue edge, internal facets and frost veins. It spreads from the feet and thaws inward. Both lava previews use fixed branching cracks that open along their length, widen and close. The molten layer is vertically recessed beneath shaded rock faces. Heavy outline strokes and floating slab polygons are removed. Option B is now called Deep faults.

Reference recommendations: Airborn Studios' art-directed cumulus volumes (https://80.lv/articles/airborn-3d-production-of-a-stylized-ue5-animation) fit the game's painted fantasy art. Dmitrii Aksiutenko's parallax ground-crack breakdown (https://dimivfx.artstation.com/projects/DvaPw0) supplies the separate wall/floor depth principle. These are direction references, not imported assets or an assertion that this Canvas renderer uses their engines.

Typecheck, 12 selected helper cases and 51 scene cases pass (`/tmp/ground-revision-tests.log`). The final browser run with the painted sprite passes (`/tmp/ground-painted-cloud-browser.log`, run `effects-integration-k7Ihnr`). Phone Mud + Sky averages 1.45 ms/frame, p95 1.70 ms. Inspected the revised material at game size, used replay controls, and saved `painted-cloud-frost-revision.png` and `lava-recessed-revision.png` in the task visualization folder. The lava alternatives remain preview-only. No deployment or full-suite run. All three visuals await owner approval.
