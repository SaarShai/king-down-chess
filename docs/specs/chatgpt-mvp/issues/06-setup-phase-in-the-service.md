# 06 · The game service: options, the setup step and rematch

Status: claimed
Type: AFK
Size: L
Blocked by: 04, 05

## Scope

- A new migration (after 0009): game kind `random`; status `setup`; columns for the options, the draw, the deal, the level and the setup deadline; per seat: the choice and a ready mark. Runtime role grants.
- `create(options, colour, level, kind)`: validates through ticket 04; the colour default is White for the initiator (spec Q5); a solo game goes to `setup` (the player's own choices) or straight to `playing`.
- `join` (code) and the matchmaking accept (ticket 07) move a game to `setup`. A new `choose` command stores one seat's choice and `ready`. The other seat's choice stays hidden in each view until both are ready. When both are ready, the service builds the setup (ticket 04) and starts the engine match in the same transaction.
- A computer seat chooses at once (ticket 04 defaults).
- Setup deadline: 3 days; the sweep ends a late game with no result (`no_start`) (spec Q27).
- `rematch`: an offer on a finished game; the opponent's accept makes a new game with the same options and swapped colours, seats filled, in `setup`; against the computer it starts at once.
- The view carries the options, the deal and each seat's power (after Ready), so the board can draw the cards and the coins.

## Acceptance

- Database tests (seam 1 through the service): each toggle mix from create to the first move; hidden choices; one `ready` each; the setup sweep; rematch both ways; retries apply once.
- `npm test` with the test database, `npm run plugin:server:check` pass.

## Notes

- Explorer note B §3.2, §5, §10 (risk 1: the fixed setup). Spec "Schema changes".

## Plan

Round 2 fixes the six review findings. Check one finding at a time through GameService on `kingdown_mvp06_round2_test` and its test copies. First prove the missing rematch deadline, then store both deadline columns. Add full response checks for hidden choices, a save seeded under 0009, exact setup sweep boundaries with unchanged ratings, a computer rematch with seat choices, and retries after later commands. Keep the public names and signatures. Do not change `service.db.test.ts`.

For each test gap, first run a check that exposes the old fixture's limit. Then repair the fixture and check the full behavior. Run `npm test`, the compiled server check and `git diff --check` before resolve. Merge the current local integration tip and run `npm test` before push.

1. Add migration 0010 and runtime grants. Check a repeat apply and a restricted role.
2. Store options, the draw, the deal and the level at create. Keep games with no options on their old path.
3. Add the setup step and choose command. Start the match in the Ready transaction. Check hidden choices, races and retries.
4. End setup after 3 days with no result. Check the sweep and a late command.
5. Add rematch offers and accept or decline. Check swapped seats and retries.
6. Add setup and power data to the view. Check each toggle mix through the first move.

Each step starts with one failing database test through GameService. Run `npm test` with ticket 06's test database. Run `npm run plugin:server:check` before resolve. Merge the current integration tip and run `npm test` again before push.

## Interface

- Create takes `options` and `level`. No options keeps the fixed-setup path. The default colour is White.
- Choose uses `{ type: 'choose', choice: { king, order }, ready }`. A Ready choice cannot change. The other choice and its log entry stay hidden until both seats are ready.
- Rematch uses `{ type: 'rematch', choice: 'offer' | 'accept' | 'decline' }`. The reply stays on the old game and gives `rematch_game_id` after accept. A solo offer creates the new game at once.
- `View` gives `options`, `draw`, `deal`, `level`, `choices`, `ready` and `setup_deadline_at` for option-based games. `kings` and `hands` appear after the engine starts. The hands are the dealt cards. The FEN records each seat's spent-card bits.
- Play ends by revision 1000. `MAX_REVISION` is 1100 so a game at the play limit can take a rematch offer. Tool schemas must use this bound.
- Ticket 07 can call `enterSetup` from its accept transaction. A game with no seat choice starts at once.

## Result

Round 2, findings 1 and 2: the rematch test fails with a null deadline, then passes after the insert stores both deadline columns. The privacy fixture check fails with the old shared order. The fixture now uses a distinct legal order and checks all reply fields, including full reads, polls, lists, join retries, abort replies and error messages. It checks hidden choices from both seats. The focused `npm test` check passes 12 service tests and 50 document-art tests.

Round 2, findings 3 to 6: the old upgrade fixture fails the check for a schema without setup columns. The new test seeds a played save under 0009, applies 0010 twice, checks the defaults and unchanged save, and plays two more turns. The sweep test checks 1 ms before and at 3 days and keeps both ratings unchanged. A temporary 2-day deadline makes this test fail. The computer rematch fixture fails with Arrangement and King powers off; it now enables both and checks Ready, play and the first move from each seat. Draft-choice and rematch-decline retries keep the state from later commands and have one log entry each. Both retry tests fail when their receipts are ignored. All temporary faults are removed. The final focused `npm test` check passes 12 service tests and 50 document-art tests.

The service stores validated options, a shared army and deal, and the computer level. It starts the match when both seats are ready. Choices stay hidden before that point. Setup ends after 3 days with no result. Rematch keeps the features and swaps the colours. A saved game with no options keeps its fixed setup. The account-deletion job aborts setup with no result.

Checks use `kingdown_mvp06_test` on `127.0.0.1:55432`. Each schema or grant test uses its own copy and the shared role lock.

- `npm test`: 139 files pass; 2,197 tests pass; 8 skip. The document-art tests pass 50 of 50.
- Setup and job checks: 20 tests pass, including 11 setup tests. One setup test covers all 16 valid toggle mixes from create to the first move. The checks also cover hidden choices, two Ready retries, both rematch paths, two sweeps, two legal orders, card use, all four computer levels, and rollback after a failed Ready write.
- Migration and server start checks: 5 tests pass. Migration 0010 runs twice. A saved game still plays. A role without setup grants cannot start the server.
- `npm run plugin:build` and `npm run plugin:server:check` pass. The compiled HTTP check uses real PostgreSQL. The page resource is 437,582 JSON bytes, with 20 art files.
- `git diff --check` passes.
- The current integration tip, `0a915696`, is already in this branch. The merge reports `Already up to date`. The full `npm test` check then passes with the same counts.

Open items: none in this ticket. Ticket 07 owns random-game accept. Ticket 08 owns the new tool bindings. This ticket changes no page flow, so browser checks do not apply.
