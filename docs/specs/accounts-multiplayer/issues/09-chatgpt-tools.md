# 09 — ChatGPT tools

Type: task
Status: resolved
Wave: 3 (after 02, 07) · Branch: `claude/mp-09`

## What to build

Read part 03 of the report, section 4.5 (the tool table, the read-only poll, poll rules), and part 01, section 6.

Update `src/plugin/server.ts` (and `src/plugin/app.ts` only where the new view shape needs it; no new visual controls):

- `kingdown_open` accepts a game ID or `next` (the most urgent game) and keeps the board resource; no other tool carries the resource.
- `kingdown_create` adds speed (Daily by default), days per move and colour.
- `kingdown_invite` returns the `kingdown.dev/j/<token>` link and the short code.
- `kingdown_join` accepts a token, a full link or a short code.
- New: `kingdown_games` (the inbox, read-only), `kingdown_say`, `kingdown_draw`, `kingdown_resign`, `kingdown_abort`, `kingdown_claim`, `kingdown_report`, `kingdown_profile` (`_meta['openai/profile']: true`; returns the user ID and the handle, never an email).
- `kingdown_get` takes `since_revision` and writes nothing.
- Every tool has explicit `readOnlyHint`, `destructiveHint` and `openWorldHint`.
- In games between people, the model gets no position: board data goes in `_meta` for the board only; `content` gives a short text.

## Checks

- Protocol check (`npm run plugin:check:protocol`) lists the tools with their hints; a test proves `kingdown_get` writes no row.
- The plugin browser checks pass (`plugin-ui`, `plugin-ui-http`, `plugin-oauth`).
- `npm test` passes.

## Comments

### 2026-10-10 — plan

- [x] 1. `src/plugin/service.ts`: `PluginService`, the one object that the tools call (the game service on the ChatGPT surface, a report, the profile, the board selections). It replaces the `MatchService` adapter of ticket 02.
- [x] 2. `src/plugin/server.ts`: the tool table of part 03, section 4.5; the board resource on `kingdown_open` only; explicit hints; the view in `_meta`, a short summary in `content` and `structuredContent`.
- [x] 3. `src/plugin/app.ts`: read the `View` from `_meta`; derive the move objects from `legal`; poll with `since_revision`. No new controls.
- [x] 4. Checks: the protocol check lists the tools with their hints; a database test proves that the read-only tools write nothing (a read-only connection); the fixture, the harness and the browser checks follow the new shapes.
- [x] 5. `npm test` and `npm run check:browser plugin-ui plugin-ui-http plugin-oauth` pass.

### 2026-10-10 — done

Decisions (by the report and UI practice; none is an owner decision):

- The board data goes in `_meta.view` for every game, solo games too. One shape is simpler, and the model needs no position in a solo game.
- The model summary (`structuredContent`) has the game ID, board ID, kind, speed, days per move, status, colour, "your turn", move number, deadline and result text. It has no FEN, no legal moves, no handles and no preset messages. `kingdown_games` names the opponent only as "none yet", "computer", "deleted player" or "player".
- `kingdown_open` with no game ID or with `next` opens the first game of the inbox (your turn first, then the nearest deadline, then the most recent). With no active game, it starts a solo game, as before.
- The board buttons still create games as White: the board has no colour choice, and the ticket permits no new controls. The model can choose the colour.
- `kingdown_resume` stays for the board only. `kingdown_create` and `kingdown_join` are for the model and the board.
- The invitation link uses the configured public origin (`KINGDOWN_PLUGIN_ORIGIN`). With `https://kingdown.dev` it is `https://kingdown.dev/j/<token>`.
- The model can resign or abort with only the game ID: the tool makes the command ID and reads the current revision.
- `kingdown_report` reports the opponent in a named game (the player, the handle, or a preset message), through the ticket 07 safety service.
- `kingdown_profile` returns `{ id, name? }` with no other field (the `openai/profile` contract). It never returns an email.
- The board keeps the 3-second poll while a friend game waits, now with `since_revision`.
- `PluginService` (`src/plugin/service.ts`) replaces the `MatchService` adapter of ticket 02. It also keeps the board selections (`plugin_boards`). The unused `latest()` in the store is removed.

