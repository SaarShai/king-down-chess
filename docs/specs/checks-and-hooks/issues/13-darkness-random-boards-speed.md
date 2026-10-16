# 13: The Darkness random-board test stays under its 5 s limit under load

**What to build:** `src/rules/power-fixes.test.ts` > "Darkness readings, round 16" > "on random boards each reading changes exactly what its sentence says, no more and no less" goes past the 5 s vitest limit in a full `npm test` when the Mac is under load. The pre-push hook runs `npm test`, so this one test can block a sound push. Make the test fast enough to stay well under 5 s under load. Do not raise the limit. Do not make the check weaker: keep the same boards and the same checks.

**Blocked by:** none

**Status:** resolved

**Owns:** `src/rules/power-fixes.test.ts` (this one test only)

- [x] Find the cause: the number of boards, an expensive move generation, or repeated work.
- [x] Each reading's check, run alone in its file, stays far under 5 s; in a full `npm test` under load it stays well under 5 s.
- [x] The same 4,000 seeded trials and the same 1,427 boards; for each board and each reading, the engine and the search give exactly the expected moves; each count of the old "not vacuous" check stays above 15.
- [x] A fault in the engine still fails the test (mutation checks).
- [x] The 5 s limit does not change.

**Verify:** `npm test`; `KINGDOWN_TEST_FILE=src/rules/power-fixes.test.ts npm test`.

## Comments

Builder, 2026-10-16, branch `claude/darkness-test-speed` (from `claude/fault-round-2`). Not merged; a review by a reader that did not write the diff comes before a merge (AGENTS.md).

**History.** This time-out shows in earlier tickets from 2026-10-07 on: checks-and-hooks 05, secrets-and-public-gates 05 and 10, workshop-finish 05, workshop-proving-ground 02, chatgpt-mvp 17 and 30. On 2026-10-15 it took 8.4 s and 5.9 s in two full runs at a load average of 22 to 40.

**Cause.** No single step is expensive. The test does much work in one test:

- 4,000 seeded trials give 1,427 boards (2,573 trials stop at the first check: the side not to move is in check). A board has 20.6 legal moves on average.
- Each board needs 11 move generations: one with the readings off, then, for each of the 5 readings, one by the engine (`legalMoves`) and one by the search (`searchLegal`). That is 15,697 move generations in one test.
- Outside vitest (`tsx`) the test body takes 0.41 s. In vitest, alone, it takes 0.61 to 0.66 s. The engine and the search take 71 % of that time (one generation takes 23 to 34 µs). The 14,270 `expect` calls take 45 ms (7 %); the FEN text for each message takes 19 ms (3 %).
- When the whole file runs alone (load average 15 to 25), the test takes 0.90 s. In a full `npm test` (load average 10 to 27) it took 7.77 s and failed. A full run under load makes this test about 8.6 times slower: the vitest workers share the 16 cores with the other sessions' jobs.

The move generations are the check itself. Fewer boards or one generator less makes the check weaker. To cut the small costs (the FEN text, the `expect` calls) saves at most about 15 %, which is not sufficient.

**Change.** The test is now a `describe` with the same name and one test for each reading (`it.each` over the five readings). A `beforeAll` builds the 1,427 boards and their moves with the readings off one time (1,427 generations). Each reading's test then does 2,854 generations. The vitest limit is for each test, so each test now has about one fifth of the work. The total work does not change: the boards are not built again for each reading. Each reading's test keeps its part of the old "not vacuous" check: its count of changed boards is above 15; the safe step also counts its refused steps, and the take counts its takes and its dropped moves. A fault now also names its reading: the old test stopped at the first reading that failed.

**Times** (ms; one test for each reading after the change):

| Run | Load average | Before | After: boards | After: readings |
| --- | --- | --- | --- | --- |
| File alone | 15 to 25 | 901 | 126 | 164 to 207 |
| Full `npm test` | 10 to 27 | 7,767 (failed) | 386 | 601 to 1,016 |

The times come from a temporary `beforeEach`/`afterEach` timer in the test file, which wrote each test's time to a file outside the repo. The timer is removed; the committed file has no timer.

**Mutation checks.** Each fault was put in `src/rules/engine.ts` one at a time and then removed (`git status` shows only the test file). The file ran alone with the old test and with the new test:

- The aura covers only the four straight neighbours (`hi = 8` to `hi = 4` for `darknessAuraPawns`). Old: the random-board test fails. New: only its `darknessAuraPawns` test fails. In both, the two other tests that catch it fail too (the sentence test and the random games).
- The safe step looks at the landing square, not the square it passes over. Old: the random-board test fails. New: only its `darknessKingStepSafe` test fails. In both, the same two other tests fail too.

**Checks.**

- `KINGDOWN_TEST_FILE=src/rules/power-fixes.test.ts npm test`: 39 tests pass (before: 35; the one test is now five).
- Two full `npm test` runs with the change (load average 12 to 27): this file passes in both. In both, one other test failed: `tools/plugin-board.test.ts` > "serves 48 px targets on Seat and Board at 393 × 852" (the eight cards and the abort button measure under 48 px). It is not a time-out. It passed in the three full runs before the change, and `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test` with the change passes all 30 tests (load average 14 to 24). It shares only the CPU with this test, so it is a separate fault that shows under load: a follow-up for the plugin work.
