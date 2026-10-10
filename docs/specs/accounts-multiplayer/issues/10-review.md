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

### 2026-10-10 — wave 2 merge (tickets 06 and 07)

The merge step merged `claude/mp-06`, then `claude/mp-07`, with `git merge --no-ff`. The merge of 06 had no conflict; its tree is the same as the tree of `claude/mp-06`. The merge of 07 had six conflicts. The merge commit resolves them, and both tickets' intent stays:

- [x] Migration number: both tickets added a `0007_*.sql`. `0007_jobs.sql` (ticket 06) keeps its number. Ticket 07's file is now `0008_accounts_safety.sql` ("Run after 0007"). The lists in `tools/plugin-db/bootstrap-test.mjs` and `tools/plugin-db/migrate.ts`, `supabase/README.md` and the comments in `src/account/client.ts` and `src/online/accounts.ts` name 0008.
- [x] `plugin-deploy/runtime-role.sql`: the jobs block (ticket 06) stays the fourth block, after 0007. The account and safety block (ticket 07) is the fifth block, after 0008. Each block drops and makes one `for all` policy for each of its tables, so each table has one policy.
- [x] `src/match/store.ts`: `privacy()` (ticket 07) and the new `due()` with the invitations that ran out (ticket 06).
- [x] `src/match/service.db.test.ts`: the runtime-role refusal list keeps each statement that the role still may not do after both blocks. Two statements of ticket 06 are now allowed by ticket 07's grants (`update public.profiles set handle=handle`, `select * from public.account_deletions`), so they went; ticket 07 had changed the same two.
- [x] `supabase/README.md`: 0007 and 0008 each have an item; the role blocks are the third, fourth and fifth.

No fix commit was necessary.

Evidence (test database `kingdown_mp_merge2_test`, made with `node tools/plugin-db/make-test-db.mjs kingdown_mp_merge2_test`):

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0008); every migration is repeatable".
- `npm test`: typecheck clean; vitest 119 files passed, 1,929 tests passed, 8 skipped; `node --test` 50 of 50; exit 0. That is wave 1 (115 files, 1,908 tests) plus ticket 06 (2 files, 9 tests) and ticket 07 (2 files, 12 tests). The jobs tests ran on their own copy (`kingdown_mp_merge2_jobs_test`) with 0001–0008 and all five role blocks.
- `npm run build`: exit 0.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed.

Open issues for this review (the merge leaves them as the tickets made them):

- Two rules for a report hold. `runDeletions` (ticket 06) and `kingdown_jobs.delete_account` skip a player who is the reported player or the reporter of a held report. `AccountService.dueDeletions` (ticket 07) skips only the reported player. The job uses ticket 06's rule; only ticket 07's test calls `dueDeletions`. Decide the rule (ticket 07, open issue 10), then remove one of the two queries.
- The handle of a deleted account is reserved twice: `kingdown_jobs.delete_account` inserts it, and the `profiles` delete trigger of 0008 inserts it again (`on conflict do nothing`). It does no harm; one of the two can go.
- Ticket 07, open issue 4, stays open: a `moderation` or `appeal` notification makes no outbox row, so no email goes.
- Ticket 06's open issue on "views write nothing" counting the whole database is closed: ticket 07 changed that test to count only its own games.
- Item 4 of "What to do" names migrations 0005 and 0006. The owner must now apply 0005 to 0008, then the third, fourth and fifth blocks of `plugin-deploy/runtime-role.sql`.
