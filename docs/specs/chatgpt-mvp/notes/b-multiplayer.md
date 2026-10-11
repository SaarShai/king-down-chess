# Note B: the branch `claude/multiplayer-foundation` and its research

Scope: what the unpushed branch builds, how complete each part is, which plugin-MVP features it covers, what it does not cover, the deploy steps, the merge risk, the 8 owner decisions, and a recommendation.

Sources read (read only):
- Worktree `.claude/worktrees/multiplayer-foundation`, HEAD `e71a8d2c` (clean tree).
- `git diff --stat main...claude/multiplayer-foundation`.
- Branch docs: `docs/specs/accounts-multiplayer/spec.md`, `issues/10-review.md`, `pr-body.md`, `supabase/README.md`.
- Branch code: migrations 0005–0009, `src/match/{service,store,protocol,worker}.ts`, `src/plugin/{server,service,app}.ts`, `src/api/http.ts`, `src/online/*.ts`, `src/account/profile.ts`, `supabase/ops/cron.sql`.
- Research: `docs/research/multiplayer-2026-10-10/README.md`, and parts 01 §3.2–3.5 and §6.2–6.6, and part 02 §"What King Down has today", §4.2, §4.5, §5.3, §5.4.

Note on reads: in zsh, `git show "$B:src/..."` breaks (`:s` acts as a modifier). Read files from the worktree path or use `git show "claude/multiplayer-foundation":path` with care.

---

## 1. Facts about the branch

| Item | Value |
|---|---|
| Branch | `claude/multiplayer-foundation` (local only; no remote branch on `origin`) |
| Worktree | `.claude/worktrees/multiplayer-foundation`, clean |
| Tip | `e71a8d2c` "Ticket 10: the final checks on a fresh database and the pull request body" (2026-10-10 14:11 -0700) |
| Merge base with main | `30211b3a` (2026-10-10 11:34 -0700) |
| Commits on the branch | 45 (`git log main..HEAD`), including 9 ticket merges (`claude/mp-02` … `claude/mp-09`) |
| Size | 95 files, +10,618 / −610 lines |
| New npm dependencies | None (uses `pg`, `jose`, `zod`, `node:` built-ins) |
| Deploy state | Nothing deployed. No change to live Supabase, DNS or Vercel |
| PR | Not opened. Body is ready in `docs/specs/accounts-multiplayer/pr-body.md` |
| Main since the base | `origin/main` has 169 changed files since `30211b3a`: PRs #41 (move legend), #42 (Proving Ground), #45, #46, #47 (threat marks), #48 (pg-design), #49 (open ends). Local `main` is 3 commits behind `origin/main` (#48 merged, #49 not yet pulled) |

Origin of the work: the owner asked on 2026-10-10 to "build the infrastructure and foundation for what you recommend in a branch". The build is phase 1 ("Friends and Daily") of the research report, server only, with no visual work.

---

## 2. What the branch builds (architecture)

One write path for both surfaces (`pr-body.md`):

```text
website  ── /api/*      (Supabase session JWT)       ─┐
ChatGPT  ── /mcp        (OAuth token, 16 tools)      ─┼─> GameService (src/match/service.ts)
pg_cron  ── /internal/* (X-Kingdown-Internal secret) ─┘     one transaction per command
                                                            └─> Postgres: games, game_players, game_commands, outbox, ...
```

One Vercel function (`tools/plugin-server.mjs`) serves `/api`, `/mcp`, `/authorize`, `/internal` (lines 57–64 route `/api` and `/internal`). `npm run build:vercel` makes a one-project tree; `tools/vercel-check.mjs` checks it.

---

## 3. Part by part: what exists and how complete it is

Legend: **T** = tested (unit or DB test), **W** = wired to a UI, **P** = pure module (no caller in production code).

### 3.1 Database: migrations 0005–0009 (T)

