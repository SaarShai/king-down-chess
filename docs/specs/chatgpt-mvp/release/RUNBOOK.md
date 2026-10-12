# Private release runbook

## Preparation plan

1. Check the migration files, role blocks, release path, and screen words.
2. Write a failing test for the release SQL file. Add the three jobs and the guarded removal. Run `npm test` again.
3. Write the tester guide and the live check table. Check each source link and each migration name.
4. Run `npm test`. Commit and push the preparation branch. Leave all live results empty.

Pass criteria: the SQL file schedules only tick, daily, and history. It removes old alert jobs if they exist. The runbook lists each migration after 0009, its role block, checks, and rollback. The guide uses the screen words. The live table covers ticket 19. No release action runs in preparation.

Preparation checks: the new test first fails because the SQL file is absent. With the file present, `npm test` passes: 2,229 tests pass, 121 skip, and 50 artwork checks pass. Local checks confirm all document links, the retained cron statements, and role blocks 7–9. No live check runs. Skipped tests do not give database evidence.

## Release gate and sources

This file prepares ticket 19. It does not approve a release. Ticket 18 must pass first. The owner gives the word for each step marked **Owner word**. An agent runs such a step only with that word. Record the word, date, release commit, and result in the release record. Use test accounts; never use the owner's signed-in account for site checks.

**Release gap at preparation base `52380cb6`:** `tools/deploy.sh` does not yet publish the combined site tree. The website target copies only `dist`. The plugin target pins the old separate project. `--configure-plugin` also pins that project. `vercel.json` still redirects `/authorize` to the old origin. Stop before any live change until ticket 18 or a separate approved ticket fixes and checks this path. This documents the required path; it does not change the deploy code.

**Guide check after ticket 15:** at this base, `src/plugin/screens/end.ts` is a stub. The board does not yet show all the approved card and game controls. After ticket 15 joins the integration branch, compare the guide's play and return instructions with the final board and end screens. Use their actual button words before the guide goes to testers. Do not treat this packet as evidence that those screens pass.

The [database README](../../../../supabase/README.md) lists every migration after 0009: 0010, 0011, 0012, 0013. It names 0001 and 0005–0013, but omits the full file names for `0002_matches.sql`, `0003_plugin_boards.sql`, and `0004_plugin_board_recovery.sql`. Confirm those three in the live migration record. Do not assume they are missing from the database.

Sources: [spec](../spec.md), [ticket 19](../issues/19-release.md), [multiplayer ticket 03](../../accounts-multiplayer/issues/03-engine-archive-one-project.md), [runtime role](../../../../plugin-deploy/runtime-role.sql), [OAuth hook](../../../../plugin-deploy/oauth-audience-hook.sql), and [private connection notes](../../../plugin-preparation.md). Screen words come from [the app page](../../../../src/plugin/index.html) and [screens](../../../../src/plugin/screens/). Current host menu names remain a live check. This preparation makes no network request to a live service.

## Release steps

1. **Select the release.** Check that ticket 18 has no open required fix. Confirm the owner accepts the rendered screens. Code reaches main through a PR; the owner or merger handles that PR. Record the approved `origin/main` commit. The deploy script tests that commit, not this preparation branch. Confirm all required engine bundles are committed on main.

   Check: the release diff, ticket 18 record, and engine fixtures agree. Run `npm test`, `npm run build:vercel`, `npm run check:vercel`, and the plugin browser checks in a clean worktree. A check that can take more than two minutes runs detached; read its log and exit code.

   Rollback: stop before live work. Correct the release branch and repeat the failed check.

2. **Owner word — save recovery state and stop old alerts.** Take a verified database backup through the approved private admin path. Keep its location and restore procedure private. Record the current deployment ID, migration state, runtime grants, OAuth client rows, redirect entries, and environment name list. Do not put secret values in a ticket or log. Verify that a compatible prior deployment and a database recovery point exist.

   If pg_cron exists, run only this guarded removal in the SQL Editor before the outage. If it does not exist, no old cron job exists; continue to step 13.

   ```sql
   select cron.unschedule(jobid) from cron.job
   where jobname in ('kingdown-outbox', 'kingdown-reminders');
   ```

   Check: neither job remains in `cron.job`. Inspect pending pg_net requests; allow an alert request already sent to finish before the test window. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset throughout this release.

   Rollback: stop the release. Leave these two jobs absent. Do not restore email or push schedules for this MVP. A backup restore needs a separate owner's word.

