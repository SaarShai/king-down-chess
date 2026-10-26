# F9: Turn numbers in local review

Status: resolved

## Scope

The owner requests this repair. The review heading, Key moments, and Copy
moves must use the move list's turn numbers and the recorded side.

## Plan

1. Add failing tests with White's Haste, its follow-up, and Black's reply.
2. Use `moveNumbers` in all three displays.
3. Check that link and lesson readers accept copied moves.
4. Run focused tests and commit this finding.

## Checks

- After `e2-e3!H`, `e3-e4`, `e7-e5`, label Black's reply `1…`.
- Keep both Haste actions on the same move number for either side.
- Check a game that starts with Black and an ordinary game.
- Replay copied text with the link and lesson move readers.

## Result

The faults reproduce in all three displays. The old code counts pairs of
actions. A Haste follow-up shifts later numbers and can name the wrong side.
All three displays now use `moveNumbers` and the recorded side. The table
shares its existing number list with the review heading.

Copy moves now puts a number at the start of each numbered move group. It
keeps all actions of that group together. A Black-first group uses `1…`.
The ordinary format stays `1. e2-e4 e7-e5 2. d2-d4`.

- Red: `KINGDOWN_TEST_FILE='src/{screen/{moments,links},ui/table}.test.ts' npm test`.
  Type checks pass. Nine new tests fail; 25 tests pass. Key moments calls
  Black's reply after White's Haste `2. e7-e5`. Copy moves produces
  `1. e2-e3!H e3-e4 2. e7-e5 d2-d4`.
- Green: the same command passes all 34 selected tests. Type checks pass.
  The 57 art tests that `npm test` also runs pass. Logs:
  `web-review-labels-f9-red.log` and `web-review-labels-f9-green.log` in the
  task's scratch folder.
- Tests cover Haste for either side, a Black-first game, and ordinary play.
  They call the real table and Copy moves handlers. The Key moments tests
  use fixed scores so that each action has a label to check.
- No app reader imports numbered Copy moves text. Links split raw LAN tokens
  at `_`; `Game.playLan` replays those tokens. Lessons load a FEN and play
  engine moves. Tests keep copied LAN tokens intact and replay the shared
  links to the same final FEN. All six lesson goal moves pass that check.
- `KINGDOWN_TEST_FILE='tools/{docs-index,model-names}.docs.test.ts' npm test`
  passes type checks and all nine selected document checks. The 57 art tests
  also pass. Log: `web-review-labels-docs.log` in the task's scratch folder.
- No full suite, browser check, or build runs under the quiet-machine rule.
- No independent review runs in this task. Review remains due before merge.
