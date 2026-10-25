# Private release runbook

## Release notes: server limits and codes

Each user has these limits: 120 Computer calls per minute, 60 Create calls per minute,
60 Open calls per minute and 30 reports per hour. Find shares the Create count. A refused call counts. The server returns
`RATE_LIMITED` with the wait time. Each user can hold three of the four active HTTP slots. The fourth stays available to another user.

Short invite codes use HMAC-SHA-256 with `KINGDOWN_INTERNAL_SECRET`. Keep the same secret
on every server instance and across restarts. Each new invitation needs the secret. An absent
secret, or one shorter than 32 characters, stops all new invitations (codes and links) and all
short-code joins. Both deploy configure paths require it. Short codes from the earlier build (plain SHA-256)
still work for their normal life (up to 7 days), through a legacy lookup that goes after that window. Long invite
links still work. A secret change ends the HMAC short codes made after this release; legacy codes keep working
until they expire.

## Preparation and release gate

The owner approves preparation on 2026-10-12: "do ticket 19 and anything else you need to do to get it ready to go live. don't stop to ask me."
Preparation runs no live action. The owner gives the word for each live step. Record the word, date, release commit and result. Use test accounts for all site checks.

Plan: test the guarded SQL paste, check account text, match the final screens, then run local checks. The ticket holds the check counts. Leave live result cells empty.

**Release gap:** the deploy change must join the final release before publication. Its contract is `tools/deploy.sh` for tests only, `tools/deploy.sh --configure <private-env-file>` for production settings, and `tools/deploy.sh --publish` for publication to project `kingdown`. Both tests and publication use `npm run build:vercel`. No old target flag or separate plugin project is part of this release. Check that contract on the approved main commit in steps 1 and 6.

Tickets 15 and 18 are in the preparation base. This packet uses the final board, end, seat, lobby and profile screens. Friend and random creates need game options. Reports stay app-only, with no Report control. `/api` and every `/api/*` path go to the plugin function (`/mcp`). The website API stays closed until the 0016 `web_account_access` switch opens. The MVP schedules no outbox or reminder worker.

Sources: [spec](../spec.md), [ticket 19](../issues/19-release.md), [one-project decision](../../accounts-multiplayer/issues/03-engine-archive-one-project.md), [database order](../../../../supabase/README.md), [runtime role](../../../../plugin-deploy/runtime-role.sql), [OAuth hook](../../../../plugin-deploy/oauth-audience-hook.sql), [connection notes](../../../plugin-preparation.md), [app page](../../../../src/plugin/index.html) and [screens](../../../../src/plugin/screens/).
Use [OWNER-STEPS.md](OWNER-STEPS.md) for the short checklist.

## Release steps

1. **Select the release.** Confirm ticket 18 passes and the owner accepts the rendered screens. The merger puts the code on main through a PR. Record the approved `origin/main` commit. Confirm its engine bundles and fixtures are committed.

   Check: in a clean worktree, run `npm test`, `npm run build:vercel`, `npm run check:vercel` and the plugin browser checks. Run long commands detached and read their logs and exit codes.

   Rollback: stop before live work. Correct the branch and repeat each failed check.

2. **Owner word — save recovery state and stop old alerts.** Take a verified database backup through the private admin path. Keep the restore path private. Record the current deployment ID and source commit, migration state, grants, OAuth clients, redirect entries and environment names. Keep secret values out of logs.

   If pg_cron exists, run this guarded removal in the SQL Editor. If the extension is absent, there is no old cron job to remove.

   ```sql
   select cron.unschedule(jobid) from cron.job
   where jobname in ('kingdown-outbox', 'kingdown-reminders');
   ```

   Check: neither job remains. Let any alert request already sent finish before the test window. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset.

   Rollback: stop. Keep the alert jobs absent. A backup restore needs a separate owner's word.

