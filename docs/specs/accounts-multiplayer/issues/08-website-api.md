# 08 — Website API and client

Type: task
Status: resolved
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

### 2026-10-10 — built on `claude/mp-08`

Progress:

- [x] 1. `src/api/http.ts`, `createApiHandler`: the website's JSON API.
  - Auth: `sessionVerifier` checks the Supabase session token with the project JWKS (`jose`, ES256 or RS256): issuer `<SUPABASE_URL>/auth/v1`, audience exactly `authenticated`, role `authenticated`, `is_anonymous` false, a UUID `sub`, and no `client_id` (an OAuth access token for `/mcp` has one). A refused token gets 401 `UNAUTHENTICATED`; a key set that does not load gets 503 (`Retry-After: 5`), so the website does not sign the player out.
  - Same origin only: the exact host; an `Origin` header other than the site, or a `Sec-Fetch-Site` other than `same-origin` or `none`, gets 403. No answer has a CORS header. Body cap 16 KB (413). Every answer has `Cache-Control: no-store`.
  - All the routes of the ticket, plus two that the website needs: `POST /api/games/:id/invite` (a new link when the old one is lost; the service ends the old one) and `GET /api/relations` (the player's own follows and blocks, so that the website can show an unblock). `POST /api/games` gives `{ view, invite }` for a friend game; the invitation has `url` = `<origin>/j/<token>`, built from the fixed origin.
  - Errors are `{ code, message }` with the protocol codes. A command answers with the protocol reply: `{ type: 'ack', command_id, revision, view }`, or `{ type: 'reject', command_id, code, message }`.
  - At most 4 engine requests (create, commands) at once on one instance (503, `Retry-After: 1`), as `/mcp` has.
- [x] 2. `createInternalHandler` in the same file: `POST /internal/tick`, `/internal/outbox`, `/internal/reminders` and `/internal/daily` call ticket 06's jobs. The secret comes from `KINGDOWN_INTERNAL_SECRET` (at least 32 characters, else every call gets 503). The header goes through SHA-256 and `timingSafeEqual`, so the compare takes the same time for every wrong value. `/internal/outbox` gets 503 when `RESEND_API_KEY` or `KINGDOWN_MAIL_FROM` is missing.
- [x] 3. `src/online/client.ts` (types only, no zod): `onlineClient` (a typed call for each route; `command` sends a lost or failed command again with the same `command_id`, after 0.5, 1 and 2 s; a refusal goes back at once), `merge` (the view rules of section 4.3) and `watch` (polls one game: every 2 s while a live game waits for the opponent, else every 30 s; not while the page is hidden; at once on `visibilitychange`, `pageshow` and `online`; a gap of more than 50 revisions reloads the full view; it stops when the game ends).
- [x] Wiring: `tools/plugin-server.mjs` sends `/api*` to the API and `/internal*` to the jobs; the rest goes to MCP as before. One store and one pool serve all three. `configurePlugin(env, { localDev, sessionKeys })` takes a local key set only in local development (the checks sign their own sessions); without `SUPABASE_URL`, `/api` answers 503.
- [x] The short-code limit of ticket 02 (open issue): migration `0009_invite_tries.sql` (one row for each player), the sixth block of `plugin-deploy/runtime-role.sql`, and one line in `GameService.join`: the 11th code try in one hour gets 429 `RATE_LIMITED`, on both surfaces. The row lock queues tries at once, so a burst cannot pass the limit. The 43-character link token is not counted. `bootstrap-test.mjs`, `migrate.ts` and `supabase/README.md` list 0009.
- [x] `protocol.ts`: two new error codes, `RATE_LIMITED` (report 4.3) and `UNAUTHENTICATED`.
- [x] `tools/vercel-check.mjs` (the compiled one-project tree) checks `/api` and `/internal` instead of the 404s of ticket 03.

### Evidence

Test database `kingdown_mp_08_test`, made with `node tools/plugin-db/make-test-db.mjs kingdown_mp_08_test`.

- Before the change (`npm test` on the branch start): 119 files, 1,929 passed, 8 skipped.
- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0009); every migration is repeatable".
- `npm test`: typecheck clean; vitest 122 files passed, 1,946 tests passed, 8 skipped; `node --test` 50 of 50; exit 0. That is the start (119 files, 1,929 tests) plus the 3 new files with 17 tests.
- New tests:
  - `src/api/http.test.ts` (9, stub services, real HTTP, a local key set): a website session gets in; 11 other tokens get 401 before any service call (no token, the `/mcp` audience, an MCP token with `client_id`, a guest, no `is_anonymous` claim, the `anon` role, another issuer, another key, expired, a `sub` that is not a UUID, a mixed audience); 503 when the key set does not load and when sign-in is not configured; other origins, `Sec-Fetch-Site` cross-site and same-site, a preflight and another host get 403 with no CORS header; 404, 405 with `Allow`, 413 (declared and streamed), malformed JSON; the actor comes from the token, never the body; the command reply and reject shapes, and no internal detail in a 500; the engine bound; the internal secret (missing, wrong, longer, shorter: 403; right: 200; GET: 405; unknown job: 404; no email settings: 503; no secret or one under 32 characters: 503).
  - `src/api/http.db.test.ts` (4, its own database `kingdown_mp_08_api_test`, the services on a copy of the reviewed runtime role, driven by `onlineClient`): a full Daily friend game between two website identities (create with invitation, join by short code in lower case with a dash, inbox, a lost reply sent again with the same ID applies once, `COMMAND_CONFLICT`, `since`, `STALE_REVISION`, `WRONG_TURN`, a preset, a draw offer and decline, moves, a resignation, empty inboxes, `NOT_FOUND`, `FORBIDDEN` for a third player); a new invitation ends the old one, 10 wrong codes then `RATE_LIMITED` (also for the right code), the token still joins, the count starts again after an hour, a block refuses the join; the account, relation and report routes (a report reaches the owner queue with the reporter from the session; a `reporter_id` in the body gets `INVALID_INPUT`); the jobs through `/internal` (403 without the secret, one turn email through the fake sender, reminders, a missed first-turn deadline ends the game as `no_start`, the daily job).
  - `src/online/client.test.ts` (4): the retry keeps one command ID (a network fault, then 503); no retry after a refusal; 4 tries at most; no call without a session; `merge` drops old and equal views, adds new commands with no double, keeps the rules and finds a gap; `watch` reloads the full view after a gap of more than 50 revisions.
