# Fix the Profile rows race in the plugin-ui-http check

Status: resolved on branch `staging/lane-profilerace` (from `staging/integrate` `3a524968`); not merged, not deployed.

## What

The embedded WebKit check `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` failed one time under CPU load (ticket 73, last section): `FAIL plugin-ui-http 40.1 s AssertionError [ERR_ASSERTION]: The reading-row sample is visible`, at `checkFlatRows` (`tools/lib/plugin-tablet-check.mjs:90`), called from the Profile step (`tools/plugin-ui-check.mjs:411`, now 417, in the loop over the phone, panel and desktop sizes). The state dump showed `screen: 'profile'` and the calls `kingdown_profile`, `kingdown_games`, `kingdown_resume`, `kingdown_games`, `kingdown_profile`, `kingdown_games`. It is a check fault, not a product fault.

## Why

The check blocks the staging release. A check is not weakened to make it pass: the fix removes the cause.

## Scope

- `tools/plugin-ui-check.mjs`: the wait of the Profile step before it reads the open-game rows.
- This ticket file.
- No change to `tools/lib/plugin-tablet-check.mjs`, to an assertion or to a time limit. No retry loop. No commit has a `Removed-check:` trailer.

## Acceptance

- The race is made to happen with a temporary hold, and the hook is then removed.
- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` passes 3 of 3 alone, and 3 of 3 under CPU load.
- `npm run check:browser plugin-ui plugin-ui-http` (default browser) passes.
- `npm run typecheck`, `npm run test:docs` and `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` pass.

## Result

### Cause (a race in the check)

Ticket 73's guess is partly right. A Profile read draws the rows again, but it is not a later, second read. It is the one read of this visit, and the rows that the step finds first are the rows of the last visit.

Each size step opens Profile with `openScreen('profile')` and ends with a click on the first open-game row (the board opens, with `kingdown_resume` and `kingdown_games`). The rows stay in `#profile-open` while Profile is hidden. At the next size, the click on the Profile row shows the old rows at once, and `readProfile` (`src/plugin/screens/profile.ts`) starts a new `kingdown_profile` and `kingdown_games` read and shows 'Loading profile…'. So `#profile-open button` `.first().waitFor()` returns at once on the old rows. When the read answers, `$('profile-open').replaceChildren(...)` puts new buttons in their place.

`checkFlatRows` reads the rows with `locator.evaluateAll`. Playwright does this in two protocol calls: it finds the elements, then runs the function on them (`node_modules/playwright-core/lib/coreBundle.js:25095-25096`, Playwright 1.64.1). If the read's redraw lands between the two calls, each row is detached, `checkVisibility()` is false, no row is kept, and the assertion fails. Under CPU load the read answers later, so it can land in the step.

At the phone size (the first visit) the list is empty before the read, so the first-row wait waits for the read, and the race cannot happen. The failure was at the panel or desktop size. The desktop call list is the same as the failure's state dump.

Evidence (temporary probes, now removed):

- A hold on the Profile read at the panel and desktop sizes (`holdBeforeNext = 'kingdown_profile'` before `openScreen`). At the first-row wait: `PROBE profile panel at first-row wait {"inflight":2,"held":1,"release":"function","calls":["kingdown_games","kingdown_resume","kingdown_profile","kingdown_games","kingdown_profile","kingdown_games"]} {"rows":2,"status":"Loading profile…","more":true}`. After the release, a `MutationObserver` on `#profile-open`: `gone ["053f85c1","4420dde5"]`. The desktop line is the same, with the calls `["kingdown_profile","kingdown_games","kingdown_resume","kingdown_games","kingdown_profile","kingdown_games"]`. So the step reads the old rows while the read waits, and the read replaces both rows.
- The same hold, with the two steps of `evaluateAll` done one by one: the probe gets the row handles (`elementHandles()`), releases the hold, waits for the read to end, then runs `checkVisibility()` on the handles: `handles [connected, visible] after the read: [[false,false],[false,false]]` at both sizes. That is the zero-row result of the failure.
- With the hold at the phone size, the first-row wait timed out (`locator.waitFor: Timeout 30000ms exceeded.` at the first-row wait): on the first visit, only the read draws the rows.
- A loop of 60 tries at each size released the hold 0 to 29 ms after the first-row wait and then ran `checkFlatRows` unchanged. It did not fail in 240 tries (alone and under load of 16 `yes` processes, load averages 32.22 23.15 17.62). The gap between the two protocol calls is very small, and the release run in ticket 73 showed that the failure is rare.

### Fix