3. **Check the two Supabase requirements. Owner word for a change.** In Auth, confirm ES256 or RS256 session signing and a public JWKS. Confirm the admin role can install the 0008 trigger on `auth.sessions`. If 0008 exists, check `on_auth_session_created` and `public.cancel_deletion_on_sign_in()`.

   Check: a fresh test sign-in uses the asymmetric key. The trigger runs after insert on `auth.sessions`. A new sign-in cancels a test deletion request. A token refresh does not. Keep the test account; do not wait for deletion.

   Rollback: stop if either requirement fails. Save the prior state before an approved setting change. Restore it only with the owner's word. Keep keys still in use.

4. **Owner word — register the new OAuth client.** Keep the Site URL and Authorization Path `/authorize`. Register a new public PKCE client with S256. Copy its exact callback from the ChatGPT connection form. Keep dynamic registration off. Preserve other hook behavior. Add only the new client's row to `kingdown_oauth.client_resources`, with resource `https://kingdown.dev/mcp`.

   Add `https://kingdown.dev/authorize` and the exact origin `https://kingdown.dev` to Auth Redirect URLs. Check the enabled provider's PKCE return preserves `authorization_id`. Keep DNS as it is.

   Check: the registered callback matches the connection form. A private hook check maps the new client to the new resource and keeps other claims. Step 10 checks the full consent and token flow after publication. Keep token values out of logs.

   Rollback: remove only the new client, its row and entries added for it. Preserve shared entries. Restore a changed hook with the owner's word.

5. **Owner word — configure production.** Keep the private environment file outside Git, with mode 600. Run `tools/deploy.sh --configure <private-env-file>`. It sets project `kingdown`'s production environment. Set `KINGDOWN_PLUGIN_ORIGIN` to `https://kingdown.dev`, the allowlist to the new client, and OAuth readiness only after the hook check. Use the restricted runtime database role with TLS certificate and host checks. Step 13 uses the same internal secret in Vault.

   The file contains only seven server names: `KINGDOWN_PLUGIN_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`, `KINGDOWN_PLUGIN_DATABASE_URL`, `KINGDOWN_PLUGIN_OAUTH_READY`, `KINGDOWN_INTERNAL_SECRET`.
   Keep `KINGDOWN_ENGINES_DATABASE_URL` out of the file; `--configure` rejects it. Before steps 6–7, set it to the private read-only engine connection in the local release shell and export that name. Use the hidden Bash prompt in OWNER-STEPS step 5. The deploy command inherits it; no value belongs in a command argument or log.
   Keep the two mail names unset. `PLUGIN_TEST_DATABASE_URL` stays local. `DEPLOY_LIVE_TIMEOUT_MS` sets the command's live-check wait.

   Check: the command names project `kingdown`. The origin, role and TLS mode match the release. No local-persona setting exists in production. No secret value appears in the log.

   Rollback: restore the saved environment through the same private path. A publish to apply it needs the owner's word.

6. **Test the one-project path before the outage.** Run `tools/deploy.sh` with no flag on the approved main commit. It tests and builds `npm run build:vercel`, with static site files and the plugin function in one tree. The function serves `/mcp`, `/authorize`, `/consent.mjs`, `/.well-known/oauth-protected-resource`, `/.well-known/oauth-protected-resource/mcp` and `/internal/*`. `/api/*` goes to the same function; the website API stays closed until the 0016 switch opens. The release shell holds no `KINGDOWN_STAGE` or `VITE_KINGDOWN_STAGE`, and holds the production `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` ([ticket 66](../../staging-first-game/issues/66-production-profile.md)). No redirect sends `/authorize` to the old origin.

   Check: the command publishes nothing. The engine guards, combined-tree checks, protocol checks and browser checks pass. `npm run check:vercel` proves local route dispatch. Set the live wait for step 7.

   Rollback: stop on failure or an old project target. Use only `tools/deploy.sh` for publication.

