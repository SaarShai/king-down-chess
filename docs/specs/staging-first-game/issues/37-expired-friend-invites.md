# Recover from an expired friend code

Status: claimed. Parent: U07; supports the shared web and embedded journey.

## Plan and acceptance

The friend screen treats any cached invite as usable. It keeps Share and Copy visible and hides Make a new code after expiry. A Play-list Share handler can also retain the old code. Fix the shared UI; keep the server's expiry and waiting-game rules.

1. Reproduce an already expired cached code and expiry while the screen stays open. Check that neither case creates an invite automatically.
2. Hide the expired code and its Share/Copy actions, explain expiry and expose the existing explicit Make a new code action. Prevent stale Play-list Share actions from copying an expired code. Preserve live codes, remount behavior and screen disposal.
3. Add expiry and explicit renewal to the existing compiled web and embedded journeys against disposable PostgreSQL. Check that the old code cannot join and the replacement can. If the server already ended the waiting game, preserve its normal terminal route.
4. Run focused source checks, the two compiled journeys and exact staging artifact verification. Reuse unchanged mechanics, archive and account evidence. Deploy only to staging and record actual hosted smoke separately.

No new invitation service, dependency, timer framework, gameplay rule, artwork, database schema or second account is needed. A new code remains an explicit player action.

## Source checkpoint

Four expiry regressions fail before the change. After the repair, all 126 selected invite, screen-lifecycle and app tests pass, with typecheck and the standard art checks. The friend screen uses one expiry timer and the existing Make a new code action. Its timer stops on disposal and does not navigate from another screen. A cached expired invite does not trigger an automatic renewal. Share and Copy check expiry when used, including retained Play-list buttons. The server still decides whether the game remains open.

The compiled journeys shorten only the client deadline of a real invitation. The web check also expires its disposable database row before renewal. Both use the real renewal path, reject the old code and join with the replacement. This fixture is not a change to the server's seven-day lifetime. Full compiled results and staging publication are pending.
