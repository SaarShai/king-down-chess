# Server: refuse an unfinished human turn

Status: in-progress

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
