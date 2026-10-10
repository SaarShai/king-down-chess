# 08 — Website API and client

Type: task
Status: ready-for-agent
Wave: 3 (after 03, 06, 07) · Model: Opus · Branch: `claude/mp-08`

## What to build

Read part 03 of the report: sections 4.3 (protocol), 4.4 (website flows), 8 (identity and security).

1. `src/api/http.ts`: a JSON handler for website sessions, served by the one-project function entry of ticket 03.
   - Auth: the Supabase session JWT (`Authorization: Bearer`), verified with the project JWKS (`jose`), audience `authenticated`, role `authenticated`, not anonymous. Same-origin only; strict CORS; body size cap; `no-store`.
   - Routes: `POST /api/games`, `GET /api/games/:id?since=<rev>`, `POST /api/games/:id/commands`, `POST /api/invites/redeem` (token or code), `GET /api/me/games`, `GET|PATCH /api/me/profile`, `POST /api/me/handle`, `POST|DELETE /api/me/deletion`, `GET|PUT /api/me/notifications`, `POST|DELETE /api/relations`, `POST /api/reports`.
   - Errors use the protocol codes of ticket 02.
2. `/internal/*`: `POST /internal/tick`, `/internal/outbox`, `/internal/reminders`, `/internal/daily`, each requiring `X-Kingdown-Internal: <secret>` (constant-time compare) and calling ticket 06's jobs.
3. `src/online/client.ts`: a typed `fetch` client for the website (no UI): calls, retries with the same `command_id`, and a polling helper that applies the view rules of section 4.3 (drop old revisions, refetch on a gap).

## Checks

- HTTP tests against the compiled function and the disposable database, with test JWTs from a local JWKS: auth refusals (no token, wrong audience, MCP token, anonymous), a full Daily friend game between two website identities, retries, the internal secret.
- A cross-surface test: one website identity and one MCP identity finish a Daily game in one database.
- `npm test` and the plugin browser checks pass.

## Comments
