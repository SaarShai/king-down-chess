# Adopt the reviewed black Rook idle

Status: ready-for-review

## Plan and checks

Select the accepted black Rook idle with explicit S facing and exact shared rest authority. Keep the white Rook idle excluded. Preserve the 465-bank runtime package before the build. Pin the 466 ready catalog selections and build with the existing exporter.

Extend the existing black Rook W capture browser case. Check the selected idle's full cycle, first and last rest pixels, S turn entry and return, actual Undo, foot pivot and world scale, and the 64 MiB decoded cache limit. Check the uniform 55/56 scale change across the connected idle and eight turns. Run focused tests where required, then the registered character runtime and state effects checks. Commit and open a PR after the checks pass. No source art or deployment changes.

## Evidence

The parent publishes one exact reviewed replacement at catalog `96297356bdd398831f705c457f18e7d32375236c3c1eaa00cec13b946f3e4f96`. Its source bank is `4425e14473e9c15b548f465df593b8273c0024f34bc843a211979f48cb9484a6`. MAIN scratch `.codex-runs/batch-adoption/rook-idle-authority/` holds the authority, source preservation, parent review, temporary publisher check, and publication report.

The S rest PNG is byte-exact at both idle ends and both adjoining ready S turn boundaries, including their returns. All use canvas `[768,768]` and pivot `[384,700]`. Canonical registration changes from 275 to 280 at half source resolution. This makes the connected component uniformly 1.785714% smaller. Shared endpoint transforms stay exact.

## Result and checks

The runtime builds with 466 banks and 5,199 assets. All 5,106 previous assets stay exact. Only the eight connected black Rook turns change their canonical registration height and reference hash. The preserved 465-bank package and MAIN package both retain manifest hash `5158c80c4c6f06e08512d3cb74b9d768fe01043eb8ac7d13feb1974e8728a3b1`. The new package manifest hash is `8b02c138afcd3418e5449aac21ab451c4e525cf59f3df83295facc14db0914ca`.

`KINGDOWN_TEST_FILE=tools/character-runtime-package.test.ts npm test` passes: one package test, type checks, and 67 board tests. This is a focused test run, not a full suite pass.

`npm run test:docs` passes 183 tests across 16 files.

`npm run check:browser -- character-runtime effects-states` passes both registered checks. Character runtime takes 72.8 seconds for 21 cases; state effects takes 16.6 seconds. The existing black Rook W capture case now checks a full live selected idle cycle (129 samples, 78 distinct poses), both exact S joins, eight connected turn transforms, the 55/56 board-scale ratio, outward and return turns, final rest, and actual UI Undo. Its peak decoded memory is 67,043,328 bytes, below 64 MiB. The selected idle plus action download is 16,098,546 bytes, below the existing 16 MiB limit. The before/Undo board screenshots show the same S rest and foot placement.

Browser evidence is in system-temp run `character-runtime-integration-2fGyyt`; MAIN scratch `rook-idle-authority/` retains the run log, end report, runtime integrity report, and handoff. MAIN keeps the 465 package until the parent checks and copies the new package. PR review and CI remain required before merge.