7. **Owner word — publish and hold the migration window.** Start the private test outage. Run `DEPLOY_LIVE_TIMEOUT_MS=900000 tools/deploy.sh --publish` detached. The script publishes the tested one-project tree to `kingdown`. While its live check waits, the owner or a second approved operator runs steps 8–9 in the SQL Editor. The function can return 503 until the schema and grants are complete.

   Check: the log names the approved main commit and project. After step 9, the site and plugin live checks both pass. A build alone does not prove a live pass.

   Rollback: stop play and remove MVP jobs if present. With the owner's word, revert the release changes on a branch to restore code from the saved compatible commit. Check that it supports the current schema and keeps every engine in use. Review and merge the revert PR to main, then run `DEPLOY_LIVE_TIMEOUT_MS=900000 tools/deploy.sh --publish` with the local release environment from step 5. The script fetches fresh `origin/main`; it takes no deployment ID or commit. After publication, both live checks must pass before play resumes. If 0006 changes board links, old code alone cannot restore them; a verified pre-window database restore needs a separate owner's word. Keep the tables and data.

8. **Owner word — finish the foundation.** Confirm `0001_accounts.sql`, `0002_matches.sql`, `0003_plugin_boards.sql`, `0004_plugin_board_recovery.sql` and the audience hook exist. Apply missing 0005–0009 migrations in order, then runtime-role blocks 3–6. Keep the existing role; do not rerun block 1's `create role`. The public deletion page must show the seven-day grace before 0008 is exposed. 0006 ends use of old plugin test games.

   Check: all foundation objects, the auth trigger, board foreign key and runtime grants exist. The guarded paste in step 9 checks these before any change. The server can still return 503.

   Rollback: a failed migration transaction changes nothing. Stop and review the failure. After commit, keep its data. Use the saved recovery plan with the owner's word.

9. **Owner word — paste [apply-0010-0013.sql](apply-0010-0013.sql) once.** Use a new SQL Editor query as the admin role. Paste the whole file. It first checks the 0005–0009 foundation and runtime-role blocks 3–6. It then applies 0010, block 7, 0011, 0012, block 8, 0013, block 9, block 10, 0014, block 11 and 0015 in one transaction. The source statements stay the same; only their outer transaction pairs become one pair.

   This adds game and hidden seat choices, setup deadlines, rematches, lobby indexes, ratings, history, badges, settings and home-board state. Block 9 also permits old-board deletion for daily cleanup. Block 10 permits only the deletion of reports older than 12 months that no hold covers. Both board switches default off. Result history and badges have no runtime UPDATE grant.

   Check: a missing prerequisite gives a clear exception and changes nothing. After success, run [plugin-db-check.mjs](../../../../tools/plugin-db-check.mjs) as the runtime role through the approved private connection. Its startup probes and required privilege result pass. The publish log ends with both live checks passed; 503 ends.

   Rollback: any error leaves this whole paste unapplied. If the SQL Editor keeps the failed transaction open, run `rollback;` before you correct the cause and retry. After commit, keep the new data and restore compatible code if needed. A database restore needs the owner's word. There is no down migration.

10. **Check the new service.** Check discovery, the unsigned MCP challenge and consent script. `/authorize` serves the function and preserves `authorization_id`. Confirm the actual release and engine archive.

    Check: fresh test accounts complete consent. The new audience works; old-resource tokens fail. After Refresh, a new chat uses the release UI resource hash.

    Rollback: keep testers out on failure. Use step 7's recovery path. Keep cron off until the service passes.

11. **Check the final screens.** Use the board, end, seat, lobby and profile words in [TESTER-GUIDE.md](TESTER-GUIDE.md). Friend and random creates include options. A repeated random request keeps one open game. Chat has no report tool; the app has no Report button.

    Check: the guide matches the release. The end card shows the result, rating and new badges where earned, plus Play again against the computer, or Rematch and Accept/Decline against a person. Play again keeps your colour against the computer. New game opens the draft with the same setup. See the board hides the card; Game result opens it again. Skip stops the win motion. Skip and See the board work at once. Game actions ignore taps for 1 s after a live result opens. A computer abort returns to Menu with the same setup.

    Rollback: stop test access. Correct the guide or build, then repeat the failed check.

