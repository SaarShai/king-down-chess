# 04 · A 60-second limit for the test files that start processes

Status: done on claude/hook-test-timeouts (merge pending)

## Scope

- vitest's default limit is 5 s a case. Under load (two `npm test` runs at once, load average above 10) the cases that drive the real git hooks, `gate.mjs`, `wt.sh`, `push-main.sh`, `deploy.sh`, the lock module and the two Claude hooks through real `git` and `node` child processes took 5.3 to 6.7 s, so the pre-push hook refused three sound pushes (owner, 2026-10-10: "give those hook tests their own timeout").
- Each of those files sets its own limit at the top, right after the vitest import: `vi.setConfig({ testTimeout: 60_000 })` with a one-line comment. The local `{ timeout: … }` options on single describes and cases in the same files go, so each file has one limit. `vite.config.ts` keeps no global value: unit tests stay at 5 s.
- Files: `tools/gate.test.ts`, `tools/wt.test.ts`, `tools/push-main.test.ts`, `tools/deploy.test.ts`, `tools/lib/lock.test.ts`, `tools/git-hooks/{commit-msg,pre-commit,pre-push,prepare-commit-msg}.test.ts`, `.claude/hooks/{session-facts,tool-gate}.test.ts`, and `src/sim/piece-activity.test.ts` (plays whole games; the one failure outside the hook tests).

## Done when

- [x] A 6 s case in a scratch file with the same top line passes under `npm test` (proof that the setting applies at collection). `npm test` passes in the worktree with no other test run on this Mac.
- [x] A review by a reader that did not write the diff; its findings fixed and recorded here.

## Comments
- **Proof and run** (2026-10-10). A scratch file with the same top line and a 6 s case passed under `npm test` (1 file, 1 case). The whole suite then passed in the worktree alone: 100 files, 1,773 cases, 92 s, exit 0.
- **Review** (read-only, inside the worktree, 2026-10-10): merge after fixes. Confirmed: vitest 5 reads `testTimeout` when it collects a case, and every call precedes the cases, so the line covers each file; no removed local limit was above 60 s (the 30 s one rises). Should-fix, fixed: `.claude/hooks/session-facts.test.ts`, `.claude/hooks/tool-gate.test.ts` and `tools/deploy.test.ts` also run scripts in child processes at 5 s, so they got the same line, and the two 20 s describes of the deploy test went. Notes: `hookTimeout` stays at 10 s, because the before-and-after hooks only clean up; five more files start processes (`tools/save-secret`, `tools/lib/changed-files`, `tools/lib/tree-status`, `tools/public-tree.docs`, `tools/steering.docs`), so one `npm test` run timed them: 78 cases in 2.37 s together, none near 5 s, no change; the per-file line beats a global value, which would weaken the 5 s check for unit tests.
