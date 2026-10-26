# Web audit F7: validate a new local game before replacement

Type: task
Status: in review

The owner asks for the F7 fix from the web audit. Work stays on `staging/web-routes-setup`.

## Plan and checks

1. Add a failing case for invalid custom army input in a game with a staged turn.
2. Build and validate a separate candidate before the dialog closes or the live game changes.
3. Check invalid positions and rematches too. Check valid starts, daily armies and rematches.
4. Run the game page tests and related game tests. Record red and green results. Commit this finding on its own.

Pass: a refusal keeps the same game, position, history, turn, sides, level, save and open dialog. A valid start replaces the game and resets the turn. No dependency, migration or game rule changes.

## Result

The page closes New game and calls `reset()` before army validation. A new start assigns a fresh game before `newGame(backRank)` can refuse the army. A rematch changes its sides before that same check.

Build a separate candidate with the next game's rules. For a rematch, use the current rules. Apply the daily army or design, then load the position or validate the army on that candidate. Only after this succeeds, close the dialog, reset the turn and assign the candidate. Keep the existing error path in `main.ts`; its alert now leaves the game and dialog in place.

- Red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME='new local game validation' npm test`. Three refusal cases fail on the old code. Invalid army `ABC` and position `bad` replace the current game. An invalid rematch swaps the players. The two valid-start cases pass. The type check passes.
- Green: `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,game,new-game}.test.ts' npm test`. All 91 selected tests pass. The type check and all 57 drawing tests in the test command pass too.
- The refusal cases check the game object, position, history, full turn state, players, level, open dialog, engine cancel, board sync, account change and raw save. The valid cases check the turn reset, daily army, rematch rules and player swap.
- Logs: `web-routes-setup-f7-red.log` and `web-routes-setup-f7-green.log` in the audit scratch folder.

Review: the game page owns this replacement. It already uses separate candidates for saved games. This change applies that same rule to new starts and rematches. No new validation rule or rollback path is needed. The New game sheet calls the start callback without closing itself, so a refusal keeps it open.

Limits: the tests use display substitutes. The full suite and browser checks remain for CI. An independent review remains before integration. Nothing is pushed or published.
