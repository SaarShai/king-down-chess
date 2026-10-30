# Keep the Stratus king's state through Undo

Status: in progress. Branch `anim/stratus-undo-1030`.

## Review fixes: plan and checks

- Keep the landed Stratus move state until the shown position changes. Rewind it from the shown frame.
- Let an Undo pointer press reach the control. Keep skip for other presses. Keep Undo instant when motion is off.
- Test the view and scene paths, then run the Undo and Stratus browser checks. Inspect a game-size rewind frame sequence. Push to PR 211 and check CI.

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

- No check proves a smooth picture at game speed and size. The owner judges that.
- A completed-move Undo, a later settle, repeated Undo, both board orientations, reduced motion in a real game and non-Stratus regression have no browser check here.
- The patch adds no telemetry and no fixture. The alpha export and the animation promotion are out of this scope.
