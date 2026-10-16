# Server: refuse an unfinished human turn

Status: done

Lane: board. Branch: `claude/od-board`. Source: owner ticket 12-submit-turn, part w7-06. Scope: design section 8, ticket 06, with the ticket 06 tests of section 7.

## Plan

1. Add tests first. Check that each new case fails without the check.
   - Service unit test: a lone first move that keeps the turn is refused before any write. A turn that passes the move or ends the game goes on to the write. The computer keeps one action for each call.
   - Service database test: a lone Haste first move is refused and changes nothing. Haste plus `--` and Haste plus a second move pass. A half turn that an old board saved ends with `--` or with the second move alone. The computer plays a Haste first move in one call and ends its turn in the next call.
   - Setup database test (`setup.db.test.ts`, the Haste card): the lone card move is refused; the whole turn passes.
   - Fixture unit test and protocol check: the same refusal, rollback and computer rule in the in-memory fixture.
2. In `play()` (`src/match/service.ts`), after the list: refuse a player turn when the game is still in play and the mover is still to move. The computer path does not change.
3. Do the same in `tools/plugin-protocol-fixture.ts`. Keep the engine rollback, and keep the refusal words.
4. Run `npx tsc --noEmit`, `npm test` with the local test database, the protocol check, and `plugin-ui` with the check runner. Record each result here.

## Limits

- No change to the tool contract, the store, the database schema or the receipts.
- No change to the board. The board already sends whole turns (ticket 03).
- A retry of a half turn saved before this check gets its saved receipt. The receipt check comes before the engine work.

## Results

- Source commit: `08f11be8`. `play()` refuses a player turn that leaves the game in play with the same side to move. It uses `INVALID_MOVE` and the new words "This turn is not finished. Send the whole turn in one command." The plugin shows its own `INVALID_MOVE` words, so no board text changes. The computer path does not change.
- The fixture applies the same check inside its rollback block. A refusal loads the save back, so the revision, the FEN and the receipts do not change. The fixture keeps the refusal words of the check.
- The protocol check now has four refusal cases. Each case has its own corrected turn. The new case is a lone Haste first move, then Haste plus `--` with the same command ID.
- The service database test uses solo games. Player b already has ten code joins in that file, which is the code limit.
- Red check: the source without the check, with the new tests. Five tests fail: the service unit refusal, the two service database Haste tests, the setup database Haste card test and the fixture test. Each one fails because the lone Haste move passes. The computer unit test passes on both versions, as it must.
- Green check: the same four files pass 52 tests with the local test database; no test skips.
- `npx tsc --noEmit` passes.
- `npm run plugin:check:protocol` passes on this Mac (in memory, no browser).
- `npm test` with the local test database and two workers passes 165 files and 2,641 tests; 8 tests skip. All 50 figure checks pass. The run takes 468.36 seconds.
- The check runner runs `plugin-ui` and `plugin-ui-http` on this Mac at `d24b5517`. `plugin-ui` passes in 262.2 seconds. `plugin-ui-http` passes in 251.0 seconds with real HTTP MCP and PostgreSQL.
- No test or check time limit changes.

## Taste choices

- The service refusal words: "This turn is not finished. Send the whole turn in one command." Only direct service callers see them. The plugin shows "This move is not available. Choose another move."