Evidence:

- `npx tsc --noEmit`: clean.
- `npm run plugin:check:protocol`: PASS. It prints the 16 tools with their visibility and their four hints, and asserts the table. It also checks the resource on `kingdown_open` only, `openai/profile`, the view in `_meta` only, `next`, `since_revision` with no rules, the invite link and code, the inbox, a model resign and the profile.
- `src/plugin/server.db.test.ts` (new, 4 tests, PostgreSQL): a Daily friend game between two ChatGPT players (the model output has no FEN, handles or presets; retry; stale revision; say; draw offer and decline; report; profile; model resign; 5 commands on the `chatgpt` surface); abort by a short code; a claim after a missed Daily deadline; the board selections and recovery.
- The read-only proof: the test runs `kingdown_games`, `kingdown_get` (with and without `since_revision` and `board_id`) and `kingdown_profile` on a pool with `default_transaction_read_only=on`. Any write fails there with 25006. The control: a move on the same pool fails and the revision stays 0. Mutation check: a temporary board write in `kingdown_get` made this test fail with 25006; the code is restored.
- `npm test` with the disposable test database: 120 test files passed (1,932 tests, 8 skipped by other environment gates); `node --test` 50 of 50.
- `npm run plugin:build` then `npm run plugin:server:check`: passed (the built server on PostgreSQL: open, move, computer, retry, invitation link and join, board recovery; the resource is 4,327,175 JSON bytes, under the 4.4 MB ceiling). `npm run build:vercel` then `npm run check:vercel`: passed.
- `npm run check:browser plugin-ui plugin-ui-http plugin-oauth`: all 3 passed (18.9 s, 18.2 s, 4.2 s). The fixture harness now has a second player: the friend joins by the full link, and the board joins by the short code in lower case with a dash.

Open issues:

- The board has no controls for say, draw, claim, resign, abort and report. These tools work from the model (resign, abort, report) or wait for a board build. A visual build needs the owner's yes.
- The adaptive poll schedule and the poll rules of part 03, section 4.5 are not built. The board polls every 3 seconds while a friend game waits.
- `kingdown_presence` (phase 2), "Open in App" (`setOpenInAppUrl`), the `/j/<token>` join page and the report-form page do not exist yet. The live plugin origin is still `https://kingdown-plugin.vercel.app`, so its links are correct only after the move to `kingdown.dev`.
- The board-only tools have no `resourceUri`. The local host calls them, but test them on the ChatGPT web and mobile clients. If a client refuses, add `openai/widgetAccessible: true`.
- A host retry of a model resign or abort after a lost reply gets `MATCH_TERMINAL`, not the first reply (ponytail note in `server.ts`).
- Ticket 08's cross-surface test must use the new tool shapes: `game_id`, `command_id`, `expected_revision`, and the view in `_meta.view`.
- `kingdown_join` has no rate limit against short-code guesses. Add one in the game service, so that it applies on all surfaces.
- After a release, refresh the ChatGPT connection: the tool metadata and the board resource changed.

### 2026-10-10 — merge note

The merge step merged this branch into `claude/multiplayer-foundation` after ticket 08. Ticket 08's short-code limit in `GameService.join` now covers `kingdown_join`; this closes the open issue on short-code guesses. Ticket 08's cross-surface test now uses this ticket's tool shapes; this closes that open issue too. The board-selection test in `src/plugin/server.db.test.ts` and one call in `tools/plugin-ui-check.mjs` now make the solo game as White: with no colour the seat is random, and the test failed when the player got Black. Evidence: ticket 10, "wave 3 merge".
