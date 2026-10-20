# Shared web game HTTP adapter

Status: implemented; integrated tests pending

## Plan and checks

1. Add thin routes for the shared game screens. Reuse the game and plugin account services, including quota checks.
2. Require a stable start command UUID. Preserve strict input, session, admission and operation guards. Bound engine routes.
3. Add HTTP boundary checks and database checks for stable retries and private invite previews.
4. Typecheck this branch. The parent task owns the test lane and database runs.

Acceptance: the web client receives the same settings, profile record, join preview and block state as the plugin. A repeated start has one effect; changed input fails. Disabled operations remain unavailable before any private work. No production or remote change.

## Result

- Add Create with a required command UUID, Find, Accept, Cancel, lobby and invite preview. Match starts and commands share the existing quota buckets. Routes that can build a match share the engine bound.
- Add shared settings, handle/check/icon, record/history/block pagination and block read/write. These routes call the existing plugin account service.
- Keep operation, host, origin, session, current-user and admission guards. Reject unknown or repeated new query fields. Reserve the Find path before matching a game ID.
- Build invite links as `/j#token`, which the shared web entry reads. A retried friend Create adds an invite only while the returned game waits for a guest.
- Add boundary coverage for input, guards, response shapes, quotas and engine bounds. Add database coverage for start retry/mismatch, preview without membership, private setup, HTTP/MCP command retry and the final result.

## Verification

- `npm run typecheck`: pass.
- `git diff --check`: pass.
- No test or database write runs in this worker. The root task owns the shared test lane and runs the combined HTTP/client/database checks after integration. The database fixtures need the shared web worker's client changes.
- No dependency, production, deployment or remote change.