3. **Check the two Supabase requirements. Owner word for a change.** In Auth, confirm that sessions use an asymmetric signing key, ES256 or RS256, with a public JWKS. Do not copy a private key. Confirm that the admin role can install the trigger on `auth.sessions` required by 0008. If 0008 is present, check `on_auth_session_created` and `public.cancel_deletion_on_sign_in()`.

   Check: a fresh test sign-in uses the asymmetric session key. The 0008 trigger runs after insert on `auth.sessions`. A new sign-in cancels a test deletion request in its seven-day grace; a token refresh does not cancel it. Use a test request only, not an actual account deletion.

   Rollback: if either requirement fails, stop. Leave the existing key and trigger in place. If the owner authorizes a setting change, record its prior state first; restore that state only with the owner's word. Do not remove a key still in use.

4. **Owner word — register the new OAuth client.** Keep the Supabase Site URL. Keep the OAuth Authorization Path `/authorize`. Register a new public PKCE client. Copy the exact callback from the new ChatGPT connection form; do not guess it or use a wildcard. Keep dynamic registration off. Keep the current hook's other behavior. Add the new client to `kingdown_oauth.client_resources` with the resource `https://kingdown.dev/mcp`. The hook maps one client to one resource, so keep the old client's row separate.

   Add `https://kingdown.dev/authorize` to the Supabase Redirect URLs. Also add the exact consent origin `https://kingdown.dev`, with no slash, path, or query. Check the social sign-in return pattern against the real PKCE flow, including `authorization_id`. Use only the enabled test sign-in providers. Do not change DNS.

   Check: the client uses its exact callback and S256. The hook keeps the other claims. A new-client token has the new MCP audience. An old-client token does not pass at the new resource. Check without logging token values.

   Rollback: remove only the new client row, new client, and redirect entries added for it. Preserve entries used by the website or old connection. Restore a changed hook from the saved version with the owner's word.

