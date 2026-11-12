# Muse connector: production release runbook

This runbook turns the Muse connector on at `https://kingdown.dev/muse/mcp`. It copies the steps that passed on staging on 2026-11-08 ([ticket 11](issues/11-staging-oauth.md), [ticket 15](issues/15-review-accounts.md)). Do the parts in order. Each part has a check. Do not go to the next part until the check passes.

- Production Supabase project: `utqzovjmclfyojedmwok` (`https://utqzovjmclfyojedmwok.supabase.co`).
- Production resource: `https://kingdown.dev/muse/mcp`.
- `<MUSE_CLIENT_ID>` in this file is the client ID of the production "Muse" OAuth client (part 1). It is not a secret. It is not the staging client ID.

**503 steps.** A wrong value in a step marked **[503]** stops the server at start. Then every server path answers 503: `/api/*` (sign-in, games), `/internal/*` and `/muse/mcp`. The static website still loads, but no player can play online. Each [503] step has a check before the deploy.

## Part 0. Decide first (owner)

1. **The ChatGPT plugin stops.** One build serves the ChatGPT plugin or the Muse connector, not both (`tools/plugin-server-build.mjs`, `configurePlugin` in `tools/plugin-server.mjs`). `CHATGPT_PLUGIN` is `!MUSE_CONNECTOR` (`tools/chatgpt-plugin.mjs`). So this release parks the ChatGPT plugin: `/mcp`, its metadata and the OpenAI domain challenge answer 404. On 2026-11-10 the plugin came back on production for the OpenAI review (PRs 348 to 351). Do not start this runbook while OpenAI reviews or serves the plugin, unless the owner accepts that the plugin stops. The other choice is a code change that serves both: a second client list and a second database check, as the `shortcut:` comment in `configurePlugin` says. This runbook does not cover that change.
2. Choose a release time. Between part 4 and part 6, no other production deploy may run (part 4 says why).

## Part 1. Production Supabase dashboard (owner)

Copy of [ticket 11](issues/11-staging-oauth.md), step 1. The OAuth 2.1 server is already on for the ChatGPT plugin.

1. Open **Authentication → OAuth Server** in project `utqzovjmclfyojedmwok`. Check that the OAuth server is on, the authorization path is `/authorize`, and **dynamic client registration is off**. Change nothing else on this page: the ChatGPT client uses the same settings.
2. Open **OAuth Apps → Add client** (the name can differ). Make a client with these values:
   - Name: `Muse`.
   - Type: **public** (no client secret; token endpoint auth `none`; PKCE S256).
   - Redirect URIs, all three, exact ([ticket 05](issues/05-account-link.md)):
     - `https://muse.ai/api/hatch/oauth/callback`
     - `https://platform.muse.ai/oauth/credential-test/callback`
     - `https://platform.museai.com/oauth/credential-test/callback`
3. Copy the new client ID. This is `<MUSE_CLIENT_ID>`. Give it to the agent; it is not a secret.
4. Open **Authentication → Hooks**. Check that **Customize Access Token (JWT) Claims** uses `public.kingdown_access_token_hook` and that **Before User Created** uses `public.kingdown_before_user_created`. Both are on.

Check: the OAuth Apps list shows "Muse" (public) next to the ChatGPT client. Do not delete or change the ChatGPT client: a rollback (part 8) needs it.

## Part 2. SQL in the production SQL editor (owner, or the agent on the owner's word)

Run each block in **SQL Editor → New query** of project `utqzovjmclfyojedmwok`. Each block is safe to run again. If a block stops with an error, run `rollback;`, then read the error before you try again.

### 2.1 Migration 0023 (the `muse` surface)

Read first:

```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
where conname in ('game_players_last_surface_check', 'game_commands_surface_check');
```

If both rows contain `'muse'`, 0023 is already done. Go to 2.2. If not, paste and run the whole file `supabase/migrations/0023_muse_surface.sql`. Then run the read again: both rows must contain `'muse'`.

Without 0023 the server starts, but each Muse game write fails on the check constraint.

### 2.2 The audience hook: the resource check and the function

Read first:

```sql
select pg_get_constraintdef(oid) as resource_check from pg_constraint
where conrelid = 'kingdown_oauth.client_resources'::regclass and contype = 'c';

select p.proname, md5(p.prosrc) as body_md5,
  position('kingdown_auth.password_accounts' in p.prosrc) > 0 as has_password_check,
  position('kingdown_oauth.client_resources' in p.prosrc) > 0 as has_audience
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('kingdown_access_token_hook', 'kingdown_before_user_created');
```

