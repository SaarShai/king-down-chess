# Four staging test players

Type: task
Status: resolved

## Authority and scope

The owner authorizes staging changes so four approved test players can sign in. The owner asks for minimal involvement. The staging inventory has one test user to reuse and the owner's account. The coordinator adds three test users through normal account setup. Do not use the owner's account or games for the playtest.

Reuse the existing test user and the normal email and password sign-in flow. Keep production unchanged and preserve server password allowlist enforcement. The website change covers the form and its checks. The coordinator owns deployment, live account setup and three approved staging allowlist entries.

## Plan and checks

1. Keep the staging build and exact staging account project checks. Replace the fixed test email with a required email field in the existing form. Remove the obsolete fixed-account interface.
2. Pass each entered email and password to the normal account SDK. Keep password clearing, duplicate-submit protection, current-route return and failure recovery.
3. Update the unit tests and the compiled browser fixture. Check four email values, invalid input, non-staging refusal, failed sign-in, a complete session and route return. Keep the browser fixture's real API private-game refusal and recovery checks.
4. Run the selected tests with `npm test` and run typecheck. Commit the clean source before the coordinator runs compiled browser checks.

Pass criteria: the selected checks pass; only the isolated staging form exposes password sign-in; the client sends the entered account to the SDK; a failed attempt can retry; server allowlist enforcement remains; four saved test sessions and hosted identity mappings pass; and no production path changes.

## Evidence

The form now requires an editable email and sends it with the password to the existing SDK. The server allowlist remains the account authority. The old fixed-email helper and method are removed.

An independent read-only review finds no item to fix in the scoped diff. It confirms the exact project guard, normal SDK session check, form recovery and fixture account mapping. The compiled checks below verify native field validation and stored-session behavior.

Selected source checks pass: 39 tests in `src/account/public-config.test.ts`, `src/account/client.test.ts` and `src/online/entry.test.ts`, plus typecheck and 54 artwork checks. The test command waits for an active run in another worktree, then completes. No other process is stopped. The command is `KINGDOWN_TEST_FILE='{src/account/{public-config,client}.test.ts,src/online/entry.test.ts}' npm test`. This is a selected pass, not a full-suite pass.

The registered `staging-login` and `account-discovery` checks pass on clean source `51d78aa9`. They verify the staging password form, native field validation, failed-password retry, the SDK session, route return, real API private-game refusal and own-game access. The non-staging check verifies that the password form is absent and local/offline behavior stays intact. The run output is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/four-test-players-zJUDK4/`.

The isolated staging build, `check:vercel` compiled artifact check and deploy project guards pass. Guarded preview `dpl_EmVczpcbmyydNxR9Gu5Kna71aSh4` is READY and serves the staging alias. Root, `/play/` and service-worker bytes match the tested artifact. Account access is open. No production target, auth hook or runtime role changes.

The initial staging inventory has one reusable confirmed test identity, `privacy-check@kingdown.example`, and the owner's provider identity. The owner stays out of the playtest. The coordinator adds only `playtest-p2@kingdown.example`, `playtest-p3@kingdown.example` and `playtest-p4@kingdown.example` to the existing server allowlist. The owner creates these three users through normal confirmed-account forms. P1 is reused. No password reset or game change is needed.

## Account setup result

The owner supplies the existing test password and explicitly authorizes staging sign-in. The coordinator enters it through normal login controls. No password is written to source files, setup reports or shell arguments. The four game handles are set through the normal UI: `playtest-p1-bot` through `playtest-p4-bot`.

Each isolated saved session reopens and shows its assigned handle: P1 Chromium desktop, P2 Chromium phone size with touch, P3 WebKit desktop and P4 Firefox desktop with dark mode. A hosted read-only query confirms all four distinct user IDs, expected emails, exact handles, confirmed status and password allowlist entries. P3's first name-availability wait times out; the normal UI retry and final saved-session check pass.

No owner action remains for account setup. The parent workspace's `playtest/reports/SETUP-STATUS.md` is the operational checkpoint. `playtest/reports/staging-account-verification.json`, the hosted-query screenshot and the four profile screenshots hold the completion evidence. The full playtest driver and game rounds are separate work.

The final documentation check passes: `npm run test:docs`, 13 files and 161 tests. `git diff --check` also passes.
