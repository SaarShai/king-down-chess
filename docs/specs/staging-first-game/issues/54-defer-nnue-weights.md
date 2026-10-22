# Defer the NNUE weights off the local first page

Status: done on branch `staging/lane-nnue`; not merged, not deployed. Parent: U09. Follows ticket 53.

## What

The local home page loads the evaluation chunk at start. That chunk holds the base64 NNUE weights (`src/ai/nnue/net.ts` imports `NET_B64`). It is about 102.5 KB gzip of a 242.7 KB gzip first-page closure. Load it only when a search runs.

## Why

The main thread needs only two small things from the evaluation at start:

- `setEvaluator('residual')` in `src/main.ts`. It matters only for the inline fallback search. That search already loads `./ai/search` lazily in `Engine.think` (`src/game.ts`).
- `VALUES` in `src/new-game.ts` (`withDesign`). It reads only shipped piece values.

The AI worker sets its own evaluator (`src/ai/worker.ts`). A slow phone on a first visit gains most.

The scan's claims are correct at 73387e66. `main.ts` and `new-game.ts` are the only static importers of `src/ai/eval.ts` on the first page. `Engine.think` has one inline function. Two entries call it: no worker, and a worker that does not reply in time.

## Scope

Changed: `src/main.ts`, `src/game.ts`, `src/new-game.ts`, `src/game.test.ts`, new `src/ai/piece-values.ts`, new `src/ai/piece-values.test.ts`. No change under `src/rules/`, `src/match/`, `src/plugin/`, and no change to `tools/offline-build.test.ts`.

Decisions:

- **A copy of the values, not a move.** The suggested approach moves the value constants out of `src/ai/eval.ts`. That breaks `npm run tune:apply`: `src/sim/tune.ts` rewrites `export const PAWN_V = …` in `src/ai/eval.ts`. It also makes `tools/plugin-worker-boundary.test.ts` empty: it edits `PAWN_V = 100,` in that file. So `eval.ts` stays the source and stays unchanged. `src/ai/piece-values.ts` holds a frozen copy, `SHIPPED_VALUES`. `piece-values.test.ts` fails when the copy and `eval.ts` differ. `withDesign` never reads the Templar or a lab value at run time, so a frozen copy gives the same result.
- **The evaluator is set in the inline function.** `Engine.think` loads `./ai/search`, then `./ai/eval`, lazily. It sets `'residual'` and then calls `searchOwned`. Both inline entries go through this one function. The first form took `setEvaluator` from the same `./ai/search` import (`search.ts` re-exports it). `tools/game-boundary.test.ts` refuses that: a lazy search import may destructure only `{ searchOwned }`. `./ai/eval` is not a blocked module, so a second lazy import satisfies the boundary without a test change. The search chunk already imports the evaluation statically, so the second import fetches no extra code.

Out of scope, not changed: the comment in `src/ai/worker.ts` line 6 still says "the page (main.ts) does the same for the inline fallback". It should now name `Engine.think` in `src/game.ts`. The file is outside this ticket's scope.

## Acceptance

1. The local first-page JS closure drops by at least 90 KB gzip. Before and after numbers are recorded.
2. A computer move uses the residual evaluator in the worker path and the inline fallback path. A unit test proves the inline path sets it before it searches.
3. The match `worker.mjs` bytes do not change.
4. Offline reload and the first computer move still pass.

## Result

### First-page closure (gzip -9)

Measured with a scratch script: the `index-*.js` entry, the `main-*.js` chunk with its `__vite__mapDeps` preload list, and every static import of those chunks.

| File | Before (73387e66) | After |
| --- | ---: | ---: |
| `eval-*.js` (net) | 102,512 | not in closure |
| `main-*.js` | 27,112 | 27,233 |
| `index-*.js` | 844 | 825 |
| Other nine chunks (unchanged) | 112,256 | 112,256 |
| **Total** | **242,724** | **140,314** |

The closure drops by 102,410 bytes gzip (42%). Raw bytes: 527,278 before, 386,612 after. The net chunk `eval-*.js` (102,583 bytes gzip) is now reached only through the two dynamic imports in `Engine.think` (`search-*.js` and a 96-byte `eval-*.js` facade); `main-*.js` lists it only in their `__vite__mapDeps` preload lists. `dist/sw.js` lists `search-*.js`, both `eval-*.js` files and `worker-*.js` for the offline cache.

### Runtime bytes

`npm run plugin:build:runtime` before and after. All three files are byte-identical. They also match the receipt `phone-layout-release/end.json` (source `d161231f`).

