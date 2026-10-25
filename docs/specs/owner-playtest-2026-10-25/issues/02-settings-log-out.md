# 02 — Log out in Settings

Type: task
Status: resolved
Finding: F-108
Branch: codex/playtest-settings-logout
Base: origin/staging/first-game, a89a9381a73c0744574bdd27bb2b8c96a6e773c6

## Approval and scope

Saar says: "do only the log out in settings." The desktop and phone Settings samples have approval. Add one Log out button as the last Settings row. Profile gets no button. Sign out this device through the existing account client. Keep saved games and pending game receipts.

## Plan and acceptance checks

- [x] Read the current edits, first review and both approved samples.
- [x] Test the repeat-click fault with the real button lock code. The test fails before the repair.
- [x] Add a separate pending flag. Keep the busy button disabled across page updates. Clear both states after an error.
- [x] Run typecheck, focused tests and the full tests. Record the one known full-test failure below.
- [x] Run the local website check. Check keyboard, touch, repeated input, focus, reload and saved data.
- [x] Capture Settings at 1280 and 390 pixels. Compare each capture with its approved sample.
- [x] Prepare the commit, report and PR text. Do not push, open a PR or merge.

## Changes

The website account entry adds the button and fixed retry text. A separate pending flag stops a second sign-out call. The button has `aria-busy` while sign-out runs. A website-only disabled fieldset keeps Log out disabled during each shared lock update. A thrown error clears the flag and attribute, shows an alert, and enables the button. Success opens a fresh `/play/` page with the sign-in choices.

The product uses the existing `signOut` function with local scope. It sends no game command and removes no saved game or pending receipt. The website check uses local test identities and a disposable loopback database. Its addition to `tools/web-game-check.mjs` is one block. The shared browser setup has no change.

## First review and repair

Review: `playtest/reports/owner-playtest/F-108-checks/review-01/review-settings-logout.md`.

The first review finds one P2 fault. A page update resets `button.disabled` while sign-out runs. A second click can then start another call. The entry test now runs the real `applyLocks` function for the name screen and Settings. It also forces the DOM button on and calls the handler again. The flag stops that call. The browser check holds the sign-out reply, repeats Enter and a double click, opens the name screen, and returns to Settings. Each width sends one local sign-out request and gives no page error.

The first verdict is "not ready" on the old code. The fault now has a repair and passing proof. The orchestrator starts the second independent review after this run. This run starts no review.

## Check results

Logs: `/private/tmp/claude-501/ci87/run38/settings-logout-files/`.

The test batch holds `bash tools/test-lock.sh` across database setup, focused tests and full tests. Each command uses the local test database. The browser command holds the same lock in a separate run.

| Command | Result | Log |
| --- | --- | --- |
| `KINGDOWN_TEST_FILE=src/online/entry.test.ts KINGDOWN_TEST_NAME='puts Log out last' npm test` before repair | Expected failure: the real lock enables the pending button. One failure; 12 cases skip. | `review-regression-before.log` |
| `npx tsc --noEmit -p .` | Pass, exit 0. | `typecheck.log` |
| `npm run plugin:db:init-test` under the shared lock | Pass, exit 0. Migrations 0001–0019 are ready. | `db-init.log` |
| `KINGDOWN_TEST_FILE='{src/online/entry.test.ts,src/account/*.test.ts}' npm test` | Pass, exit 0. Eight files and 93 tests pass. All 57 artwork checks pass. | `focused.log` |
| `npm test` | Exit 1. 274 files and 5,154 tests pass; eight tests skip. The only failure is the stated 7-day grace case at `src/online/accounts.db.test.ts:324`. It measures 608,400,000 ms against 604,800,000 ms. This is the known one-hour daylight-saving fault. The full command stops before the artwork checks. The focused command above passes those checks. | `full.log` |
| `pgrep -f '[t]ools/deploy[.]sh'` | No PID; exit 1. No publish wait is necessary. | `publish-guard.log` |
| `bash tools/test-lock.sh npm run check:browser web-game` | Pass, exit 0; 66.9 seconds. The database setup runs first. | `browser.log`; `tmp/kingdown-check-runs/playtest-settings-logout-0CQp17/web-game.log` |
| `node --check tools/web-game-check.mjs` | Pass, exit 0. | `browser-script-syntax.log` |
| `npm run test:docs` | Pass, exit 0. Fifteen files and 176 tests pass. | `docs.log` |
| `git diff --check` | Pass, exit 0. | `diff-check.log` |

`settings-logout-proof.json` records one request per width, visible focus, a disabled button after page updates, a signed-out reload, unchanged saved games and receipt, and zero game commands.

## Captures

Approved samples: `playtest/reports/owner-playtest/F-106-F-108/run-02/F-108-settings-sample-{1280,390}.png`.

