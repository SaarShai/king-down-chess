# Owner release steps

Use the approved main release commit. This list prepares the private test at `https://kingdown.dev/mcp`.
Each live change needs your word in its session. Give it for the named step before an agent runs it.
**Owner** means you use your own account. **Agent with go** means an agent can run the named gated command after your approval. An agent keeps secret values out of messages and logs.
Use [RUNBOOK.md](RUNBOOK.md) for the full checks and rollback.

1. **Owner — check Supabase Auth.** In the project, open **Authentication → Signing Keys**.
   Confirm an active asymmetric key, ES256 or RS256, and public JWKS. Keep private keys private.
   In **SQL Editor → New query**, check the 0008 trigger:
   ```sql
   select pg_get_triggerdef(oid) from pg_trigger
   where tgrelid='auth.sessions'::regclass and tgname='on_auth_session_created';
   ```
   Expect AFTER INSERT and `cancel_deletion_on_sign_in`. If 0008 is not yet installed,
   confirm the admin role can install its trigger on `auth.sessions` before step 6.
   Check a fresh test sign-in uses the asymmetric key. If either check fails, stop; keep current keys.

2. **Owner — save the backup.** Open **Database → Backups**, or use your approved private backup path.
   Save a recovery point and verify the restore procedure. Save the current deployment ID and source commit,
   migration list, role grants, OAuth client rows, redirect URLs and environment names privately.
   Success: a verified recovery point and a compatible prior deployment are ready.
   If you cannot verify them, stop. Do not start the outage.

3. **Owner — stop old alerts.** In **SQL Editor → New query**, paste this guarded query if pg_cron exists:
   ```sql
   select cron.unschedule(jobid) from cron.job
   where jobname in ('kingdown-outbox', 'kingdown-reminders');
   ```
   Success: neither named job remains. Wait for any alert request already sent to finish.
   If pg_cron is absent, skip this step. On an error, stop. Keep both mail environment names unset.

4. **Owner — make the OAuth client.** In ChatGPT's new custom connection form, set the MCP URL
   to `https://kingdown.dev/mcp`. Copy the callback shown there exactly.
   In Supabase **Authentication → OAuth Server**, make a new public PKCE client with S256.
   Paste that callback as its redirect URL. Keep dynamic registration off and Authorization Path `/authorize`.
   In **Authentication → URL Configuration**, add `https://kingdown.dev/authorize` and
   `https://kingdown.dev`. Keep the Site URL and other used entries.
   In **Authentication → Hooks**, confirm the Custom Access Token hook still uses
   `public.kingdown_access_token_hook`. Use [plugin-deploy/oauth-audience-hook.sql](../../../../plugin-deploy/oauth-audience-hook.sql)
   as the source; preserve any other hook behavior. In the SQL Editor, add only the new client row:
   ```sql
   insert into kingdown_oauth.client_resources(client_id,resource)
   values ('<new client UUID>', 'https://kingdown.dev/mcp');
   ```
   Success: the exact callback is registered; the hook check preserves claims and maps the new resource.
   Check the hook privately now; complete consent in step 9 after publish. On failure, remove only the new entries and stop.

5. **Owner, then agent with go — configure.** On your Mac, make `.secrets/kingdown-mvp.env`
   outside the tracked files. Set its mode with `chmod 600 .secrets/kingdown-mvp.env`.
   Use NAME=value lines for these names, with values from your private project settings:
   ```text
   KINGDOWN_PLUGIN_ORIGIN
   SUPABASE_URL
   SUPABASE_PUBLISHABLE_KEY
   KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS
   KINGDOWN_PLUGIN_DATABASE_URL
   KINGDOWN_PLUGIN_OAUTH_READY
   KINGDOWN_INTERNAL_SECRET
   ```
   Use origin `https://kingdown.dev`, the new client ID and readiness 1 only after the hook check.
   Use the runtime role for the service URL, with `?sslmode=require`.
   Use an internal secret of at least 32 characters. The same secret protects short invite codes.
   Keep it the same on every instance and across restarts. A secret change ends current short codes. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset.
   Keep `PLUGIN_TEST_DATABASE_URL` local; it is not a production setting.
   Keep `KINGDOWN_ENGINES_DATABASE_URL` out of this file; `--configure` rejects it.
   Before either deploy check or publication, set it in the local release shell to the private
   read-only engine connection. Use this hidden prompt, then export the named variable:
   ```sh
   read -r -s -p 'Engine-check URL: ' KINGDOWN_ENGINES_DATABASE_URL
   printf '\n'
   export KINGDOWN_ENGINES_DATABASE_URL
   ```
   Use Bash for this prompt. Keep the value out of shell history, messages and logs.
   Give the command go: `tools/deploy.sh --configure .secrets/kingdown-mvp.env`.
   Success: it names project `kingdown` and sets production names without printing values.
   If it fails, stop; restore saved settings through this private path with your go.

