# 97 — Start stays disabled after a page load

Status: ready for review
Type: task

## Plan and checks

1. Add complete failure details to the local browser check build. Record each error, the app lock state, saved command receipts, offers and requests in flight.
2. Repeat the Chromium check. Hold selected replies or add load to force the fault. Reduce the case and prove the cause before a fix.
3. Fix the cause. Add a product test if a player can hit the fault. Use a state gate for a check race; do not raise time limits.
4. Run web-game at least five times, web-online, signin-speed and npm test. Keep hooks unchanged. Push and open a PR into staging/first-game.

## Scope

Use a disposable local database and fake local accounts. No production writes, deploy or owner login. Keep the current hooks and time limits.

## Cause and proof

This is a product fault. The result screen calls `kingdown_get` with retention on while it loads full result details. A reload can save that read in the page state. It has empty arguments and a short game tag. It is not a durable game command. A fresh `/play/` entry clears the board ID, then retries the saved read. Recovery cannot find its game. The failed read holds the account command lock and Start stays disabled.

The original CI log has six errors and no failed requests. The local failure has the same state. Its six errors are five deliberate lost replies and the one expected connection report. They do not cause this lock. The app reports `connected: true`, `mounting: false`, `writing: false`, `starting: false`, `locks.start: true` and a failed pending `kingdown_get`. No durable command receipt exists. The lobby has an open offer, but it does not hold this lock.

Reproduction results before the fix:

- Normal web-game passes in 87.4 s. Forty Play reloads at one sixth CPU speed pass in a 136.2 s run.
- The full flow at one third CPU speed and 100 ms network delay passes in 95.4 s.
- Load on the full flow at one sixth CPU speed stops at an earlier detached focus control in the solo check (74.3 s). This is a different fault.
- Load applied after the solo flow reproduces the reported Start failure in 95.0 s. Log: `lobby-start-Is4Eke/web-game.log` under the local browser run root.
- A held full result reply, followed by a Play reload, reproduces the same failure without load in 82.3 s. Log: `lobby-start-Xeu5J0/web-game.log`.
- `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts KINGDOWN_TEST_NAME='keeps one rematch during a held end read' npm test`: both selected cases fail. Each finds a saved `kingdown_get` read with empty arguments.

## Fix

The result details use a read with `user: false` and no command retention. A failed read uses the existing read notice and Try again. That notice stops automatic result reads until the player retries. The held-read cases check that no pending command exists. The failed-read case checks Try again and no automatic resend. The web-game check holds the real full result reply and reloads Play before it releases the reply.

Failure details come from the app store in the local check build only. They include the actual locks, pending state, setup state, saved receipts, list entries, server offers, requests in flight and each recorded error. No product debug API is added. Time limits stay unchanged.

## Checks

- `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts KINGDOWN_TEST_NAME='held end read|failed end read' npm test`: 3 selected cases pass; 136 are filtered. All 68 artwork checks pass.
- `PLUGIN_TEST_DATABASE_URL=<disposable local database> PLAYABLE_BROWSER=chromium npm run check:browser web-game`: five fixed runs pass in 69.7, 86.1, 73.7, 77.5 and 77.5 s. Each holds the result reply, reloads Play, and checks Start. Each also checks that an old lobby reply cannot restore a cancelled offer.
- `PLUGIN_TEST_DATABASE_URL=<disposable local database> PLAYABLE_BROWSER=chromium npm run check:browser web-online signin-speed`: both pass, in 110.3 and 20.1 s.
- `TZ=UTC PLUGIN_TEST_DATABASE_URL=<disposable local database> npm test`: 305 files pass and one skips. 6,034 tests pass and 16 skip. All 68 artwork checks pass. The database also uses UTC.
- Browser run folders: `lobby-start-3CKvZu`, `lobby-start-zUYhI2`, `lobby-start-zrOlpW`, `lobby-start-sD095F`, `lobby-start-yZBczy` and `lobby-start-aRL05M`. They are under the system temp folder `kingdown-check-runs`.
- `npm run test:docs`: 17 files and 187 tests pass.
- Full test log: the task scratch folder, `lobby-npm-test.log`.
- Author review checks the read, lock, retry and rematch paths. The three-line product change uses the existing read notice. No new timer, timeout or retry loop is needed. Independent review remains open on the PR.
- No Firefox, deploy, production write or owner account login. Hooks stay unchanged.

## CI follow-up: rematch after a failed result read

CI on `de5c445e` fails `plugin-ui` in Chromium and WebKit: "A pending result-details read still allows a queued rematch". The check is correct. Ticket 41 keeps this contract: a failed result-details read keeps Rematch on. The first fix sent the failure through the stale-game read notice. That notice locks the result's choices, so Rematch went off.

The fix adds a `details` mark to the read notice. The result screen sets it on its details read. The notice still shows Try again, and the screen still sends no automatic details read. It does not mark the game stale: it sets no game lock and no "Not current". A queued rematch sends at once. Three failed background reads still set the normal stale lock. No check is removed.

Checks: a state test covers the `details` notice; the failed end read product test checks that Play again stays on.
