# Plugin test clock races

Status: done
Type: task

## Plan and checks

1. Read the three CI failures. Use a temporary probe for each cause.
2. Fix each proven cause in a separate commit. Keep all assertions and time limits.
3. Check all eight plugin test files that install a page clock. Record each result.
4. Run each changed test file twice on the M1 with `m1-unit.sh`. Run `npx tsc --noEmit`.

The first pass uses temporary probes that fail before each fix and pass after it. It removes those probes from the final commits.
The first pass reserves the full suite and browser checks for the main session.

## Review fix plan and checks

1. Check Review A against the client and the two-widget test. Review B supplies no finding.
2. Check the review's failure and pass logs with a 1.5 s delay in the newer widget's first poll reply.
3. Finish both widgets' calls before the second clock jump. Keep all assertions and time limits.
4. Keep the delayed reply in the test. Run `npm test`, which includes the full file, and the `plugin-ui` browser check.
5. Record the results, correct the sweep row, and commit. The browser runner checks a committed HEAD.

## Evidence

The branch starts at `2d48c2be`. Ticket 59 already fixes the first busy-Start read.
The M1 device name, account, hardware and SSH server fingerprint match the project record.

## Causes and probes

| Case | Cause | Temporary probe and result before the fix |
| --- | --- | --- |
| Menus: opponent moves (F4/J12) | A poll starts after `idle()`. The clock jump expires its 10 s request. | Hold a poll reply during a 3.5 s real gap, then jump 31 s. The revision stays at 2. Fails twice. |
| App: lost Ready | The host gets the computer reply before the frame applies it. | Hold that reply for 1.5 s. The pending command stays `kingdown_computer`; the check fails. |
| Menus: busy Start | The clock resumes after the first read. It can pass 5 s before the Back check. | Add a 4.2 s real gap after the 1 s step. Back is free too soon. |
| Menus: slow settings save | Real time can expire Create before its release. | Add a 9.5 s real gap after the 1.001 s step. Start says `Start game`, not `Starting…`. |
| Menus: seat activity | Real time adds to the 30 s presence interval. | Add an 11 s real gap before the 20 s step. Seen count is 2, not 1. |
| Board: passive drawing | Real time ends the move and the draw window before the frame count. | Add a 5.5 s real gap after the 100 ms step. Both frame counts are 151. |
| Board: first idle check | The smoke image can load after `ready()` and restart the draw window. | Hold the image until 300 ms after `ready()`, past the first clock step. The count rises from 11 to 15. A load wait before the clock pause makes this probe pass. |

F06 has no page clock. CI run `39303894456` reports a gold pixel 7 levels from its target, with a limit of 1.
Commit `541b0f84`, already in the base, checks the 5 px gold inset and the pixel within 24 levels.
The F06 test passes in the sweep probe run. This work keeps its assertions unchanged.
Probe: move the coin down by 0.05 px before its screenshot. The pixel becomes `[222, 183, 108]`,
11 levels from the gold target in red. The old limit of 1 fails. The existing limit of 24 passes.
Thus the failure is raster edge coverage, not a flowing page clock. No further F06 fix is needed.

Read the first attempt of CI run `39357869849`; a later attempt is still active when this work starts.
Run `39335474811` supplies the Ready failure.

## Clock sweep

| File | Result |
| --- | --- |
| `plugin-menus.test.ts` | Four proven gaps above. The removed Display check test has no short-lived expected state; leave it. |
| `plugin-app.test.ts` | Fix the Ready reply wait. The clock tests hold the request they expire, or await a completed call before a deadline step. Leave those tests. |
| `plugin-board.test.ts` | Fix passive drawing. King fall, fade and held Send already pause. The cancel test holds the move promise and checks a lasting result. |
| `plugin-motion.test.ts` | `mate(..., true)` pauses before the result and the tap guard checks. Leave it. |
| `plugin-lobby.test.ts` | `freeze()` pauses before the timed actions. The handoff also drains calls before more clock steps. Leave it. |
| `plugin-wait-recovery.test.ts` | Installs and pauses before the timed actions. Leave it. |
| `plugin-real-host.test.ts` | Fix the two-widget poll step: a paused clock still expires an open call at the next jump. Finish both frames' calls before that jump. The wake, boot and wait-clock steps hold the call they expire or check the needed frame state. Leave those steps. |
| `plugin-races.test.ts` | R2 holds Create, then deliberately expires it. Its result is stable after expiry. Leave it. |

Keep the page clock paused across timed steps. Before a clock jump, finish the calls from the last step in every live widget.
For a reply check, wait for the frame state that the next assertion needs.

The other app clock steps stay as follows. These are source checks, not new load probes.

