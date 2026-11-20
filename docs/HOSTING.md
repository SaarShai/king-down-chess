# Hosting

The facts for the live site, its domain and the secret files. Every deploy is public. Deploy only what the owner asked to put online, or a tweak preview, which never uses production data.

## Site

- The game is public at https://kingdown.vercel.app and https://kingdown.dev.
- Vercel project `kingdown`, team "Saar's projects" (`saars-projects-2c777ec5`), Pro plan. The Vercel CLI on this Mac is signed in.
- The site, the website API and internal jobs use project `kingdown` at `https://kingdown.dev` (release, 2026-10-19). The same project serves the ChatGPT plugin (MCP and OAuth) at `https://kingdown.dev/mcp`: see [The ChatGPT plugin](#the-chatgpt-plugin). The separate `kingdown-plugin` project is the old target. Keep it until the retirement step in the release runbook. [The setup guide](plugin-preparation.md) links to the release ticket and its public IDs. Its public MCP endpoint requires OAuth. The private ChatGPT connection does not make the HTTPS endpoint private.

## Deploy

- `tools/deploy.sh` is the only production deploy path. Do not run the Vercel CLI yourself. The preview and staging commands of `tools/release/staging.py` use the pinned CLI to set the alias.
- The release builds from GitHub main: the remote `origin` is `github.com/SaarShai/king-down-chess`. The script stops with a clear message when `origin` is absent.
- Production profile (staging-first-game ticket 66): `tools/deploy.sh` serves production only, and `node tools/deploy-staging.mjs` serves staging only. Every mode refuses a shell with `KINGDOWN_STAGE` or `VITE_KINGDOWN_STAGE`. A website run needs `VITE_SUPABASE_URL` set to the production account origin (`https://utqzovjmclfyojedmwok.supabase.co`) and the production `VITE_SUPABASE_PUBLISHABLE_KEY` (a public `sb_publishable_` value); only the site build gets them. The script refuses a build with the staging manifest `staging.json`. The production server (`KINGDOWN_STAGE` unset) refuses the staging Supabase project, database and origin; a staging server refuses the production ones.
- `tools/deploy.sh` with no flag checks a fresh `origin/main` in a temporary worktree and publishes nothing. Set `PLUGIN_TEST_DATABASE_URL` to a disposable loopback database whose name ends in `_test`. The path prepares the database, runs `npm test` and the default browser checks, then builds the combined tree with `npm run build:vercel`. When CI passed on that exact commit (`node tools/ci-green.mjs <sha>`: every check suite complete and green, and the combined commit status not failed, as merge-on-green requires), the script skips `npm test`, the web journey, the plugin protocol and plugin UI checks and the default browser checks that CI ran, because CI ran them on the same tree (the `browser-default` job runs every default browser check but the ones that assert frame times; those need a GPU, so CI runs `check:browser -- --no-gpu` and the script always runs them, with `node tools/check.mjs --gpu`; for a commit whose workflow has no such step, all default browser checks run here); the build, artifact, engine and live gates always run. No GitHub answer, a running or a failed CI means the full local run. When `wt` links the shared `node_modules`, the script replaces the link with its own `npm ci` installation, so no link path enters the bundle. It checks the engine archive and the compiled tree (`check:vercel`), then runs the web journey (`check:browser web-online`), the MCP protocol check (`plugin:check:protocol`) and `check:browser plugin-ui plugin-ui-http`. The step `production artifact` prints the sha256 of `static/index.html`, `static/sw.js` and each engine archive, and stops when an archive differs from the committed `engines/` file of the same name.
- `tools/deploy.sh --publish` checks the same tree, then publishes `kingdown-deploy/.vercel/output` to project `kingdown` with the pinned CLI and `--prebuilt --prod`. This one project serves the static site, the website routes (`/play`, `/g/…`, `/j`), the website API (`/api/*`) and internal jobs. The website API stays closed until the owner opens the 0016 `web_account_access` switch. The script checks the team and project before publication. Then the step `keep live assets` (`tools/deploy-keep-assets.mjs`) reads the live `/` and `/sw.js` without a cookie and follows each content-named file under `/assets/` that they name. It adds each file that the new build does not have to the publish copy, so a page of the old build can load its own chunks after the switch. The tested tree, `index.html`, `sw.js` and every file of the new build stay as built. The step stops before publication when a live file (also `/` and `/sw.js`) does not answer 200 with its content type, when the live build names a file of a type that the checks do not know, or when a live file has other bytes than the build file of the same name. It keeps one build back: a file that the live build kept from its own previous build goes. The step writes `assets/kept-files.json`, the list of the kept files. A rerun of the live build (its page is the new page, for example after a failed live check) keeps the files of that live list again. It then checks the live bundle, every public file, every file under `assets/` (kept files too) and the legal pages byte for byte, the app routes against the built `index.html`, and `/api/status` (`account_access` closed or open; unsigned account calls answer 503 while closed and 401 while open), plus the unsigned plugin endpoints at `https://kingdown.dev`. For a build without the plugin (no `consent.mjs` in the function), the plugin live check sends GET and POST to each parked path and expects 404. For a build with the plugin, it preserves `authorization_id`, compares both metadata paths and the consent script, and checks one art file per format against the built bytes and headers.
- `tools/deploy.sh --configure <private-env-file>` sets the seven production server keys in `plugin-deploy/.env.example` for `kingdown`. Use the site origin, the new OAuth client UUID and an internal secret of at least 32 characters. The file must belong to this user and have mode 600. The script refuses mail keys and local check inputs. It sends values through standard input and withholds CLI write output. Set readiness to `1` only after the provider and audience checks pass. This command does not deploy.
- Legacy, until the old project retires: `tools/deploy.sh --setup-plugin` links the empty plugin project and checks its team and name. It prints the public project IDs and project details. It uploads no build and publishes nothing.
- Legacy: `tools/deploy.sh --configure-plugin <private-env-file>` sets the seven approved plugin production values. The file must belong to this user and have mode 600. Use the six original keys and `KINGDOWN_INTERNAL_SECRET` (at least 32 characters) once, with the old plugin origin and client, as unquoted `KEY=value` lines. The database URL must use the runtime role and `?sslmode=require`, with no other query option. Values pass through standard input; CLI output for each write is withheld. This command does not deploy. Set readiness to `1` only after the provider and audience checks pass.
- Legacy: `tools/deploy.sh --target plugin` requires `PLUGIN_TEST_DATABASE_URL`, a disposable loopback database whose name ends in `_test`. It prepares that schema, runs `npm test`, builds the Vercel artifact with the plugin surface in (`npm run plugin:build:vercel` passes `--chatgpt`), checks its compiled HTTP server, worker and MCP protocol, and runs `plugin-oauth`, `plugin-ui` and `plugin-ui-http` through the browser runner. It publishes nothing.
- Legacy: add `--publish` to the plugin command to release that tested artifact with `vercel@62.2.0 --prebuilt --prod`. The script checks the exact project ID and team ID before this step. It uses the project's production environment; no secret is passed as a CLI argument. It then checks discovery, the unsigned MCP challenge and the built consent script without a player session.
- A build that adds an engine must stop until its bundle and fixture are on `origin/main`. Set `KINGDOWN_ENGINES_DATABASE_URL` on the release command to check the engines of unfinished games. A `--publish` command stops before it makes a worktree when this read-only input is absent or does not name the production database (the project's direct `db.` host, or a Supabase pooler with a user that ends in the production project ref); a staging, loopback or other target is refused. Publish runs `engines-check.mjs --production`. A check-only run may skip, or use a local test database. It is not a production server key.
- Database backup and restore (release-safety ticket 01): In `plugin-deploy/`, `release-backup.sql` copies every public table in one repeatable-read snapshot, and `release-restore-games.sql` puts back the backup games, players, commands and invites in place, keeps newer games, leaves out the solo games of accounts deleted since the backup (as `delete_account` erased them) and their games that the deletion job ended (the live end stays), and refuses a backup whose games and commands disagree. Both run only by the owner's word; the ticket holds the order and the treatment of newer rows.
- Both live checks use `DEPLOY_LIVE_TIMEOUT_MS`. The default is 180000 ms for the site check and 120000 ms for the plugin check; each tries again every 5 s until the limit. Set 900000 ms for the migration window. Run the release command detached.
- The script takes no branch or commit. A commit that is not on `origin/main` cannot go live.
- Keep the release record: use `runs/launch/release-log.md` beside the main checkout. The folder `../evidence/production-release/`, relative to the main checkout, holds the direct live helper logs and the old record `LOG.md`. The deploy output log holds the source commit, the byte record, each step and both live-check results. The release driver keeps its live logs in the `live/` folder of each run.
- The tool gate asks before a `vercel` command, a Porkbun API call or a browser visit to the live site or the Vercel dashboard.

The email removal release deploys code without email jobs before migration 0015. The guarded
release SQL includes 0015; an existing 0014 schema needs only the missing migration. It removes
the email helper and keeps the `delete_account(uuid)` grant. Web account access follows at
0016, then runtime-role block 12. Use [account-off.md](specs/web-build/account-off.md) for that
separate operator step. No production change is authorized by the staging integration.

## Release and preview

Start `tools/release/release.sh <PR> <full PR head> [reconcile note]` in tmux.
Start one release at a time. Keep `origin/main` on the release commit through publication.
Set `KINGDOWN_REVIEW=lead-read` for the lead's review. The merge helper receives this setting.

```text
ci → staging → staging-checks → merge → main-ci → engines → publish → live-check → log
```

- The CI gate checks the exact PR head. The staging helper deploys that commit
  to [staging](https://kingdown-staging.vercel.app). Two signed-out checks run there.
- The main gate checks the PR's merge commit. It can rerun failed jobs once for that
  commit. A failed gate stops the release before publication. The release command sends no Git push.
- The engines check reads the games in use. The publish step uses `live.sh publish`.
  The release helper sets the solo-launch build profile for staging and production.
  Keep the local test database on port 55432 ready for these checks.
- Read the end of the printed `progress.log` path. Its `.done` file holds the exit
  code. Each stage has a log in the same folder. Use `--from <stage>` with the same PR
  and head to continue after a fault. The command records each skip and requires a
  pass for each earlier stage. Use `--force` to start without those passes.
  Start with `--from main-ci` if the merge commit has no recorded green result.
  Confirm the deployment before you restart after a publish fault.
  Use `--tweak` to skip both staging stages.
- After a killed run, confirm that the run and its child processes have stopped.
  Use `rmdir` to remove the empty `release-active` folder from
  `KINGDOWN_RELEASE_EVIDENCE`. The default folder is `../evidence/release-active`
  relative to the main checkout.
- `--dry-run` prints the outward commands. It keeps its progress in a separate folder.
  A real release appends its result to the release record. Set `KINGDOWN_RELEASE_LOG`
  to use a different path. A pass records the merge commit, published commit,
  deployments and check results. A failure records the time, PR, commit and failed stage.
- `release-staging` and `release-live` each use their own packages.
  `python3 tools/release/staging.py [ref]` waits for CI. With `--ci-passed` it
  checks CI once on the exact commit and stops unless CI is green.
  The build names `next.html` for the solo-launch home. The alias check compares
  `/` with that file, `/play/` with `index.html`, and the worker with `sw.js`.
- For direct use, `tools/release/merge.sh <pr> <head> <reviewed head> [note]`
  records an independent review and merges on green.
  `tools/release/live.sh check|engines|publish` uses a fresh `origin/main`.
  `check` builds and checks the site. `engines` reads the engines in use.
  `publish` waits for CI and deploys through `tools/deploy.sh`.
  If CI does not pass in time, `tools/deploy.sh` runs the local checks.
  The default private env path is `<main checkout>/../.secrets/kingdown-mvp.env`.

For a tweak preview, run `python3 tools/release/staging.py --preview <ref>`
from the release tools checkout. Use `--dry-run` to see the commands.
Pass the scripted journey check and the builder's browser pass before you run
`--preview`. The command runs neither check. See Preview in `docs/CHANGES.md` on main.
The preview uses the linked staging worktree and its staging project.
It checks types, builds with `KINGDOWN_TEST_PAGES=1`, and runs `release-site`
on the local build. The staging guard publishes to the preview target.
The command changes only the [preview alias](https://kingdown-preview.vercel.app), checks it signed out,
and prints that address last. A Vercel sign-in redirect stops the command.

The preview shows the signed-out site, Guide, setup and local solo play.
The staging server accepts the staging host. The browser sends website
API requests to its own host. On the preview host the API gives HTTP 403
for an untrusted host. A player with a staging session still cannot load
account data or open, create or move in an online game on the preview.
The sign-in choices use public staging provider settings. They can open
on the preview. The check stops at the choices. It permits HTTP 403 from
`/api/status` on the preview alias.

Run `npm run check:browser release-site release-history` for a local check.
Set `PLAYABLE_URL` to check a public origin. Both checks use fresh headless
browser contexts and read-only requests. The checks use the solo-launch
profile when they build the local site.

## Domain and DNS

- The domain `kingdown.dev` is at Porkbun. Two A records, for `@` and `www`, point to `76.76.21.21`.
- On 2026-10-03 these two A records replaced the parking ALIAS and the `*` CNAME. https://kingdown.dev answered the same day.
- DNS changes go through Porkbun's API (`https://api.porkbun.com/api/json/v3/`, `dns/retrieve|create|delete/kingdown.dev`).
- A DNS change needs the owner's go.

## Secret files

- The folder `.secrets/` in the main checkout holds three files: `kaggle_api_token` (the Kaggle token), `oauth.json` (the OAuth keys) and `porkbun_api.json` (the Porkbun API keys).
- Git ignores the folder. Each file has mode 600. Never print, paste or commit a value.
- `tools/save-secret.sh NAME` stores the clipboard text as a new file in that folder and does not print the value.

## The ChatGPT plugin

The owner parked the ChatGPT plugin on 2026-10-28 and brought it back on 2026-11-10, so that OpenAI can connect to `https://kingdown.dev/mcp` and scan it.

- One switch: `CHATGPT_PLUGIN` in `tools/chatgpt-plugin.mjs`. It is on for a production build and off for a staging build, which serves only the Muse connector. Production and staging builds include the Muse code. The server serves Muse only when the client list has an ID with a row for its `/muse/mcp` resource. A ChatGPT-only list keeps Muse parked at 404. `/api/status?muse=1` reports the Muse state for "Disconnect Muse". The default `/api/status` keeps the exact two-field JSON for shipped apps. Add or remove the Muse ID and redeploy to change this state ([MUSE.md](MUSE.md#the-switch)). The server (`tools/plugin-server.mjs`) and the build (`tools/plugin-server-build.mjs`) read it.
- With the switch on, the build serves `/mcp`, `/authorize`, `/consent.mjs`, `/plugin-art/*`, the two OAuth metadata paths under `/.well-known/` and the OpenAI domain challenge. With it off, each of these paths answers 404 (the list is `PARKED_PATHS`), except `/authorize` and `/consent.mjs` in a build that serves the Muse connector.
- The ChatGPT connector needs its OAuth setup before it starts. A connector start fault turns off the connector paths and OAuth. The website API (`/api/*`) and `/internal/*` stay available when their own settings and database checks pass. A shared OAuth fault turns off both connectors when both are served. It needs the two `KINGDOWN_PLUGIN_OAUTH_*` settings (the ready flag set to `1` and the approved Supabase OAuth client UUIDs), a working Supabase OAuth discovery, and a row in `kingdown_oauth.client_resources` for each client ID with the resource of a served connector (`/mcp`, or `/muse/mcp` when the build serves Muse too). `tools/deploy-plugin-env.mjs` lists all the settings.
- CI checks the plugin: `plugin:build` and `plugin:server:check` run the MCP flows over compiled HTTP and real PostgreSQL, `plugin:check:protocol` runs the MCP server in memory, `browser-ui` runs `plugin-oauth`, `plugin-ui` and `plugin-ui-http` on Chromium, and `browser-webkit-ui` runs `plugin-ui` on WebKit. `npm run plugin:build:chatgpt` builds a `chatgpt: true` tree into `plugin-server-chatgpt/` from any shell, also a staging shell; never deploy that tree.
- A recovery rehearsal (`plugin:server:check` with a second, recovery directory) runs over MCP, so it stops with an error on a build without the plugin. Build both trees with `chatgpt: true` to run it.
- The consent page shows the review password form in each build that serves a connector (`REVIEW_PASSWORD_SIGNIN` in `src/plugin/consent.ts` follows `KINGDOWN_CHATGPT` and `KINGDOWN_MUSE`). The form is not the guard: each address in `kingdown_auth.password_accounts` can get a password session, through the form or through the Auth API.
- Owner items outside the repository: the live Supabase before-user-created hook (`review-signup-hook.sql` in `plugin-deploy/`) and the table `password_accounts` in the schema `kingdown_auth`. Keep the hook on while Email is on (`supabase/README.md`). Change the table only by the owner's word.


## Solo launch preparation

The build option `KINGDOWN_SOLO_LAUNCH=1` selects the new page at `/`.
It is off by default. The emitted `solo-launch.json` selects the combined host routes.
`/play`, `/g/...` and `/j` keep the old page. Unknown paths return the new page with HTTP 404.
The launch worker lists both public pages and their local graphs. Private online paths stay out of its cache.
The runtime `index.json` and `parts/*.json` use `Cache-Control: no-cache`.
Content-named WebP frames keep their immutable one-year cache.

With the launch option on, web solo games run on the device. The old web Computer controls
open a local game. An account solo game keeps its full move history in the handoff.
The website API refuses solo creation, solo rematches and computer commands from the web.
Released iOS apps keep these API operations. The off build keeps the old web flow.
The API counts draft previews on the existing computer-work quota (120 per minute per account).
The connector services keep their solo games. The API adapter's named `localSolo` option is off by
itself; the combined host sets it from the site launch marker.

Each configured host instance writes `King Down release` with the source commit and connector state.
`npm run errors:daily` reads the existing fault report for one day. It sends no message.
The owner must schedule the command, assign a reader and set up external checks of `/` and `/api/status`.
The design project's `runs/launch/platform/cutover.md` gives the setup, cutover and rollback steps.
No build switch authorizes a deploy.
