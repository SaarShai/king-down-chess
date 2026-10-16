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
   accounts through the API with any name, and every account gets a profile.

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

## Online games: 0005 to 0013

Not applied yet. Apply them in order, after 0001–0004, with a privileged connection
(`npm run plugin:db:migrate` applies 0002–0013). Then apply the third to the tenth blocks of
`plugin-deploy/runtime-role.sql` to the existing runtime role. The migrations are safe to run again.

**Release order (a short outage).** The old and the new server code each need their own schema. The
plugin that is live now writes boards that 0006 refuses, so after 0006 its `kingdown_open` fails. The
new code needs 0005–0013 and the role blocks: its start check (`tools/plugin-db-check.mjs`) refuses to
serve without them, so every path of the function answers 503 and the next request tries again. Do it
in one short window:

1. Run `tools/deploy.sh` with no flag. It tests the one-project tree and publishes nothing.
2. Run `DEPLOY_LIVE_TIMEOUT_MS=900000 tools/deploy.sh --publish` with the owner's word. It
   publishes the `npm run build:vercel` tree to project `kingdown`. The live check waits while
   the function returns 503.
3. While it waits, apply 0005–0013, then blocks 3–10 of `plugin-deploy/runtime-role.sql`. For this
   MVP, first apply only missing 0005–0009 and blocks 3–6. Then paste the whole guarded
   [apply-0010-0013.sql](../docs/specs/chatgpt-mvp/release/apply-0010-0013.sql). It checks the
   foundation, then applies 0010, block 7, 0011, 0012, block 8, 0013, block 9 and block 10 in one
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

- `0007_jobs.sql`: two helpers in the private schema `kingdown_jobs` for the jobs of
  `src/online/jobs.ts`: the address for an alert email (from `auth.users`), and the account deletion
  after the 7-day grace (it checks again that the deletion is due, that no report hold covers the
  player and that no game is active; it reserves the handle and deletes the solo games). Only the
  server role may call them.
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

`npm run plugin:db:init-test` applies 0001–0013 twice to a disposable loopback database, and
`src/match/service.db.test.ts`, `src/match/setup.db.test.ts`, `src/match/matchmaking.db.test.ts`,
`src/match/results.db.test.ts`, `src/online/jobs.db.test.ts`, `src/online/accounts.db.test.ts` and
`src/api/http.db.test.ts` check them.

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
Outbox rows with no `done_at` stay in the database; cleanup deletes only finished rows.
Confirm the two internal routes work before you paste the MVP file.
