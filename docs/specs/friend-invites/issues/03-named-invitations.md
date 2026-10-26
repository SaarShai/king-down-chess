# Add named invitation state and service paths

Status: resolved
Type: task
Blocked by: none; migration run is approved with the spec
Spec: [Online friend invitations](../README.md)

## Scope

Own `0022_friend_invites.sql`, invitation state in `src/match/protocol.ts`, `src/match/store.ts` and `src/match/service.ts`. Add atomic friend create-and-invite, recipient checks, decline and cancel. Update web API and account deletion paths. Ticket 04 follows this ticket in the same files. Do not release either ticket alone.

## Acceptance checks

- The recipient is a user ID. Only that recipient accepts a named invitation.
- Create and invite commit together. A refused write leaves no waiting game. Same-command retries create no second game.
- Decline, cancellation, use and expiry have the state rules in the spec. Permission checks use the correct direction.
- Rotation keeps recipient and original expiry. Old links stop working. Reads do not rotate.
- Old open links work until their original expiry. A deleted recipient never makes an open link.
- The migration is reviewed. A local database fixture passes before any requested staging run.

## Tests to add

- Add service and real database cases for send, wrong recipient, retry, decline/accept race, cancel/accept race and expiry equality.
- Add migration fixtures for accepted users whose account is deleted, unused old invites and duplicate detection.
- Add block, challenge setting, rename and deletion cases. Add web API schema and privacy cases.

## Plan and checks

1. Add local migration fixtures and invitation tests. Record the failing cases.
2. Add state, atomic send, recipient checks and transport contracts for ticket 03.
3. Add shared account locks, counts and budgets for ticket 04.
4. Run real connection races, the full suite, doc checks and account/online browser checks.
5. Fetch and merge the source branch. Record checks and commits here.

Pass criteria: all acceptance checks above pass. Race tests use separate PostgreSQL connections.
Only the local disposable cluster receives the migration. No remote database or deploy runs.

## Answer

All six acceptance checks pass. Ticket 04 is part of the same server release.

- The service stores the recipient user ID. Wrong recipients receive the same unavailable notice with no private fields.
- Game creation and the invitation use one transaction. A refused send leaves no game. Same-command retries return the first game.
- Decline, cancellation and acceptance commit one terminal state. Expiry uses database time after the locks. No sweep is required to free a slot.
- Rotation keeps the recipient and exact database expiry, including microseconds. It changes the hash ID. Old codes stop. Reads keep the current ID.
- Old open links remain valid until their first expiry. Actual deletion removes sent and received invitations and ends their waiting games.
- The migration review checks the cascade, backfill, duplicate guard, constraints, indexes, runtime grants and row security. Local fixtures pass.

The files are `supabase/migrations/0022_friend_invites.sql`, `src/match/{protocol,store,service,invite-notices}.ts`, `src/api/http.ts`, `src/online/accounts.ts` and `src/plugin/{service,server}.ts`. Local bootstrap and runtime grants include the new columns. This ticket adds no product screen.

## Tests and evidence

`src/match/friend-invites.db.test.ts` passes all 34 cases. These names cover the state checks:

- `creates the game and named invitation in one write and returns the same receipt`
- `hides private details from a wrong recipient with a token or ID`
- `keeps the recipient and expiry on rotation; reads keep the identity`
- `checks recipient settings, follows and blocks in the correct direction`
- `keeps the user ID after a rename and returns current handles`
- `ends received waiting games and removes invites at actual deletion`
- `pages invitation rows independently and returns no raw tokens`
- `uses database expiry at equality and frees the slot before a sweep`
- `backfills deleted accepted users and unused old invites; rejects duplicates`
- `gives cancellation the list revision and refuses a stale accepted row`

The migration fixture covers an accepted row with deleted `used_by`, unused waiting and terminal rows, duplicate detection and row security. It runs migration `0022` twice.
The expiry equality case uses one real SQL statement for the timestamp and comparison. The rotation case checks the stored timestamp to one microsecond.
Ticket 04 lists the eight invitation race cases and the HTTP/MCP budget race. They use separate database connections.

