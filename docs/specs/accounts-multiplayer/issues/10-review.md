# 10 — Review and integration

Type: task
Status: resolved
Wave: 4

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

### 2026-10-10 — wave 3 merge (tickets 08 and 09)

The merge step merged `claude/mp-08`, then `claude/mp-09`, with `git merge --no-ff`. The merge of 08 had no conflict; its tree is the same as the tree of `claude/mp-08`. The merge of 09 had one conflict. One fix commit follows the merges. Both tickets' intent stays:

- [x] `tools/plugin-server.mjs` (the conflict, resolved in the merge commit): ticket 09 removes the `MatchService` adapter, and ticket 08 took the game service for `/api` and `/internal` from it. One store now serves a `GameService` (the website API and the jobs) and a `PluginService` (MCP).
- [x] `tools/vercel-check.mjs` (fix commit): ticket 08's cross-surface game used the old MCP shapes. It now uses ticket 09's shapes (`game_id`, `command_id`, `expected_revision`, the view in `_meta.view`). `kingdown_join` gets the website's full link. This closes ticket 08's open issue on this check and ticket 09's open issue on the cross-surface test.
- [x] A random-seat flake (fix commit). The first `npm test` on the merge failed one test: `kingdown_move ... expected string, received undefined at lan` in the board-selection test of `src/plugin/server.db.test.ts`. A solo `kingdown_create` with no colour gives a random seat, and Black has no legal move before the computer plays. The same code on `claude/mp-09` fails in about half of its runs, so the merge did not cause it. The test and the same call in `tools/plugin-ui-check.mjs` now ask for White, as the board's Solo button does.
- [x] Ticket 09's open issue "`kingdown_join` has no rate limit against short-code guesses" is closed: ticket 08's code limit is in `GameService.join`, which `PluginService.join` calls.

Evidence (test database `kingdown_mp_merge3_test`, made with `node tools/plugin-db/make-test-db.mjs kingdown_mp_merge3_test`):

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0009); every migration is repeatable".
- `npm test` before the fix commit: 122 files passed, 1 failed (the flake above); 1,948 tests passed, 1 failed, 8 skipped.
- `npm test` after the fix commit: typecheck clean; vitest 123 files passed, 1,949 tests passed, 8 skipped; `node --test` 50 of 50; exit 0. That is wave 2 (119 files, 1,929 tests) plus ticket 08 (3 files, 17 tests) and ticket 09 (1 new file; 4 new tests, 1 test removed with `MatchService`).
- `npm run build`: exit 0.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (16.3 s, 15.5 s, 2.9 s).
- More checks on the merged code: `npm run plugin:check:protocol` passed (16 tools with their hints); `npm run plugin:build`, then `npm run plugin:server:check` passed (resource 4,327,175 JSON bytes); `npm run plugin:smoke` passed; `npm run build:vercel`, then `npm run check:vercel` passed: "One-project tree: static site, /mcp (open, move), /authorize, /consent.mjs, /api (session tokens only; Daily games between two website players and between a website and a ChatGPT player, with a retry), /internal (secret only) and 1 archived engine(s) passed". The builds add no engine to `engines/`.

Open issues for this review (the merge leaves them as the tickets made them):

- A solo game that the model makes with no colour gets a random seat. With Black, the board shows no move until the player asks the computer to play. Decide if a solo game with no colour starts as White.
- The other open issues of tickets 08 and 09 stay open, for example the owner's steps before a deploy (migration 0009, the sixth block of `runtime-role.sql`, `KINGDOWN_INTERNAL_SECRET`, an asymmetric session key), the `/j/<token>` and `/g/<id>` pages, and a refresh of the ChatGPT connection after a release.
- Item 4 of "What to do": the owner must now apply 0005 to 0009, then the third to sixth blocks of `plugin-deploy/runtime-role.sql`.

### 2026-10-10 — review fixes

