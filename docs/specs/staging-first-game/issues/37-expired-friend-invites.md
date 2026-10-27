# Recover from an expired friend code

Status: in review. Release review finding 2. Parent: U07; supports the shared web and embedded journey.

## Plan and acceptance

Release re-review finding 2 shows that an expired invitation offers Make a new code. The service refuses renewal with INVITE_UNAVAILABLE. Fix the shared screen and its retained Share notices. Keep the service's expiry and waiting-game rules.

1. Reproduce an already expired cached code and expiry while the screen stays open. Check that neither case creates an invite automatically.
2. Hide the expired code and its Share/Copy actions. Show the expired notice and New game. Offer Make a new code only while the invitation is unexpired, or when this page has no code. Treat an INVITE_UNAVAILABLE renewal reply as expired. Prevent stale Play-list Share actions from copying an expired code. Preserve live codes, remount behavior and screen disposal.
3. Check cached expiry, expiry on screen, refused renewal and the New game action. Update the embedded fixture and HTTP journeys only where they expect expired-code renewal. Check that an unexpired code can still rotate. If the server already ended the waiting game, preserve its normal terminal route.
4. Record failing tests before the repair. Run the full npm test, npm run test:docs, plugin-ui and plugin-ui-http with the quiet and shared browser locks. Commit, push and open a PR into staging/first-game. Leave the commit hook unchanged. No deploy, sign-in or remote database.

No new invitation service, dependency, timer framework, gameplay rule, artwork, database schema or second account is needed. A new code remains an explicit player action.

## Release re-review repair

The expired state shows New game and opens the existing new-game section. It hides the code, Share and Copy. A refused renewal with INVITE_UNAVAILABLE keeps an expired entry in page memory, so another render cannot offer renewal again. Other failures keep their error path. A replaced code can rotate only before its saved end time. The same timer now covers that deadline too. A retained Share action directs the player to a new game after expiry.

- Red: `KINGDOWN_TEST_FILE=src/plugin/screens/lifecycle.test.ts KINGDOWN_TEST_NAME='expired friend code|expires a visible friend code|code renewal is unavailable' npm test`. Four cases fail on the old screen: cached expiry, expiry on screen, and refused renewal with and without a cached code. One navigation case passes. The selected file has 17 other cases outside this run. Both type checks pass.
- Focused green: `KINGDOWN_TEST_FILE='src/plugin/{screens/lifecycle,app,invite}.test.ts' npm test`. All 167 selected tests, both type checks and 67 art checks pass before the extra replaced-code timer case.
- Browser: `npm run check:browser plugin-ui plugin-ui-http` passes in 307.8 and 331.9 seconds. The shared check script previously expects renewal after expiry. It now checks New game, then uses a fresh page for rotation while the server invitation is still unexpired. The fixture and HTTP expiry screenshots show the correct action. The checks use a separate local PostgreSQL database.
- Final full suite: `npm test` passes 5,697 tests in 287 files, with 8 skips. Both type checks and all 67 art checks pass. This run includes the replaced-code timer case. The earlier full run passes too. `npm run test:docs` passes all 181 tests in 16 files.
- Logs: `/private/tmp/rel3-expired-red.log`, `/private/tmp/rel3-expired-green.log`, `/private/tmp/rel3-expired-full.log`, `/private/tmp/rel3-expired-full-final.log` and `/private/tmp/rel3-expired-browsers.log` and `/private/tmp/rel3-expired-docs-final.log`. Browser record: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/rel3-expired-7kLd7K/run.json`.

Review: the existing screen owns the expiry state and New game route. The code cache keeps the refused invitation closed for this page. No service, schema, dependency or game rule changes. Independent review remains before integration. No deploy, sign-in or remote database.

## Previous source checkpoint

Four expiry regressions fail before the change. After the repair, all 126 selected invite, screen-lifecycle and app tests pass, with typecheck and the standard art checks. The friend screen uses one expiry timer and the existing Make a new code action. Its timer stops on disposal and does not navigate from another screen. A cached expired invite does not trigger an automatic renewal. Share and Copy check expiry when used, including retained Play-list buttons. The server still decides whether the game remains open.

The compiled journeys shorten only the client deadline of a real invitation. The web check also expires its disposable database row before renewal. Both use the real renewal path, reject the old code and join with the replacement. This fixture is not a change to the server's seven-day lifetime. Both compiled journeys and staging publication pass as recorded below.

## Previous compiled and hosted acceptance

Clean source `2de90c39` passes the compiled web journey in 43.307 seconds and embedded HTTP in 243.241 seconds. Both prove expiry without automatic renewal, explicit renewal, rejection of the old code and a successful join with its replacement. The web fixture also expires the actual disposable database invitation before renewal. Existing gameplay and layout checks stay intact. The exact Vercel artifact check passes.

Preview `dpl_H9fppKVBYrwFSfWZGMN723xxfTs5` serves the staging alias. Its verified index matches the build. Server, runtime, worker and search-worker bytes match the prior accepted artifact. Engine `cdac045d` and all eleven archived workers stay unchanged; reuse the accepted 112 mechanics executions and recovery evidence.

The live web update opens without Retry. Web generates a code for one disposable friend game. After the existing host Retry, actual ChatGPT opens the same game, renews its code and cancels the game. Web reload confirms Game aborted; the connected list contains the original ten active games. No retained game receives a move. The live test does not claim a seven-day expiry or a second-account join.

The final review keeps the change local: one timer, the existing explicit renewal action, and a validity check at Share/Copy. No new request layer or backend policy is needed. Source tests and compiled checks cover the changed boundary. All 161 documentation checks in 13 files pass at closeout; `git diff --check` is clean.

Evidence is in `evidence/staging-friend-invite-expiry/verification.md` in the parent project. The browser-controlled ChatGPT first-open Retry issue, actual second-account privacy, Codex interruption, phone and operator gates remain open. No production changes occur.
