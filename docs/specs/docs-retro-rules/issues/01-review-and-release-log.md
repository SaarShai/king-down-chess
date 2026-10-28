# Review findings and the release log

Status: claimed

## Plan

- Add the owner-rule check and file-resolution check to the delegation guide.
- Name the release log and its location in the hosting guide.
- Check the A8 owner pick and the existing release entry. Run `npm test` and `npm run test:docs` with the shared test lock. Review the diff.

## Acceptance

- A repair brief cites the approved requirement for input, timing and layout findings.
- A writer gets the absolute path and prior entry for an existing file outside the worktree. A missing file or entry stops the work.
- The hosting guide names the existing release log and says it is outside the app repository.

## Evidence and blockers

- The A8 owner pick requires a tap to finish the animation without a second action. The release log exists and has the release 3 entry.
- The docs check reached the shared test lock but did not start. Another worktree held the lock; this attempt stopped with no test result. The full suite did not run.
- The unchanged commit hook reads the main checkout's secret files and the TypeSafe key. This conflicts with the task's instruction not to read credential files. The commit and PR remain open.