- `/private/tmp/claude-501/ci87/run38/shots/settings-logout-1280.png`: Log out is the last Settings row. The target is 526 by 48 pixels. Its text, weight and plain row style match the sample. The content ends about 16 pixels higher. The header says Play because this check opens Settings from its direct route. The sample says Game. The local test name also differs.
- `/private/tmp/claude-501/ci87/run38/shots/settings-logout-390.png`: Log out is the last Settings row at the same bottom position as the sample. The target is 358 by 48 pixels. The text and row style match. The back label and local test name differ as above.

## Handoff

The build checks are complete with the one stated full-test fault. The second independent review remains with the orchestrator. No real account is used. This run makes no deploy, push, PR or merge.

The commit hook uses empty test paths for its secret sources. The run must not read credentials. Thus the exact secret-value comparison has no input. The other commit checks run.

## PR 113 review repair

Finding 1 is P2 and confirmed. The new busy selector in shared `applyLocks` changes the plugin board by 20 bytes. It also changes Block player during a read. The approved scope covers only the website.

Plan and checks:

- [x] Restore shared `applyLocks` to the pinned base, `a89a9381`.
- [x] Use one disabled fieldset around Log out in the website entry. Use the existing `group` style. Keep the separate pending flag. A native fieldset keeps the button disabled even when a shared lock writes to the button. It covers direct lock calls and store updates without a new observer.
- [x] Test a pending sign-out across real lock updates. Show a test failure before the repair. Test the alert and a second attempt after an error.
- [x] Check repeated Enter, double click, forced click, touch, and a screen change and return in the emitted website.
- [x] Run the required typecheck, focused tests, browser checks, plugin byte comparison, and doc tests. Do not run the full test suite on this Mac.
- [x] Prepare the repair commit. Keep the commit hook inputs unchanged. Do not push or merge.

For website-only controls, keep pending locks in website-only code. Compare the plugin board with the pinned base in the same build environment.

Repair results:

The shared state file now matches the pinned base byte for byte. The website entry wraps only Log out in a disabled fieldset. The fieldset uses the existing `group` style. The pending flag still stops forced clicks. An error clears the flag, both disabled states, and `aria-busy`. The alert says `Could not log out. Try again.` A second attempt works.

The entry test calls the real `applyLocks` function on the name screen and Settings. It checks the native disabled state after the lock clears the button's own disabled property. The browser checks the same condition in the emitted website. Each width sends one local sign-out request across repeated Enter, double click, forced click, and a screen change and return. The phone also uses touch. Saved games and the pending receipt stay unchanged. Log out keeps its 526 by 48 pixel desktop target and 358 by 48 pixel phone target.

Logs: `/private/tmp/claude-501/ci87/run38/logout-fix-files/`.

| Command | Result | Log |
| --- | --- | --- |
| `KINGDOWN_TEST_FILE=src/online/entry.test.ts KINGDOWN_TEST_NAME='puts Log out last' npm test` with the shared lock restored, before the fieldset repair | Expected failure; exit 1. The real lock enables the pending button. One case fails; 12 skip. | `regression-before.log` |
| `npx tsc --noEmit -p .` | Pass; exit 0. | `typecheck.log` |
| `KINGDOWN_TEST_FILE='{src/online/entry.test.ts,src/account-game/*.test.ts,src/account/*.test.ts}' npm test` | Pass; exit 0. Twelve files and 160 cases pass. All 57 artwork cases pass. The command waits for the shared lock. | `focused.log` |
| `pgrep -f '[t]ools/deploy[.]sh'` before each browser command | No PID; exit 1 on both checks. No publish wait is necessary. | `publish-guard.log`, `publish-guard-retry.log` |
| `bash tools/test-lock.sh npm run check:browser web-game plugin-ui` with the documented loopback test database | Pass; exit 0. The website check takes 69.0 seconds. The plugin check takes 288.6 seconds. The total includes the shared lock wait. | `browser-retry.log`, `web-game.log`, `plugin-ui.log`, `run.json` |
| Plugin head and pinned base builds with the review method | Pass; both builds exit 0. All 121 files match byte for byte. Both board files have 895,593 bytes and SHA-256 `915f65ce0c860d35d1c2aa1043981dfcd27f04cc08317a7865ed98a30747380a`. | `plugin-head.log`, `plugin-base.log`, `plugin-compare.log`, `plugin-compare.json` |
| `npm run test:docs` | Pass; exit 0. Fifteen files and 176 cases pass. | `docs-before-ticket.log`, `docs.log` |

The first browser run has one test fault: its role locator omits Log out while Settings is hidden. The check now uses the button ID on the name screen. The complete repeat passes. The first plugin check also passes. Keep the first result in `browser.log`, `first-web-game.log`, `first-plugin-ui.log`, and `first-run.json`.

The plugin base build substitutes only `a89a9381:src/account-game/state.ts` in memory. It uses the same source tree, dependencies, and build method as the head build. The website entry does not enter the plugin build. The board hash also matches the review's pinned base hash.

This repair runs only the selected tests on this Mac. CI runs the full test suite. The commit hook keeps its normal inputs and reads its own key files. This run sets no hook input. No real sign-in, deploy, push, PR, or merge occurs.
