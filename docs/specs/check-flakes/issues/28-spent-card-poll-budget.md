# 28 The spent-card motion test reads the coin size with a 1 s poll budget

Status: in review (CI runs on the PR)
Branch: staging/motion-poll-budget
Base: origin/staging/first-game, dab2cc41
Scope: one test file. No `src/` change, no retry.

## Problem

`tools/plugin-motion.test.ts` 'presses a spent card into grey once (reduced motion false)' fails in the CI `verify` job with `expect.poll() function didn't resolve in time` at the first coin-size poll (before the move click). Three runs: 40235825055 (main f047562d) and 40278775868 attempt 1 (PR #131), plus one earlier #131 attempt.

## Cause

The poll uses the vitest default budget of 1 s. Its callback is `coin.evaluate`, which waits for the coin element. `strips()` rebuilds the coin row, so the callback can wait for a new coin. On a loaded runner this wait is longer than 1 s, and the poll ends before its first answer. The next poll in the same test (the dimmed style) already uses 5 s for the same reason.

## Fix

Both coin-size polls in the test use a 5 s budget, the same as the style poll between them.

## Check

- CI `verify` on the PR.
- Local: `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`.
