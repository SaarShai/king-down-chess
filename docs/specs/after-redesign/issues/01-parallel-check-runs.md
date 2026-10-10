# 01 · Parallel check runs

Status: ready-for-agent
Blocked by: —

## Scope

- [Spec §3](../spec.md#3-part-a-parallel-check-runs). Two runs of `npm run check:browser` in two worktrees go at the same time on this Mac, each with its own output folder; N = 2 machine slots; exclusive checks; the tree guard skips `sim/out/` and takes no `index.lock`.
- Files: `tools/check.mjs`, `tools/lib/lock.mjs` and `lock.test.ts`, `tools/lib/checks.mjs` and `checks.test.ts`, `tools/lib/tree-status.mjs` and `tree-status.test.ts`, `tools/lib/registry.mjs` (the optional `exclusive` field; `selftest-hold`), `tools/check-selftest-dirty.mjs` (the `hold` mode), `docs/COMPUTE.md`, `docs/WORKSHOP.md` with `src/workshop/workshop.docs.test.ts`, and a pointer line in `docs/specs/checks-and-hooks/spec.md` and its ticket 06.

## Plan

1. [ ] Baseline on origin/main in a clean worktree: commit, Node, `npm test` time, one full `npm run check:browser` with each check's time (Comments).
2. [ ] `lock.mjs`: `lockPath(dir)` uses `--git-dir`; new `slotPaths(dir, n)`, `exclusivePath(dir)` (the old `check-browser.lock` in the common directory), `takeSlot(dir, n, options)` and `takeAllSlots(dir, n, options)`; tests first.
3. [ ] `checks.mjs`: `outRoot` becomes the parent `<tmpdir>/kingdown-check-runs`; the runner makes the run folder with `mkdtemp` and gives `PLAYABLE_OUT` under it; a hand run's default stays under the parent.
4. [ ] `check.mjs`: the worktree lock; a slot for the build; a slot or all slots for each check; `run.json`; the folder on the first and last line; one wait line for each wait; the same clean-up on every exit.
5. [ ] `tree-status.mjs`: `GIT_OPTIONAL_LOCKS=0`; paths under `sim/out/` leave the status map; tests first.
6. [ ] Registry: `exclusive: true` on `king-effects`, `painted-game`, `qa`, `plugin-oauth`, `plugin-ui-http`; `selftest-hold` (by name only, sleeps 15 s, limit 60).
7. [ ] Documents: the runner header and usage text, `docs/COMPUTE.md`, `docs/WORKSHOP.md` (the folder name) and `workshop.docs.test.ts`; a pointer in the checks-and-hooks spec and ticket 06 to this spec.

## Verification

- [ ] `npm test` and `npm run test:docs` pass; the new lock and tree-status tests add less than 5 s.
- [ ] `selftest-hold` in two worktrees at once: both pass, the times overlap, two folders, two logs (Comments: the lines and times).
- [ ] A third `selftest-hold` while two hold: one wait line, then it runs.
- [ ] `selftest-dirty` fails and names `check-selftest-dirty.scratch`; `selftest-fail` exits 1; `selftest-hang` times out and leaves no browser, preview or slot file; Ctrl-C exits 130 and frees everything.
- [ ] Two functional runs at once in two worktrees (`special-moves new-game` beside `workshop-cast lesson-return`): all pass.
- [ ] One full run alone passes; its time against the baseline is in Comments.
- [ ] `tools/deploy.sh` is unchanged and `tools/deploy.test.ts` passes. `.github/workflows/plugin-checks.yml` is unchanged.

## Risks

- A normal taker that waits while it holds a slot: a deadlock. The runner frees its slot before every wait.
- An exclusive check beside an old runner's normal check: the old runner takes only `check-browser.lock`, which the exclusive check holds, so an old run that starts later waits; an old run already in progress is not stopped. Accepted: the branches with the old runner are lab branches.
- A wrong `sim/out/` exclusion that hides a check that writes there: the exclusion is one prefix, named in the header; `selftest-dirty` still fails.

## Does not do

- No cleanup of old run folders (D6). No two runs in one worktree (D3). No N = 3 (ticket 05). No change to `tools/deploy.sh` or CI.

## Comments
