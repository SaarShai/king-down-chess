# 33 Release candidate review faults

Status: claimed
Branch: claude/rc-fixes
Base: 4692477c1669db14782e0058126ad291e1664ba8

The owner asks for R1, R2 and R3 in the source ticket at
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/tickets/issues/33-rc-review-faults.md`.

## Plan and checks

1. Add tests with no product change. Show each fault on the base code.
2. R1: show the first enemy lesson before the general note. Record a lesson only when its text shows. Check Black's first turn, a later swap, a hidden lesson and White's first note on the board.
3. R2: keep a long token in the invitation preview. Check Open, preview and Join with a fixed long token. Keep the short-code check.
4. R3: correct the P5 review note. Check the other prompts against both packet copies. Keep the other words.
5. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit before both browser checks. Run `plugin-ui` and `plugin-ui-http` through the owner's check runner. Record the results here.

Do not change `src/plugin/app.css` or the zoom checks. Do not push, merge or deploy.

## Evidence

The tests-only commit is `c6771fd3`. Its board, service and review note match the base `4692477c`.

- R1 fails in `plugin-ui` on the M1 with Chrome: Black sees the general note instead of the swap lesson. The run ends with `check-runner: M1 exit 1 at c6771fd3`. Log: `scratchpad/lanes/rc-fixes/checks-red-r1-2.txt` under the source ticket root.
- R2 fails in `npm test` with `KINGDOWN_TEST_FILE=src/plugin/server.db.test.ts` and the local test database. The preview changes the token. The other 37 tests pass. Log: `scratchpad/lanes/rc-fixes/red-r2.txt`.
- R3 fails in `npm test` with `KINGDOWN_TEST_FILE=tools/submission-packet.docs.test.ts`. The note lacks the correct P5 sentence. The other 12 tests pass. Log: `scratchpad/lanes/rc-fixes/red-r3.txt`.
- The first R1 run stops before the tests: this Mac has no Playwright Chromium file. The next run uses installed Chrome through `PLAYABLE_BROWSER=chrome`. No time limit changes.

## Changes

- R1: a fresh enemy lesson comes first. The board records it after it puts the lesson text in the visible note. A later swap does not repeat it. A lesson hidden by check stays available.
- R2: token lookup returns the trimmed token as given. Short-code lookup still returns the normal upper-case code. The test covers Open, preview and Join with a fixed token that has mixed case, hyphens and underscores.
- R3: P5 resigns a computer game. The active friend game stays for the Block check. The other review-note instructions do not conflict with the eight prompt cases in either packet copy. No other packet words change.

## Final checks

Pending.
