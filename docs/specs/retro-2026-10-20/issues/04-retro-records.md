# Remove unused records from the checkout

Status: done
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

All five parts are complete. The checks below pass.

### Part 1: simulation records

Move 14 fixtures (10,384 bytes) to `src/sim/fixtures/tournaments/`. The test checks their names and all recorded schedule hashes. Remove 1,653 other files (113,732,470 bytes). Ignore `/sim/out/`, including local previews. Keep `sim/nnue/net.json` and `sim/specs/` unchanged.

The card import record is `docs/specs/card-results/issues/01-storage.md`. It records the hash check of all 15,379 source files and zero mismatches. This work does not copy or remove any card or spool data.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- sim/out/`.

### Part 2: clay

Remove `parked/clay/` (260 files, 45,804,496 bytes) and `docs/graphics-prototype/` (273 files, 79,376,051 bytes). Remove `tools/parked.test.ts` (3,056 bytes), including its full site build. Remove both clay entries from the size allowlist and its test. Remove `three`, `@types/three`, `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` and `meshoptimizer`. Use `npm install` in this worktree to update the lockfile.

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

### Part 4: release copy and hash records

Remove `docs/releases/v0.7.0/` (143 files, 4,394,284 bytes), `tools/hash-baseline.mjs` (3,334 bytes) and `docs/takeover/baseline.json` (267,743 bytes). Point `.gitignore` and `docs/takeover/BASELINE.md` at `d6021674` for the release copy. The baseline page also names the historical manifest and tool. Remove the deleted manifest from the transcript lint exceptions and its fixture list.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- docs/releases/v0.7.0/`.

Restore: `git checkout 1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5 -- tools/hash-baseline.mjs docs/takeover/baseline.json`.

### Part 5: links and checks

Change 13 links in three history pages to full base-commit URLs. This includes the clay restore README, the rejected Archer render and the graphics study images and sources. Point the other current clay notes at Git history. Link the painted-art README and the earlier park-clay spec to this record.

Add an ignore-rule test for output at the root and in child folders. It also checks that source, specs, fixtures and the net stay visible to Git. Add a link test for the clay and Archer history pages and this record. The existing size-allowlist test checks the reduced list. Update the settings test for the broader ignore rule. Update the prune test because Git now reports the whole ignored `sim/out` folder. The prune guard still keeps that worktree.

Keep the balance ledger and its report unchanged. The report has 48 existing links to five untracked reports. Those paths are absent at the base commit. This removal does not delete those reports or change their evidence.

Preserve check: all 14 fixture blobs match the base. All files under `public/`, `sim/specs/`, both retained clay history folders and the balance ledger match the base. The shipped net and all retained painted-art files also match. Only the painted-art README and Ogre source pointer change.

### Verification

- Local `npx tsc --noEmit`: pass.
- Commit hooks: type check and staged gate pass for all five parts.
- `git diff --check`: pass.
- Full M1 unit suite at `9d41ec25`: pass. The type check passes. 3,120 tests pass; 164 skip. All 47 art tests pass. Log: `unit-full-4.txt` in the lane output folder. The M1 has no test database.
- `npm run build` and `npm run plugin:build`: pass with the six packages absent. Logs: `build-site-1.txt` and `build-plugin-1.txt`.
- Final lint checks at `2d5b35aa`: all 60 tests pass. Log: `unit-final-lints-1.txt`.
- M1 `plugin-ui` at `2d5b35aa`: pass in 218.2 seconds. The check runner exits 0. Log: `checks-final-2.txt`.

### Choices

Use `src/sim/fixtures/tournaments/` for the 14 fixtures. Use full commit URLs for removed file links and `git show` for the Ogre prompt source. Use existing Git history for restore. Add no archive tool or package.

## Removal totals

| Group | Files removed | Bytes removed |
|---|---:|---:|
| Simulation output | 1,653 | 113,732,470 |
| Parked clay | 260 | 45,804,496 |
| Graphics study | 273 | 79,376,051 |
| Clay test | 1 | 3,056 |
| Rejected Archer render | 15 | 5,974,524 |
| Rejected Archer rig | 12 | 2,550,358 |
| Release copy | 143 | 4,394,284 |
| Hash tool and manifest | 2 | 271,077 |
| Total | 2,359 | 252,106,316 |

Move 14 fixtures and keep all 10,384 bytes. Exclude them from the removal totals. The 267 retained package-lock entries match the base. The lockfile drops 23 unused entries. Production files under `src/` match the base.

The first M1 runs have disk-space and temporary-storage faults. The final full run uses the required helper and normal disk storage. It passes after the disk has free space and both stale ignore-rule test expectations are fixed. Cleanup removes the temporary RAM disk and its exclude rule. Test and check time limits stay unchanged.

The full-suite source and `2d5b35aa` differ only in the deleted manifest lint exception and this record. The 60 final lint tests check that change. The final commit updates this record only.

## Checkout size

The table measures tracked files. It excludes Git history and installed packages. The file-byte totals also apply to a fresh checkout.

| Measure | Before | After |
|---|---:|---:|
| Tracked files | 5,295 | 2,937 |
| File bytes | 532,458,454 | 280,353,726 |
| Disk blocks, KiB | 531,628 | 280,008 |

The requested `git ls-files -z | xargs -0 du -ck | tail -1` command gives 280,008 KiB after the change. The table uses the full tracked-file block sum for both states.

Unbuilt parts: none.

## Review fixes

Status: in progress.

1. Check each finding against the code and Git tree.
2. Let the dashboard use an empty file list when the local spool is absent. Keep card checks and other file errors. Test a fresh checkout and the error paths.
3. Fix the storage claim in `docs/COMPUTE.md`. Add history pointers to `docs/STATUS.md`. Test the claims and the history paths.
4. Commit the fixes. Run the full unit suite with `m1-unit.sh` and `plugin-ui` with `check-runner.sh`. Record the results and commit the record.

Pass criteria: each finding has a fix and a test; the full unit suite, art tests and browser check pass; `git diff --check` passes.

### Findings

- Review A, finding 1: confirmed. `readdirSync` has no guard, and Git tracks no `sim/out` file. The dashboard now treats `ENOENT` for the local `sim/out` spool as empty. `tools/dashboard.test.ts` checks absent and empty spools, a missing configured card, a missing explicit root and a spool that is a file.
- Review B, finding 1: confirmed. The storage guide still says that tracked output remains. The guide now names Git history, the restore record and the fixture folder. The earlier card-results spec has a removal note. `tools/steering.docs.test.ts` checks the guide against the tracked output list and the fixture folder.
- Review B, finding 2: confirmed. Both paths are absent. The status page now names `d6021674:docs/releases/v0.7.0/` and `1476f55c:docs/takeover/baseline.json`. The test checks both history objects and the absence of both checkout paths.

No finding is refuted. No server code changes. The required browser check is `plugin-ui`.

The first full suite at `9eb05221` has one failure: the document lint treats the 46-character ticket path as a secret value. All four dashboard tests pass. The lint now excludes only valid local Markdown link targets from that length check. It still checks labels, unknown paths, remote targets and known key prefixes. A new test checks each case. No test limit changes.
