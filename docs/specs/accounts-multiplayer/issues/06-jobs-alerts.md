# 06 — Jobs and alerts

Type: task
Status: ready-for-agent
Wave: 2 (after 02) · Model: Opus · Branch: `claude/mp-06`

## What to build

Read part 03 of the report: sections 5.3 (jobs), 5.8 (notifications), 4.4 (the Daily flow).

1. `src/online/jobs.ts`, each job idempotent and safe to run twice at once:
   - `sweepDeadlines(now)`: ends Daily games past `deadline_at` through the service's finish transaction (loss on time; the 3-day first-turn cancel); expires invites.
   - `queueReminders(now)`: an outbox `reminder` at 80% of the turn time, after both sides have moved, once per turn.
   - `drainOutbox(sender, now)`: takes a batch with `for update skip locked`, and for `turn` and `reminder` events applies the alert rules: no alert if the recipient used that game in the last 60 s; one turn email, then no more until the player returns (`alert_state`); respects `notification_prefs` and `quiet_mode`. Marks rows done; retries failed rows later with a cap.
   - `runDeletions(now)`: account deletions whose 7-day grace has ended; skips users with data under a report hold (`reports.hold_until`).
   - `cleanup(now)`: expired invites, done outbox rows older than 30 days.
2. `src/online/mail.ts`: a Resend sender over `fetch` (no SDK), with the key and the sender address from the environment; plain text plus minimal HTML; a link to `kingdown.dev/g/<id>`. A fake sender for tests.
3. `supabase/ops/cron.sql`: pg_cron + pg_net schedules that POST to `/internal/tick` (every minute), `/internal/outbox` (every 10 s if the project supports sub-minute jobs, else every minute), `/internal/reminders` (every 10 minutes), `/internal/daily` (deletions and cleanup, once a day), with the secret header from Supabase Vault. Not a migration; the owner applies it.

Ticket 08 wires the `/internal/*` endpoints to these functions.

## Checks

- Database tests with a fake clock and the fake sender: a missed deadline ends the game; the turn email goes once until the player returns; the 80% reminder goes once; no alert while the recipient is active; two drains at once send each message once; a deletion keeps the opponent's game; a held report blocks the deletion until the hold ends.
- `npm test` passes.

## Comments
