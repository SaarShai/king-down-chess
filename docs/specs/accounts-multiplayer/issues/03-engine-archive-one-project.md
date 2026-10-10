# 03 — Engine archive and one Vercel project

Type: task
Status: ready-for-agent
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
