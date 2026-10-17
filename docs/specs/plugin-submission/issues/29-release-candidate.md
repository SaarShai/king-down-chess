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
- The review seed makes two active games. Both P3 copies now say 2.
- Keep the current fullscreen P1 text. The ticket 15 patch follows this merge.
- Resolve 20 file conflicts. The merge message lists each file and its result.
- Keep the state store, command queue and one poll. Add the online choices and block notice to those paths.
- Keep the second-origin test host. Port the held-call counts and connect refusal to each widget.
- Keep the current hall, turn draft, end card, sound and motion. Keep the new privacy and block controls.
- The type check passes after the code merge. Full checks follow all merges.

- Apply ticket 15 after-merge changes to P2, row 49, the skill and copy checks. Keep the approved fullscreen P1 words in both copies. Add a check for the two-game P3 count.

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
