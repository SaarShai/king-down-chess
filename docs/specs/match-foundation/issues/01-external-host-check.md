# Check the real account and ChatGPT host

Status: resolved

## Scope

Continue the local match and plugin work at e6773d3. Check the real Supabase account, prepare the exact access settings, then test the private service in ChatGPT. The local setup is in [the setup guide](../../../plugin-preparation.md).

## Plan and checks

The owner replies "approved." on October 7, 2026, to the required pull request merges and this live setup. This includes the separate `kingdown-plugin` service, one ChatGPT OAuth client, two test users, and the website consent redirect. The release script must still test fresh `origin/main` before each publication.

Release-path work: add an explicit plugin target and a setup-only project link; keep the website test gates and no-publish default. Check the exact Vercel team and project before a prebuilt production release. Use the local disposable database for unit, compiled HTTP, worker, protocol and three named browser checks. Check unsigned live discovery, challenge and consent after publication. Tests must reject wrong targets and failed checks. The live host cases remain open until tested.

1. Merge approved main into the plugin branch. Use main's tracker files and archive. Run `npm test` against local PostgreSQL.
2. Add named plugin browser checks to the shared runner. Use one plugin setup script to build into a temporary folder, start servers at free ports, and stop them on exit. Keep consent, fixture, and real HTTP/database coverage. Remove alternate unit-test commands. Pass `npm test` and all three named plugin checks.
3. Prepare a separate runtime database role. Test the exact SQL grants with an actual role login, full friend flow and denied operations. Keep the admin connection separate.
4. Check the signed-in project and its sign-in providers.
5. Choose the private HTTPS service address and exact client return URL. Prepare the consent route, client allowlist, audience hook and match schema as one reviewable change.
6. Get approval for live access changes and any required website release. Apply the approved settings.
7. Check sign-in, denial, token refresh, account change, two-player play and revoked access in the real host. Record results separately from local checks.

## Evidence

- On October 7, 2026, the owner reports: "signed in to supabase now". The dashboard opens project `utqzovjmclfyojedmwok` (`kingdown`, production).
- Google and GitHub providers are enabled. The OAuth Server switch is off. No live setting changes in this check.
- The owner reports that "retro workshop" is complete and committed, and the build is approved. This removes the wait for Workshop approval. It does not identify a release commit or request a merge or deployment.
- The branch integrates main at `243d4f2`, including Workshop finish merge `93402b5`. The game engine, search, Workshop and public art match that main revision.
- The integrated check runner passes all three plugin browser checks. It builds into a temporary folder, uses free ports and cleans up its test users and servers.
- The first hosted check finds a merge mismatch: main pins `sharp` to `0.35.4`, but the merged lock retains `0.35.5`. Regenerate the lock from the approved pin. Check a clean install and hosted CI before handoff.
- The next hosted check finds a test-harness gap. An explicit system Git config read uses the runner's settings. Point that read at the harness's empty file, keep Apple's system-config guard, and check the command status. This also catches the false local pass from empty stdout on a failed read.
- Vercel confirms Saar's projects is on Pro, with `kingdown` but no plugin test service. The OpenAI tunnel page works. A tunnel does not serve the browser consent page.
- Supabase has no OAuth apps or Auth hooks. Its Site URL is `https://kingdown.dev`; Google and GitHub are enabled. No live setting changes. No server database credential is available for the plugin.

## Verified local result

- `npm test` with local PostgreSQL: type check, 72 test files, 1,388 unit tests and 42 artwork tests pass. The role test logs in with the exact reviewed grants, plays and resumes a friend game, checks retries and cleanup, and rejects the extra SQL operations. Release tests cover all failed gates, project checks, unsigned live checks, secret input through standard input, rejected database query overrides and required production TLS.
- All three named browser checks pass: consent, fixture board and HTTP/database board. The runner reports no checkout changes.
- Compiled HTTP check, worker smoke and MCP protocol check pass. The compiled resource is 4,291,913 JSON bytes. The Vercel artifact uses `nodejs24.x`, matching the live project. The actual artifact also passes the HTTP/database check under local Node 24.
- `git diff main --check` passes. Game rules and public art match main. The live host and account flows remain untested.

## Approved live setup

Rule: keep the test service separate from the game website. Use one service, one registered ChatGPT client, and two test users.

The service is Vercel project `kingdown-plugin` (`prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6`) in Saar's projects (`team_mIlANWWDRbX1NT4jgJn9jAna`, slug `saars-projects-2c777ec5`). Its assigned production origin is `https://kingdown-plugin.vercel.app`. `tools/deploy.sh --setup-plugin` creates and checks this project without a deployment. This is an OAuth-protected endpoint on the public internet, with a private ChatGPT connection.

The approved game remains in project `kingdown`. [The website configuration](../../../../vercel.json) adds the consent redirect `/authorize` to the new service's `/authorize`, with its query preserved. Keep the Supabase Site URL. The release script has a named plugin target and retains the website path and its test gates. Both release targets test fresh `origin/main` and publish only with `--publish`.

In Supabase project `utqzovjmclfyojedmwok`:

