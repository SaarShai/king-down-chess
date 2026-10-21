# Recover from an expired friend code

Status: complete in staging. Parent: U07; supports the shared web and embedded journey.

## Plan and acceptance

The friend screen treats any cached invite as usable. It keeps Share and Copy visible and hides Make a new code after expiry. A Play-list Share handler can also retain the old code. Fix the shared UI; keep the server's expiry and waiting-game rules.

1. Reproduce an already expired cached code and expiry while the screen stays open. Check that neither case creates an invite automatically.
2. Hide the expired code and its Share/Copy actions, explain expiry and expose the existing explicit Make a new code action. Prevent stale Play-list Share actions from copying an expired code. Preserve live codes, remount behavior and screen disposal.
3. Add expiry and explicit renewal to the existing compiled web and embedded journeys against disposable PostgreSQL. Check that the old code cannot join and the replacement can. If the server already ended the waiting game, preserve its normal terminal route.
4. Run focused source checks, the two compiled journeys and exact staging artifact verification. Reuse unchanged mechanics, archive and account evidence. Deploy only to staging and record actual hosted smoke separately.

No new invitation service, dependency, timer framework, gameplay rule, artwork, database schema or second account is needed. A new code remains an explicit player action.

## Source checkpoint

Four expiry regressions fail before the change. After the repair, all 126 selected invite, screen-lifecycle and app tests pass, with typecheck and the standard art checks. The friend screen uses one expiry timer and the existing Make a new code action. Its timer stops on disposal and does not navigate from another screen. A cached expired invite does not trigger an automatic renewal. Share and Copy check expiry when used, including retained Play-list buttons. The server still decides whether the game remains open.

The compiled journeys shorten only the client deadline of a real invitation. The web check also expires its disposable database row before renewal. Both use the real renewal path, reject the old code and join with the replacement. This fixture is not a change to the server's seven-day lifetime. Both compiled journeys and staging publication pass as recorded below.

## Compiled and hosted acceptance

Clean source `2de90c39` passes the compiled web journey in 43.307 seconds and embedded HTTP in 243.241 seconds. Both prove expiry without automatic renewal, explicit renewal, rejection of the old code and a successful join with its replacement. The web fixture also expires the actual disposable database invitation before renewal. Existing gameplay and layout checks stay intact. The exact Vercel artifact check passes.

Preview `dpl_H9fppKVBYrwFSfWZGMN723xxfTs5` serves the staging alias. Its verified index matches the build. Server, runtime, worker and search-worker bytes match the prior accepted artifact. Engine `cdac045d` and all eleven archived workers stay unchanged; reuse the accepted 112 mechanics executions and recovery evidence.

The live web update opens without Retry. Web generates a code for one disposable friend game. After the existing host Retry, actual ChatGPT opens the same game, renews its code and cancels the game. Web reload confirms Game aborted; the connected list contains the original ten active games. No retained game receives a move. The live test does not claim a seven-day expiry or a second-account join.

The final review keeps the change local: one timer, the existing explicit renewal action, and a validity check at Share/Copy. No new request layer or backend policy is needed. Source tests and compiled checks cover the changed boundary. All 161 documentation checks in 13 files pass at closeout; `git diff --check` is clean.

Evidence is in `evidence/staging-friend-invite-expiry/verification.md` in the parent project. The browser-controlled ChatGPT first-open Retry issue, actual second-account privacy, Codex interruption, phone and operator gates remain open. No production changes occur.
