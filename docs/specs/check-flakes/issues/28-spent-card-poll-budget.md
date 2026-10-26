# 28 The spent-card motion test reads the coin size with a 1 s poll budget

Status: in review (CI runs on the PR)
Branch: staging/motion-poll-budget
Base: origin/staging/first-game, dab2cc41
Scope: one test file. No `src/` change, no retry.

## Problem

`tools/plugin-motion.test.ts` 'presses a spent card into grey once (reduced motion false)' fails in the CI `verify` job with `expect.poll() function didn't resolve in time` at the first coin-size poll (before the move click). Three runs: 40235825055 (main f047562d) and 40278775868 attempt 1 (PR #131), plus one earlier #131 attempt.

## Cause

The error says the poll callback gave no answer within the vitest default budget of 1 s. The callback was `coin.evaluate`, one Playwright browser read that also waits for the coin to be attached (up to the page's 15 s default). `strips()` replaces the coin row in one synchronous call (`src/plugin/screens/board.ts`), so the coin is not absent for long, and the move sheet does not remove it. The likely cause is a slow browser reply on a loaded CI runner; this is not proved. The other polls in the test that read the coin already use 5 s.

## Fix

- `targetSize` uses `coin.evaluateAll`: one browser read that returns null when the coin is absent or detached, with no wait inside the poll.
- The two coin-size polls and the poll for the end of the press animation use a 5 s budget, the same as the style poll. A coin that stays absent, or an animation that does not end, still fails.

## Check

- CI `verify` on the PR.
- Local: `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`.
