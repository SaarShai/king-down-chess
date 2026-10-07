# King Down private plugin setup

The private plugin shares the website's engine and painted board, with a Node worker per operation and PostgreSQL as match authority. Players can play the computer, create a friend invitation, join as Black, and resume their latest game. Moves go directly through MCP Apps without a model turn. This branch prepares the service and its checks; a real ChatGPT launch and production account configuration are still release gates.

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
npm run plugin:check:oauth
```

On a busy development machine or small CI runner, `npm run test:plugin:ci` runs the same complete test set with two Vitest workers and a 30-second default test timeout. It does not change engine budgets or worker watchdogs.

`plugin:db:init-test` accepts only a loopback database whose name ends in `_test`. It makes a minimal stand-in for Supabase identity and applies the match migration twice. The database tests use independent connections and separate Node processes, check transaction rollback, test seat access and invite races, and remove their generated accounts afterward. The HTTP check copies the artifact outside the checkout, then opens, moves, plays the computer, retries, restarts the service, resumes, and joins a friend through that source-free copy.

The OAuth check needs Playwright Chromium (`npx playwright install chromium` if missing). It exercises the compiled consent page with the actual Supabase SDK against a local provider mock: social sign-in with PKCE, the return to the original authorization request, approval, denial, unapproved clients and escaped client names. It also executes the audience hook in PostgreSQL inside a rolled-back transaction, including ordinary website, anonymous, service-role, spoofed-metadata and refresh cases. This verifies our integration contract; the actual provider remains a separate check.

The [validation workflow](../.github/workflows/plugin-checks.yml) supplies PostgreSQL and runs unit, HTTP, OAuth and browser checks, including a browser connected to the compiled server and database. It publishes nothing. The existing manual website publishing workflow is unchanged. A workflow file prepared locally is not evidence that hosted CI has run.

## Play the local board

The standard SDK harness is a development host for the real board. It is not the ChatGPT host.

```sh
npm run plugin:build:ui
npx tsx tools/plugin-ui-harness.ts dist-plugin-ui/board.html
```

Open `http://127.0.0.1:5296` while that command is running. In another terminal, `npm run plugin:check:ui` exercises move choices, Haste, recovery, computer play, a terminal board, remounting, display mode, and a 390-pixel viewport. This fixture keeps disposable matches in memory; stopping it loses those fixture games.

For the durable path, use two disposable identities in the test database:

```sh
psql "$PLUGIN_TEST_DATABASE_URL" -c "insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222') on conflict do nothing"
KINGDOWN_PLUGIN_DATABASE_URL="$PLUGIN_TEST_DATABASE_URL" \
KINGDOWN_PLUGIN_ORIGIN=http://127.0.0.1:3100 \
npm run plugin:serve -- --local-dev
```

Then run the harness in another terminal:

```sh
PLUGIN_MCP_URL=http://127.0.0.1:3100/mcp \
PLUGIN_DEV_ACTOR=11111111-1111-4111-8111-111111111111 \
PLUGIN_FRIEND_ACTOR=22222222-2222-4222-8222-222222222222 \
npx tsx tools/plugin-ui-harness.ts
```

`npm run plugin:check:ui` now drives the compiled HTTP server and real PostgreSQL. The second SDK client joins and replies as the friend. Only the local Node harness holds persona headers; the iframe receives public board data. Local personas require an explicit development flag, loopback peer, loopback origin and loopback database. The production function never enables them. Do not connect this persona mode to a public tunnel.

## Service and deployment contract

The [match guide](match-foundation.md) documents the worker. The server owns matches, seats, accepted commands and hashed invitation tokens in [migration 0002](../supabase/migrations/0002_matches.sql). Browser roles have no access to these tables. The runtime needs a server-only PostgreSQL connection with the required table access; the website's publishable key cannot substitute for it.

Each move checks the authenticated seat, actual engine turn and revision. It computes outside the database lock, then atomically commits the command receipt and new save under a row lock. Retry IDs are scoped to the actor; identical retries return current authority. Haste and free power actions may keep the same player to move. Friend boards refresh every three seconds while visible and waiting; hidden, disconnected, busy and own-turn boards do not poll.

`npm run plugin:build` emits `plugin-server-dist/` with the server, embedded board resource and isolated worker runtime. `npm run plugin:build:vercel` prepares an unlinked Vercel Build Output API tree under `plugin-deploy/.vercel/output/`. These commands do not deploy. Keep this backend separate from the current static website project until the intended private host and origin are chosen. Environment names are in [the example](../plugin-deploy/.env.example); secrets belong in the host environment, never in Git or the UI resource.

The board uses one self-contained MCP App resource at `ui://kingdown/board-v1.html`; its JSON payload must remain below the build's 4.4 MB ceiling. UI controls use system typography. No browser engine worker or separate browser database connection is required: the server worker chooses and validates moves. The current preview has one fixed army drawn from the current pool, with Flame/Haste and Frost/Freeze. Army selection, card mode, ratings and matchmaking are outside this preview.

The AI uses the existing search engine, with a 250 ms cooperative budget and depth cap 6. Each worker request has a 15-second termination watchdog. The game has a 1,000-command bound. Each server instance accepts at most four active MCP requests and rejects JSON-RPC batches. A disconnected client's slot stays occupied until its service work finishes, then becomes available again. These are operation limits, not proof of production throughput or an account-wide cost cap. Measure cold requests, sustained concurrency and database connections on the chosen staging host before inviting testers.

