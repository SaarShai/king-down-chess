# 29 Release candidate

Status: in-progress
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
