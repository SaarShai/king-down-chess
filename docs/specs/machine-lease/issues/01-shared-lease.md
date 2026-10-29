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

### PR 187 second review fix

The second review finds two faults. Both come from a Node layer between
`tools/test-lock.sh` and the real command. Node (npm, npx too) closes the
lease descriptor in its children, and it can use the same number again.

- `tools/deploy.sh` runs `npm run check:browser` under the lease. The
  environment still gives fd 3, but in `check.mjs` fd 3 is a Node descriptor
  or no descriptor. Spawn then fails with EBADF, or the child gets a wrong
  descriptor. Fix: `tools/test-lock.sh` also exports
  `KINGDOWN_MACHINE_LEASE_ID` (dev:ino of the lease file).
  `machineLeaseStdio()` passes the descriptor only when `fstat` gives the
  same dev:ino. Otherwise it does not change stdio, and the ancestor that
  holds the lease keeps it. The runner cannot take the lease again, because
  the ancestor holds it and the runner would wait on itself.
- `npm test` ran `npm run test:unlocked` under the lease. Only that npm
  process held the lease. After SIGKILL to it, vitest still ran with no
  lease. Fix: the steps move to `tools/test-unlocked.sh`. Perl becomes this
  shell, and each step inherits the lease. `npm run test:unlocked` runs the
  same script.
- New tests: a browser check through `npm run` under a held lease (it
  failed with exit 1, EBADF); `npm test` with a stub vitest, where SIGKILL
  stops every process above the stub (the second copy exited 0, not 75);
  and a unit test for the dev:ino match. All failed before the fix and
  pass after it.
- `tools/deploy.sh` kept its npm steps after this round. The third review
  removes that limit (see below).
- Affected tests pass: machine lease, browser runner, test lock, test lock
  guard and deploy (5 files, 180 cases). Full `npm test` through the new
  script passes: 271 files, 5,379 cases (17 files and 342 cases skipped).
  `npm run test:docs` passes: 16 files, 183 cases.

### PR 187 third review fix

The third review finds the same fault in the deploy path, plus stale docs.

- `tools/deploy.sh` ran `npm test` and `npm run check:browser` under the
  lease. npm closed the lease descriptor, so only the deploy shell held it.
  After SIGKILL to that shell, vitest or the browser checks ran with no
  lease. Fix: the deploy runs `bash tools/test-lock.sh bash
  tools/test-unlocked.sh` and `node tools/check.mjs [name ...]`, with no
  npm layer. Each runner inherits the real lease descriptor.
- The other deploy steps (build, plugin checks, the pinned Vercel CLI
  through npx) keep npm and npx. They start no test or browser run, and
  the build and plugin steps are short. The Vercel CLI does not come from
  the local packages.
- `tools/deploy.test.ts` stubs the tested commit's `tools/test-lock.sh` and
  logs `node tools/check.mjs` through its `node` stub.
- New test in `tools/machine-lease.test.ts`: a real deploy runs its test
  step on a fresh origin/main. SIGKILL stops every process above the stub
  vitest. The second copy must exit 75 while the stub lives and 0 after it
  ends.
- `docs/COMPUTE.md` now describes the machine lease (one heavy command at
  a time on the machine; the slots apply per clone) and a direct
  `node_modules/.bin/vitest` call under the lock.
- A test checks that `tools/test-unlocked.sh` holds each package.json
  `typecheck` command, so the two cannot drift.
- Red check: with the old `tools/deploy.sh`, the new deploy test fails
  (the second copy exits 0, not 75). With a changed tsc line in
  `tools/test-unlocked.sh`, the typecheck test fails.
- Affected tests pass under the shared locks: machine lease, browser
  runner, test lock, test lock guard and deploy (5 files, 182 cases).
  The tools type check passes. `npm run test:docs` passes: 16 files,
  183 cases. This is not a full-suite pass.

### PR 187 final merge plan

1. Merge `origin/main`. Keep the parked plugin, lean build, Firefox prefs fix,
   and all other main changes. Run deploy tests and browser checks without
   an npm process under the lease. Update the deploy test call list.
2. Fix the local browser-check comments and current test recipes. Search
   `docs/` and `tools/` for other affected recipes. Keep old result records.
3. Run full `npm test`, `npm run test:docs`, `npm run build`, and
   `KINGDOWN_TEST_FILE='tools/{machine-lease,test-lock,test-lock-guard,check,deploy}.test.ts' npm test`.
   Each command must exit 0. Record the file and case counts.
4. Commit with unchanged hooks and the required tool trailers. Push
   `fin187-work` to `staging/fix-machine-lease`. Run no deploy or publish.

The merge test finds one setup fault: main now makes `tempRepo()` create
its empty home folder. The lease test also creates that folder and fails
with `EEXIST`. Remove the second creation; reuse the helper's home. The
first affected run has 171 passes and 12 failures in 5 files. All 12
failures have this same cause.

### PR 187 final merge evidence

The merge keeps main at `d5b4bad1`, including the lean build, parked plugin
404 checks, and Firefox prefs fix. The deploy header describes those gates.
The website runs `node tools/check.mjs web-online`. The legacy plugin
target keeps its protocol check and runs its browser check through Node.
The failed-gate cases and ordered call list use the direct runner names.

The self-test comment now says the second local run waits for the machine
lease. Only CI shares clone slots without that lease. The plugin guide
uses `caffeinate -disu npm run check:browser <name>`. The compute guide
uses `KINGDOWN_TEST_FILE=<file> npm test` and keeps the warning about npm
and npx under the lock. The special-move test recipe also uses `npm test`.
The search covers `docs/` and `tools/`; old result records stay as recorded.

- Affected command: `KINGDOWN_TEST_FILE='tools/{machine-lease,test-lock,test-lock-guard,check,deploy}.test.ts' npm test`.
  Exit 0: 5 files and 183 cases pass; all 67 motion checks pass.
- Full `npm test`: exit 0. 286 files and 5,571 cases pass. It skips
  17 files and 364 cases. All 67 motion checks pass.
- `npm run test:docs`: exit 0. 17 files and 187 cases pass.
- `npm run build`: exit 0. It transforms 315 modules. The build reports
  that `/character-runtime/manifest.json` stays as a runtime URL.
- `git diff --check`: pass. The Firefox check files match `origin/main`.

Logs: `/private/tmp/fin187-focused-fixed.log`, `/private/tmp/fin187-full.log`,
`/private/tmp/fin187-docs.log`, and `/private/tmp/fin187-build.log`.
No deploy, publish, or production command runs. Hooks and hook inputs stay
unchanged. This branch goes to PR 187; this task does not merge the PR.