6. **Owner — plan the SQL window.** Keep a second SQL Editor tab ready before publish.
   Confirm 0001–0004 and runtime-role blocks 1–2 already exist. For any missing foundation, paste
   each whole file in order: `supabase/migrations/0005_accounts_v2.sql`,
   `supabase/migrations/0006_games.sql`, `supabase/migrations/0007_jobs.sql`,
   `supabase/migrations/0008_accounts_safety.sql`, `supabase/migrations/0009_invite_tries.sql`.
   Apply blocks 3–6 of `plugin-deploy/runtime-role.sql` to the existing role.
   Keep block 1's `create role` out of an existing installation. Run these pastes during step 7's outage.
   Success: each transaction commits, including the auth.sessions trigger. If a paste fails, stop;
   keep the saved recovery point and correct the cause. Keep cron off.

7. **Agent with go — test, then publish.** An agent can run `tools/deploy.sh` with no flag
   before live work. It tests the one-project tree and publishes nothing.
   Set the local disposable test database for its database checks. Read the test log and exit code.
   After those checks pass, start the outage. Give the publish command go:
   `DEPLOY_LIVE_TIMEOUT_MS=900000 tools/deploy.sh --publish`.
   Run it detached; keep the log private. It publishes to `kingdown` and waits for schema readiness.
   While it waits, finish step 6 and, in a new SQL Editor query, paste the whole exact file
   [apply-0010-0013.sql](apply-0010-0013.sql). Press **Run** as the admin role.
   Success: the paste commits, migration 0014 and role block 11 are present, runtime startup probes pass and both live checks pass in the log.
   A missing prerequisite raises an exception and changes nothing. Run `rollback;` if the Editor keeps the failed transaction open.
   Fix that prerequisite and retry the whole file.
   On another failure, stop play and remove MVP jobs if present. With your go, revert the release
   changes on a branch to the saved compatible commit. Review and merge that PR to main, then run
   the publish command again. It fetches fresh `origin/main`; it takes no deployment ID or commit.
   Check that the recovery code supports the current schema and keeps engines in use.
   Use RUNBOOK step 7 for database recovery. Keep data and tables.

8. **Owner — enable the three jobs.** In **Database → Extensions**, enable pg_cron and pg_net.
   In **Vault**, save the same internal secret as `kingdown_internal_secret` through the private form.
   Keep its value out of SQL query history and logs. In **SQL Editor → New query**, paste the whole
   [cron-mvp.sql](cron-mvp.sql), then press **Run**. Use this MVP file.
   Success: `cron.job` shows only `kingdown-tick`, `kingdown-daily` and `kingdown-cron-history`, active.
   Check `cron.job_run_details` and pg_net HTTP outcomes for tick and daily.
   If a call fails, stop test access. With your go, remove only these three jobs by ID as RUNBOOK step 13 shows.
   Keep Vault and pending outbox rows. Keep alert jobs absent.

9. **Owner — connect two test accounts.** Give accounts A and B private app access.
   In each ChatGPT account, finish the new connection form with the new public client ID;
   it needs no client secret. Sign in with separate King Down test accounts and approve consent.
   Select King Down in a new chat, say “play King Down”, then select **Play**.
   Use each same account on its iPhone app. Use Refresh for changed tools, then a new chat for the new page.
   Success: both accounts open Play, keep separate records and resume their own games across devices.
   If a connection fails, remove that new test connection and stop. Keep account records.

10. **Owner — run the live table.** Open [LIVE-CHECKS.md](LIVE-CHECKS.md) and
    [TESTER-GUIDE.md](TESTER-GUIDE.md). Check actual ChatGPT menu paths before you give the guide to testers.
    Complete every required row on web and iPhone. Record the release commit, device versions and evidence.
    Only the side-panel and sidebar entries can say “not shown”. Decide whether repeated Always ask prompts block access.
    Success: all required rows pass and you accept the stated limits. Then admit the private testers.
    On failure, pause access and use the runbook's recovery steps. An agent can help with local checks;
    you complete your account, iPhone and consent steps.

11. **Owner — close the transition after one week.** Check old-client users and other dependencies.
    Remove the old connection, its resource row, OAuth client and separate project only with your go.
    Success: the new connection remains the sole test path. If a dependency remains, postpone removal.
