# 01: `npm test` runs the type check first

**What to build:** `npm test` runs the type check, then vitest, then the node tests, and stops at the first failure. A type error now fails `npm test` before any test starts. A `typecheck` script runs the compiler alone. A `test:docs` script runs only the doc-lint files (names end in `.docs.test.ts`); `npm test` runs them too. Vitest collects tests from the source, tools and Claude hook folders, so the hook and runner tests of later tickets run in `npm test`. This ticket removes the eight unused names `rootTurn`, `kingLabel`, `KingChoice`, `Q`, `ALL_CARDS`, `Color`, `readFileSync` and `Rules` outside the Workshop; it does not turn on `noUnusedLocals` (ticket 12 does). It adds two dev dependencies: `sharp` at exactly 0.35.4, which the Workshop art script imports, and `happy-dom`, but only when a probe shows that `Element.animate` and `document.getAnimations` work in it. This ticket adds dependencies: the builder replaces the linked `node_modules` with a real installation first and never runs `npm ci` through a link.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Owns:** `package.json` (scripts `typecheck`, `test`, `test:docs`; devDependencies), `package-lock.json`, `vite.config.ts` (the `test` block only), `tools/happy-dom-probe.test.ts` (kept only when the probe passes), the source files outside `src/workshop/` that hold the eight unused names (among them `src/main.ts` and `src/ai/search.ts`). Shared files: dev-environment/05 edits the `server` and `preview` parts of `vite.config.ts`, and workshop-finish/07 adds the `happy-dom` line to `package.json` and `package-lock.json` only if this ticket removed it; both block on this ticket

- [x] `npm run typecheck` runs `tsc --noEmit` and exits 0 on this branch.
- [x] `npm test` runs `typecheck`, then `vitest run`, then the node tests of `docs/2d-first-pieces`, and stops at the first failure.
- [x] With one type error added by hand (and then removed), `npm test` exits non-zero and vitest does not start.
- [x] `npm run test:docs` runs only files whose names end in `.docs.test.ts`, and exits 0 when none exist.
- [x] Vitest's include list names the source folder, the tools folder and the Claude hook folder. A scratch `*.test.ts` file in the tools folder and one in the Claude hook folder (both removed after) show in the run.
- [x] Vitest does not collect the node-test files of `docs/2d-first-pieces`.
- [x] `npx tsc --noEmit --noUnusedLocals` reports none of the eight names; it reports only names under `src/workshop/`.
- [x] `sharp` is a dev dependency at exactly 0.35.4, and the lock file holds it at the top level.
- [x] The happy-dom probe test, under the happy-dom environment, asserts that `Element.prototype.animate` and `document.getAnimations` exist and that an animation's `finished` promise settles. When it passes, `happy-dom` stays as a dev dependency with the probe test. When it fails, both go, and the result goes under `## Comments` in this file, so the Workshop finish spec uses the browser check for motion.
- [x] The Kaggle sparse checkout (package files, `tsconfig.json`, `src/`, `sim/probes/`) still runs `npm ci` with no error: run it in a scratch sparse clone.

**Verify:** `npm run typecheck`; `npm test`; `npm run test:docs`; `npx tsc --noEmit --noUnusedLocals`; a scratch sparse clone with the Kaggle paths, then `npm ci --no-audit --no-fund`.

## Comments

Build 2026-10-07, branch `build/checks-and-hooks-01`. The spec and the code agree; no change to the spec.

- `npm run typecheck` (`tsc --noEmit`): exit 0.
- `npm test`: `npm run typecheck && vitest run && node --test "docs/2d-first-pieces/**/*.test.mjs"`. Result: 38 vitest files, 673 tests pass; 42 node tests pass; exit 0. One earlier run failed only on the judge test "never lowers W ..." (5 s time-out under load; workshop-finish gives it 30 s). The next run passed.
- Type error by hand (`export const zzTypeError: number = 'not a number';` in `src/sim/replay.ts`, then removed): before this change `npm test` exited 0 (673 tests pass). After it, `npm test` exits 1 with TS2322, and vitest does not start.
- `npm run test:docs` (`vitest run --passWithNoTests .docs.test.ts`): with no doc-lint files it says "No test files found, exiting with code 0". With a scratch `tools/zz-scratch.docs.test.ts` it runs 1 file only. Scratch removed.
- Vitest include: `src/**/*.test.ts`, `tools/**/*.test.ts`, `.claude/hooks/**/*.test.ts`. `npx vitest list` showed a scratch test in `tools/` and one in `.claude/hooks/` (both removed). It lists no file of `docs/2d-first-pieces` (those are `*.test.mjs`).
- `npx tsc --noEmit --noUnusedLocals`: 5 names, all under `src/workshop/` (`presetWorths`, `LEARN_LINE`, `MARK_WORDS`, `squareList`, `pats`). The eight names are gone.
- `sharp`: `"sharp": "0.35.4"` in devDependencies; the lock file has it at the top level (`node_modules/sharp`, 0.35.4).
- happy-dom probe: **fail**. happy-dom 20.14.5 under `// @vitest-environment happy-dom`: `Element.prototype.animate` is a function, it returns an `Animation`, and `finished` settles ("finished"). But `document.getAnimations` is `undefined` (`Element.prototype.getAnimations` exists). The probe asserts `document.getAnimations`, so it fails. Thus `happy-dom` and `tools/happy-dom-probe.test.ts` are not kept. The Workshop finish spec uses the browser check for motion.
- Kaggle sparse checkout: a scratch clone with the sparse paths of `tools/kaggle-tournament.mjs` (`/package.json`, `/package-lock.json`, `/tsconfig.json`, `/src/`, `/sim/probes/`), then `npm ci --no-audit --no-fund --loglevel=error`: exit 0, 86 packages, `sharp` present. Scratch clone removed.
- The build worktree has a real `node_modules` (installed with `npm install`, not through a link).
