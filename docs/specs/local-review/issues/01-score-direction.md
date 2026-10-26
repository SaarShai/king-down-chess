# F8: Same-turn review scores

Status: resolved

## Scope

The owner requests this repair. Key moments must read each search score from
the correct side. A free action must keep the search depth of its turn.

## Plan

1. Add a failing test with the audit's Freeze position.
2. Use the two recorded turns to set the score sign and search depth.
3. Run the focused tests and commit this finding.

## Checks

- Replay `7k/5ppp/8/8/8/8/6Q1/K7 w - - 0 1`, Freeze f7, then Qg2-a8.
- The old code reports `allowedMate` for White. The repair reports no loss.
- The next search keeps depth 3 for Freeze and uses depth 2 after a turn ends.
- Keep ordinary loss and mate labels correct.

## Result

The audit case reproduces. Both searches score White as winning, but the old
code treats the next score as Black's score. It also reduces depth after Freeze.
The repair reads the turns of both positions. It reverses a same-turn score
and keeps depth 3. A changed turn keeps depth 2.

- Red: `KINGDOWN_TEST_FILE=src/screen/moments.test.ts npm test`.
  Type checks pass. Two new tests fail; 11 tests pass. The false label is
  `1. !F:f7: White allowed a forced mate. Better: Qg2-a8.`
  The depths are `[3, 2, 3, 2]`, instead of `[3, 3, 3, 2]`.
- Green: `KINGDOWN_TEST_FILE='src/{screen/moments,moment}.test.ts' npm test`.
  Type checks and all 16 selected tests pass. The 57 art tests that `npm test`
  also runs pass. Logs: `web-review-labels-f8-red.log` and
  `web-review-labels-f8-green.log` in the task's scratch folder.
- The real search runs with the production time and depth limits.
- The existing score classifier needs no logic change. Its comment now states
  that depth counts turns. The new tests enforce that rule.
- No full suite, browser check, or build runs under the quiet-machine rule.
- No independent review runs in this task. Review remains due before merge.
