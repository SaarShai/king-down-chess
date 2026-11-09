# Set up the Muse OAuth client and deploy to staging

Type: task
Status: resolved
Blocked by: 09
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

Does the connector answer on staging with a real Supabase OAuth token?

## Steps

1. Owner (staging Supabase dashboard, project `puhspsyjyzaghmgtkzqd`): keep the OAuth 2.1 server on, with dynamic registration off. Create a public client "Muse" with the three redirect URIs in [ticket 05](05-account-link.md). Give the client ID to the agent (it is not a secret).
2. Agent: write the SQL for the audience hook: a `kingdown_oauth.client_resources` row that maps the client to `https://kingdown-staging.vercel.app/muse/mcp`, and the path check in `plugin-deploy/oauth-audience-hook.sql` that accepts `/muse/mcp`. Owner: run it in the staging SQL editor.
3. Agent: set the staging environment values in [docs/MUSE.md](../../../MUSE.md) and turn `MUSE_CONNECTOR` on for the staging build only.
4. Owner: give the word to deploy the branch to staging (AGENTS.md).
5. Agent: check the metadata, a 401 challenge, and `tools/list` with a token from the MCP Inspector's OAuth flow against a staging test account.

## Progress

- 2026-11-08, steps 1 and 2 done on staging (the owner's sign-in, the agent's clicks):
  - The OAuth server is on, and dynamic registration is off.
  - The public client "Muse" has client ID `04bffb8b-1fbb-4ca0-a87b-482ad79de209` and the three redirect URIs of ticket 05.
  - The resource check accepts `/muse/mcp`.
  - The Muse row maps the client to `https://kingdown-staging.vercel.app/muse/mcp`, and the ChatGPT row stays.
  - The hook function was already current (it has the password-account check), so it was not replaced.
- 2026-11-08, step 3: the agent ran migration 0023 in the staging SQL editor (both surface checks now allow `muse`), and set the staging Preview value `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` to only the Muse client ID (the parked ChatGPT plugin does not read it). `MUSE_CONNECTOR` is on for staging builds only (`KINGDOWN_STAGE=staging`).
- 2026-11-08, step 4: staging serves `04a08ce85` (main `dc884fbb0`). The metadata names the resource `https://kingdown-staging.vercel.app/muse/mcp`, and an unsigned POST to `/muse/mcp` gets 401 with a `resource_metadata` challenge.
- 2026-11-08, step 5: a PKCE test script took the place of the MCP Inspector. It used the Muse client and the redirect `https://platform.muse.ai/oauth/credential-test/callback`. The owner signed in with GitHub on the staging `/authorize` page and approved. Results:
  - The code exchange gives an access token (1 hour) and a refresh token. `aud` is `https://kingdown-staging.vercel.app/muse/mcp`, and `client_id` is the Muse client.
  - `tools/list` gives the six tools: `kingdown_games`, `kingdown_view`, `kingdown_explain`, `kingdown_new_game`, `kingdown_move`, `kingdown_end`.
  - `kingdown_new_game` starts a game with a link on kingdown-staging.vercel.app. `kingdown_move` with "pawn to e4" plays e2–e4, and the computer replies g7–g6.
  - `kingdown_games` lists the new game together with the account's earlier games from the website, so Muse and the website use the same account and games.
  - The Muse callback page shows "This sign-in can't continue" when the check does not start from the Muse portal. This is correct: the code reached the redirect.
  - The token holds the `email` claim (an open owner decision, see the map).

## Done when

The MCP Inspector signs in through `/authorize` on staging and lists the six tools, and a game started there shows on kingdown-staging.vercel.app.
