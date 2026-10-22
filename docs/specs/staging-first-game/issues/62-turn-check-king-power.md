# Find why the website `turn` check fails at the king-power step, and fix the cause

Status: resolved on branch `staging/lane-turncheck`; not merged, not deployed. Parent: U09.

## What

`npm run check:browser turn` fails at `tools/verify-turn.mjs:43`. `usePower(page)` waits 30 s for `.player-strip.is-turn .coin` and times out. The scenario is FEN `4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1` with `?kings=frost:freeze,none`. The step before it passes.

## Why

The check guards the Frost king power, Undo and the turn press on the local website. A failing check hides other faults. The ticket must find whether the cause is a product defect, a stale check or the environment.

## Scope

- Diagnose with evidence: the commit that broke the step.
- Fix at the cause with the smallest change in a website UI file, plus a regression check that fails before the fix.
- No change in `src/rules/`, `src/match/`, `src/plugin/` or engine bytes. No deploy.

## Acceptance

- The ticket names the root cause and the commit that broke it.
- `turn` passes with no weakened assertion or timeout. `home`, `powers`, `special-moves` and `new-game` still pass.
- `worker.mjs`, `index.mjs` and `search-worker.mjs` keep the same sha256.

## Result

### Root cause: a product defect from `be0786da`

The check seeds a save in `localStorage` that has no `rules` field, and it opens the page with `?kings=frost:freeze,none`. A probe at `73387e66` shows the cause. After the page opens, White's strip has the class `is-turn`. It shows the default king (`spirit.webp`), and the page has no `.coin`. So the URL's king power is lost. This is not a selector change. The `is-turn` strip is present; the coin is absent.

`be0786da` ("Own game rules and isolate search memory across games") changed the start-up restore in `src/screen/play.ts`:

- Before: `if (s.rules) setRules(s.rules);` A save with no rules kept the global rules that `main.ts` had set from `?kings=`/`?rules=`.
- After: `game = new Game(undefined, s.rules);` (now `savedGame` in `src/screen/save.ts`). With `s.rules` undefined, the game uses `DEFAULT_RULES`. `restore()` treats a save with no rules as the same rules (`rulesDiffer` is false), so it replays the save under the defaults.

The ticket for that commit (`docs/specs/game-ownership/issues/02-owned-game-boundary.md`) says save and reload must stay the same. It records no intent to change this. A person who has a save with no `rules` field (a save from before saves stored their rules) and opens a `?kings=` link gets a game with no king power. That is a real defect.

Proof that `be0786da` is the first bad commit (the same single check, run in this worktree):

- `be0786da^` (`a788fa88`): `ok   turn               11.2 s`, `check: all 1 passed` (13 ok steps).
- `be0786da`: `FAIL turn               33.6 s  locator.click: Timeout 30000ms exceeded.`, after `ok capture rewinds; victim returns; no move remains`.

The environment is not the cause. The parent commit passes in 11.2 s on the same machine, and the failure is the same at every run.

### Change

- `src/main.ts`: before `play.restore`, a save with no `rules` gets the start-up game's rules (`{ ...play.game().rules }`). Those are the URL's `?kings=`/`?rules=`, else the defaults. This gives the same result as before `be0786da`. A save that has its rules does not change.
- `tools/verify-turn.mjs`: the regression check. Before `usePower`, it asserts that the turn strip has one power coin (`a save without rules plays the URL king power`). No assertion is removed and no timeout changes.

The regression check fails before the fix. With the new check and the unchanged `src/main.ts`: `FAIL turn                3.6 s  AssertionError [ERR_ASSERTION]: a save without rules plays the URL king power`.

### Checks

- `npm run check:browser turn` (after the fix): `ok   turn               11.1 s`, `check: all 1 passed`.
- `npm run check:browser turn home powers special-moves new-game`: `ok   turn               10.8 s`, `ok   home                8.1 s`, `ok   powers              4.3 s`, `ok   special-moves      32.3 s`, `ok   new-game           19.2 s`, `check: all 5 passed`.
- `tools/app-ui.mjs` is unchanged, so check 2 (the checks that import `usePower`, `readPower` or `powerCoin`) does not apply.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `KINGDOWN_TEST_FILE=src/screen/save.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  17 passed (17)`. `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`. `src/main.ts` has no unit test file.
- `npm run plugin:build:runtime` before and after: the sha256 values are the same.
  - `worker.mjs` `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`
  - `index.mjs` `cd6332ad01130df02bdfdd6c10fa86a6e0826da08210e42f73b2e7e35680e8b8`
  - `search-worker.mjs` `a0ffb04e0838531b456dfe9ed52dbfa5c8a349d332f0a728e4fbfb9478a68ce9`
- Full `npm test` with `PLUGIN_TEST_DATABASE_URL` set to the lane's test database: `Test Files  4 failed | 250 passed (254)`, `Tests  11 failed | 4630 passed | 8 skipped (4649)`. The 11 failures are the known plugin UI failures that belong to another lane. The brief records them at the base. The change touches only the website's `src/main.ts`, which these tests do not load.
  - `tools/plugin-app.test.ts`: keeps one rematch during a held end read and cancels it on leaving false; keeps focus on power-w through a minute tick and updates actions at the deadline; keeps focus on card-w-0 through a minute tick and updates actions at the deadline.
  - `tools/plugin-lobby.test.ts`: updates Your games after Back and keeps rows locked during Resume; keeps the five-second wait budget through the computer handoff, then uses fifteen seconds.
  - `tools/plugin-profile.test.ts`: drops a held notice page after SDK teardown without changing DOM or saved state.
  - `tools/plugin-screen-lifecycle.test.ts`: drops a held Profile reply after SDK teardown (failed false); (failed true); starts no Profile or games reads when Unblock replies after SDK teardown; does not restart a changed Join preview after SDK teardown (failed false); (failed true).

- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

### Not changed

An account save with no rules that arrives later (`openSaved`) still replays under the defaults. Before `be0786da` it used whatever rules the page had at that time. No check covers it, and the URL rules do not apply there. It is outside this ticket.
