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
