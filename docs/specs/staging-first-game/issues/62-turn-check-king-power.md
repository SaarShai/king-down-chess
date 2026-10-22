# Find why the website `turn` check fails at the king-power step, and fix the cause

Status: resolved on branch `staging/lane-turncheck` (reworked after review); not merged, not deployed. Parent: U09.

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

The ticket for that commit (`docs/specs/game-ownership/issues/02-owned-game-boundary.md`) says save and reload must stay the same. It records no intent to change this.

Corrected cause (after review): the defect is in `restore()`, not in a missing rules copy. Since `be0786da` a save with no rules plays the default rules, but `restore()` does not compare those default rules with the URL rules. So a `?kings=` or `?rules=` URL replays the old save under the defaults, and the URL rules are lost. The fix makes a save with no rules a default-rules save in that comparison too. The old behavior ("a save with no rules replays under the URL rules") does not come back.

Proof that `be0786da` is the first bad commit (the same single check, run in this worktree):

- `be0786da^` (`a788fa88`): `ok   turn               11.2 s`, `check: all 1 passed` (13 ok steps).
- `be0786da`: `FAIL turn               33.6 s  locator.click: Timeout 30000ms exceeded.`, after `ok capture rewinds; victim returns; no move remains`.

The environment is not the cause. The parent commit passes in 11.2 s on the same machine, and the failure is the same at every run.

### Who has a save with no rules

Saves hold their rules since `a7bdb5ac` (2026-09-16). Each start-up without `?fen=` writes the save again with its rules (`src/main.ts`: `if (!fen) play.save()`). So only a device with no website visit since 2026-09-16 can hold a save with no rules. Today the main writers of such saves are browser-check fixtures (`tools/verify-turn.mjs`, `tools/verify-game-screen.mjs`, `tools/verify-end.mjs`).

### Change

- `src/screen/play.ts`, `restore()`: a save with no rules is a save under the default rules. `restore()` compares `saved.rules ?? { ...new GameRules().rules }` with the URL rules. That object has the same JSON as the `rules` that `save()` writes for a default game (`{ ...game.rules }`; `new Game()` makes its rules with `new GameRules(DEFAULT_RULES)`). A unit test proves the JSON equality. Thus a save with no rules behaves as a modern save under the defaults:
  - No URL rules, or URL rules equal to the defaults: the save replays, as at the base.
  - Different URL rules (`?kings=`, `?rules=`, an opened link design): the existing `rulesDiffer` path keeps the fresh URL game, and the next save replaces the old one. The URL never makes the save unreadable.
- `tools/verify-turn.mjs` and `tools/verify-game-screen.mjs`: each seeded save now holds the rules that the page saves for its URL. The new helper `rulesAt(browser, url)` in `tools/app-ui.mjs` opens the URL in a fresh context and reads the `rules` of the start-up save. With the same rules, the URL replays the seeded position. The game-screen saves with no URL rules stay as they are, because a save with no rules is a default-rules game.
- The one-coin assertion before `usePower` stays. Its message is now `a save with the URL rules plays the URL king power`.

### Why the fixture change is right

The fixtures used the idiom "a save with no rules replays under the URL rules". That idiom is not a product behavior since `be0786da`, and this fix does not bring it back: a save holds the rules of its game. A real player gets a save with rules from every start-up, so a seed with the URL rules is the state that a player has. Each scenario still tests the same thing: the seeded position, played under the URL king power, through the autosave path. `?fen=` was not used, because it skips the save settings (`pace`, `sound`, `queen`, `skill`) and the start-up save.

### Unit tests (`src/screen/play.test.ts`, "a save without rules on the game page")

1. Replays under the default rules, which are the rules that `save()` writes for a default game (the URL names the defaults; the save replays; the written rules are equal).
2. Replays when the URL names no rules.
3. Keeps the fresh game and its king power when the URL names kings (`frost:freeze,none`); the save is not marked unreadable.
4. Keeps the fresh `?rules=2017` game with no recovery notice for a save that 2017 cannot replay (FEN `4k3/8/8/8/8/8/8/2A1K3 w - - 0 1`, moves `['Ac1-d2']`); `saveBlocked` is false.

Red run with the base `restore()` and the new tests: `Tests  2 failed | 10 passed (12)`.

- Test 3: `AssertionError: expected [ ... ] to have a length of +0 but got 2` (the base replays the save under the defaults and drops the king power).
- Test 4: `AssertionError: expected [ ... ] to have a length of +0 but got 1` (the base replays the save under the defaults and drops `?rules=2017`).
- Tests 1 and 2 pass at the base. They guard the behavior that stays the same.

### Review fixes

The first fix (`447184e7`, in `src/main.ts`) is reverted (`36270e2c`). The review found these defects:

