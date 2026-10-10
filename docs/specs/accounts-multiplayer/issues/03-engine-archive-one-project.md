# 03 — Engine archive and one Vercel project

Type: task
Status: resolved
Wave: 1 · Model: Opus · Branch: `claude/mp-03`

## What to build

Read part 03 of the report: sections 4.2 (hosting), 5.9 (engine archive, grafts G1 and G2).

1. **Build-time fingerprint.** The compiled worker gets its fingerprint from the build (an esbuild `define`), not from hashing files at start-up. Development mode (tsx) keeps a source hash.
2. **Archive.** Each released worker bundle stays in the repository as `engines/<fingerprint>.mjs` (or another single folder that the build copies into the function). `loadMatch(save)` runs a save on the bundle of its fingerprint; `createMatch` uses the current bundle. An unknown fingerprint gives `MATCH_INCOMPATIBLE`, as today.
3. **Checks.** A test reloads one saved game for each archived fingerprint (commit one small fixture save per bundle). A script `tools/engines-check.mjs` lists the fingerprints of unfinished games from a database URL (the `games` table of ticket 02; read `plugin_matches` if `games` does not exist yet) and fails when a bundle is missing. `tools/deploy.sh` runs it when a database URL is configured; it must not need one to run the normal checks.
4. **One Vercel project.** A build (`npm run build:vercel`) emits one Build Output API tree: the website's static files plus one Node function that serves `/api/*`, `/mcp`, `/authorize`, `/consent.mjs`, `/.well-known/oauth-protected-resource*` and `/internal/*`. The function entry dispatches by path; `/api` and `/internal` answer 404 until tickets 08 and 06 add them. Keep the current website and plugin build commands and the current deploy paths unchanged; add the new build and its check (`plugin:server:check`-style smoke test of the compiled tree) without deploying anything. Write the switch-over steps (DNS stays; the OAuth resource becomes `https://kingdown.dev/mcp`; the audience hook and the ChatGPT connection change) in this ticket's comments.

## Checks

- Change one comment in `src/rules/` in a scratch commit: the development fingerprint changes; a saved game from before still loads on its archived bundle in the compiled build.
- The new build's smoke test starts the compiled function locally and answers `/mcp` (with local personas), `/authorize`, and a static file.
- `npm test`, `npm run build`, `npm run plugin:build`, `npm run plugin:server:check` and the plugin browser checks pass.

## Comments

### 2026-10-10 — build (branch `claude/mp-03`)

Progress:

- [x] 1. Build-time fingerprint. `tools/plugin-runtime-build.mjs` builds the worker with a placeholder stamp (an esbuild `define`, `__KINGDOWN_ENGINE__`), hashes the bundle, then writes the hash in place of the stamp. The compiled worker no longer reads files at start-up. Development (tsx) keeps the source hash.
- [x] 2. Archive. `engines/<hex>.mjs` holds each released bundle, `engines/<hex>.save.json` its fixture game (two moves). The build adds a new engine there and copies every bundle into `runtime/engines/`. `loadMatch(save)` runs a save on `engines/<hex>.mjs` when it exists (repository folder in development, `runtime/engines/` when compiled). Else it runs the current engine, which refuses another fingerprint with `MATCH_INCOMPATIBLE`. `createMatch` uses the current engine.
- [x] 3. Checks. `tools/engines.test.ts` (in `npm test`): each bundle has its own hash as its name and one fixture; each fixture reloads on its bundle and accepts one move; an unknown fingerprint gives `MATCH_INCOMPATIBLE`; `engines-check` reads `games` (statuses other than finished, aborted, annulled) or `plugin_matches` (status playing). `tools/engines-check.mjs` reads `KINGDOWN_ENGINES_DATABASE_URL` (not an argument, so no password in a process list) in a read-only transaction. `tools/deploy.sh --target plugin` now (a) refuses a release when the build added an engine that is not on `origin/main`, and (b) runs `engines-check` on the built `runtime/engines/` when `KINGDOWN_ENGINES_DATABASE_URL` is set; without it, it says that it skipped the check.
- [x] 4. One Vercel project. `npm run build:vercel` runs `npm run build`, then `tools/plugin-server-build.mjs --site`. It emits `kingdown-deploy/.vercel/output/`: `static/` (the website `dist/`), one function `functions/mcp.func`, links for `/authorize`, `/consent.mjs`, both OAuth metadata paths, `/api` and `/internal`, and `config.json` routes `^/api/.+$ → /api` and `^/internal/.+$ → /internal`. The function entry (`tools/plugin-server.mjs`, `configurePlugin`) dispatches by path: tickets 08 and 06 add their handlers at the one marked place; until then `/api*` and `/internal*` answer 404. A local run also serves the consent page when it has the public Supabase settings. `npm run check:vercel` (`tools/vercel-check.mjs`) copies the tree, routes requests as Vercel does and checks it. CI (`plugin-checks.yml`) runs both. The website and plugin build commands and deploy paths are unchanged; nothing deploys.

Evidence (worktree `.claude/worktrees/mp-03`, test database `kingdown_mp_03_test`):

