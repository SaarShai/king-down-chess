# One command runs the tests that a change can break

Status: ready-for-human

Source: [retro](../retro.md), item 2. Branch `retro-env`. Not pushed. The owner decides on the pull request and on the AGENTS.md line.

## Problem

The full `npm test` takes 525 s on this Mac. `tools/**` takes 83% of the test time; `src/**` takes 85 s. Sessions ran the full suite 117 times in 12 days. Each run holds the machine lease, so other lanes wait.

## Change

- `npm run test:changed` (`node tools/ci-plan.mjs tests`). It lists the files that differ from the merge base with `origin/main` (`KINGDOWN_TEST_BASE` names another base), selects the tests, prints the counts and the slow files that it skips, and runs `npm test` with `KINGDOWN_TEST_FILE`.
- `tools/lib/test-select.mjs`: `selectTests(changed, { files, read })`. Its header states the rules. The full suite runs for: a wide file (`package.json`, the lock file, `vite.config.ts`, a `tsconfig` file, the test scripts), a deleted file that is not a test, a file outside `src/` and `tools/`, and a file that no import, name or glob connects to a test. A glob that starts with `**` connects nothing.
- `KINGDOWN_TEST_WHY=1` prints the reason for each selected slow file.
- Two tables hold what the rules cannot see. `extraImports`: the entry of the plugin page build, and the two scripts that `tools/deploy.sh` runs with the real node in the deploy test. `dataLists`: the files whose strings are data (`tools/lib/registry.mjs`, `tools/deploy.test.ts`, `tools/deploy.sh`).
- In full mode the command clears `KINGDOWN_TEST_FILE`, so a filter from the caller's shell cannot narrow the full suite.

## Checks

- `KINGDOWN_TEST_FILE=tools/lib/test-select.test.ts npm test`: 5 tests pass, one fixture tree for each rule and each way back to the full suite. The tree holds a catch-all route glob, a git hook that a test names, and a listed script with no other test.
- A real run with one changed line in `src/interface/play/main.ts`: 45 of 441 files, 1,085 tests pass, 44 s.
- History: 150 commits on main that change a test and a source file together. The selection holds 253 of the 260 changed tests. The 7 others: a test that pins a list for a file that did not change (2), an import that today's tree no longer has (1), a test that changed only itself (4).
- The selector takes about 3 s.
- An independent review found two false skips: a catch-all glob (`'**/*'`, a browser route) connected every file to 11 tests, so the full suite never ran for an unplaced file; a migration and a git hook selected tests that do not load them. The area rule and the glob rule repair both. On the real tree, `.githooks/pre-push.mjs`, a migration, a public image and `.gitignore` each give the full suite.

## Known limits

- A change in `src/rules/engine.ts` selects 314 files (about 390 s): the core reaches almost every test.
- A change in a tools script selects `tools/deploy.test.ts` in most cases (235 s).
- A test that loads a file under `src/` or `tools/` through a built path (`join(root, 'tools', name)`) has no edge to it. When another test names the same file, the selection leaves the first test out.
- The history check sees only tests and sources that changed together. A test that loads a file at run time through a path that no rule reads stays outside it. For that reason a selection is never a full pass, and CI runs the full plan.
- The history check script is not in the repository.
- This branch changes `package.json`, so on this branch the command gives the full suite.