- `worker.mjs` `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b` (unchanged)
- `search-worker.mjs` `a0ffb04e0838531b456dfe9ed52dbfa5c8a349d332f0a728e4fbfb9478a68ce9` (unchanged)
- `index.mjs` `cd6332ad01130df02bdfdd6c10fa86a6e0826da08210e42f73b2e7e35680e8b8` (unchanged)

### Evaluator in both paths

- Worker path: `src/ai/worker.ts` still calls `setEvaluator('residual')`. Not changed.
- Inline path: two new tests in `src/game.test.ts`. "sets the residual evaluator before each inline search" mocks `./ai/search` and `./ai/eval` and records the call order for the no-worker entry and for the worker-timeout entry. Both record `setEvaluator:residual` before `searchOwned`. "plays an inline search with the residual net" runs the real search from `linear` and then reads `evaluatorName() === 'residual'`.
- Red check, run on the first form and again on the final form (1f2787ec): with the `setEvaluator('residual')` line removed from `src/game.ts`, both tests fail (`expected [ 'searchOwned' ] to deeply equal [ 'setEvaluator:residual', …(1) ]` and `expected 'linear' to be 'residual'`; `Tests  2 failed | 31 skipped (33)`). With the line restored: `Tests  2 passed | 31 skipped (33)`.

### Offline reload

No registered browser check reloads offline. A scratch Playwright probe serves `dist` with Vite preview, waits for the service worker to control the page, goes offline, reloads and plays e2-e4 against the computer.

- `worker: offline reply e2-e4 d7-d6; search chunk before first move online: none; offline search requests: none; page errors: 0`
- `inline: offline reply e2-e4 Oc8>b7-a6; search chunk before first move online: none; offline search requests: /assets/search-CotApSuR.js; page errors: 0`
- `offline probe: PASS`

The page does not fetch the search chunk at start. With no worker, the inline search loads it from the offline cache.

### Checks

- `npm run build`: exit 0, before and after.
- `npm run typecheck`: exit 0.
- `npm run plugin:build:runtime`: exit 0, before and after.
- `KINGDOWN_TEST_FILE='{src/new-game,src/game}.test.ts' npm test`: `Test Files  2 passed (2)`, `Tests  50 passed (50)`.
- `KINGDOWN_TEST_FILE='src/ai/**/*.test.ts' npm test`: `Test Files  9 passed (9)`, `Tests  91 passed (91)` (includes the new `piece-values.test.ts`).
- `KINGDOWN_TEST_FILE=tools/offline-build.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  10 passed (10)`.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
- Full `npm test`, first run (commit 6e4d427f): `Test Files  6 failed | 249 passed (255)`, `Tests  13 failed | 4631 passed | 8 skipped (4652)`. One failure was real: `tools/game-boundary.test.ts` refuses `src/game.ts: * from src/ai/search.ts`. Commit 1f2787ec fixes it (see Decisions).
- Full `npm test`, second run (commit 1f2787ec): `Test Files  4 failed | 251 passed (255)`, `Tests  11 failed | 4633 passed | 8 skipped (4652)`. `tools/game-boundary.test.ts` passes. The 11 failures are plugin UI tests: `plugin-app` (3), `plugin-lobby` (2), `plugin-profile` (1), `plugin-screen-lifecycle` (5). They are timeouts and empty-text reads (for example `page.waitForFunction: Timeout 5000ms exceeded`, `expected '' to be '2 min left'`).
- The same four files on the 73387e66 sources (`src/main.ts`, `src/game.ts`, `src/new-game.ts`, `src/game.test.ts` checked out from 73387e66, `piece-values*` removed; all restored after): `Test Files  4 failed (4)`, `Tests  12 failed | 198 passed (210)`. The 11 names are the same, plus `keeps an inline route through an inline remount with no display request`. On this branch: `Test Files  4 failed (4)`, `Tests  11 failed | 199 passed (210)`. This change adds no failure. `tools/plugin-board.test.ts` failed once in the first full run and passed in the second.
- `npm run check:browser home turn powers special-moves new-game`: `check: 1 of 5 failed`. `ok home`, `ok powers`, `ok special-moves`, `ok new-game`. `FAIL turn  locator.click: Timeout 30000ms exceeded.` at `waiting for locator('.player-strip.is-turn .coin')` (`tools/verify-turn.mjs:43`, the Frost power step). A second run fails the same way. The same check on the 73387e66 sources (`src/main.ts`, `src/game.ts`, `src/new-game.ts` checked out from 73387e66, then restored) fails the same way at the same line: `check: 1 of 1 failed`. The failure exists before this change. The step before it (`ok capture rewinds; victim returns; no move remains`) passes.
