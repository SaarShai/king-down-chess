# 34 Merge 4

Status: claimed
Branch: claude/release-candidate
Base: 4692477c

## Plan and checks

1. Merge 38342ac1, a761dd3e, 6777221e and bdaaa50d, in that order. Use merge commits. Record each conflict and how both inputs remain in use.
2. Keep the S5 store, command queue, job gate and single poll. Keep the release changes on those paths. Keep the held-Choose test in plugin-races with the single-read wait.
3. Add M1 source order and control tests. Check M2 page width during the win text motion at 360 x 640 and 400 x 800. Clip at the end card if needed, with the full words in view. Check M3 on Board and Play. Keep the B3 last board, with actions off and Try again.
4. Run npx tsc --noEmit and npm test with the local test database. Commit before the approved browser runner. Run plugin-ui on the M1, plugin-ui-http on this Mac, and WebKit plugin-ui on this Mac.
5. Get read-only reviews of the merged head. Review the merge choices, the S5 recheck fixes from 4e8c1be7 through 38342ac1, and M1 to M3. Use a scratch archive for probes. Fix each confirmed fault and run the checks needed for the fix.
6. Record the head, changes, conflicts, tests, reviews, omissions and taste choices. Write the full report to the required merge-4-build.md file.

Each command must end with exit 0. Each browser log must name the head and show the final runner exit line. Keep all time limits. Do not merge tickets 32 or 33. Do not edit their paths.

## Progress

- The worktree is clean at 4692477c. The branch is correct.
- B3 is option b: keep the last board, mark it Not current, turn moves and actions off, and show Try again.

### Merge 1: owner-decisions

- Source: 38342ac1. Three files conflict.
- app.ts: keep state.pending, the queue, job gate and start continuation. Keep the block notice and the return-screen clear. Read rules through the S5 transport. Gate the block reply before it changes the page. Keep rematch_allowed in equal-revision polls.
- board.ts: Undo clears the held preview and saves the draft. Keep the armed rule text, held preview, block notice and source focus rules. Keep the S5 refused-turn line and its draw-offer note. Hide All rules for an empty board. Restore the saved draft before the move list is built.
- setup.ts: keep the S5 start origin, saved king and continuation. Keep the leave guard and remove its listeners on exit. Do not render after teardown.
- client.ts merges without a conflict. It uses the S5 receipt with no wall-clock retry test.
- The new app unit fixture uses the current online visibility field and the click listener stub.

### Merge 2: webkit-rc

- Source: a761dd3e. tools/plugin-ui-check.mjs conflicts.
- Keep the data-toppling wait and the check that its words are gone. Keep the release zoom checks and the 400 px end-word restart. Remove the second animation wait.
- The board tests keep the WebKit focus checks and the corrected win-sequence wait.

### Merge 3: od-q10

- Source: 6777221e. No file conflict.
- Keep the inline recent moves, its phone fit and sheet path. M1 follows this merge and corrects its source order.
