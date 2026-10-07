# 10: Deploy publishes on a flag and confirms the live site

**What to build:** With the publish flag, after all checks pass, the deploy command runs the pinned Vercel CLI through `npx` with its yes flag, from the tested build. Then it fetches the live site, with no cookies, for up to 2 minutes. It passes when the live page loads the same bundle name as the build, and the privacy, terms and delete-data pages are byte-identical to the build's copies. Else it fails and names what differs. `DEPLOY_LIVE_URL` sets the site (default the public domain). The tool gate already asks before the publish flag (ticket 02).

**Blocked by:** 09

**Status:** resolved

**Owns:** `tools/deploy.sh`, `tools/deploy-live-check.mjs`, `tools/deploy.test.ts`

**Verify:** `npm test`

- [x] With `--publish`, the stub log holds one `npx` call with the pinned Vercel version, its `--prod` and yes flags, after the runner call.
- [x] A failed check stops the script before the `npx` call.
- [x] The live check runs against a local server that serves the build: it passes.
- [x] The local server with a different bundle name, and again with a changed terms page, fails within the time limit (shortened by an env for the test) and names the difference.
- [x] The live check sends no cookie header; the local server asserts this.
- [x] The worktree is gone after a publish run, pass or fail.

## Comments

Builder, 2026-10-07, branch `build/secrets-and-public-gates-10`.

- Files: `tools/deploy.sh` (the publish step), `tools/deploy-live-check.mjs` (new), `tools/deploy.test.ts` (9 new tests, 1 changed). No other file changed.
- Publish step, after `npm run check:browser` passes: copy the tested `dist/` (the runner builds there) into `<temp>/kingdown`; in that folder `npx --yes vercel@62.2.0 link --project kingdown --yes`, then `npx --yes vercel@62.2.0 deploy --prod --yes`, both with stdin from `/dev/null`; then `node <worktree>/tools/deploy-live-check.mjs <temp>/kingdown`. Each is a named step (`copy build`, `publish`, `live check`); a failure prints `FAIL at <step>` and exits 1.
- Choices that the ticket did not fix:
  - Pinned version: `vercel@62.2.0`, the version in the npx cache from the last deploy that worked (2026-10-03). The registry has 62.7.0 now; the owner can change the one `vercel=` line.
  - Two npx calls, not one: `vercel deploy` has no project option (checked in the 62.2.0 option list), so a fresh folder needs `link --project kingdown` first, as in the AGENTS.md recipe. The test asserts exactly one `deploy --prod --yes` call and one `link` call, both with the same exact version, after the runner. npx gets its own `--yes` because the dev-environment spec sets `yes=false` in `.npmrc`.
  - The live check comes from the tested commit (`<worktree>/tools/`), as `wt.sh` does in ticket 09. The test commits the real file into the temporary origin/main.
  - One temp folder now holds the worktree (`tree/`) and the published copy (`kingdown/`); the cleanup removes the whole folder.
  - Live check: the bundle name is the `src` of the first `type="module"` script in `index.html`. It fetches `/`, `/privacy.html`, `/terms.html`, `/delete-data.html` with `credentials: 'omit'` and `cache-control: no-cache`, 15 s per request. It tries again every 5 s until the limit (`DEPLOY_LIVE_TIMEOUT_MS`, default 120000). A fail names each difference (bundle: live and build names; a page: live and build sizes; an HTTP status or fetch fault). Exit 2 for a usage fault (no folder, or a build with no entry script or legal page).
- Tests (`tools/deploy.test.ts`, 16 in all): live check against a local `node:http` site that refuses and records a cookie header: pass and no cookie; a different bundle fails in < limit + 5 s and names both names; a changed terms page fails and names only `terms.html`; a site that is right on the second try passes. `deploy.sh --publish` with stub `npm`/`npx` and the local site: order runner, link, deploy; exactly the two npx calls with the same exact version; the deploy runs in `.../kingdown` with the four build files; live check passes; worktree gone. A failed `npm test` and a failed runner: no npx call, no live check, worktree gone. A failed `vercel deploy`: `FAIL at publish`, no live check, worktree gone. A changed live terms page: `FAIL at live check`, names `terms.html`, worktree gone.
- Mutation checks: with the page comparison removed, the two terms tests fail; with a cookie header added to the fetch, all four live-check tests fail.
- Commands run: `npx vitest run tools/deploy.test.ts` (16 pass); `npm test` after the merge of the integration tip (`2dfca1a`): tsc clean, 60 vitest files, 1100 tests pass, 42 node tests pass. Three earlier runs (load average 50 to 97 from other jobs) failed only on 5 s time-outs in `src/workshop/judge.test.ts`, `src/rules/power-fixes.test.ts` and `src/sim/piece-activity.test.ts`; these files pass alone and are not in this ticket.
- Not done: a real publish. It needs the owner's go (the tool gate asks before `--publish`), and the real origin/main has no `tools/wt.sh` or live check until the owner merges. After the merge, the owner runs `tools/deploy.sh --publish` once; if `vercel link` asks for a scope, the CLI needs the owner's sign-in on this Mac.

- Owner decision, 2026-10-07 ("use your best judgement for deciding these. complete what needs completing."): keep `vercel@62.2.0` (the version of the last deploy that worked); the two `npx` calls stay, because `vercel deploy` has no project option. The one real publish waits for the merge into main.