| File | Lines | What it adds |
|---|---|---|
| `supabase/migrations/0005_accounts_v2.sql` | 71 | `profiles` columns: `handle`, `handle_changed_at`, `icon`, `on_leaderboards`, `public_page`, `challenge_from` (`nobody/follows/signed-in/everyone`), `online_visible_to` (`everyone/mutual/nobody`), `quiet_mode`, `accepting_games`. Handle format `^[a-z][a-z0-9_-]{1,18}[a-z0-9]$`, unique index. Revokes `display_name`, `avatar_url` from `authenticated`; grants only `id, rating, handle, icon`. New-user trigger no longer copies the provider name or photo. Tables `reserved_handles`, `account_deletions` |
| `0006_games.sql` | 208 | `games` (kind `solo/friend`, speed `daily/live`, `days_per_move` 1/3/7, `clock_ms`/`increment_ms`/`clock` reserved, `rated` default false, `category`, `readings`, `colour_rule`, `engine_fingerprint`, `setup`, `rules`, `status` `waiting/playing/finished/aborted`, `result`, `end_reason`, `revision` 0–1000, `state` ≤ 8 MB, `deadline_at`/`deadline_kind`, `moves`, `tournament_id` reserved). `game_players` (seat, `user_id`, `computer`, `handle_at_start`, `power`, `action` `waiting/ready/done`, `turns_played`, `draw_offers`, `said[]`, `last_seen_at`, `last_surface` `web/chatgpt`, `active`, `ended_at`; unique `(game_id,user_id)` = no self-play). `game_commands` (log, receipt key `(game_id, seat, command_id)`). `game_invites` (SHA-256 of token and code). `relations` (follow/block). `reports` (7 categories, `intimate_image`, `hold_until`, `nca_reference`). `mod_actions` (warning, rename, hide, timeout, rated_ban, board_removal, suspension, closure; appeals). `notifications`, `notification_prefs`, `alert_state`, `outbox`. RLS on, browser roles get nothing. Re-points `plugin_boards.match_id` FK to `games` (old plugin boards show "This game was deleted") |
| `0007_jobs.sql` | 41 | Schema `kingdown_jobs`: `user_email(uid)`, `delete_account(uid)` (checks grace, report hold on reporter or reported, no active game; reserves the handle; deletes solo games; deletes `auth.users` row) |
| `0008_accounts_safety.sql` | 79 | Trigger `reserve_handle` (old handles reserved, advisory locks on both handles); `kingdown_jobs.request_deletion` (7-day grace, dates from DB clock); `delete_my_account()` now asks for a deletion; trigger on `auth.sessions` cancels a deletion at sign-in; `reports.content`, `mod_actions.handle` |
| `0009_invite_tries.sql` | 16 | `invite_code_tries`: 10 short-code tries an hour per player |
| `supabase/ops/cron.sql` | 44 | Not a migration. pg_cron + pg_net: `/internal/tick` every minute, `/internal/outbox` every 10 s, `/internal/reminders` every 10 min, `/internal/daily` 03:17, history cleanup 03:47 |
| `plugin-deploy/runtime-role.sql` | 88 | Grant blocks 3–6 for the server role |

Evidence: `npm run plugin:db:init-test` applies 0001–0009 twice ("every migration is repeatable"); `tools/plugin-db/migrations.db.test.ts` checks 0001 and 0004 after 0005–0009. `supabase/check-migration.mjs` (pglite) did NOT run.

### 3.2 Game service `src/match/service.ts` (248 lines) (T; W only through the plugin board)