- `readSave()` already checks each save with `savedGame()`, under the defaults for a save with no rules, before `main.ts` runs. A save with no rules whose moves need the URL rules (for example `['!F:d5']` with `?kings=frost:freeze,none`) stayed unreadable, so the fix did not run for it.
- A save with no rules that loads under the defaults but not under a different `?rules=` preset showed "Your saved game could not be loaded..." and stopped all saves. The base loads it. For example, 161 of 200 random default-rules games fail under `RULES_2017`.

The new fix is in `restore()` only. Known limit: a save with no rules whose moves are legal only under URL rules is unreadable, at the base and now. Under the decision "a save with no rules is a default-rules game", it is not a valid save. Only a device with no visit since 2026-09-16 can hold one.

### Checks

- `KINGDOWN_TEST_FILE='{src/screen/play,src/screen/save,src/screen/home}.test.ts' npm test`: `Test Files  2 passed (2)`, `Tests  29 passed (29)`. `src/screen/home.test.ts` does not exist.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run check:browser turn game-screen home powers special-moves new-game end`: `check: 2 of 7 failed`.
  - `ok   turn               14.0 s`, `ok   home               13.1 s`, `ok   powers              7.3 s`, `ok   special-moves      32.7 s`, `ok   new-game           19.8 s`.
  - `FAIL game-screen         1.9 s  AssertionError [ERR_ASSERTION]: short phone board: 287.00 px`. See "Game-screen board width".
  - `FAIL end                31.8 s  page.waitForFunction: Timeout 30000ms exceeded.` at `tools/verify-end.mjs:73`. See "The end check".
- Other registered checks that seed a save and use URL rules: `npm run check:browser cursor-adoption qa`: `ok   cursor-adoption    18.6 s`, `ok   qa                160.4 s`, `check: all 2 passed`. `verify-cursor-adoption.mjs` already seeds the save with the page's rules. `verify-new-game.mjs` passes (above).
- `npm run plugin:build:runtime`: the sha256 values do not change.
  - `worker.mjs` `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`
  - `index.mjs` `cd6332ad01130df02bdfdd6c10fa86a6e0826da08210e42f73b2e7e35680e8b8`
  - `search-worker.mjs` `a0ffb04e0838531b456dfe9ed52dbfa5c8a349d332f0a728e4fbfb9478a68ce9`
- The full `npm test` is not run in this rework, by the lead's order (another lane owns the 11 plugin UI failures).
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

### The end check

`tools/verify-end.mjs:72` uses the same fixture idiom: a seed with no rules and `&kings=flame:haste,none`. At the base `73387e66` it fails: `FAIL end                31.9 s  locator.click: Timeout 30000ms exceeded.` (the Haste coin is absent, the same `be0786da` cause). Now it fails at the next step (`endTurn`), because the page keeps the fresh URL game. `verify-end.mjs` is outside this ticket's file list, so it is not changed. The fix is the same as in `verify-turn.mjs`: in `open()`, seed `rules: await rulesAt(browser, url)` when the query names `kings=` or `rules=`.

### Game-screen board width

`game-screen` fails at `tools/verify-game-screen.mjs:33`: `short phone board: 287.00 px` (the floor is 290 px at 320×568). This failure comes before the fixture lines and does not depend on this ticket.

- The assertion comes from `3d301c73` (2026-10-09). There the check passes: `ok   game-screen         7.0 s`.
- `git bisect` from `3d301c73` (good) to `73387e66` (bad) names `23810f27` ("Preview flat reading rows and joined segments", 2026-10-19) as the first bad commit. `d161231f` (ticket 52) changes only `src/plugin/app.css`; it is not the cause.
- `23810f27` changes the short-portrait rule in `src/ui/table.css` (`max-height: 640px`): the Moves row goes from 44 px to 48 px (`#moves-line` and the grid row). The board row is `minmax(0, 1fr)`, so the board loses the 4 px: 291 px to 287 px.
- That commit's `Removed-check:` trailers cover only plugin checks. The website `game-screen` check was not updated. The next assertion (`moves-line` height 44) also conflicts with the 48 px row.

Two design decisions conflict. `docs/specs/web-redesign/issues/03-the-table.md` ("Board review fixes", 2026-10-09) sets a 44 px Moves row on short phones and a 290 px board floor. `docs/specs/gui-previews-2026-10-19/issues/gui-prev-controls.md` sets 48 px flat reading rows, the Moves line included. A fix must pick one: restore 44 px for the short-phone Moves row, or accept the 48 px row and lower the floor to 287 px. This is a design choice, not a defect with one correct fix, so it is not changed here. The owner decides.

### Not changed

An account save with no rules that arrives later (`openSaved`) still replays under the defaults. Before `be0786da` it used whatever rules the page had at that time. No check covers it, and the URL rules do not apply there. It is outside this ticket.
