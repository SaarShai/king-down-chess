# Set up the Muse OAuth client and deploy to staging

Type: task
Status: open
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

## Done when

The MCP Inspector signs in through `/authorize` on staging and lists the six tools, and a game started there shows on kingdown-staging.vercel.app.
