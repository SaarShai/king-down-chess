# Fix the menu-extra and gui-board-preview browser checks

Status: resolved on branch `staging/lane-checkfix` (from `staging/integrate` `7f4caaec`); not merged, not deployed.

## What

Two browser checks fail before the staging release. Both are check faults, not product faults.

1. `npm run check:browser menu-extra` passes each step, then `assertNoErrors` (`tools/lib/checks.mjs`) finds 4 errors: `console.error: Failed to load resource: net::ERR_NAME_NOT_RESOLVED`.
2. `npm run check:browser gui-board-preview` (alone) fails at about 130 s: `locator.waitFor: Timeout 10000ms exceeded` for `iframe >> #board-sheet[open]`, at the A39 step (`docs/specs/gui-previews-2026-10-19/capture.mjs`). Ticket 71 saw the same step fail twice under load and pass once.

## Why

Both checks block the staging release. A check is not weakened to make it pass: each fix removes the cause.

## Scope

- `tools/lib/checks.mjs`, `tools/lib/checks.test.ts`: a shared answer for the fake account host of the check site.
- `docs/specs/gui-previews-2026-10-19/capture.mjs`: the `seed()` wait of the board previews.
- This ticket file.
- No change to `tools/verify-account.mjs`, to `assertNoErrors`, or to a time limit. No assertion changes, so no commit has a `Removed-check:` trailer.

## Acceptance

- `npm run check:browser menu-extra account home` passes.
- `npm run check:browser gui-board-preview` passes 5 of 5 alone, and 3 of 3 under CPU load.
- `npm run typecheck`, `npm run test:docs` and `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` pass.

## Result

### Cause 1: menu-extra (from ticket 70)

Ticket 70 builds the shared check site with `CHECK_SITE_ENV`, so the account project is the fake origin `https://web-proof.supabase.co`. When a signed-out player opens Settings, the Account section reads the public auth settings (ticket 46). The name does not resolve, and the browser logs one console error for each request. A temporary `requestfailed` logger in `trapErrors` showed the 4 requests, one for each viewport of the menu step: `REQFAILED https://web-proof.supabase.co/auth/v1/settings net::ERR_NAME_NOT_RESOLVED`. Before ticket 70 the build had no account address, so the client never started.

### Fix 1

`tools/lib/checks.mjs` exports `answerCheckHost(context)`. It routes `https://web-proof.supabase.co/**`: `OPTIONS` gets 204, `/auth/v1/settings` lists Google and GitHub, a `GET` under `/rest/` gets `[]`, and each other path gets 204. Each answer has open CORS headers. `launch()` wraps `browser.newContext` (`browser.newPage` calls it too), and `launchPersistent()` routes its context. So each check that opens its browser with the shared module never asks the network for the fake host, and `assertNoErrors` stays as it is. `tools/verify-account.mjs` adds its own route on the same context later. Playwright runs the route added last first, so the account check keeps its own fake server. Two new unit tests prove the route in a new context, in a persistent profile, and each answer.

### Cause 2: gui-board-preview, A39 (a race in the check)

`seed()` posts a fixture position, sets `harnessNextView` and calls `harnessShow`. `harnessShow` returns when the host sends the tool result. The frame then mounts the result: it reads the board with `kingdown_get` (the host answers with `harnessNextView` and clears it), draws the new view, and keeps each control off until the mount ends (`src/account-game/runtime.ts`, `mountBody`). `seed()` then waited only for `#board[aria-busy="false"]`, but the board sets that once, when its art loads. So `seed()` returned while the old view was still on the board. A39 seeds twice for each viewport and theme (the start position, then the Take and Shove position). Its two taps can land on the old position, or during the mount, when the board refuses a tap. Then the new view arrives and `draw()` clears the selection and closes the sheet, so `#board-sheet` never opens. No earlier preview leaves state: each item runs in its own process. The step is an A39 step only because A39 is the only item that seeds twice and then needs a two-tap selection.

Evidence: a temporary log in `seed()` showed `harnessNextView` still set at each `seed()` return, in each of 36 seeds in 3 runs under load (`SEED 390 light {"next":true,"inflight":0} reloadDisabled false`, and the same for each viewport and theme).

### Fix 2

The pattern of tickets 63, 64 and 69: wait for the state that the next step needs. After `harnessShow`, `seed()` waits until `window.harnessNextView === undefined` and `harnessInflight === harnessHeld` (the frame has read the seeded view and no tool call waits), then for `#reload:not(:disabled)` in the frame (the mount has ended and the controls are on), then `ready()`. The 10 s step wait does not change.

### Red runs

- `npm run check:browser menu-extra` at `7f4caaec` with the temporary logger: `FAIL menu-extra 11.2 s Error: assertNoErrors: 4 unexpected error(s):`, with 4 lines `console.error: Failed to load resource: net::ERR_NAME_NOT_RESOLVED`, and before them 4 lines `REQFAILED https://web-proof.supabase.co/auth/v1/settings net::ERR_NAME_NOT_RESOLVED`.
- The race on demand: a temporary hold delays each board read by 1.5 s (`holdBeforeNext = 'kingdown_get'`, then `releaseBefore` after 1500 ms). `node tools/plugin-browser-check.mjs preview A39` with the old `seed()`: `locator.waitFor: Timeout 10000ms exceeded.`, `waiting for locator('iframe').contentFrame().locator('#board-sheet[open]') to be visible`, the error of the release run. With the new `seed()` and the same hold, all 8 A39 board passes (2 viewports, 2 themes, flipped and not) pass. The direct run then stops at the web step, `page.goto` to `undefined?title=0...`, because a direct run has no site URL (ticket 71); the runner gives it one.

### Green runs

Each browser run sets `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_checkfix_test`.

- `npm run check:browser menu-extra account home` (tree equal to `30657504`): `ok menu-extra 11.4 s`, `ok account 53.9 s`, `ok home 8.3 s`, `check: all 3 passed`.
- The same line at `99528119`, clean tree: `ok menu-extra 11.9 s`, `ok account 54.1 s`, `ok home 8.6 s`, `check: all 3 passed`.
- `npm run check:browser gui-board-preview`, alone, at `6b13f5dd`, 5 runs: `ok gui-board-preview 162.4 s`, `165.6 s`, `167.5 s`, `165.1 s`, `166.1 s`; each `check: all 1 passed`.
- The same, with 16 `yes > /dev/null` processes (this Mac has 16 cores), started before each run and stopped by their PIDs after it, 3 runs: `ok gui-board-preview 174.0 s` (load averages 39.24 24.27 16.25), `174.1 s` (42.76 32.37 21.09), `172.1 s` (40.57 34.86 24.09); each `check: all 1 passed`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
- `KINGDOWN_TEST_FILE=tools/lib/checks.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  37 passed (37)`.
- `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  32 passed (32)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

Note: gui-board-preview uses about 166 s of its 300 s limit alone, and about 174 s under load.
