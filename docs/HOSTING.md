# Hosting

The facts for the live site, its domain and the secret files. Every deploy publishes to the world: deploy only what the owner asked to put online.

## Site

- The game is public at https://kingdown.vercel.app and https://kingdown.dev.
- Vercel project `kingdown`, team "Saar's projects" (`saars-projects-2c777ec5`), Pro plan. The Vercel CLI on this Mac is signed in.
- The plugin uses the separate `kingdown-plugin` project in the same team. Its assigned origin is `https://kingdown-plugin.vercel.app`. [The setup guide](plugin-preparation.md) links to the release ticket and its public IDs. Its public MCP endpoint requires OAuth. The private ChatGPT connection does not make the HTTPS endpoint private.

## Deploy

- `tools/deploy.sh` is the only deploy path. Do not run the Vercel CLI yourself.
- `tools/deploy.sh` with no flag checks a fresh `origin/main` in a temporary worktree and publishes nothing. Set `PLUGIN_TEST_DATABASE_URL` to a disposable loopback database whose name ends in `_test`. The path prepares the database, runs `npm test` and the default browser checks, then builds the combined tree with `npm run build:vercel`. It checks the engine archive, compiled tree, MCP protocol and both plugin UI checks.
- `tools/deploy.sh --publish` checks the same tree, then publishes `kingdown-deploy/.vercel/output` to project `kingdown` with the pinned CLI and `--prebuilt --prod`. This one project serves the static site, MCP, OAuth and internal jobs. It serves no website API. The script checks the team and project before publication. It then checks the live bundle and legal pages, plus the unsigned plugin endpoints at `https://kingdown.dev`. `/authorize` is a function route; the old redirect is absent. The plugin check preserves `authorization_id`, compares both metadata paths and the consent script, and checks one art file per format against the built bytes and headers. It checks CSP headers when the build has them.
- `tools/deploy.sh --configure <private-env-file>` sets the seven production server keys in `plugin-deploy/.env.example` for `kingdown`. Use the site origin, the new OAuth client UUID and an internal secret of at least 32 characters. The file must belong to this user and have mode 600. The script refuses mail keys and local check inputs. It sends values through standard input and withholds CLI write output. Set readiness to `1` only after the provider and audience checks pass. This command does not deploy.
- Legacy, until the old project retires: `tools/deploy.sh --setup-plugin` links the empty plugin project and checks its team and name. It prints the public project IDs and project details. It uploads no build and publishes nothing.
- Legacy: `tools/deploy.sh --configure-plugin <private-env-file>` sets the seven approved plugin production values. The file must belong to this user and have mode 600. Use the six original keys and `KINGDOWN_INTERNAL_SECRET` (at least 32 characters) once, with the old plugin origin and client, as unquoted `KEY=value` lines. The database URL must use the runtime role and `?sslmode=require`, with no other query option. Values pass through standard input; CLI output for each write is withheld. This command does not deploy. Set readiness to `1` only after the provider and audience checks pass.
- Legacy: `tools/deploy.sh --target plugin` requires `PLUGIN_TEST_DATABASE_URL`, a disposable loopback database whose name ends in `_test`. It prepares that schema, runs `npm test`, builds the Vercel artifact, checks its compiled HTTP server, worker and MCP protocol, and runs `plugin-oauth`, `plugin-ui` and `plugin-ui-http` through the browser runner. It publishes nothing.
- Legacy: add `--publish` to the plugin command to release that tested artifact with `vercel@62.2.0 --prebuilt --prod`. The script checks the exact project ID and team ID before this step. It uses the project's production environment; no secret is passed as a CLI argument. It then checks discovery, the unsigned MCP challenge and the built consent script without a player session.
- A build that adds an engine must stop until its bundle and fixture are on `origin/main`. Set `KINGDOWN_ENGINES_DATABASE_URL` on the release command to check the engines of unfinished games. The script reports a skip when this read-only input is absent. It is not a production server key.
- Both live checks use `DEPLOY_LIVE_TIMEOUT_MS`. The default is 120000 ms. Set 900000 ms for the migration window. Run the release command detached.
- The script takes no branch or commit. A commit that is not on `origin/main` cannot go live.
- The tool gate asks before a `vercel` command, a Porkbun API call or a browser visit to the live site or the Vercel dashboard.

The email removal release deploys code without email jobs before migration 0015. The guarded
release SQL includes 0015; an existing 0014 schema needs only the missing migration. It removes
the email helper and keeps the `delete_account(uuid)` grant. Web account access follows at
0016, then runtime-role block 12. Use [account-off.md](specs/web-build/account-off.md) for that
separate operator step. No production change is authorized by the staging integration.

## Domain and DNS

- The domain `kingdown.dev` is at Porkbun. Two A records, for `@` and `www`, point to `76.76.21.21`.
- On 2026-10-03 these two A records replaced the parking ALIAS and the `*` CNAME. https://kingdown.dev answered the same day.
- DNS changes go through Porkbun's API (`https://api.porkbun.com/api/json/v3/`, `dns/retrieve|create|delete/kingdown.dev`).
- A DNS change needs the owner's go.

## Secret files

- The folder `.secrets/` in the main checkout holds three files: `kaggle_api_token` (the Kaggle token), `oauth.json` (the OAuth keys) and `porkbun_api.json` (the Porkbun API keys).
- Git ignores the folder. Each file has mode 600. Never print, paste or commit a value.
- `tools/save-secret.sh NAME` stores the clipboard text as a new file in that folder and does not print the value.
