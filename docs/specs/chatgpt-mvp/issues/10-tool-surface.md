# 10 · The ChatGPT tools, profile and settings

Status: claimed
Type: AFK
Size: L
Blocked by: 06, 07, 08

## Scope

- The tool list of the spec's "API contract", on the branch's `src/plugin/server.ts` pattern: app-only actions; model tools with short summaries; the view in `_meta`; only `kingdown_open` carries the page; `kingdown_open` takes `screen` and `game_id`.
- Handle and picture: `kingdown_handle` (the branch's handle rules and the 17 `ICONS`).
- Settings: a server table for each account (symbols-only look, Show threats, the last setup choices); `kingdown_settings` read and write.
- `kingdown_profile`: handle, picture, rating, totals, badges, a history page (ticket 08); `openai/profile` stays.
- Page metadata: `openai/ui` entrypoints `thread` (side panel) and `global` (sidebar), whose tools accept `{}`; available display modes inline and fullscreen; the CSP of ticket 09.
- Tool descriptions start with "Use this when…" and cover "play King Down", "is it my turn?", "join King Down game K7QX2M", "show my King Down profile".
- `DEFAULT_SETUP` goes; `next()` with no game opens the home screen, not a new game.

## Acceptance

- Seam 1 tests through an in-memory MCP client: each tool, its hints and visibility; hidden data never in `content` or `structuredContent`; the opponent's choice hidden until ready.
- `npm run plugin:check:protocol` updated and passing (the tool count changes), `plugin:server:check`, `npm test` pass.

## Notes

- Explorer note F §4, §6, §7; note B §3.3.

## Plan and checks

Build one test first for each change. Use the MCP client and the game service as the test seams.

1. Change the tool inputs and revision bounds. Open home with no game. Read a board by its ID alone.
2. Add lobby, accept, find and cancel. Make a find retry keep one open game.
3. Add choose, rematch and explicit resume. Keep a solo rematch in setup when the player has a choice.
4. Add migration 0013 and account settings. Check table grants and partial writes.
5. Add handle checks and profile pages. Keep the account link reply strict.
6. Add the view and inbox fields. Keep choices and player text out of model replies.
7. Add join previews and the narrow solo abort rule for Switch now.
8. Add page metadata and tool descriptions. Keep the existing CSP.
9. Update the protocol fixture and UI harness. Run all required checks and record the page size.

Verify each step with `npm test`. Use `kingdown_mvp10_test` on 127.0.0.1:55432. At the end, run the protocol check, server check and all browser checks. Merge the current integration tip, run `npm test` again and push this branch.

## Fix-round plan and checks

Fix review items 1 to 15 in small commits. Use the existing game-service, MCP-client and fixture seams. Add a browser check for the pending-command switch. Each code fix starts with a failing check. Check the rating rows and history for setup ends. Keep the page fix to pending-command removal before the empty-FEN return.

Final checks: `npm test`, plugin build, server and protocol checks, local Vercel build and check, and both plugin browser checks. Merge the local integration tip, repeat `npm test`, then push the branch. Keep all database checks on `kingdown_mvp10_test` at 127.0.0.1:55432.

## Third-round plan and checks

1. Add a failing tool-read test with the server clock two days ahead. Use the database clock for activity ages in views and the inbox. Keep the 30-second write limit and hidden status.
2. Add a failing fixture test for Abort during setup. Clear the setup deadline in the Abort reply.

Use the existing MCP-client and fixture seams. Run full `npm test`, `npm run plugin:build` and `npm run plugin:server:check`. Use `kingdown_mvp10_test` on 127.0.0.1:55432. The branch starts from integration tip `9793db1f`; merge again only if that tip moves.

## Interface

Only `kingdown_open` carries the page resource. Model tools start their description with "Use this when". Each tool keeps the visibility and read, write, destructive and retry hints below. Errors have plain text and `_meta.code`; a bad option gives `INVALID_INPUT`. The page calls `validate()` before Start for the useful option text.

A game reply has a short, handle-free summary in `content` and `structuredContent`. It gives `game_id`, `screen`, `board_id` when sent, kind, pace, status, colour, your-turn mark, move number when play starts, deadline, draw-offer side and end words. `_meta.view` has the seat view; `_meta.me` has `{ handle, icon }`. FEN, legal moves, choices, the army draw, the card deal, opponent names and icons stay in `_meta`. The other choice and choose log stay hidden until both seats are Ready, also after abort. No tool summary names that seat's king.

| Tool | Caller and hints | Input | Reply data in `_meta` |
|---|---|---|---|
| `kingdown_open` | model + app; write; no retry guarantee | `{ screen?: 'home'|'play'|'board'|'profile', game_id?: uuid|'next', code? }` | `view` when a game is selected; `settings`, `me`, full `games`; with code, `preview` and screen `join` |
| `kingdown_create` | model + app; write; no retry guarantee | `{ kind: 'solo'|'friend'|'random', options?, colour?, level?, board_id? }` | `view`, `me` |
| `kingdown_join` | model + app; write | `{ code, preview?, board_id? }` | with preview, `preview`; else `view`, `me` |
| `kingdown_invite` | model + app; write; no retry guarantee | `{ game_id }` | none; summary gives only `code`, `expires_at` |
| `kingdown_lobby` | app; read only | `{}` | `lobby: { games, active_count?, server_now }`; summary gives only count |
| `kingdown_accept` | app; write; safe retry | `{ game_id, board_id? }` | `view`, `me` |
| `kingdown_find` | app; write; no retry guarantee | `{ options, colour?, board_id? }` | `view`, `me`; a waiting game of your own is reused |
| `kingdown_cancel` | app; write; destructive; safe retry | `{ game_id }` | `view`, `me` |
| `kingdown_resume` | app; write | `{ board_id, game_id? }` | `view`, `me`; select the named game, else the most urgent game |
| `kingdown_get` | app; read only | `{ game_id?, board_id?, since_revision? }` | `view`, `me`; a board with no game gives home and no view |
| `kingdown_choose` | app; write; safe command retry | command fields plus flat `{ king, order, ready }` | `view`, `me` |
| `kingdown_move` | app; write; safe command retry | command fields plus `{ lan }` | `view`, `me` |
| `kingdown_computer` | app; write; safe command retry | command fields | `view`, `me` |
| `kingdown_draw` | model + app; write; destructive | optional command fields plus `{ choice: 'offer'|'accept'|'decline' }` | `view`, `me` |
| `kingdown_resign`, `kingdown_abort` | model + app; write; destructive | optional command fields | `view`, `me` |
| `kingdown_claim` | app; write; destructive; safe command retry | command fields | `view`, `me` |
| `kingdown_rematch` | app; write; safe command retry | command fields plus `{ choice: 'offer'|'accept'|'decline' }`; no board ID | old `view` with `rematch_game_id`; `me` |
| `kingdown_say` | app; write; safe command retry | command fields plus `{ preset }` | `view`, `me`; no page control |
| `kingdown_report` | model + app; write; no retry guarantee | `{ game_id, target, category, intimate_image?, preset?, note? }` | none; summary gives report ID and date; no page control |
| `kingdown_games` | model + app; read only | `{}` | full `games`; summary gives rows without names, icons or private game fields |
| `kingdown_profile` | model + app; read only; `openai/profile` | `{ before? }` | `handle`, `icon`, `record`, history page and `next_before` |
| `kingdown_handle` | app; write | `{ handle?, icon?, check? }` | `me`; check gives availability and writes nothing |
| `kingdown_settings` | app; write | `{ symbols_only?, show_threats?, last_setup? }`; `{}` reads | `settings`, `me` |

Command fields are `{ game_id, command_id, expected_revision }`. Revisions and `since_revision` run from 0 to `MAX_REVISION` (1100). Model draw, resign and abort can omit the command ID and revision; the server supplies them through `decide`. A lost model reply without its command ID has no retry receipt.

`open {}` and `open { game_id: 'next' }` create no game on an empty inbox. They make an empty board selection. The summary gives `screen: 'home'`, its `board_id`, and `your_turn_count`; text says "Your move in 2 games" when two games need you. A named game defaults to screen `board`. The other screen values select the page. With a code, screen is `join`; no code, handle or icon goes in the open summary.

`get { board_id }` follows the board's current game and ignores any supplied `game_id`. The page can recover with only its board ID. A background read of another game sends `game_id` with no board ID. Full reads and polls record seat activity at most once each 30 seconds. This includes the reads in Open and Resume. Hidden online status still gives the other seat a null last-seen time. All paths that move the board use `select(board_id, action)`. Rematch returns the old game and never moves a board. Tap to resume, Switch now and a move to `rematch_game_id` use `resume { board_id, game_id }`. A solo rematch accepts only `offer`.

Create takes the shared `optionsSchema`. Without options it uses `settings.last_setup.options`, else `DEFAULT_OPTIONS`. It sends no fixed `setup`, mode, speed or days-per-move input. Games against people are Daily, with 3 days per move. Create has no command ID; retry can create a second game. The initiator's king stays in `last_setup.king`; the seat page uses it to prefill the choice. Choose is refused while waiting.

`last_setup` is `{ kind, options, colour, level, king }`. Settings validate options with `optionsSchema` and the king and its power with `KINGS`. Both board switches default off. Partial settings writes preserve the other fields. Profile keeps exactly `{ id, name? }` in structured content for the account link; text gives rating, provisional mark, totals and badge count. Full history and badge dates stay in metadata. The app can call Games; this changes the old model-only contract.

Preview takes no seat. `_meta.preview` is `{ code, options, colour, kind, creator: { handle, icon }, expires_at }`. It counts a short-code try as join does. Friend create and join require a handle. `handle { handle, check: true }` keeps the sample's Free mark and checks the same format and reserved-name rules without a write.

Full views give opponent icon and rating, and finished games give `outcome: { rating_before, rating, provisional, badges }`. Polls with `since_revision` omit rating and outcome. Views and inbox rows give `created_at`; inbox rows also give options, move number, level and `open_until`. `abort_open` is true while waiting or in setup, or until both seats move once. A solo game can also abort for Switch now when the actor's waiting random game gets a join after that solo game starts.

The friend code lasts 7 days. This is owner choice A from the current integration tip. Invite gives no link: the plugin has no join page. A code is stored as a hash. A new invite ends the old code. The page never calls Invite on mount. Full-read rating and end data show the rating in the strips, and the rating change and new badges in the end card (owner, 2026-10-11). The read lives in the results module.

The orchestrator's solo-rematch decision: when the player must choose a king or order, the computer alone is Ready and the new game stays in setup. End words for `no_start` depend on the view: no opponent means the invitation or open game expired; empty FEN means setup time ran out; otherwise no first move. The board uses `ending()`.

Page metadata keeps the CSP from ticket 09. `openai/ui` declares inline and fullscreen, with thread and global entries that call Open with `{}`. Resource `ui.permissions` permits clipboard write for Copy. No picture-in-picture mode is declared. If private clients omit these entries, Q25b lets the release use the chat path alone.

## Progress

- Step 1: the home test first fails on the old solo-game reply. The new open and board-only read pass. Five tool database tests and 50 art tests pass. Migration 0013 adds `plugin_boards.game_selected` because a null foreign key alone cannot tell an empty board from a deleted game. Existing rows default to selected; a home row starts false; selection sets true.

- Step 2: the new MCP test fails on the absent Find tool. Lobby, accept, find and cancel now pass. A retry keeps one open game. The related match and plugin checks pass.

- Step 3: the Choose test and the changed solo-rematch test first fail. Choose, Rematch and explicit Resume pass. The solo rematch keeps only the computer Ready when a choice is needed. The related checks pass.

- Step 4: Settings first fails as an absent tool. Default reads, partial writes, saved setup defaults and invalid king and options checks now pass. The migration and plugin checks pass.

- Step 5: the handle test first fails on the absent tool. Availability checks, reserved-name checks, icon writes and profile record and history pass. Seven related files pass with 58 tests and 50 art tests. `_meta.history` is the row array; `_meta.next_before` is its cursor.

- Step 6: the page-field test first fails because the fields are absent. Icons, full-read ratings and outcomes, inbox dates and move number, abort state and expired-game words pass. Polls omit rating and outcome. Old-save checks still pass. A solo outcome has null rating numbers and any new badges; computer games have no rating history.

### Step 7

- Preview counts a code try. It takes no seat. Open and Join keep the code and creator fields in `_meta.preview`.
- Friend create and join require a handle.
- Switch now permits a solo abort only when the actor's earlier waiting random game gets an opponent after the solo start and remains active. Ordinary late aborts remain blocked.
- Check: 14 test files pass, with 246 tests and 50 art tests. The preview and Switch now tests fail before the changes and pass after them.

### Step 8

- Open advertises the thread and global entrypoints. Each starts with `{}`.
- The resource permits clipboard writes and offers inline and fullscreen display. Inline is the preferred mode. The CSP stays the same.
- Each model tool starts its description with "Use this when". Open maps the play, join and profile phrases. Games maps the turn question.
- Check: 3 server tests and 50 art tests pass. The new metadata test first fails on the missing entrypoints.

### Step 9

- The fixture implements all service methods and command actions. Options, level and the deal pass through. Setup hides the other choice and Choose log until both seats are Ready.
- One `seed(actor, data)` hook supplies history, open rows, records and outcome data. `/fixture-seed` calls it with `{ actor: 'alice' | 'bob', data }` in fixture mode. History pages contain at most 20 rows.
- The harness gives both personas a handle. `/fixture-friend-tool` calls any tool as the friend. `holdNext` holds one named tool reply; `holdNextGet` stays available.
- Each board flow starts a game with Arrangement and King powers off. Separate positions check Haste, Archer and Freeze. The harness reserves the composer space outside the app pane.
- The database tool tests inspect every reply for private fields. They check old saves, revision bounds, full-read ratings and outcomes, and hidden seat choices.
- Checks so far: 143 test files pass, with 2,253 tests and 50 art tests; 8 tests skip. The protocol check passes for 24 tools. The compiled server check passes on the disposable database. Both named plugin browser checks pass.

### Page call sites for ticket 11

Only the old page's forced input and mount paths change. There is no new screen or CSS.

- `src/plugin/app.ts:8`: import the shared defaults for the old Create buttons.
- `src/plugin/app.ts:31`: clear a pending command for another game before the empty-FEN return. The waiting and setup host-switch checks first fail on a visible Retry button.
- `src/plugin/app.ts:32`: accept a waiting view with an empty FEN.
- `src/plugin/app.ts:69`: show the friend code instead of the removed link.
- `src/plugin/app.ts:111`: Solo sends `kind` and turns seat choices off.
- `src/plugin/app.ts:112`: Friend sends `kind` and turns seat choices off.
- `src/plugin/app.ts:114`: Join sends `code`.
- `src/plugin/app.ts:118`: accept a home result with no game ID.
- `src/plugin/app.ts:119`: keep the home board ID and read its current game on a remount.
- `src/plugin/app.ts:120`: reject other results with no game ID.
- `src/plugin/app.ts:128`: a waiting game uses a full read until its rules exist.
- `src/plugin/app.ts:131`: read by board ID when the initial result has no game ID.

The home-remount check first fails with no widget state. It passes after the board read is added. The lobby and rematch checks keep the board on the old game until Resume selects the new game.

A board-only poll keeps `since_revision`. A read that names an old game and follows a board to another game gets a full view. Two tests first fail on extra rules, ratings and outcomes, then check this rule.

The final focused check passes: 10 files, 70 tests and 50 art tests. It checks the seed endpoint and runtime settings writes as the runtime role. `tsc` also checks the fixture, its tests, the harness and the host with a temporary config.

## Fix-round result

All 15 review items are fixed. Each code fix starts with a failing check. Temporary faults check the new acceptance tests; they are removed before the passing checks.

- Find and Accept use the database clock. A clock-difference test first fails on repeated selection.
- The service refuses a level with no options. The result tests use options.
- Game reads record seat activity at most once each 30 seconds. Full reads, polls, Open, Resume and reads with no board ID pass. Hidden status stays hidden. A command cannot overwrite a newer read time.
- Input errors give the exact `INVALID_INPUT` reply. The request handler checks input before SDK validation and keeps the published schemas. Tests check options, icons, revisions, unknown fields and the 1000-character report-note bound.
- A host switch clears the old pending command before waiting or setup. The browser check waits for the page's saved game ID, so an old turn label cannot satisfy it. The page change stays at the call site listed above.
- The local Vercel check creates a solo game, gives each user a handle and joins with `code`.
- Setup-end checks read `player_ratings` and require no `rating_history` row for the game. A temporary rating change makes the check fail.
- The fixture omits full-read fields on polls, returns a completed Join on retry, supports the narrow Switch now rule and keeps one three-day setup deadline. The Switch now test checks one allowed case and five refused cases.
- Acceptance checks cover fresh defaults, setup and first-move end words, all retry hints and the generic Move hold hook. Each check detects a temporary fault.
- The old 14-day note stays as history and is marked as replaced by 7 days. Rating and end-card data are approved (owner, 2026-10-11).

## Result

Status stays resolved. All review items pass their checks. The 24-tool interface stays in place.

- Third-round item 1: views, polls and the inbox use database activity ages. The two-day clock test first fails, then passes. Focused `npm test`: 2 files, 24 tests and 50 art tests pass. The 30-second write limit and hidden status also pass.
- Third-round item 2: Abort clears both fixture deadlines. The setup-deadline test first fails on Abort, then checks a null deadline in its reply and the other seat's read. Focused `npm test`: 1 file, 7 tests and 50 art tests pass.
- Full `npm test`: 145 files pass, with 2,269 tests and 50 art tests; 8 tests skip.
- Focused server `npm test`: 2 files pass, with 23 tests and 50 art tests.
- `npm run plugin:build` and `npm run plugin:server:check`: pass on local PostgreSQL with migration 0013.
- `npm run plugin:check:protocol`: 24 tools pass.
- `npm run build:vercel` and `npm run check:vercel`: pass locally, with 20 art files and 4 archived engines. These checks publish nothing.
- `npm run check:browser plugin-ui plugin-ui-http`: both checks pass with the final code.
- Fixture and harness type checks pass with a temporary config.
- Page: 437,425 HTML bytes; MCP resource: 438,870 JSON bytes, below the 1 MB limit.
- Open items: none.

The final check keeps the changes in this ticket's scope. No engine or setup-module change is needed. The page change moves the pending-command check by one line. The new schema checks preserve the SDK's input fields and output validation.
