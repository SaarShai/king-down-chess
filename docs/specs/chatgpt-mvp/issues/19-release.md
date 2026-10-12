# 19 · Release to the private testers

Status: needs-info
Type: HITL (every deploy needs the owner's word)
Size: M
Release gate: the approved main commit and the live checks. Ticket 18 is merged.

## Scope

- The owner checks two Supabase settings: sessions signed with an asymmetric key; a trigger allowed on `auth.sessions`.
- The branch's release order (`supabase/README.md`), with every migration after 0009 (0010 to 0012 of tickets 06 to 08, and the settings migration of ticket 10) and its role block.
- The move to `https://kingdown.dev/mcp` (multiplayer branch ticket 03 steps: OAuth client, redirect URLs, Vercel env, the publish path).
- Live checks with two test accounts on ChatGPT web and the iPhone app: each play mode, each toggle mix once, the side-panel and sidebar entries (if they do not show for the private plugin, record it and release without them), the profile, the settings, the CSP for the art.
- A short tester guide.
- No email or push (spec Q3): from `supabase/ops/cron.sql`, schedule only `kingdown-tick`, `kingdown-daily` and `kingdown-cron-history`; never `kingdown-outbox` or `kingdown-reminders`. The README directs this MVP to its release copy. If an older deploy made those two jobs, remove them with `cron.unschedule`. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset. The tick is necessary: it ends expired setups, friend codes and 24-hour open games. Outbox rows then stay with `done_at` null (`cleanup()` deletes only finished rows); record it.
- Live check on the web and the iPhone: does the board's 3-second check show approval prompts under "Always ask"?

Preparation: The [runbook](../release/RUNBOOK.md), [MVP cron SQL](../release/cron-mvp.sql), [tester guide](../release/TESTER-GUIDE.md), and [live checks](../release/LIVE-CHECKS.md) prepare the release. No live action runs. The runbook records the plan, checks, and release gaps.

## Open items

- `public/delete-data.html` says deletion is "at once", but migration 0008 adds a 7-day grace. The text change ships with the release after the owner's yes.

## Deploy path plan

Owner word, 2026-10-12: "do ticket 19 and anything else you need to do to get it ready to go live. don't stop to ask me."

1. Test the deploy CLI with the existing fake commands. Make the default path check and publish the one-project tree. Keep the separate plugin path as legacy.
2. Test the private-file configuration path. Set the server keys for `kingdown`. Refuse mail keys and keep values out of logs.
3. Test the unsigned live check on a local server. Check the consent query and static art headers. Check the prebuilt routes against the former website configuration.
4. Run the full tests with `kingdown_mvp19d_test`, the combined build and its local check, and the shell syntax check. Commit and push this branch.

Pass criteria: each changed path first fails its test. All gates run before a fake publish. Only the combined tree can publish to `kingdown`. Both live checks use the release timeout. No live action runs. The docs agent owns the release packet and public pages.

## Deploy path result

The default path checks and publishes the combined Build Output API tree to `kingdown`. It includes the static site, MCP, OAuth and internal jobs. It exposes no website API. The old `/authorize` redirect is absent. The two live checks use `DEPLOY_LIVE_TIMEOUT_MS`, including 900000 ms. The plugin check covers both metadata paths, the unsigned challenge, the consent query and script, and one art file per format with its built bytes and headers. It checks CSP headers when the build has them.

`--configure` sets seven production server keys. `KINGDOWN_ENGINES_DATABASE_URL` stays on the local release command; the server does not read it. The validator refuses mail and local check keys. The legacy `--setup-plugin`, `--configure-plugin` and `--target plugin` paths remain for the transition week. They name the old project and origin.

The current website configuration has only the old consent redirect before this change. No other header or redirect needs a move. The pinned CLI reads local configuration with `--prebuilt`; the publish folder now holds only the project link and the output tree. The tree keeps the native OAuth paths and art headers in its own configuration. No server-build change is necessary.

Checks use `kingdown_mvp19d_test` on `127.0.0.1:55432`:

- Four red/green cycles cover the gates, combined publication, private configuration and live checks. Each first fails on the prior path.
- `npm test`: 157 files pass; 2,368 tests pass; eight skip. All 48 deploy cases pass with fake commands and local HTTP. All 50 artwork checks pass.
- `npm run build:vercel` and `npm run check:vercel`: pass. The local compiled check covers 101 art files, four archived engines, OAuth, MCP, API refusal and internal jobs.
- `npm run plugin:check:protocol`: 24 tools pass.
- `npm run check:browser`: all 24 default checks pass. `npm run check:browser plugin-ui plugin-ui-http`: both pass.
- `bash -n tools/deploy.sh`: pass. The real `engines-check` passes on the disposable database; it has zero engines in use. The deploy cases also check missing and uncommitted engines.

Logs: `/tmp/kingdown-mvp19d/`. The two browser run folders end in `mvp-19-deploy-wnkXu5` and `mvp-19-deploy-XBnvq3`.

Open items: the merger reviews and merges this branch and the docs branch. The real fresh-`origin/main` deploy check waits for that merge. The owner's live steps and ChatGPT widget CSP check remain in the release packet. No live action runs. The release packet and public pages stay with the docs agent.

- Live steps stay open. Use the owner checklist after the deploy change joins the approved main release.

## Final packet plan

Owner, 2026-10-12: "do ticket 19 and anything else you need to do to get it ready to go live. don't stop to ask me."

Preparation only, on `claude/mvp-19-docs`. The deploy agent owns the deploy code and hosting guide.

1. Add one failing SQL packet test. Add the guarded file, then test its success and failure on a private local database.
2. Match the deletion and privacy text to the database and account code.
3. Update the runbook, cron checks, screen words and owner checklist for the final build.
4. Run `npm test`, the database checks and the page check if needed. Commit and push this branch.

Pass criteria: the SQL packet keeps the source statements and applies in one transaction. It refuses a missing foundation or role grant before any change. Runtime startup probes pass after it runs. The packet uses the one-project deploy commands and the final screen words. No live action runs.


## Final packet result

Branch: `claude/mvp-19-docs`. Base: `9eea0846`. Preparation is complete. Live release stays open.

- The runbook and guides use the one-project deploy contract and the final screens. The owner checklist has 120 lines. It names each private setup, SQL paste, publish command, test-account step and recovery check.
- `apply-0010-0013.sql` checks the foundation and runtime grants, then applies migrations 0010–0013 and blocks 7–9 in one transaction. It includes the board-delete grant. The source-text test prevents drift.
- The deletion page now states the seven-day grace, new-sign-in cancel, token-refresh rule, daily deletion and retained records. The privacy page now covers handles, preset pictures, ratings, badges, reports, the OAuth link and the same grace. It keeps the provider-picture disclosure for the website account menu. Page styles stay the same.
- The database README names 0002–0004 and points to the MVP cron file. The cron check confirms the source helper, schedules, Vault name and server header. Neither cron SQL copy needs a change.

Checks:

- Red: the absent SQL file fails the source-text test. Green: `npm test` passes 2,240 tests; 124 skip; 50 artwork tests pass.
- Red: all three missing-prerequisite cases fail because the unguarded paste accepts them. The clean 0009 upgrade and runtime probes already pass.
- Final: `PLUGIN_TEST_DATABASE_URL` names `kingdown_mvp19docs_test` on `127.0.0.1:55432`. `npm test` passes 2,361 tests in 158 files; 8 skip; 50 artwork tests pass. New packet checks: 5 pass (4 database, 1 source text). Other database checks under `tools/plugin-db`: 5 pass. Cron checks: 2 pass.
- The SQL test uses its own `kingdown_mvp19docs_release19docs_test` copy. Missing invite table, sign-in trigger and cancellation grant each raise a clear exception. Schema, grants and test data stay the same after rollback. The clean upgrade passes every startup probe as the runtime role.
- Document links and `git diff --check` pass. `plugin-ui` does not read the two legal pages, so no browser check is needed for this text change. The deploy live check compares built page bytes; it pins no text and needs no change.

Open items: the merger integrates the deploy and document branches and reviews the final diff. The owner completes Auth, backup, OAuth, environment, publication, SQL, cron, test-account and web/iPhone live steps. All live result cells stay empty. No live action runs here.

## Release fix plan

Work stays on `claude/mvp-19-release`. No live action runs.

1. Add a failing PostgreSQL engine-check test. Exclude null fingerprints only for waiting and setup games. Keep the check for games in play and for saved fingerprints.
2. Keep only the seven server keys in the configuration file. Put the engine-check URL in the local release environment. Match both owner documents.
3. Check the sign-in code. State Google and GitHub for ChatGPT and the website's Facebook limit on both account pages.
4. Match recovery to the script: revert main through a PR to compatible code, then publish fresh main. Keep database recovery separate.

Pass criteria: the new engine-check test fails before the fix and passes after it. `npm test` passes with deploy tests and the release-packet database test on `kingdown_mvp19fix_test` at `127.0.0.1:55432`. `bash -n tools/deploy.sh` and `git diff --check` pass. Commit and push this branch for the merger.

## Release fix result

- The engine check excludes null fingerprints for waiting and setup games. The PostgreSQL test keeps saved fingerprints and a null fingerprint in play under the archive check.
- Both owner documents keep only seven server keys in the configuration file. A hidden Bash prompt sets and exports the local engine-check URL without a value in shell history or command arguments.
- Both public account pages name Google and GitHub. They state that Facebook is absent in ChatGPT and hidden on the website unless `?facebook=1` is set. The consent and account code confirm this limit.
- Recovery records the prior source commit, reverts the release through a PR to main, then publishes fresh main. The documents require schema compatibility and engines in use; database recovery stays separate.

Checks: red `npm test` fails only the new engine case. Green `npm test` passes 158 files and 2,375 tests; eight skip. All 50 artwork checks pass. The full run includes the deploy tests and all five release-packet cases. `PLUGIN_TEST_DATABASE_URL` names `kingdown_mvp19fix_test` on `127.0.0.1:55432`; the packet uses its own `kingdown_mvp19fix_release19docs_test` copy. `bash -n tools/deploy.sh`, prompt syntax, both seven-key lists, provider text and `git diff --check` pass. Logs: `/tmp/kingdown-mvp19fix/`.

Open items: the merger reviews and integrates this branch. The owner completes the live release steps and checks. No live action runs here.