- `GameService.create` (line 89): solo or friend; speed defaults `daily` for friend, `live` for solo; `days_per_move` default 3; colour `white/black/random` (default random). The `setup` comes from the caller and is fixed for the whole game. `category` string `"<speed>[-Nd]/<powers|no-powers>/no-cards"` (line 104). `readings: 'POWERS_BALANCED'` when kings have powers.
- `view(actor, game, since?)`: read only; small `View` (about 3 KB; 633 B for an unchanged poll).
- `inbox(actor)`: active games only, your turn first, then the nearest deadline (`store.ts:101`, `where me.active`, limit 100).
- `command(...)` (line 124): one transaction; dedupe by `command_id`; `expected_revision`; engine work before the lock; actions `turn` (1–4 LAN, all or nothing), `computer`, `resign`, `abort` (only before each side's first turn), `draw` (`offer/accept/decline`, max 3 offers), `claim` (timeout), `say` (preset, once each per game).
- Daily deadlines: first turn 3 days for each side (`FIRST_TURN_DAYS`, line 10), miss = `no_start` (cancel); later turns `days_per_move`, miss = loss on time.
- `invite` (line 164): one invite per game; 43-char token + 6-char code (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`); 14 days (Daily) or 1 day (live). The Daily value is replaced by 7 days (owner, 2026-10-11); the earlier value stays here as history.
- `join` (line 180): token or code; code tries counted; block check through `mayJoin` (`challenge_from` and blocks).
- `sweep` (line 207): ends due Daily games and waiting games with an expired invite; one bad game does not stop the rest.
- The last revision (1000) stays free for a resign, abort, claim or the sweep.
- Live games: speed `live` exists but has **no clock**. A live friend game has no deadline at all.

Protocol `src/match/protocol.ts`: `PRESETS = ['hello','good_luck','good_game','well_played','thanks']`; `ErrorCode` list; `View`, `InboxEntry`, `Opponent { handle, computer, deleted, last_seen_ms }`, `Invite`.

### 3.3 ChatGPT tools `src/plugin/server.ts` (118 lines) (T; partly W)

16 tools. Board data (`View`) goes only in `_meta.view`; the model sees a short summary. Only `kingdown_open` carries the board resource.

| # | Tool | Visibility | Hints | What it does |
|---|---|---|---|---|
| 1 | `kingdown_open` | model, app | not idempotent | Open a game, or "next" (most urgent), or a new solo game |
| 2 | `kingdown_create` | model, app | not idempotent | `mode` solo/friend, `speed`, `days_per_move`, `colour`, `board_id`. **No setup input**: always `DEFAULT_SETUP` |
| 3 | `kingdown_resume` | app | — | Most urgent game on this board |
| 4 | `kingdown_games` | model | read only | Active games list; opponent shown only as computer / player / deleted player / none yet |
| 5 | `kingdown_get` | app | read only | Reload; `since_revision`; runs on a read-only connection |
| 6 | `kingdown_move` | app | — | One LAN action |
| 7 | `kingdown_computer` | app | — | The computer plays |
| 8 | `kingdown_say` | app | — | One preset |
| 9 | `kingdown_draw` | model, app | destructive | offer / accept / decline |
| 10 | `kingdown_claim` | app | destructive | Claim a missed Daily deadline |
| 11 | `kingdown_resign` | model, app | destructive | Resign |
| 12 | `kingdown_abort` | model, app | destructive | Abort before each side's first turn |
| 13 | `kingdown_invite` | model, app | not idempotent | Link `https://<origin>/j/<token>` and code |
| 14 | `kingdown_join` | model, app | — | Link, token or code |
| 15 | `kingdown_report` | model, app | not idempotent | target player/handle/message, 7 categories, `intimate_image`, preset, note ≤ 1000 |
| 16 | `kingdown_profile` | model | read only, `openai/profile` | Account ID and handle |

Important fixed value: `src/plugin/server.ts:12`
`const DEFAULT_SETUP = { backRank: 'RAGQKMSO', kings: 'Flame:Haste,Frost:Freeze' } as const;`
Every ChatGPT game uses this one back rank and these two kings (Flame/Haste for White, Frost/Freeze for Black). The same constant is on main (`src/plugin/server.ts:8`).

Board UI `src/plugin/app.ts` (127 lines): the old minimal plugin board, ported to the new `View` (server legal list, `_meta.view`, link + code text). It has **no** controls for say, draw, claim, resign, abort, report, Next game. No adaptive poll, no `setOpenInAppUrl`, no presence.

### 3.4 Website API `src/api/http.ts` (166 lines) (T; NOT wired to any website UI)

Routes (lines 70–93), Supabase session JWT checked with JWKS only:

- `POST /api/games` (friend game comes with its invite), `GET /api/games/:id[?since=]`, `POST /api/games/:id/commands`, `POST /api/games/:id/invite`, `POST /api/invites/redeem`
- `GET /api/me/games`, `GET|PATCH /api/me/profile`, `POST /api/me/handle`, `POST|DELETE /api/me/deletion`, `GET|PUT /api/me/notifications`
- `GET|POST|DELETE /api/relations`, `POST /api/reports`

Internal (lines 135–147), secret ≥ 32 chars in `X-Kingdown-Internal`: `/internal/tick` (sweep), `/internal/outbox` (mail drain), `/internal/reminders` (80% reminder), `/internal/daily` (cleanup + deletions).

`src/online/client.ts` (128 lines): browser client with retries, `merge()`, `watch()` (poll 2 s live, 30 s Daily). Only tests import it. No website page calls `/api`.

### 3.5 Accounts, handles, privacy `src/online/accounts.ts` + `src/account/profile.ts` (T; no UI)

- `AccountService.profile`, `setHandle` (first pick and first change free, then one change in 90 days; `HANDLE_TAKEN`), `updateSettings`, `relate`/`unrelate`/`relations` (follow, block; a block ends follows both ways; a block is not secret), deletion request/cancel, notification prefs.
- `profile.ts`: `ICONS` (17 presets: kings flame, frost, mud, shadow, spirit, stratus; pieces archer, beast, bishop, guard, knight, maester, ogre, paladin, pawn, queen, rook), `CHALLENGE_FROM`, `ONLINE_VISIBLE_TO`, `NOTIFY_DEFAULTS` (turn, reminder, game_finished), `REPORT_CATEGORIES` (computer_help, rating_manipulation, leaving_or_stalling, offensive_handle, harassment, child_safety_or_illegal, other), `RENAME_DAYS = 90`, `handleProblem()` (format, a short blocked-word list, title prefixes, leet map).

### 3.6 Safety and moderation `src/online/safety.ts` + `tools/mod.ts` (T; owner CLI only)

- `SafetyService.report` (stores the reported handle or preset as evidence; refuses control and bidi characters), `queue` (child safety first, intimate image first), `show`, `act` (warning, rename, hide, suspension; statement of reasons), `appeal`, `hold`.
- `npm run mod` (`tools/mod.ts`, 38 lines): owner CLI over the queue.
- `docs/safety/`: 7 UK drafts (terms, safety and reporting, contact, illegal content risk assessment, children's access assessment, children's risk assessment, record of measures). Drafts only; they need owner facts and a lawyer.

### 3.7 Jobs and mail `src/online/jobs.ts`, `src/online/mail.ts` (T; needs deploy + cron)

`sweepDeadlines`, `queueReminders` (80% of turn time, once), `drainOutbox` (`for update skip locked`; one turn email, then none until the player returns), `runDeletions` (7-day grace, report hold), `cleanup`. Mail: `resendSender` (Resend over `fetch`, `RESEND_API_KEY`, `KINGDOWN_MAIL_FROM`), `fakeSender` for tests. Email only; no Web Push. Moderation and appeal notices send no email.

### 3.8 Ratings: Glicko-2 `src/online/glicko2.ts` (74 lines) (P, T)

`GLICKO2 = { rating 1500, rd 350, volatility 0.06, tau 0.75, minRd 45, maxRd 350, maxVolatility 0.1, ... }`, `provisional(rd)` (RD ≥ 110), `update()`, `rateGame(white, black, whiteScore, {idle, colour})`. 9 tests (Glickman's example). **No caller.** No `player_ratings` or `rating_history` table. `profiles.rating` (0001, default 1200) stays unwritten. `games.rated` is always false.

### 3.9 Deadlines `src/online/deadline.ts` (78 lines) (mostly P, T)

`nextDeadline`, `passTurn`; Daily and Live (clock, increment, first action 45 s, away 30 s × speed factor, ChatGPT min 60 s). 14 tests. Only the reminder job calls it. Live clocks are not in the service. Kind names differ from the DB (`first-turn` vs `first_turn`).

### 3.10 Engine archive (T)

`engines/` holds one bundle and one fixture save per engine fingerprint (`sha256:2675a7e6…`). The build stamps `__KINGDOWN_ENGINE__` into the compiled worker (`src/match/worker.ts`). `tools/engines-check.mjs` checks that each engine in use has its bundle. A game from before an engine change keeps its old engine.

### 3.11 Test evidence (from ticket 10, not run by this explorer)

At `b4eda638` on a fresh DB: typecheck clean; vitest 124 files, 1,955 passed, 8 skipped; `node --test` 50/50; `npm run build`, `plugin:build`, `plugin:server:check` (resource 4,327,175 JSON bytes, ceiling 4.4 MB), `plugin:smoke`, `plugin:check:protocol`, `check:browser plugin-ui plugin-ui-http plugin-oauth`, `build:vercel` + `check:vercel`, `test:docs` (110) all pass. 19 review findings fixed, each with a failing-first test.

Not run: ChatGPT on desktop, iPhone, Android; 50-game load test; live 2-minute deadline with cron; `supabase/check-migration.mjs`.

---

## 4. Coverage of the plugin MVP features

| MVP feature | Branch status | Detail |
|---|---|---|
| Play against the computer | **Yes (server + old board)** | `kingdown_create mode=solo`, `kingdown_computer`. Fixed setup only |
| Friend invite | **Yes (server, tools, API); minimal UI** | `kingdown_invite` / `kingdown_join`, link + 6-char code, block and challenge rules, 10 code tries/hour. No `/j/<token>` web page (the link 404s until built) |
| Random matchmaking ("find an opponent") | **No** | Phase 3 in the report. No `seeks` table, no pairing, no wait screen, no computer fallback after 25 s |
| Initiator is White by default | **Partly** | API default colour is `random` (`protocol.ts` `createSchema`). The plugin board's Solo button asks for White. MVP needs default `white` for the initiator |
| Initiator sets toggles (fairy pieces, piece pool, arrangement, classic, cards, king powers) | **No** | `kingdown_create` has no setup input. `createSchema.setup` accepts `backRank`, `fen`, `preset`, `kings` but no piece pool, no arrangement mode, no cards. The setup is fixed at create |
| Joiner picks own king, power and arrangement | **No** | `join()` takes a seat in a game whose setup is already fixed. No setup phase, no per-seat choice, no hidden simultaneous pick |
| Cards (4 random, same for both) | **No** | `category` is always `.../no-cards`. The match worker refuses private card data (`src/match/index.ts:57`: "Private card data unsupported") |
| King powers off → Spirit (White) / Shadow (Black) art | **No** | Fixed kings `Flame:Haste,Frost:Freeze` in `DEFAULT_SETUP`. Engine knows `KingName = 'Frost'|'Flame'|'Stratus'|'Mud'|'Spirit'|'Shadow'` (`src/rules/rules.ts:82` on main) |
| Games list ("scroll") | **Partly** | `inbox()` = active games only. No history query for finished games; data exists (`game_players_history` index on `(user_id, ended_at desc)`, `games.result`, `end_reason`) but no method or route reads it |
| Results | **Partly** | Each game stores `result` and `end_reason`; no list, no totals, no W/L/D counts |
| Score / rating | **Pure module only** | Glicko-2 exists, unused. No rating tables, no update at game end |
| Achievements / badges | **No** | Phase 4 in the report. Outbox has a slot "for achievements" (comment in 0006), nothing else. Trick seals stay on device (`src/trick-store.ts`) |
| Profile | **Partly (server)** | Handle, icon, privacy, notification prefs, deletion; API routes; no UI. `kingdown_profile` returns ID + handle only |
| Handles | **Yes (server)** | Rules, reservation, rename limit, block list, DB trigger. No handle screen; no ChatGPT tool sets a handle (only `/api/me/handle`) |
| Unlocks (all unlocked) | n/a | Branch does not touch unlocks. "All unlocked" needs nothing from it |
| Settings: icon-only graphic mode | n/a | Pure client setting; branch has nothing |
| Preset messages | **Server yes; board no** | `kingdown_say` app-only; board has no control |
| Report | **Yes (server, tool, API, CLI)** | No board control; the model can call it |
| Resign / draw / abort | **Server + model** | Board has no buttons |
| Turn alerts | **Server yes; needs Resend + cron + domain** | Email only |
| Account deletion with grace | **Yes (server)** | Website text still says "at once" |

---

## 5. What the branch does NOT cover (gaps)

1. Matchmaking (seeks, pairing under a lock, wait UI, computer fallback, "Either").
2. Live clocks, presence, disconnect rules (phase 2). Live friend games run with no time limit.
3. Game setup choice: piece pool / fairy toggle / per-piece include-exclude, arrangement by players, classic mode, cards, king and power choice by each side, a setup step after the join.
4. Cards in online games (server refuses hidden hands).
5. Ratings in use, leaderboards, rating tables.
6. Achievements, crowns from online games, profile stats (W/L/D, games played).
7. Finished-games history query and route.
8. All visual work: website online mode, `/j/<token>` and `/g/<id>` pages, handle screen, email-code sign-in, consent page on the website session; ChatGPT board controls (say, draw, claim, resign, abort, report, Next game), adaptive polling, `setOpenInAppUrl`, slow-connection message, end card with Rematch.
9. Rematch (no command, no "repeat setup with colours swapped").
10. Guests (anonymous sign-in).
11. Web Push.
12. Rate limits other than the code tries (wait for the Vercel firewall).
13. A publish path for the one-project tree in `tools/deploy.sh` (owner step 8).
14. Export RPC for account data.
15. Session revocation: a signed-out or banned token works up to 1 hour (JWKS check only).

---

## 6. Owner steps before any deploy (from `pr-body.md`)

Before the first release:
1. Change the website text that says deletion is at once (`src/account/account.ts`, the dialog in `index.html`, `public/delete-data.html`, `public/privacy.html`) to the 7-day grace. Visual change: needs a yes on a sample.
2. Check that Supabase signs sessions with an asymmetric key (ES256/RS256). With the legacy shared secret, every `/api` call gets 401.
3. Check that Supabase allows a trigger on `auth.sessions`. If not, all of 0008 rolls back.

The release (`supabase/README.md`, "Release order (a short outage)"):
4. `tools/deploy.sh --target plugin`, then `tools/deploy.sh --target plugin --publish` with `DEPLOY_LIVE_TIMEOUT_MS=900000`. While the live check waits, apply 0005–0009 (`npm run plugin:db:migrate` with a privileged connection, or the SQL editor), then blocks 3–6 of `plugin-deploy/runtime-role.sql`. The new server answers 503 until then. Old plugin games end.
5. Optional: `KINGDOWN_ENGINES_DATABASE_URL` (read access) so each release checks engines in use.

Move to one project at `kingdown.dev` (ticket 03):
6. New Supabase OAuth client mapped to `https://kingdown.dev/mcp` (`kingdown_oauth.client_resources`); add `https://kingdown.dev/authorize` to redirect URLs; remove the `/authorize` redirect from `vercel.json`.
7. Vercel project `kingdown` env: `KINGDOWN_PLUGIN_ORIGIN=https://kingdown.dev`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`, `KINGDOWN_PLUGIN_DATABASE_URL` (runtime role), `KINGDOWN_INTERNAL_SECRET` (≥ 32 chars), `RESEND_API_KEY`, `KINGDOWN_MAIL_FROM`; then `KINGDOWN_PLUGIN_OAUTH_READY=1` after the audience-hook check. Resend needs `kingdown.dev` verified (DNS: owner's go).
8. Add a publish path to `tools/deploy.sh` for the `npm run build:vercel` tree (`vercel deploy --prebuilt --prod` to `kingdown`); on the first preview check that `/api/x` and `/internal/x` reach the function with the original path.
9. After `https://kingdown.dev/internal/*` is live: turn on pg_cron and pg_net, store the secret in Vault as `kingdown_internal_secret`, apply `supabase/ops/cron.sql`; check `cron.job` and `net._http_response`.
10. ChatGPT: add a new connection to `https://kingdown.dev/mcp` and sign in again (old tokens fail at the new resource; tool table and resource changed).
11. After one week with both connections: remove the old connection, the old OAuth client row and the `kingdown-plugin` project.

Before players outside the testers: NCA registration, owner facts and a lawyer's check of the 7 drafts in `docs/safety/`, and the open decisions in ticket 10.

One-way doors at release: 0006 ends old plugin games; 0005 hides name and photo from other players; 0008 makes deletion a 7-day request; the ChatGPT server address cannot change after OpenAI's review.

---

## 7. Merge risk against current main

Checked with `git diff --name-only` from the base `30211b3a` to `origin/main` (169 files) and to the branch (95 files), and with `git merge-tree --write-tree origin/main claude/multiplayer-foundation`.

| Check | Result |
|---|---|
| Textual conflicts | **None.** `merge-tree` gives a clean tree (`6a3473b8…`) |
| Files changed on both sides | **One:** `src/match/worker.ts`. Main (#48/#49, Proving Ground 16–17) adds `hashTree('../workshop/')` to the dev fingerprint. Branch replaces `__KINGDOWN_COMPILED__` with `__KINGDOWN_ENGINE__`. The auto-merge keeps both (checked in the merged tree) |
| Engine change on main | Main changed `src/rules/engine.ts` (+81/−?), `rules.ts`, `setup.ts`, new `src/rules/design.ts`, `src/ai/*`, `src/game.ts`, and the engine now imports `src/workshop/` (design rule `RULES.design`). So the compiled engine fingerprint changes. The next `plugin:build` must add a new bundle + fixture under `engines/` and commit it. `tools/engines.test.ts` and `check:vercel` expect "1 archived engine" in their messages now; verify after merge |
| Plugin resource size | Branch measured 4,327,175 bytes against a 4.4 MB ceiling (about 73 KB left). Main's engine grew (design rule + workshop modules pulled by `rules.ts`). **Risk:** the board resource may pass the ceiling after the merge. Run `npm run plugin:server:check` first |
| Semantic overlap with Proving Ground | Main's Proving Ground plays "a design in a game" (#48). `MatchSetup` on the branch has no design field; online games cannot carry a designed piece. Not a break, a gap |
| Test count | Main added tests; the branch's "1,955 passed" number will change. Run the full PR "How to check" list on the merged tree |
| CI | Branch adds `build:vercel` + `check:vercel` to `.github/workflows/plugin-checks.yml` |
| Deploy blast | After the merge, the next `tools/deploy.sh --target plugin --publish` ships the new server; it answers 503 until 0005–0009 and role blocks 3–6 are in. Anyone who deploys the plugin from main after the merge must follow step 4. The website deploy does not change |

Overall: **low textual risk, medium build risk** (new engine bundle, resource size), **high release risk** (one-way schema steps, the plugin outage window, the address move).

---

## 8. The 8 owner decisions (research README, "Decisions for the owner") and current picks

The owner has not answered them one by one. The build records the picks as "the agent's picks, built at the owner's request" (spec, "Owner direction").

| # | Decision | Current pick (agent's) | Built on the branch? |
|---|---|---|---|
| 1 | Architecture | P1: Supabase Postgres as the one authority, one Node service on Vercel for both surfaces; Realtime pings on web, read-only polling in ChatGPT; Supabase Pro with spend cap, alert at about 4 M Realtime messages/month; move ChatGPT server to `kingdown.dev/mcp` and consent to `kingdown.dev/authorize` now; no spectators | Yes (server, one-project tree). No Realtime trigger. Move not done (owner steps 6–11) |
| 2 | Release order | 4 phases: Friends and Daily; Live; Open play and ratings; Awards and public launch. Daily default for friend invites (1/3/7 days, 3 default); Resend email + web push; no vacation | Phase 1 server only. Email only |
| 3 | UK/EU safety | Yes, with a lawyer: 4 UK records, NCA registration, terms, safety page, contact page; one Report flow with statements, appeals, intimate-image path (48 h take-down); presets only; minimum age 13 in the terms, no age asked; no EU targeting until a lawyer settles the DSA | Drafts + Report flow + queue + hold + CLI. Not registered, not reviewed |
| 4 | ChatGPT path | Invitees play in the browser until the public listing; submit at end of phase 1; live in ChatGPT only with both boards open, 15+10 or slower, 2 s delay credit; presence tool every 25 s | Join tools exist; no browser join page |
| 5 | Online rules | Time per turn (Haste = one turn); website Daily turn staged with End turn, ChatGPT sends each action; first rematch repeats back rank and kings with colours swapped; away 25 s web / 60 s ChatGPT; claim after 30 s × speed factor (≥ 60 s ChatGPT); 45 s first-move timer; abort until each side's first turn; both gone = draw | Turn-not-action and abort rule built. Deviation: first turn 3 days and miss = `no_start` even at 1 day/move (open). Rematch, clocks, away not built |
| 6 | Ratings | Glicko-2, one category for live + Daily; "?" while RD ≥ 110; band names (proposed Pike, Steed, Cross, Rock, Thorn, Monarch; owner chooses); board gate 20 rated games, a game in 30 days, account ≥ 7 days; computer games unrated; Daily finish rate public after 10 | Pure module only |
| 7 | Rated ruleset | Full random pool (Paladin included), no powers at launch, random colours; friend games casual by default (rated only if both agree, ≤ 3/day per pair); every game records each seat's power | Schema records `power` per seat, `readings`, `colour_rule`, `category`. No rated play |
| 8 | Accounts, guests, profiles, crowns | Guests only on web via invite to live casual friend game (Turnstile, 30-day cleanup); unique handle + preset icon, no provider name/photo, public page opt-in; crowns from computer wins (Casual+) and finished online games (≤ 3/day); Paladin last unlock (e.g. 14 crowns); no XP/levels/streaks | Handles, icons, privacy, deletion built. Guests and crowns not built |

Other open picks in ticket 10 (agent's picks, owner may change):
- Move times stay visible to the opponent (security-4).
- A block is not secret (security-7).
- Report hold covers the reported player and the reporter.
- Old `display_name`/`avatar_url` values stay in live `profiles` (unread); clear them if wanted.
- A solo game with no colour gets a random seat (open: default White?).
- 1-day games: first turn 3 days vs loss after 1 day.

Conflicts with the plugin MVP plan:
- MVP: initiator is White by default. Branch: random by default (decision 7 pick: creator chooses in casual friend games; random in rated).
- MVP: joiner picks own king and power. Research decision 7 / phase 5: "both players take a power through a hidden pick", which it calls a rules change. MVP needs a per-seat setup step that the branch does not have.
- MVP: random matchmaking now. Research: phase 3, together with ratings.
- MVP: achievements now. Research: phase 4.
- MVP: cards in online games. Research: card mode phase 5; server refuses hidden hands.

---

## 9. Research points the MVP can reuse (short)

- Play sheet (01 §3.2): three rows: Play the computer; Play a friend (Daily default, Live one tap away); Find an opponent (Live 10+5, Daily 3 days, Either; open-challenge list). No 11-tile grid.
- The wait (01 §3.4): wait on the board ("Looking for an opponent · 0:23", Cancel); after 25 s offer "Play the computer while you wait", keep the seek open; "Opponent found: @x. Switch now?" (about 20 s); confirm a late match after 2 min; widen the rating window, any opponent after about 60 s; seek lives only with a heartbeat; never pair blocked players; show "N players online" only when N ≥ 10.
- Daily vs Live: Daily = days per move (1/3/7, default 3), email at turn and at 80%; Live = clocks (phase 2). In ChatGPT: Daily first; live only with both boards open, 15+10 or slower.
- ChatGPT flows (01 §6.2): inline card with Play a friend / Play the computer; `kingdown_games` carousel; fullscreen board (not PiP); end card with Rematch and Review; presets via `kingdown_say`; Report on the opponent card; Open in App to `kingdown.dev/g/<id>`.
- Hidden info (01 §6.6): position, legal moves, opponent handle only in `_meta`; the model gets "Your move, move 14". The branch already does this.
- Adaptive poll (01 §6.5): live opponent's turn 2 s; live your turn 15 s; Daily 30 s; waiting 5 s for 2 min then 15 s; hidden: no polling.
- Profile v1 (02 §4.2): handle, preset icon, rating card, crowns, showcase (≤ 6 achievements), recent games (last 20), record with each king and power. No flag, age, real name, photo, bio.
- ChatGPT score card (02 §4.5): handle, rating or "?", band, crowns, finish rate; ≤ 2 actions; no sales or ads; reviewers need a demo account with sample data.
- Achievements (02 §5.3): 28 proposals, e.g. 1 Pull Up a Chair, 2 First Crown, 3 Ten Tables, 7–12 the six trick seals from `src/tricks.ts` (Bite Chain, Shot Over a Piece, Shove a Guard, Far Swap, A King Takes a Guard, A Second Life), 16 The Six Kings, 17 Twelve Powers, 20 Well Met, 22 Patient Hand, 23 Again!, 26 Established, 27 Upset, 28 Card Sharp. Fixed list, so not user content under UK law.
- Safety (decision 3, 01 §8.2): unique handles, preset icons, fixed preset messages with no free text, number or link; one Report flow.

---

## 10. Risks to note

1. **Fixed setup.** The whole stack assumes the setup is fixed at create. The MVP's per-seat king, power and arrangement need a new game state (`setup` phase between join and play) and new commands. This touches `games.status` (check constraint), `GameService.join`, `turnTo`, `View`, and the engine `createMatch`.
2. **Random default colour** vs the MVP's "initiator is White".
3. **Resource size** near the 4.4 MB ceiling; the MVP UI (toggles, sub-menus, art) will grow the board resource further.
4. **Release is one-way** and has an outage window; old plugin games end.
5. **Address move** to `kingdown.dev/mcp` must happen before OpenAI review; the address cannot change after.
6. **Supabase prerequisites** (asymmetric JWT keys; trigger on `auth.sessions`) are unchecked. Failure means 401 on every `/api` call, or 0008 rolls back.
7. **Live speed with no clock**: a live friend game can stall forever (no deadline, no sweep).
8. **Safety law**: drafts are not reviewed; NCA not registered. Opening play to strangers (matchmaking) raises the safety bar more than friend invites.
9. **Unpushed branch**: one local copy only. It is lost if the worktree or the local repo is lost.

---

## 11. Recommendation

**Build the plugin MVP on top of this branch.** It is the only tested, reviewed server for play between people, and it already gives the MVP's hardest parts: one write path, retries that apply once, invites with link and code, safety tables, handles, deletion with grace, engine archive, and the 16-tool ChatGPT surface that hides the position from the model. Starting again would repeat about 10,000 lines of tested work.

Do it in this order:
1. Push the branch to `origin` now (backup), then merge `origin/main` into it (clean textual merge). Run the PR's "How to check" list. Commit the new engine bundle. Check the resource size.
2. Keep the release steps (section 6) separate from the MVP build. Merging the branch to main is safe; the plugin deploy after it is not, until the owner steps are done.

Take:
- Migrations 0005–0009, `runtime-role.sql`, `cron.sql`.
- `GameService` (commands, invites, join, sweep, inbox), `protocol.ts`, `store.ts`.
- The ChatGPT tool table pattern (`_meta.view`, hints, read-only `kingdown_get`, only `kingdown_open` carries the board).
- Accounts, handles, privacy, reports, moderation CLI, deletion jobs, Resend mail.
- Glicko-2 module (for the MVP "score", wire it into the finish transaction with a `player_ratings` table, or show simple W/L/D first).
- Engine archive.

Change or add for the MVP:
- `kingdown_create`: accept the toggles (fairy pieces, piece pool include/exclude, arrangement, classic, cards, king powers) and store them in `games.setup`; default colour White for the initiator.
- A setup phase after the join: each seat picks king + power and arranges pieces (when the toggles allow); then the engine starts. New status (e.g. `setup`) in 0006's check, new commands, deadline for the setup step.
- Defaults Spirit (White) and Shadow (Black) instead of `Flame:Haste,Frost:Freeze` (`src/plugin/server.ts:12`).
- Cards: a public 4-card draw shared by both sides needs a server path; the worker today refuses hidden hands. Decide if the MVP's cards are public (simpler) before the build.
- Matchmaking: a `seeks` table with pairing under a lock, a wait UI, the 25 s computer fallback (research 01 §3.4). Without ratings, pair first-come.
- Games history: add `GameService.history()` (finished games by `ended_at desc`, the index exists) for the "scroll", with results and totals.
- Achievements: a small fixed list (research 02 §5.3) written from the `game_finished` outbox event.
- A real board UI with controls for resign, draw, abort, presets, report, Next game, invite share; adaptive polling.
- Live games: either hide `speed=live` for friends in the MVP or add clocks; do not ship live with no time limit.

Leave (for later):
- `src/online/client.ts` and the website `/api` routes, unless the MVP also ships a website online mode (they cost nothing to keep).
- `deadline.ts` live parts (clocks, away) until live play is in scope.
- Leaderboards, bands, seasons, guests, Web Push, rated play rules.
