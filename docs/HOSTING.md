# Hosting

The facts for the live site, its domain and the secret files. Every deploy publishes to the world: deploy only what the owner asked to put online.

## Site

- The game is public at https://kingdown.vercel.app and https://kingdown.dev.
- Vercel project `kingdown`, team "Saar's projects" (`saars-projects-2c777ec5`), Pro plan. The Vercel CLI on this Mac is signed in.
- The plugin uses the separate `kingdown-plugin` project in the same team. Its assigned origin is `https://kingdown-plugin.vercel.app`. [The setup guide](plugin-preparation.md) links to the release ticket and its public IDs. Its public MCP endpoint requires OAuth. The private ChatGPT connection does not make the HTTPS endpoint private.

## Deploy

- `tools/deploy.sh` is the only deploy path. Do not run the Vercel CLI yourself.
- `tools/deploy.sh` with no flag tests a fresh `origin/main` in a temporary worktree (`npm test`, then `npm run check:browser`) and publishes nothing.
- `tools/deploy.sh --publish` does the same tests, then publishes the tested build with the pinned Vercel CLI and checks the live site: the bundle name, the privacy, terms and delete-data pages, and the consent redirect with its query. [vercel.json](../vercel.json) sends `/authorize` to the plugin service.
- `tools/deploy.sh --setup-plugin` links the empty plugin project and checks its team and name. It prints the public project IDs and project details. It uploads no build and publishes nothing.
- `tools/deploy.sh --configure-plugin <private-env-file>` sets the six approved plugin production values. The file must belong to this user and have mode 600. Use each key from `plugin-deploy/.env.example` once, as an unquoted `KEY=value` line. The database URL must use the runtime role and `?sslmode=require`, with no other query option. Values pass through standard input; CLI output for each write is withheld. This command does not deploy. Set readiness to `1` only after the provider and audience checks pass.
- `tools/deploy.sh --target plugin` requires `PLUGIN_TEST_DATABASE_URL`, a disposable loopback database whose name ends in `_test`. It prepares that schema, runs `npm test`, builds the Vercel artifact, checks its compiled HTTP server, worker and MCP protocol, and runs `plugin-oauth`, `plugin-ui` and `plugin-ui-http` through the browser runner. It publishes nothing.
- Add `--publish` to the plugin command to release that tested artifact with `vercel@62.2.0 --prebuilt --prod`. The script checks the exact project ID and team ID before this step. It uses the project's production environment; no secret is passed as a CLI argument. It then checks discovery, the unsigned MCP challenge and the built consent script without a player session.
- The script takes no branch or commit. A commit that is not on `origin/main` cannot go live.
- The tool gate asks before a `vercel` command, a Porkbun API call or a browser visit to the live site or the Vercel dashboard.

## Domain and DNS

- The domain `kingdown.dev` is at Porkbun. Two A records, for `@` and `www`, point to `76.76.21.21`.
- On 2026-10-03 these two A records replaced the parking ALIAS and the `*` CNAME. https://kingdown.dev answered the same day.
- DNS changes go through Porkbun's API (`https://api.porkbun.com/api/json/v3/`, `dns/retrieve|create|delete/kingdown.dev`).
- A DNS change needs the owner's go.

## Secret files

- The folder `.secrets/` in the main checkout holds three files: `kaggle_api_token` (the Kaggle token), `oauth.json` (the OAuth keys) and `porkbun_api.json` (the Porkbun API keys).
- Git ignores the folder. Each file has mode 600. Never print, paste or commit a value.
- `tools/save-secret.sh NAME` stores the clipboard text as a new file in that folder and does not print the value.
