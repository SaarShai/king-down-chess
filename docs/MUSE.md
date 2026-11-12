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

`src/muse/*.test.ts` covers the word matching, the board text, the tools over the fixture (both protocol eras) and the HTTP edge (guards, bearer check, metadata).

After a tool change, run `npm run muse:docs`: it writes [specs/muse-connector/tool-docs.md](specs/muse-connector/tool-docs.md) from the tool listing, and the doc lint `tools/muse-tool-docs.docs.test.ts` fails until you do. `tools/plugin-server-check.mjs` checks that a build with the connector off has no Muse tool code and answers 404 on the Muse paths.

## The switch

`MUSE_CONNECTOR` in `tools/muse-connector.mjs` is on only for a staging build (`KINGDOWN_STAGE=staging`, as `tools/release/staging.py` builds). A production build leaves the connector out (`KINGDOWN_MUSE=false`), and `/muse/mcp` answers 404. To serve it, build with `muse: true` (`buildPluginServer`, `vercelRoutes`, or `--muse` on `tools/plugin-server-build.mjs`).

One build can serve the ChatGPT plugin and the Muse connector at once. `CHATGPT_PLUGIN` (`tools/chatgpt-plugin.mjs`) does not follow this switch: it is on for production and off for staging. So the release that sets `MUSE_CONNECTOR` to true for production keeps the ChatGPT plugin on. In such a build:

- `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` lists both client IDs. Each listed ID must have its row in `kingdown_oauth.client_resources` with the resource of a served connector (`/mcp` or `/muse/mcp`), else the server does not start and every path answers 503.
- `/mcp` accepts a token only when its `aud` is the `/mcp` resource and its client maps to `/mcp`; `/muse/mcp` does the same for its resource. A served connector without a listed client refuses every token; the server logs a warning and still starts.
- The consent page has both texts. `src/plugin/consent.ts` shows the Muse text when the client of the authorization maps to `/muse/mcp`, else the ChatGPT text. The review password form stays.
- Check the tree with `npm run check:vercel -- <tree> --chatgpt --muse` (build it with `node tools/plugin-server-build.mjs <tree> --site --chatgpt --muse`). `tools/deploy-plugin-live-check.mjs` checks the connectors that the tree has.

## Server settings

With the connector on, the server needs the same settings as the ChatGPT plugin ([plugin-preparation.md](plugin-preparation.md)): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` (the Muse client ID, and the ChatGPT client ID when the build serves both; not secrets), `KINGDOWN_PLUGIN_OAUTH_READY=1`, and `KINGDOWN_PLUGIN_DATABASE_URL`. Values live in the private env files ([HOSTING.md](HOSTING.md)); never paste them in chat.

## Database and Supabase

- Migration `supabase/migrations/0023_muse_surface.sql` adds the `muse` surface to game commands and seats. Run it before a server that writes `muse` (release order in [supabase/README.md](../supabase/README.md)).
- The audience hook template `plugin-deploy/oauth-audience-hook.sql` accepts a `/mcp` or a `/muse/mcp` resource. After a change, run it again in the SQL editor, then add the Muse client's row: `insert into kingdown_oauth.client_resources(client_id, resource) values ('<client id>', 'https://<origin>/muse/mcp');`
- The Supabase OAuth client for Muse: public, PKCE, with the redirect URIs of [ticket 05](specs/muse-connector/issues/05-account-link.md).

## Deploy

Staging: a staging deploy (`python3 tools/release/staging.py`) of a branch with this switch serves the connector at `https://kingdown-staging.vercel.app/muse/mcp`. Before the first such deploy, three steps are done by hand (2026-11-08, [ticket 11](specs/muse-connector/issues/11-staging-oauth.md)): migration 0023 in the staging SQL editor, the Muse row of the audience hook, and the staging Preview value `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` set to only the Muse client ID. `staging.py` does none of them. If one is wrong, the server stops at start and every staging path, `/api/*` too, answers 503; `staging.py` moves the alias before its `/api/status` check, so set the alias back to the previous deployment by hand. Live only after the Muse review passes and the owner says so.

## Production release

The release that turns the connector on at `https://kingdown.dev/muse/mcp` follows [the production runbook](specs/muse-connector/production-runbook.md): the Supabase dashboard steps, the SQL, the server values, the code change, the deploy, the checks and the rollback. It also parks the ChatGPT plugin, because one build serves only one connector. Read its part 0 first. Its steps marked [503] can stop every server path; each has a check before the deploy.

## Owner steps

The portal account and business verification, the Supabase OAuth client, the hook SQL, deploy words, the review accounts and the submission are the owner's. The map's open tickets list them in order.

## Review accounts

Meta's reviewers sign in with two allow-listed password accounts ([ticket 15](specs/muse-connector/issues/15-review-accounts.md)). A build that serves the connector shows "Sign in with email and password" on the consent page (`REVIEW_PASSWORD_SIGNIN` in `src/plugin/consent.ts` follows `KINGDOWN_MUSE`). Other builds hide it. A Muse build also names Muse on that page and lists what the Muse tools can do (`museConsent` in `tools/plugin-server-build.mjs`); a ChatGPT build keeps `src/plugin/consent.html` as it is. The page is not the guard; Supabase is:

- The Before User Created hook (`plugin-deploy/review-signup-hook.sql`) lets in each `email` account that has an address.
- The Custom Access Token hook (`plugin-deploy/oauth-audience-hook.sql`) refuses a password session for each address that is not in `kingdown_auth.password_accounts`. This also applies to a refresh and to the token that Muse gets.
- Email and **Confirm email** are on, on staging and on production. So an account must have a confirmed address before it can sign in with a password.

Owner steps on staging (project `puhspsyjyzaghmgtkzqd`). You type the passwords; agents never see them.

1. Choose two new addresses in lower case that no King Down account uses, for example two plus-addresses of a mailbox that you read. Do not use the address of your own account: Supabase links accounts that have the same verified address.
2. In **Authentication → Users → Add user → Create new user**, type the first address and a new long password. Keep **Auto Confirm User** on, then press **Create user**. Do the same for the second address. Keep both passwords in your password manager.
3. Then, so that the list names only accounts that exist: in **SQL Editor → New query**, replace the two placeholders and press **Run**. It is safe to run again.

   ```sql
   insert into kingdown_auth.password_accounts(email) values ('<first review address>'), ('<second review address>') on conflict (email) do nothing;
   ```

4. In the Muse portal, type each address and its password in one test account. Notes: "On the King Down page, open 'Sign in with email and password'."
5. After a staging deploy that serves the connector, run the portal's sign-in test with each account (or the MCP Inspector OAuth flow of [ticket 11](specs/muse-connector/issues/11-staging-oauth.md), step 5).

For production (project `utqzovjmclfyojedmwok`), do steps 1 to 3 again before the release that turns the connector on ([ticket 17](specs/muse-connector/issues/17-submit.md)). First read the list (`select email from kingdown_auth.password_accounts;`): each address in it can get a password session. Remove the old OpenAI review address and each other old address, unless it is still necessary (for example an App Review account of iOS [ticket 10](specs/ios-app/issues/10-review-sign-in.md)). To stop an account, remove it from the list, then end its sessions: `delete from kingdown_auth.password_accounts where email = '<address>';` and `delete from auth.sessions where user_id in (select id from auth.users where lower(email) = '<address>');`.
