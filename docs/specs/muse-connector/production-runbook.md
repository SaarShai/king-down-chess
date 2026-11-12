# Muse connector: production release runbook

This runbook turns the Muse connector on at `https://kingdown.dev/muse/mcp`. The ChatGPT plugin at `https://kingdown.dev/mcp` stays on: one build serves both connectors (PR 354, [ticket 18](issues/18-both-connectors.md)). It copies the steps that passed on staging on 2026-11-08 ([ticket 11](issues/11-staging-oauth.md), [ticket 15](issues/15-review-accounts.md)). Do the parts in order. Each part has a check. Do not go to the next part until the check passes.

- Production Supabase project: `utqzovjmclfyojedmwok` (`https://utqzovjmclfyojedmwok.supabase.co`).
- Production resources: `https://kingdown.dev/muse/mcp` (Muse, new) and `https://kingdown.dev/mcp` (ChatGPT, no change).
- `<MUSE_CLIENT_ID>` in this file is the client ID of the production "Muse" OAuth client (part 1). It is not a secret. It is not the staging client ID.

**503 steps.** A wrong value in a step marked **[503]** stops the server at start. Then every server path answers 503: `/api/*` (sign-in, games), `/internal/*`, `/mcp` and `/muse/mcp`. The static website still loads, but no player can play online. Each [503] step has a check before the deploy.

## Part 0. Decide first (owner)

1. **The ChatGPT plugin stays on.** This release adds Muse next to it. The OpenAI review address stays in the password list (part 2.4).
2. **Deploy freeze.** From part 4 until part 7 check 1 passes, no other production deploy may run. The Muse client ID goes into the production list only in the same release that turns Muse on: a build without Muse (each commit before the part 3 merge) does not serve `/muse/mcp`, so the Muse row does not match, and every path answers 503. Do parts 4 to 7 in one session.

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
- If `resource_check` does not contain `(/muse)?`, the table still has the old check from before 2026-11-08, and the Muse row in 2.3 fails. Run this block:

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

Keep the ChatGPT row (resource `https://kingdown.dev/mcp`). The ChatGPT plugin needs it in this release and after.

Check before deploy (the same read that `checkPluginDatabase` in `tools/plugin-db-check.mjs` does at start):

```sql
select client_id::text, resource from kingdown_oauth.client_resources order by resource;
```

The read must show these two rows: the ChatGPT client ID with `https://kingdown.dev/mcp`, and `<MUSE_CLIENT_ID>` with `https://kingdown.dev/muse/mcp`. Each resource has no slash at the end and is in lower case. Do not change other rows: production can hold the row of the legacy `kingdown-plugin` client. The start check reads only the rows of the listed IDs. A wrong client ID, a wrong origin or a missing row of a listed ID makes every server path answer 503.

### 2.4 The password accounts list

Read the list:

```sql
select email from kingdown_auth.password_accounts order by email;
```

Each address in the list can get a password session. Remove each address that is not necessary now:

- Keep the OpenAI review address: the ChatGPT plugin stays on.
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

The switch `MUSE_CONNECTOR` in `tools/muse-connector.mjs` is on only when `KINGDOWN_STAGE=staging`, and `tools/deploy.sh` refuses `KINGDOWN_STAGE`. So a production build leaves Muse out. PR 354 did most of the work: `CHATGPT_PLUGIN` no longer follows the Muse switch, the live check (`tools/deploy-plugin-live-check.mjs`) checks each served connector, and the tests and checks accept a build with both. One PR to main makes these changes:

