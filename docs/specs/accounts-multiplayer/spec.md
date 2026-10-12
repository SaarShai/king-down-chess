# Accounts and multiplayer

Status: foundation build done on `claude/multiplayer-foundation` (tickets 02–10 resolved; every check passes); waits for the pull request ([pr-body.md](pr-body.md)) and the owner's review. Nothing is deployed.

## Purpose

Give King Down one player account and online play against other people, on the website (kingdown.dev) and in the ChatGPT plugin. Play can be live or asynchronous (Daily: days per move).

## Owner direction

- 2026-10-10: research request; the report is in [docs/research/multiplayer-2026-10-10/](../../research/multiplayer-2026-10-10/README.md) ([ticket 01](issues/01-deep-research.md)).
- 2026-10-10: "build the infrastructure and foundation for what you recommend in a branch." The owner also named the helper models; this file does not record model names.

The build follows the report's eight picks (README, "Decisions for the owner"). The owner has not answered each decision one by one; this build records them as **the agent's picks, built at the owner's request**, and the owner can still change any of them. Online-play rules (decision 5) are server settings, not game rules: they change no piece, power or card.

## Scope of this build

The server foundation of the report's phase 1 (part 03, section 9), plus two pure modules for phases 2 and 3. No visual work, no deploy, no change to the live Supabase project or DNS.

| # | Ticket | Wave |
|---|---|---|
| 02 | [Games core: schema, store, service, protocol](issues/02-games-core.md) | 1 |
| 03 | [Engine archive and one Vercel project](issues/03-engine-archive-one-project.md) | 1 |
| 04 | [Pure modules: Glicko-2 and deadlines](issues/04-pure-modules.md) | 1 |
| 05 | [Safety documents: drafts](issues/05-safety-drafts.md) | 1 |
| 06 | [Jobs and alerts](issues/06-jobs-alerts.md) | 2 |
| 07 | [Accounts and safety service](issues/07-accounts-safety-service.md) | 2 |
| 08 | [Website API and client](issues/08-website-api.md) | 3 |
| 09 | [ChatGPT tools](issues/09-chatgpt-tools.md) | 3 |
| 10 | [Review and integration](issues/10-review.md) | 4 |

Each wave starts from the branch after the previous wave merges. Each ticket works in its own worktree and branch (`claude/mp-<NN>`), and a merge step brings it into `claude/multiplayer-foundation` after `npm test` passes.

## Simplifications against the report

- **Outbox:** a plain `outbox` table drained with `for update skip locked`, not pgmq. It runs on every Postgres, including the local test database. Move to pgmq only if the table becomes a bottleneck.
- **Schedules:** `supabase/ops/cron.sql` holds the pg_cron and pg_net schedules that call `/internal/*`. The owner applies it on Supabase; it is not a migration, because the local test database has no pg_cron or pg_net.
- **Handles:** `text` with a check constraint (lowercase only), not `citext`.
- **Later, by phase:** the Realtime trigger, presence, clocks in the service, warm workers, guests and Web Push (phase 2); seeks, rating tables and leaderboards (phase 3); achievements (phase 4); rate limits through the Vercel firewall (at the first deploy).

## Shared rules for every ticket

- Test database: a separate disposable database for each ticket, `postgresql://kingdown_test@127.0.0.1:55432/kingdown_mp_<NN>_test` (loopback, name ends `_test`). Make it with a short Node `pg` script (`create database ...`); the tool gate refuses `psql`. Run `npm run plugin:db:init-test` with `PLUGIN_TEST_DATABASE_URL` set to it, then `npm test` (never bare vitest; never pipe the output).
- The game service (`src/match/service.ts`) stays the only write path for game rows. Actor IDs come from verified identity, never from input.
- No new npm dependency without a reason in the ticket. Prefer `node:` built-ins, `pg`, `jose` and `zod`, which are already installed.
- Commits end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. No model names in commits, code or docs. Stage files by name.
- Do not edit `TASKS.md`, `LESSONS.md`, `docs/QUEUE.md` or `docs/HOSTING.md` on the branch. Record progress, evidence and notes for those files in the ticket.

## Checks for the whole build

The checks of part 03, phase 1, that need no deploy and no visual work:

- A retried command with the same `command_id` applies once; a Daily turn with two actions applies as one command, and nothing changes if the second action fails.
- After each command, every seat's `action` state matches the engine's turn, Haste included.
- `kingdown_get` writes nothing; an unchanged view read is fast (measure locally).
- A missed Daily deadline ends the game through the sweep; the turn email and the 80% reminder go to the outbox and the mail adapter (with a fake sender in tests); a second turn email waits until the player returns.
- When a player deletes the account and the 7-day grace ends, the opponent keeps the game with "Deleted player"; a sign-in during the grace cancels the deletion; data under a report hold stays until the hold ends.
- A game started before an engine change keeps accepting moves after it (archived engine).
- A report from the website API and one from ChatGPT reach the owner queue.
- A website player and a ChatGPT player finish a Daily game against one database (an HTTP test with two local identities).
- `npm test`, the plugin browser checks and `npm run build` pass.
