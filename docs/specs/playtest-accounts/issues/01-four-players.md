# Four staging test players

Type: task
Status: needs-info

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

Selected source checks pass: 39 tests in `src/account/public-config.test.ts`, `src/account/client.test.ts` and `src/online/entry.test.ts`, plus typecheck and 54 artwork checks. The test command waits for an active run in another worktree, then completes. No other process is stopped. The command is `KINGDOWN_TEST_FILE='{src/account/{public-config,client}.test.ts,src/online/entry.test.ts}' npm test`. This is a selected pass, not a full-suite pass.

The registered `staging-login` and `account-discovery` checks pass on clean source `51d78aa9`. They verify the staging password form, native field validation, failed-password retry, the SDK session, route return, real API private-game refusal and own-game access. The non-staging check verifies that the password form is absent and local/offline behavior stays intact. The run output is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/four-test-players-zJUDK4/`.

The isolated staging build, `check:vercel` compiled artifact check and deploy project guards pass. Guarded preview `dpl_EmVczpcbmyydNxR9Gu5Kna71aSh4` is READY and serves the staging alias. Root, `/play/` and service-worker bytes match the tested artifact. Account access is open. No production target, auth hook or runtime role changes.

The actual staging inventory has one reusable confirmed test identity, `privacy-check@kingdown.example`, and the owner's provider identity. The owner stays out of the playtest. The existing test user has no game handle yet. The coordinator adds only `playtest-p2@kingdown.example`, `playtest-p3@kingdown.example` and `playtest-p4@kingdown.example` to the existing server allowlist. A hosted query verifies exactly these three intended addresses plus the existing test address. Existing users, passwords and games stay unchanged.

## Remaining owner step

Three normal Supabase Create new user forms have their synthetic email address filled and Auto Confirm User enabled. The owner must enter each new password and submit the form. The coordinator does not create, read, reset or store a password. After creation, the owner signs in once in each isolated browser; the coordinator verifies the saved identities and sets their game handles through the normal UI.

All four real saved sign-ins remain unverified. The account setup is incomplete until this step passes. The parent workspace's `playtest/reports/SETUP-STATUS.md` is the operational checkpoint.
