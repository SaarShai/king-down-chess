# 29 Release candidate

Status: built
Branch: claude/release-candidate
Base: a5cac8f8

## Scope

Use the approved ticket 29 merge order. Keep S5 for its later merge.
The source ticket is in the release scratchpad, under tickets/issues/29-release-candidate.md.

## Plan and checks

1. Merge submit-prep. Keep its three-choice privacy text. Keep the fullscreen words and the game limit from the code. Apply the ticket 15 patch in a separate commit.
2. Merge od-coin-back. Pick only the w7-05 and w7-06 build and fix commits from od-board, with source commit links.
3. Merge acct-words. Check the completion files before each optional merge: check-flakes, od-picks, od-faults.
4. Check each conflict against both inputs. Keep the client state work for the later S5 merge. Add a test for any new merge behaviour.
5. Run npx tsc --noEmit and npm test. Use the local test database. Commit the code before the approved runner checks plugin-ui and plugin-ui-http.
6. Record the merge commits, conflicts, skipped lanes, tests and results here. Write the full report to the required scratchpad file.

The checks pass only when each command ends with exit 0. The browser log must name the checked commit and show the final runner exit line.

## Progress

- The worktree is clean at the base. The branch is correct.
- Read the final-merge spec note and pre-check section 3 before the first merge.

### Step 1: submit-prep

- Merge source: f4571b9d. Keep the privacy, consent, server limits and host changes.
- The review seed makes two active games. P2 adds one game before P3. Both P3 copies must count all three games, with two on the player's turn.
- Keep the current fullscreen P1 text. The ticket 15 patch follows this merge.
- Resolve 20 file conflicts. The merge message lists each file and its result.
- Keep the state store, command queue and one poll. Add the online choices and block notice to those paths.
- Keep the second-origin test host. Port the held-call counts and connect refusal to each widget.
- Keep the current hall, turn draft, end card, sound and motion. Keep the new privacy and block controls.
- The type check passes after the code merge. Full checks follow all merges.

- Apply ticket 15 after-merge changes to P2, row 49, the skill and copy checks. Keep the approved fullscreen P1 words in both copies. Check the P3 count after P2, as the packet order requires.

### Steps 2 to 6

- Coin back: merge 9140d761 without conflicts.
- W7: pick 08f11be8, d24b5517, e77985dc, f0795e4a, f33ab769, cec8d381, 496dc7f0, 0dd4277e and 4b293393 with source links. These are only the w7-05 and w7-06 build, fix and evidence commits.
- W7 conflicts: keep startKey and UNFINISHED in the fixture import. Keep ticket 15 packet words and checks where the packet build repeats them. Keep the corrected test comment from 0dd4277e.
- acct-words d27659fd is already an ancestor through submit-prep. Its website delete-account words are present. No extra merge is needed.
- check-flakes: the 25-b-fix.done file exists with exit 0. Merge its head f29ed7a5. Keep the current hall tests and the new boot hold release in the two conflicts.
- Skip od-picks: 26-board-build is the latest brief; its completion file is absent.
- Skip od-faults: the last logic build ends with exit 1. No last-fix completion file is present. The lane has no complete build to merge.
- Keep od-qa1, od-end, od-home and the later owner-decisions work out, as ticket 29 requires.

### Merge check fixes

- First full suite: 180 files pass; 6 files fail, with 36 failed cases. Log: tests-merge-1.txt in the release lane.
- Port the 31 race failures to frame reads on the second origin. Keep their held-call and late-reply checks. Remove the older duplicate race cases from plugin-journeys; plugin-races holds the current cases.
- Add the rate-limit method to the next-game server test stub. The live service already has it.
- Use the current hall controls in the focus and slow-start tests. Keep the slow-start cancel guard from submit-prep: Back before Create sends no Create.
- Wait for the keyboard send to reach the host before counting it. Keep the focus check.
- The offline check now expects the current state contract: Not current and Try again after three failed polls. A good read clears both.
- The type check passes. No test or check time limit changes.

- Second full suite: 184 files pass; 2 fail. All race, server, keyboard and offline fixes pass. The two failures still target removed controls.
- The slow-start test now leaves the hall through Profile. The focus test opens Resign through Menu and checks focus returns to Menu. Keep all 14 focus cases.

### Test evidence and final gate

- Third full suite passes at dfd703d0: 186 test files pass. The log is tests-merge-3.txt in the release lane. The command also passes the 50 drawing tests.
- Port the desktop coin animation wait to the frame. The coin lane adds that wait after the host moves to a second origin.
- The final gate runs again after this check-only change: npx tsc --noEmit, npm test, plugin-ui and plugin-ui-http.
- The final report, checked head and full logs are in the release scratchpad lane. The required report file is 29-merge-build.md. No taste choice is needed; keep the approved text, layout and actions.

### Browser check fixes

- Final full suite at 054b3780 passes: 186 files, 2,994 tests, 1 expected failure and 8 skipped cases. The 50 drawing tests also pass.
- The first browser run fails both checks. The fixture check derives Morph P from the internal code, but the approved shared name is Morph. Use cardName(), as the board does. The existing board test checks the coin, sheet and armed-line names.
- The HTTP coin check uses locator.evaluateAll() on coins that a strip redraw can remove. Use the stable game-table root and find the coins in the measure call, as the ticket 22 face check does. Keep the size, shape and background checks. The existing redraw test holds the same root and proves that removed elements measure zero.
- Keep the approved runner as the browser feedback loop. The house rule permits no other browser check route. No check time limit changes.