12. **Check runtime access.** Confirm effective runtime grants, RLS and startup probes after the paste. Keep browser access restricted. Do not remove shared PUBLIC grants to repair one role.

    For the email removal release, deploy the code without the email jobs first. It starts on schemas
    0014 and 0015. Then apply `supabase/migrations/0015_remove_email.sql` as the admin role in
    step 9 at any later time. If 0010–0014 are in place,
    apply only 0015. The guarded paste also includes 0015 for a fresh release. Web account access follows at
    0016, then runtime-role block 12. Use [account-off.md](../../web-build/account-off.md) for that
    separate operator step.
    Confirm `to_regprocedure('kingdown_jobs.user_email(uuid)') is null`. Confirm that the runtime
    role can still execute `kingdown_jobs.delete_account(uuid)` and passes the startup probes.

    Check: the runtime role can read and write its required fields, including board deletion. It cannot read or delete `auth.users` directly or change result history and badges.

    Rollback: stop play. Restore approved role grants with the owner's word and rerun the probes.

13. **Owner word — install only the MVP jobs.** Enable pg_cron and pg_net. Put the internal secret in Vault as `kingdown_internal_secret` through the private path. Paste only [cron-mvp.sql](cron-mvp.sql). Its helper posts to `https://kingdown.dev/internal/tick` and `/internal/daily` with `x-kingdown-internal`, which the server checks. The secret matches `KINGDOWN_INTERNAL_SECRET`.

    Tick runs each minute. Daily runs at 03:17 UTC. Cron history cleanup runs at 03:47 UTC and keeps seven days. The file removes old outbox and reminder jobs by ID if present. Pending outbox rows keep `done_at` null; the daily cleanup deletes each row made or done more than 30 days ago, as the privacy page says. Record the pending count without payloads. No email or push runs.

    Check: `tools/cron-mvp.docs.test.ts` passes. In the SQL Editor, run:

    ```sql
    select jobname, schedule, active from cron.job
    where jobname like 'kingdown-%' order by jobname;
    ```

    Expect only `kingdown-cron-history`, `kingdown-daily` and `kingdown-tick`, active. Check run results and pg_net HTTP outcomes. A cron success alone does not prove HTTP success. Stop on an unexpected job.

    Rollback: run this guarded removal with the owner's word. Keep the helper, extensions, Vault entry and pending rows. Keep alert jobs absent.

    ```sql
    select cron.unschedule(jobid) from cron.job
    where jobname in ('kingdown-tick', 'kingdown-daily', 'kingdown-cron-history');
    ```

14. **Owner word — connect two test accounts.** Add each account's ChatGPT connection to `https://kingdown.dev/mcp` with the new public client. Sign in again. Use Refresh for tool changes, then a new chat for the UI. Give testers the guide and private report channel. Check web and iPhone menu paths.

    Check: A and B each open Menu on both devices. Their records stay separate. The guide names the controls shown.

    Rollback: remove the new test connections and pause the test. Keep account records. Use an approved compatible service for recovery.

15. **Owner word — complete [LIVE-CHECKS.md](LIVE-CHECKS.md) and admit testers.** Run every required row and feature mix. Check the three-second wait under Always ask on web and iPhone. Only side-panel and sidebar entries can be recorded as “not shown”. The owner decides whether repeated approval prompts block access.

    Check: the owner accepts the evidence and stated limits. Every required result cell is filled. Record the release commit and guide version. Repeat failed checks after each fix.

    Rollback: pause access. Remove jobs if the fault involves job work. Use the saved deploy and database recovery plan with the owner's word.

16. **Owner word — retire the old connection after one week.** Keep the old client and connection for the transition week only if safe. Old test games do not continue. Check other users before removing the old connection, its resource row, its OAuth client and the separate project.

    Check: the new connection remains the sole test path. Its client row, redirects and site project still work.

    Rollback: postpone removal if a dependency remains. Deleted clients or projects need a new setup and consent. Keep the current service.
