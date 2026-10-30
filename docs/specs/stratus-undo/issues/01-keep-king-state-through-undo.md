# Keep the Stratus king's state through Undo

Status: done. Branch `anim/stratus-undo-1030`.

## Review fixes: plan and checks

- Keep the landed Stratus move state until the shown position changes. Rewind it from the shown frame.
- Let an Undo pointer press reach the control. Keep skip for other presses. Keep Undo instant when motion is off.
- Test the view and scene paths, then run the Undo and Stratus browser checks. Inspect a game-size rewind frame sequence. Push to PR 211 and check CI.

## Review fixes and evidence

The independent review found three faults: a landed move lost its clock, a pointer press on Undo skipped the move, and Undo animated with reduced motion. The fix retains the landed move only while its result is shown. It lets an Undo press reach the control and keeps reduced-motion and pace-off Undo instant. A different position, move, king design, board flip or new game clears the retained state.

- `KINGDOWN_TEST_FILE=src/render/PaintedView.test.ts npm test`: 28 cases pass.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 46 cases pass.
- `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`: 200 cases pass. Each command also passes the 67 board checks.
- `npm run check:browser turn stratus-idle-exit stratus-registration movement-runtime character-prepare`: the first three pass. The movement check needs its pinned package, and the preparation check waits for a cancelled request.
- `MOVEMENT_BASELINE_DIR="$PWD/public/character-runtime" npm run check:browser movement-runtime character-prepare`: both pass. The package has the required hash. The preparation check now lets the expired request cancel and still checks that a later move uses the recovered image.
- A 71-frame game-size capture shows the landed king, cloud and ground return together. The capture uses a 668-pixel board. It shows no pop in the sampled frames.
- Type checks pass in the commit hook. CI runs the full suite on the pull request.

## Task

Take the tested rewind fix from the isolated check and land it on `staging/first-game` by a pull request. Do not merge.

## Source

The check lives in `docs/specs/batch3-king-stratus-locomotion/undo-rewind-integration-check-20261030/` of the locomotion worktree. `experimental-rewind-v7.patch` (SHA-256 `4f0f4b4dfc68cc5cad49676de3afa15577c37ffc32b8a9a8d446f01cf90ecdca`) is the input. Its scene runtime SHA is `14cb0310ab1dbf30e5c632c6589aa677da575ac3e6ba0903c82683e1200ee446`; its screen controller SHA is `eea07092e2eeeef325bfc4d37d1c4d81b52c1ea605c8a68fed43966ee3b4820a`.

## Apply

The patch did not apply whole. Three files matched the base and took the patch as written: `docs/2d-first-pieces/board/scene.d.mts`, `src/render/PaintedView.ts`, `src/move-moments.ts`. `src/screen/play.ts` also applied clean, but its test file and two other files differ from the check baseline. The changes, each the smallest that keeps the fix:

- `docs/2d-first-pieces/board/scene.mjs`: this branch has the movement-start and movement-endpoint drawing. The scene hunks came in by hand:
  - the body draw reads the rewind clock, as the patch asks;
  - the prepared-exit tick stops while a rewind runs;
  - the movement-start and movement-endpoint jumps do not fire during a rewind;
  - the rewind clock ends the move, and it keeps the draw loop awake;
  - `endMove` takes `keepSource`, and its cancel path still releases the prepared body;
  - a late prepared body is released and dropped after Undo.
- `src/render/scene-load.test.ts`: the patch hunk adds a `clouds` sample list to the test board. This branch's board function has more arguments, so the list took its place in the existing declaration.
- `src/screen/play.test.ts`: the test doubles for `previously`, `game-end` and `moments` gained `cancel`, `clear` and `clearNote`.

## Checks

All commands ran in the worktree, one at a time, on AC power.

- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts KINGDOWN_TEST_LOCK_WAIT=60 npm test`: exit 0. Vitest 42 of 42 passed. The 67 existing 2D Node checks passed. The check baseline had 31 cases in that file; this branch has 42, and all pass.
- `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_LOCK_WAIT=1500 npm test`: exit 0. Vitest 200 of 200 passed, and the 67 2D Node checks passed. The first try waited 60 s and stopped with exit 75 on the machine test lease; the second try took the lease and passed.
- `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME="resets effect history"`: exit 0. One case passed and 199 skipped. This proves the new game-replacement case runs.
- `npx tsc -p tsconfig.json --noEmit`: exit 0, no output.
- `npx tsc -p tsconfig.tools.json --noEmit`: exit 0, no output.
- `npm run check:browser stratus-idle-exit`: passed in 129.4 s. The first try failed with `ENOENT` for `public/character-runtime/manifest.json`; that folder is a build artifact and is not in Git. A copy from the main checkout made the check pass.
- `npm run check:browser stratus-registration`: passed in 41.2 s.

## Open

- The full animation set and both board orientations still need visual review.
- The patch adds no telemetry or fixture. The alpha export and animation promotion are out of scope.