Red checks catch atomic input, limits, terminal state, the rotation read race, stale cancellation, old receipts and cursor precision. The exact-expiry check has 1 failure and 33 passes before `bab99388`; all 34 pass after it. The full tool privacy guard catches the revision field before `de76f357`; the focused check then passes 49 cases.

## Server contract for the screen tickets

- `POST /api/games` takes `recipient_id`, `recipient_handle`, or `open_link: true`. Use one intent. Keep `command_id` on retry.
- The first send returns `view` and `invite`. A retry returns the same game and stored invitation identity. It returns no new raw code.
- `POST /api/games/:id/invite` takes the same recipient fields and `rotate`. Rotation keeps the recipient and original expiry. An old client cannot clear a named recipient.
- `GET /api/friends` takes `handle`, `after` and `limit` (1 to 50). It returns `friends` and `next_after`. A result has source `recent`, `follow` or `lookup`.
- `GET /api/me/games?invitations=1` returns `games`, `invitations` and `next_before`. Use `before` and `limit` to page invitations apart from the 100-game list.
- Invitation rows carry direction, a non-redeemable ID, game ID, game revision, recipient ID, current handle/icon, options, expiry and effective state. They contain no raw code or token.
- Cancel uses the outgoing row's game revision with the existing abort command. Keep that revision; do not replace it with a new read. A stale accepted row cannot abort the game.
- Preview and redeem accept `token`, `code`, or `invite_id`. An ID requires the named recipient. `POST /api/invites/:id/decline` returns the current invitation row.
- The tools use the same service. Add `kingdown_friends` and `kingdown_decline_invite`. `kingdown_games` takes invitation cursors. Full rows and friend results go in host metadata. The model list omits player details and game revisions.
- HTTP limit errors carry safe `count` and `handle` fields. Tool errors carry them in `_meta`. Both hosts use `src/match/invite-notices.ts`.

## Final checks

The database URL for these checks is `postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test`.

- `PLUGIN_TEST_DATABASE_URL=<local URL> npm run plugin:db:init-test`: passes migrations `0001` through `0022`. Every migration is repeatable.
- `PLUGIN_TEST_DATABASE_URL=<local URL> KINGDOWN_TEST_FILE=src/match/friend-invites.db.test.ts npm test`: 34 passes, plus 67 artwork passes.
- `PLUGIN_TEST_DATABASE_URL=<local URL> PLAYABLE_BROWSER=chrome npm test`: 5482 passes, 9 skips in 286 files, plus 67 artwork passes. Both type checks pass. The run holds the three shared browser slots.
- `npm run test:docs`: 180 passes in 15 files.
- `PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board-input.test.ts KINGDOWN_TEST_NAME=F-032 npm test`: 2 passes, 43 selected-out cases, plus 67 artwork passes. This covers the Chromium-only case that Chrome skips.

The other eight skips are existing suite skips. The earlier merged full run has 5 failures: two tool privacy guards and three timeouts. The next full run has one offline-poll failure. That unchanged poll case passes alone. The final full run passes.

`PLUGIN_TEST_DATABASE_URL=<local URL> PLAYABLE_BROWSER=chrome npm run check:browser plugin-ui-http plugin-ui-http-staging account web-online plugin-privacy web-game web-game-staging account-discovery staging-login plugin-oauth` passes all 10 registered checks. Each name counts as one check. No separate scenario count is inferred.

Logs: `/tmp/friend-db-merged.log`, `/tmp/friend-expiry-green.log`, `/tmp/friend-full-complete.log`, `/tmp/friend-chromium-case.log` and `/tmp/friend-browsers-merged.log`. Browser proof: `friend-invites-rgeIY9` under the system `kingdown-check-runs` folder.

Local browser checks load this branch's schema after they get the shared slot. Separate cases close their old waiting links and human games. The hall spacing fixture includes one compact row. The expiry case creates a new game after expiry. All assertions remain.

## Commits and source review

