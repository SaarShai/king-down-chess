# 25 Check flakes

Status: claimed
Branch: claude/check-flakes
Scope: part b. Parts a and c are in the branch. Tools only.

## Plan

1. Read each saved failure log. Reproduce each fault at the check seam.
2. Fix faults in tools. Wait for a real state. Keep all time limits.
3. Add tests for each change. Run the type check and the full unit tests.
4. Commit. Run plugin-ui and three plugin-ui-http checks in order through the check runner.

## Checks

- Each reported failure has a cause and log evidence in Comments.
- Each new test fails on the old behaviour and passes on the fix.
- No src/ change, longer time limit or retry.
- npx tsc --noEmit and npm test pass.
- plugin-ui passes. Three plugin-ui-http runs in a row pass at the same head.

## Comments

- Start: HEAD is 1c534749. The worktree is clean. Saved logs are present for all four named local failures.

### Causes from the saved logs

- `od-home-Fjz9m5/plugin-ui-http.log`, lines 2–21: the 35.6 s wrapper failure is a 30 s wait for `#setup-start:not(:disabled)`. The page has a saved `kingdown_computer` command and a connection error. At `48d21cff`, the check starts as Black and remounts as soon as the board shows. The computer command is still in flight. The new frame restores it as a failed pending command, so Start stays disabled. Commit `9bbe9d24` fixes the check: it chooses White and waits for the board to become idle before the remount. That commit is in this branch. The old hall block is absent at HEAD. No new product change is needed. The old setup screen is called `play`; that route is correct.
- `od-home-SR7qEG/plugin-ui-http.log`, lines 7–17: the 207.2 s wrapper failure is a strict selector failure. `nav` matches both `#hall-tools` and `#table-bar`. Use `#table-bar` for the game controls. A test adds a second navigation bar and reproduces the strict selector failure.
- `od-home-IvLuYE/plugin-ui-http.log`, lines 2–26: Play is already enabled when the check asks whether it is disabled. Settings and games calls already run. The 300 ms boot delay is not a hold on connection. Hold the first settings call through the existing harness control. Wait for that hold, check the disabled buttons, then release it. A test advances the page clock by 1 s with the call held.
- `od-home-5M7jG9/plugin-ui-http.log`, lines 7–36: the card assertion fails on a ready revision-0 board with no pending command. At `9bbe9d24`, `client.ts` saves `state.draft`; `setup.ts` lines 75 and 214 write the public setup to it. Its `options.cardPool` can contain the chosen card name. The check searches all saved text for that name, so it can mistake the public pool for a dealt hand. The current client has no saved draft. Compare the state before and after a card read. Only `sheet: board-sheet` may change. Test a public pool and reject new hand data in private state or model context.
- The report hides the first two causes because `firstFault()` prefers the later wrapper AssertionError to a Playwright line that starts with `locator`. Add the Playwright error form to its first-error match. Tests use both saved error forms.
- `lanes/pr57-batch/checks-1.txt`: the old runner sends HTTP and OAuth checks to the M1 with no test database. It fails in 0.1 s. The supplied runner now sends these checks to this Mac. No change to the runner is needed.

The saved local log root is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/`. The source owner lane is `od-home`.

### Baseline

- The HTTP flow at `1c534749` passes all its browser assertions in 121.6 s. The runner refuses the result because a test file changes during the run. This is my check error, not a product failure. The final runs keep the checkout fixed. See `checks-b-baseline-1.txt` and `check-flakes-8LwYjt/plugin-ui-http.log`.

### Tests before the browser checks

- `tests-b-first-fault-red.txt`: the old log reader fails both new cases. It reports the wrapper instead of the Playwright cause.
- `tests-b-card-red.txt`: the old card assertion fails the saved public-pool case.
- The fixed code passes `npx tsc --noEmit` and `npm test` with the local test database. Result: 171 files pass; 2,643 tests pass, 8 skip; all 50 artwork checks pass. Log: `tests-b-full-1.txt`.
- The added app tests hold the first settings call past the old boot delay and reproduce a strict `nav` failure with two navigation bars. The named browser check also measures the game controls at three widths.
- No `src/` file changes. All test and check limits stay the same. There is no new retry.
- The final browser checks run after this commit, with no checkout edits during a run. The lane report `25-b-build.md` and the source ticket Comments hold their results and exact head.

### First browser check of the fix

- At `29d5bdb0`, the required runner passes `plugin-ui` in 93.5 s and `plugin-ui-http` in 102.2 s. Log: `checks-b-1.txt`; detailed folder: `check-flakes-e3uBDi`.
- A source-history check corrects the 35.6 s cause above. This doc change does not change the tested code. The three final HTTP checks run at the next head.