- `npm run plugin:db:init-test`, then `npm test`: 112 files, 1,843 tests passed, 8 skipped, exit 0 (before the change: 111 files, 1,836 passed, 8 skipped). New: 5 engine-archive tests, 2 deploy tests.
- `npm run build`: exit 0. `npm run plugin:build`: exit 0. `npm run plugin:build:vercel`: exit 0, `config.json` stays `{"version":3}`.
- `npm run plugin:server:check`: "Compiled HTTP + real PostgreSQL: open, move, AI, retry, foreign seat rejection, service restart/resume, friend invitation/join, resource (4297468 JSON bytes), and production auth gate passed".
- `npm run plugin:smoke`: "Source-free runtime: Haste, bounded AI, public DTO, apply, save/reload and 1 archived engine(s) passed".
- `npm run plugin:check:protocol`: PASS.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed.
- `npm run build:vercel`, then `npm run check:vercel`: "One-project tree: static site, /mcp (open, move), /authorize, /consent.mjs, /api and /internal (404 until tickets 08 and 06) and 1 archived engine(s) passed".
- `tools/engines-check.mjs` on the test database: exit 0 with only archived engines; exit 1 with "MISSING sha256:abab… (1 unfinished)" after one inserted `plugin_matches` row of an unknown engine (row removed after).
- Scratch-commit check (throwaway worktree, removed after). Before: compiled engine `sha256:2675a7e6…`, the same hash as the build in this worktree (the fingerprint does not depend on the folder). (1) A comment in `src/rules/rules.ts`: the development fingerprint changes (`40ca2a73…` → `58b6af1e…`) and the old development save gets `MATCH_INCOMPATIBLE`; the compiled fingerprint stays `2675a7e6…`, no new engine, and the compiled save from before plays its next move. (2) A code change in `src/rules/rules.ts`: the build adds engine `b3934623…` (untracked, so the deploy guard refuses it until it is committed); the compiled save from before plays its next move on its archived bundle `2675a7e6…`; a new game gets `b3934623…`.

Switch-over steps (not done; each needs the owner's go):

1. DNS stays. The two A records already send kingdown.dev to Vercel.
2. Register a new Supabase OAuth client for the new resource, because the audience hook maps one client to one resource: `insert into kingdown_oauth.client_resources(client_id, resource) values ('<new client>', 'https://kingdown.dev/mcp')`. The OAuth resource becomes `https://kingdown.dev/mcp`.
3. In Supabase Auth, add `https://kingdown.dev/authorize` to the Redirect URLs (the consent page now runs on this origin). The authorization path stays `https://kingdown.dev/authorize`; the function serves it, so the `/authorize` redirect in `vercel.json` goes.
4. Set the production environment of the Vercel project `kingdown`: `KINGDOWN_PLUGIN_ORIGIN=https://kingdown.dev`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS=<new client>`, `KINGDOWN_PLUGIN_DATABASE_URL` (the runtime role, `?sslmode=require`), and `KINGDOWN_PLUGIN_OAUTH_READY=1` after the hook check passes. Extend `tools/deploy.sh --configure-plugin` for this project.
5. Change the website path of `tools/deploy.sh --publish` to publish the tested `npm run build:vercel` tree with `vercel deploy --prebuilt --prod` to `kingdown`, with the engine guards and both live checks (site pages; discovery, unsigned MCP challenge and consent script at https://kingdown.dev).
6. On the first preview deployment, check that `/api/x` and `/internal/x` reach the function with the original path in `req.url`. `check:vercel` assumes this.
7. In ChatGPT, add a new connection with `https://kingdown.dev/mcp` and sign in again: tokens for `https://kingdown-plugin.vercel.app/mcp` do not pass at the new resource.
8. Run both connections for one week. Then remove the old connection, the old client row and the `kingdown-plugin` project.
9. Give the deploy `KINGDOWN_ENGINES_DATABASE_URL` (read access to the games) so that each release checks the engines in use.

Open issues:

- Games made on the deployed plugin before this build have a fingerprint of the old self-hashing worker. That worker reads its own file at start-up, so it cannot run from `engines/`; those games get `MATCH_INCOMPATIBLE`, as after any engine change today. They are private test games: ticket 02 ends them. Until then, `engines-check` with a database URL fails on them.
- The archived engine `2675a7e6…` is the engine of this branch. After a merge that changes the engine (main's rule changes, or ticket 02 if it touches `src/rules`, `src/ai`, `src/game.ts` or the worker), run `npm run plugin:build` and commit the new `engines/` files; delete bundles that never reach a release.
- `engines-check` reads `games.engine_fingerprint` (with or without `sha256:`) and treats `finished`, `aborted` and `annulled` as ended. Ticket 10 checks this against the ticket 02 schema.
- ponytail: every build archives a new engine in the repository, also a check build. Delete uncommitted bundles that you do not release. The quarterly removal of unused bundles (report 5.9, item 6) is not built.
- For main (not edited on the branch): `docs/HOSTING.md` needs the two new plugin deploy steps (engine archive guard, `KINGDOWN_ENGINES_DATABASE_URL`) and `npm run build:vercel` / `npm run check:vercel`.

