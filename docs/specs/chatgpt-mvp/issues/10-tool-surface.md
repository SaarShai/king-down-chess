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

`get { board_id }` follows the board's current game and ignores any supplied `game_id`. The page can recover with only its board ID. A background read of another game sends `game_id` with no board ID. All paths that move the board use `select(board_id, action)`. Rematch returns the old game and never moves a board. Tap to resume, Switch now and a move to `rematch_game_id` use `resume { board_id, game_id }`. A solo rematch accepts only `offer`.

Create takes the shared `optionsSchema`. Without options it uses `settings.last_setup.options`, else `DEFAULT_OPTIONS`. It sends no fixed `setup`, mode, speed or days-per-move input. Games against people are Daily, with 3 days per move. Create has no command ID; retry can create a second game. The initiator's king stays in `last_setup.king`; the seat page uses it to prefill the choice. Choose is refused while waiting.

`last_setup` is `{ kind, options, colour, level, king }`. Settings validate options with `optionsSchema` and the king and its power with `KINGS`. Both board switches default off. Partial settings writes preserve the other fields. Profile keeps exactly `{ id, name? }` in structured content for the account link; text gives rating, provisional mark, totals and badge count. Full history and badge dates stay in metadata. The app can call Games; this changes the old model-only contract.

Preview takes no seat. `_meta.preview` is `{ code, options, colour, kind, creator: { handle, icon }, expires_at }`. It counts a short-code try as join does. Friend create and join require a handle. `handle { handle, check: true }` keeps the sample's Free mark and checks the same format and reserved-name rules without a write.

Full views give opponent icon and rating, and finished games give `outcome: { rating_before, rating, provisional, badges }`. Polls with `since_revision` omit rating and outcome. Views and inbox rows give `created_at`; inbox rows also give options, move number, level and `open_until`. `abort_open` is true while waiting or in setup, or until both seats move once. A solo game can also abort for Switch now when the actor's waiting random game gets a join after that solo game starts.

The default friend code lasts 14 days. This is the pending owner choice A. Invite gives no link: the plugin has no join page. A code is stored as a hash. A new invite ends the old code. The page never calls Invite on mount. Full-read rating and end data use pending owner choice B; the read lives in the results module.

The orchestrator's solo-rematch decision: when the player must choose a king or order, the computer alone is Ready and the new game stays in setup. End words for `no_start` depend on the view: no opponent means the invitation or open game expired; empty FEN means setup time ran out; otherwise no first move. The board uses `ending()`.

Page metadata keeps the CSP from ticket 09. `openai/ui` declares inline and fullscreen, with thread and global entries that call Open with `{}`. Resource `ui.permissions` permits clipboard write for Copy. No picture-in-picture mode is declared. If private clients omit these entries, Q25b lets the release use the chat path alone.

## Progress

- Step 1: the home test first fails on the old solo-game reply. The new open and board-only read pass. Five tool database tests and 50 art tests pass. Migration 0013 adds `plugin_boards.game_selected` because a null foreign key alone cannot tell an empty board from a deleted game. Existing rows default to selected; a home row starts false; selection sets true.

- Step 2: the new MCP test fails on the absent Find tool. Lobby, accept, find and cancel now pass. A retry keeps one open game. The related match and plugin checks pass.

- Step 3: the Choose test and the changed solo-rematch test first fail. Choose, Rematch and explicit Resume pass. The solo rematch keeps only the computer Ready when a choice is needed. The related checks pass.

- Step 4: Settings first fails as an absent tool. Default reads, partial writes, saved setup defaults and invalid king and options checks now pass. The migration and plugin checks pass.

- Step 5: the handle test first fails on the absent tool. Availability checks, reserved-name checks, icon writes and profile record and history pass. Seven related files pass with 58 tests and 50 art tests. `_meta.history` is the row array; `_meta.next_before` is its cursor.

- Step 6: the page-field test first fails because the fields are absent. Icons, full-read ratings and outcomes, inbox dates and move number, abort state and expired-game words pass. Polls omit rating and outcome. Old-save checks still pass. A solo outcome has null rating numbers and any new badges; computer games have no rating history.
