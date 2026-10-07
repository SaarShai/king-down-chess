# 12: Unused names fail the type check

**What to build:** The compiler refuses unused local names, so dead code fails `npm test` and the pre-commit hook. This ticket turns on `noUnusedLocals`. It lands after this spec removed eight unused names (ticket 01) and the Workshop finish spec removed five more, so that the type check stays green.

**Blocked by:** 01, 02, workshop-finish/01 (removal of the five unused Workshop names)

**Status:** ready-for-agent

**Owns:** `tsconfig.json`

- [ ] `tsconfig.json` sets `noUnusedLocals` to true; `npm run typecheck` exits 0.
- [ ] Story 1: a scratch unused import (removed after) makes `npm test` exit non-zero, and a commit of it in a scratch clone with the hooks is refused by pre-commit.
- [ ] `noUnusedParameters` stays off, and the `include` list does not change.

**Verify:** `npm run typecheck`; `npm test`; a scratch clone after `npm ci` with an unused import staged (`git commit` refused).