The function bodies of the templates on main (2026-11-12) have these MD5 values:

| Function | Template | `body_md5` |
| --- | --- | --- |
| `kingdown_access_token_hook` | `plugin-deploy/oauth-audience-hook.sql` | `ce783e0114a1ff889160cef04f707b44` |
| `kingdown_before_user_created` | `plugin-deploy/review-signup-hook.sql` | `741c0161249a427ede0315897bd12dc2` |

- If `kingdown_access_token_hook` has `has_password_check` and `has_audience` true, the function is current. Do not replace it (staging did the same). A different `body_md5` with both flags true is only a whitespace or comment difference; keep the function.
- If a flag is false, stop. Read the live function (`select prosrc from pg_proc where proname = 'kingdown_access_token_hook';`) against the template before you run the template. The template header says that an existing hook must keep its behavior.
- If `resource_check` does not contain `(/muse)?`, the table still has the old check from before 2026-11-08, and the Muse row in 2.3 fails. Run only these two lines:

```sql
begin;
alter table kingdown_oauth.client_resources drop constraint if exists client_resources_resource_check;
alter table kingdown_oauth.client_resources add constraint client_resources_resource_check check (resource ~ '^https://[^/?#@]+(/muse)?/mcp$');
commit;
```

Then run the first read again: `resource_check` must contain `(/muse)?`. If the table has a check with another name, the `drop` does not remove it; name it in the `drop` line.

### 2.3 The Muse audience row **[503]**

Replace `<MUSE_CLIENT_ID>` with the client ID from part 1. Do not change the resource text.

```sql
insert into kingdown_oauth.client_resources(client_id, resource)
values ('<MUSE_CLIENT_ID>', 'https://kingdown.dev/muse/mcp')
on conflict (client_id) do update set resource = excluded.resource;
```

Keep the ChatGPT row (resource `https://kingdown.dev/mcp`). A rollback to the ChatGPT build needs it.

Check before deploy (the same read that `checkPluginDatabase` in `tools/plugin-db-check.mjs` does at start):

```sql
select client_id::text, resource from kingdown_oauth.client_resources order by resource;
```

There must be exactly one row with client ID `<MUSE_CLIENT_ID>` and resource `https://kingdown.dev/muse/mcp`, with no slash at the end, in lower case. A wrong client ID, a wrong origin or a missing row makes every server path answer 503.

### 2.4 The password accounts list

Read the list:

```sql
select email from kingdown_auth.password_accounts order by email;
```

Each address in the list can get a password session. Remove each address that is not necessary now:

- The OpenAI review address: remove it when the ChatGPT plugin stops with this release (part 0). Keep it while OpenAI still needs it.
- Keep an address that is still in use, for example the App Review account of iOS [ticket 10](../ios-app/issues/10-review-sign-in.md).

For each address to remove (lower case), run both lines. The second line signs the account out on every device and removes its refresh tokens:

```sql
delete from kingdown_auth.password_accounts where email = '<old address>';
delete from auth.sessions where user_id in (select id from auth.users where lower(email) = '<old address>');
```

### 2.5 The two review accounts

