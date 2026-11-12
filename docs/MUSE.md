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

`MUSE_CONNECTOR` in `tools/muse-connector.mjs` is on only for a staging build (`KINGDOWN_STAGE=staging`, as `tools/release/staging.py` builds). A production build leaves the connector out (`KINGDOWN_MUSE=false`), and `/muse/mcp` answers 404. To serve it, build with `muse: true` (`buildPluginServer`, `vercelRoutes`). One deploy serves the ChatGPT plugin or the Muse connector, not both: they share `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`.

## Server settings

With the connector on, the server needs the same settings as the ChatGPT plugin ([plugin-preparation.md](plugin-preparation.md)): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` (the Muse client ID; not a secret), `KINGDOWN_PLUGIN_OAUTH_READY=1`, and `KINGDOWN_PLUGIN_DATABASE_URL`. Values live in the private env files ([HOSTING.md](HOSTING.md)); never paste them in chat.

## Database and Supabase

- Migration `supabase/migrations/0023_muse_surface.sql` adds the `muse` surface to game commands and seats. Run it before a server that writes `muse` (release order in [supabase/README.md](../supabase/README.md)).
- Migration `supabase/migrations/0024_muse_disconnect.sql` deletes the games played through Muse on a disconnect (next section). Run it before a server that serves the connector, and before the website build that shows "Disconnect Muse".
- The audience hook template `plugin-deploy/oauth-audience-hook.sql` accepts a `/mcp` or a `/muse/mcp` resource. After a change, run it again in the SQL editor, then add the Muse client's row: `insert into kingdown_oauth.client_resources(client_id, resource) values ('<client id>', 'https://<origin>/muse/mcp');`
- The Supabase OAuth client for Muse: public, PKCE, with the redirect URIs of [ticket 05](specs/muse-connector/issues/05-account-link.md).

## Disconnect and deletion

The Connector Terms ask for the deletion of user data when the user revokes access. The owner decided on 2026-11-12: a disconnect deletes the games played through Muse ([data-processing.md](specs/muse-connector/data-processing.md), section 5; [ticket 18](specs/muse-connector/issues/18-disconnect-deletion.md)).

- A game played through Muse is a game against the computer that started in Muse: its start receipt has the surface `muse`. A game that started on the website stays, also when the user moved in it through Muse.
- Muse sends no signal on a disconnect, and Supabase has no revocation endpoint that Muse can call. Thus two paths:
  1. **Settings → Account → Disconnect Muse** (only in a build with `MUSE_CONNECTOR` on). The browser calls `revokeGrant` for each Muse client (Supabase revokes the consent and deletes the Muse sessions; the next Muse call is refused), then `public.delete_my_muse_games()` deletes the games at once. While a Muse session still exists, the function deletes nothing.
  2. **The daily sweep** (`kingdown-muse-sweep`, 03:37 UTC) deletes the Muse games of each user whose Muse link has no session, or no use (a token refresh) in the last 30 days. This covers a disconnect inside Muse, and a button run where the revoke worked but the deletion failed. It also deletes the Muse games of a user who is still connected but did not use Muse for 30 days: Muse does not tell King Down about a disconnect there, so 30 days without use counts as one.
- The sweep runs each user in a transaction of its own: one failed account goes to the database log, and the next run tries it again.
- **The guard.** When a Muse game had a Muse move in the last 24 hours but its player has no Muse session, the session match is broken (for example, the sessions carry another client ID). The sweep then deletes nothing, gives `-1`, and writes a warning to the Postgres log. A user who disconnects with the button while the deletion fails can also stop the sweep for at most 24 hours after the last Muse move.
- The Muse clients are the rows of `kingdown_oauth.client_resources` with a `/muse/mcp` resource. With no such row, the sweep and the button delete nothing, and the button shows an error. The incident step "stop new Muse tokens" (delete the row) thus also pauses the sweep: add the row again after the incident.

Owner steps, on staging first, then on production in the release that turns the connector on (SQL editor of the project). Start the sweep (step 6) only after step 5 passes.

1. Paste the whole of `supabase/migrations/0024_muse_disconnect.sql` and press **Run**. It is safe to run again.
2. Check that the functions can read the auth tables and see the Muse client: `select (select count(*) from kingdown_jobs.muse_clients()) as clients, kingdown_jobs.muse_last_use('00000000-0000-0000-0000-000000000000') as no_user;`. Expect `clients` 1 and `no_user` null, with no error. A "permission denied" error stops the release: tell the agent.
3. Deploy the build that serves the connector (staging: `python3 tools/release/staging.py`).
4. Paste and run 0024 again. The server from before the deploy wrote Muse starts with no surface; this run marks them.
5. With a test account: connect Muse and start a game in Muse. Find the account ID: `select id from auth.users where lower(email) = '<test address>';`. Then run `select kingdown_jobs.muse_last_use('<account id>') as last_use, now() as now;`. Expect `last_use` within the last hour. If it is null, the sweep would delete every Muse game: do not start the sweep, and tell the agent. Then press **Settings → Account → Disconnect Muse** on the website. Expect "Muse is disconnected. We deleted the games you started in Muse.", the game gone from the game list, and the next Muse call refused.
6. pg_cron must be on (Database → Extensions; `supabase/ops/cron.sql`). Paste `plugin-deploy/muse-sweep-cron.sql` and press **Run**. Check: `select jobname, schedule, active from cron.job where jobname='kingdown-muse-sweep';` gives one active row. After the first run (03:37 UTC), `select status, return_message from cron.job_run_details where command like '%sweep_muse_games%' order by start_time desc limit 1;` gives `succeeded`; a `-1` in the Postgres log warning means the guard stopped it.

## Deploy

Staging: a staging deploy (`python3 tools/release/staging.py`) of a branch with this switch serves the connector at `https://kingdown-staging.vercel.app/muse/mcp`. Before the first such deploy, three steps are done by hand (2026-11-08, [ticket 11](specs/muse-connector/issues/11-staging-oauth.md)): migration 0023 in the staging SQL editor (and 0024 with the sweep, "Disconnect and deletion" above), the Muse row of the audience hook, and the staging Preview value `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` set to only the Muse client ID. `staging.py` does none of them. If one is wrong, the server stops at start and every staging path, `/api/*` too, answers 503; `staging.py` moves the alias before its `/api/status` check, so set the alias back to the previous deployment by hand. Live only after the Muse review passes and the owner says so.

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
