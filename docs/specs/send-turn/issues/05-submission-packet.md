# Submission packet: the turn button

Status: done

Lane: board. Branch: `claude/od-board`. Source: owner ticket 12-submit-turn, part w7-05. Scope: design section 4 (the submission packet table) and section 8, ticket 05.

## Plan

1. Add a copy check first: `tools/submission-packet.docs.test.ts`. Check that it fails on the old packet.
   - Both copies of the test cases hold five positive and three negative cases, with the same prompts and tools.
   - The two P2 copies agree word for word.
   - P2 says that a board move sends nothing, that Undo takes it back, and that the turn button sends the whole turn before the computer reply.
   - Checklist row 49 (the demo video) records a computer game with one move, then the turn button.
   - The skill says that a turn goes to the game only when the player presses the turn button.
   - The check reads the turn button words from `src/plugin/screens/board.ts`, so a change of the board words fails the check.
2. Change P2 in `docs/submission/test-cases.md` and `docs/submission/package/plugin.json`, checklist row 49 and the skill.
3. Run `npx tsc --noEmit`, `npm test` with the local test database, and `plugin-ui` with the check runner. Record each result here.

## Limits

- The words are the T1 a words: "End turn" against the computer, "Send your turn" against a person. The owner's final T1 pick can change them. Then the board changes and this check fails. The packet and the first test of the check (it pins the words) change with it.
- The final packet pass (owner ticket 15, on `claude/owner-decisions`) does this text once more against the merged build.
- No change to `listing.md`, `release-notes.md`, the source or the browser checks.

## Results

- Source commit: `cec8d381`. Test case P2 in both copies now says: "A move on the board changes the board only. Undo takes it back. End turn sends kingdown_move with the turn's moves; then kingdown_computer returns the computer reply on the board." The source column of P2 in `test-cases.md` adds `src/plugin/screens/board.ts`: Undo and End turn.
- Checklist row 49 records "a computer game with one move, then End turn".
- The skill adds: "A turn goes to the game only when the player presses the turn button on the board: End turn against the computer, Send your turn against a person."
- The copy check `tools/submission-packet.docs.test.ts` has six tests. Red check: on the old packet, three tests fail (P2, row 49 and the skill). The other three pass, because the old copies already agree.
- Mutation checks: a new board label ("Submit turn") fails four tests. A change to one P2 copy fails the agreement test.
- `npm run test:docs` passes 10 files and 121 tests.
- `npx tsc --noEmit` passes.
- `npm test` with the local test database passes 167 files and 2,648 tests; 8 tests skip. All 50 figure checks pass. The run takes 161.81 seconds.
- The check runner runs `plugin-ui` on the M1 at `cec8d381`. It passes in 233.1 seconds. No server code changes, so `plugin-ui-http` does not run.
- No test or check time limit changes.

## Taste choices

- The skill names both T1 a words, because the skill covers each game kind. The design sentence names only "End turn".
- The P2 description and prompt do not change. Only the expected result and the source column change, as the design table says.
