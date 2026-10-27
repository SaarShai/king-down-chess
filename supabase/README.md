# Supabase: accounts database

Project `utqzovjmclfyojedmwok` (https://utqzovjmclfyojedmwok.supabase.co). The game uses only the
publishable key, which is meant to be in the browser. Row Level Security and the grants in these
migrations are what protect each player's data. Never put the secret key or an OAuth secret in this
repository.

## Apply a migration (by hand, once)

1. Open the Supabase dashboard, the project, then **SQL Editor → New query**.
2. Paste the whole of `migrations/0001_accounts.sql` and press **Run**. It runs as one transaction:
   all of it or nothing. It is safe to run again.
3. Check: **Table Editor** shows `profiles` and `user_data`, both marked RLS enabled. Accounts made
   before the migration (test sign-ins) now have a row in `profiles`.
4. Once, with a test account: sign in in the game, then **Settings → Account → Delete my account**.
   Before 0008: the user disappears from **Authentication → Users**, with its `profiles` and
   `user_data` rows. After 0008: the user stays, and `account_deletions` has a row with `run_after`
   7 days later; the deletions job deletes the account then.
5. **Authentication → Sign In / Providers**: turn **Email** off, and keep **Allow anonymous sign-ins**
   off. The game signs in only with Google, GitHub and Facebook. With Email on, anyone can make
   accounts through the API with any name, and every account gets a profile. The one exception is the
   OpenAI review account (approval D8 a): turn Email on only after
   `plugin-deploy/review-signup-hook.sql` is applied and enabled as the **Before User Created** hook.
   That hook refuses every email sign-up whose address is not in `kingdown_auth.password_accounts`, and
   `public.kingdown_access_token_hook` refuses a password sign-in for every such address, also when a
   Google or GitHub account adds a password.

## What 0001 makes

- `profiles`: display name, picture, rating (1200 at the start). Made by a trigger when an account is
  made, from the name and picture the sign-in service sends (a picture only from Google's, GitHub's
  or Facebook's picture servers). No email. Signed-in players can read the name, picture and rating
  of every profile and change only their own display name; nobody can change a rating from the browser.
  0005 replaces this: no name or picture is copied or shown; players read the handle and the icon.
- `user_data`: one row per player with `settings`, `lessons`, `saved_game` and `unlocks`. Each is
  `{"at": <ms>, "v": <value>}`. A write keeps a section only when it is newer than the stored one, so a
  device that was offline cannot replace a newer copy; the reply gives the device the newer copy
  (`src/account/sync.ts`). Only the owner can read or write the row; `unlocks` is not writable from
  the browser.
- `delete_my_account()`: deletes the signed-in player's account; the profile and saved data go with
  it. Only signed-in players can call it, and only for themselves. 0008 replaces it: it now asks for a
  deletion after a 7-day grace.
- Signed-out visitors (`anon`) get nothing.

## Checking a migration before applying it

`node supabase/check-migration.mjs` runs the migration twice in Postgres compiled to WASM, with a
stand-in for Supabase's `auth` schema, and checks the trigger, the policies, the grants, the
newer-copy rule and the deletion, with the attacks a signed-in player could try on another's data. It needs `npm install --no-save @electric-sql/pglite` first.

## Plugin foundation: 0002 to 0004

Apply these files after `0001_accounts.sql`, in this order:

- `0002_matches.sql`: the old plugin match, command and invitation tables.
- `0003_plugin_boards.sql`: account-owned board links.
- `0004_plugin_board_recovery.sql`: a deleted match keeps its board for recovery.

Install the audience hook and runtime-role blocks 1–2 once, through the private admin path.

## Online games: 0005 to 0014

Apply only missing files in order, after 0001–0004, through the approved privileged SQL Editor path.
`npm run plugin:db:migrate` applies 0002–0022. Use it only for a disposable test database. Do not run its
`tsx` entry against a live database. For the 0014 MVP, apply the third to the eleventh blocks of
`plugin-deploy/runtime-role.sql` to the existing runtime role. The web section below adds block 12.
The migrations are safe to run again.

**Release order (a short outage).** The old and the new server code each need their own schema. The
plugin that is live now writes boards that 0006 refuses, so after 0006 its `kingdown_open` fails. The
new code needs 0005–0014 and the role blocks: its start check (`tools/plugin-db-check.mjs`) refuses to
serve without them, so every path of the function answers 503 and the next request tries again. Do it
in one short window:

1. Run `tools/deploy.sh` with no flag. It tests the one-project tree and publishes nothing.
2. Run `DEPLOY_LIVE_TIMEOUT_MS=900000 tools/deploy.sh --publish` with the owner's word. It
   publishes the `npm run build:vercel` tree to project `kingdown`. The live check waits while
   the function returns 503.
3. While it waits, apply 0005–0014, then blocks 3–11 of `plugin-deploy/runtime-role.sql`. For this
   MVP, first apply only missing 0005–0009 and blocks 3–6. Then paste the whole guarded
   [apply-0010-0013.sql](../docs/specs/chatgpt-mvp/release/apply-0010-0013.sql). It checks the
   foundation, then applies 0010, block 7, 0011, 0012, block 8, 0013, block 9, block 10, 0014, block 11 and 0015 in one
   transaction.
   The next request starts the server, and both live checks pass.
4. Before cron starts, confirm the one-project function serves `/internal/*` on `kingdown.dev`.
   Use the [release runbook](../docs/specs/chatgpt-mvp/release/RUNBOOK.md) for checks and recovery.

- `0005_accounts_v2.sql`: handles, a preset icon and the privacy settings on `profiles`
  (signed-in players read only `id`, `rating`, `handle` and `icon`: no longer the name and photo
  that 0001 copied from the provider); `reserved_handles`; `account_deletions`. A new account no
  longer copies the provider's name or photo.
- `0006_games.sql`: the game tables of both surfaces (`games`, `game_players`, `game_commands`,
  `game_invites`), `relations`, `reports`, `mod_actions`, `notifications`, `notification_prefs`,
  `alert_state` and `outbox`. RLS is on and the browser roles get nothing. A deleted account leaves
  its games to the opponent (`on delete set null`). Old plugin games stay in `plugin_matches`, unused;
  a board that showed one says "This game was deleted".

- `0007_jobs.sql`: two helpers in the private schema `kingdown_jobs` for
  the original release: the address for an alert email (removed by 0015), and the account deletion
  after the 7-day grace (it checks again that the deletion is due, that no report hold covers the
  player and that no game is active; it reserves the handle and deletes the solo games). Only the
  server role may call the deletion helper.
- `0008_accounts_safety.sql`: a changed handle stays reserved for its player and a deleted player's
  handle for good (a trigger on `profiles`, so every path keeps the rule). `delete_my_account()` now
  asks for a deletion after a 7-day grace, and a new sign-in in the grace cancels it (a trigger on
  `auth.sessions`; a token refresh keeps its session and cancels nothing). The server asks through
  `kingdown_jobs.request_deletion`, which sets the dates: the server role cannot write them. `reports.content` keeps the
  reported handle or preset, and `mod_actions.handle` the handle that a rename or hide took away.
  The public deletion text must show the seven-day grace before you expose 0008.
  Staff names that no player may take go in `reserved_handles` with reason `blocked`.
- `0009_invite_tries.sql`: one row for each player that counts the invitation-code tries in one hour.
  The game service refuses an 11th try (`RATE_LIMITED`) on the website and in ChatGPT; the 43-character
  link token is not counted.
- `0010_game_setup.sql`: the plugin game options (`options`, `draw`, `deal`, `level`), the game kind
  `random`, the status `setup` with its 3-day `setup_deadline_at`, the rematch columns, and for each seat
  its hidden `choice` and `ready`. A game saved before 0010 gets no options and the level `club`, and
  plays on as before. Role block 7 lets the server write the new columns.
- `0011_matchmaking.sql`: two indexes, for the open random games (the lobby and the 24-hour end) and for
  the count of players seen in the last 10 minutes. It needs no new grant.
- `0012_results.sql`: `player_ratings`, `rating_history` and `player_badges`. RLS is on and the browser
  roles get nothing. Role block 8 lets the server read and add rows and change only the rating columns.

- `0013_player_settings.sql`: `player_settings` stores the two board switches and the last setup.
  Both switches default off. RLS is on and the browser roles get nothing. `plugin_boards.game_selected`
  tells an empty home board from a deleted game. `created_at` lets daily cleanup delete boards older
  than 7 days. Role block 9 grants these reads and writes, board deletion and a handle check.
  Role block 10 lets daily cleanup delete a report older than 12 months that no hold covers, and no
  other report (a restrictive policy on the database clock).

- `0014_plugin_tool_tries.sql`: one counter for each user and tool. Role block 11 grants the server access. Browser roles have no access.

`npm run plugin:db:init-test` applies 0001–0022 twice to a disposable loopback database, and
`src/match/service.db.test.ts`, `src/match/setup.db.test.ts`, `src/match/matchmaking.db.test.ts`,
`src/match/results.db.test.ts`, `src/online/jobs.db.test.ts`, `src/online/accounts.db.test.ts` and
`src/api/http.db.test.ts` check them.

## Email removal: 0015

- `0015_remove_email.sql`: removes the private email reader and its runtime grant. Deploy code
  without email jobs first. Startup works before and after removal; the runtime keeps its account
  deletion grant. The guarded release paste includes 0015. An existing 0014 schema needs only 0015.

## Web account access: 0016

For a new database after 0001–0004, apply 0005–0022, then blocks 3–13 of `plugin-deploy/runtime-role.sql`.
An existing database needs only the missing files and blocks, under the authority below.

Apply only missing migrations in order through `0016_web_account_access.sql`, then block 12 of
`plugin-deploy/runtime-role.sql`. This work needs the owner's specific database-write go. The
guarded 0010–0015 release paste stops before web access. Do not use the `tsx` migration command on a live
database. Use the approved SQL Editor procedure in
[account-off.md](../docs/specs/web-build/account-off.md).

- `0016_web_account_access.sql`: `web_account_access` holds one operator switch. A new row has
  `enabled = false`. A repeated migration keeps an existing value. RLS is on. The runtime role
  can SELECT only. PUBLIC, `anon` and `authenticated` have no direct access. The web getter
  closes access if the row, table or grant is absent. This table is not part of the plugin's
  required start check.

`tools/plugin-db/web-account-access.db.test.ts` rebuilds an explicit 0001–0015 baseline in its
own disposable database. It applies 0016, then block 12. It checks old data, repeated application,
the effective grants and plugin reads before and after the upgrade. CI runs it in
`plugin-checks.yml`, job `verify`, through full `npm test` with its disposable database.

## Job schedules for the private MVP

Not a migration: the local test database has no pg_cron or pg_net. After the deploy that serves
`/internal/*`, turn on pg_cron and pg_net, store the internal secret in Vault as
`kingdown_internal_secret`, then paste only
[docs/specs/chatgpt-mvp/release/cron-mvp.sql](../docs/specs/chatgpt-mvp/release/cron-mvp.sql) into
the SQL Editor for this MVP. `ops/cron.sql` is the source copy. The server reads the same
secret from `KINGDOWN_INTERNAL_SECRET` (at least 32 characters; without it, `/internal/*` answers 503). It schedules
`/internal/tick` (each minute), `/internal/daily` (03:17 UTC) and cron history cleanup.
The MVP sends no email. The file removes `kingdown-outbox` and `kingdown-reminders`
if an older release made them. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset.
Cleanup deletes outbox rows that were created or finished at least 30 days ago, including rows with no `done_at` (`src/online/jobs.ts`, `cleanup`).
Confirm the two internal routes work before you paste the MVP file.

## Drawn setup continuity: 0017

- `0017_setup_admission.sql`: stores the finite admission contract beside the existing engine fingerprint. Apply it before this server build. It does not guess an engine or contract for unstamped pending games. Such games refuse further preparation until an explicit baseline is established.

## Rating policy transition: 0018

- `0018_rating_policy.sql`: gives existing games and old server inserts the `legacy` policy. New server starts explicitly write `casual` or `ranked-v1`. A game cannot change its policy. It does not change old rating history.
- Recovery must use a policy-aware writer. Before recovery, verify that a new Casual finish adds no rating history and changes no rating value. An older writer can rate Casual games and is not a valid recovery target. Disable match writes until a tested forward recovery is ready.

## Fault reports: 0019

- `0019_client_errors.sql`: stores fault counts for 30 days. Browser roles have no access. Apply it on staging and production before a deploy with the recorder. It grants access to an existing runtime role. A new database uses block 13 of `plugin-deploy/runtime-role.sql`.

## Account deletion grace: 0020

- `0020_deletion_utc.sql`: sets UTC for `kingdown_jobs.request_deletion(uuid)`.
  The column default uses 168 hours. A caller's time zone cannot change the grace.
  Existing rows and grants stay the same.
  Apply 0020 on staging before a deploy that depends on it.
  Apply 0020 on production before the release that carries it.

## History draw: 0021

- `0021_history_draw.sql`: adds the end reason `history` to the `end_reason` check of `public.games`.
  A turn that fills the game history ends the game as a draw with this reason (server audit F5).
  Existing rows and grants stay the same.
  Apply 0021 on staging before a deploy that depends on it.
  Apply 0021 on production before the release that carries it.

## Friend invitations: 0022

- `0022_friend_invites.sql`: adds a named recipient, terminal state, close time and count indexes.
  It keeps row security and runtime grants. It checks duplicates before the unique game constraint.
  Account deletion ends affected waiting games and removes sent and received invitations in one transaction.
  It also removes raw recipient fields from old command receipts.
  Apply 0022 on staging before a deploy that depends on it.
  Apply 0022 on production before the release that carries it.
  The owner session runs each remote migration. This build tests only the local disposable cluster.

Run each `-- migrate:next` phase as a separate query, in file order. Do not put the file in one transaction.
The migration and test bootstrap tools use `applyMigration` for these phases.

1. Pause `kingdown-daily` before the first phase. In the SQL Editor, run `select cron.alter_job(jobid, active := false) from cron.job where jobname='kingdown-daily';`. Confirm that its `active` value is false. Do not call `/internal/daily` by hand. Check the daily handler logs and let any daily request already sent by pg_net finish before the first phase. The daily route runs deletion and cleanup. The minute tick can continue.
2. Add columns, the old-join trigger and the named-delete constraint trigger in one short transaction. Add the game-end trigger in the next short transaction. Keep the game and invitation schema locks separate: an old join reads an invitation before it locks the game. The old join still writes only `used_by` and `used_at`; its trigger sets `state` and `closed_at`. It refuses a named join by a different account. It also refuses a recipient change or an expiry extension. Both servers rotate codes with delete and insert. The deferred delete check runs at commit and requires the same recipient and no later expiry on the replacement row. Thus old rotation fails and new rotation passes. Account cleanup and game deletion still pass. The game-end trigger closes open invitations when an old writer aborts, finishes or expires a game, including a deletion job's game-end write. Accepted and declined rows keep their state. Game deletion removes its invitations through the existing foreign key.
3. Backfill old rows and check for duplicates after the schema locks end. Repair duplicate rows before the next phase.
4. Build the unique and count indexes with `CONCURRENTLY`. Attach the unique index and add `NOT VALID` checks in a short transaction. Validate them in the next phase. Data scans do not hold the schema locks.
5. Apply the deletion function and runtime grants. The function locks all affected games in ID order before it checks active seats. An old join that wins the game lock keeps the account; a deletion that wins ends the waiting game before a join can read it. Validate the tool check. Confirm that all indexes are valid and all constraints pass before the new server deploys.
6. Deploy the new server after the last phase. Check old and new invitation joins on staging. Stop routing requests to the old release and let all old requests finish. Keep all three triggers while any old server can write. Do not resume deletion on a mixed release: old create and rematch paths do not take the new account locks.
7. After all writers use the new account locks, resume with `select cron.alter_job(jobid, active := true) from cron.job where jobname='kingdown-daily';`. Confirm that `active` is true and the next daily job completes. Due deletion rows remain due during the pause. If the release stops or rolls back to the old server, keep daily jobs paused. Before rollback, pause daily jobs and let active daily requests finish; keep migration 0022 and all three triggers. The old server does not know named invitations: it shows a named preview to any account with the link, checks the wrong account's invitation setting, skips the friend game limit and can accept just after expiry. So end every open named invitation before the old server serves requests: `update public.game_invites set expires_at=least(expires_at,statement_timestamp()-interval '1 minute'),state='cancelled',closed_at=statement_timestamp() where state='open' and recipient_id is not null;`. The minute covers an app clock that runs behind the database clock. Then route to the old server, let all new-server requests finish, and run the same statement again, for invitations that the new server sent during the switch. The old server refuses an expired invitation in preview and join. Until the second statement runs, a different account and old code rotation still get a database refusal, and the whole write rolls back. Open links keep the old behavior: the friend game limit and the sent invitation limit do not apply until the new server returns. The new server's sweep does not end a waiting game whose named invitation is cancelled; the old minute sweep ends it as `no_start`. Before you restore the new server, confirm that this query returns 0, and abort each game it finds if it does not: `select count(*) from public.games g where g.status='waiting' and exists(select from public.game_invites i where i.game_id=g.id and i.recipient_id is not null and i.state='cancelled');`. Restore the new server and drain all old requests before daily jobs resume. Use the same order for the approved production release.

Schema steps have a five-second lock timeout. If a step fails, stop before the deploy and repeat after the cause is fixed.
A failed concurrent build can leave an invalid index. Drop only that failed index with `DROP INDEX CONCURRENTLY`, then repeat 0022.
The file checks for invalid indexes before it attaches constraints. Do not skip that check.
