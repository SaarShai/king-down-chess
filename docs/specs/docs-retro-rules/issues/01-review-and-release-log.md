# Review findings and the release log

Status: needs-info

## Plan

- Add the owner-rule check and file-resolution check to the delegation guide.
- Name the release log and its location in the hosting guide.
- Fix both PR #186 review findings. Split the log name from its directory. Link the private review note to the shared rule.
- Add tests for both findings. Run them before and after the fixes. Keep the private-note test outside the commit.
- Check the A8 owner pick and the existing release entry. Run `npm test` and `npm run test:docs` with the shared test lock. Review the diff.

## Acceptance

- A repair brief cites the approved requirement for input, timing and layout findings.
- A writer gets the absolute path and prior entry for an existing file outside the worktree. A missing file or entry stops the work.
- The hosting guide names the existing release log and says it is outside the app repository.
- Both new tests fail before the fixes and pass after them. The affected tests and doc checks pass with the shared lock.

## Evidence and blockers

- The A8 owner pick requires a tap to finish the animation without a second action. The release log exists and has the release 3 entry.
- PR #186 review finding 1: the full release-log path fails the secret-text check. The guide now gives `LOG.md` and its directory as separate text. The existing check stays in place.
- PR #186 review finding 2: the private review note lacks the shared rule. Its existing instruction now points to `docs/DELEGATION.md#review-before-accepting` in the app repository.
- New tests check both findings. Before the fixes, both new tests and the existing hosting check fail: 3 fail, 53 pass. After the fixes, all 56 selected tests pass. Both type checks and all 67 artwork tests also pass.
- Selected cases: `KINGDOWN_TEST_FILE='tools/{steering,private-review-note}.docs.test.ts' npm test`. The command holds the shared test lock. The private-note test is saved outside the app repository after this check. Copy it back to `tools/private-review-note.docs.test.ts` to run it again. The release-log test stays in `tools/steering.docs.test.ts`.
- Doc checks: `bash tools/test-lock.sh npm run test:docs` passes all 184 checks in 16 files.
- Evidence files: `fix2-186-red.log`, `fix2-186-affected.log`, `fix2-186-docs.log`, and `fix2-186-private-note.docs.test.ts`, beside the review report. The full suite and browser checks do not run.
- The unchanged commit and push hooks call `tools/gate/secret.mjs`. It reads the main checkout's secret files and the TypeSafe key. This conflicts with the task's instruction not to read credential files. A question asks for permission for those internal hook reads. No answer is present. Commit and push remain blocked. The hooks stay unchanged, and no gate input is set.
