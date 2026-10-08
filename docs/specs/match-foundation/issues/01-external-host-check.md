# Check the real account and ChatGPT host

Status: needs-info

## Scope

Continue the local match and plugin work at e6773d3. Check the real Supabase account, prepare the exact access settings, then test the private service in ChatGPT. The local setup is in [the setup guide](../../../plugin-preparation.md).

## Plan and checks

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
- Vercel confirms Saar's projects is on Pro, with `kingdown` but no plugin test service. The OpenAI tunnel page works. A tunnel does not serve the browser consent page.
- Supabase has no OAuth apps or Auth hooks. Its Site URL is `https://kingdown.dev`; Google and GitHub are enabled. No live setting changes. No server database credential is available for the plugin.

## Verified local result

- `npm test` with local PostgreSQL: type check, 72 test files, 1,371 unit tests and 42 artwork tests pass. The new role test logs in with the exact reviewed grants, plays and resumes a friend game, checks retries and cleanup, and rejects the extra SQL operations.
- All three named browser checks pass: consent (3.2 s), fixture board (9.7 s), HTTP/database board (9.8 s). The runner reports no checkout changes.
- Compiled HTTP check, worker smoke and MCP protocol check pass. The compiled resource is 4,291,913 JSON bytes. The Vercel build artifact is ready locally.
- `git diff main --check` passes. Game rules and public art match main. The live host and account flows remain untested.

## Proposed live setup

Rule: keep the test service separate from the game website. Use one service, one registered ChatGPT client, and two test users.

The recommended service is a new Vercel project named `kingdown-plugin` in Saar's projects. Use the stable HTTPS address Vercel assigns to that project. Pin that exact origin before any OAuth client registration. This is an OAuth-protected endpoint on the public internet, with a private ChatGPT connection.

The approved game remains in project `kingdown`. Add only the consent redirect `/authorize` to the new service's `/authorize`, with its query preserved. Keep the Supabase Site URL. Use the existing redirect template. Extend `tools/deploy.sh` with a named plugin target; retain its current website path and its test gates. The current deploy script cannot publish the plugin artifact. This release step needs the owner's approval before its build and use.

In Supabase project `utqzovjmclfyojedmwok`:

1. Enable OAuth Server with Authorization Path `/authorize`. Keep dynamic client registration off.
2. Register one ChatGPT client with the exact callback from ChatGPT. Its advanced settings stay disabled until a server URL is supplied. Do not guess a callback or use a wildcard.
3. Apply `0002_matches.sql`, the audience hook and its client/resource row. The resource is the chosen origin plus `/mcp`. No existing hook needs to be combined.
4. Apply the reviewed runtime-role SQL. The owner sets the new password through a secure prompt. Store the runtime URL only in the test service's server environment. Never use the administrator URL at runtime.
5. Allow the new consent return URL, including its authorization query. Verify discovery and the client audience before setting readiness on.
6. Connect the private plugin in ChatGPT. Check allow, deny, play, retry, resume, friend join, account change, refresh and revoked access with two test users.

No DNS change, plan upgrade, public marketplace submission or match run is part of this setup. Existing plan usage can accrue. A public release and new security-sensitive access need the owner's specific approval. The runtime-role template has no password; do not paste a password into the chat, a tracked file or a command argument.

## Acceptance

- `npm test` passes with the disposable local PostgreSQL database.
- `npm run check:browser plugin-oauth plugin-ui plugin-ui-http` passes.
- The compiled HTTP check, worker smoke and MCP protocol check pass.
- A draft pull request holds the reviewed local change. No merge into main or deploy occurs before approval.
- The actual host cases remain open until the live setup is approved and complete. Local provider mocks do not prove them.
