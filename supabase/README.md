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
   The user disappears from **Authentication → Users**, with its `profiles` and `user_data` rows.
5. **Authentication → Sign In / Providers**: turn **Email** off, and keep **Allow anonymous sign-ins**
   off. The game signs in only with Google, GitHub and Facebook. With Email on, anyone can make
   accounts through the API with any name, and every account gets a profile.

## What 0001 makes

- `profiles`: display name, picture, rating (1200 at the start). Made by a trigger when an account is
  made, from the name and picture the sign-in service sends (a picture only from Google's, GitHub's
  or Facebook's picture servers). No email. Signed-in players can read the name, picture and rating
  of every profile and change only their own display name; nobody can change a rating from the browser.
- `user_data`: one row per player with `settings`, `lessons`, `saved_game` and `unlocks`. Each is
  `{"at": <ms>, "v": <value>}`. A write keeps a section only when it is newer than the stored one, so a
  device that was offline cannot replace a newer copy; the reply gives the device the newer copy
  (`src/account/sync.ts`). Only the owner can read or write the row; `unlocks` is not writable from
  the browser.
- `delete_my_account()`: deletes the signed-in player's account; the profile and saved data go with
  it. Only signed-in players can call it, and only for themselves.
- Signed-out visitors (`anon`) get nothing.

## Checking a migration before applying it

`node supabase/check-migration.mjs` runs the migration twice in Postgres compiled to WASM, with a
stand-in for Supabase's `auth` schema, and checks the trigger, the policies, the grants, the
newer-copy rule and the deletion, with the attacks a signed-in player could try on another's data. It needs `npm install --no-save @electric-sql/pglite` first.

## Online games: 0005 to 0009

Not applied yet. Apply them in order, after 0001–0004, with a privileged connection
(`npm run plugin:db:migrate` applies 0002–0009). Then apply the third to the sixth blocks of
`plugin-deploy/runtime-role.sql` to the existing runtime role. The migrations are safe to run again.

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
  `auth.sessions`; a token refresh keeps its session and cancels nothing). `reports.content` keeps the
  reported handle or preset, and `mod_actions.handle` the handle that a rename or hide took away.
  The website text still says that a deletion is at once: change it before you apply 0008.
  Staff names that no player may take go in `reserved_handles` with reason `blocked`.
- `0009_invite_tries.sql`: one row for each player that counts the invitation-code tries in one hour.
  The game service refuses an 11th try (`RATE_LIMITED`) on the website and in ChatGPT; the 43-character
  link token is not counted.

`npm run plugin:db:init-test` applies 0001–0009 twice to a disposable loopback database, and
`src/match/service.db.test.ts`, `src/online/jobs.db.test.ts`, `src/online/accounts.db.test.ts` and
`src/api/http.db.test.ts` check them.

## Job schedules: ops/cron.sql

Not a migration: the local test database has no pg_cron or pg_net. After the deploy that serves
`/internal/*`, turn on pg_cron and pg_net, store the internal secret in Vault as
`kingdown_internal_secret`, then paste `ops/cron.sql` into the SQL editor. The server reads the same
secret from `KINGDOWN_INTERNAL_SECRET` (at least 32 characters; without it, `/internal/*` answers 503). It schedules
`/internal/tick` (each minute), `/internal/outbox` (each 10 seconds, only when a row is due),
`/internal/reminders` (each 10 minutes) and `/internal/daily` (03:17 UTC). The file says what to
change on a Postgres version older than 15.1.1.61.