Copy of [MUSE.md, "Review accounts"](../../MUSE.md#review-accounts), steps 1 to 3. You type the passwords; agents never see them.

1. Choose two new lower-case addresses that no production account uses, for example two new plus-addresses of the mailbox that you read. Do not use the staging review addresses if they already have production accounts, and do not use the address of your own account.
2. In **Authentication → Users → Add user → Create new user**, type the first address and a new long password. Keep **Auto Confirm User** on, then press **Create user**. Do the same for the second address. Keep both passwords in your password manager.
3. Add both addresses to the list:

```sql
insert into kingdown_auth.password_accounts(email)
values ('<first review address>'), ('<second review address>')
on conflict (email) do nothing;
```

Check: the read of 2.4 shows the two new addresses and no address that you removed.

## Part 3. The code change (agent, pull request; not in this runbook's PR)

The switch `MUSE_CONNECTOR` in `tools/muse-connector.mjs` is on only when `KINGDOWN_STAGE=staging`, and `tools/deploy.sh` refuses `KINGDOWN_STAGE`. So a production build always leaves Muse out. One PR to main makes these changes:

1. `tools/muse-connector.mjs`: `export const MUSE_CONNECTOR = true;` (on for production and staging). Then `CHATGPT_PLUGIN` is false in every build.
2. `tools/deploy-plugin-live-check.mjs` **(release blocker)**: today a build with `consent.mjs` runs the ChatGPT check. It expects 200 from `/.well-known/oauth-protected-resource/mcp` and 401 from `/mcp`. A Muse build has `consent.mjs` but parks `/mcp`, so this check fails **after** the publish, and `deploy.sh` reports a fault on a site that is live. Add a Muse branch:
   - `GET /.well-known/oauth-protected-resource/muse/mcp` answers 200, with resource `https://kingdown.dev/muse/mcp` and issuer `https://utqzovjmclfyojedmwok.supabase.co/auth/v1`.
   - An unsigned `POST /muse/mcp` answers 401 with `Bearer resource_metadata="https://kingdown.dev/.well-known/oauth-protected-resource/muse/mcp", scope="openid"`.
   - `/authorize` and `/consent.mjs` answer as the ChatGPT check expects (the shared consent page).
   - The other `PARKED_PATHS` (`/mcp`, the `/mcp` metadata, the domain challenge) and the board art answer 404.
3. `tools/openai-challenge.test.ts` expects `CHATGPT_PLUGIN` to be true. Change it to follow the switch.
4. Run `npm test`, `npm run test:docs`, `npm run check:vercel` on a production build (no `KINGDOWN_STAGE`), and `npm run plugin:server:check`. `tools/vercel-check.mjs` and `tools/plugin-server-check.mjs` already read both switches; check that they pass with the production tree.
5. Docs: the switch section of [MUSE.md](../../MUSE.md#the-switch) and "The ChatGPT plugin" in [HOSTING.md](../../HOSTING.md#the-chatgpt-plugin).

Merge it only after parts 1 and 2 pass and the owner gives the word. A merged PR does not deploy. But after the merge, each deploy of main is a Muse build and needs the part 4 value.

## Part 4. The production server values **[503]**

The production project `kingdown` has seven server keys (`tools/deploy-plugin-env.mjs`). The Muse build changes one value:

| Key | Value for the Muse build |
| --- | --- |
| `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` | `<MUSE_CLIENT_ID>` only |
| `KINGDOWN_PLUGIN_OAUTH_READY` | `1` (no change) |
| `KINGDOWN_PLUGIN_ORIGIN` | `https://kingdown.dev` (no change) |
| `SUPABASE_URL` | `https://utqzovjmclfyojedmwok.supabase.co` (no change) |
| `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_DATABASE_URL`, `KINGDOWN_INTERNAL_SECRET` | no change |

**The ChatGPT client ID must go out of the list.** At start, `checkPluginDatabase` reads `client_resources` for each listed ID with the Muse resource, and it stops the start when the count of rows is not the count of IDs. `client_id` is the primary key, so the ChatGPT client has only its `/mcp` row. If the list keeps the ChatGPT ID, the count is wrong, and every path answers 503. The ChatGPT build is parked in this release, so nothing else reads its ID.

Each start check of `configurePlugin` and the value it needs (a fault in any one gives 503):

| Start check | Needs |
| --- | --- |
| Readiness | `KINGDOWN_PLUGIN_OAUTH_READY` is exactly `1`, and `SUPABASE_URL` is set |
| Client list | `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` is a list of UUIDs, not empty |
| Supabase OAuth discovery | `https://utqzovjmclfyojedmwok.supabase.co/.well-known/oauth-authorization-server/auth/v1` answers 200, with issuer `https://utqzovjmclfyojedmwok.supabase.co/auth/v1` and scope `openid` |
| Database | the migrations and runtime grants (no change in this release) |
| Audience rows | one row for each listed ID with resource `https://kingdown.dev/muse/mcp` (part 2.3) |

Steps:

1. Keep a copy of the current private production env file. A rollback (part 8) needs the old ChatGPT client ID.
2. In the private env file that `tools/deploy.sh --configure` reads (mode 600, seven `KEY=value` lines; [HOSTING.md](../../HOSTING.md)), change only the `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` line to `<MUSE_CLIENT_ID>`.
3. Check before you send it. This prints a count, not a value; it must print `1`:

   ```bash
   grep -cx 'KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS=<MUSE_CLIENT_ID>' <private-env-file>
   ```

4. Check the discovery (public, no key):

   ```bash
   curl -s https://utqzovjmclfyojedmwok.supabase.co/.well-known/oauth-authorization-server/auth/v1 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log(m.issuer, m.scopes_supported.includes("openid"))})'
   ```

   It must print `https://utqzovjmclfyojedmwok.supabase.co/auth/v1 true`.
5. Send the values: `tools/deploy.sh --configure <private-env-file>`. This sets the production values of project `kingdown`. It does not deploy.

**No other deploy between part 4 and part 6.** Vercel gives the new value only to the next deployment. A deploy of the ChatGPT build with the Muse ID fails the audience check (the Muse row has `/muse/mcp`, not `/mcp`), and every path answers 503. So do part 4 just before part 6. If a deploy of the old build must run, set the old value back first.

## Part 5. The last check before deploy

Run all three checks. Each must pass.

1. SQL: the read of 2.3 shows the Muse row; the reads of 2.1 and 2.2 pass.
2. The env file check of part 4, step 3, prints `1`.
3. `tools/release/live.sh check` (detached in tmux; it runs `tools/deploy.sh` on a fresh `origin/main` and publishes nothing). It must pass on the main commit with the part 3 change.

## Part 6. Deploy (owner's word; agent runs it)

```bash
tools/release/live.sh engines
tools/release/live.sh publish
```

Run each detached in tmux (`tools/release/live.sh` writes the logs to `../evidence/production-release/`). `publish` waits for green CI on `origin/main`, then runs `tools/deploy.sh --publish`. Add the release to `LOG.md` in that folder ([HOSTING.md](../../HOSTING.md)).

## Part 7. Checks after deploy

Unsigned (agent):

1. The server started: `curl -s -o /dev/null -w '%{http_code}\n' https://kingdown.dev/api/status` prints `200`. A `503` means that a [503] value is wrong: go to part 8 now.
2. Metadata: `curl -s https://kingdown.dev/.well-known/oauth-protected-resource/muse/mcp` gives `"resource":"https://kingdown.dev/muse/mcp"` and the authorization server `https://utqzovjmclfyojedmwok.supabase.co/auth/v1`.
3. The 401 challenge:

   ```bash
   curl -s -o /dev/null -D - -X POST -H 'content-type: application/json' -d '{}' https://kingdown.dev/muse/mcp | grep -i -e '^HTTP' -e '^www-authenticate'
   ```

   It gives 401 and `Bearer resource_metadata="https://kingdown.dev/.well-known/oauth-protected-resource/muse/mcp", scope="openid"`.
4. The ChatGPT surface is parked: `https://kingdown.dev/mcp` answers 404.
5. The consent page: `https://kingdown.dev/authorize` answers 200 and names Muse, not ChatGPT.
6. The website: open `https://kingdown.dev`, start a game against the computer while signed out, and make one move.

Signed in (owner; the agent does not sign in to the owner's account, AGENTS.md "Hosting"):

7. In the Muse portal, type each review account and its password in one test-account entry. Notes: "On the King Down page, open 'Sign in with email and password'." ([MUSE.md](../../MUSE.md#review-accounts) step 4.)
8. Run the portal's credential test with each account. The owner signs in on `https://kingdown.dev/authorize` with "Sign in with email and password" and approves. The test passes when the portal gets a token. On staging the same flow gave a token with `aud` equal to the resource and the six tools from `tools/list`.
9. If the portal shows the tools, start one game and play one move ("pawn to e4"). Then open the game link on `kingdown.dev` while signed in with the same review account: the game shows there.

## Part 8. Rollback

Use this when a check of part 7 fails, or when the site answers 503.

1. **Fast (the owner, Vercel dashboard):** project `kingdown` → **Deployments** → the previous production deployment (the ChatGPT build) → **Instant Rollback**. That deployment keeps the server values that it started with (the ChatGPT client ID), and its audience row (`/mcp`) is still in the database, so it starts. Check `https://kingdown.dev/api/status` (200) and `https://kingdown.dev/.well-known/oauth-protected-resource/mcp` (200).
2. Set the old value back: `tools/deploy.sh --configure <saved copy of the old env file>` (the ChatGPT client ID). Without it, the next deploy of the old code answers 503.
3. Revert the part 3 PR on a branch and merge the revert PR to main. Then a normal `tools/release/live.sh publish` puts main live again. After an Instant Rollback, Vercel may not move the production domain to a new deployment by itself; check in the dashboard that `kingdown.dev` points to the new deployment.
4. Keep the database changes. Migration 0023, the new resource check and the Muse row do not change the ChatGPT build. To stop the review accounts, use the two `delete` lines of 2.4 for each review address.
5. Do not delete the Muse OAuth client unless the owner says so. A new client gets a new ID, and the portal entry and the audience row must change with it.

If only the Muse part fails (for example the portal test) and the site works, the owner can keep the release live and fix forward. Muse users see the connector only after Meta's review passes.
