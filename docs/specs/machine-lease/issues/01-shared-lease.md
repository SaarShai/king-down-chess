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

### PR 187 review fix

1. Add a process test with the real Node browser runner. Kill the inner runner
   while its child check runs. A second copy must exit 75 until the child ends.
2. Pass the machine lease file descriptor to the runner's child commands.
   Keep the kernel lock and the existing signal checks.
3. Run the new test before and after the fix. Run the affected tests and doc
   checks with the shared locks. Do not read private files or change hooks.
4. Commit without tool trailers and push to the same branch, as the owner asks.

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

### PR 187 review evidence

The review finds one fault. Node does not pass the machine lease file
descriptor to its child check. If the inner runner gets SIGKILL, the child
can continue after the lease becomes free.

- `tools/test-lock.sh` now gives the descriptor number to the Node runner.
  `tools/lib/lock.mjs` adds it to child stdio at its own number. It fills
  the gaps with `ignore`, because Node skips holes and moves a high
  descriptor to fd 3. `tools/check.mjs` uses this for each build and check.
  The kernel keeps the lease until the child ends.
- The new test uses the real browser runner and sends SIGKILL to it. Without
  the fix, the second copy exits 0 instead of 75. With the fix, it exits 75
  while the child runs and 0 after the child ends. A unit test checks the
  stdio gaps.
- The affected tests pass: machine lease, browser runner, test lock and test
  lock guard (4 files, 22 cases). Both type checks pass. This is not a
  full-suite pass.
- `npm run test:docs` passes: 16 files, 183 cases. All runs use the shared
  machine lease and clone test lock.