Three reviews (correctness, security, spec) gave 19 confirmed findings. This step fixes them on `claude/multiplayer-foundation`, from `d052212a`, in 15 commits. Each code fix has a test that fails on the old code: the step put the old file (`git show HEAD:<file>`) or the old database state in place, ran the test and saw it fail, then put the fix back.

- [x] Item 1: the three reviews (the workflow ran them before this step).
- [x] Item 2: the confirmed findings are fixed, or recorded below as a decision with a reason.
- [x] Item 3: every check runs on the integrated branch (evidence below).
- [ ] Item 4: the pull request body. The PR step writes it. It must now give the release order of `supabase/README.md` ("Release order (a short outage)"): migrations 0005–0009 and blocks 3–6 of `plugin-deploy/runtime-role.sql` go in while the live check of the new server waits.

Findings and fixes:

- [x] correctness-1, security-3, spec-3 (a game at revision 1000 cannot end; one stuck game stops the sweep). `6506e8a3`: a move, a draw or a say needs a free revision after it, so the last revision stays for a resignation, an abort, a claim or the sweep. The sweep catches the error of each game, logs it and ends the other games. Tests: `service.db.test.ts` "keeps the last revision for the end of a game" and `jobs.db.test.ts` "ends the other due games when one game cannot end". Old code: the move at revision 999 passed (the test wanted `MATCH_LIMIT`), and the sweep threw.
- [x] correctness-2, security-1 (one failed player stops every deletion and the cleanup). `0ab4e0ad`: `runDeletions` gives each ended game a new command ID and catches the error of each player; `/internal/daily` runs the cleanup first. Test: `jobs.db.test.ts` "runs the other deletions when one fails". Old code: `COMMAND_CONFLICT` for the player's own `account-deletion` command ID.
- [x] correctness-3 (another player takes a handle while its owner leaves it). `c11db335`: the 0008 trigger locks the old handle and the new handle, in a fixed order. Test: a race in `accounts.db.test.ts` that waits on `pg_stat_activity` for the lock. Old trigger: player B got the old handle.
- [x] correctness-4, correctness-5 (0001 again removes the newer rules; 0004 breaks `npm run plugin:db:migrate`). `56d13948`: 0001 skips its account functions and grants when `profiles.handle` exists; 0004 changes the board key only when it does not point at `games`. New test file `tools/plugin-db/migrations.db.test.ts` runs `migrate.ts` on a database with a board on an online game, then 0001. Old files: 0004 gave error 23503, and 0001 removed the `handle` and `icon` grants and the deletion grace.
- [x] security-2 (any signed-in user reads the name and photo). `56ffaec0`: 0005 revokes `display_name` and `avatar_url` from `authenticated`; players read `id`, `rating`, `handle` and `icon`. Old file: the grant list held both columns.
- [x] security-5 (the runtime role can shorten the deletion grace). `f5232edd`: the role may update only `cancelled_at`; `kingdown_jobs.request_deletion(uuid)` writes the dates from `now()`. Old grants: the insert with a short `run_after` passed.
- [x] security-6 (report notes send control characters to the terminal). `f34e560c`: report text refuses C0, C1 and bidi controls (a line break stays); `tools/mod.ts` escapes them in text that is already stored. Old code: a note with U+009B passed, and the CLI printed it raw.
- [x] spec-1 (no release order; the start check passes on every schema). `59f4e806`: `checkPluginDatabase` reads each table, column and function of 0005–0009 as the runtime role, checks the block 5 grant and checks that the board key points at `games`. `supabase/README.md` gives the release order. Test: a role with blocks 1–2 only is refused; a role with all blocks passes. Old check: the old role passed.
- [x] spec-2 (the draw, say and claim tools cannot be used). `4df35127`: the model summary has `draw_offer` and the text says when the other side offers a draw; the model can call `kingdown_draw`. Old code: the summary had no `draw_offer`.
- [x] spec-4 (the claim test races with the sweeps). `8937fe28`: `server.db.test.ts` uses its own database copy (`tools/plugin-db/own-test-db.ts`, which the jobs and API tests now use too). The race is a gap of a few milliseconds, so no test shows it on demand.
- [x] spec-5 (`dueDeletions`, unused, with a second hold rule). `2e6a2fcc`: removed. The job's rule stays: a held report holds the reported player and the reporter.
- [x] spec-6 (docs disagree with the code). `1a78c2d8`: `docs/plugin-preparation.md` (`/api` and `/internal` are live), `src/online/deadline.ts` (only the reminder job calls it), ticket 02 (the sweep ends up to 100 Daily games and 100 waiting games each call; `sweepDeadlines` calls it again while it ends more than 0) and `supabase/README.md` (0005 replaces the name and photo; 0008 replaces the immediate deletion).
- [x] spec-7 (model names in the spec and the tickets). `a04ed9a5`: the spec table has no Model column, the owner quote keeps only the build request, and the ticket headers name no model. `tools/lib/model-names.mjs` finds no model name in the 94 changed files or the commit messages of the branch.
- [x] security-4 (the setting and a block do not hide the move times). Decision, not a code change, because the reviewer showed that a shared game cannot hide them (`deadline_at` and a polling opponent give the same time). `4631f2a8`: the safety page says "Your opponent in a game always sees when you made each move in that game", and the `Opponent` comment in `src/match/protocol.ts` says so.
- [x] security-7 (a follow refusal shows a block). Decision, not a code change: a block is not secret, as on most game sites. A silent 204 does not hide it, because the block also removes the blocked player's follow from their own list. `b5ec3084` puts the reason in the comment on `relate()`.

