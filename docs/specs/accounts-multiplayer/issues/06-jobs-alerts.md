# 06 — Jobs and alerts

Type: task
Status: resolved
Wave: 2 (after 02) · Branch: `claude/mp-06`

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

### 2026-10-10 — built on `claude/mp-06`

Progress:

- [x] 1. `src/online/jobs.ts`: `sweepDeadlines`, `queueReminders`, `drainOutbox`, `runDeletions` and `cleanup`. Each job is idempotent and safe to run twice at once.
- [x] 2. `src/online/mail.ts`: `resendSender` (Resend's HTTP API over `fetch`, `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` from the environment, an idempotency key for each outbox row), `alertMail` (plain text and minimal HTML, a link to `https://kingdown.dev/g/<id>`) and `fakeSender`.
- [x] 3. `supabase/ops/cron.sql`: pg_cron and pg_net schedules for `/internal/tick` (each minute), `/internal/outbox` (each 10 seconds, only while a row is due), `/internal/reminders` (each 10 minutes) and `/internal/daily` (03:17 UTC), with the `X-Kingdown-Internal` header from Vault (`kingdown_internal_secret`). It also deletes pg_cron's run history after 7 days.
- [x] Changes that the jobs need:
  - Migration `0007_jobs.sql`: two `security definer` helpers in the private schema `kingdown_jobs`. `user_email(uid)` gives the address for an alert email. `delete_account(uid)` checks again under a row lock (deletion due, not cancelled, not done; no report hold; no active game), reserves the handle, deletes the solo games and the auth user, and sets `done_at`. Its checks use the database clock.
  - `plugin-deploy/runtime-role.sql`, fourth block: the grants for the jobs. The role cannot read or delete `auth.users` itself.
  - `GameService.sweep` and `PostgresMatchStore.due` also end a waiting game whose invitation ran out (status `aborted`, reason `no_start`).
  - `tools/plugin-db/bootstrap-test.mjs` and `tools/plugin-db/migrate.ts` apply 0007; `supabase/README.md` describes 0007 and `ops/cron.sql`.
  - `src/match/service.db.test.ts`: the refusal list of the runtime role follows the new grants (the role now reads `outbox` and `profiles.quiet_mode`).


Evidence (test database `kingdown_mp_06_test`, made with `tools/plugin-db/make-test-db.mjs`):

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0007); every migration is repeatable".
- `npm test`: typecheck clean; vitest 117 files passed, 1,917 tests passed, 8 skipped; `node --test` 50 of 50; exit 0. Wave 1 had 115 files and 1,908 tests; this ticket adds `src/online/jobs.db.test.ts` (7 tests) and `src/online/mail.test.ts` (2 tests).
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (plugin-ui-http against real HTTP MCP and PostgreSQL). A first run failed plugin-ui-http only because this ticket file changed during the run; the second run, with no edit, passed.
- The database tests use a fake clock (`vi.useFakeTimers({ toFake: ['Date'] })`, so the service and the jobs read the same time) and the fake sender. They cover each check of this ticket:
  - a missed deadline ends the game (and two sweeps at once write one `expire` row and one `game_finished` row); an invitation that ran out ends its waiting game; the cleanup deletes the old invitation and the outbox rows done more than 30 days ago;
  - no alert while the recipient used the game in the last 60 s;
  - one turn email, then none for the second game, then one more after the player comes back;
  - the 80% reminder: none in a first turn, none at 79%, one at 81% with two runs at once, and an out-of-date reminder sends nothing;
  - two drains at once send each message once, also two rows of one player (one turn email); a failed send, or a bad row, tries again after 2, 4, 8 and 16 minutes and is closed after 5 tries, and the rows after it still go;
  - a deletion resigns the active game (the opponent wins and sees "Deleted player"), aborts the waiting game, deletes the solo game, reserves the handle and runs once with two runs at once; a report hold blocks it until the hold ends; a cancelled or early request stays; `delete_account` refuses each of these cases itself;
  - every job runs with the runtime role of `plugin-deploy/runtime-role.sql`, which cannot read emails, delete accounts, close a deletion, set `returned_at`, read report notes or change an outbox payload.
- Mutation check (each through `npm test` on the jobs test file): eight changes each fail at least one test. They are: no advisory lock for the reminders, no `alert_state` row lock, no out-of-date check, no hold check in `delete_account`, no 60 s rule, no one-email rule, no end of a waiting game whose invitation ran out, and no savepoint for a bad row. The first try of the row-lock change passed; the test now makes the first email to the player slow and gives the player an `alert_state` row already, so the second drain reads that row while the first one sends.
- `supabase/ops/cron.sql` on a throwaway loopback database with stand-ins for `cron.schedule`, `net.http_post` and `vault.decrypted_secrets`: it applies twice; the five jobs are `kingdown-tick` (`* * * * *`), `kingdown-outbox` (`10 seconds`), `kingdown-reminders` (`*/10 * * * *`), `kingdown-daily` (`17 3 * * *`) and `kingdown-cron-history` (`47 3 * * *`); each command runs; the calls go to `https://kingdown.dev/internal/{tick,reminders,daily}` with `x-kingdown-internal` and a 25 s timeout; `/internal/outbox` goes only when a row is due. The real pg_cron, pg_net and Vault are not checked.