- Migration: `a253344b`.
- State and host contracts: `125bbe53`.
- Limits and tests: `2f629d34`, `bf39ed29`.
- State, read, cancellation and receipt fixes: `f6fd73df`, `8634f97c`, `7c3b4aa3`, `b51c1967`.
- Timestamp and privacy fixes: `f35b8b49`, `bab99388`, `de76f357`.
- Browser schema and fixtures: `a51ec280`, `b5f9cc74`, `2ebf1cad`, `84ddfcaf`, `408e061f`, `1d4182c0`, `95050195`.
- Source merges: `a598f8c6`, `d42e15de`. The final fetch and merge report up to date at `f306d452`. No conflict occurs. The merge keeps the source UI and settings fixes.

No acceptance check remains open. This work runs no remote migration, push or deploy. The local database cluster stays up.

## PR 156 review repair

The independent review requests six fixes. The named cap stays per sender and recipient pair.

1. Add failing repo tests for the old join writer, first named send, tool privacy, receipt cleanup, solo deletion race and database expiry.
2. Fix each cause. Split migration 0022 into short schema steps and concurrent index builds. Keep old writers valid.
3. Run the invitation file twice, the four API/tool files, doc checks, the full suite and the four required browser checks.
4. Fetch and merge `origin/staging/first-game` before the last commit. Record counts and commits. Do not push.

Pass criteria: each new test fails before its fix and passes after it. The deletion race uses separate database connections. All required checks pass on the local cluster. The quiet lock blocks full and browser checks.

The repair has 14 failing regression cases before the fixes: 9 database cases and 5 tool cases.
The first green invitation run passes 43 cases. The four API/tool files pass 153 cases. Each run also passes 67 artwork cases and both type checks.

- Migration: the exact old join statement passes with the state trigger. Schema locks end before backfill and validation. Five indexes use concurrent builds. The shared migration runner sends each phase as one query.
- First send: the service compares recipients only when a stored invitation exists. ID and handle cases pass.
- Tool privacy: all three limit notices and both invitation output paths keep player data in `_meta`. Model fields use an explicit safe list. The full host notice is `_meta.message`.
- Receipts: recipient IDs and handles use SHA-256 digests for input comparison. Same-input retries pass and changed inputs fail. Deletion removes raw fields from old receipts.
- Solo creation: every create takes the account lock. The real deletion race leaves no solo game after deletion.
- Expiry: selection and the recheck use database time for invitations. Fast and slow app clocks do not change validity.

Logs: `/tmp/friend2-db-red.log`, `/tmp/friend2-tool-red.log`, `/tmp/friend2-db-green1.log`, `/tmp/friend2-api-tools.log`.
The local branch database is `kingdown_friend156_test` on `127.0.0.1:55432`. Migrations 0001–0022 pass twice.

## Final repair checks

All six review findings are fixed. The new regression cases pass. The named limit remains per sender and recipient pair.
The original build counts above stay as history. The counts below cover this repair.

Use `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_friend156_test` for these commands.
This branch database is local and uses the repo database helper. No remote database is used.

- `npm run plugin:db:init-test`: migrations 0001–0022 pass twice. The split runner also passes the fresh-schema, duplicate, backfill and repeat fixtures.
- `KINGDOWN_TEST_FILE=src/match/friend-invites.db.test.ts npm test`, twice: 43 passes each. The nine new cases first fail before the fixes.
- `KINGDOWN_TEST_FILE='{src/plugin/server.db.test.ts,src/plugin/server.test.ts,src/api/http.test.ts,src/api/http.db.test.ts}' npm test`: 153 passes in four files. The five new privacy cases first fail before the fixes.
- `PLAYABLE_BROWSER=chrome npm test`, one full run: 5495 passes, 9 skips and 1 failure in 286 files. The failure is the old job fixture, which advances the app clock to expire an invitation.
- `KINGDOWN_TEST_FILE=src/online/jobs.db.test.ts npm test`: 7 passes after the fixture sets expiry with database time. The two-sweep race still checks one event and one outbox row. The full suite is not repeated, as requested.
- Each green focused `npm test` also passes both type checks and 67 artwork cases. The full run stops before its artwork phase because of the fixture failure.
- `npm run test:docs`: 180 passes in 15 files after this final ticket edit.
- `PLAYABLE_BROWSER=chrome npm run check:browser plugin-privacy web-online account plugin-ui-http`: privacy, online play and account pass in 14.4 s, 116.3 s and 81.9 s. The HTTP check reaches its 480 s limit during a screenshot.
- `PLAYABLE_BROWSER=chrome bash tools/test-lock.sh npm run check:browser plugin-ui-http`: passes in 437.1 s with the same assertions and limit. All four requested browser checks have a pass.

