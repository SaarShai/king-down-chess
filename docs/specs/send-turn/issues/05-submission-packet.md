# Submission packet: the turn button

Status: in-progress

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

- The words are the T1 a words: "End turn" against the computer, "Send your turn" against a person. The owner's final T1 pick can change them. Then the board changes, this check fails, and the packet changes with it.
- The final packet pass (owner ticket 15, on `claude/owner-decisions`) does this text once more against the merged build.
- No change to `listing.md`, `release-notes.md`, the source or the browser checks.