5. **Owner word — set the combined project's production environment.** Use the Vercel project `kingdown`, through the approved deploy configuration path once step 1's gap is fixed. Set the origin to the site origin and the client allowlist to the new client. Use the restricted runtime database role, with TLS certificate and host checks. The engine check uses a separate read-only connection. Set OAuth readiness only after step 4 passes. Store the internal secret in the private server configuration; step 13 uses the same secret in Vault.

   Environment names only:

   - `KINGDOWN_PLUGIN_ORIGIN`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`
   - `KINGDOWN_PLUGIN_DATABASE_URL`
   - `KINGDOWN_PLUGIN_OAUTH_READY`
   - `KINGDOWN_INTERNAL_SECRET`
   - `KINGDOWN_ENGINES_DATABASE_URL`

   Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset. `PLUGIN_TEST_DATABASE_URL` is a local check input, not a production setting. `DEPLOY_LIVE_TIMEOUT_MS` is a release command setting, not a secret.

   Check: the names, project, origin, role, and TLS mode agree with the release. No local-persona setting exists in production. No value appears in the release log.

   Rollback: restore the previous environment through the private configuration path. Keep the mail settings unset. If a deployment is required to apply the restore, obtain the owner's word for it.

6. **Check the publish path before the outage.** The corrected `tools/deploy.sh` must build `npm run build:vercel` and publish the tested `kingdown-deploy/.vercel/output` tree to `kingdown` as a prebuilt production deployment. It must include engine guards, combined-site checks, plugin protocol and browser checks, and both live checks. The `/authorize` redirect to the old origin must be absent. The function must serve `/mcp`, `/authorize`, `/consent.mjs`, both OAuth metadata paths, `/api/*`, and `/internal/*` with the original request path.

   Check: run `tools/deploy.sh` without `--publish` only after the corrected path is on main. It must publish nothing and test the combined tree. `npm run check:vercel` checks local route dispatch. A preview publish and its route check need the owner's word too. Configure the live timeout before publication; it must allow the migration window below.

   Rollback: stop if any check fails or the path still uses the old project. No manual Vercel command substitutes for the deploy script.

7. **Owner word — publish and hold the migration window.** Tell private testers the outage starts. Run the corrected `tools/deploy.sh --publish` with `DEPLOY_LIVE_TIMEOUT_MS=900000`. Run it detached. A second authorized operator applies steps 8–11 while its live check waits. The new server may answer 503 until the schema and grants are complete. Use the approved admin SQL Editor for each migration; use no runtime connection for DDL.

   Check: the log names the approved commit and `kingdown` project. It publishes the tested combined tree. A 503 during the schema window is expected. After step 11, both live checks must pass. Do not claim a pass from a build alone.

   Rollback: stop new play and disable the three MVP jobs if present. Restore the recorded prior compatible deployment through the approved deploy path with the owner's word. If 0006 changes board links, the old plugin cannot use those links. A code rollback alone is then insufficient; use the verified pre-window database backup with a separate owner's word. Do not drop tables to improvise a rollback.

8. **Owner word — apply the foundation and 0010.** Confirm 0001–0004 and the audience hook already exist. Apply any missing migrations 0005–0009 in numeric order. Then apply runtime-role blocks 3–6 in order, to the existing role. Do not rerun block 1's `create role`. Before 0008, confirm account-deletion text says seven-day grace, or stop that exposed path. 0006 changes board links to the game service; old plugin test games stop being used.

   Apply [0010_game_setup.sql](../../../../supabase/migrations/0010_game_setup.sql), then **role block 7** from `plugin-deploy/runtime-role.sql` (copy below). This adds game options, draw, deal, computer level, setup deadline, rematch fields, hidden seat choice, and Ready. It allows random games and setup status. Existing game rows keep a Club level and no options.

   Check: migration 0010 commits. Check the new columns and `games_setup_deadline` index. As the runtime role, read the columns and check update rights for the block 7 columns. Browser roles retain no game access. The server can still answer 503 until steps 10–11 finish.

   Rollback: a failed transaction leaves that file unapplied. Stop and correct the failure; repeat the file only after review. After commit, retain the new columns and data. Stop play; restore the prior compatible code. Use the pre-window database backup only if required and with the owner's word. There is no down migration.

9. **Owner word — apply [0011_matchmaking.sql](../../../../supabase/migrations/0011_matchmaking.sql).** Apply the whole file after 0010. **Role block: none.** It adds `games_random_waiting` and `game_players_recent`. The existing grants suffice.

   Check: both indexes exist with the predicates and columns in the file. The lobby read uses the runtime role. No browser grant changes.

   Rollback: a failed transaction leaves no partial change. After commit, keep the indexes during a code rollback; they preserve data and do not add permissions. There is no down migration.

10. **Owner word — apply [0012_results.sql](../../../../supabase/migrations/0012_results.sql), then role block 8.** Apply the whole migration, then the complete block below. It adds ratings, rating history, and earned badges. The role can update rating fields, but cannot update result history or badge rows.

    Check: `player_ratings`, `rating_history`, and `player_badges` exist with RLS on. Browser roles get no access. Runtime SELECT and INSERT work; rating-field UPDATE is allowed. History and badge UPDATE are not allowed. New ratings start at 1500.

    Rollback: a failed transaction leaves that file unapplied. After commit, retain all result rows and tables. Stop play and restore prior compatible code if needed. A data restore requires the owner's word. There is no down migration.

11. **Owner word — apply [0013_player_settings.sql](../../../../supabase/migrations/0013_player_settings.sql), then role block 9.** Apply the whole migration, then the complete block below. It adds `player_settings` and `plugin_boards.game_selected`. Both board switches default off. The role gets settings access, a reserved-handle read, and the board-column writes.

    Check: the settings table has RLS; browser roles get no access. The runtime role can read and write settings, read reserved handles, and insert/update `game_selected`. Run the full startup probes from [plugin-db-check.mjs](../../../../tools/plugin-db-check.mjs) as the runtime role. The required privilege result is true. New startup succeeds; 503 ends. Read the detached publish log and both live-check results.

    Rollback: a failed transaction leaves that file unapplied. After commit, keep settings and board selections. Stop play and restore compatible code. Use the backup only with the owner's word. There is no down migration.

12. **Check the new service.** Check OAuth discovery, an unsigned MCP challenge, and the consent script at the new origin. `/authorize` serves the function and preserves `authorization_id`. Verify the actual build and engine archive, not only a 200 status. Check runtime-role effective access; do not remove shared PUBLIC grants to repair one role.

    Check: fresh test accounts complete consent and can open the app. The new audience works; the old audience fails. Confirm the release resource hash in a new conversation after Refresh.

    Rollback: if a required check fails, keep testers out. Use step 7's recovery path. Do not enable cron until the service passes.

13. **Owner word — install only the MVP jobs.** Enable pg_cron and pg_net if needed. Put the internal secret in Vault under `kingdown_internal_secret`, through the private secret path. Never paste its value into this document or a log. Paste only [cron-mvp.sql](cron-mvp.sql) into the SQL Editor. Do not paste `supabase/ops/cron.sql` for this release.

    The copy removes any old outbox and reminder jobs by job ID only if they exist. It schedules tick each minute, daily at 03:17 UTC, and cron history cleanup at 03:47 UTC. Tick ends expired setups, friend codes, and 24-hour open games. Daily handles due account deletions and cleanup. The history job keeps seven days of cron results.

    Check: `npm test` includes `tools/cron-mvp.docs.test.ts`; it proves there are exactly three allowed schedules and no alert endpoint call. In the live SQL Editor, run:

    ```sql
    select jobname, schedule, active from cron.job
    where jobname like 'kingdown-%' order by jobname;
    ```

    Expect only `kingdown-cron-history`, `kingdown-daily`, and `kingdown-tick`, each active. Check their run results and HTTP outcomes; a successful cron invocation alone does not prove its HTTP call succeeds. If an unexpected King Down job exists, stop and obtain the owner's word to remove it.

    **Outbox rows stay with `done_at` null.** No outbox worker runs. `cleanup()` deletes only rows finished more than 30 days ago. It does not remove these pending rows. Record the pending count without logging payloads. Do not send them during recovery. No email or push is part of this MVP.

    Rollback: remove these three jobs with the guarded query below. Retain the helper, extensions, Vault entry, and pending rows unless a separate approved recovery needs a change. Never restore the two alert jobs.

    ```sql
    select cron.unschedule(jobid) from cron.job
    where jobname in ('kingdown-tick', 'kingdown-daily', 'kingdown-cron-history');
    ```

14. **Owner word — connect the two private test accounts.** Add a new ChatGPT connection for `https://kingdown.dev/mcp` and the new public client. Sign in again. Tokens for the old resource do not pass. Use Refresh for changed tools, then a new conversation for the new UI resource. Give testers [TESTER-GUIDE.md](TESTER-GUIDE.md) and the approved private report channel. Verify its web and iPhone menu paths before you distribute it.

    Check: accounts A and B each open Play on web and iPhone. The accounts remain separate. The guide names the controls that the build shows.

    Rollback: remove the new test connection and pause the test. Keep account records. Reconnect only to an approved compatible service after recovery.

15. **Owner word — complete [LIVE-CHECKS.md](LIVE-CHECKS.md) and admit testers.** Run all required rows, including every feature mix and the three-second waiting check under Always ask on web and iPhone. Record “not shown” if the private side-panel or sidebar entry is absent; those two entries do not block release. Repeated approval prompts need the owner's decision before tester access. Record failures and fixes; rerun the affected checks.

    Check: the owner accepts the live evidence and any stated limits. No required result cell stays empty. Keep the release commit and guide version with the record.

    Rollback: pause tester access. Remove the MVP jobs if the fault involves job work. Use the saved deployment and database recovery plan with the owner's word.

16. **Owner word — retire the old connection after one week.** Keep the old OAuth client and connection for the ticket 03 transition week only if they are safe. The approved MVP ends old test games; the week does not promise those games continue. Do not invite testers to the old service. After the week, remove the old connection, its client-resource row, its OAuth client, and the old separate project. Check for other users before any removal.

    Check: the new connection remains the sole tester path. The new OAuth row, redirect entries, and site project still work.

    Rollback: postpone removal if any dependency remains. Once the old project or client is deleted, recovery may need a new client and consent. Keep the current service; do not recreate the old one without the owner's word.

## Runtime role blocks after 0009

Copy each complete transaction at its step. These are blocks 7, 8, and 9 from the runtime-role file at the preparation base. At release, compare them with the approved commit. If they differ, stop and update this packet before live work.

### Block 7

```sql
-- Apply after migration 0010: choices stay in the service until both seats are ready.
begin;
grant update (setup, rules, engine_fingerprint, setup_deadline_at, rematch_offer, rematch_game_id) on public.games to kingdown_plugin_runtime;
grant update (choice, ready, power) on public.game_players to kingdown_plugin_runtime;
commit;
```

### Block 8

```sql
-- Apply after migration 0012: ratings and result history. Result rows cannot change after the game ends.
begin;
grant select, insert, update (rating, rd, volatility, last_game_at) on public.player_ratings to kingdown_plugin_runtime;
grant select, insert on public.rating_history, public.player_badges to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_ratings;
create policy kingdown_plugin_runtime on public.player_ratings for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.rating_history;
create policy kingdown_plugin_runtime on public.rating_history for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.player_badges;
create policy kingdown_plugin_runtime on public.player_badges for all to kingdown_plugin_runtime using (true) with check (true);
commit;
```

### Block 9

```sql
-- Apply after migration 0013: home boards and account settings.
begin;
grant insert (game_selected), update (game_selected) on public.plugin_boards to kingdown_plugin_runtime;
grant select (handle) on public.reserved_handles to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.reserved_handles;
create policy kingdown_plugin_runtime on public.reserved_handles for select to kingdown_plugin_runtime using (true);
grant select, insert, update (symbols_only, show_threats, last_setup) on public.player_settings to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_settings;
create policy kingdown_plugin_runtime on public.player_settings for all to kingdown_plugin_runtime using (true) with check (true);
commit;
```
