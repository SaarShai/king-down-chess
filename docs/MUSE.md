# Muse connector

King Down in Meta Muse: a remote MCP server at `/muse/mcp` with six tools for games against the computer. The contract is [specs/muse-connector/spec.md](specs/muse-connector/spec.md); the open work is the map, [specs/muse-connector/map.md](specs/muse-connector/map.md).

## Run it on this Mac

```bash
npm run muse:dev
```

The endpoint is `http://127.0.0.1:8787/muse/mcp` (`PORT` changes the port). It has no database and no OAuth: the in-memory fixture (`tools/plugin-protocol-fixture.ts`) plays the real engine. Send the header `x-kingdown-dev-actor: <uuid>`; each UUID is one player. A request without it gets 401.

To call the tools by hand, connect the MCP Inspector to that URL with the header:

```bash
npx @modelcontextprotocol/inspector
```

## Test it

```bash
KINGDOWN_TEST_FILE='src/muse/*.test.ts' npm test
```

`src/muse/*.test.ts` covers the word matching, the board text, the tools over the fixture (both protocol eras) and the HTTP edge (guards, bearer check, metadata). `tools/plugin-server-check.mjs` checks that a build with the connector off has no Muse tool code and answers 404 on the Muse paths.

## The switch

`MUSE_CONNECTOR` in `tools/muse-connector.mjs` is on only for a staging build (`KINGDOWN_STAGE=staging`, as `tools/release/staging.py` builds). A production build leaves the connector out (`KINGDOWN_MUSE=false`), and `/muse/mcp` answers 404. To serve it, build with `muse: true` (`buildPluginServer`, `vercelRoutes`). One deploy serves the ChatGPT plugin or the Muse connector, not both: they share `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`.

## Server settings

With the connector on, the server needs the same settings as the ChatGPT plugin ([plugin-preparation.md](plugin-preparation.md)): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` (the Muse client ID; not a secret), `KINGDOWN_PLUGIN_OAUTH_READY=1`, and `KINGDOWN_PLUGIN_DATABASE_URL`. Values live in the private env files ([HOSTING.md](HOSTING.md)); never paste them in chat.

## Database and Supabase

- Migration `supabase/migrations/0023_muse_surface.sql` adds the `muse` surface to game commands and seats. Run it before a server that writes `muse` (release order in [supabase/README.md](../supabase/README.md)).
- The audience hook template `plugin-deploy/oauth-audience-hook.sql` accepts a `/mcp` or a `/muse/mcp` resource. After a change, run it again in the SQL editor, then add the Muse client's row: `insert into kingdown_oauth.client_resources(client_id, resource) values ('<client id>', 'https://<origin>/muse/mcp');`
- The Supabase OAuth client for Muse: public, PKCE, with the redirect URIs of [ticket 05](specs/muse-connector/issues/05-account-link.md).

## Deploy

Staging: a staging deploy (`python3 tools/release/staging.py`) of a branch with this switch serves the connector at `https://kingdown-staging.vercel.app/muse/mcp`. Before the first such deploy, three steps are done by hand (2026-11-08, [ticket 11](specs/muse-connector/issues/11-staging-oauth.md)): migration 0023 in the staging SQL editor, the Muse row of the audience hook, and the staging Preview value `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` set to only the Muse client ID. `staging.py` does none of them. If one is wrong, the server stops at start and every staging path, `/api/*` too, answers 503; `staging.py` moves the alias before its `/api/status` check, so set the alias back to the previous deployment by hand. Live only after the Muse review passes and the owner says so.

## Owner steps

The portal account and business verification, the Supabase OAuth client, the hook SQL, deploy words, the review accounts and the submission are the owner's. The map's open tickets list them in order.
