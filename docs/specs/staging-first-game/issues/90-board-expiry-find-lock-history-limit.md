# Server audit P3: board expiry, the Find lock and the history limit

Type: task
Status: in progress (branch `staging/server-p3`; not reviewed, not pushed)

A read-only server audit of `e3fd4411` (`playtest/reports/audit-2026-10-25/audit-server.md`) confirmed three P3 faults: F3, F4 and F5. This ticket fixes them, one commit for each. It adds no migration, deploys nothing and touches no remote database.

## F3: a board in use loses its record after 7 days

### Fault

The daily cleanup (`src/online/jobs.ts`) deletes each `plugin_boards` row 7 days after it was made, also when the player used it today. `PluginService.board` then gave `FORBIDDEN "Board unavailable for this account"`, the same code as another account's board. The page (`src/account-game/runtime.ts`) treats a refused read as a changed account: it deleted all page state, a kept pending command too, and closed the panel. Create, Find, Accept, Join and Resume read the board first, so each try got `FORBIDDEN` again.

### Change

- `PluginService.board` reads the row by ID only. A missing row is `BOARD_EXPIRED` (404, "This board expired. Start, resume or join a game."). A row of another account stays `FORBIDDEN`. A deleted game stays `MATCH_REMOVED`.
- `select()` in `src/plugin/server.ts`: a selection through an expired board counts one `kingdown_open` try before the action, then gets a new board from `openBoard` (seat check). The old ID never comes back. `kingdown_resume` now uses `select()` for both of its forms.
- The page: a `kingdown_get` that gets `BOARD_EXPIRED` while the page shows a game calls `kingdown_open` with that game, as a mount does for a game with no board, and keeps the new board ID. The pending command stays. If that Open gets `FORBIDDEN` (a new account with no seat), the refused-read branch still clears the page. A page that shows no game shows the read notice and keeps its state.
- `kingdown_get` stays read-only and makes no board. Retention stays 7 days from creation, so `public/privacy.html` does not change. `docs/plugin-preparation.md` names the new code.

This replaces the line "A foreign or missing board remains forbidden" in [match-foundation ticket 14](../../match-foundation/issues/14-deleted-board-recovery.md). A missing board is now `BOARD_EXPIRED`; a foreign board stays `FORBIDDEN`. The limits of ticket 14 still hold: the server never makes a row again under an old ID, so no account can claim an existing board, and the new board passes the same seat check as any Open.

Limits: each recovery changes the board ID, so a draft turn that is not yet sent is lost once (the draft scope is the board ID). A remounted widget with no shown game shows the notice until the player picks a game. The tools fixture (`tools/plugin-protocol-fixture.ts`) still gives `FORBIDDEN` for a missing board; its boards never expire.

### Verification

- Red on the old code (after the type-only `ErrorCode` change), 8 cases: `src/online/jobs.db.test.ts` (owner gets `FORBIDDEN`, not `BOARD_EXPIRED`); `src/plugin/server.db.test.ts`, new case "opens a new board after the cleanup deletes a board record" (`FORBIDDEN` on the first read); `src/plugin/http.test.ts`, new `it.each` for Create, Resume and Join (no `board_id` in the reply); `src/plugin/app.test.ts`, new `it.each` for the foreground read and the poll (no Open) and the new "expired board" path of the refused-board test (no wipe).
- Green on the new code: the four files, 193 tests, with the type check. Related files (`src/plugin/server`, `client`, `queue`, `screens/lifecycle`, `screens/lobby`, `src/account-game/state`, `src/api/http.db`, `tools/plugin-db/seed-review.db`): 152 tests pass.

## F4: every Find waits on one global lock during engine work

### Fault

`GameService.find` (`src/match/service.ts`) ran as one transaction. It took the global lock `pg_advisory_xact_lock(7007008)`, then built a new table with `newGame`, which starts an engine worker for the probe game. The lock and a pooled connection stayed held during that engine work, so the Finds of every instance that made a table finished one at a time (the audit measured equal steps of about 80 ms).

### Change

Two searches, with the engine build between them. The first locked search is the search of today: the receipt, your own open table, then the lobby. If it finds nothing to take, it writes nothing and commits. The engine then builds the table with no lock and no connection held. A second locked search looks again and inserts the table, or takes a table that opened in the meantime and drops the built one. A Find that takes a table, returns your own table or is a resend starts no engine worker. Every decision that writes is made under the global lock, the start lock and the row locks, as before. `create()` and `command()` already use this rule: engine work before the lock, then a check under the lock.

Limits: a Find that takes a table with no seat choice (Arrange off and King powers off) still starts the game under the lock (`acceptSeat`, `enterSetup`, `start()`); Ranked and the default options need seat choices, so they do not use that path. The rematch build in `command()` holds only the game row lock. A Find that makes a table runs the short search queries twice.

### Verification

- `src/match/matchmaking.db.test.ts` now passes the real `createMatch` through a mock, so a case can hold a table build at a gate. Two new cases: "builds a new table with no search lock or connection held, and a Find that takes a table starts no engine worker" and "pairs two Finds that both build a table on an empty lobby".
- Red on the old code: exactly the two new cases fail (the global lock is granted during the build, `1` not `0`; the second build never starts, `1` not `2`).
- Green on the new code: `src/match/matchmaking.db.test.ts`, `src/match/ranked-policy.db.test.ts`, `src/plugin/server.db.test.ts`, `src/match/service.db.test.ts`, `src/match/service.test.ts` and `src/api/http.test.ts`, 171 tests, with the type check. The older Find cases pass with no change, among them the exact lock-text case and the Create and Find race on one command ID.