## Accounts and the real host

Production accepts signed Supabase OAuth access tokens for the exact MCP resource audience and allowlisted client ID. Website tokens with the broad `authenticated` audience, wrong issuer, expired tokens and wrong roles are rejected. Supabase OAuth must be enabled with a working consent page, registered MCP client and client-specific audience hook before the production readiness flag can be set. Test refresh, revocation, account switching and two actual users after configuration; local persona checks do not prove those provider flows. [Supabase MCP authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)

The consent page is included at `/authorize`, with Google and GitHub sign-in using the existing Supabase project. Finish the following once a private HTTPS origin and the actual provider configuration are available:

1. Configure the server-only PostgreSQL URL, Supabase URL, public publishable key, plugin origin and registered OAuth client UUIDs from [the environment example](../plugin-deploy/.env.example). The publishable key must never be a secret or service-role key.
2. Enable Supabase OAuth and register the client's exact redirect URL. **Supabase appends its authorization path to the existing Site URL.** Keep the website's Site URL, set Authorization Path to `/authorize`, and prepare a website redirect to the backend's `/authorize` using [this template](../plugin-deploy/website-consent-redirect.example.json) with the chosen origin. Vercel preserves incoming query parameters, including `authorization_id`. Publishing this route is a separate website deployment and has not been performed. Allow the backend's authorization URL, including the preserved `authorization_id` query, for the Google/GitHub return; verify the configured redirect pattern against the actual PKCE flow. Confirm the chosen social providers are enabled. A separate consent origin may require signing in again. [Supabase consent configuration](https://supabase.com/docs/guides/auth/oauth-server/getting-started), [Vercel query preservation](https://vercel.com/kb/guide/how-do-i-perform-vercel-redirects-based-on-query-strings)
3. Review and install [the audience hook template](../plugin-deploy/oauth-audience-hook.sql), retaining any existing custom-token-hook behavior. Insert only the approved client UUIDs with the exact `https://YOUR-PLUGIN-ORIGIN/mcp` resource, then enable the hook in Supabase. It reads the Auth-issued `client_id`; user metadata cannot grant a resource audience. This is intentionally separate from automatic match migrations.
4. Apply [the match migration](../supabase/migrations/0002_matches.sql) with the migration command and appropriate server credentials. Set `KINGDOWN_PLUGIN_OAUTH_READY=1` only after the real discovery endpoint works and provider settings are complete. Startup checks discovery and that the SQL audience allowlist matches the configured clients and resource; failed startup can recover on a later request.
5. Connect the private MCP URL in ChatGPT and run the real-account cases in the beta packet, including sign-in, deny, refresh, account switch, two-player play and revoked access. Record actual host behavior separately from the local harness.

The owner's ChatGPT web account exposed **Add custom MCP server**, including the **Tunnel** connection option on October 7, 2026. The Platform tunnel settings page failed to load a JavaScript module during this check, so no usable tunnel or workspace association was established. The existing Supabase project's canonical OAuth discovery endpoint returned HTTP 404; its dashboard required sign-in. The GitHub sign-in route requested a new Supabase authorization to read account email addresses, so it was left for the owner without granting access. OAuth readiness remains unverified. The signed-in Vercel CLI found `kingdown`, Node 24, and a Pro team, superseding the older Hobby observation for this account. No cloud configuration was changed.

Use a configured private staging server with OAuth for a real host test. A Secure MCP Tunnel needs its own tunnel ID, runtime credential and correct Platform/ChatGPT associations; the presence of the connection tab alone is insufficient. Keep server and database authority private. [Connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt), [tunnel setup](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)

Run the [beta and support packet](plugin-beta-support.md) in the actual client. Browser emulation proves layout at a chosen size; it does not establish native iOS/Android support, host CSP behavior, permission prompts, background lifetime or fullscreen availability.

## Troubleshooting and rollback

| Symptom | Action |
|---|---|
| 401 with an OAuth challenge | Check issuer discovery, resource audience, expiry, role and registered client. A website session is deliberately insufficient. |
| Production server returns 503 before tools appear | Check required environment settings and OAuth discovery. Keep readiness off until the provider setup passes. |
| A stale or rejected move | Reload authority and choose again. Definitive rejection clears its pending receipt; an uncertain lost reply retains the original ID for Retry. |
| Old game cannot continue after an engine change | Start a new game, or restore the complete matching server artifact for the old game. Never edit its saved fingerprint. |
| A friend sees no update | Confirm both seats, visible client and connection; Reload reads authority. Check the request revision before retrying a move. |
| Resource fails to render | Inspect the resource MIME type, measured JSON size, CSP, host bridge and console. Capture the client/build and a minimal reproduction. |
| Database failure during a move | Verify command and snapshot committed together. Retry the same receipt after recovery; do not manually advance the revision. |

Keep complete deployment artifacts, including `runtime/worker.mjs`, together. Gameplay bundle changes deliberately invalidate incompatible saves. Rolling back only HTML or editing engine stamps is not a save migration. A rollback may leave games created under the newer build unavailable; preserve those rows and use their matching artifact when investigating. There is no multiversion engine service in this preparation.
