Accounts and multiplayer: the phase 1 server foundation

## Summary

This branch adds the server foundation for online play between people, on the website and in the ChatGPT plugin, with one account and one game database. It is phase 1 of the [research report](../../research/multiplayer-2026-10-10/README.md) ("Friends and Daily"), without the visual work. Nothing deploys. The live site and the live plugin do not change until the owner runs the steps below.

Why: the owner asked to "build the infrastructure and foundation for what you recommend in a branch" (2026-10-10). The build follows the report's eight picks as the agent's picks; the owner can change each one. The [spec](spec.md) and its [tickets](issues/) hold the detail and the evidence.

One write path serves both surfaces:

```text
website  ── /api/*      (Supabase session JWT, same origin) ─┐
ChatGPT  ── /mcp        (OAuth token, 16 tools)             ─┼─> GameService (src/match/service.ts)
pg_cron  ── /internal/* (X-Kingdown-Internal secret)        ─┘      one transaction per command
                                                                    └─> Postgres: games, game_players,
                                                                        game_commands, outbox, ...
```

What the branch adds:

```text
supabase/migrations/
├── 0005_accounts_v2.sql      # handles, preset icons, privacy settings, account_deletions; no real-name copy
├── 0006_games.sql            # games, seats, commands, invites, relations, reports, notifications, outbox
├── 0007_jobs.sql             # kingdown_jobs helpers: alert address, account deletion after the grace
├── 0008_accounts_safety.sql  # handle reservation, 7-day deletion grace, sign-in cancels it
└── 0009_invite_tries.sql     # 10 short-code tries an hour for each player
supabase/ops/cron.sql         # pg_cron + pg_net schedules for /internal/* (the owner applies it)
plugin-deploy/runtime-role.sql  # blocks 3-6: the grants of the server role
src/match/                    # protocol, store, GameService: commands, invites, deadlines, inbox, small views
src/online/                   # jobs (sweep, reminders, outbox drain, deletions, cleanup), Resend mail,
                              #   accounts, safety (reports, owner queue, hold), website client,
                              #   Glicko-2 and the deadline function (pure, for phases 2 and 3)
src/api/http.ts               # the website JSON API and the /internal job endpoints
src/plugin/                   # the ChatGPT tool table; board data in _meta only
engines/                      # the engine archive: one bundle and one fixture save per fingerprint
tools/plugin-server.mjs       # one function: /api, /mcp, /authorize, /internal
tools/vercel-check.mjs        # check of the one-project Vercel tree (npm run build:vercel)
tools/mod.ts                  # the owner's moderation CLI (npm run mod)
docs/safety/                  # seven UK safety drafts for the owner and a lawyer
```

No new npm dependency.

## How to check

```sh
node tools/plugin-db/make-test-db.mjs kingdown_review_test
export PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_review_test
npm run plugin:db:init-test
npm test
npm run build
npm run plugin:build && npm run plugin:server:check && npm run plugin:smoke
npm run plugin:check:protocol
npm run check:browser plugin-ui plugin-ui-http plugin-oauth
npm run build:vercel && npm run check:vercel
npm run test:docs
```

The database tests make their own copies (`<name>_api_test`, `_chatgpt_test`, `_jobs_test`, `_migrations_test`), because a sweep ends every due game in its database.

## Evidence

All on a fresh loopback database, `kingdown_mp_final_test`, at `b4eda638`:

