# 02 — Games core: schema, store, service, protocol

Type: task
Status: ready-for-agent
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
