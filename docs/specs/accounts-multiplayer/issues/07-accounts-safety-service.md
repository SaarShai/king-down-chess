# 07 — Accounts and safety service

Type: task
Status: resolved
Wave: 2 (after 02) · Model: Opus · Branch: `claude/mp-07`

## What to build

Read part 01 of the report, sections 5 (accounts) and 8.2 (reports), and part 03, sections 8.8 (deletion) and 8.10 (UK duties).

1. `src/online/accounts.ts` (server side, uses the store's pool):
   - handles: validation, a small blocklist (slurs, staff words, title patterns such as `gm_`), `reserved_handles` (old and deleted handles never return), one rename in 90 days;
   - icons: a list of preset keys;
   - privacy settings (`challenge_from`, `online_visible_to`, `quiet_mode`, `accepting_games`, `on_leaderboards`);
   - follow and block (`relations`); a block also hides presets and refuses invites both ways;
   - account deletion: request (7-day grace), cancel on sign-in, status;
   - notification preferences.
2. `src/online/safety.ts`:
   - reports: from a player against a player, a handle or a preset message, with the seven reasons of part 01, section 8.2; "child safety or illegal content" has the intimate-image sub-choice and a 48-hour take-down target; the browser inserts only its own reports;
   - the owner queue: list open reports (child safety first), act (warning, rename, hide, suspension), each action writes `mod_actions` with a statement of reasons; appeals;
   - report hold: `hold_until` for NCA cases.
3. `tools/mod.ts`: a small owner CLI over the same functions (list, show, act, appeal), with the admin database URL from the environment. No admin web page.
4. Website account client helpers in `src/account/` for the new profile fields (no UI).

Ticket 08 adds the HTTP routes; ticket 09 adds the ChatGPT tools.

## Checks

- Database tests: handle rules and reservation; rename limit; a block refuses an invite; a report reaches the queue; an action writes a statement; a hold blocks deletion (with ticket 06's job if merged; else the store check).
- `npm test` passes.

## Comments

### 2026-10-10 — built on `claude/mp-07`

Progress:

- [x] 0. Migration `0007_accounts_safety.sql` (safe to run again): a trigger on `profiles` reserves every changed handle for its player and a deleted player's handle for good, and refuses a reserved handle. An advisory lock makes two players who want one handle queue. `delete_my_account()` now asks for a deletion with the 7-day grace. A trigger on `auth.sessions` cancels the deletion at a new sign-in (a token refresh keeps its session, so it cancels nothing). `reports.content` keeps the reported handle or preset as evidence, and `mod_actions.handle` keeps the handle that a rename or a hide took away. The fourth block of `plugin-deploy/runtime-role.sql` gives the runtime role what the two services need. The test bootstrap and `plugin:db:migrate` apply 0007; the bootstrap adds stand-ins for `auth.sessions` and `auth.users.banned_until`.
- [x] 1. `src/online/accounts.ts`: `AccountService` (profile, handle, settings and icon, follow and block, deletion request, cancel and status, alert choices) and `who()`, which names one other player by handle, by a shared game or by user ID. The game view (`src/match/service.ts`, `store.ts`) now applies the privacy rules: a block either way, or the viewer's quiet mode, hides the opponent's presets (`{type: 'hidden'}` keeps the revision, so the list has no gap); `last_seen_ms` follows the opponent's `online_visible_to` and a block, in the view and in the inbox.
- [x] 2. `src/online/safety.ts`: `SafetyService` (report; the owner's queue, show, act, appeal and hold).
- [x] 3. `tools/mod.ts` (`npm run mod -- …`): list, show, act, appeal and hold, with `KINGDOWN_ADMIN_DATABASE_URL`.
- [x] 4. `src/account/profile.ts`: the profile fields for the website, with no zod: `ICONS` (17 preset keys and their pictures), the setting choices, `MyProfile`, `NOTIFY_DEFAULTS`, `REPORT_CATEGORIES` and `handleProblem()`. The server uses the same values.

Decisions (the agent's picks, made under the delegated UI and UX choices; the owner can change each one):

- **Quiet mode hides the opponent's presets** from the quiet player (gap 6 of the record of measures asked this). Lichess kid mode turns off all messages.
- **A block works both ways**: neither player sees the other's presets or last-seen time, and neither can invite the other. A block also ends the follows both ways, and a follow across a block is refused.
- **Handle changes**: the first pick and the first change are free; after that, one change in 90 days. A player may never take any reserved handle, also their own old one.
- **Moderation actions**: `warning` (a statement only); `hide` (the handle goes at once and the player picks a new one); `rename` (the owner gives a neutral handle, and the player can pick another at once); `suspension` (Supabase Auth's `banned_until` for a number of days). Hide and rename reserve the old handle as `blocked` and remove it from `game_players.handle_at_start`. `none` closes a report with no action. Each statement has three lines: what happened, the rule, and how to appeal.
- **Appeals** arrive by email (the safety drafts say so); the owner records them with `mod appeal`. A reversal ends a suspension and gives back a hidden or renamed handle.
- **Report hold**: `mod hold <report> --nca <reference>` holds the reported player's data for 365 days (it only grows). The deletion check skips the held player, and the player is not told.
- **Reports go through the server only**: the reporter is the verified actor. The browser gets no grant on `reports`; ticket 08's route and ticket 09's tool call `SafetyService.report`.

### Interfaces (for tickets 06, 08 and 09)

`const store = new PostgresMatchStore(pool)`; `new AccountService(store)` and `new SafetyService(store)`. The caller gives a verified user ID; input is `unknown` and the service checks it. Errors are `MatchServiceError` with the codes of `protocol.ts`, plus the new `HANDLE_TAKEN` (409).

- `AccountService`: `profile(actor) → MyProfile` (`handle`, `can_rename_at`, the settings, `deletion: {requested_at, run_after} | null`); `setHandle(actor, {handle})`; `updateSettings(actor, {icon?, challenge_from?, online_visible_to?, quiet_mode?, accepting_games?, on_leaderboards?})`; `relate(actor, {kind: 'follow'|'block', handle | game_id | user_id})` and `unrelate(actor, same)`; `relations(actor)` (only the actor's own lists); `requestDeletion(actor)` and `cancelDeletion(actor)` (each returns the profile, which is the status); `dueDeletions(now) → user IDs` (100 at most); `notificationPrefs(actor)` and `setNotificationPrefs(actor, {turn?|reminder?|game_finished?: {email?, push?}})`.
- `SafetyService.report(actor, {target: 'player'|'handle'|'message', category, intimate_image?, note?, preset?, handle | game_id | user_id}) → {id, created_at}`. A message report names the game and the preset. The owner's functions (`queue`, `show`, `act`, `appeal`, `hold`) need the admin connection.
- View changes (ticket 08's client and ticket 09's board): `last_commands` can hold `{type: 'hidden'}`; `opponent.last_seen_ms` is null unless the opponent's setting allows it.
- New `notifications` kinds: `moderation` (`{action_id, action, statement, ends_at}`) and `appeal` (`{action_id, status, note}`). No outbox row: no email yet.
- For ticket 06: `runDeletions` takes its users from `dueDeletions(now)` (it skips held players), or keeps the same rule. The `profiles` trigger reserves the handle when the account goes, so the job does not have to. A missing `notification_prefs` row means `NOTIFY_DEFAULTS` (for `game_finished`, email is off; the table default is on). A test that applies `runtime-role.sql` takes the advisory lock 7007007, because two files that grant on one table at once fail with "tuple concurrently updated".

### Evidence

Test database `kingdown_mp_07_test`, made with `node tools/plugin-db/make-test-db.mjs kingdown_mp_07_test`.

- `npm run plugin:db:init-test`: "Disposable PostgreSQL schema ready (migrations 0001-0007); every migration is repeatable".
- `npm test`: typecheck clean; vitest 117 files passed, 1,920 tests passed, 8 skipped (the balance-drift tests); `node --test` 50 of 50; exit 0. That is the wave 1 merge (115 files, 1,908 tests) plus the 12 new tests.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (this ticket changes `src/match`).
- `npm run build`: exit 0.
- `tools/mod.ts` is outside `tsconfig.json`; `tsc --ignoreConfig --strict` on it is clean.
- New tests. `src/account/profile.test.ts` (3): the handle format, chess titles, staff words and slurs (also with digits for letters), and a picture for each icon. `src/online/accounts.db.test.ts` (9, against the database, with the player services on a copy of the reviewed runtime role and the owner's on the admin connection). These tests cover each check of this ticket:
  - handle rules and reservation: the format and the blocklist; an old handle and a deleted player's handle stay reserved; two players who want one handle at once; a handle wanted while its owner leaves it (the lock refuses it every time);
  - rename limit: the first change is free, then the second is refused until 90 days pass;
  - a block refuses an invitation both ways, ends the follows both ways and refuses a follow;
  - a report reaches the queue: child safety first, the intimate image report with its 48-hour time, the evidence kept, and the reporter from identity (a `reporter_id` in the input is refused);
  - an action writes a statement: hide, rename, suspension, warning and none, each with its effect and the player's notice; an appeal that reverses a hide gives the handle back, and one that reverses a suspension ends the ban;
  - a hold blocks the deletion (the store check, `dueDeletions`, because ticket 06 is not merged): the held player stays past the grace and is free again after the hold.
  The tests also cover: a sign-in (a new `auth.sessions` row) cancels a deletion; the website's `delete_my_account()` makes the same request and deletes nothing at once; last-seen and presets in the view and the inbox, by setting, block and quiet mode; alert choices; what the runtime role may not do (13 statements); the CLI (`list`, `act`, `show`, a refused action).
- Mutation checks. I changed the code five times, one change at a time, ran the new database file with `KINGDOWN_TEST_FILE=src/online/accounts.db.test.ts npm test`, and restored the file from a backup (`cmp` identical): presets never hidden (1 test failed); report holds ignored (1); the inbox ignores `online_visible_to` (1); a reserved handle not refused (2); a sign-in cancels nothing (1). I read the failing test names from the saved logs with grep.
- `src/match/service.db.test.ts` changes: its runtime-role refusal list follows the new grants (three statements that are now allowed changed to three that are still refused), it takes the role lock, and its "views write nothing" test counts only its own games, because the new database file writes to the same database at the same time.
- Local reads on the loopback test database, 100 reads each after 6 turns (the view now has one more query, for the privacy rules): `view` with `since` 0.49 ms median, 0.63 ms p95, 555 bytes; a full `view` 0.48 ms median, 0.52 ms p95. Ticket 02 measured 0.79 ms and 0.40 ms.
- Process note: one early run of `profile.test.ts` used bare vitest, piped through tail. That breaks the house rule. Every result above comes from `npm test` or `npm run check:browser`.

### Open issues

1. **The website text still says that a deletion is at once**: the note in `src/account/account.ts` ("Your account is deleted"), the dialog in `index.html`, `public/delete-data.html` ("deleted at once") and `public/privacy.html`. 0007 changes the behaviour to the 7-day grace. Change the text (a visual change, so it needs the owner's yes) before 0007 goes to production.
2. **Owner check at apply time**: Supabase must allow a trigger on `auth.sessions` (it allows the one on `auth.users` in 0001). If it refuses, the whole of 0007 rolls back. The other way is then for the website and the consent page to call `cancelDeletion` after a sign-in (ticket 08).
3. **Suspension delay**: a token issued before the ban works until it expires (1 hour at most), marked `ponytail:`. If that is too long, the API (ticket 08) can refuse banned users at once with a ban flag that the runtime role can read.
4. **Statements reach the player only as a `notifications` row** (`moderation`, `appeal`). The website must show them (ticket 08 or later), or ticket 06 must email them.
5. **No rate limits** on reports, follows or handle tries. The spec puts rate limits at the Vercel firewall at the first deploy.
6. **A person who is not a player** cannot report through the service (gap 1 of the record of measures). The CLI has no command to add an emailed report; the owner can add one with SQL until a form exists.
7. **`act … none` tells the reporter nothing.** If the EU DSA applies, Article 16(5) asks for a notice to the reporter.
8. **The blocklist is short** (`ponytail:` in `src/account/profile.ts`); the owner's `hide` and `rename` are the backstop. Staff names go in `reserved_handles` with reason `blocked`.
9. **For the owner, before a deploy**: apply 0007 and the fourth block of `plugin-deploy/runtime-role.sql`; set `KINGDOWN_ADMIN_DATABASE_URL` only on the machine that runs `npm run mod`.
10. **For ticket 10's review**: the hold covers the reported player only, not the reporter. Decide if a child safety report should also hold the reporter's data.

### 2026-10-10 — merge note

The merge step merged this branch into `claude/multiplayer-foundation` after ticket 06. Ticket 06 also added a `0007_*.sql`, so this ticket's migration is now `0008_accounts_safety.sql`, and its block of `plugin-deploy/runtime-role.sql` is the fifth block, not the fourth. Where this ticket says 0007 or the fourth block, read 0008 and the fifth block. Evidence and the open issues that the merge found: ticket 10, "wave 2 merge".