1. Enable OAuth Server with Authorization Path `/authorize`. Keep dynamic client registration off.
2. Register one ChatGPT client with the exact callback from ChatGPT. Its advanced settings stay disabled until a server URL is supplied. Do not guess a callback or use a wildcard.
3. Apply `0002_matches.sql`, the audience hook and its client/resource row. The resource is the chosen origin plus `/mcp`. No existing hook needs to be combined.
4. Apply the reviewed runtime-role SQL. The owner sets the new password through a secure prompt. Store the runtime URL only in the test service's server environment. Never use the administrator URL at runtime.
5. Allow the new consent return URL, including its authorization query. Verify discovery and the client audience before setting readiness on.
6. Connect the private plugin in ChatGPT. Check allow, deny, play, retry, resume, friend join, account change, refresh and revoked access with two test users.

The owner's approval covers the required merges, website route release, separate service and access setup. No DNS change, plan upgrade, public marketplace submission or match run is part of this setup. Existing plan usage can accrue. The runtime-role template has no password; do not paste a password into the chat, a tracked file or a command argument.

## Live setup evidence

- Supabase OAuth Server is enabled with `/authorize`; dynamic registration is off. Discovery returns HTTP 200 with issuer `https://utqzovjmclfyojedmwok.supabase.co/auth/v1` and supports a public client.
- One public PKCE client is registered: `a6478e14-9e9a-43a7-a4b7-b888aed30791`, named `King Down private ChatGPT`. The callback comes from the live ChatGPT form: `https://chatgpt.com/connector/oauth/pIxNJ_2exXM-`.
- The match migration, audience-hook schema and runtime-role SQL are applied in one transaction. The runtime role has no superuser, create-database, create-role, inheritance or row-security-bypass rights. It has no role memberships, can read only the four reviewed application tables, cannot create in `public`, and cannot execute the token hook.
- The client-resource row maps that client to `https://kingdown-plugin.vercel.app/mcp`. Hook checks pass for the plugin audience, unchanged website audience and denied metadata spoof. The Auth Hooks page shows `public.kingdown_access_token_hook` enabled. These checks do not prove a real provider-issued token yet.
- The allowed return URLs now include `https://kingdown-plugin.vercel.app/authorize?authorization_id=*`. The Site URL stays `https://kingdown.dev`; its four prior allowed URLs stay in place. The real provider return still needs a check.
- An unsigned provider authorization request uses the actual client, exact ChatGPT callback, S256 challenge, `openid offline_access` scopes and MCP resource. It returns HTTP 302 to `https://kingdown.dev/authorize` with an `authorization_id` and no error. It does not sign in a user or issue tokens.
- PR #9 is merged at `0ac32e0`. The owner saves the restricted role URL through the hidden setup prompt. The official Supabase CA fixes the initial TLS trust failure. The restricted login and compiled production startup pass with certificate and host checks, real OAuth discovery and the exact client-resource row. The six production settings are installed through `tools/deploy.sh --configure-plugin`.
- PR #10 is merged after all three hosted checks pass. Both release targets use main at `db862c34e07619228994d46bac9236f4a3b1fd85`.
- `tools/deploy.sh --target plugin --publish` passes 1,391 unit tests, 42 artwork checks, the compiled HTTP/database check, worker smoke, protocol check and all three plugin browser checks. It publishes deployment `dpl_BXFNNWHYq2YzCg4Ff8MviF2KvfFY` at `https://kingdown-plugin.vercel.app`. Unsigned live checks pass for resource discovery, the HTTP 401 OAuth challenge and the exact built consent script. The production domain needs no Vercel sign-in.
- `tools/deploy.sh --publish` passes 1,379 unit tests, 42 artwork checks and all 14 website browser checks. Its 12 database cases are skipped without the test database setting; the plugin release passes all 12. The website deployment is `dpl_F8kTJdrQPujhTUVmqQbuAdMp3NAM` at `https://kingdown.dev`. The live bundle `index-C0xDHzWh.js` and all three legal pages match the tested build. The live check confirms that `/authorize` redirects to the service and preserves its query.
- ChatGPT discovers the live OAuth endpoints and OIDC support. The prepared private connection retains the registered callback and client ID, with `openid` and `offline_access` as base scopes and no client secret.
- Starting that private connection in ChatGPT reaches the live King Down consent page with an authorization ID and the status "Sign in to continue." The browser stays at the account handoff. No provider account signs in, no user token is issued, and the private connection is not yet verified as complete.
- The owner needs two test accounts. Use Google or GitHub accounts with different email addresses; these accounts need no Supabase dashboard access. Keep the owner account out of the site tests. Real sign-in, consent decisions, token refresh, account change, two-player play and revoked access remain open.

## Acceptance

- `npm test` passes with the disposable local PostgreSQL database.
- `npm run check:browser plugin-oauth plugin-ui plugin-ui-http` passes.
- The compiled HTTP check, worker smoke and MCP protocol check pass.
- The approved pull requests must pass review and checks before merge. Each release uses the tested fresh `origin/main` through `tools/deploy.sh`.
- The actual host cases remain open until tested. Local provider mocks do not prove them.

## Answer

The approved service and consent route are live. The owner signs in with a dedicated test account. Adding the exact consent origin to the Supabase allowed URLs fixes the first consent failure. ChatGPT connects to that account and the assistant plays a complete computer game through the real board. PR #11 fixes saved-position recovery when ChatGPT reopens a board; all three views restore checkmate after a full chat reload. The later release and host evidence are in the reload-fix ticket. [The live acceptance ticket](06-live-acceptance.md) records the separate passing account, friend and phone checks. Setup completion and live acceptance each have their own evidence.
