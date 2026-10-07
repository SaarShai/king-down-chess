# 12: Unused names fail the type check

**What to build:** The compiler refuses unused local names, so dead code fails `npm test` and the pre-commit hook. This ticket turns on `noUnusedLocals`. It lands after this spec removed eight unused names (ticket 01) and the Workshop finish spec removed five more, so that the type check stays green.

**Blocked by:** 01, 02, workshop-finish/01 (removal of the five unused Workshop names)

**Status:** resolved

**Owns:** `tsconfig.json`

- [x] `tsconfig.json` sets `noUnusedLocals` to true; `npm run typecheck` exits 0.
- [x] Story 1: a scratch unused import (removed after) makes `npm test` exit non-zero, and a commit of it in a scratch clone with the hooks is refused by pre-commit.
- [x] `noUnusedParameters` stays off, and the `include` list does not change.

**Verify:** `npm run typecheck`; `npm test`; a scratch clone after `npm ci` with an unused import staged (`git commit` refused).

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-12`, commit fd79c4b.

- Change: `tsconfig.json` sets `"noUnusedLocals": true`. `noUnusedParameters` is not set (off). `include` stays `["src"]`.
- Before the change: `npx tsc --noEmit --noUnusedLocals` exits 0 on the tree, so the earlier removals (01, workshop-finish/01) are complete.
- Red: with a scratch `src/scratch-unused.ts` (an unused `readFileSync` import) and the old `tsconfig.json`, `npm run typecheck` exits 0.
- Green: with the new `tsconfig.json`, the same file gives `TS6133: 'readFileSync' is declared but its value is never read.`; `npm run typecheck` exits 1 and `npm test` exits 1. The scratch file is then removed.
- `npm run typecheck` exits 0. `npm test` exits 0: vitest 43 files, 800 tests passed; node --test 42 tests, 42 pass, 0 fail.
- Scratch clone of this branch, `npm ci` (sets `core.hooksPath` to `.githooks`), unused import staged: `git commit` exits 1 with the TS6133 line and `pre-commit: the type check failed.` The clone is removed.
- Note for the owner: the shared git config of this repository has no `core.hooksPath`, so commits in these worktrees do not run the tracked hooks until `npm ci` or `npm run prepare` runs in a checkout of this repository. This is outside this ticket.
