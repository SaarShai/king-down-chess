# 01 — One machine lease for local heavy commands

Status: needs-triage

The owner requests retro item 6. Tests, browser checks, and `tools/deploy.sh`
must use one per-user machine lease across separate repository copies.
A deploy holds the lease for its full command. Its child commands reuse it.
Each worktree keeps its build lock. CI keeps its current path.

## Plan and checks

1. Add a failing process test with two separate repository copies.
2. Extend the file lock in `tools/test-lock.sh`. Use it from the browser runner
   through `tools/lib/lock.mjs` and from the deploy script.
3. Check both orders: a heavy check blocks a deploy, and a deploy blocks a heavy
   check. Check child reuse, exit release, and the CI path.
4. Run the affected tests, full `npm test`, and `npm run test:docs` with the locks.
5. Commit, push, and open a PR into main if the unchanged hooks meet the read
   limits in the task.

The lease uses the existing kernel file lock. Local heavy commands run one at
a time. No new package is required. This task does not change the load gate,
the wake assertion, or the staging deploy runner.

## Evidence

The base is `f8fcec0a`. The initial branch is clean.

- Before the fix, the new test shows that a deploy reaches the remote guard
  while a test in the other copy still runs (`/private/tmp/fix-machine-lease-red.log`).
- The first affected run stops with no disk space. The worktree also lacks its
  package link. `tools/wt.sh add` links the existing packages. No package changes.
- The affected selection passes: 5 files, 191 cases, and 67 motion checks.
  It includes all 7 machine lease cases in `tools/machine-lease.test.ts`.
- Full `npm test` passes: 271 files, 5,375 cases, and 67 motion checks.
  It skips 17 files and 342 cases. `npm run test:docs` passes 16 files and 183 cases.
- One `tools/test-lock.sh` command holds both locks through all three stages.
  Logs: `/private/tmp/fix-machine-lease-{affected3,full,docs}.log`.
- A separate reviewer must check the PR before merge. No deploy or remote
  database check runs. The hooks stay unchanged.