- Mutation checks (one change at a time, run with `KINGDOWN_TEST_FILE=<file> npm test`, file restored and compared with `cmp`): no `client_id` check, no `is_anonymous` check, no origin check, any internal secret accepted, no code count in `join`, and the command sent with no surface. Each one fails a test.
- The compiled function: `npm run build:vercel` (it runs `npm run build`), then `npm run check:vercel`: "One-project tree: static site, /mcp (open, move), /authorize, /consent.mjs, /api (session tokens only; Daily games between two website players and between a website and a ChatGPT player, with a retry), /internal (secret only) and 1 archived engine(s) passed". In that check, `/api` refuses no token, the `/mcp` audience, an MCP token and a guest (401). Two website identities finish a Daily game (join by short code, a move each, a resignation). A website identity (White) and an MCP persona (Black, `kingdown_join` and `kingdown_move`) finish a Daily game in one database. The website's retry applies once, `since` shows the ChatGPT move, the ChatGPT move after the resignation gets `MATCH_TERMINAL`, and the command rows have the surfaces `web`, `chatgpt`, `web`. `/internal/tick` gives 403 with no secret and with a wrong secret, and 200 with the secret; `/internal/outbox` gives 503 with no email settings.
- `npm run plugin:build`, `npm run plugin:server:check` ("Compiled HTTP + real PostgreSQL: open, move, AI, retry, foreign seat rejection, service restart/resume, friend invitation/join, resource (4297468 JSON bytes), and production auth gate passed") and `npm run plugin:smoke` pass. The builds add no engine to `engines/`.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed.

### Interfaces (for ticket 09, ticket 10 and the website UI)

- The website calls `onlineClient({ token: async () => (await sb.auth.getSession()).data.session?.access_token ?? null })` (same origin, so `origin` stays empty) and `watch(api, gameId, onView)` for an open board. It sends a command's reply to `watch(...).accept(view)`.
- `GameService.join` now counts code tries for both surfaces; ticket 09's `kingdown_join` gets the limit with no change. A `RATE_LIMITED` error has status 429.
- The invitation link is `<origin>/j/<token>`; the alert emails link to `/g/<id>` (ticket 06).

### Choices

- The website verifies the session token on the server with the JWKS only (no call to Supabase for each request). Marked `ponytail:`: after a sign-out or a ban, a token works until it expires (1 hour at most). The `/mcp` verifier asks Supabase each time, because the report puts OAuth revocation there.
- A guest (anonymous session) gets 401: guests are phase 2.
- The code limit counts every code try, right or wrong. A count of wrong tries only needs a second statement, and tries at once could then pass the limit.
- `/internal/*` checks the host as `/api` does: pg_net calls `https://kingdown.dev`.

### Open issues

- For the owner, before a deploy (nothing done on this branch): apply 0009 and the sixth block of `plugin-deploy/runtime-role.sql`; set `KINGDOWN_INTERNAL_SECRET` (32 or more characters) in the Vercel environment and the same value in Vault; the Supabase project must sign sessions with an asymmetric key (ES256 or RS256) so that the JWKS holds it. A project that still signs with the legacy shared secret makes every `/api` call 401.
- For main (not edited on the branch): `docs/HOSTING.md` needs `KINGDOWN_INTERNAL_SECRET` and the `/api` and `/internal` paths of the one project.
- The website has no page at `/j/<token>` or `/g/<id>` yet (UI work). When it has, `tools/plugin-server-build.mjs` needs a route for each to `index.html` in `config.json`.
- A visit without a command does not count as "came back" for the turn email: the API does not set `alert_state.returned_at` (the runtime role has no grant for it, and views stay read-only).
- No route shows the `notifications` rows (turn alerts in the site, and the moderation statements of ticket 07, open issue 4).
- Rate limits other than the short code (create, commands, reports, follows) wait for the Vercel firewall at the first deploy.
- A ban takes effect at the next token refresh (1 hour at most), as in ticket 07, open issue 3.
- `drainOutbox` takes at most 50 rows with a 10 s timeout for each email; many slow sends can pass the function's 30 s limit. The Resend idempotency key stops a second email when the next run sends the row again.
- `src/match/service.db.test.ts` joins its player `b` by code 10 times in one run: exactly the limit. One more code join there gets `RATE_LIMITED`; use a token or a new player.
- `tools/vercel-check.mjs` uses the MCP tools of today (`kingdown_join`, `kingdown_get`, `kingdown_move`). Ticket 09 changes them; the merge step changes the check to match.
- Process note: two early runs of the new unit tests piped `npm test` through `grep` and `head`, which breaks the house rule. Every result above comes from `npm test` or a check written to a log file.

### 2026-10-10 — merge note

The merge step merged this branch into `claude/multiplayer-foundation`, then ticket 09. Ticket 09 removes the `MatchService` adapter, so `tools/plugin-server.mjs` now makes a `GameService` for `/api` and `/internal` on the same store. The cross-surface game in `tools/vercel-check.mjs` now uses ticket 09's tool shapes; this closes the open issue on that check. Evidence: ticket 10, "wave 3 merge".
