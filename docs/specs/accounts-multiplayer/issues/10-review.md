# 10 — Review and integration

Type: task
Status: ready-for-agent
Wave: 4 · Model: Opus

## What to do

1. Independent reviews of the whole branch against `main`: correctness (transactions, races, Haste turns, deadlines), security (auth boundaries, the internal secret, grants and RLS, data the model sees), and the spec (each ticket's checks).
2. Fix confirmed findings in the branch.
3. Run every check of the spec on the integrated branch and record the results here.
4. Write the pull request body (what, why, how to check, what the owner must do before a deploy: Supabase migrations 0005 and 0006, `supabase/ops/cron.sql`, the Resend key, the internal secret, the OAuth resource move to `kingdown.dev/mcp`).

## Comments

### 2026-10-10 — wave 1 merge (tickets 02 to 05)

The merge step merged `claude/mp-02`, `claude/mp-03`, `claude/mp-04` and `claude/mp-05` in this order with `git merge --no-ff`. No merge had a conflict, and no fix commit was necessary.

Evidence (test database `kingdown_mp_merge1_test`, made with `tools/plugin-db/make-test-db.mjs`):

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0006); every migration is repeatable".
- `npm test`: typecheck clean; vitest 115 files passed, 1,908 tests passed, 8 skipped; `node --test` 50 of 50; exit 0.
- `npm run build`: exit 0.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed.
- Ticket 03's checks on the merged code: `npm run plugin:build`, then `npm run plugin:server:check` (compiled HTTP and PostgreSQL on the ticket 02 tables) passed; `npm run plugin:smoke` passed; `npm run build:vercel`, then `npm run check:vercel` passed.
- The engine stays `2675a7e6…`: the builds added no new bundle to `engines/`, because ticket 02 does not change the worker's code.
- `tools/engines-check.mjs` on the test database reads the ticket 02 `games` table: "every engine in use (1) has its bundle", exit 0. Its ended statuses (`finished`, `aborted`, `annulled`) cover the `games.status` values of 0006; `annulled` has no use yet.

Open issues for this review (not merge breaks; no code calls `src/online/deadline.ts` yet):

- Deadline kind names differ. 0006 and the service use `first_turn`; `nextDeadline` (ticket 04) uses `first-turn` and `first-action`. Ticket 06 must map them.
- First-turn rule with 1 day per move. The service (ticket 02) gives each first turn 3 days, and a miss cancels the game (`no_start`). `nextDeadline` gives the earlier of the two, so a 1-day game loses on time after 1 day. With 3 or 7 days the two agree. Ticket 04 leaves this choice open for the owner; ticket 06 must use one rule.
