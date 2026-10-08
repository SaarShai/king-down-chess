# King Down private plugin setup

The private plugin shares the website's engine and painted board, with a Node worker per operation and PostgreSQL as match authority. Players can play the computer, create a friend invitation, join as Black, and resume their latest game. Moves go directly through MCP Apps without a model turn. The private service is live. Test accounts pass a full computer game, two-player moves, seat isolation, automatic updates, host disconnect/reconnect and normal selected-game reopening in ChatGPT. Immediate full-page reload timing, provider consent and revocation, controlled live lost-response retry, and actual phone checks remain in [the live acceptance ticket](specs/match-foundation/issues/06-live-acceptance.md).

## Local checks

Use Node 24 and a disposable local PostgreSQL 17 database. No live Supabase credentials are needed for these checks.

```sh
npm ci
export PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test
npm run plugin:db:init-test
npm test
npm run build
npm run plugin:build
npm run plugin:smoke
npm run plugin:server:check
npm run plugin:check:protocol
npm run check:browser plugin-oauth plugin-ui plugin-ui-http
```

`plugin:db:init-test` accepts only a loopback database whose name ends in `_test`. It makes a minimal stand-in for Supabase identity and applies the match migration twice. The database tests use independent connections and separate Node processes, check transaction rollback, test seat access and invite races, and remove their generated accounts afterward. The HTTP check copies the artifact outside the checkout, then opens, moves, plays the computer, retries, restarts the service, resumes, and joins a friend through that source-free copy.

The OAuth check needs Playwright Chromium (`npx playwright install chromium` if missing). It exercises the compiled consent page with the actual Supabase SDK against a local provider mock: social sign-in with PKCE, the return to the original authorization request, approval, denial, unapproved clients and escaped client names. It also executes the audience hook in PostgreSQL inside a rolled-back transaction, including ordinary website, anonymous, service-role, spoofed-metadata and refresh cases. This verifies our integration contract; the actual provider remains a separate check.

The [validation workflow](../.github/workflows/plugin-checks.yml) supplies PostgreSQL and runs unit, HTTP, OAuth and browser checks, including a browser connected to the compiled server and database. It publishes nothing. The existing manual website publishing workflow is unchanged. A workflow file prepared locally is not evidence that hosted CI has run.

## Play the local board

The standard SDK harness is a development host for the real board. It is not the ChatGPT host.

Run the named browser checks through the shared runner:

```sh
npm run check:browser plugin-ui
npm run check:browser plugin-oauth plugin-ui-http
```

Each check builds the plugin in a temporary folder. The fixture and HTTP checks start their own harness on a free loopback port. The HTTP check also starts the compiled server on a free port and makes two disposable users in `PLUGIN_TEST_DATABASE_URL`. Each check closes its servers and browser, removes its temporary build, and deletes the HTTP test users and their games. Logs and screenshots use the shared runner's output folder. No hand-started server is needed.

`plugin-ui` checks move choices, Haste, recovery, computer play, a terminal board, remounting, display mode, friend replies, and a 390-pixel viewport. `plugin-ui-http` checks the board through the compiled HTTP server and real PostgreSQL. `plugin-oauth` checks consent, PKCE and the audience hook. The last two need the disposable database from the local setup above. These checks run only by name; the normal website checks need no plugin database.

To play the fixture by hand, build the plugin and start the harness:

```sh
npm run plugin:build
npx tsx tools/plugin-ui-harness.ts plugin-server-dist/board.html
```

Open the loopback address that the harness prints. Stopping it removes its in-memory games. Only the local Node harness holds persona headers; the iframe receives public board data. Local personas require an explicit development flag, loopback peer, loopback origin and loopback database. The production function never enables them. Do not connect persona mode to a public tunnel.

## Service and deployment contract

The [match guide](match-foundation.md) documents the worker. The server owns matches, seats, accepted commands and hashed invitation tokens in [migration 0002](../supabase/migrations/0002_matches.sql). Browser roles have no access to these tables. The runtime uses a separate PostgreSQL login with the reviewed [runtime grants](../plugin-deploy/runtime-role.sql). Apply this one-time file after the match migration and audience hook, through the admin connection. Set its password with the interactive `psql` command `\password kingdown_plugin_runtime`. Put only this role's URL in `KINGDOWN_PLUGIN_DATABASE_URL`; keep the admin URL separate for migrations. The website's publishable key cannot substitute for it.

