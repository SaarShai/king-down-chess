# 01 · Parallel check runs

Status: in-progress
Blocked by: —

## Scope

- [Spec §3](../spec.md#3-part-a-parallel-check-runs). Two runs of `npm run check:browser` in two worktrees go at the same time on this Mac, each with its own output folder; N = 2 machine slots; exclusive checks; the tree guard skips `sim/out/` and takes no `index.lock`.
- Files: `tools/check.mjs`, `tools/lib/lock.mjs` and `lock.test.ts`, `tools/lib/checks.mjs` and `checks.test.ts`, `tools/lib/tree-status.mjs` and `tree-status.test.ts`, `tools/lib/registry.mjs` (the optional `exclusive` field; `selftest-hold`), `tools/check-selftest-dirty.mjs` (the `hold` mode), `docs/COMPUTE.md`, `docs/WORKSHOP.md` with `src/workshop/workshop.docs.test.ts`, and a pointer line in `docs/specs/checks-and-hooks/spec.md` and its ticket 06.

## Plan

1. [x] Baseline on origin/main in a clean worktree: commit, Node, `npm test` time, one full `npm run check:browser` with each check's time (Comments).
2. [x] `lock.mjs`: `runLockPath(dir)` (`check-run.lock`, `--git-dir`); new `slotPaths(dir, n)`, `exclusivePath(dir)` (the old `check-browser.lock` in the common directory), `takeSlot(dir, n, options)` and `takeAllSlots(dir, n, options)`; tests first.
3. [x] `checks.mjs`: `outRoot` becomes the parent `<tmpdir>/kingdown-check-runs`; the runner makes the run folder with `mkdtemp` and gives `PLAYABLE_OUT` under it; a hand run's default stays under the parent.
4. [x] `check.mjs`: the worktree lock; a slot for the build; a slot or all slots for each check; `run.json`; the folder on the first and last line; one wait line for each wait; the same clean-up on every exit.
5. [x] `tree-status.mjs`: `GIT_OPTIONAL_LOCKS=0`; paths under `sim/out/` leave the status map; tests first.
6. [x] Registry: `exclusive: true` on `king-effects`, `painted-game`, `qa`, `plugin-oauth`, `plugin-ui-http`; `selftest-hold` (by name only, sleeps 15 s, limit 60).
7. [x] Documents: the runner header and usage text, `docs/COMPUTE.md`, `docs/WORKSHOP.md` (the folder name) and `workshop.docs.test.ts`; a pointer in the checks-and-hooks spec and ticket 06 to this spec.

## Verification

- [ ] `npm test` and `npm run test:docs` pass; the new lock and tree-status tests add less than 5 s.
- [x] `selftest-hold` in two worktrees at once: both pass, the times overlap, two folders, two logs (Comments: the lines and times).
- [x] A third `selftest-hold` while two hold: one wait line, then it runs.
- [x] `selftest-dirty` fails and names `check-selftest-dirty.scratch`; `selftest-fail` exits 1; `selftest-hang` times out and leaves no browser, preview or slot file; Ctrl-C exits 130 and frees everything.
- [x] Two functional runs at once in two worktrees (`special-moves new-game` beside `workshop-cast lesson-return`): all pass.
- [ ] One full run alone passes; its time against the baseline is in Comments.
- [ ] `tools/deploy.sh` is unchanged and `tools/deploy.test.ts` passes. `.github/workflows/plugin-checks.yml` is unchanged.

## Risks

- A normal taker that waits while it holds a slot: a deadlock. The runner frees its slot before every wait.
- An exclusive check beside an old runner's normal check: the old runner takes only `check-browser.lock`, which the exclusive check holds, so an old run that starts later waits; an old run already in progress is not stopped. Accepted: the branches with the old runner are lab branches.
- A wrong `sim/out/` exclusion that hides a check that writes there: the exclusion is one prefix, named in the header; `selftest-dirty` still fails.

## Does not do

- No cleanup of old run folders (D6). No two runs in one worktree (D3). No N = 3 (ticket 05). No change to `tools/deploy.sh` or CI.

## Comments

- **Baseline** (plan item 1), origin/main deb61ce6 in a clean worktree, Node v26.0.0, 2026-10-10 05:05 UTC: `npm test` exit 0 in 93 s; one full `npm run check:browser` exit 0 in 844 s, all 25 passed. Times in seconds: read-piece 1.4, verb-marks 1.8, lessons 3.3, turn 11.5, link-game 18.7, end 18.5, their-turn 5.9, game-screen 6.9, menu-extra 12.0, home 7.8, account 54.2, cursor-adoption 22.1, king-effects 106.4, lesson-return 9.3, new-game 14.7, painted-game 112.0, playable-clay 20.1, powers 4.7, special-moves 31.4, ux-defects 72.1, visual-design 19.6, workshop 65.8, workshop-cast 8.6, qa 210.4, selftest 1.1.
- **Unit tests**, 61a37777: `lock.test.ts` 12 tests and `tree-status.test.ts` 11 tests pass in 2.1 s together with the other `tools/lib` tests.
- **Two holds at once** (two worktrees, `selftest-hold`): both exit 0; hold A 05:22:55.1 to 05:23:10.1, hold B 05:22:54.6 to 05:23:09.6 UTC; folders `check-runs-7JnNRE` and `hold-wt-2x2nrh`, each with its own log and `run.json`. No lock file stays after the runs.
- **Three holds at once** (three worktrees): the third printed one line, `check: all 2 slots are taken (pid 4742, …/hold-wt2; pid 4732, …/check-runs); waiting for a slot`, then ran; all three exit 0. A second run in the same worktree 3 s after the first printed one line, `check: another run holds this worktree's run lock (pid 4732, …); waiting for it to end`, then ran, exit 0.
- **Planned faults** in one worktree: `selftest-dirty` exit 1, `FAIL selftest-dirty 0.2 s changed in the checkout: check-selftest-dirty.scratch` (file deleted after); `selftest-fail` exit 1 with `Error: selftest-fail: the planned fault`; `selftest-hang` exit 1, `timed out at the 5 s limit`, the hang child dead, no lock file; SIGINT to the runner during `selftest-hold`: `check: SIGINT: stopping`, exit 130, the port closed, no lock file. Four Chromium processes of a 12-hour-old orphaned Playwright profile (parent pid 1, started before this session) were present before and after; none belongs to these runs.
- **Exclusive**: worktree B held a slot with `selftest-hold`; worktree A started `king-effects` (exclusive) and printed `check: another run holds a slot (pid 55299, …/hold-wt); waiting for it to end`; worktree C started `selftest` and printed `check: an exclusive check waits or runs (pid 60795, …/check-runs); waiting for a slot`. Order: B ended, A ran king-effects 107.2 s (baseline 106.4), then C ran. All exit 0; no lock file after.
- **Two functional runs at once**: `special-moves new-game` (31.2 s, 14.8 s) beside `workshop-cast lesson-return` (8.6 s, 9.1 s): all four pass; times match the baseline (31.4, 14.7, 8.6, 9.3).