- The next browser run is diagnostic only: its header names the prior commit. The shared card name now passes. The card-read assertion reaches the visible sheet before the host receives its saved state; wait for that same saved sheet before the unchanged comparison.
- The phone coin assertion still fails with a stable root. Add the measured sizes, radii, background flags and motion states to its failure message. This separates CSS faults from motion at the read.

- At 3e43318f, plugin-ui passes in 174.6 s. The HTTP measurement proves all ten coins are round and 44 by 44, with no running motion. Six disabled coins lose their radial background. The generic disabled-button selector wins over the base coin selector.
- Fix the shared selector to exclude coins. Keep the default pointer on a disabled coin. Add a board test that disables the coin buttons and checks their round radial faces and pointer.
- The browser run is the observed failing control. The new unit test queues behind other lanes for the shared test lock, so its first run checks the fixed CSS. Do not claim a separate failed unit run.

- The first coin-selector fix raises the generic disabled rule's specificity. Both browser checks catch its effect on disabled king pictures. Use :not(:where(.coin)) to keep the generic rule's original specificity. This is the same exclusion pattern as the app controls. Keep the existing king-picture assertion.

- At 568a9f42, plugin-ui-http passes in 199.1 s. The fixture check finds end-table content 402 px wide inside a 400 px table. Add child bounds to the same assertion to identify the source. Keep the 1 px tolerance.

### Part 29-merge-review: plan and checks

1. Check each review finding against the current code. Test the review seed, P2 setup, one submitted turn, the computer reply and the P3 text on the local test database.
2. Test a chat result that clears the game behind the home card. Check an explicit Profile route and a result with no route. Clear any game return screen when its view clears. Keep valid routes.
3. Run `npm test` with the local test database. Commit the fixes and tests. Run `plugin-ui` and `plugin-ui-http` through the required check runner at that commit.
4. Record the findings, reasons, checked head and check results here. Write the complete answer to `29-merge-review-fix.md` in the release scratchpad lane.

The checks pass only when the unit suite ends with exit 0 and each browser log has its final runner exit line. Do not change any time limit.

#### Findings

- Review A, finding 1: confirmed. P3 runs after P2. Both packet copies now say `3 active games; your turn in 2.` The copy test checks that count. The database test runs the seed, P1, P2 setup, one submitted turn and the computer reply before it checks P3.
- Review B, finding 1: the stale return screen is a fault for a chat result with no view and no route, such as `kingdown_games`. Clear the game return screen when that view clears. Resume then reads the selected game. A result with no board ID uses Open to get its board. The app test checks the saved return screen, a fresh read and the same game ID.
- Review B's Profile example does not keep the old game return screen in this code. `navigate('profile')` replaces it. The error path also replaces it with Join. Keep both routes. The second app case checks that the explicit Profile result still opens Profile.

#### Check evidence

- The packet and seed checks pass: 14 tests and 50 drawing tests. Log: `tests-review-packet-2.txt` in the release scratchpad lane.
- The full `npm test` run passes with the local test database: 186 files; 2,998 passed tests, one expected failure and eight skipped tests. All 50 drawing tests pass. The type check passes as part of that command. Log: `tests-review-full-1.txt` in the same lane.
- The browser checks run after this commit through the required runner. Their checked head, final exit lines and results go in `29-merge-review-fix.md` in the same lane. Keep all source files fixed during that run.

### Part 29-merge-2: plan and checks

Status: in progress. Base: 3f1281d1.

1. Merge od-picks at 64805f5e with --no-ff. Check each conflict against both parents. Keep G1, G2, G3, Q3 and Q6.
2. Merge od-faults at 606584b8 with --no-ff. Keep F13, F14, F25, F26 and F32. Keep the Display check line removed.
3. Keep the release privacy text, review packet, state store, command queue, one poll and Resume route fix. Keep od-qa1 and S5 out. List each conflict and its result in the merge message.
4. Add a test for each new merge behaviour. Run npx tsc --noEmit and npm test with the local test database. Keep all time limits.
5. Commit all merge fixes. Run plugin-ui and plugin-ui-http at the final code commit through the required check runner. Record its checked head and final exit line.
6. Record the merges, conflicts and checks here. Write the full report and final answer in the release scratchpad lane.

Pass criteria: both exact lane heads are ancestors; held release changes remain; each required command exits 0; both browser checks pass at the final commit.

#### Merge 1: od-picks

- Source: 64805f5e. Use one --no-ff merge.
- src/plugin/app.css: keep the release coin image size and the G2 spent opacity of 0.85.
- src/plugin/screens/board.ts: keep the release block notice and G1 keyboard scroll stop. Keep the state store, command queue and one poll.
- tools/plugin-board.test.ts: keep both imports and both test groups. Add a test for the block notice with the armed scroll stop.
- Keep G1 target words, G3 shove and swap previews, Q3 board size with page scroll, and Q6 word wrapping and margins. Keep the release privacy text, packet and Resume route fix.

#### Merge 2: od-faults

- Source: 606584b8. Use one --no-ff merge.
- src/plugin/app.css: keep release coin image size, G2 opacity 0.85, and F25 font tokens. Add a combined coin test.
- src/plugin/index.html: keep all three release online privacy choices. Remove only the Display check element, as F26 requires. Add a test for the choices and the removed long-press output.
- Keep F13 art decode before board display, F14 stable end-card board bounds, F25 font tokens, F26 debug removal and F32 idle drawing stop. The source tests stay in place.
- The source logic completion file has exit 1. The owner directs this merge and identifies the 197 px sideways-read failure as the race fixed at 3f1281d1. Keep that release fix and run both final browser checks.
