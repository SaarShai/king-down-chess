# 13: Refuse secret source overrides in Git hooks

Status: resolved

## Fault

The base gate accepts `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY`.
An empty folder and a missing key file can remove all values from the secret scan.
The same inputs supply fake sources in the tests.

## Plan

1. Move fake source setup into the test harness. Add commit and push cases.
2. Run the new cases against the current gate. Record the failure.
3. Refuse either variable at the gate entry. Keep the real source paths fixed.
4. Run affected tests, the full test suite and doc checks with the shared test lock.
5. Commit with the real hooks, push the branch and open a PR into main.

## Acceptance

- [x] A commit and a push cannot replace either source with an empty path.
- [x] A clear fault names the refused variable and gives no value.
- [x] The gate refuses the variable before it reads a source, also for an empty value.
- [x] Tests use synthetic secrets in temporary repositories only.
- [x] Affected tests, `npm test` and `npm run test:docs` pass.

## Evidence

Base: `origin/main` at `f8fcec0a4d282822fbde913813eff386f2f9c0f2`.
The worktree is clean before this task.
This change touches no database, browser code or animation bank.

Before the fix:

- Command: `KINGDOWN_TEST_FILE=tools/gate.test.ts KINGDOWN_TEST_NAME='source overrides' npm test`.
- The shared test lock serializes the run. Type checks pass.
- All 10 selected cases fail; 31 cases are not selected. Exit 1.
- Each of the six commit and push cases gets exit 0 from Git. The synthetic secret enters the temporary commit or bare remote.
- The four entry cases show that empty variables are accepted and that source reads can run first.
- Local log: `/private/tmp/fix-gate-override-red.log`.

After the fix, affected tests:

- Command: `KINGDOWN_TEST_FILE='tools/{gate,git-hooks/*}.test.ts' npm test`.
- Type checks pass. All five selected files pass: 103 cases, including all 10 new cases. The 67 Node tests also pass. Exit 0.
- The six commit and push attempts fail. The commit head and the bare remote stay unchanged. The four entry cases fail with the required fault before a source read.
- The shared test helper gives each child process a temporary home folder. A hook test checks that Node resolves that folder.
- Local log: `/private/tmp/fix-gate-override-affected.log`.
- The affected run, full suite and doc checks share one outer `bash tools/test-lock.sh` call. Each command runs in the foreground.

Full checks after the fix:

- `npm test`: type checks pass; 270 files pass and 17 skip. Cases: 5,378 pass and 342 skip. All 67 Node tests pass. Exit 0.
- `npm run test:docs`: 16 files and 183 cases pass. Exit 0.
- Local logs: `/private/tmp/fix-gate-override-full.log` and `/private/tmp/fix-gate-override-docs.log`.
- No database or browser check is needed for this change. The PR records the real commit and push hook results.

## Fix

The gate entry refuses either source variable, including an empty value.
The check runs before a source read. The scanner has no source override path.
The test harness supplies fake files at the normal paths in each temporary checkout and home folder.
The existing spec now states this rule.

## Review

Self-check: one entry check covers staged, push and history modes. The normal source lookup stays in the scanner. No test option enters the production gate. The Git hook files do not change.

Independent PR review is pending. This branch is not merged.
