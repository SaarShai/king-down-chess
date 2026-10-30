# Flame capture facing

Status: ready-for-review

## Plan and checks

1. Test a crack mask made from each turn frame, then the frame pivot and silhouette, then a fade if needed.
2. Use the capture turn route and restore rest on Undo, cancel and reduced motion.
3. Run the focused tests and the three browser checks. Record both armies in three directions at 25 fps. Inspect game-size sheets for joins and stray cracks.
4. Open the requested PR and check CI.

## Result

The frames carry orange cracks. The effect makes a mask from each frame's colour and alpha. It uses the frame pivot and clips the glow to its silhouette. It also uses the current frame during Undo and quiet moves. The capture uses the same turn, hold and return path as the other kings. No art changes.

## Evidence

- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 53 cases and 68 board tests pass.
- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 53 cases and 68 board tests pass.
- `npm run check:browser king-capture-facing king-effects character-runtime`: all three pass.
- The capture check covers six Flame captures: three directions per army, rest and Undo. The scene tests cover cancel and reduced motion.
- A 25 fps recording and game-size contact sheets cover those six captures. The sheets show the cracks on the body and no visible pop at the sampled joins.
- PR 214 merged. The branch is rebased on `staging/first-game`.