- **Before (main `30211b3a`):** `npm test` 111 files, 1,836 tests (ticket 03's base run).
  **After:** typecheck clean; vitest 124 files, 1,955 passed, 8 skipped (the balance-drift tests); `node --test` 50 of 50; exit 0.
- `npm run plugin:db:init-test`: "migrations 0001-0009; every migration is repeatable".
- `npm run build`, `npm run plugin:build`, `npm run plugin:smoke`, `npm run test:docs` (110 tests): exit 0.
- `npm run plugin:server:check`: compiled HTTP and real PostgreSQL passed (resource 4,327,175 JSON bytes, under the 4.4 MB ceiling).
- `npm run plugin:check:protocol`: the 16 tools with their hints, the resource on `kingdown_open` only, board data in `_meta` only.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed.
- `npm run check:vercel`: "static site, /mcp (open, move), /authorize, /consent.mjs, /api (session tokens only; Daily games between two website players and between a website and a ChatGPT player, with a retry), /internal (secret only) and 1 archived engine(s) passed".
- An unchanged poll (`view` with `since` = the current revision) on the local database: 0.59 ms median, 1.12 ms p95, 633 bytes; 330 reads left the game row unchanged.
- Engine archive: a changed comment in `src/rules/rules.ts` changes the development fingerprint (`40ca2a73…` to `58b9eca4…`) and the old development save gets `MATCH_INCOMPATIBLE`. The compiled fingerprint stays `2675a7e6…`, the build adds no engine, and the archived fixture game plays its next move in the compiled runtime.

The checks for the whole build (spec), with their tests:

| Check | Result | Test |
|---|---|---|
| A retry with the same `command_id` applies once; a two-action Daily turn is all or nothing | pass | `service.db.test.ts` "applies a retried command once…", "applies a Daily turn of two actions as one command, all or nothing"; `http.db.test.ts` retries |
| Seat action states match the engine turn after each command, Haste included | pass | `service.db.test.ts` "keeps every seat action state on the engine turn…" |
| `kingdown_get` writes nothing; an unchanged read is fast | pass | `server.db.test.ts` "runs the read-only tools on a read-only connection"; 0.59 ms median above |
| A missed Daily deadline ends the game by the sweep; the turn email and the 80% reminder go out once; a second turn email waits | pass | `jobs.db.test.ts` (fake clock, fake sender) |
| Deletion after the 7-day grace keeps the opponent's game ("Deleted player"); a sign-in cancels it; a report hold keeps the data | pass | `jobs.db.test.ts` "deletes an account after the grace…"; `accounts.db.test.ts` "asks for a deletion with a 7-day grace that a sign-in cancels…" |
| A game from before an engine change keeps accepting moves | pass | `tools/engines.test.ts`; `plugin:smoke`; the comment-change check above |
| A report from the website and one from ChatGPT reach the owner queue | pass | `http.db.test.ts` (with `SafetyService.queue()`); `server.db.test.ts` (`kingdown_report` writes the `reports` row) |
| A website player and a ChatGPT player finish a Daily game in one database | pass | `npm run check:vercel` (compiled function, two local identities) |
| `npm test`, the plugin browser checks and `npm run build` pass | pass | above |

The review step fixed 19 confirmed findings of three reviews (correctness, security, spec). Each code fix has a test that fails on the old code, for example:

```text
service.db.test "keeps the last revision for the end of a game"
  before: a move at revision 999 passes; the game can never end, and one stuck game stops the sweep
  after:  MATCH_LIMIT for the move; a resignation, a claim or the sweep still ends the game
```

[Ticket 10](issues/10-review.md) lists every finding, its commit and its test.

## Deviations from the report

- **Outbox:** a plain `outbox` table drained with `for update skip locked`, not pgmq. It runs on every Postgres.
- **Schedules:** `supabase/ops/cron.sql` is not a migration, because the local test database has no pg_cron or pg_net.
- **Handles:** `text` with a lowercase check, not `citext`.
- **Migrations:** five files (0005 to 0009), not two. 0006 ends the old plugin games instead of a backfill; their rows stay, unused, in `plugin_matches`.
- **First turn:** each side gets 3 days for its first turn, and a miss cancels the game (`no_start`), also with 1 day per move. The report's deadline function gives a loss on time after 1 day. Open for the owner.
- **Report hold:** it holds the reported player and the reporter.
- **Deletion:** no export RPC yet. The OAuth grants go with the auth user (Supabase deletes them), not by a separate step.
- **Website sessions:** the API checks the token with the JWKS only. After a sign-out or a ban, a token works until it expires (1 hour at most).
- **Rate limits:** only the short-code tries (0009). The others wait for the Vercel firewall at the first deploy.
- **ChatGPT:** board data goes in `_meta.view` for solo games too. Not built: the adaptive poll schedule, `setOpenInAppUrl`, presence, and board controls for say, draw, claim, resign, abort and report (the model can resign, abort, offer a draw and report).
- **Alerts:** email only (Resend over `fetch`). Web Push is phase 2. A moderation or appeal notice makes no email.
- **Privacy picks:** quiet mode also hides the opponent's presets; a block is not secret; the opponent always sees when each move was made.
- **One Vercel project:** the build and its check exist. `tools/deploy.sh` has no path yet that publishes this tree to the `kingdown` project.
- **Not in this build (visual work, needs the owner's yes on a sample):** the website online mode, the `/j/<token>` and `/g/<id>` pages, the handle screen, email-code sign-in and the consent page on the website session. No rating runs yet (phase 3); live games have no clocks (phase 2).
- **Phase 1 checks not run here:** ChatGPT on desktop, iPhone and Android; the 50-game load test; the live 2-minute deadline; `supabase/check-migration.mjs` (it needs pglite, and this worktree installs no package).

## Owner's steps before any deploy

Nothing below is done on this branch. Each step needs the owner.

Before the first release:

1. Change the website text that says a deletion is at once (`src/account/account.ts`, the dialog in `index.html`, `public/delete-data.html`, `public/privacy.html`) to the 7-day grace. This is a visual change, so it needs a yes on a sample.
2. Check that the Supabase project signs sessions with an asymmetric key (ES256 or RS256). With the legacy shared secret, every `/api` call gets 401.
3. Check that Supabase allows a trigger on `auth.sessions`. If it refuses, all of 0008 rolls back.

The release (`supabase/README.md`, "Release order (a short outage)"):

4. Run `tools/deploy.sh --target plugin`, then `tools/deploy.sh --target plugin --publish` with `DEPLOY_LIVE_TIMEOUT_MS=900000`. While the live check waits, apply migrations 0005 to 0009 on Supabase (`npm run plugin:db:migrate` with a privileged connection, or the SQL editor), then blocks 3 to 6 of `plugin-deploy/runtime-role.sql`. The new server answers 503 until then. The old plugin games end.
5. Optional: give the deploy `KINGDOWN_ENGINES_DATABASE_URL` (read access), so each release checks the engines in use.

The move to one project at `kingdown.dev` (ticket 03, switch-over steps):

6. OAuth resource: register a new Supabase OAuth client and map it to `https://kingdown.dev/mcp` for the audience hook (`kingdown_oauth.client_resources`). Add `https://kingdown.dev/authorize` to the Supabase redirect URLs, and remove the `/authorize` redirect from `vercel.json`.
7. Vercel project `kingdown`: set `KINGDOWN_PLUGIN_ORIGIN=https://kingdown.dev`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`, `KINGDOWN_PLUGIN_DATABASE_URL` (the runtime role), the internal secret `KINGDOWN_INTERNAL_SECRET` (32 or more characters), the Resend key `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM`. Set `KINGDOWN_PLUGIN_OAUTH_READY=1` after the audience hook check passes. Resend needs the sending domain `kingdown.dev` verified (DNS records: the owner's go).
8. Add a publish path to `tools/deploy.sh` for the `npm run build:vercel` tree (`vercel deploy --prebuilt --prod` to `kingdown`). On the first preview, check that `/api/x` and `/internal/x` reach the function with the original path.
9. After `https://kingdown.dev/internal/*` is live: turn on pg_cron and pg_net, store the same internal secret in Vault as `kingdown_internal_secret`, and apply `supabase/ops/cron.sql`. Then check `cron.job` and `net._http_response`.
10. ChatGPT: add a new connection to `https://kingdown.dev/mcp` and sign in again. Old tokens do not pass at the new resource, and the tool table and the board resource changed.
11. After one week with both connections: remove the old connection, the old OAuth client row and the `kingdown-plugin` project.

Before players outside the testers: the NCA registration, the owner facts and a lawyer's check of the seven drafts in `docs/safety/`, and the open decisions in ticket 10 (move times, blocks, the hold rule, the 1-day first turn).

## Merge Danger

**Door:** two-way for the merge, one-way for the release.

The merge changes no live system. The release is hard to undo: 0006 ends the old plugin games, 0005 removes the name and photo from other players' reads, 0008 makes a deletion a 7-day request, and the ChatGPT server address cannot change after OpenAI's review.

**Blast Radius:** plugin.

After the merge, the next `tools/deploy.sh --target plugin --publish` ships the new server. It answers 503 on every path until migrations 0005 to 0009 and role blocks 3 to 6 are in, so follow step 4. The website build and its deploy do not change. CI adds `build:vercel` and `check:vercel`.
