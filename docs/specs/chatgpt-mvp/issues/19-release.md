# 19 · Release to the private testers

Status: needs-info
Type: HITL (every deploy needs the owner's word)
Size: M
Blocked by: 18

## Scope

- The owner checks two Supabase settings: sessions signed with an asymmetric key; a trigger allowed on `auth.sessions`.
- The branch's release order (`supabase/README.md`), with every migration after 0009 (0010 to 0012 of tickets 06 to 08, and the settings migration of ticket 10) and its role block.
- The move to `https://kingdown.dev/mcp` (multiplayer branch ticket 03 steps: OAuth client, redirect URLs, Vercel env, the publish path).
- Live checks with two test accounts on ChatGPT web and the iPhone app: each play mode, each toggle mix once, the side-panel and sidebar entries (if they do not show for the private plugin, record it and release without them), the profile, the settings, the CSP for the art.
- A short tester guide.
- No email or push (spec Q3): from `supabase/ops/cron.sql`, schedule only `kingdown-tick`, `kingdown-daily` and `kingdown-cron-history`; never `kingdown-outbox` or `kingdown-reminders`. The README says to paste the whole file, so paste a shorter copy. If an older deploy made those two jobs, remove them with `cron.unschedule`. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset. The tick is necessary: it ends expired setups, friend codes and 24-hour open games. Outbox rows then stay with `done_at` null (`cleanup()` deletes only finished rows); record it.
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
