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
