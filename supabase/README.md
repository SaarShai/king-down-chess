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

## What 0001 makes

- `profiles`: display name, picture, rating (1200 at the start). Made by a trigger when an account is
  made, from the name and picture the sign-in service sends. No email. Signed-in players can read
  every profile and change only their own display name; nobody can change a rating from the browser.
- `user_data`: one row per player with `settings`, `lessons`, `saved_game` and `unlocks`. Each is
  `{"at": <ms>, "v": <value>}`; the game keeps the newer copy of each (`src/account/sync.ts`). Only
  the owner can read or write the row; `unlocks` is not writable from the browser.
- `delete_my_account()`: deletes the signed-in player's account; the profile and saved data go with
  it. Only signed-in players can call it, and only for themselves.
- Signed-out visitors (`anon`) get nothing.

## Checking a migration before applying it

`node supabase/check-migration.mjs` runs the migration twice in Postgres compiled to WASM, with a
stand-in for Supabase's `auth` schema, and checks the trigger, the policies, the grants and the
deletion. It needs `npm install --no-save @electric-sql/pglite` first.
