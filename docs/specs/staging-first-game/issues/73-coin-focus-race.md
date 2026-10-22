# Fix the coin focus race in the plugin-ui-http check

Status: resolved on branch `staging/lane-coinfocus` (from `staging/integrate` `bb2f93b7`); not merged, not deployed.

## What

The embedded WebKit check `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` failed one time under load: `AssertionError [ERR_ASSERTION]: The coin is visible` at `tools/lib/plugin-coin-focus-check.mjs:11` (`coin.boundingBox()` gave `null`), called from `tools/plugin-ui-check.mjs:2149`. The `cards` kind passed in both themes. The failure is in the `powers` kind, at its first coin. A rerun passed. Evidence: `evidence/staging-release-checks/integrate-release-2/` (`FAILED.txt`, `embedded-check.log`). It is a check fault, not a product fault.

## Why

The check blocks the staging release. A check is not weakened to make it pass: the fix removes the cause.

## Scope

- `tools/plugin-ui-check.mjs`: the wait of the coin focus step at 390 × 844.
- This ticket file.
- No change to `tools/lib/plugin-coin-focus-check.mjs`, to an assertion or to a time limit. No retry loop. No commit has a `Removed-check:` trailer.

## Acceptance

- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` passes 3 of 3 alone, and 3 of 3 under CPU load.
- `npm run check:browser plugin-ui plugin-ui-http` (default browser) passes.
- `npm run typecheck`, `npm run test:docs` and `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` pass.

## Result

### Cause (a race in the check)

The step sets `harnessNextView`, calls `harnessShow`, and waits only for `#power-w[data-state="used"]` (or `#card-w-0`). Then it reads the ids of the spent coins and runs `checkCoinFocus` for each id.

The frame mounts the result in `mountBody` (`src/account-game/runtime.ts`). The coins show first when the board read (`kingdown_get`) answers. But the mount has not ended: `call()` then waits for a `kingdown_games` read, and after it the mount's `finally` (`screens.board()`) and `store.sync()` draw the board again. Each draw runs `strips()` (`src/plugin/screens/board.ts`), which sets `strip.innerHTML` and makes new coin buttons with the same ids. `locator.boundingBox()` finds the element and then measures that handle. If a draw replaces the button between the two steps, the handle is detached, and WebKit gives `null`. Under CPU load the games read and the draws come later, so they can land in the first `checkCoinFocus` call.

The old cards view is not the cause: it has no power coins, and the step asserts 2 ids, which passed in the failed run.

Evidence:

- A temporary probe logged the host state at the id read and a `MutationObserver` logged each coin that left `#game-table` during the focus checks. With a temporary hold on the games read (`holdBeforeNext = 'kingdown_games'`, released just after the id read): `PROBE powers ids ["power-b","power-w"] {"next":false,"inflight":1,"held":1} reloadDisabled true`, then `PROBE powers replaced during focus: ["power-w@1697","power-b@1697","power-w@1697","power-b@1697"]`. So the step reads the ids during the mount, and the mount replaces both coins two times while the focus checks run. That run passed only because no draw landed inside a `boundingBox()` call.
- A one-time WebKit script: a handle of `#power-w` gives `{"x":8,"y":8,...}`; after a redraw of its row with a new `#power-w`, the same handle gives `null`, and a new locator gives the box again.
- Without the hold, under load of 16 `yes` processes (load averages 59.40 44.84 32.22), the probe showed `{"next":false,"inflight":0,"held":0} reloadDisabled false` and no replaced coin: the race is rare, as the release run showed.

### Fix

The pattern of ticket 72: wait for the state that the next step needs. After `harnessShow`, the step waits until `window.harnessNextView === undefined && window.harnessInflight === window.harnessHeld` (the frame has read the view and no tool call waits), then for `#reload:not(:disabled)` attached in the frame (the mount has ended and the controls are on). `#reload` is hidden at this size, so the wait uses `state: 'attached'`, as other steps in the file do. Then the step waits for the spent coin, reads the ids, and waits for each coin to be visible. After the mount no draw runs: the poll is off (`document.hidden` is true), and a theme change sets only `body[data-theme]`.

With the fix and the same temporary hold (released 1.5 s after `harnessShow`, under CPU load): `PROBE powers ids ["power-b","power-w"] {"next":false,"inflight":0,"held":0,"release":"undefined"} reloadDisabled false`, `PROBE powers replaced during focus: []`, and `ok plugin-ui-http 338.6 s`, `check: all 1 passed`.

### Green runs

Each browser run sets `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_coinfocus_test`. The load runs start 16 `yes > /dev/null` processes (this Mac has 16 cores) before the run and stop them by their PIDs after it.

Each run tests the tree of `261ab89f`. Each passing log has both `Coin focus at 390 × 844 (light, powers)` and `(dark, powers)`.

- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http`, alone, 3 runs: `ok plugin-ui-http 277.6 s`, `285.6 s`, `285.2 s`; each `check: all 1 passed`.
- The same, under CPU load: `ok plugin-ui-http 345.8 s` (load averages 21.62 18.34 18.08), `332.7 s` (28.75 26.20 22.07), `340.1 s` (24.80 22.99 20.17); each `check: all 1 passed`.
- `npm run check:browser plugin-ui plugin-ui-http` (default browser): `ok plugin-ui 231.3 s`, `ok plugin-ui-http 244.4 s`, `check: all 2 passed`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm test` (full): `Test Files  255 passed (255)`, `Tests  4757 passed | 8 skipped (4765)`.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

### Runs that failed (not the coin focus step)

- One alone run: `FAIL plugin-ui-http 277.6 s changed in the checkout: docs/specs/staging-first-game/issues/73-coin-focus-race.md`. This ticket file was written during the run, so the checkout guard stopped it. Not a check fault. The next alone run replaces it.
- One run under load: `FAIL plugin-ui-http 40.1 s AssertionError [ERR_ASSERTION]: The reading-row sample is visible`, at `checkFlatRows` (`tools/lib/plugin-tablet-check.mjs:90`), called from the Profile step (`tools/plugin-ui-check.mjs:411`). This step comes long before the coin focus step, and this change does not touch it. The state dump shows `screen: 'profile'` and the calls `kingdown_profile`, `kingdown_games`, `kingdown_resume`, `kingdown_games`, `kingdown_profile`, `kingdown_games`. A likely cause: the step waits for the first `#profile-open button`, but a later Profile read draws the rows again, so at the read no row is visible. It is outside the scope of this ticket. It needs its own ticket. The next run under load replaces it.
