# 02 — Games core: schema, store, service, protocol

Type: task
Status: resolved
Wave: 1 · Model: Opus · Branch: `claude/mp-02`

## What to build

The shared game tables and the one write path that both surfaces use. Read part 03 of the report first: section 4.3 (protocol), 5.1 (schema), 5.2 (transactions), 5.7 (timeouts), 5.9 (storage), 8.8 (deletion).

1. **Migration `0005_accounts_v2.sql`** (extends 0001):
   - `profiles`: add `handle` (text, unique, check `^[a-z][a-z0-9_-]{1,18}[a-z0-9]$`), `handle_changed_at`, `icon` (preset key), `on_leaderboards` (true), `public_page` (false), `challenge_from` (`nobody|follows|signed-in|everyone`, default `signed-in`), `online_visible_to` (`everyone|mutual|nobody`, default `mutual`), `quiet_mode` (false), `accepting_games` (true). Column grants: signed-in players read only public columns of other profiles. The sign-up trigger stops copying the provider's full name and photo (no real-name default).
   - `reserved_handles (handle primary key, reason, user_id, created_at)`.
   - `account_deletions (user_id primary key, requested_at, run_after, cancelled_at, done_at)`.
2. **Migration `0006_games.sql`**: `games`, `game_players`, `game_commands`, `game_invites`, `relations`, `reports`, `mod_actions`, `notifications`, `notification_prefs`, `alert_state`, and `outbox (id bigserial, kind, payload jsonb, created_at, available_at, attempts, done_at)`. Columns as in section 5.1, phase-1 subset; keep clock columns (`clock_ms`, `increment_ms`, `clock` jsonb, `deadline_at`, `deadline_kind`) and `tournament_id` reserved. `game_players.user_id` and `game_commands.actor_id` are `on delete set null`; `unique (game_id, user_id)` blocks self-play. Record each seat's `power` (or `none`) and the game's `engine_fingerprint`, `readings`, `category`. Move the rows of `plugin_matches`, `plugin_match_commands`, `plugin_match_invites` into the new tables (or end them: they are private test games); point `plugin_boards` at `games`. All tables: RLS on, no browser grants except where a later ticket adds one.
3. **Test bootstrap** (`tools/plugin-db/bootstrap-test.mjs`): apply 0001 (with stand-ins for the Supabase `auth` schema it needs), then 0002–0006, each twice (repeatable).
4. **Protocol types** (`src/match/protocol.ts`): `Command { command_id, expected_revision, action }` with actions `turn {actions: lan[]}`, `computer`, `resign`, `abort`, `draw {offer|accept|decline}`, `claim {timeout}`, `say {preset}`; the reply and the error codes; the small per-seat `View` (`revision, seat, status, turn, legal, last_commands, opponent {handle, last_seen_ms}, result?, deadline_at, server_now`), under about 3 KB.
5. **Store and service** (`src/match/store.ts`, `src/match/service.ts`):
   - create: kind `solo|friend`, speed `daily|live` (live has no clock logic yet), `days_per_move` 1, 3 or 7 (default 3), colour `white|black|random`; record the setup, rules, powers per seat, fingerprint.
   - invites: one seat, a 43-character token and a short code (both stored hashed), 24 h for live and 14 days for Daily; redeem by token or code; `challenge_from` and blocks refuse a join.
   - commands: one transaction per command as in section 5.2: lock, dedupe on (game, seat, command_id), seat, engine turn, revision, status, lazy Daily deadline check; a `turn` with several actions applies all or nothing; `received_at`; update each seat's `action` state (`waiting|ready|done`) from the engine turn (Haste keeps the same side); on a passed turn in a Daily game insert a `notifications` row and an `outbox` row (`turn`).
   - finish transaction: idempotent `update ... where status in ('playing') returning`; casual only in this phase (no ratings); write `games.moves`; outbox `game_finished`.
   - resign, abort (before each side's first turn), draw offer/accept/decline, claim on a passed Daily deadline, `say` (each preset once per game), computer moves for solo games.
   - inbox: the actor's active games, your turn first, then the nearest deadline (partial index).
   - views: small, per seat; never the full save.
6. Keep the current plugin working: adapt `src/plugin/server.ts` and `src/plugin/app.ts` only as far as the tests need. Ticket 09 adds the new tools.

## Checks

- Database tests (in the style of `service.db.test.ts`): retry applies once; two-action turn is atomic; seat action states match the engine after each command, Haste included; self-play refused; invite race (two joiners, one seat); deadline sweep function ends a Daily game; deletion: `on delete set null` keeps the opponent's game.
- `npm test` and the three plugin browser checks pass.

## Comments

### 2026-10-10 — built on `claude/mp-02`

Progress:

- [x] 1. `0005_accounts_v2.sql`: the profile columns, the public-column grant, the sign-up trigger with no real-name default, `reserved_handles`, `account_deletions`.
- [x] 2. `0006_games.sql`: the eleven tables, RLS on, no browser grants. The clock columns and `tournament_id` stay reserved. `plugin_boards.match_id` points at `games`. Old plugin games are ended: their rows stay in `plugin_matches`, unused, and a board that showed one says "This game was deleted".
- [x] 3. `tools/plugin-db/bootstrap-test.mjs`: auth stand-ins, then 0001–0006, each twice.
- [x] 4. `src/match/protocol.ts`: the commands, the reply, the error codes, `View`, `InboxEntry`, `Invite`.
- [x] 5. `src/match/store.ts` and `src/match/service.ts`: `GameService`.
- [x] 6. The plugin works unchanged through a small adapter (`MatchService`, marked `ponytail:`; ticket 09 removes it).

Evidence:

- `npm test` on `kingdown_mp_02_test`: typecheck clean; 111 files, 1,842 passed, 8 skipped (the balance-drift tests); `node --test` 50 of 50. The new database file `src/match/service.db.test.ts` has 18 tests. They cover each check of this ticket: retry once and `COMMAND_CONFLICT`; a two-action Haste turn, all or nothing; the seat action states after each command, Haste included; self-play (service and `unique (game_id, user_id)`); two joiners for one seat; the sweep, a late command and a claim on a missed deadline; deletion keeps the opponent's game. They also cover: resign, abort, draw, say; one writer across connections and across processes; rollback of the command, the state and the alerts; the runtime role (and what it may not do); no browser grants; the handle check.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (plugin-ui-http ran against real HTTP MCP and PostgreSQL).
- Local reads on the loopback test database, 100 reads each after 6 turns: `view` with `since` 0.79 ms median, 1.23 ms p95, 727 bytes; a full `view` 0.40 ms median, 3,456 bytes (2.2 KB of it is `rules`); `inbox` 0.22 ms median.

### Interfaces (for tickets 06 to 09)

Import from `src/match/service.ts` (`GameService`, `MatchServiceError`) and `src/match/protocol.ts` (types and zod schemas). The caller gives a verified user ID; input is `unknown` and the service validates it. Errors are `MatchServiceError { code: ErrorCode, status, message }`.

`new GameService(new PostgresMatchStore(pool))`:

- `create(actor, { kind: 'solo'|'friend', speed?, days_per_move?: 1|3|7, colour?: 'white'|'black'|'random', setup? }) → View` with `rules`. A friend game is Daily with 3 days unless you say so; a solo game is live and cannot be Daily. The default colour is random.
- `invite(actor, gameId) → { token, code, expires_at }`. Only the waiting creator of a friend game can invite. A new invite ends the old one. The token is 43 characters (base64url); the code is 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. Both are stored as SHA-256 hashes. The invite lasts 24 h for live and 14 days for Daily.
- `join(actor, tokenOrCode) → View` with `rules`. The code accepts lower case, spaces and dashes. A block either way, or the host's `challenge_from` (`nobody`, or `follows` without a follow), gives `FORBIDDEN`. A retry by the same player returns the game.
- `command(actor, gameId, { command_id, expected_revision, action }, surface = 'web') → View`, with no `rules`. One transaction for each command. The actions are `turn {actions: lan[1..4]}`, `computer`, `resign`, `abort`, `draw {choice: offer|accept|decline}`, `claim {reason: 'timeout'}` and `say {preset}`. A retry with the same `command_id` and input returns the current view and writes nothing. If a Daily deadline has passed, any command other than a claim ends the game on time and gets `MATCH_TERMINAL`; a claim by the waiting side is the command that ends it.
- `view(actor, gameId, since?) → View`. Read-only. With `since`, it gives the commands after that revision (at most 50) and no `rules`. Without `since`, it gives the last 10 commands and `rules`.
- `inbox(actor) → InboxEntry[]`: the actor's active games (at most 100), your turn first, then the nearest deadline, then the newest.
- `sweep(now = new Date()) → number`: ends the Daily games whose deadline has passed and the waiting games whose invitation ran out (up to 100 of each for each call, so up to 200; call again while it returns more than 0, as `sweepDeadlines` does). It is safe to run twice at once. Ticket 06's `sweepDeadlines` calls it.

`View` (in `protocol.ts`): `game_id, revision, seat, kind, speed, days_per_move, status (waiting|playing|finished|aborted), turn, action (waiting|ready|done), fen, in_check, legal (your moves only, else []), last_commands [{seq, seat, action, at}], opponent {handle, computer, deleted, last_seen_ms} | null, draw_offer, result? {winner: 0|1|null, reason}, deadline_at, server_now, rules?`. The revision goes up by one for each change, joins and expired deadlines included. `last_seen_ms` comes only from the opponent's commands, and ticket 07 must apply `online_visible_to` before the website shows it.

Database rows for each change: one `game_commands` row (`seq` = the new revision; a join or an expiry has no `command_id`). `game_players.action` and `active` follow the engine turn; an ended game sets `active = false` and `ended_at`.

Alerts and outbox (all in the same transaction):

- A Daily friend game that passes the turn to a person (also at the join) writes a `notifications` row `kind 'turn'`, `payload {game_id, revision, deadline_at}`, and an `outbox` row `kind 'turn'`, `payload {user_id, game_id, revision, deadline_at}`. The deadline is 3 days for each side's first turn (`deadline_kind 'first_turn'`; a miss cancels the game as `no_start`), then `days_per_move` (`'move'`; a miss loses on time).
- Every end writes `outbox` `kind 'game_finished'`, `payload {game_id, result: 'white'|'black'|'draw'|null, reason}`. The reasons are the engine statuses, `resignation`, `agreement`, `timeout`, `abort` and `no_start`. Abort and no-start give `status 'aborted'` and a null result.
- Ticket 06 adds `reminder` and drains the outbox; no other kind exists yet.

Runtime role: the third block of `plugin-deploy/runtime-role.sql` gives the server role what the service needs and no more. The database tests check it.

### Open issues

- The 6-character code (about 887 million values) needs a rate limit on `join` (ticket 08).
- `challenge_from = 'nobody'` refuses every join, also a friend who has the host's own link. Decide if a host's own invite skips this setting.
- `delete_my_account()` (0001) still deletes at once; ticket 07 moves it to `account_deletions` with the 7-day grace.
- Old profiles keep the provider's name and photo that 0001 copied. Clear them in a later migration if the owner wants.
- The old tables `plugin_matches`, `plugin_match_commands` and `plugin_match_invites` stay, unused. A later migration drops them.
- The finish uses the game row lock and a status check under it, not `update ... where status = 'playing' returning`. The effect is the same: a second finish sees the ended status and writes nothing.
- The plugin's games through the adapter are live and untimed; ticket 09 gives the tools speed, days and colour.
- The owner must apply 0005, 0006 and the third runtime-role block to production. This branch did not touch production.
