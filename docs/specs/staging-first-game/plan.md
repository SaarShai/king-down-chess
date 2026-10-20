# First staging game

Status: in progress.

Owner request: develop in this separate project, reuse the reconciled work, fix integration faults and demonstrate the first web–ChatGPT game in staging. No production deploy.

## Boundaries

- This repository is an independent copy under the new project. The source project is read-only and its push remote is disabled here.
- Use the existing engine, painted art, account service and clients. Keep production accounts/data/deployments unchanged.
- The integration task owns shared client, plugin and GUI files. Delegated writers use separate worktrees and named files.
- Use fresh local test data and isolated staging configuration. Never copy or print credential files.

## Plan

1. Import the integrated base and the reviewed web/GUI work in small increments; retain source references and fix known regressions.
2. Reconcile migration numbering and run the ordered schema on a disposable database.
3. Wire the existing account screens through the web client and host adapter. Preserve request identity, privacy and local saves.
4. Build and test one staging friend game across HTTP and MCP: hidden setup, complex turn, lost reply/reload and authoritative result.
5. Review the changes independently and fix confirmed faults. Exercise the real ChatGPT host when staging access is available; distinguish that from the harness.

## Acceptance

- Independent application repository; original checkout unchanged.
- Required tests/builds pass against the integrated source. No skipped required database test.
- Same account/game continues on both surfaces. Stable command retries have one effect; changed input under the same ID fails.
- No hidden opponent setup or human-game board in model responses.
- Local game/learning routes remain usable.
- Staging is isolated from production. No production deployment, migration or account mutation.
- Exact preview address, source, checks and any host-access limits are recorded.

## Integration checkpoint

- Imported the preserved web branches through web-08, both regression patches and approved GUI work. Resolved shared art paths and the coin paint/focus rules.
- Integrated migration, HTTP, shared runtime and isolated staging configuration changes. The source project remains read-only.
- Fresh loopback database `kingdown_new_staging_test`: migrations 0001–0016 each apply twice.
- Initial broad baseline: 3,928 passing tests, 18 failures and 200 skipped tests. Failures include load-sensitive time limits, stale shared-style assertions and a source-harness readiness race. Required database tests are being run with the explicit disposable database.
- Focused HTTP/database tests: 67 pass, including a game shared by HTTP and MCP, hidden setup and a duplicate move with one stored receipt. Runtime route checks: 9 pass. Artwork checks: 53 pass.
- Independent review found and fixed the UI command-ID format mismatch and a stale invitation preview that replaced newer navigation. Configuration review also changed the staging connection guard to require the restricted runtime role.
- Real staging resources now exist: Supabase `kingdown-staging` (`puhspsyjyzaghmgtkzqd`, Free) and Vercel `kingdown-staging` (`prj_6iNibe34pA8ZSblH8DPAHyDTuz3j`). No production resources changed.
- Staging schema, restricted grants and account switch applied. Public OAuth client `001472fe-cd83-4a73-b0e5-87edc54b0713` maps to `https://kingdown-staging.vercel.app/mcp`. Preview-only database and internal secrets are held by Vercel. No secrets are in this repository.
- Remaining: combined browser proof, complete integrated checks, auth provider setup, preview build/deploy, and real ChatGPT host proof. The target address is not yet a verified working deployment.