### Interfaces (for ticket 08)

`games = new GameService(new PostgresMatchStore(pool))` on the runtime role. Call each job with no `now`:

- `POST /internal/tick` → `sweepDeadlines(games)` (the number of games it ended).
- `POST /internal/outbox` → `drainOutbox(games, resendSender())` (the number of emails sent; at most 50 rows each call). `resendSender()` throws when `RESEND_API_KEY` or `KINGDOWN_MAIL_FROM` is missing: answer 503 then.
- `POST /internal/reminders` → `queueReminders(games)`.
- `POST /internal/daily` → `runDeletions(games)`, then `cleanup(games)`.
- The emails link to `https://kingdown.dev/g/<id>`; the website must open that path.
- `notification_prefs.kind` is the outbox kind: `turn` or `reminder`. No row means email on. `push` has no use yet.
- To count a visit as "came back" without a command, set `alert_state.returned_at` (this needs `update (returned_at)` for the runtime role). A view stays read-only.

### Choices

- One deadline rule. The sweep reads `games.deadline_at`, which the service sets, so the first turn gets 3 days and a miss cancels the game (`no_start`), also with 1 day per move. `nextDeadline` (ticket 04) decides only the reminder, which starts after both sides have played; there the two modules agree. This closes the two deadline issues of ticket 10 for this ticket: no kind name needs a map. If the owner picks a loss on time after 1 day, change `turnTo` in the service.
- "Expires invites": the sweep ends a waiting game whose invitation ran out (status `aborted`, reason `no_start`) through the service, and the cleanup then deletes the invitation. A waiting game with no invitation stays until its creator aborts it.
- Quiet mode stops all alert emails; the notification rows (the in-site inbox) stay.
- "Came back" is a command in any game after the last turn email, or `alert_state.returned_at`.
- A report hold covers the reported player and the reporter.
- `runDeletions(games)` has no `now`: the grace and the hold use the database clock, because they are a trust boundary. The tests set the row times instead.
- A deletion ends the active games first (resign; abort for a waiting game), so the opponent gets a result at once. Supabase removes the OAuth grants with the auth user; the local stand-in cannot check this.
- The email names the opponent and the time left, not the move: a move in LAN is not readable for most players. Add the move when the board has a short move name.
- Web Push is phase 2. `game_finished` rows are closed with no action until achievements or game-over alerts exist.
- The jobs tests use their own database (`<test database>_jobs_test`), because a job acts on every game: a sweep in the shared database ends the games of `service.db.test.ts`, which runs at the same time.

### Open issues

- Migration number: ticket 07 may also add a `0007_*.sql`. The merge step renumbers one, with the lists in `bootstrap-test.mjs`, `migrate.ts` and `supabase/README.md`.
- `runtime-role.sql`, fourth block: it makes `for all` policies named `kingdown_plugin_runtime` on `notification_prefs`, `alert_state`, `account_deletions` and `reports`. If ticket 07 adds policies of the same name there, keep one `for all` policy for each table; the grants decide what the role may do.
- `service.db.test.ts` ("keeps views small and read-only") counts rows of the whole database. A database test file that writes games at the same time (ticket 08's HTTP tests) can break it. Count only that test's games, or give the new file its own database as this ticket does.
- The 60 s rule sees only commands (`game_players.last_seen_at`). A player who only watches the board still gets the email. Presence (phase 2) can fix this.
- A sign-in that cancels a deletion while the job runs keeps the account, but the games that the job ended stay ended.
- For the owner, before alerts go live (none done on this branch): a Resend account and key; the sending domain `kingdown.dev` verified in Resend (DNS records: they need the owner's go); `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` in the server environment; the internal secret in the server environment and in Vault as `kingdown_internal_secret`; migration 0007 and the fourth block of `runtime-role.sql`; then `supabase/ops/cron.sql` after the deploy that serves `/internal/*` at `https://kingdown.dev`. Resend Free sends 100 emails a day.
- After the first apply of `cron.sql`, check `cron.job` and `net._http_response` on Supabase.
- Ticket 04's 1-day first-turn choice is still open for the owner; the jobs follow the service.

### 2026-10-10 — merge note

The merge step merged this branch into `claude/multiplayer-foundation`. Ticket 07's migration is now `0008_accounts_safety.sql`, so `0007_jobs.sql` keeps its number, and ticket 07's role block is the fifth block. Each table keeps one `kingdown_plugin_runtime` policy. This closes the first two open issues above. Evidence: ticket 10, "wave 2 merge".
