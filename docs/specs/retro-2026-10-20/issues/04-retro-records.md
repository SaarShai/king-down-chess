# Remove unused records from the checkout

Status: in-progress
Type: task

The owner approves this work in retro question Q4 on 2026-10-20.
Base commit: `1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5`.

## Plan and checks

1. Move the 14 tournament fixtures beside their test. Remove the other tracked simulation output. Ignore the output folder. Check the recorded schedule hashes.
2. Remove the parked clay files, the graphics study, six packages and the clay test. Keep the Ogre source pointer and both clay history folders. Check the site and plugin builds.
3. Remove both rejected Archer sets. Keep the research note and balance ledger. Keep all live painted art and its tests.
4. Remove the old release copy, hash tool and manifest. Keep the release commit pointer.
5. Fix links to removed files. Record counts, bytes, restore commands and check results.

Use one commit per part. Run the type check, full unit suite and art tests on the M1. Run `plugin-ui` on the M1 through the check runner. Check that links resolve. Compare all preserved files with the base commit.

## Size before the change

The base has 5,295 tracked files and 532,458,454 file bytes.
The sum of file disk blocks is 531,628 KiB. It excludes Git and installed packages.
The requested command, `git ls-files -z | xargs -0 du -ck | tail -1`, prints 3,800 KiB. On this Mac, `xargs` splits the paths into batches. That last line measures only the last batch. The full sum above measures all tracked files.

## Work

Checks are pending. No part is marked done before its checks pass.

### Part 1: simulation records

Move 14 fixtures (13,968 bytes) to `src/sim/fixtures/tournaments/`. The test checks their names and all recorded schedule hashes. Remove 1,653 other files (113,728,886 bytes). Ignore `/sim/out/`, including local previews. Keep `sim/nnue/net.json` and `sim/specs/` unchanged.

The card import record is `docs/specs/card-results/issues/01-storage.md`. It records the hash check of all 15,379 source files and zero mismatches. This work does not copy or remove any card or spool data.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- sim/out/`.

### Part 2: clay

Remove `parked/clay/` (260 files, 45,804,496 bytes) and `docs/graphics-prototype/` (273 files, 79,376,051 bytes). Remove `tools/parked.test.ts`, including its full site build. Remove both clay entries from the size allowlist and its test. Remove `three`, `@types/three`, `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` and `meshoptimizer`. Use `npm install` in this worktree to update the lockfile.

The Ogre prompt names its source with `git show` at the base commit. Keep `docs/playable-clay/` and `docs/special-moves/clay/` unchanged. The owner now approves removal of the clay records kept by the earlier park-clay spec. Clay last runs in commit `0dd3fc36b798b41773a2b60c7ee4a9f75c2663c8`. The parked README at the base commit holds the return steps.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- parked/clay/`.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- docs/graphics-prototype/`.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- tools/parked.test.ts`.

For a full clay return, also restore `package.json`, `package-lock.json`, `tools/gate/size-allowlist.txt` and `tools/gate.test.ts` from the base commit. Then use the restored README.

### Part 3: rejected Archer studies

Remove `docs/2d-first-pieces/rendered-study/` (15 files, 5,974,524 bytes). Remove the rejected SVG rig (12 files, 2,550,358 bytes), including `rig-motion.test.mjs`. Keep the research note, ledger entries and all live art. The art test glob now excludes the removed rig test because that file is absent.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- docs/2d-first-pieces/rendered-study/`.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- docs/2d-first-pieces/RIG.md docs/2d-first-pieces/archer-arms.png docs/2d-first-pieces/archer-parts.png docs/2d-first-pieces/arm-correction-prompt.json docs/2d-first-pieces/arm-parts.json docs/2d-first-pieces/rig-motion.mjs docs/2d-first-pieces/rig-motion.test.mjs docs/2d-first-pieces/rig-parts.json docs/2d-first-pieces/rig-prompt.json docs/2d-first-pieces/rig-tests.log docs/2d-first-pieces/rig.html docs/2d-first-pieces/rig.js`.

The render sources use the [MakeHuman asset licence](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.ASSETS.md). The source licence also stays in Git at `1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5:docs/2d-first-pieces/rendered-study/source/LICENSE.ASSETS.md`.