Wait for the state that the next step needs: the end of this visit's Profile read. Before `openScreen('profile')` the step counts the `kingdown_profile` calls at the host. After it, the step waits until the count is larger (this visit's read has started, so `readProfile` has already set 'Loading profile…'), then until no `#profile-status` shows 'Loading profile…'. `readProfile` sets the status to '' in the same task as `replaceChildren` on `#profile-open`, so then the new rows are drawn. Then the step waits for the first row and reads the rows. After the read, nothing draws `#profile-open` again in this step: only `readProfile` writes it, and the step starts no mount and no other Profile read.

With the fix and a temporary hold on the Profile read (released 1.5 s after `openScreen`, under load of 16 `yes` processes, load averages 21.75 22.55 19.47): `PROBE profile panel at the row read {"inflight":0,"held":0,"release":"undefined"} {"rows":2,"status":""}`, `PROBE profile panel replaced during the row checks: []`, the same at the phone and desktop sizes, and `ok plugin-ui-http 342.0 s`, `check: all 1 passed`.

### Product

The product does not draw a visible row away. `replaceChildren` puts the new rows in one task, so the list is never empty on the screen. While the read waits, Profile shows the rows of the last visit and 'Loading profile…'. This is not a fault.

### The other checkFlatRows callers and the same pattern

- `tools/plugin-ui-check.mjs:191`, `[data-screen="play"] .menu-row`: the Profile and Settings rows are made one time in `createHall` (`src/account-game/hall.ts`) and stay. A games read can replace only the game rows, so at least two rows stay visible. No race.
- `tools/plugin-ui-check.mjs:1118` (was 1112), `#seat-menu-sheet .menu-row`: `menu()` (`src/plugin/screens/seat.ts`) makes the sheet on the click. A seat redraw makes it again only when no menu is open (`!closeMenu`). No race.
- `tools/plugin-ui-check.mjs:1261` (was 1255), `#settings-sheet .fields > label`: static HTML in `src/plugin/index.html`. No race.
- The other `.first().waitFor()` steps: the row click after `#page-back` (Playwright's click tries again on a detached element, and the old and new first rows have the same game) and the remount wait (no row read after it). The `.game-code span` waits: `#friend-new` shows only when no code tiles show (`src/plugin/screens/friend.ts`), so after its click the tiles come only from the new code, and `allTextContents()` reads the text of a detached tile correctly. No change.

### Green runs

Each browser run sets `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_profilerace_test` (made with `npm run plugin:db:init-test`: `Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`). The load runs start 16 `yes > /dev/null` processes (this Mac has 16 cores) before the run and stop them by their PIDs after it.

Each run tests the tree of `dabe431c`. Each passing log has `Profile and collection: two open games, three real PostgreSQL results and private handles, all four collection tabs, images, remounts and three viewport sizes.`

- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http`, alone, 3 runs: `ok plugin-ui-http 287.0 s`, `278.7 s`, `286.5 s`; each `check: all 1 passed`.
- The same, under CPU load: `ok plugin-ui-http 336.9 s` (load averages 24.63 18.89 16.30), `344.8 s` (30.44 23.85 19.44), `337.5 s` (23.30 21.57 19.63); each `check: all 1 passed`. One more load run failed at another step (see below).
- `npm run check:browser plugin-ui plugin-ui-http` (default browser): `ok plugin-ui 234.9 s`, `ok plugin-ui-http 250.8 s`, `check: all 2 passed`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs` (with this ticket file): `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

### Runs that failed (not the Profile step)

- One run under load (the third of four, load averages 27.94 26.07 21.47): `FAIL plugin-ui-http 219.5 s AssertionError [ERR_ASSERTION]: A spent coin can have keyboard focus`, at `tools/plugin-ui-check.mjs:2207:3` (`assert(spentFocus.keyboard, ...)`, the spent card coin after the card move). The Profile step passed in this run (its log has the `Profile and collection` line), and the coin focus lines of ticket 73 passed (`Coin focus at 390 × 844 (dark, powers)`). The state dump shows `screen: 'board'`, `status: 'Your move.'`, `reloadDisabled: false` and the calls `kingdown_games`, `kingdown_get`, `kingdown_games`, `kingdown_get`, `kingdown_move`, `kingdown_computer`. A likely cause: the step presses Tab, focuses the spent coin, then reads `:focus-visible`; if a redraw of the strips (`strips()` in `src/plugin/screens/board.ts`, which makes new coin buttons) lands between the focus and the read, the focused button is detached and the read gives `false`. This change does not touch that step. It needs its own ticket. The next run under load replaces it.