Evidence (test database `kingdown_mp_fix_test`, made fresh with `node tools/plugin-db/make-test-db.mjs kingdown_mp_fix_test`; the own copies `_api`, `_chatgpt`, `_jobs` and `_migrations` were made fresh too):

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0009); every migration is repeatable".
- `npm test` before the fixes (`d052212a`): typecheck clean; vitest 123 files passed, 1,949 tests passed, 8 skipped; exit 0.
- `npm test` after the fixes (`a04ed9a5`): typecheck clean; vitest 124 files passed, 1,955 tests passed, 8 skipped (96 s); `node --test` 50 of 50; exit 0.
- `npm run build`: exit 0.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (16.3 s, 15.4 s, 2.6 s).
- `npm run plugin:check:protocol`: passed. `npm run plugin:build`, then `npm run plugin:server:check`: passed (resource 4,327,175 JSON bytes). `npm run plugin:smoke`: passed. `npm run build:vercel`, then `npm run check:vercel`: passed. The builds add no engine to `engines/`.

Open issues and owner decisions:

- security-4 and security-7 above are the agent's picks. The owner can change them: to hide move times, round or remove the opponent's `at` and the inbox `updated_at`; to hide blocks, keep the blocked player's follow and answer 204.
- Old `display_name` and `avatar_url` values stay in `profiles` on the live project. No role reads them now. Clear them (an update to null) if the owner wants them gone.
- The hold rule is the job's rule: a held report holds the reported player and the reporter (spec-5). Ticket 07, open issue 10, can close with it.
- `kingdown_say` and `kingdown_claim` stay app-only, and the board has no controls for them yet. The sweep ends a missed deadline within a minute, so a ChatGPT player does not need the claim. The board build adds both controls. `kingdown_games` (the inbox) does not show a draw offer; the game view does.
- `supabase/check-migration.mjs` did not run: it needs pglite, and this worktree may not install packages. `migrations.db.test.ts` and `npm run plugin:db:init-test` run every migration twice on real Postgres instead.
- The sweep and the deletion job take at most 100 games and 50 players for each call. A game or a player that fails each time stays first in the list, so 100 such games (or 50 such players) would hold back the rest. The log names each one (`ponytail:` comments in `src/match/service.ts` and `src/online/jobs.ts`).
