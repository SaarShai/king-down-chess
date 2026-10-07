# 10: Deploy publishes on a flag and confirms the live site

**What to build:** With the publish flag, after all checks pass, the deploy command runs the pinned Vercel CLI through `npx` with its yes flag, from the tested build. Then it fetches the live site, with no cookies, for up to 2 minutes. It passes when the live page loads the same bundle name as the build, and the privacy, terms and delete-data pages are byte-identical to the build's copies. Else it fails and names what differs. `DEPLOY_LIVE_URL` sets the site (default the public domain). The tool gate already asks before the publish flag (ticket 02).

**Blocked by:** 09

**Status:** ready-for-agent

**Owns:** `tools/deploy.sh`, `tools/deploy-live-check.mjs`, `tools/deploy.test.ts`

**Verify:** `npm test`

- [ ] With `--publish`, the stub log holds one `npx` call with the pinned Vercel version, its `--prod` and yes flags, after the runner call.
- [ ] A failed check stops the script before the `npx` call.
- [ ] The live check runs against a local server that serves the build: it passes.
- [ ] The local server with a different bundle name, and again with a changed terms page, fails within the time limit (shortened by an env for the test) and names the difference.
- [ ] The live check sends no cookie header; the local server asserts this.
- [ ] The worktree is gone after a publish run, pass or fail.