The quiet lock is absent before each full or browser run. The commands run one at a time. Shared browser locks can delay a start.
Browser proof: `friend-invites-oyNdjW` and `friend-invites-66BRUH` under the system `kingdown-check-runs` folder.
Logs: `/tmp/friend2-db-init-green.log`, `/tmp/friend2-db-green1.log`, `/tmp/friend2-db-green2.log`, `/tmp/friend2-api-tools.log`, `/tmp/friend2-full.log`, `/tmp/friend2-jobs-green.log`, `/tmp/friend2-docs-final.log`, `/tmp/friend2-browsers.log`, `/tmp/friend2-browser-http-retry.log`.

## Repair commits and release

- `04948500`: all six fixes, the split migration runner, release order and 14 regression cases.
- `5a568d0c`: the job fixture uses database time for invitation expiry. All 7 job cases pass.
- The final evidence commit records these results in tickets 03 and 04.

The final `git fetch origin` succeeds. `git merge origin/staging/first-game` reports already up to date at `f306d452`. No conflict occurs. Commit hooks run unchanged.

Release order: pause daily jobs and let active daily requests finish; add columns and both handover triggers; backfill and check duplicates; build indexes concurrently; attach and validate constraints; apply deletion cleanup and grants; deploy the new server; let all old requests finish; then resume daily jobs. Run each marked SQL phase as one query. Keep both triggers while old servers can write. The [release steps](../../../../supabase/README.md#friend-invitations-0022) give the full order and failed-index recovery.

No review finding remains open. No push or deploy runs. Large-table production timing is not measured; all database checks use the local cluster.

## Round 2 repair plan

The independent review finds three faults. Keep all six round 1 fixes.

1. Add failing tests for an old join during deletion, old game-end writes after backfill, and the private board notice.
2. Lock affected game rows before the deletion check. Close open invitations when an old writer ends a game. Read the private notice on the board.
3. Test each migration phase with old writes between phases. Set the release order and deletion-job pause in the database guide.
4. Run the required local database, focused, document and browser checks, one command at a time. Fetch and merge the source branch before the last commit. Do not push.

Pass criteria: each new fault has a red test, then a green test. All six earlier fixes still pass. The migration can repeat. Only the local branch database receives writes. The quiet lock blocks browser checks and the full suite.

## Round 2 repair results

- Old join and deletion: lock affected games in ID order before the active-seat check. The join-first test is red (`deleted=true`), then green (`deleted=false`). The deletion-first test and the old-service boundary probe pass: the join waits, then refuses the ended game.
- Old game ends: a database trigger closes open invitations on terminal game writes. Four old-write cases are red (`state=open`), then green (`state=cancelled`). The trigger works with the old game writer grants. Accepted invitations keep their state.
- Board notice: `resultText` reads a string `_meta.message` for errors. The queue case and three connected tool cases are red, then green. The exact notice reaches the board; model text stays fixed. Invalid metadata and successful results keep their existing text.
- Migration: the repo test checks old writes between all 13 phases, repeats each phase and repeats the file. The old-service phase probe also passes on a fresh 0021 database. The old service and store match `origin/main` after import-path changes only. All constraints validate; no index is invalid.
- The first full invitation-file run passes 51 cases, both type checks and 67 artwork cases. The six round 1 fixes remain covered. The local branch database is `kingdown_friend156r3_test` on `127.0.0.1:55432`, made with the repo helper.

The [release guide](../../../../supabase/README.md#friend-invitations-0022) gives the daily-job pause and resume commands. Keep daily jobs paused through a failed release or a rollback. Old create and rematch paths have no account locks. The minute tick can continue.