The runtime role has no administrator rights and does not bypass row security. It can read and write match data and read the OAuth client allowlist. The service checks each player's seat and turn. Supabase may grant other access through `PUBLIC`, so inspect the live role's effective access before release. Do not remove shared `PUBLIC` grants to fix a single role. Through the shared pooler, use `kingdown_plugin_runtime.PROJECT_REF` as the username and copy the host from the Connect dialog. Use exactly `?sslmode=require` as the URL query. The server uses the [official Supabase CA](../tools/supabase-ca.crt) and checks the certificate chain and host. The build carries that CA with the server. Do not turn TLS checks off to fix a trust error. [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [shared grants](https://supabase.com/docs/guides/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c)

Each move checks the authenticated seat, actual engine turn and revision. It computes outside the database lock, then atomically commits the command receipt and new save under a row lock. Retry IDs are scoped to the actor; identical retries return current authority. Haste and free power actions may keep the same player to move. Friend boards refresh every three seconds while visible and waiting; hidden, disconnected, busy and own-turn boards do not poll.

`npm run plugin:build` emits `plugin-server-dist/` with the server, embedded board resource and isolated worker runtime. `npm run plugin:build:vercel` prepares an unlinked Vercel Build Output API tree under `plugin-deploy/.vercel/output/`. These commands do not deploy. The approved backend uses the separate Vercel project `kingdown-plugin` in Saar's projects. Environment names are in [the example](../plugin-deploy/.env.example); secrets belong in the host environment, never in Git or the UI resource.

`tools/deploy.sh --setup-plugin` links this empty project without a deployment. `tools/deploy.sh --target plugin` checks fresh `origin/main` with the disposable test database and builds the production artifact. Add `--publish` to release the tested artifact after the project environment and OAuth setup are ready. The script checks the pinned project and team, then checks unsigned discovery, the OAuth challenge and the built consent script. It uses production environment values already set on the project. It does not copy a local environment file or use secret CLI arguments. [Prebuilt deployments](https://vercel.com/docs/cli/deploy#prebuilt)

The board uses one self-contained MCP App resource at `ui://kingdown/board-v1.html`; its JSON payload must remain below the build's 4.4 MB ceiling. UI controls use system typography. No browser engine worker or separate browser database connection is required: the server worker chooses and validates moves. The current preview has one fixed army drawn from the current pool, with Flame/Haste and Frost/Freeze. Army selection, card mode, ratings and matchmaking are outside this preview.

The AI uses the existing search engine, with a 250 ms cooperative budget and depth cap 6. Each worker request has a 15-second termination watchdog. The game has a 1,000-command bound. Each server instance accepts at most four active MCP requests and rejects JSON-RPC batches. A disconnected client's slot stays occupied until its service work finishes, then becomes available again. These are operation limits, not proof of production throughput or an account-wide cost cap. Measure cold requests, sustained concurrency and database connections on the chosen staging host before inviting testers.

## Accounts and the real host

Production accepts signed Supabase OAuth access tokens for the exact MCP resource audience and allowlisted client ID. Website tokens with the broad `authenticated` audience, wrong issuer, expired tokens and wrong roles are rejected. Supabase OAuth must be enabled with a working consent page, registered MCP client and client-specific audience hook before the production readiness flag can be set. Test refresh, revocation, account switching and two actual users after configuration; local persona checks do not prove those provider flows. [Supabase MCP authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)

The consent page is included at `/authorize`, with Google and GitHub sign-in using the existing Supabase project. Finish the following once a private HTTPS origin and the actual provider configuration are available:

1. Configure the server-only PostgreSQL URL, Supabase URL, public publishable key, plugin origin and registered OAuth client UUIDs from [the environment example](../plugin-deploy/.env.example). The publishable key must never be a secret or service-role key.
2. Enable Supabase OAuth and register the client's exact redirect URL. **Supabase appends its authorization path to the existing Site URL.** Keep the website's Site URL and set Authorization Path to `/authorize`. The approved [website route](../vercel.json) redirects to `https://kingdown-plugin.vercel.app/authorize`. Vercel preserves incoming query parameters, including `authorization_id`; the website live check verifies this. Publishing this route is a separate website deployment. Allow the backend's authorization URL, including the preserved `authorization_id` query, for the Google/GitHub return; verify the configured redirect pattern against the actual PKCE flow. Also add the exact consent origin, `https://kingdown-plugin.vercel.app` with no trailing slash, path or query, to Supabase Redirect URLs. Supabase checks the browser Origin against that list when it reads or approves a consent request; a return-path entry alone does not match. Confirm the chosen social providers are enabled. A separate consent origin may require signing in again. [Supabase consent configuration](https://supabase.com/docs/guides/auth/oauth-server/getting-started), [Vercel query preservation](https://vercel.com/kb/guide/how-do-i-perform-vercel-redirects-based-on-query-strings)
3. Review and install [the audience hook template](../plugin-deploy/oauth-audience-hook.sql), retaining any existing custom-token-hook behavior. Insert only the approved client UUIDs with the exact `https://YOUR-PLUGIN-ORIGIN/mcp` resource, then enable the hook in Supabase. It reads the Auth-issued `client_id`; user metadata cannot grant a resource audience. This is intentionally separate from automatic match migrations.
4. Apply [the match migration](../supabase/migrations/0002_matches.sql) with the migration command and appropriate server credentials. Set `KINGDOWN_PLUGIN_OAUTH_READY=1` only after the real discovery endpoint works and provider settings are complete. Startup checks discovery and that the SQL audience allowlist matches the configured clients and resource; failed startup can recover on a later request.
5. Connect the private MCP URL in ChatGPT and run the real-account cases in the beta packet, including sign-in, deny, refresh, account switch, two-player play and revoked access. Record actual host behavior separately from the local harness.

The owner's account exposes **Add custom MCP server**, including OAuth and the Tunnel option. The approved live setup uses the separate Vercel project `kingdown-plugin` at `https://kingdown-plugin.vercel.app`. Supabase keeps Site URL `https://kingdown.dev`, Google and GitHub sign-in, and the existing ES256 signing key. OAuth Server is enabled with `/authorize` and dynamic registration off. One public PKCE client has the callback generated by the ChatGPT form. The match schema, audience hook and separate runtime role are installed. The restricted login passes with TLS certificate and host checks. The service and website consent route are released, and the first test account connects in ChatGPT. See the public identifiers in [the external-host ticket](specs/match-foundation/issues/01-external-host-check.md) and the remaining real-client cases in [the live acceptance ticket](specs/match-foundation/issues/06-live-acceptance.md).

Use a configured private staging server with OAuth for a real host test. A Secure MCP Tunnel needs its own tunnel ID, runtime credential and correct Platform/ChatGPT associations; the presence of the connection tab alone is insufficient. Keep server and database authority private. [Connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt), [tunnel setup](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)

Run the [beta and support packet](plugin-beta-support.md) in the actual client. Browser emulation proves layout at a chosen size; it does not establish native iOS/Android support, host CSP behavior, permission prompts, background lifetime or fullscreen availability.

## Troubleshooting and rollback

| Symptom | Action |
|---|---|
| 401 with an OAuth challenge | Check issuer discovery, resource audience, expiry, role and registered client. A website session is deliberately insufficient. |
| Consent says unavailable or expired on a fresh request | Inspect the provider response. For `unauthorized request origin`, add the exact consent origin to Supabase Redirect URLs as well as the social return path. Restart from ChatGPT. |
| Production server returns 503 before tools appear | Check required environment settings and OAuth discovery. Keep readiness off until the provider setup passes. |
| A stale or rejected move | Reload authority and choose again. Definitive rejection clears its pending receipt; an uncertain lost reply retains the original ID for Retry. |
| Old game cannot continue after an engine change | Start a new game, or restore the complete matching server artifact for the old game. Never edit its saved fingerprint. |
| A friend sees no update | Confirm both seats, visible client and connection; Reload reads authority. Check the request revision before retrying a move. |
| Resource fails to render | Inspect the resource MIME type, measured JSON size, CSP, host bridge and console. Capture the client/build and a minimal reproduction. |
| Database failure during a move | Verify command and snapshot committed together. Retry the same receipt after recovery; do not manually advance the revision. |

Keep complete deployment artifacts, including `runtime/worker.mjs`, together. Gameplay bundle changes deliberately invalidate incompatible saves. Rolling back only HTML or editing engine stamps is not a save migration. A rollback may leave games created under the newer build unavailable; preserve those rows and use their matching artifact when investigating. There is no multiversion engine service in this preparation.
