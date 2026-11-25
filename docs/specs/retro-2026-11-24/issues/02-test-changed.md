# One command runs the tests that a change can break

Status: ready-for-human

Source: [retro](../retro.md), item 2. Branch `retro-env`. The owner decides on the AGENTS.md line.

## Problem

The full `npm test` takes 525 s on this Mac. `tools/**` takes 83% of the test time; `src/**` takes 85 s. Sessions ran the full suite 117 times in 12 days. Each run holds the machine lease, so other lanes wait.

## Change

- `npm run test:changed` (`node tools/ci-plan.mjs tests`). It lists the files that differ from the merge base with `origin/main` (`KINGDOWN_TEST_BASE` names another base), selects the tests, prints the counts and the slow files that it skips, and runs `npm test` with `KINGDOWN_TEST_FILE`.
- `tools/lib/test-select.mjs`: `selectTests(changed, { files, read })`. Its header states the rules. The full suite runs for: a wide file (`package.json`, the lock file, `vite.config.ts`, a `tsconfig` file, the test scripts), a deleted file that is not a test, a file outside `src/` and `tools/`, and a file that no import, name or glob connects to a test. A glob that starts with `**` connects nothing. The docs plan of CI stays: a tracker file, a ticket file and a path under `ios/` get the doc lints (and `tools/ios-app.test.ts` for `ios/`), as in `tools/lib/ci-paths.mjs`. A test that lists a folder and reads its own place (`import.meta.url`, `import.meta.dirname`, `__dirname`) is selected for each file in its folder and below it.
- `KINGDOWN_TEST_WHY=1` prints the reason for each selected slow file.
- Two tables hold what the rules cannot see. `extraImports`: the entry of the plugin page build, and the two scripts that `tools/deploy.sh` runs with the real node in the deploy test. `dataLists`: the files whose strings are data (`tools/lib/registry.mjs`, `tools/deploy.test.ts`, `tools/deploy.sh`).
- The command clears `KINGDOWN_TEST_DOCS`, `KINGDOWN_TEST_SKIP`, `KINGDOWN_TEST_NAME` and `KINGDOWN_TEST_NO_TYPECHECK`, and in full mode `KINGDOWN_TEST_FILE`. A filter from the caller's shell cannot narrow the run.

## Checks

- `KINGDOWN_TEST_FILE=tools/lib/test-select.test.ts npm test`: 5 tests pass, one fixture tree for each rule and each way back to the full suite. The tree holds a catch-all route glob, a git hook that a test names, a listed script with no other test, and a test that lists its own folder.
- A real run with one changed line in `src/interface/play/main.ts`, before the merge of main: 45 of 441 files, 1,085 tests pass, 44 s. On the merged tree with the last repairs the selection is 55 of 459 files (estimate: 33 s).
- History: 150 commits on main that change a test and a source file together. With the repaired selector, 46 commits give the full suite and 104 give a selection. Of the 260 changed tests, 6 are not in a selection: a test that pins a list for a file that did not change (1), an import that today's tree no longer has (1), a test that changed only itself (4). The repairs add no miss: the 6 are among the 7 of the first audit, and the seventh commit now gives the full suite. On the merged tree, for the newest 150 such commits: 48 give the full suite, 102 give a selection, and 3 of 286 changed tests are not in a selection; the 3 are among the 6.
- The selector takes about 3 s.
- An independent review found two false skips: a catch-all glob (`'**/*'`, a browser route) connected every file to 11 tests, so the full suite never ran for an unplaced file; a migration and a git hook selected tests that do not load them. The area rule and the glob rule repair both. On the real tree, `.githooks/pre-push.mjs`, a migration, a public image and `.gitignore` each give the full suite.

## Known limits

- A change in `src/rules/engine.ts` selects 330 files (about 400 s): the core reaches almost every test.
- A change in a tools script selects `tools/deploy.test.ts` in most cases (235 s).
- A test that loads a file under `src/` or `tools/` through a built path (`join(root, 'tools', name)`) has no edge to it. When another test names the same file, the selection leaves the first test out.
- The history check sees only tests and sources that changed together. A test that loads a file at run time through a path that no rule reads stays outside it. For that reason a selection is never a full pass, and CI runs the full plan.
- The history check script is not in the repository.
- This branch changes `package.json`, so on this branch the command gives the full suite.
- The own-folder rule reads the text of the test. A test that lists its folder through a helper in another file has no such edge.
## Review

- First review: an agent that did not build the change read head `a8c0b4183`. It found two false skips in the test selector and three smaller faults. Commit `1175061f7` repairs them.
- Main then moved 161 commits. Merge `9965586b0` resolves three conflicts: `package.json`, the check list, and the header of the play scenes check. The full suite passes on the merge: 410 files, 8,031 tests.
- Second review: five agents that did not build the change read head `9965586b0`, one for each area and one for the repairs and the merge. A skeptic tried to refute each blocking finding. Four findings stand and are repaired in one batch: for this ticket, a test that lists its own folder (`src/workshop/css.test.ts`, `src/render/legend.test.ts`, `src/interface/people/controller.test.ts`) was skipped for a change in that folder, and four shell variables could narrow a run that the command called full.
- Repair check: the reviewer of the repairs and the merge read commit `e4faf165e`. The repair holds. The full suite passes on that commit: 410 files, 8,031 tests.
- Open findings: none that block. The notes are in "Known limits".