| Step | Reason for no change |
| --- | --- |
| Held move at 10 s | Holds the exact move reply; expiry is the expected result. |
| Play now Choose/Get timeout | Holds the exact call before the 10 s step. |
| One poll timeout | Holds that poll and tests its late reply. |
| Neutral Start after timeout | Holds Create and expects expiry. |
| Leave during the settings save | Holds Settings before Create; tests cancellation after the exit becomes free. |
| Settings error sentence | Holds the settings reply and expects expiry. |
| Mount Settings/Get/Games past 10 s | Holds the exact mount read; checks the page unlock after release. |
| Retry before Create runs | Holds Create before the server; awaits its late HTTP reply. |
| Create retry with device clock offset | Holds Create; the command receipt does not depend on the wall clock. |
| Lost Start with a forward/back clock | Drops the reply before the clock step; no call remains open. |
| Leave New game at the wait line | Both steps deliberately reach the held Create's limit. |
| Keep the failed start while another game plays | Expires the held Create before the other game opens. |
| Name reason after Back | The handle refusal completes before the step. |
| Chat join-error/game reads past 10 s | Holds the exact mount read until its release. |
| Play now retry after timeout/remount | Holds Create before the server; checks one command receipt. |
| Coin focus and deadline | Awaits each full Get before the clock jump. |
| Chat board Get past 10 s | Holds that mount read before the server until its release. |

## Fixes and proof

- `8a96e4b9`: pause the menu clock after page start. Keep it paused across all timed steps.
- `df71efb3`: wait for the frame's turn, with the same wait limit, before the pending-command check.
- `46745b3e`: pause the scene clock before the frame-count steps.
- `50e712b4`: wait for the initial image requests to finish before that pause. The page can report `complete` while the optional smoke image still loads.
- The first six failure probes pass with the fixes; F06 also passes. The combined probe run has 7 passes. The later smoke-image probe also fails before its fix and passes after it.
- The final branch removes the temporary probe commits. The lane output keeps the patches and logs.
- `npx tsc --noEmit` and `git diff --check` pass.
- First complete M1 run at `46745b3e`: menus 13/13, app 133/133, board 160/160. Total: 306/306 in 480.12 s.
- Second complete run: menus and app pass again. Board fails its first idle check. The smoke-image probe above finds the cause.
- Final board runs at `50e712b4`: 160/160 in 172.15 s and 160/160 in 173.97 s. Menus and app are unchanged since their two full passes.
- Each changed file passes twice. All runs use `m1-unit.sh`. The three-file runs use `--no-file-parallelism`.
- The lane output keeps `files-1.txt`, `files-2.txt`, `board-final-1.txt` and `board-final-2.txt`. Each log has the commit and exit code.

## Review results

- Review A: confirmed. The first jump waits only for the older frame's revision. The newer frame can still have an open `kingdown_get`. The next 30 s jump expires its 10 s limit. Its poll then misses the opponent's move.
- The test now waits for `client.inflight === 0` in both frames before the second jump. This count includes open and queued calls.
- The test keeps the 1.5 s delay in the newer frame's first poll reply. It checks that the delay runs, and keeps all prior assertions and time limits.
- The review's `review-widgets-before.txt` fails at the revision wait with the delay. `review-widgets-after.txt` passes with the same delay and the two-frame wait. Both logs come from the M1. A repeat probe on this Mac stays in the shared test queue; this pass stops that queued probe before it runs.
- Review B: no finding is supplied (`undefined`). There is no claim to fix or refute.
- At `0251e587`, the full `plugin-real-host.test.ts` file passes 9/9 on the M1 in 13.41 s. This includes the delayed newer-widget reply. Log: `fix-widgets-m1.txt` in the lane output.
- At `0251e587`, `plugin-ui` passes on the M1 in 268.8 s. The runner exits with code 0. Log: `checks-fix-1.txt` in the lane output.
- `npm test` on this Mac exits 1 after 356.03 s: 195 files pass and one fails; 3,276 tests pass, one fails, and eight skip. The fixed-depth test at `src/ai/search.test.ts:115` exceeds its unchanged 5 s limit (7,495 ms). The test and search code match the reviewed commit. The command uses the test database from the lane rules. Log: `fix-npm-test.txt` in the lane output. The final board-script phase does not run after this failure.
- The focused AI recheck passes with the same limit and the shared test lock: one pass, 17 tests outside the filter, 1.00 s total, exit 0. Log: `fix-search-recheck.txt` in the lane output. The full-suite timeout remains in the check record; no AI code or time limit changes.
- The commit's type check and staged gate pass. No server code changes, so `plugin-ui-http` is not required.