1. `tools/muse-connector.mjs`: `export const MUSE_CONNECTOR = true;`. `CHATGPT_PLUGIN` stays true for production, so the production build serves both connectors.
2. Run `npm test`, `npm run test:docs` and `npm run check:vercel` on a production build (no `KINGDOWN_STAGE`).
3. Docs: the switch section of [MUSE.md](../../MUSE.md#the-switch) and "The ChatGPT plugin" in [HOSTING.md](../../HOSTING.md#the-chatgpt-plugin).

Merge it only after parts 1 and 2 pass and the owner gives the word. A deploy of this build before part 4 starts: the server serves `/muse/mcp` with no Muse client, refuses each Muse token and logs a warning. The ChatGPT plugin works. Even so, do part 4 and part 6 in the same session.

`tools/deploy.sh` builds a fresh `origin/main`. So do part 4 only after the part 3 PR is on `origin/main`. Do not merge a revert of part 3 while the list has the Muse ID.

## Part 4. The production server values **[503]**

The production project `kingdown` has seven server keys (`tools/deploy-plugin-env.mjs`). The release changes one value:

| Key | Value for the Muse build |
| --- | --- |
| `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` | `<CHATGPT_CLIENT_ID>,<MUSE_CLIENT_ID>` (both, comma between, no space) |
| `KINGDOWN_PLUGIN_OAUTH_READY` | `1` (no change) |
| `KINGDOWN_PLUGIN_ORIGIN` | `https://kingdown.dev` (no change) |
| `SUPABASE_URL` | `https://utqzovjmclfyojedmwok.supabase.co` (no change) |
| `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_DATABASE_URL`, `KINGDOWN_INTERNAL_SECRET` | no change |

**Both IDs stay in the list.** At start, `checkPluginDatabase` needs, for each listed ID, a row whose resource is one that the build serves. The ChatGPT ID needs its `/mcp` row, and the Muse ID needs its `/muse/mcp` row. A listed ID without such a row makes every path answer 503. If the ChatGPT ID goes out, the server starts, but the ChatGPT plugin refuses every token.

Each start check of `configurePlugin` and the value it needs (a fault in any one gives 503):

| Start check | Needs |
| --- | --- |
| Readiness | `KINGDOWN_PLUGIN_OAUTH_READY` is exactly `1`, and `SUPABASE_URL` is set |
| Client list | `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` is a list of UUIDs, not empty |
| Supabase OAuth discovery | `https://utqzovjmclfyojedmwok.supabase.co/.well-known/oauth-authorization-server/auth/v1` answers 200, with issuer `https://utqzovjmclfyojedmwok.supabase.co/auth/v1` and scope `openid` |
| Database | the migrations and runtime grants (no change in this release) |
| Audience rows | for each listed ID, one row with a served resource: `https://kingdown.dev/mcp` or `https://kingdown.dev/muse/mcp` (part 2.3) |

Steps:

1. Write down the old value of `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` (`<CHATGPT_CLIENT_ID>`) in the release log. It is not a secret. A rollback (part 8) needs it. Do not make a second copy of the env file: it holds secrets.
2. Check that the private env file that `tools/deploy.sh --configure` reads (mode 600, seven `KEY=value` lines; [HOSTING.md](../../HOSTING.md)) holds the live values. `--configure` writes all seven keys with `--force`, so an old value in the file replaces the live value. Then change only the `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` line to `<CHATGPT_CLIENT_ID>,<MUSE_CLIENT_ID>`.
3. Check before you send it. This prints a count, not a value; it must print `1`:

   ```bash
   grep -cx 'KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS=<CHATGPT_CLIENT_ID>,<MUSE_CLIENT_ID>' <private-env-file>
   ```

4. Check the discovery (public, no key):

   ```bash
   curl -s https://utqzovjmclfyojedmwok.supabase.co/.well-known/oauth-authorization-server/auth/v1 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log(m.issuer, m.scopes_supported.includes("openid"))})'
   ```

   It must print `https://utqzovjmclfyojedmwok.supabase.co/auth/v1 true`.
5. Check that the part 3 PR is on `origin/main`. Then send the values: `tools/deploy.sh --configure <private-env-file>`. This sets the production values of project `kingdown`. It does not deploy.

**The deploy freeze of part 0 applies.** Vercel gives the new value only to the next deployment. A build without Muse and the two-ID list fail the audience check, and every path answers 503. So no deploy of a commit before the part 3 merge may run after this step.

## Part 5. The last check before deploy

Run all three checks. Each must pass.

1. SQL: the read of 2.3 shows both rows; the reads of 2.1 and 2.2 pass.
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
4. The ChatGPT plugin still works: `https://kingdown.dev/.well-known/oauth-protected-resource/mcp` gives `"resource":"https://kingdown.dev/mcp"`, and an unsigned `POST https://kingdown.dev/mcp` (the curl of check 3 with `/mcp`) gives 401 with `resource_metadata="https://kingdown.dev/.well-known/oauth-protected-resource/mcp"`. The deploy's live check also checks both connectors.
5. The consent page: `https://kingdown.dev/authorize` answers 200. The page reads the authorization, then shows the Muse text for the Muse client and the ChatGPT text for the ChatGPT client. Check 8 shows the Muse text.
6. The website: open `https://kingdown.dev`, start a game against the computer while signed out, and make one move.

Signed in (owner; the agent does not sign in to the owner's account, AGENTS.md "Hosting"):

7. In the Muse portal, type each review account and its password in one test-account entry. Notes: "On the King Down page, open 'Sign in with email and password'." ([MUSE.md](../../MUSE.md#review-accounts) step 4.)
8. Run the portal's credential test with each account. The owner signs in on `https://kingdown.dev/authorize` with "Sign in with email and password" and approves. The test passes when the portal gets a token. On staging the same flow gave a token with `aud` equal to the resource and the six tools from `tools/list`.
9. If the portal shows the tools, start one game and play one move ("pawn to e4"). Then open the game link on `kingdown.dev` while signed in with the same review account: the game shows there.

## Part 8. Rollback

Use this when a check of part 7 fails, or when the site answers 503.

If only Muse fails and the site and the ChatGPT plugin work (part 7 checks 1, 4 and 6 pass), use the short rollback: set the list back to `<CHATGPT_CLIENT_ID>` (as in part 4, steps 2 and 5), then run `tools/release/live.sh publish`. The build still serves `/muse/mcp`, but with no Muse client it refuses each Muse token. Revert the part 3 PR later, when the owner says so, and only after the list holds `<CHATGPT_CLIENT_ID>` alone.

If the site answers 503:

1. **Fast (the owner, Vercel dashboard):** project `kingdown` → **Deployments** → the previous production deployment (the ChatGPT-only build) → **Instant Rollback**. That deployment keeps the server values that it started with (the ChatGPT client ID), and its audience row (`/mcp`) is still in the database, so it starts. Check `https://kingdown.dev/api/status` (200) and `https://kingdown.dev/.well-known/oauth-protected-resource/mcp` (200).
2. Set the old value back: in the private env file, change the `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` line to `<CHATGPT_CLIENT_ID>` from the release log, then run `tools/deploy.sh --configure <private-env-file>`. Main (with Muse on) starts with this list, and so does the previous production deployment.
3. Find the cause of the 503 (`vercel logs` of the faulty deployment: "King Down startup failed"). Fix it, or revert the part 3 PR on a branch and merge the revert PR to main. Merge a revert only after step 2: a revert while the list has the Muse ID answers 503 at the next deploy.
4. Run `tools/release/live.sh publish`. After an Instant Rollback, Vercel stops moving the production domain to new deployments by itself. So the new deployment does not get `kingdown.dev`, and the live checks of `tools/deploy.sh --publish` can fail because they read the old deployment.
5. In project `kingdown` → **Deployments**, open the new deployment of step 4 and press **Promote**. This ends the rollback state, and the domain follows production deployments again. Do not press **Undo Rollback**: it brings back the faulty deployment. Then run `tools/release/live.sh publish` again, so that its live checks read the new deployment and pass.
6. Keep the database changes. Migration 0023, the new resource check and the Muse row do not change the ChatGPT plugin. To stop the review accounts, use the two `delete` lines of 2.4 for each review address.
7. Do not delete the Muse OAuth client unless the owner says so. A new client gets a new ID, and the portal entry and the audience row must change with it.

If only the Muse part fails (for example the portal test) and the site works, the owner can keep the release live and fix forward. Muse users see the connector only after Meta's review passes.
