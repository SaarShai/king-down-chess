# Four staging test players

Type: task
Status: claimed

## Authority and scope

The owner authorizes staging changes so four approved test players can sign in. The owner asks for minimal involvement. The staging inventory has one test user to reuse and the owner's account. The coordinator adds three test users through normal account setup. Do not use the owner's account or games for the playtest.

Reuse the existing test user and the normal email and password sign-in flow. Keep production and the server password allowlist unchanged. This work covers the website form and its checks only. The coordinator owns live account setup and deployment.

## Plan and checks

1. Keep the staging build and exact staging account project checks. Replace the fixed test email with a required email field in the existing form. Remove the obsolete fixed-account interface.
2. Pass each entered email and password to the normal account SDK. Keep password clearing, duplicate-submit protection, current-route return and failure recovery.
3. Update the unit tests and the compiled browser fixture. Check four email values, invalid input, non-staging refusal, failed sign-in, a complete session and route return. Keep the browser fixture's real API private-game refusal and recovery checks.
4. Run the selected tests with `npm test` and run typecheck. Commit the clean source before the coordinator runs compiled browser checks.

Pass criteria: the selected checks pass; only the isolated staging form exposes password sign-in; the client sends the entered account to the SDK; a failed attempt can retry; and no server allowlist or production path changes.

## Evidence

The form now requires an editable email and sends it with the password to the existing SDK. The server allowlist remains the account authority. The old fixed-email helper and method are removed.

An independent read-only review finds no item to fix in the scoped diff. It confirms the exact project guard, normal SDK session check, form recovery and fixture account mapping. The compiled check remains necessary for native field validation and stored-session behavior.

Selected tests are pending. The repository test lock belongs to an active run in another worktree. No other process is stopped.
